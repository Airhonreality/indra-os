import { VideoEngine } from '../../../../services/video_core/engine.js';
import { useState, useEffect, useRef } from 'react';

/**
 * Hook para conectar el motor agnóstico de Video a los componentes React.
 */
export function useVideoEngine(projectData) {
    const engineRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [duration, setDuration] = useState(0);
    
    // Inicialización Sincera: Asegurar que el proyecto tenga estructura desde el inicio
    const [project, setProject] = useState(() => {
        if (projectData && projectData.timeline) return projectData;
        return { settings: { duration_ms: 0, fps: 30 }, timeline: { lanes: [] } };
    });

    useEffect(() => {
        // Ejecutado en mount (y en unmount de Strict Mode)
        console.log("[useVideoEngine] Inicializando motor de video");
        const engine = new VideoEngine();
        engineRef.current = engine;

        engine.setCallbacks({
            onTimeUpdate: (ms) => {
                if (engine.externalTimeCallback) {
                    engine.externalTimeCallback(ms);
                } else {
                    setCurrentTime(ms); 
                }
            },
            onStateChange: (state) => {
                setIsPlaying(state.isPlaying);
                setIsReady(state.isReady);
                if (state.duration !== undefined) setDuration(state.duration);
                if (state.project && state.project.timeline) {
                    setProject({ ...state.project }); 
                }
            }
        });

        // LEY DE SINCERIDAD: Notificar estado inicial inmediatamente
        engine._notifyStateChange();

        return () => {
            console.log("[useVideoEngine] Desmontando motor de video");
            engine.dispose();
            if (engineRef.current === engine) {
                engineRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!engineRef.current) return;
        const engine = engineRef.current;

        // LEY DE SINCERIDAD: Solo hidratar desde props si el motor está vacío 
        // o si el ID del átomo ha cambiado (Evolución de Identidad).
        const hasClips = engine.project?.timeline?.lanes?.some(l => l.clips?.length > 0);
        
        if (!hasClips) {
            const skeleton = projectData && Object.keys(projectData).length > 0
                ? projectData
                : { settings: { duration_ms: 0, fps: 30 }, timeline: { lanes: [] } };

            console.log("[useVideoEngine] Hidratando proyecto desde props.");
            engine.hydrateProject(skeleton);
        } else {
            console.log("[useVideoEngine] Manteniendo estado interno mutado (Ignorando props).");
        }
    }, [projectData]);

    const play = () => engineRef.current?.play();
    const pause = () => engineRef.current?.pause();
    const seek = (timeMs) => engineRef.current?.seek(timeMs);
    const initRenderer = (canvas) => engineRef.current?.initRenderer(canvas);

    const exportVideo = async () => {
        if (!engineRef.current || !engineRef.current.project) return;
        console.log("[useVideoEngine] Iniciando proceso de exportación...");

        return new Promise((resolve, reject) => {
            const exporter = new Worker(new URL('../../../../services/video_core/export_worker.js', import.meta.url), { type: 'module' });

            exporter.onmessage = (e) => {
                const { type, progress, resultBlob, error } = e.data;

                if (type === 'EXPORT_PROGRESS') {
                    // Aquí podríamos despachar el progreso a un estado local
                    console.log(`[ExportWorker] Progreso: ${progress}%`);
                } else if (type === 'EXPORT_COMPLETE') {
                    console.log("[ExportWorker] Exportación Exitosa.", resultBlob);
                    exporter.terminate();
                    resolve(resultBlob);
                } else if (type === 'EXPORT_ERROR') {
                    console.error("[ExportWorker] Error de exportación:", error);
                    exporter.terminate();
                    reject(new Error(error));
                }
            };

            exporter.postMessage({
                type: 'START_EXPORT',
                project: engineRef.current.project,
                settings: engineRef.current.project.settings
            });
        });
    };

    const mutateProject = (mutationFn) => {
        if (!engineRef.current) return;
        
        // SINCERIDAD: Si no hay proyecto, iniciamos con un esqueleto base v3
        const currentProject = engineRef.current.project 
            ? JSON.parse(JSON.stringify(engineRef.current.project))
            : { version: 3, settings: { duration_ms: 0, fps: 30 }, timeline: { lanes: [] } };
            
        const nextProject = mutationFn(currentProject);
        engineRef.current.hydrateProject(nextProject);
    };

    return {
        currentTime,
        isPlaying,
        isReady,
        duration,
        project,
        actions: {
            play,
            pause,
            seek,
            initRenderer,
            mutateProject,
            exportVideo,
            setExternalTimeCallback: (cb) => {
                if (engineRef.current) engineRef.current.externalTimeCallback = cb;
            },
            getOpfsManager: () => engineRef.current?.opfsManager
        }
    };
}
