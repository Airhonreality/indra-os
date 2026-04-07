/**
 * EmergencyIngest.jsx
 * ORIGEN: Reset de Memoria Indra v4.23.
 * RESPONSABILIDAD: Permitir el olvido manual de historial para forzar re-subidas.
 * AXIOMA: Si el usuario borra en Drive, Indra debe olvidar en local.
 */

import React, { useState, useEffect, useRef } from 'react';
import { IndraIcon } from '../../components/utilities/IndraIcons';
import { peristalticQueue } from '../../services/multimedia_core/PeristalticQueue';
import { peristalticUploadService } from '../../services/multimedia_core/PeristalticUploadService';
import { MIEOrchestrator, getUploadHistory } from '../../services/multimedia_core/MIEOrchestrator';

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

    /**
     * 🛡️ RESET DE HISTORIA (Indra Amnesia)
     */
    const clearIndraMemory = () => {
        if (!confirm("⚠️ ¿REINICIAR MEMORIA? Indra olvidará qué archivos ha subido antes y permitirá volver a cargarlos todos.")) return;
        localStorage.removeItem('mie_upload_history'); // El key de MIEOrchestrator
        alert("✅ Memoria limpia. Selecciona tus archivos de nuevo.");
        window.location.reload();
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
        loadQueue();
        localStorage.setItem('indra_ingest_name', uploader.name);
        localStorage.setItem('indra_ingest_contact', uploader.contact);
    }, [uploader]);

    const handleFileSelection = async (e) => {
        if (!e.target.files) return;
        const incoming = Array.from(e.target.files);
        const history = getUploadHistory();

        const newEntries = incoming.map(f => {
            const fingerprint = `${f.name}-${f.size}-${f.lastModified}`;
            const isDup = history.includes(fingerprint);
            
            const id = 'ram-' + Math.random().toString(36).substring(2, 12);
            filesVault.current.set(id, f);
            return {
                id, name: f.name, status: isDup ? 'COMPLETED' : 'STAGED', progress: isDup ? 1 : 0, 
                timestamp: Date.now(), metadata: { created_at: new Date(f.lastModified).toISOString().split('T')[0] }, _original: f
            };
        });
        setQueue(prev => [...newEntries, ...prev]);

        setTimeout(async () => {
            for (const entry of newEntries) {
                const f = entry._original;
                const historyInLoop = getUploadHistory();
                const isDup = historyInLoop.includes(`${f.name}-${f.size}-${f.lastModified}`);

                const meta = await peristalticQueue.addFile(f, { 
                    uploader: uploader.name, contact: uploader.contact,
                    created_at: entry.metadata.created_at, is_duplicate: isDup
                });
                filesVault.current.delete(entry.id);
                filesVault.current.set(meta.id, f);
                setQueue(prev => prev.map(q => q.id === entry.id ? { ...q, id: meta.id } : q));
            }
        }, 100);
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
                        new Promise((_, r) => setTimeout(() => r(new Error("BYPASS")), 8000))
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

                <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-1px' }}>INDRA CORE</div>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: isLocked ? '#10B981' : '#AAA', letterSpacing: '1px' }}>
                        {isLocked ? '● GUARDIÁN DE LUZ ACTIVO' : '○ SISTEMA DE INGESTA VOLÁTIL'}
                    </div>
                </header>

                <div style={{ opacity: isRunning ? 0.3 : 1 }}>
                    <div style={{ background: '#F8F8F8', padding: '15px', borderRadius: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                        <input type="text" placeholder="AUTOR" value={uploader.name} onChange={e => setUploader({...uploader, name: e.target.value})} style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 800, color: '#000', outline: 'none' }} />
                        
                        {/* BOTÓN RESET MEMORIA (Capa de Soberanía) */}
                        <button onClick={clearIndraMemory} style={{ padding: '8px', background: '#FFF', border: '1px solid #EEE', borderRadius: '8px', cursor: 'pointer', fontSize: '10px', fontWeight: 900 }}>RESET MEM</button>
                    </div>

                    {!isRunning && (
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelection} style={{ display: 'none' }} id="mx" />
                            <label htmlFor="mx" style={{ padding: '18px 40px', background: '#000', color: '#FFF', borderRadius: '15px', fontWeight: 900, fontSize: '12px', cursor: 'pointer', display: 'inline-block' }}>+ SELECCIONAR MULTIMEDIA</label>
                        </div>
                    )}
                </div>

                {queue.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
                            <div style={{ padding: '15px', background: '#000', color: '#FFF', borderRadius: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 900 }}>{queue.length}</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, opacity: 0.7 }}>SELECCIONADOS</div>
                            </div>
                            <div style={{ padding: '15px', background: '#E6F4EA', color: '#059669', borderRadius: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '20px', fontWeight: 900 }}>{queue.filter(q => q.status === 'COMPLETED').length}</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, opacity: 0.7 }}>EN DRIVE</div>
                            </div>
                        </div>

                        {!isRunning && queue.some(q => q.status !== 'COMPLETED') && (
                            <button onClick={runPipeline} style={{ width: '100%', padding: '22px', background: '#10B981', color: '#FFF', borderRadius: '18px', fontWeight: 900, fontSize: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 15px rgba(16, 185, 129, 0.2)' }}>INICIAR SUBIDA</button>
                        )}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {queue.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', background: '#FFF', border: '1px solid #EEE', borderRadius: '12px', opacity: item.status === 'COMPLETED' ? 0.3 : 1 }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                <div style={{ fontSize: '8px', fontWeight: 800, color: '#666', marginTop: '2px' }}>
                                    {item.status === 'PROCESSING' && '⚙️ Normalizando...'}
                                    {item.status === 'UPLOADING' && `☁️ Transmitiendo... ${(item.progress * 100).toFixed(0)}%`}
                                    {item.status === 'COMPLETED' && '✓ Completado'}
                                    {item.status === 'ERROR' && '❌ Error'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        </div>
    );
};
