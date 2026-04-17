import React from 'react';
import { MIEDropzone } from '../widgets/MIEDropzone';
import { IndraIcon } from '../../../utilities/IndraIcons';

export const MIEMainWorkspace = ({ mieState, transportState }) => {

    // Si el proceso de MIE aún no inicia pero hay trabajos encolados (Origen Físico Escaneado)
    const canStartManual = mieState.jobs.length > 0 && !mieState.isProcessing && transportState.sourceHandle && mieState.results.length === 0;

    return (
        <div className="mode-panel fill center stack--loose" style={{ padding: '0 20px', width: '100%' }}>
            
            {/* NOTIFICAR LOGS DE ACCESO O ALERTAS */}
            {transportState.transportLog && (
                <div className="util-label status-glow" style={{ marginBottom: '20px' }}>
                    {transportState.transportLog}
                </div>
            )}

            {/* SI NO HAY NADA PENDIENTE, ENSEÑAMOS LA ZONA DE DROP CLÁSICA */}
            {!canStartManual && !mieState.isProcessing && !transportState.isTransporting && mieState.results.length === 0 && (
                <MIEDropzone 
                    onFiles={mieState.addFiles} 
                    isProcessing={false}
                    globalProgress={0}
                />
            )}

            {/* SI SE MAPEÓ UNA CARPETA LOCAL, MUESTRA BOTÓN GIGANTE PARA INICIAR */}
            {canStartManual && (
                <div className="glass-card stack--loose center" style={{ padding: '60px', width: '80%', maxWidth: '800px', cursor: 'pointer', border: '1px solid var(--color-accent)' }} onClick={mieState.startProcessing}>
                    <IndraIcon name="PLAY" size="48px" color="var(--color-accent)" />
                    <h2 className="font-syncopate" style={{ fontSize: '24px', letterSpacing: '0.1em' }}>INICIAR M.I.E ENGINE</h2>
                    <p className="util-hint" style={{ opacity: 0.6 }}>{transportState.sourceFileHandles.size} Átomos listos para transcodificación física.</p>
                </div>
            )}

            {/* SIEMPRE MUESTRA PROGRESO SI ESTÁ TRABAJANDO */}
            {(mieState.isProcessing || transportState.isTransporting) && (
                <div className="stack--loose center" style={{ width: '80%', maxWidth: '800px' }}>
                    <div className="dropzone-vibrance" style={{ 
                        position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
                        background: `radial-gradient(circle, var(--color-accent) 0%, transparent 60%)`,
                        animation: 'spin 3s linear infinite', opacity: 0.1
                    }} />
                    
                    <h2 className="font-syncopate" style={{ fontSize: '24px', letterSpacing: '0.1em', animation: 'tdock-pulse 2s infinite', zIndex: 2 }}>
                        {mieState.isProcessing ? 'TRANSCODIFICANDO MATERIA...' : 'RUTEANDO AL DESTINO...'}
                    </h2>
                    
                    <div className="progress-track" style={{ width: '100%', height: '4px', background: 'var(--color-border)', borderRadius: '10px', overflow: 'hidden', zIndex: 2 }}>
                        <div className="progress-fill" style={{ width: `${mieState.globalProgress * 100}%`, height: '100%', background: 'var(--color-accent)', transition: 'all 0.3s ease' }} />
                    </div>
                    <span className="font-outfit" style={{ fontSize: '11px', fontWeight: 900, color: 'var(--color-accent)', zIndex: 2 }}>
                        {(mieState.globalProgress * 100).toFixed(1)}%
                    </span>
                </div>
            )}

            {/* DESCARGA ZIP (FALLBACK CLÁSICO SI TERMINÓ Y NO EMPAQUETÓ FÍSICA O REMOTAMENTE) */}
            {mieState.results.length > 0 && !mieState.isProcessing && !transportState.isTransporting && !transportState.destHandle && !transportState.remoteDestination && (
                <div className="download-area stack--tight center" style={{ marginTop: '20px' }}>
                    <p className="util-label" style={{ fontSize: '10px', opacity: 0.5 }}>PROCESAMIENTO FINALIZADO</p>
                    <button 
                        className="btn btn--primary" 
                        onClick={transportState.downloadAsZip}
                        disabled={transportState.isTransporting}
                        style={{ height: '50px', padding: '0 40px', borderRadius: '50px' }}
                    >
                        <IndraIcon name="DOWNLOAD" size="16px" style={{ marginRight: '12px' }} />
                        <span className="font-outfit" style={{ fontWeight: 900 }}>DESCARGAR PAQUETE (.ZIP)</span>
                    </button>
                    <button className="btn btn--mini btn--ghost" onClick={mieState.clearQueue}>LIMPIAR MESA DE TRABAJO</button>
                </div>
            )}
        </div>
    );
};
