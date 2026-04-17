import React, { useState, useEffect } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useGuestCore } from '../hooks/useGuestCore';
import { MIEDropzone } from '../widgets/MIEDropzone';

export const SiloFileViewer = ({ folderId, folderName, session, mieState }) => {
    const { listFolder, uploadFile, deleteFile, getDownloadUrl } = useGuestCore();
    const [files, setFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // Para el puente de subido del core
    
    const perms = session.permissions || {};

    const loadFiles = async () => {
        setIsLoading(true);
        const items = await listFolder(folderId);
        // Filtramos carpetas, aquí solo queremos ver archivos (class === 'DOCUMENT' || 'TABULAR')
        const onlyFiles = items.filter(a => a.class !== 'FOLDER');
        setFiles(onlyFiles);
        setIsLoading(false);
    };

    useEffect(() => {
        if (folderId) loadFiles();
    }, [folderId]);

    // ── GESTIÓN DE SUBIDAS ──
    // Cuando el usuario arrastra un archivo, se delega al MIE Engine.
    const handleFilesDropped = (rawFiles) => {
        if (!perms.can_upload) return alert("El propietario no ha habilitado las subidas en este link.");
        
        // El MIE engine se encargará de transcodificar (si aplica).
        // Al terminar, en SU callback de `onComplete`, invocaremos nosotros la subida para Guest.
        mieState.addFiles(rawFiles);
    };

    // Escuchar cuando el MIE termina de procesar para subirlos automáticamente al folder actual
    useEffect(() => {
        if (mieState.results.length > 0 && !mieState.isProcessing && folderId && perms.can_upload) {
            performCoreUploads();
        }
    }, [mieState.results, mieState.isProcessing, folderId]);

    const performCoreUploads = async () => {
        setIsUploading(true);
        try {
            for (const res of mieState.results) {
                // Convertir Blob a Base64 porque AXIOMA 5 del Core manda los payloads así por red.
                const buffer = await res.canonicalBlob.arrayBuffer();
                const b64 = btoa(
                    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                
                await uploadFile(b64, res.mimeType, res.canonicalName, folderId);
            }
            alert("Materia sincronizada en el silo del propietario.");
            mieState.clearQueue();
            loadFiles(); // Refrescar lista
        } catch(err) {
            console.error("Upload error", err);
            alert("Hubo un error inyectando la materia.");
        } finally {
            setIsUploading(false);
        }
    };

    // ── ACCIONES EN BOTONES ──
    const handleDelete = async (fileAtom) => {
        if (!window.confirm(`¿Cortar vínculo atómico de ${fileAtom.handle?.label}?`)) return;
        await deleteFile(fileAtom.id);
        setFiles(prev => prev.filter(f => f.id !== fileAtom.id));
    };

    const handleDownload = async (fileAtom) => {
        const url = await getDownloadUrl(fileAtom.id);
        if (url) {
            window.open(url, '_blank');
        } else {
            alert("No se pudo resolver la URL de descarga directa.");
        }
    };

    return (
        <div className="silo-file-viewer fill stack--loose" style={{ padding: '40px' }}>
            
            <header className="shelf--between" style={{ paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="shelf--tight">
                    <IndraIcon name="FOLDER_OPEN" size="18px" color="var(--color-accent)" />
                    <h2 className="font-outfit" style={{ fontSize: '24px', fontWeight: 900 }}>{folderName?.toUpperCase()}</h2>
                </div>
                <div className="shelf--tight">
                    <button className="btn btn--icon btn--ghost" onClick={loadFiles} title="Sincronizar">
                        <IndraIcon name="SYNC" size="14px" className={isLoading ? "spin" : ""} />
                    </button>
                    {!perms.can_upload && (
                        <div className="status-glow" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', fontSize: '9px' }}>SUBIDAS BLOQUEADAS</div>
                    )}
                </div>
            </header>

            {/* Listado de Archivos */}
            <div className="files-list fill scroll-y stack--tight" style={{ minHeight: '300px' }}>
                {isLoading && files.length === 0 ? (
                    <div className="fill center util-label" style={{ opacity: 0.3 }}>INSPECCIONANDO VACÍO...</div>
                ) : files.length === 0 ? (
                    <div className="fill center stack--tight" style={{ opacity: 0.3 }}>
                        <IndraIcon name="FILE" size="32px" />
                        <span className="font-outfit">CARPETA VACÍA</span>
                    </div>
                ) : (
                    files.map(f => (
                        <div key={f.id} className="file-row shelf--between glass-hover" style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.02)', background: 'rgba(255,255,255,0.01)' }}>
                            <div className="shelf--tight">
                                <IndraIcon name={f.mime_type?.startsWith('video') ? 'PROJECT_VIDEO' : f.mime_type?.startsWith('image') ? 'IMAGE' : 'DOCUMENT'} size="16px" style={{ opacity: 0.6 }} />
                                <span className="font-outfit" style={{ fontSize: '13px', fontWeight: 600, marginLeft: '8px' }}>{f.handle?.label}</span>
                            </div>
                            
                            <div className="shelf--tight" style={{ gap: '16px' }}>
                                {f.size > 0 && <span className="util-hint" style={{ fontSize: '10px' }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>}
                                {f.modified_at && <span className="util-hint" style={{ fontSize: '10px' }}>{new Date(f.modified_at).toLocaleDateString()}</span>}
                                
                                <div className="shelf--tight" style={{ gap: '4px', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                                    {perms.can_download && (
                                        <button className="btn btn--icon btn--ghost" onClick={() => handleDownload(f)}>
                                            <IndraIcon name="DOWNLOAD" size="12px" />
                                        </button>
                                    )}
                                    {perms.can_delete && (
                                        <button className="btn btn--icon btn--ghost" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(f)}>
                                            <IndraIcon name="CLOSE" size="12px" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Zona de Ingesta (Solo si can_upload === true) */}
            {perms.can_upload && (
                <div style={{ marginTop: '20px' }}>
                    <div className="util-label" style={{ marginBottom: '16px', fontSize: '10px', opacity: 0.5 }}>COMPRESIÓN & INYECCIÓN</div>
                    <MIEDropzone 
                        onFiles={handleFilesDropped}
                        isProcessing={mieState.isProcessing || isUploading}
                        globalProgress={mieState.globalProgress}
                    />
                </div>
            )}
        </div>
    );
};
