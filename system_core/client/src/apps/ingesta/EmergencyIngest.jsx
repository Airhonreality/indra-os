/**
 * EmergencyIngest.jsx
 * ORIGEN: Gesto Canónico Indra v4.25.
 * RESPONSABILIDAD: Permitir el borrado manual mediante pulsación sostenida (Hold to Delete).
 * AXIOMA: Un error en la cola no debe bloquear el taller territorial.
 */

import React, { useState, useEffect, useRef } from 'react';
import { IndraIcon } from '../../components/utilities/IndraIcons';
import { peristalticQueue } from '../../services/multimedia_core/PeristalticQueue';
import { peristalticUploadService } from '../../services/multimedia_core/PeristalticUploadService';
import { MIEOrchestrator } from '../../services/multimedia_core/MIEOrchestrator';

// Componente de Borrado por Pulsación Sostenida (Indra Standard)
const LongPressTrash = ({ onConfirm, isRunning }) => {
    const [pressing, setPressing] = useState(false);
    const timerRef = useRef(null);

    const start = (e) => {
        if (isRunning) return;
        setPressing(true);
        timerRef.current = setTimeout(() => {
            onConfirm();
            setPressing(false);
        }, 800); // 800ms de compromiso
    };

    const stop = () => {
        setPressing(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    };

    return (
        <button 
            onPointerDown={start} 
            onPointerUp={stop} 
            onPointerLeave={stop}
            style={{ 
                background: 'transparent', border: 'none', padding: '10px', cursor: isRunning ? 'default' : 'pointer',
                color: pressing ? '#DC2626' : '#CCC', transition: '0.2s', transform: pressing ? 'scale(1.3)' : 'scale(1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
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
    const [isLocked, setIsLocked] = useState(false);
    
    const wakeLockRef = useRef(null);
    const videoSentinelRef = useRef(null);
    const filesVault = useRef(new Map()); 
    const orchestratorRef = useRef(new MIEOrchestrator());

    const loadQueue = async () => {
        const persisted = await peristalticQueue.getAllMetadata();
        const combined = persisted.map(p => ({
            id: p.id, name: p.name, status: p.status, progress: p.progress || 0,
            timestamp: p.metadata.timestamp, metadata: p.metadata
        }));
        setQueue(combined.sort((a,b) => b.timestamp - a.timestamp));
    };

    const startSentinel = async () => {
        try {
            if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
            if (videoSentinelRef.current) await videoSentinelRef.current.play();
            setIsLocked(true);
        } catch (e) { setIsLocked(false); }
    };

    const stopSentinel = async () => {
        if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; }
        if (videoSentinelRef.current) videoSentinelRef.current.pause();
        setIsLocked(false);
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isRunning) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        loadQueue();
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isRunning]);

    const handleFileSelection = async (e) => {
        if (!e.target.files) return;
        const incoming = Array.from(e.target.files);
        const newEntries = incoming.map(f => {
            const id = 'ram-' + Math.random().toString(36).substring(2, 12);
            filesVault.current.set(id, f);
            return {
                id, name: f.name, status: 'STAGED', progress: 0, 
                timestamp: Date.now(), metadata: { created_at: new Date(f.lastModified).toISOString().split('T')[0] }, _original: f
            };
        });
        setQueue(prev => [...newEntries, ...prev]);

        setTimeout(async () => {
            for (const entry of newEntries) {
                const f = entry._original;
                const meta = await peristalticQueue.addFile(f, { 
                    uploader: uploader.name, contact: uploader.contact,
                    created_at: entry.metadata.created_at, is_duplicate: false
                });
                filesVault.current.delete(entry.id);
                filesVault.current.set(meta.id, f);
                setQueue(prev => prev.map(q => q.id === entry.id ? { ...q, id: meta.id } : q));
            }
        }, 100);
    };

    const handleRemoveItem = async (id) => {
        if (isRunning) return;
        await peristalticQueue.removeFile(id);
        setQueue(prev => prev.filter(q => q.id !== id));
    };

    const runPipeline = async () => {
        if (!uploader.name.trim()) return alert("IDENTIDAD REQUERIDA");
        setIsRunning(true);
        await startSentinel();

        const pending = queue.filter(q => q.status === 'STAGED' || q.status === 'ERROR');
        for (const item of pending) {
            try {
                let blob = filesVault.current.get(item.id);
                if (!blob) blob = await peristalticQueue.getFileBlob(item.id);
                if (!blob) continue;

                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'PROCESSING' } : q));
                let finalBlob = blob; let finalName = item.name;
                try {
                    const result = await Promise.race([
                        (new Promise((resolve, reject) => {
                            const orc = orchestratorRef.current;
                            orc.onComplete = (r) => resolve(r[0]);
                            orc.enqueue([blob]); orc.results = []; orc.jobs.clear(); orc.queue = [];
                            orc.start();
                        })),
                        new Promise((_, r) => setTimeout(() => r(new Error("BYPASS")), 6000))
                    ]);
                    finalBlob = result.canonicalBlob; finalName = result.canonicalName;
                } catch(e) { }

                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'UPLOADING', name: finalName } : q));
                await peristalticUploadService.upload(finalBlob, finalName, uploader,
                    (p) => setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: p } : q)),
                    item.metadata?.created_at || new Date().toISOString().split('T')[0]);

                await peristalticQueue.updateStatus(item.id, 'COMPLETED');
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'COMPLETED', progress: 1 } : q));
                loadQueue();
            } catch (err) {
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'ERROR' } : q));
            }
        }
        setIsRunning(false);
        await stopSentinel();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#FFF', zIndex: 99999, overflowY: 'auto', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif', color: '#000' }}>
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>
                
                <video ref={videoSentinelRef} loop muted playsInline style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px' }}>
                    <source src="https://raw.githubusercontent.com/Anarios/return-youtube-dislike/main/assets/empty.mp4" type="video/mp4" />
                </video>

                <header style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-1px' }}>INDRA CORE</div>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: isLocked ? '#10B981' : '#AAA', letterSpacing: '1px' }}>
                        {isLocked ? '● GUARDIÁN DE LUZ ACTIVO' : '○ SISTEMA DE INGESTA VOLÁTIL'}
                    </div>
                </header>

                <div style={{ opacity: isRunning ? 0.3 : 1 }}>
                    <div style={{ background: '#F8F8F8', padding: '12px 16px', borderRadius: '15px', marginBottom: '15px', border: '1px solid #EEE' }}>
                        <input type="text" placeholder="TU NOMBRE (AUTOR)" value={uploader.name} onChange={e => {
                            setUploader({...uploader, name: e.target.value});
                            localStorage.setItem('indra_ingest_name', e.target.value);
                        }} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 800, color: '#000', outline: 'none' }} />
                    </div>

                    {!isRunning && (
                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelection} style={{ display: 'none' }} id="mx" />
                            <label htmlFor="mx" style={{ padding: '16px 30px', background: '#000', color: '#FFF', borderRadius: '12px', fontWeight: 900, fontSize: '13px', cursor: 'pointer', display: 'inline-block' }}>+ SELECCIONAR MULTIMEDIA</label>
                        </div>
                    )}
                </div>

                {queue.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
                            <div style={{ padding: '12px', background: '#000', color: '#FFF', borderRadius: '14px', textAlign: 'center' }}>
                                <div style={{ fontSize: '18px', fontWeight: 900 }}>{queue.length}</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, opacity: 0.7 }}>TOTAL COLA</div>
                            </div>
                            <div style={{ padding: '12px', background: '#E6F4EA', color: '#059669', borderRadius: '14px', textAlign: 'center' }}>
                                <div style={{ fontSize: '18px', fontWeight: 900 }}>{queue.filter(q => q.status === 'COMPLETED').length}</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, opacity: 0.7 }}>EN DRIVE</div>
                            </div>
                        </div>

                        {!isRunning && queue.some(q => q.status !== 'COMPLETED') && (
                            <button onClick={runPipeline} style={{ width: '100%', padding: '20px', background: '#10B981', color: '#FFF', borderRadius: '14px', fontWeight: 900, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 15px rgba(16, 185, 129, 0.2)' }}>INICIAR SUBIDA</button>
                        )}
                    </div>
                )}

                {isRunning && (
                    <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                         <div style={{ width: '30px', height: '30px', border: '4px solid #F3F3F3', borderTop: '4px solid #10B981', borderRadius: '50%', animation: 'spin 1.1s linear infinite', margin: '0 auto 10px' }} />
                         <div style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 900, animation: 'pulse 1.5s infinite' }}>⚠️ MANTÉN PANTALLA ENCENDIDA</div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {queue.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 15px', background: '#FFF', border: '1px solid #EEE', borderRadius: '12px', opacity: item.status === 'COMPLETED' ? 0.3 : 1 }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, color: '#666', marginTop: '2px' }}>
                                    {item.status === 'PROCESSING' && '⚙️ Normalizando...'}
                                    {item.status === 'UPLOADING' && `☁️ Enviando... ${(item.progress * 100).toFixed(0)}%`}
                                    {item.status === 'COMPLETED' && '✓ Exitoso'}
                                    {item.status === 'ERROR' && '❌ Error'}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: 900, color: '#10B981', marginRight: '10px' }}>
                                    {item.status === 'COMPLETED' ? '✓' : ''}
                                </div>
                                {item.status !== 'COMPLETED' && (
                                    <LongPressTrash onConfirm={() => handleRemoveItem(item.id)} isRunning={isRunning} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                `}</style>
            </div>
        </div>
    );
};
