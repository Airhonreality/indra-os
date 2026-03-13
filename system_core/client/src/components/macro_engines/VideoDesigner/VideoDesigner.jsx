import React from 'react';
import { useVideoEngine } from './hooks/useVideoEngine';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraEngineHood } from '../../utilities/IndraEngineHood';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useAssetIngestor } from './hooks/useAssetIngestor';
import { VInspectorSidebar } from './components/VInspectorSidebar';
import { useWorkspace } from '../../../context/WorkspaceContext';
import './VideoDesigner.css';

/**
 * =============================================================================
 * MACRO ENGINE: VideoDesigner
 * RESPONSABILIDAD: Interfaz UI para la edición de video.
 * Se rige por diseño Axiomático y utiliza componentes puros.
 * =============================================================================
 */

export function VideoDesigner({ atom, bridge }) {
    const { updatePinIdentity } = useWorkspace();
    // 1. Instanciamos el hook que comunica con nuestro Core Vanilla JS
    const {
        currentTime,
        isPlaying,
        isReady,
        duration,
        project,
        actions
    } = useVideoEngine(atom?.payload);

    // DEPURE: Ver qué está pasando con el proyecto en el renderizador
    React.useEffect(() => {
        const clipsCount = project?.timeline?.tracks?.[0]?.clips?.length || 0;
        console.log(`[VideoDesigner] Render State - Clips: ${clipsCount}, Duration: ${duration}ms`);
    }, [project, duration]);

    const [localLabel, setLocalLabel] = React.useState(atom?.handle?.label || 'UNTITLED_VIDEO');
    const lastSavedRef = React.useRef(null);

    const handleTitleChange = (newLabel) => {
        const cleanLabel = newLabel === '' ? 'UNTITLED_VIDEO' : newLabel;
        setLocalLabel(cleanLabel);
        updatePinIdentity(atom.id, atom.provider, { label: cleanLabel });
        handleManualSave(cleanLabel);
    };

    // ── GUARDADO MANUAL (Sinceridad Absoluta) ──
    const [isSaving, setIsSaving] = React.useState(false);
    
    const handleManualSave = async (overrideLabel = null) => {
        if (!project) return;
        
        setIsSaving(true);
        try {
            const labelToSave = overrideLabel !== null ? overrideLabel : localLabel;
            // Construimos el átomo sincero para guardar:
            // - payload mutado
            // - handle sincero (tomamos el actual localLabel)
            const sincereAtom = {
                ...atom,
                payload: project,
                handle: {
                    ...atom.handle,
                    label: labelToSave
                }
            };
            
            await bridge.save(sincereAtom);
            lastSavedRef.current = JSON.stringify(project);
            console.log("[VideoDesigner] Save completado sincronamente.");
        } catch (err) {
            console.error('[VideoDesigner] Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const [selectedClip, setSelectedClip] = React.useState(null);
    const [isExporting, setIsExporting] = React.useState(false);
    const { ingestLocalFile } = useAssetIngestor(actions, currentTime);
    const fileInputRef = React.useRef(null);

    // FIX AXIOMÁTICO: Referencias directas para evitar el React Thrashing (60fps render)
    const tapeRef = React.useRef(null);
    const timeDisplayRef = React.useRef(null);

    React.useEffect(() => {
        if (!actions.setExternalTimeCallback) return;
        
        actions.setExternalTimeCallback((ms) => {
            // Mutación ultra-rápida del DOM sin afectar al Virtual DOM
            if (timeDisplayRef.current) {
                const cur = (ms / 1000).toFixed(2);
                const tot = (duration / 1000).toFixed(2);
                timeDisplayRef.current.innerHTML = `${cur}s <span style="opacity:0.5">//</span> ${tot}s`;
            }
            if (tapeRef.current) {
                const zoomScale = 0.05; // 50px por Segundo
                const offsetPx = ms * zoomScale;
                // Movemos la cinta usando hardware acceleration pura (GPU)
                tapeRef.current.style.transform = `translateX(-${offsetPx}px)`;
            }
        });
    }, [actions, duration]);

    if (!isReady) {
        return (
            <div className="fill center stack text-hint font-mono">
                <div className="mini-spinner" style={{ animation: 'indra-spin 1s linear infinite', border: '2px solid var(--color-accent)', width: 24, height: 24, borderTopColor: 'transparent', borderRadius: '50%' }} />
                <br />
                <span>INDRA_VIDEO_CORE_INIT...</span>
            </div>
        );
    }

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Ingestar el File a la OPFS
        const newClip = await ingestLocalFile(file);

        if (newClip) {
            // 2. Mutar el proyecto localmente (Añadir al final del track maestro)
            actions.mutateProject((ast) => {
                if (!ast.timeline) ast.timeline = { tracks: [] };
                if (ast.timeline.tracks.length === 0) {
                    ast.timeline.tracks.push({ id: 'track_1', type: 'video', clips: [] });
                }

                const firstTrack = ast.timeline.tracks[0];
                const lastClip = firstTrack.clips[firstTrack.clips.length - 1];
                const startTime = lastClip ? (lastClip.start_at_ms + lastClip.duration_ms) : 0;

                newClip.start_at_ms = startTime;

                ast.settings = ast.settings || { duration_ms: 0 };
                ast.settings.duration_ms = Math.max(ast.settings.duration_ms, startTime + newClip.duration_ms);

                firstTrack.clips.push(newClip);
                
                // Forzar guardado automático en el átomo local para persistencia inmediata
                console.log("[VideoDesigner] Mutación de proyecto completada. Clips v1:", firstTrack.clips.length);
                return ast;
            });
            
            // Auto-seleccionar el clip recién cargado
            setSelectedClip(newClip);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const blob = await actions.exportVideo();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `INDRA_EXPORT_${Date.now()}.mp4`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export falló", e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="macro-designer fill">

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="video/mp4,video/webm"
                onChange={handleFileSelected}
            />

            {/* TOOLBAR SUPERIOR (HUD) */}
            <IndraMacroHeader
                atom={{ ...atom, handle: { ...atom.handle, label: localLabel } }}
                onClose={() => { if (bridge?.close) bridge.close() }}
                isLive={atom?.raw?.status === 'LIVE'}
                onTitleChange={handleTitleChange}
                isSaving={isSaving}
            />

            <IndraEngineHood
                leftSlot={
                    <div className="shelf--tight">
                        <button className="btn btn--ghost btn--xs" onClick={handleUploadClick} title="Load Local Asset">
                            <IndraIcon name="PLUS" size="12px" />
                            <span style={{ marginLeft: 4 }}>IMPORT_LOCAL</span>
                        </button>
                        <div className="engine-hood__divider" />
                        <button className="btn btn--ghost btn--xs" onClick={handleExport} disabled={isExporting} title="Render H264">
                            <IndraIcon name={isExporting ? "LOAD" : "PLAY"} size="12px" />
                            <span style={{ marginLeft: 4 }}>{isExporting ? 'RENDERING...' : 'EXPORT_VIDEO'}</span>
                        </button>
                    </div>
                }
                rightSlot={
                    <button className="btn btn--accent btn--xs" onClick={() => handleManualSave()}>
                        <IndraIcon name="SAVE" size="12px" />
                        <span style={{ marginLeft: 4 }}>GUARDAR</span>
                    </button>
                }
            />


            {/* ESTRUCTURA INDUSTRIAL: 3 COLUMNAS */}
            <div className="shelf fill" style={{ width: '100%', overflow: 'hidden', backgroundColor: 'var(--color-bg-base)' }}>
                
                {/* 1. COLUMNA IZQUIERDA: MIXER PANELS */}
                <div className="v-mixer-panel stack panel-dark" style={{ width: '250px', flexShrink: 0, borderRight: '1px solid var(--color-border)', zIndex: 20 }}>
                    <div className="mca-surface" style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-deep)' }}>
                        <span className="font-mono text-hint" style={{ fontSize: '10px' }}>TRACK_MIXER // AUTOMATIONS</span>
                    </div>
                    <div className="stack fill" style={{ overflowY: 'auto' }}>
                        {/* Track Header Base */}
                        <div className="track-header mca-surface align-center justify-between" style={{ height: '80px', margin: 'var(--space-2)' }}> 
                            <div className="shelf--tight mx-2 align-center">
                                <IndraIcon name="WORKFLOW" size="14px" style={{ color: 'var(--color-primary)' }} />
                                <div className="stack--tight mx-2">
                                    <span className="font-mono" style={{ fontSize: '12px' }}>V1</span>
                                    <span className="font-mono text-hint" style={{ fontSize: '10px' }}>MAIN_SEQUENCE</span>
                                </div>
                            </div>
                            <div className="shelf--tight mx-2">
                                <IndraIcon name="EDIT" size="10px" style={{ opacity: 0.5 }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. COLUMNA CENTRAL: TAPE AND MONITOR */}
                <div className="v-theater stack fill" style={{ position: 'relative', overflow: 'hidden', minWidth: 0 }}>
                    
                    {/* ELEMENTO COLAPSO: MONITOR */}
                    <div className="v-monitor-collapse center" style={{ height: '40%', minHeight: '200px', backgroundColor: '#000', borderBottom: '1px solid var(--color-border)', position: 'relative' }}>
                        <canvas
                            ref={(canvas) => {
                                if (canvas && !canvas.dataset.initialized) {
                                    canvas.dataset.initialized = "true";
                                    try {
                                        actions.initRenderer?.(canvas);
                                    } catch (e) {
                                        console.warn("[VideoDesigner] Error transfiriendo canvas", e);
                                    }
                                }
                            }}
                            style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        
                        {/* HUD CENTRAL */}
                        <div className="v-hud mca-surface stack--tight shelf--tight" style={{
                            position: 'absolute',
                            bottom: 'var(--space-4)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(10px)',
                            padding: 'var(--space-2)',
                            zIndex: 10
                        }}>
                            <button
                                onClick={isPlaying ? actions.pause : actions.play}
                                className={`btn btn--sm ${isPlaying ? 'btn--accent' : 'btn--ghost'}`}
                            >
                                <IndraIcon name={isPlaying ? "PAUSE" : "PLAY"} size="10px" />
                                <span style={{ marginLeft: 4 }}>{isPlaying ? 'PAUSE' : 'PLAY_SEQ'}</span>
                            </button>
                            <span className="font-mono mx-2" ref={timeDisplayRef} style={{ color: 'var(--color-text)', fontSize: '12px' }}>
                                {(currentTime / 1000).toFixed(2)}s <span style={{ opacity: 0.5 }}>//</span> {(duration / 1000).toFixed(2)}s
                            </span>
                        </div>
                    </div>
                    
                    {/* TIMELINE PARAMÉTRICA (CINTA MÓVIL) */}
                    <div className="v-kinetic-timeline fill" style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'var(--color-bg-deep)' }}>
                        
                        {/* LA AGUJA SINCERA (Fija en el 50%) */}
                        <div className="fixed-playhead" style={{
                            position: 'absolute',
                            left: '50%',
                            top: 0,
                            bottom: 0,
                            width: '1px',
                            backgroundColor: 'var(--color-danger)',
                            zIndex: 50,
                            boxShadow: '0 0 10px rgba(var(--rgb-danger), 0.8)'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '6px solid transparent',
                                borderRight: '6px solid transparent',
                                borderTop: '10px solid var(--color-danger)'
                            }}/>
                        </div>
                        
                        {/* LA CINTA DE TIEMPO MATRICIAL */}
                        {(() => {
                            const zoomScale = 0.05; // 50px por cada Segundo (50.000 ms -> 2500px)
                            const offsetPx = currentTime * zoomScale;
                            const totalWidth = Math.max(duration * zoomScale, 2000); // Mínimo buffer visual

                            return (
                                <div className="moving-tape" ref={tapeRef} style={{ 
                                    position: 'absolute',
                                    left: '50%',
                                    top: 0, 
                                    bottom: 0,
                                    width: totalWidth,
                                    // La posición inicial de React:
                                    transform: `translateX(-${offsetPx}px)`,
                                    transition: isPlaying ? 'none' : 'transform 0.1s ease-out'
                                }}>
                                    
                                    {/* Linea auxiliar central (Eje Y para curvas) */}
                                    <div className="timeline-track" style={{ 
                                        height: '80px', 
                                        position: 'absolute',
                                        top: 'var(--space-2)',
                                        left: 0,
                                        right: 0,
                                        borderTop: '1px dashed rgba(255,255,255,0.05)', 
                                        borderBottom: '1px dashed rgba(255,255,255,0.05)' 
                                    }}>
                                        
                                        {/* Lógica de renderizado sincera: usamos project como fuente única */}
                                        {project?.timeline?.tracks?.[0]?.clips?.map(clip => {
                                            const zoomScale = 0.05;
                                            const clipLeft = clip.start_at_ms * zoomScale;
                                            const clipWidth = clip.duration_ms * zoomScale;
                                            const isSelected = selectedClip?.id === clip.id;

                                            return (
                                                <div key={clip.id}
                                                     onClick={() => setSelectedClip(clip)}
                                                     className="clip-block mca-surface"
                                                     style={{
                                                         position: 'absolute',
                                                         left: clipLeft,
                                                         width: clipWidth,
                                                         height: '100%',
                                                         backgroundColor: isSelected ? 'rgba(236, 72, 153, 0.4)' : 'rgba(139, 92, 246, 0.2)',
                                                         border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-accent)',
                                                         cursor: 'pointer',
                                                         padding: 'var(--space-1)',
                                                         overflow: 'hidden'
                                                     }}>
                                                     <div className="font-mono truncate" style={{ color: 'var(--color-accent)', fontSize: '9px', fontWeight: 'bold' }}>
                                                         {clip.vault_id}
                                                     </div>
                                                     
                                                     {/* CURVA PARAMÉTRICA VIRTUAL (Industrial UI) */}
                                                     <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'var(--color-primary)', opacity: 0.5 }} />
                                                     {/* Nodos de automatización falsos para el mock */}
                                                     <div style={{ position: 'absolute', top: '48%', left: '10%', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#fff' }} />
                                                     <div style={{ position: 'absolute', top: '20%', left: '80%', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#fff' }} />
                                                     <svg style={{ position: 'absolute', top:0, left:0, width: '100%', height:'100%', opacity: 0.3 }}>
                                                         <path d="M 10 20 Q 50 -10, 80 10" stroke="#fff" fill="none" strokeWidth="1" />
                                                     </svg>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* 3. COLUMNA DERECHA: INSPECTOR Y PARÁMETROS */}
                <div className="v-aux-panel panel-dark" style={{ width: '300px', flexShrink: 0, borderLeft: '1px solid var(--color-border)', zIndex: 20 }}>
                    <VInspectorSidebar
                        selectedClip={selectedClip}
                        mutateProject={actions.mutateProject}
                        onClose={() => setSelectedClip(null)}
                    />
                </div>
            </div>
        </div>
    );
}
