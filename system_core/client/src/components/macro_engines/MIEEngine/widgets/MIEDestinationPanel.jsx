import React, { useState } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAppState } from '../../../../state/app_state';
import ArtifactSelector from '../../../utilities/ArtifactSelector';

export const MIEDestinationPanel = ({ mieState, transportState }) => {
    const { isConnected, googleUser } = useAppState();
    const [destinationMode, setDestinationMode] = useState('LOCAL'); // LOCAL | INDRA
    const [showArtifactSelector, setShowArtifactSelector] = useState(false);

    // Detección File System Access API
    const isFSApiSupported = 'showDirectoryPicker' in window;

    const handleSelectRemoteSilo = (artifact) => {
        transportState.setRemoteDestination(artifact);
        setShowArtifactSelector(false);
    };

    const pickSourceDirectory = async () => {
        try {
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            transportState.setSourceHandle(dirHandle);
            transportState.setTransportLog("Escaneando subarchivos en el origen...");
            
            const fileMap = new Map();
            const rawFiles = [];
            
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    if (entry.name.match(/\.(mp4|mov|avi|mkv|webm|mp3|wav|ogg|aac|m4a|jpg|jpeg|png|webp|heic|avif)$/i)) {
                        const file = await entry.getFile();
                        rawFiles.push(file);
                        fileMap.set(file.name, entry);
                    }
                }
            }
            
            transportState.setSourceFileHandles(fileMap);
            transportState.setTransportLog(`Directorio mapeado: ${rawFiles.length} archivos.`);
            
            if (rawFiles.length > 0) {
                mieState.queueFiles(rawFiles);
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Error origen:', err);
        }
    };

    return (
        <div className="destination-config stack--tight">
            {/* TABS DE DESTINO */}
            <div className="shelf--tight" style={{ background: 'var(--color-bg-elevated)', borderRadius: '12px', padding: '4px' }}>
                <button 
                    className={`btn flex-1 ${destinationMode === 'LOCAL' ? 'btn--primary' : 'btn--ghost'}`}
                    style={{ fontSize: '10px', height: '32px' }}
                    onClick={() => {
                        setDestinationMode('LOCAL');
                        transportState.setRemoteDestination(null); // Clear remote to avoid confusing the hook
                    }}
                >
                    LOCAL PURO
                </button>
                <button 
                    className={`btn flex-1 ${destinationMode === 'INDRA' ? 'btn--primary' : 'btn--ghost'}`}
                    style={{ fontSize: '10px', height: '32px' }}
                    onClick={() => {
                        setDestinationMode('INDRA');
                        transportState.setDestHandle(null); // Clear local handle
                        transportState.setSourceHandle(null);
                        mieState.clearQueue();
                    }}
                >
                    UBICACIONES INDRA
                </button>
            </div>

            {/* MODO 1: LOCAL PURO */}
            {destinationMode === 'LOCAL' && isFSApiSupported && (
                <div className="glass-card stack--tight" style={{ padding: '16px', marginTop: '12px' }}>
                    <p className="util-hint" style={{ fontSize: '10px', marginBottom: '8px' }}>
                        Lee y escribe directamente en medios físicos (SD, Discos USB) sin almacenar en la nube.
                    </p>

                    {/* Selector de Origen */}
                    <button 
                        className="btn btn--outline shelf--between"
                        style={{ background: transportState.sourceHandle ? 'var(--color-bg-elevated)' : 'transparent', height: 'auto', padding: '12px', textAlign: 'left' }}
                        onClick={pickSourceDirectory}
                    >
                        <div className="stack--tight" style={{ alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '10px', opacity: 0.6 }}>ORIGEN (Raw / Proxies)</span>
                            <span className="font-outfit" style={{ fontSize: '12px', fontWeight: 600 }}>
                                {transportState.sourceHandle ? transportState.sourceHandle.name : 'Seleccionar Carpeta'}
                            </span>
                        </div>
                        <IndraIcon name="FOLDER_OPEN" size="16px" color="var(--color-accent)" />
                    </button>

                    {/* Selector de Destino */}
                    <button 
                        className="btn btn--outline shelf--between"
                        style={{ background: transportState.destHandle ? 'var(--glass-light)' : 'transparent', height: 'auto', padding: '12px', textAlign: 'left', border: transportState.destHandle ? '1px solid var(--color-warning)' : '1px solid var(--color-border)' }}
                        onClick={async () => {
                            try {
                                const h = await window.showDirectoryPicker({ mode: 'readwrite' });
                                transportState.setDestHandle(h);
                            } catch (e) {
                                if (e.name !== 'AbortError') console.error(e);
                            }
                        }}
                    >
                        <div className="stack--tight" style={{ alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '10px', opacity: 0.6 }}>DESTINO (Local)</span>
                            <span className="font-outfit" style={{ fontSize: '12px', fontWeight: 600 }}>
                                {transportState.destHandle ? transportState.destHandle.name : 'Descarga Manual (.ZIP)'}
                            </span>
                        </div>
                        <IndraIcon name="FOLDER" size="16px" color={transportState.destHandle ? "var(--color-warning)" : "currentColor"} />
                    </button>

                    {/* Lógicas Avanzadas (Aparecen solo si Origen y Destino están listos) */}
                    {transportState.sourceHandle && transportState.destHandle && (
                        <div className="stack--tight" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                            <div className="shelf--between">
                                <span style={{ fontSize: '10px', opacity: 0.6 }}>DISTRIBUCIÓN DE RUTA:</span>
                                <select 
                                    value={transportState.sortingRule}
                                    onChange={(e) => transportState.setSortingRule(e.target.value)}
                                    style={{ background: 'transparent', color: 'var(--color-accent)', border: 'none', fontSize: '11px', fontWeight: 600, outline: 'none' }}
                                >
                                    <option value="NONE">EN RAÍZ (Plano)</option>
                                    <option value="DATE">POR FECHA (Carpeta por Año-Mes)</option>
                                    <option value="TYPE">POR TIPO (Video/Imagen/Audio)</option>
                                </select>
                            </div>

                            <label className="shelf--tight" style={{ cursor: 'pointer', marginTop: '8px', opacity: transportState.deleteSource ? 1 : 0.6 }}>
                                <input 
                                    type="checkbox" 
                                    checked={transportState.deleteSource} 
                                    onChange={(e) => transportState.setDeleteSource(e.target.checked)} 
                                    style={{ accentColor: 'var(--color-danger)' }}
                                />
                                <span style={{ fontSize: '10px', color: transportState.deleteSource ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>PURGAR ORIGEN AL FINALIZAR</span>
                            </label>
                        </div>
                    )}
                </div>
            )}

            {destinationMode === 'LOCAL' && !isFSApiSupported && (
                <div className="glass-card" style={{ padding: '16px', marginTop: '12px' }}>
                    <p className="util-hint" style={{ fontSize: '10px' }}>Tu navegador no soporta el Acceso Físico Nativo. Toda exportación requerirá una descarga manual .ZIP.</p>
                </div>
            )}

            {/* MODO 2: UBICACIONES INDRA (Remoto) */}
            {destinationMode === 'INDRA' && (
                <div className="glass-card stack--tight" style={{ padding: '16px', marginTop: '12px' }}>
                    
                    {!isConnected ? (
                        <div className="stack--tight center text-center">
                            <IndraIcon name="LOCK" size="24px" color="var(--color-text-secondary)" />
                            <p className="util-hint" style={{ fontSize: '11px', marginBottom: '8px' }}>Requiere autenticación con Google Drive, u otros nodos remotos.</p>
                            {/* Acá el Core debería inyectar el Login, o podemos poner un CTA que abra el Dashboard / Auth Widget */}
                            <button className="btn btn--primary fill" onClick={() => alert("Debes iniciar sesión con Google desde la Barra Superior (Satellite HUD).")}>INICIAR SESIÓN EN INDRA</button>
                        </div>
                    ) : (
                        <div className="stack--tight">
                            <p className="util-hint" style={{ fontSize: '10px', marginBottom: '8px' }}>
                                Escoge una carpeta del sistema de archivos virtual, conectada a la Base de Datos Graph del Núcleo.
                            </p>

                            <button 
                                className="btn btn--outline shelf--between"
                                style={{ background: transportState.remoteDestination ? 'var(--glass-light)' : 'transparent', height: 'auto', padding: '12px', textAlign: 'left' }}
                                onClick={() => setShowArtifactSelector(true)}
                            >
                                <div className="stack--tight" style={{ alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '10px', opacity: 0.6 }}>SILO / PROYECTO OBJETIVO</span>
                                    <span className="font-outfit" style={{ fontSize: '12px', fontWeight: 600 }}>
                                        {transportState.remoteDestination ? transportState.remoteDestination.label : 'Elegir Ubicación Indra...'}
                                    </span>
                                </div>
                                <IndraIcon name="DATABASE" size="16px" color={transportState.remoteDestination ? "var(--color-accent)" : "currentColor"} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Selector de Artefactos Universal (Desplegado en Modal Ocupando Pantalla o Flotante) */}
            {showArtifactSelector && (
                <ArtifactSelector 
                    title="SELECCIONA UBICACIÓN DESTINO"
                    onSelect={handleSelectRemoteSilo}
                    onCancel={() => setShowArtifactSelector(false)}
                    filter={{ class: 'Folder' }} // Depende de la lógica del catálogo de indra si pide 'Folder'
                />
            )}
        </div>
    );
};
