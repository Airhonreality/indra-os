import React from 'react';
import { useVideoEngine } from './hooks/useVideoEngine';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useAssetIngestor } from './hooks/useAssetIngestor';
import { VInspectorSidebar } from './components/VInspectorSidebar';
import './VideoDesigner.css';

/**
 * =============================================================================
 * MACRO ENGINE: VideoDesigner
 * RESPONSABILIDAD: Interfaz UI para la edición de video.
 * Se rige por diseño Axiomático y utiliza componentes puros.
 * =============================================================================
 */

export function VideoDesigner({ atom, bridge }) {
    // 1. Instanciamos el hook que comunica con nuestro Core Vanilla JS
    const {
        currentTime,
        isPlaying,
        isReady,
        duration,
        project,
        actions
    } = useVideoEngine(atom?.payload);

    const [selectedClip, setSelectedClip] = React.useState(null);
    const [isExporting, setIsExporting] = React.useState(false);
    const { ingestLocalFile } = useAssetIngestor(actions);
    const fileInputRef = React.useRef(null);

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
                return ast;
            });
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
                atom={atom}
                onClose={() => { if (bridge?.close) bridge.close() }}
                isLive={atom?.raw?.status === 'LIVE'}
                rightSlot={
                    <>
                        <button className="btn btn--ghost btn--xs mx-2" onClick={handleUploadClick} title="Load Local Asset">
                            <IndraIcon name="PLUS" size="12px" />
                            <span style={{ marginLeft: 4 }}>IMPORT_LOCAL</span>
                        </button>
                        <button className="btn btn--ghost btn--xs mx-2" onClick={handleExport} disabled={isExporting} title="Render H264">
                            <IndraIcon name={isExporting ? "LOAD" : "PLAY"} size="12px" />
                            <span style={{ marginLeft: 4 }}>{isExporting ? 'RENDERING...' : 'EXPORT_VIDEO'}</span>
                        </button>
                        <button className="btn btn--accent btn--xs mx-2" onClick={() => bridge.save({ ...atom, payload: project || atom.payload })}>
                            <IndraIcon name="OK" size="12px" />
                            <span style={{ marginLeft: 4 }}>SAVE_PROJECT</span>
                        </button>
                    </>
                }
            />

            <div className="shelf fill" style={{ width: '100%', overflow: 'hidden' }}>
                <div className="stack fill" style={{ flex: 1, minWidth: 0 }}>
                    {/* ZONA CENTRAL: PREVISUALIZACIÓN */}
                    <div className="v-preview-monitor fill center view-zone" style={{ backgroundColor: 'var(--color-bg-deep)', position: 'relative' }}>
                        {/* 
                  EL MONITOR DE SINCERIDAD
                  Este Canvas le pertenece al RendererWorker. La UI no dibuja píxeles aquí.
                */}
                        <canvas
                            ref={(canvas) => {
                                // Pattern: Callback ref para capturar la instanciación e inicializar el Worker
                                if (canvas && !canvas.dataset.initialized) {
                                    canvas.dataset.initialized = "true";
                                    try {
                                        actions.initRenderer?.(canvas);
                                    } catch (e) {
                                        console.warn("[VideoDesigner] Error transfiriendo control del canvas", e);
                                    }
                                }
                            }}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />

                        {/* OVERLAY DE CONTROLES (HUD Flotante) */}
                        <div className="v-hud mca-surface stack--tight shelf--tight" style={{
                            position: 'absolute',
                            bottom: 'var(--space-4)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(10px)',
                            padding: 'var(--space-2)'
                        }}>
                            <button
                                onClick={isPlaying ? actions.pause : actions.play}
                                className={`btn btn--sm ${isPlaying ? 'btn--accent' : 'btn--ghost'}`}
                            >
                                {isPlaying ? 'PAUSE' : 'PLAY_SEQ'}
                            </button>
                            <span className="font-mono" style={{ color: 'var(--color-text)', fontSize: '12px' }}>
                                {(currentTime / 1000).toFixed(2)}s <span style={{ opacity: 0.5 }}>//</span> {(duration / 1000).toFixed(2)}s
                            </span>
                        </div>
                    </div>

                    {/* ZONA INFERIOR: TIMELINE */}
                    <div className="v-timeline editor-zone" style={{ height: '220px', backgroundColor: 'var(--color-bg-elevated)', borderTop: '1px solid var(--color-border)', position: 'relative' }}>
                        <div className="timeline-header shelf--tight" style={{ padding: 'var(--space-2)', borderBottom: '1px solid var(--color-border)', fontSize: '10px' }}>
                            <IndraIcon name="WORKFLOW" size="12px" style={{ color: 'var(--color-text-dim)' }} />
                            <span className="font-mono text-hint">TRACK_01 // MAIN_SEQUENCE</span>
                        </div>

                        {/* RENDER BÁSICO DE CLIPS */}
                        <div className="timeline-track" style={{ position: 'relative', height: '40px', backgroundColor: 'var(--color-bg-base)', margin: 'var(--space-2)' }}>
                            {(project || atom?.payload)?.timeline?.tracks?.[0]?.clips?.map(clip => (
                                <div
                                    key={clip.id}
                                    onClick={() => setSelectedClip(clip)}
                                    className="clip-block mca-surface"
                                    style={{
                                        position: 'absolute',
                                        height: '100%',
                                        backgroundColor: selectedClip?.id === clip.id ? 'rgba(236, 72, 153, 0.4)' : 'rgba(139, 92, 246, 0.2)', // Rosado si está seleccionado
                                        border: selectedClip?.id === clip.id ? '1px solid var(--color-primary)' : '1px solid var(--color-accent)',
                                        zIndex: selectedClip?.id === clip.id ? 2 : 1,
                                        fontSize: '9px',
                                        padding: 'var(--space-1)',
                                        cursor: 'pointer',
                                        left: `${duration > 0 ? (clip.start_at_ms / duration) * 100 : 0}%`,
                                        width: `${duration > 0 ? (clip.duration_ms / duration) * 100 : 0}%`
                                    }}
                                >
                                    <span className="font-mono" style={{ color: 'var(--color-accent)' }}>{clip.vault_id}</span>
                                </div>
                            ))}
                        </div>

                        {/* PLAYHEAD (Cabezal Rojo M.C.A) */}
                        <div
                            className="playhead"
                            style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                width: '2px',
                                backgroundColor: 'var(--color-danger)',
                                zIndex: 10,
                                pointerEvents: 'none',
                                left: `calc(var(--space-2) + ${duration > 0 ? (currentTime / duration) * 100 : 0}%)`,
                                boxShadow: '0 0 10px rgba(var(--rgb-danger), 0.5)'
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '8px',
                                height: '8px',
                                backgroundColor: 'var(--color-danger)',
                                borderRadius: '2px'
                            }} />
                        </div>
                    </div>
                    {/* FIN CONTENEDOR CENTRAL */}
                </div>

                {/* SIDEBAR PARAMÉTRICO (Derecha, como parte del shelf) */}
                <VInspectorSidebar
                    selectedClip={selectedClip}
                    mutateProject={actions.mutateProject}
                    onClose={() => setSelectedClip(null)}
                />
            </div>
        </div>
    );
}
