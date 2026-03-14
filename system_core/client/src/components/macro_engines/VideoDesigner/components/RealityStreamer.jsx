import React from 'react';
import { CinemaStream } from './CinemaStream';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useVideoEngine } from '../hooks/useVideoEngine';

/**
 * =============================================================================
 * MÓDULO: RealityStreamer
 * DHARMA: El "Streamer Canónico" de Indra. Unifica monitor y control.
 *
 * RESPONSABILIDAD:
 *   - Proporcionar el área de visualización (Canvas WebGPU).
 *   - Proporcionar los Hoods de control de tiempo (SMPTE).
 *   - Manejar el "Modo Preview" (Vault) usando la misma infraestructura de motor.
 * =============================================================================
 */
export const RealityStreamer = ({ 
    engineActions, 
    currentTime, 
    isPlaying, 
    duration, 
    project,
    previewAsset, // { vaultId, identity }
    onClosePreview,
    onAddToTimeline
}) => {
    const [previewBlobUrl, setPreviewBlobUrl] = React.useState(null);

    // LEY DE SINCERIDAD: Para el preview rápido del Vault, usamos el video nativo del DOM
    // Es la forma más rápida y confiable de leer un Blob URL desde OPFS.
    React.useEffect(() => {
        if (!previewAsset) {
            setPreviewBlobUrl(null);
            return;
        }

        let objectUrl = null;
        const loadPreview = async () => {
            try {
                const root = await navigator.storage.getDirectory();
                const handle = await root.getFileHandle(`${previewAsset.vaultId}.mp4`, { create: false });
                const file = await handle.getFile();
                objectUrl = URL.createObjectURL(file);
                setPreviewBlobUrl(objectUrl);
            } catch (e) {
                console.error("[RealityStreamer] Fallo al cargar preview soberano:", e);
            }
        };

        loadPreview();
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [previewAsset]);

    const formatTime = (ms) => {
        if (!ms || isNaN(ms)) return '00:00:00';
        return new Date(ms).toISOString().substr(11, 8);
    };

    const humanName = previewAsset?.vaultId
        ?.replace(/^silo_[a-z]+_/, '')
        ?.replace(/^local_\d+_/, '')
        ?.replace(/[_-]/g, ' ')
        ?.toUpperCase() || 'PROJECT_REALITY';

    return (
        <div className="reality-streamer fill stack relative bg-black overflow-hidden" style={{ minHeight: 0, flex: 1 }}>
            
            {/* OVERLAY DE ESTADO: Header dinámico si estamos en preview */}
            {previewAsset && (
                <div className="absolute top-0 left-0 right-0 p-3 bg-black-dim shelf--between border-bottom" style={{ zIndex: 30, borderColor: 'var(--indra-dynamic-border)' }}>
                    <div className="shelf--tight align-center">
                        <div style={{ padding: '4px', backgroundColor: 'var(--indra-dynamic-border)', borderRadius: '4px' }}>
                            <IndraIcon name="FILE" size="16px" color="var(--indra-dynamic-accent)" />
                        </div>
                        <div className="stack--tight">
                            <span className="font-mono text-xs text-white uppercase bold" style={{ letterSpacing: '1px' }}>{humanName}</span>
                            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--indra-dynamic-accent)', opacity: 0.8 }}>MODO_PREVIEW // {previewAsset.identity?.duration_ms ? (previewAsset.identity.duration_ms / 1000).toFixed(1) + 's' : ''}</span>
                        </div>
                    </div>
                    
                    <div className="shelf--tight" style={{ gap: '12px' }}>
                        <button 
                            className="btn btn--primary shelf--tight align-center px-4" 
                            onClick={onAddToTimeline} 
                            style={{ 
                                height: '32px', 
                                border: '1px solid var(--indra-dynamic-accent)',
                                boxShadow: '0 0 15px rgba(0, 150, 255, 0.2)'
                            }}
                        >
                            <IndraIcon name="PLUS" size="12px" />
                            <span className="font-mono uppercase bold" style={{ fontSize: '10px' }}>AÑADIR_AL_PROYECTO</span>
                        </button>
                        <button 
                            className="btn btn--ghost shelf--tight align-center" 
                            onClick={onClosePreview}
                            style={{ opacity: 0.6, hoverOpacity: 1 }}
                            title="Volver al Editor (Esc)"
                        >
                            <IndraIcon name="CLOSE" size="18px" />
                            <span className="font-mono uppercase" style={{ fontSize: '10px' }}>CERRAR</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ÁREA DE REPRODUCCIÓN (Cinema o Native Video) */}
            <div className="stream-viewport fill relative bg-void center" style={{ padding: previewAsset ? '60px 40px 40px 40px' : 0 }}>
                {previewAsset ? (
                    <div className="preview-container fill center stack" style={{ 
                        maxWidth: '85%', 
                        maxHeight: '80%', 
                        position: 'relative'
                    }}>
                        {/* El marco central mediano con margen generoso */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#111',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 2px rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <video 
                                src={previewBlobUrl} 
                                controls 
                                autoPlay
                                style={{ 
                                    maxWidth: '100%', 
                                    maxHeight: '100%', 
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        
                        {/* Metadata inferior sutil */}
                        <div className="mt-3 shelf--between w-full opacity-40">
                            <span className="font-mono" style={{ fontSize: '9px' }}>IDENTIFICADOR: {previewAsset.vaultId}</span>
                            <span className="font-mono" style={{ fontSize: '9px' }}>OPFS_LOCAL_CACHE</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <CinemaStream onInitRenderer={engineActions?.initRenderer} />
                        
                        {/* EMPTY STATE: Solo si no hay clips Y no hay preview activo */}
                        {(!project?.timeline?.lanes || project.timeline.lanes.every(l => l.clips?.length === 0)) && (
                            <div className="absolute inset-0 center stack opacity-20" style={{ pointerEvents: 'none', gap: 12 }}>
                                <IndraIcon name="PLAY" size="48px" />
                                <div className="stack--tight center">
                                    <span className="font-mono" style={{ fontSize: '11px' }}>TIMELINE_VACÍA</span>
                                    <span className="font-mono" style={{ fontSize: '9px' }}>Arrastra un activo o importa uno local</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* HOOD DE CONTROL (CANÓNICO) */}
            {!previewAsset && (
                <div className="stream-controls-hood px-3 py-1 shelf--between align-center bg-black-soft border-top" style={{ borderColor: 'var(--indra-dynamic-border)', height: '42px', flexShrink: 0 }}>
                    <div className="timecode-display font-mono text-sm px-3 py-1 bg-black rounded" style={{ color: 'var(--indra-dynamic-accent)', border: '1px solid rgba(0,150,255,0.1)', minWidth:90, textAlign: 'center' }}>
                        {formatTime(currentTime)}
                    </div>

                    <div className="shelf--tight">
                        <button className="btn btn--ghost btn--sm" onClick={() => (isPlaying ? engineActions?.pause() : engineActions?.play())} style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(0,150,255,0.05)' }}>
                            <IndraIcon name={isPlaying ? "PAUSE" : "PLAY"} size="16px" color="var(--indra-dynamic-accent)" />
                        </button>
                    </div>

                    <div className="font-mono text-hint" style={{ fontSize: '10px', opacity: 0.5 }}>
                        DUR // {formatTime(duration)}
                    </div>
                </div>
            )}
        </div>
    );
};
