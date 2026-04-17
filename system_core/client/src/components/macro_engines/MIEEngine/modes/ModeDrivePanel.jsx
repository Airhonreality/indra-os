import React, { useState, useEffect } from 'react';
import { MIEDropzone } from '../widgets/MIEDropzone';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAppState } from '../../../../state/app_state';

// const { drive_provider } = require('../../../../core/2_providers/provider_drive'); 
// Por ahora para no romper el layout dummy:
const drive_provider = { listFolders: async () => [], uploadFile: async () => {} };
export const ModeDrivePanel = ({ mieState }) => {
    const googleUser = useAppState(s => s.googleUser);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Cargar carpetas raíz para selección
    useEffect(() => {
        if (googleUser) {
            // Nota: Esto debería venir de un hook useSilos, pero simplificamos para el MIE
            drive_provider.listFolders().then(setFolders).catch(console.error);
        }
    }, [googleUser]);

    const handleFiles = async (files) => {
        if (!selectedFolder) {
            alert("Selecciona primero una carpeta destino en tu Drive.");
            return;
        }
        mieState.addFiles(files);
    };

    // Subida automática al terminar el procesamiento
    useEffect(() => {
        if (mieState.results.length > 0 && !mieState.isProcessing && selectedFolder) {
            uploadBatch();
        }
    }, [mieState.results, mieState.isProcessing]);

    const uploadBatch = async () => {
        setIsUploading(true);
        try {
            for (const res of mieState.results) {
                await drive_provider.uploadFile({
                    folderId: selectedFolder.id,
                    file: res.canonicalBlob,
                    name: res.canonicalName,
                    mimeType: res.mimeType
                });
            }
            alert("Subida completada en tu Drive.");
            mieState.clearQueue();
        } catch (err) {
            console.error("[MIE Drive] Error subiendo:", err);
        } finally {
            setIsUploading(false);
        }
    };

    if (!googleUser) {
        return (
            <div className="fill center stack--loose">
                <IndraIcon name="LOCK" size="40px" opacity={0.2} />
                <h3 className="font-outfit">MODO DRIVE REQUIERE IDENTIDAD</h3>
                <p className="util-hint" style={{ maxWidth: '300px', textAlign: 'center' }}>
                    Conéctate con tu cuenta de Google para poder inyectar multimedia directamente en tus silos.
                </p>
                {/* Botón de login dispararía el flujo de auth global */}
            </div>
        );
    }

    return (
        <div className="mode-panel fill shelf--loose stack--loose" style={{ padding: '40px' }}>
            <div className="drive-config stack--loose" style={{ width: '300px' }}>
                <header className="shelf--tight">
                    <IndraIcon name="FOLDER" size="14px" />
                    <span className="util-label">DESTINO_DRIVE</span>
                </header>

                <div className="folder-list glass-card fill stack--tight" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {folders.map(f => (
                        <div 
                            key={f.id} 
                            className={`folder-item shelf--tight ${selectedFolder?.id === f.id ? 'active' : ''}`}
                            onClick={() => setSelectedFolder(f)}
                            style={{ 
                                padding: '10px', fontSize: '11px', cursor: 'pointer',
                                background: selectedFolder?.id === f.id ? 'rgba(123, 47, 247, 0.1)' : 'transparent',
                                borderRadius: '8px'
                            }}
                        >
                            <IndraIcon name="FOLDER" size="10px" opacity={0.5} />
                            <span>{f.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="drive-main fill center stack--loose">
                {selectedFolder ? (
                    <>
                        <div className="util-label status-glow">
                            INYECTANDO EN: {selectedFolder.name.toUpperCase()}
                        </div>
                        <MIEDropzone 
                            onFiles={handleFiles} 
                            isProcessing={mieState.isProcessing || isUploading}
                            globalProgress={mieState.globalProgress}
                        />
                    </>
                ) : (
                    <div className="text-content center stack--tight">
                        <IndraIcon name="ARROW_LEFT" size="24px" className="pulse" />
                        <h2 className="font-outfit">ELIGE TU SILO</h2>
                        <p className="util-hint">Selecciona una carpeta del panel izquierdo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
