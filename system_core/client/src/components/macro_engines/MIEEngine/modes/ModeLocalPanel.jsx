import { useState, useEffect } from 'react';
import { MIEDropzone } from '../widgets/MIEDropzone';
import { IndraIcon } from '../../../utilities/IndraIcons';
import JSZip from 'jszip';

export const ModeLocalPanel = ({ mieState }) => {
    const [isZipping, setIsZipping] = useState(false);
    
    // File System Access States
    const [sourceHandle, setSourceHandle] = useState(null);
    const [destHandle, setDestHandle] = useState(null);
    const [sourceFileHandles, setSourceFileHandles] = useState(new Map()); // fileName -> fileHandle
    const [deleteSource, setDeleteSource] = useState(false);
    const [isTransporting, setIsTransporting] = useState(false);
    const [transportLog, setTransportLog] = useState("");

    // Detectar soporte para File System Access API
    const isFSApiSupported = 'showDirectoryPicker' in window;

    // Cuando el procesamiento global de core finaliza y tenemos handles, exportamos
    useEffect(() => {
        const canStartTransport = mieState.results.length > 0 && 
                                  !mieState.isProcessing && 
                                  destHandle && 
                                  !isTransporting &&
                                  mieState.jobs.length === mieState.results.length;

        if (canStartTransport) {
            executeAdvancedTransport();
        }
    }, [mieState.results, mieState.isProcessing, destHandle]);

    const pickSourceDirectory = async () => {
        try {
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            setSourceHandle(dirHandle);
            setTransportLog("Leyendo directorio origen...");
            
            const fileMap = new Map();
            const rawFiles = [];
            
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    // Validar si es multimedia básico para no procesar .sys o carpetas
                    if (entry.name.match(/\.(mp4|mov|avi|mkv|webm|mp3|wav|ogg|aac|m4a|jpg|jpeg|png|webp|heic|avif)$/i)) {
                        const file = await entry.getFile();
                        rawFiles.push(file);
                        fileMap.set(file.name, entry);
                    }
                }
            }
            
            setSourceFileHandles(fileMap);
            setTransportLog(`Directorio leído. ${rawFiles.length} archivos multimedia encontrados.`);
            
            if (rawFiles.length > 0) {
                // Solo encolamos las materias, no arrancamos inmediatamente si configuramos destino
                mieState.queueFiles(rawFiles);
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Error origen:', err);
        }
    };

    const pickDestDirectory = async () => {
        try {
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            setDestHandle(dirHandle);
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Error destino:', err);
        }
    };

    const startProcessingManual = () => {
        if (mieState.jobs.length === 0) return alert("La cola está vacía.");
        setTransportLog("Iniciando inyección de materia...");
        mieState.startProcessing();
    };

    const executeAdvancedTransport = async () => {
        setIsTransporting(true);
        setTransportLog("Transporte atómico iniciado...");
        
        let successCount = 0;
        
        try {
            for (const res of mieState.results) {
                // 1. Guardar archivo MIE procesado en el Destino
                setTransportLog(`Escribiendo proxy: ${res.canonicalName}`);
                const fileHandle = await destHandle.getFileHandle(res.canonicalName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(res.canonicalBlob);
                await writable.close();
                
                // 2. Opcional: Eliminar original (Solo si tenemos el sourceHandle validado y habilitado)
                if (deleteSource && sourceHandle) {
                    try {
                        const originalName = res.original_meta?.name;
                        if (originalName && sourceFileHandles.has(originalName)) {
                            // Se asume que el archivo estaba en la raíz del sourceHandle
                            await sourceHandle.removeEntry(originalName);
                        }
                    } catch (e) {
                        console.error("No se pudo purgar original", e);
                    }
                }
                
                successCount++;
            }
            
            setTransportLog(`¡Transporte Soberano Exitoso! (${successCount} procesados).`);
            setTimeout(() => {
                mieState.clearQueue();
                setTransportLog("");
            }, 3000);
            
        } catch (e) {
            console.error(e);
            setTransportLog("Falla crítica en transporte: " + e.message);
        } finally {
            setIsTransporting(false);
        }
    };

    const downloadAsZip = async () => {
        if (mieState.results.length === 0) return;
        setIsZipping(true);
        
        try {
            const zip = new JSZip();
            mieState.results.forEach(res => {
                zip.file(res.canonicalName, res.canonicalBlob);
            });
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `indra_mie_${new Date().getTime()}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (err) {
            console.error("[MIE Local] Error al crear ZIP:", err);
        } finally {
            setIsZipping(false);
        }
    };

    return (
        <div className="mode-panel fill center stack--loose" style={{ padding: '0 20px' }}>
            
            {/* HERRAMIENTAS DE TRANSPORTE SOBERANO (Conexión Directa a Discos Flash/Carpetas) */}
            {isFSApiSupported && mieState.results.length === 0 && (
                <div className="glass-card stack--loose" style={{ width: '80%', maxWidth: '800px', padding: '24px', marginBottom: '20px' }}>
                    <div className="shelf--tight" style={{ opacity: 0.6 }}>
                        <IndraIcon name="CUBE" size="14px" color="var(--color-accent)" />
                        <span className="font-syncopate" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>TRANSPORTE FÍSICO (USB / DISCO)</span>
                    </div>

                    <div className="shelf--loose" style={{ gap: '20px', flexWrap: 'wrap' }}>
                        {/* BOTÓN ORIGEN */}
                        <button 
                            className="btn btn--ghost" 
                            style={{ 
                                flex: 1, height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
                                border: sourceHandle ? '1px solid var(--color-accent)' : '1px dashed var(--color-border)',
                                background: sourceHandle ? 'var(--color-accent-dim)' : 'transparent'
                            }}
                            onClick={pickSourceDirectory}
                        >
                            <IndraIcon name="FOLDER_OPEN" size="20px" color={sourceHandle ? "var(--color-accent)" : "currentColor"} />
                            <div className="stack--tight">
                                <span className="font-outfit" style={{ fontSize: '13px', fontWeight: 600 }}>1. ORIGEN (Cámara/USB)</span>
                                <span className="util-hint" style={{ fontSize: '10px' }}>{sourceHandle ? sourceHandle.name : 'Configurar ruta de lectura'}</span>
                            </div>
                        </button>

                        {/* BOTÓN DESTINO */}
                        <button 
                            className="btn btn--ghost" 
                            style={{ 
                                flex: 1, height: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
                                border: destHandle ? '1px solid var(--color-warm)' : '1px dashed var(--color-border)',
                                background: destHandle ? 'rgba(255, 152, 0, 0.05)' : 'transparent'
                            }}
                            onClick={pickDestDirectory}
                        >
                            <IndraIcon name="FOLDER" size="20px" color={destHandle ? "var(--color-warm)" : "currentColor"} />
                            <div className="stack--tight">
                                <span className="font-outfit" style={{ fontSize: '13px', fontWeight: 600 }}>2. DESTINO (Silo Físico)</span>
                                <span className="util-hint" style={{ fontSize: '10px' }}>{destHandle ? destHandle.name : 'Carpeta de Proxies'}</span>
                            </div>
                        </button>
                    </div>

                    {/* OPCIONES DE DESTRUCCIÓN */}
                    {sourceHandle && destHandle && (
                        <div className="shelf--between" style={{ marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
                            <label className="shelf--tight" style={{ cursor: 'pointer', opacity: deleteSource ? 1 : 0.6, transition: '0.2s' }}>
                                <input 
                                    type="checkbox" 
                                    checked={deleteSource} 
                                    onChange={(e) => setDeleteSource(e.target.checked)} 
                                    style={{ accentColor: 'var(--color-danger)', width: '16px', height: '16px' }}
                                />
                                <div className="stack--tight">
                                    <span className="font-outfit" style={{ fontSize: '12px', fontWeight: 600, color: deleteSource ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>PURGAR ORIGEN (CORTE RAPIDO)</span>
                                    <span className="util-hint" style={{ fontSize: '9px' }}>Eliminar archivo crudo original tras conversión exitosa (Peligroso).</span>
                                </div>
                            </label>

                            <button 
                                className="btn btn--primary" 
                                onClick={startProcessingManual}
                                disabled={mieState.jobs.length === 0 || mieState.isProcessing}
                                style={{ padding: '0 32px' }}
                            >
                                <span className="font-syncopate" style={{ fontSize: '11px', letterSpacing: '0.1em' }}>INICIAR ({mieState.jobs.length} atómos)</span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* NOTIFICAR LOGS DE ACCESO */}
            {transportLog && (
                <div className="util-label status-glow" style={{ marginBottom: '20px' }}>
                    {transportLog}
                </div>
            )}

            {/* SI NO HAY DIRECTORIO ORIGEN, SE MUESTRA LA ZONA DE DROP CLÁSICA */}
            {!sourceHandle && mieState.results.length === 0 && (
                <MIEDropzone 
                    onFiles={mieState.addFiles} 
                    isProcessing={mieState.isProcessing}
                    globalProgress={mieState.globalProgress}
                />
            )}

            {/* BARRA DE PROGRESO DE TRANSPORTE AVANZADO */}
            {sourceHandle && (mieState.isProcessing || isTransporting) && (
                <div className="stack--loose center" style={{ width: '80%', maxWidth: '800px' }}>
                    <h2 className="font-syncopate" style={{ fontSize: '24px', letterSpacing: '0.1em', animation: 'tdock-pulse 2s infinite' }}>TRANSFIRIENDO MATERIA...</h2>
                    <div className="progress-track" style={{ width: '100%', height: '4px', background: 'var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                        <div className="progress-fill" style={{ width: `${mieState.globalProgress * 100}%`, height: '100%', background: 'var(--color-accent)', transition: 'all 0.3s ease' }} />
                    </div>
                </div>
            )}

            {/* DESCARGA ZIP (FALLBACK CLÁSICO SI NO ESCOGIO CARPETA DESTINO FS) */}
            {mieState.results.length > 0 && !mieState.isProcessing && !destHandle && (
                <div className="download-area stack--tight center" style={{ marginTop: '20px' }}>
                    <p className="util-label" style={{ fontSize: '10px', opacity: 0.5 }}>COSECHA LISTA PARA EXPORTACIÓN MANUAL</p>
                    <button 
                        className="btn btn--primary" 
                        onClick={downloadAsZip}
                        disabled={isZipping}
                        style={{ height: '50px', padding: '0 40px', borderRadius: '50px' }}
                    >
                        <IndraIcon name={isZipping ? 'SYNC' : 'DOWNLOAD'} size="16px" style={{ marginRight: '12px' }} />
                        <span className="font-outfit" style={{ fontWeight: 900 }}>
                            {isZipping ? 'EMPAQUETANDO MATERIA (.ZIP)...' : 'DESCARGAR TODO (.ZIP)'}
                        </span>
                    </button>
                    <button className="btn btn--mini btn--ghost" onClick={mieState.clearQueue}>
                        LIMPIAR MESA DE TRABAJO
                    </button>
                </div>
            )}
        </div>
    );
};
