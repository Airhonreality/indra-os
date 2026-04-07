/**
 * EmergencyIngest.jsx
 * ORIGEN: El Blindaje Invulnerable v4.29.
 * RESPONSABILIDAD: Asegurar encendido de pantalla mediante video Base64 (Zero-Latency).
 * AXIOMA: Si el video nace del código, el WiFi no muere.
 */

import React, { useState, useEffect, useRef } from 'react';
import { IndraIcon } from '../../components/utilities/IndraIcons';
import { peristalticQueue } from '../../services/multimedia_core/PeristalticQueue';
import { peristalticUploadService } from '../../services/multimedia_core/PeristalticUploadService';
import { MIEOrchestrator } from '../../services/multimedia_core/MIEOrchestrator';
import { ingestManager } from '../../services/multimedia_core/PeristalticIngestManager';

// Video 1x1 base64 (Silencioso y de 0 bytes de ancho de banda)
const SILENT_V = "data:video/mp4;base64,AAAAHGZ0eXBpc29tAAAAAGlzb21tcDQyAAAACHZyZWQAAAAIdm9pZAAAAAhpbmV0AAAACGRhdGEAAAAIZnJlZQAAAAA=";

const SimpleTrash = ({ onConfirm, isRunning }) => {
    return (
        <button 
            onClick={() => onConfirm()} 
            style={{ 
                background: 'transparent', 
                border: 'none', 
                padding: '12px', 
                color: '#CCC', 
                cursor: 'pointer',
                zIndex: 10
            }}
        >
            <IndraIcon name="DELETE" size="14px" />
        </button>
    );
};

export const EmergencyIngest = () => {
    const [uploader, setUploader] = useState({
        name: localStorage.getItem('indra_ingest_name') || '',
        contact: localStorage.getItem('indra_ingest_contact') || ''
    });
    const [queue, setQueue] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isWakeLocked, setIsWakeLocked] = useState(false);
    
    const wakeLockRef = useRef(null);
    const videoSentinelRef = useRef(null);

    useEffect(() => {
        ingestManager.init();
        const unsubscribe = ingestManager.subscribe((state) => {
            setQueue(state.queue);
            setIsRunning(state.isRunning);
        });
        
        const handleBeforeUnload = (e) => { 
            if (ingestManager.isRunning) { e.preventDefault(); e.returnValue = ''; } 
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            unsubscribe();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleFileSelection = async (e) => {
        if (!e.target.files) return;
        await ingestManager.addFiles(Array.from(e.target.files), uploader);
    };

    const handleRemoveItem = (id) => {
        ingestManager.removeFile(id);
    };

    const runPipeline = async () => {
        if (!uploader.name.trim()) return alert("Ingresa tu nombre");
        
        // 🛡️ BLINDAJE DE PANTALLA
        try { 
            if (videoSentinelRef.current) await videoSentinelRef.current.play(); 
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
                setIsWakeLocked(true);
            }
        } catch(e){ console.warn("Blindaje parcial."); }

        await ingestManager.processQueue(uploader);

        // Liberar blindaje
        try { if (wakeLockRef.current) await wakeLockRef.current.release(); setIsWakeLocked(false); if (videoSentinelRef.current) videoSentinelRef.current.pause(); } catch(e){}
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#FFF', zIndex: 99999, overflowY: 'auto', padding: '15px', fontFamily: 'Inter, system-ui, sans-serif', color: '#000' }}>
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                <video ref={videoSentinelRef} loop muted playsInline src={SILENT_V} style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', pointerEvents: 'none' }} />

                <h1 style={{ fontSize: '18px', fontWeight: 900, textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase' }}>FORMULARIO DE SUBIDA DE CONTENIDO</h1>

                <div style={{ marginBottom: '20px' }}>
                    <input type="text" placeholder="TU NOMBRE" value={uploader.name} onChange={e => { setUploader({...uploader, name: e.target.value}); localStorage.setItem('indra_ingest_name', e.target.value); }} style={{ width: '100%', padding: '15px', background: '#F5F5F5', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 800, marginBottom: '8px', color: '#000' }} />
                </div>

                {!isRunning && (
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelection} style={{ display: 'none' }} id="mx" />
                        <label htmlFor="mx" style={{ padding: '15px 30px', background: '#000', color: '#FFF', borderRadius: '10px', fontWeight: 900, fontSize: '12px', cursor: 'pointer', display: 'inline-block' }}>+ SELECCIONAR MULTIMEDIA</label>
                    </div>
                )}

                {queue.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ padding: '12px', background: '#F5F5F5', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '18px', fontWeight: 900 }}>{queue.length}</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, color: '#999' }}>ARCHIVOS</div>
                            </div>
                            <div style={{ padding: '12px', background: '#E6F4EA', borderRadius: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: '18px', fontWeight: 900, color: '#059669' }}>{queue.filter(q => q.status === 'COMPLETED').length}</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, color: '#059669' }}>EN DRIVE</div>
                            </div>
                        </div>
                        {!isRunning && queue.some(q => q.status !== 'COMPLETED') && (
                            <button onClick={runPipeline} style={{ width: '100%', padding: '20px', background: '#10B981', color: '#FFF', borderRadius: '12px', fontWeight: 900, fontSize: '14px', border: 'none', cursor: 'pointer' }}>INICIAR SUBIDA</button>
                        )}
                    </div>
                )}

                {isRunning && (
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                         <div style={{ width: '30px', height: '30px', border: '4px solid #F3F3F3', borderTop: '4px solid #10B981', borderRadius: '50%', animation: 'spin 1.1s linear infinite', margin: '0 auto 10px' }} />
                         <div style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 900 }}>⚠️ NO CIERRES ESTA VENTANA NI APAGUES LA PANTALLA</div>
                         <div style={{ fontSize: '8px', color: '#059669', fontWeight: 900, marginTop: '5px' }}>✓ BLINDAJE DE PANTALLA ACTIVO</div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {queue.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#FFF', border: '1px solid #EEE', borderRadius: '12px', opacity: item.status === 'COMPLETED' ? 0.3 : 1 }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                
                                {item.status === 'UPLOADING' && (
                                    <div style={{ marginTop: '5px' }}>
                                        <div style={{ width: '100%', height: '4px', background: '#EEE', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${item.progress * 100}%`, height: '100%', background: '#10B981', transition: 'width 0.1s' }} />
                                        </div>
                                        <div style={{ fontSize: '9px', fontWeight: 900, color: '#10B981', marginTop: '3px' }}>Enviando... {(item.progress * 100).toFixed(0)}%</div>
                                    </div>
                                )}
                                
                                {item.status === 'PROCESSING' && <div style={{ fontSize: '9px', fontWeight: 800, color: '#666', marginTop: '4px' }}>⚙️ Preparando...</div>}
                                {item.status === 'COMPLETED' && <div style={{ fontSize: '9px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>✅ Listo</div>}
                                {item.status === 'ERROR' && (
                                    <div style={{ marginTop: '4px' }}>
                                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#B91C1C' }}>❌ Error</div>
                                        <div style={{ fontSize: '7px', fontWeight: 700, color: '#B91C1C', textTransform: 'uppercase', opacity: 0.8, marginTop: '2px' }}>
                                            {item.errorMsg || 'Falla Crítica de Datos'}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                                {item.status === 'COMPLETED' ? <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span> : <SimpleTrash onConfirm={() => handleRemoveItem(item.id)} isRunning={isRunning} />}
                            </div>
                        </div>
                    ))}
                </div>

                <style>{` @keyframes spin { to { transform: rotate(360deg); } } `}</style>
            </div>
        </div>
    );
};
