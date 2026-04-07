/**
 * EmergencyIngest.jsx
 * ORIGEN: Flujo Secuencial Inducido v4.19.
 * RESPONSABILIDAD: Eliminar la confusión de botones eliminando ruido innecesario.
 * AXIOMA: Un solo camino a la vez. Seleccionar -> Confirmar -> Transmitir.
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
    const [isPreparing, setIsPreparing] = useState(false);
    const [statusText, setStatusText] = useState('ESPERANDO ACCIÓN');

    const filesVault = useRef(new Map());
    const orchestratorRef = useRef(new MIEOrchestrator());

    const loadQueue = async () => {
        const persisted = await peristalticQueue.getAllMetadata();
        const combined = persisted.map(p => ({
            id: p.id,
            name: p.name,
            status: p.status,
            progress: p.progress || 0,
            timestamp: p.metadata.timestamp,
            metadata: p.metadata
        }));
        setQueue(combined.sort((a, b) => b.timestamp - a.timestamp));
    };

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isRunning) { e.preventDefault(); e.returnValue = ''; }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isRunning]);

    useEffect(() => {
        loadQueue();
        localStorage.setItem('indra_ingest_name', uploader.name);
        localStorage.setItem('indra_ingest_contact', uploader.contact);
    }, [uploader]);

    const handleFileSelection = async (e) => {
        if (!e.target.files) return;
        setIsPreparing(true);
        const incoming = Array.from(e.target.files);
        setStatusText(`ANALIZANDO ${incoming.length} ARCHIVOS...`);

        const newEntries = incoming.map(f => {
            const id = 'ram-' + Math.random().toString(36).substring(2, 12);
            const dateStr = new Date(f.lastModified).toISOString().split('T')[0];
            filesVault.current.set(id, f);
            return {
                id, name: f.name, status: 'STAGED', progress: 0,
                timestamp: Date.now(), metadata: { created_at: dateStr }, _original: f
            };
        });

        setQueue(prev => [...newEntries, ...prev]);
        setStatusText('TODO LISTO');

        setTimeout(async () => {
            for (const entry of newEntries) {
                const f = entry._original;
                const meta = await peristalticQueue.addFile(f, {
                    uploader: uploader.name, contact: uploader.contact,
                    created_at: entry.metadata.created_at, is_duplicate: getUploadHistory().includes(`${f.name}-${f.size}-${f.lastModified}`)
                });
                filesVault.current.delete(entry.id);
                filesVault.current.set(meta.id, f);
                setQueue(prev => prev.map(q => q.id === entry.id ? { ...q, id: meta.id } : q));
            }
            setIsPreparing(false);
        }, 100);
    };

    const runPipeline = async () => {
        if (!uploader.name.trim()) return alert("Dinos quien eres.");
        setIsRunning(true);
        const pending = queue.filter(q => q.status === 'STAGED' || q.status === 'ERROR');

        for (const item of pending) {
            try {
                let blob = filesVault.current.get(item.id);
                if (!blob) blob = await peristalticQueue.getFileBlob(item.id);
                if (!blob) continue;

                let finalBlob = blob; let finalName = item.name;
                try {
                    const result = await Promise.race([
                        (new Promise((resolve, reject) => {
                            const orc = orchestratorRef.current;
                            orc.onComplete = (r) => resolve(r[0]);
                            orc.enqueue([blob]);
                            orc.results = []; orc.jobs.clear(); orc.queue = [];
                            orc.start();
                        })),
                        new Promise((_, r) => setTimeout(() => r(new Error("SKIP")), 6000))
                    ]);
                    finalBlob = result.canonicalBlob; finalName = result.canonicalName;
                } catch (e) { }

                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'UPLOADING' } : q));
                await peristalticUploadService.upload(finalBlob, finalName, uploader,
                    (p) => setQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: p } : q)),
                    item.metadata?.created_at || new Date().toISOString().split('T')[0]);

                await peristalticQueue.updateStatus(item.id, 'COMPLETED');
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'COMPLETED', progress: 1 } : q));
            } catch (err) {
                setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'ERROR' } : q));
            }
        }
        setIsRunning(false);
        setStatusText('SESIÓN FINALIZADA');
    };

    const hasFiles = queue.length > 0;
    const pendingCount = queue.filter(q => q.status !== 'COMPLETED').length;

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#FFF', zIndex: 99999, overflowY: 'auto', padding: '25px', fontFamily: 'Inter, system-ui, sans-serif', color: '#000' }}>
            <div style={{ maxWidth: '420px', margin: '0 auto' }}>

                <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-1px' }}>INDRA CORE</div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#999' }}>SISTEMA DE INGESTA TERRITORIAL</div>
                </header>

                <div style={{ opacity: isRunning ? 0.3 : 1, transition: '0.3s' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                        <input type="text" placeholder="TU NOMBRE" value={uploader.name} onChange={e => setUploader({ ...uploader, name: e.target.value })} style={{ padding: '16px', background: '#F5F5F5', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 800 }} />
                        <input type="text" placeholder="CORREO / TELÉFONO" value={uploader.contact} onChange={e => setUploader({ ...uploader, contact: e.target.value })} style={{ padding: '16px', background: '#F5F5F5', border: 'none', borderRadius: '14px', fontSize: '14px', fontWeight: 800 }} />
                    </div>

                    {!hasFiles ? (
                        <div style={{ textAlign: 'center', border: '3px dashed #EEE', padding: '40px 20px', borderRadius: '20px', marginBottom: '30px' }}>
                            <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelection} style={{ display: 'none' }} id="mx" />
                            <label htmlFor="mx" style={{ padding: '18px 40px', background: '#000', color: '#FFF', borderRadius: '15px', fontWeight: 900, fontSize: '14px', cursor: 'pointer', display: 'inline-block' }}>
                                + COMENZAR SELECCIÓN
                            </label>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelection} style={{ display: 'none' }} id="mx-add" />
                            <label htmlFor="mx-add" style={{ color: '#000', fontWeight: 800, fontSize: '12px', opacity: 0.5, cursor: 'pointer' }}>+ AÑADIR MÁS ARCHIVOS</label>
                        </div>
                    )}
                </div>

                {hasFiles && (
                    <div style={{ marginBottom: '40px', animation: 'fadeIn 0.5s' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ padding: '15px', background: '#000', color: '#FFF', borderRadius: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '22px', fontWeight: 900 }}>{queue.length}</div>
                                <div style={{ fontSize: '9px', fontWeight: 800, opacity: 0.7 }}>TOTAL EN COLA</div>
                            </div>
                            <div style={{ padding: '15px', background: '#E6F4EA', color: '#059669', borderRadius: '16px', textAlign: 'center' }}>
                                <div style={{ fontSize: '22px', fontWeight: 900 }}>{queue.filter(q => q.status === 'COMPLETED').length}</div>
                                <div style={{ fontSize: '9px', fontWeight: 800, opacity: 0.7 }}>YA EN DRIVE</div>
                            </div>
                        </div>

                        {!isRunning && pendingCount > 0 && (
                            <button onClick={runPipeline} style={{ width: '100%', padding: '22px', background: '#10B981', color: '#FFF', borderRadius: '18px', fontWeight: 900, fontSize: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)' }}>
                                INICIAR SUBIDA AHORA
                            </button>
                        )}
                    </div>
                )}

                {isRunning && (
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{ width: '40px', height: '40px', border: '4px solid #F3F3F3', borderTop: '4px solid #10B981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 15px' }} />
                        <div style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '1px' }}>TRANSMITIENDO A DRIVE...</div>
                        <div style={{ fontSize: '10px', color: '#B91C1C', fontWeight: 800, marginTop: '8px' }}>⚠️ NO CIERRES ESTA PESTAÑA</div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {queue.map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: '#FFF', border: '1px solid #EEE', borderRadius: '14px', opacity: item.status === 'COMPLETED' ? 0.3 : 1 }}>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                {item.status === 'UPLOADING' && <div style={{ width: '100%', height: '3px', background: '#EEE', marginTop: '6px', borderRadius: '10px', overflow: 'hidden' }}><div style={{ width: `${item.progress * 100}%`, height: '100%', background: '#10B981' }} /></div>}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: 900, color: '#10B981', marginLeft: '15px' }}>
                                {item.status === 'COMPLETED' ? '✓' : item.status === 'UPLOADING' ? `${(item.progress * 100).toFixed(0)}%` : '●'}
                            </div>
                        </div>
                    ))}
                </div>

                <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                `}</style>
            </div>
        </div>
    );
};
