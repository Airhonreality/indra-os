/**
 * EmergencyIngest.jsx — v4.70
 * UI MINIMALISTA BLANCA: Sin marcas, lenguaje directo y HUD discreto.
 */
import React, { useState, useEffect, useRef } from 'react';
import { IndraIcon } from '../../components/utilities/IndraIcons';
import { ingestManager } from '../../services/multimedia_core/PeristalticIngestManager';
import { IngestBridge } from '../../services/IngestBridge';

const PULSE_V = "data:video/mp4;base64,AAAAHGZ0eXBpc29tAAAAAGlzb21tcDQyAAAACHZyZWQAAAAIdm9pZAAAAAhpbmV0AAAACGRhdGEAAAAIZnJlZQAAAAA="; 

const SimpleTrash = ({ onConfirm, isRunning }) => (
    <button onClick={onConfirm} disabled={isRunning} style={{ background: 'transparent', border: 'none', padding: '12px', color: '#CCC', cursor: isRunning ? 'not-allowed' : 'pointer' }}>
        <IndraIcon name="DELETE" size="14px" />
    </button>
);

export const EmergencyIngest = () => {
    const [uploader, setUploader] = useState({ 
        name: localStorage.getItem('indra_ingest_name') || '',
        target_folder_id: "1A3kVrjzYFI5r0LbeJM4PoswTvLzLQRq1" // Folder Bio-Inspiración
    });
    const [queue, setQueue] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    
    const wakeLockRef = useRef(null);
    const videoSentinelRef = useRef(null);
    const pulseIntervalRef = useRef(null);

    useEffect(() => {
        // Inicializar el Bridge en modo Satélite real (ADR-041)
        // Esto lanzará un error ruidoso si las variables globales no están presentes.
        IngestBridge.init({ 
            mode: 'SATELLITE', 
            coreUrl: window.INDRA_CORE_URL, 
            satelliteToken: window.INDRA_SATELLITE_TOKEN 
        });
        
        ingestManager.init();
        const unsubscribe = ingestManager.subscribe((state) => {
            setQueue(state.queue);
            setIsRunning(state.isRunning);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (isRunning) {
            pulseIntervalRef.current = setInterval(() => {
                if (navigator.vibrate) navigator.vibrate(40);
            }, 60000);
        } else {
            if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
        }
    }, [isRunning]);

    const handleFileSelection = async (e) => {
        if (!e.target.files) return;
        await ingestManager.addFiles(Array.from(e.target.files), uploader);
        e.target.value = '';
    };

    const runPipeline = async () => {
        if (!uploader.name.trim()) return alert("Ingresa tu nombre");
        try { 
            if (videoSentinelRef.current) {
                videoSentinelRef.current.play().catch(() => console.warn("Sentinel bloqueado por el navegador."));
            }
            if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch(e){ console.warn("Blindaje parcial."); }
        await ingestManager.processQueue(uploader);
        try { if (wakeLockRef.current) await wakeLockRef.current.release(); if (videoSentinelRef.current) videoSentinelRef.current.pause(); } catch(e){}
    };

    const handleRetryAll = async () => {
        const errorItems = queue.filter(q => q.status === 'ERROR');
        for (const item of errorItems) {
            await ingestManager.retryFile(item.id);
        }
        await ingestManager.processQueue(uploader);
    };

    const totalCount = queue.length;
    const completedCount = queue.filter(q => q.status === 'COMPLETED').length;

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#FFF', zIndex: 99999, overflowY: 'auto', padding: '15px', fontFamily: 'Inter, system-ui, sans-serif', color: '#000', colorScheme: 'light' }}>
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                
                <div style={{ position: 'fixed', top: 0, right: 0, width: '4px', height: '4px', background: isRunning ? '#F5F5F5' : 'transparent', animation: isRunning ? 'pulseLight 2s infinite' : 'none', zIndex: 100000 }} />
                <video ref={videoSentinelRef} loop muted playsInline src={PULSE_V} style={{ position: 'absolute', opacity: 0.01, width: '1px', height: '1px' }} />

                <h1 style={{ fontSize: '15px', fontWeight: 900, textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.5px' }}>SISTEMA DE INGESTA MULTIMEDIA</h1>
                <p style={{ fontSize: '9px', textAlign: 'center', color: '#666', marginBottom: '20px', fontWeight: 600, padding: '0 20px' }}>
                    Recomendamos <b>Chrome</b> o <b>Brave</b> para una mejor experiencia.
                </p>

                <input type="text" placeholder="TU NOMBRE" value={uploader.name} onChange={e => { setUploader({...uploader, name: e.target.value}); localStorage.setItem('indra_ingest_name', e.target.value); }} style={{ width: '100%', padding: '15px', background: '#F8F8F8', border: '1px solid #EEE', borderRadius: '12px', marginBottom: '15px', fontWeight: 700, textAlign: 'center', color: '#000' }} />

                {totalCount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginBottom: '15px', fontSize: '10px', fontWeight: 800, color: '#999' }}>
                        <span>TOTAL: {totalCount}</span>
                        <span style={{ color: '#059669' }}>EN NUBE: {completedCount}</span>
                        {!isRunning && (
                            <button 
                                onClick={() => { if(window.confirm('¿Borrar todo el manifiesto e iniciar una nueva sesión?')) { ingestManager.resetSession(); setUploader({name: ''}); } }} 
                                style={{ background: 'transparent', border: '1px solid #CCC', borderRadius: '4px', padding: '2px 6px', color: '#666', fontSize: '8px', cursor: 'pointer', marginLeft: 'auto' }}
                            >
                                NUEVA SESIÓN
                            </button>
                        )}
                    </div>
                )}

                {!isRunning && (
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelection} style={{ display: 'none' }} id="mx" />
                        <label htmlFor="mx" style={{ padding: '12px 24px', background: '#000', color: '#FFF', borderRadius: '30px', fontWeight: 900, fontSize: '11px', cursor: 'pointer' }}>SINCRONIZAR GALERÍA</label>
                    </div>
                )}

                {totalCount > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        {!isRunning ? (
                            queue.some(q => q.status === 'ERROR') ? (
                                <button onClick={handleRetryAll} style={{ width: '100%', padding: '18px', background: '#B91C1C', color: '#FFF', borderRadius: '12px', fontWeight: 900, border: 'none' }}>REINTENTAR FALLIDOS ({queue.filter(q => q.status === 'ERROR').length})</button>
                            ) : (
                                queue.some(q => q.status === 'STAGED') && <button onClick={runPipeline} style={{ width: '100%', padding: '18px', background: '#10B981', color: '#FFF', borderRadius: '12px', fontWeight: 900, border: 'none' }}>INICIAR SUBIDA</button>
                            )
                        ) : (
                            <div style={{ textAlign: 'center', padding: '15px', background: '#E6F4EA', borderRadius: '12px', color: '#059669' }}>
                                <div style={{ fontSize: '10px', fontWeight: 900 }}>SUBIENDO...</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, opacity: 0.7, marginTop: '2px' }}>✓ PANTALLA ACTIVA</div>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {queue.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', background: '#FFF', border: '1px solid #F0F0F0', borderRadius: '10px', opacity: item.status === 'COMPLETED' ? 0.35 : 1 }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#000' }}>{item.name}</div>
                                {item.status === 'ERROR' && item.errorMsg && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                        <div style={{ fontSize: '7.5px', color: '#666', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {item.errorMsg}
                                        </div>
                                        {item.errorMsg.includes('[I/O]') && (
                                            <label style={{ fontSize: '9px', color: '#10B981', fontWeight: 900, cursor: 'pointer', background: '#F0FFF4', padding: '2px 6px', borderRadius: '4px', border: '1px solid #10B981' }}>
                                                VINCULAR
                                                <input type="file" style={{ display: 'none' }} accept={item.type || '*/*'} onChange={e => e.target.files?.[0] && ingestManager.relinkFile(item.id, e.target.files[0])} />
                                            </label>
                                        )}
                                    </div>
                                )}
                                {['UPLOADING', 'PROCESSING'].includes(item.status) && (
                                    <div style={{ width: '100%', height: '2px', background: '#EEE', marginTop: '6px', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${(item.progress || 0) * 100}%`, height: '100%', background: '#10B981', transition: 'width 0.3s' }} />
                                    </div>
                                )}
                                {item.status === 'ERROR' && <div style={{ fontSize: '8px', color: '#B91C1C', fontWeight: 900, marginTop: '2px' }}>FALLO DE CONEXIÓN</div>}
                                {item.status === 'COMPLETED' && <div style={{ fontSize: '8px', color: '#059669', fontWeight: 900, marginTop: '2px' }}>GUARDADO</div>}
                            </div>
                            <div style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {(item.status === 'STAGED' || item.status === 'ERROR') && <SimpleTrash onConfirm={() => ingestManager.removeFile(item.id)} isRunning={isRunning} />}
                                {item.status === 'COMPLETED' && <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>}
                                {item.status === 'ERROR' && <span style={{ color: '#B91C1C', fontWeight: 900 }}>!</span>}
                            </div>
                        </div>
                    ))}
                </div>

                <style>{`
                    @keyframes pulseLight { 0% { opacity: 0.2; } 50% { opacity: 0.8; } 100% { opacity: 0.2; } }
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
};
