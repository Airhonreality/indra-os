/**
 * =============================================================================
 * ARTEFACTO: SchemaNexusControl.jsx
 * RESPONSABILIDAD: Centro de Control de Almacenamiento Físico (NEXUS).
 * FLUJOS: Ignición, Importación ADN, Vinculación e Hidratación.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useAppState } from '../../../state/app_state';
import { executeDirective } from '../../../services/directive_executor';
import { toastEmitter } from '../../../services/toastEmitter';
// AXIOMA §12.1: Sincronización Estructural Verificada. Contrato: metadata.schema.fields
import { SiloFractalExplorer } from '../../utilities/SiloFractalExplorer';
import ArtifactSelector from '../../utilities/ArtifactSelector';
import { FieldMapper } from '../BridgeDesigner/FieldMapper';

export function SchemaNexusControl({ atom, bridge, onUpdate, onFieldsImported }) {
    const [currentPath, setCurrentPath] = useState('MENU'); // MENU, IGNITE, IMPORT_DNA, LINK, HYDRATE
    
    // Estados compartidos
    const services = useAppState(s => s.services || []);
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);
    const activeWorkspaceId = useAppState(s => s.activeWorkspaceId);



    const renderHeader = (title, subtitle) => (
        <div className="nexus-header shelf--loose" style={{ 
            padding: '16px 20px', 
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px'
        }}>
            <button className="btn btn--xs btn--ghost" onClick={() => setCurrentPath('MENU')} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                <IndraIcon name="BACK" size="12px" />
            </button>
            <div className="stack--none">
                <h2 className="font-mono" style={{ fontSize: '11px', fontWeight: '900', color: 'var(--indra-dynamic-accent)', letterSpacing: '0.1em' }}>{title}</h2>
                <span style={{ fontSize: '9px', opacity: 0.4, textTransform: 'uppercase' }}>{subtitle}</span>
            </div>
        </div>
    );

    if (currentPath === 'MENU') {
        return (
            <div className="nexus-menu fill stack" style={{ padding: '24px', background: '#0a0a0a', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="stack--none" style={{ marginBottom: '32px' }}>
                    <div className="shelf--tight" style={{ opacity: 0.3, marginBottom: '8px' }}>
                        <IndraIcon name="VAULT" size="12px" />
                        <span className="font-mono" style={{ fontSize: '9px', letterSpacing: '0.2em' }}>PHYSICAL_LINK_COMMAND</span>
                    </div>
                    <h1 style={{ fontSize: '20px', fontWeight: '300', letterSpacing: '-0.03em', color: 'white' }}>Gestión de Almacenamiento</h1>
                </div>

                <div className="nexus-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '10px',
                    flex: 1
                }}>
                    <MenuCard 
                        icon="VAULT" 
                        title="Crear Nueva" 
                        desc="Generar tabla física desde cero." 
                        onClick={() => setCurrentPath('IGNITE')} 
                    />
                    <MenuCard 
                        icon="SEARCH" 
                        title="Importar ADN" 
                        desc="Extraer campos de origen." 
                        onClick={() => setCurrentPath('IMPORT_DNA')} 
                    />
                    <MenuCard 
                        icon="LINK" 
                        title="Vincular" 
                        desc="Conectar a tabla activa." 
                        onClick={() => setCurrentPath('LINK')} 
                    />
                    <MenuCard 
                        icon="SYNC" 
                        title="Transferir" 
                        desc="Mover registros vía mapeo." 
                        onClick={() => setCurrentPath('HYDRATE')} 
                    />
                    <div style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                        <MenuCard 
                            icon="DELETE" 
                            title="Desvincular ID" 
                            desc="Eliminar el vínculo físico actual (ID Fantasma)." 
                            onClick={() => setCurrentPath('UNLINK')} 
                            danger
                        />
                    </div>
                </div>
            </div>
        );
    }

    if (currentPath === 'IGNITE') {
        return (
            <PathIgnite 
                atom={atom} 
                coreUrl={coreUrl} 
                sessionSecret={sessionSecret} 
                activeWorkspaceId={activeWorkspaceId}
                onComplete={onUpdate}
                renderHeader={renderHeader}
            />
        );
    }

    if (currentPath === 'IMPORT_DNA') {
        return (
            <PathImportDNA 
                coreUrl={coreUrl} 
                sessionSecret={sessionSecret} 
                onComplete={onFieldsImported}
                onBack={() => setCurrentPath('MENU')}
                renderHeader={renderHeader}
            />
        );
    }

    if (currentPath === 'LINK') {
        return (
            <PathLink 
                atom={atom} 
                bridge={bridge}
                onComplete={onUpdate}
                onBack={() => setCurrentPath('MENU')}
                renderHeader={renderHeader}
            />
        );
    }

    if (currentPath === 'HYDRATE') {
        return (
            <PathHydrate 
                atom={atom}
                coreUrl={coreUrl} 
                sessionSecret={sessionSecret} 
                onBack={() => setCurrentPath('MENU')}
                renderHeader={renderHeader}
            />
        );
    }

    if (currentPath === 'UNLINK') {
        return (
            <PathUnlink 
                atom={atom}
                coreUrl={coreUrl} 
                sessionSecret={sessionSecret} 
                onComplete={onUpdate}
                onBack={() => setCurrentPath('MENU')}
                renderHeader={renderHeader}
            />
        );
    }

    return null;
}

// --- SUB-COMPONENTES DE APOYO ---

// 5. FLUJO: DESVINCULAR (REPARACIÓN TÉCNICA)
function PathUnlink({ atom, coreUrl, sessionSecret, onComplete, onBack, renderHeader }) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleUnlink = async () => {
        setIsProcessing(true);
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'ATOM_UPDATE',
                context_id: atom.id,
                data: {
                    payload: {
                        ...atom.payload,
                        target_silo_id: null,
                        target_provider: null,
                        ignited_at: null
                    }
                }
            }, coreUrl, sessionSecret);

            if (result.metadata?.status === 'OK') {
                toastEmitter.success("Vínculo eliminado.");
                onComplete(result.items[0]);
            } else {
                toastEmitter.error("Error al desvincular.");
            }
        } catch (e) { toastEmitter.error("Fallo crítico en el protocolo."); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="nexus-path fill stack" style={{ background: '#0a0a0a' }}>
            {renderHeader("MANTENIMIENTO", "Recuperación de identidad del esquema.")}
            <div className="nexus-content fill center stack--loose" style={{ padding: '32px' }}>
                <div className="unlink-card stack" style={{ 
                    padding: '24px', 
                    background: 'rgba(255, 70, 85, 0.03)', 
                    border: '1px solid rgba(255, 70, 85, 0.1)',
                    borderRadius: '16px',
                    textAlign: 'center'
                }}>
                    <IndraIcon name="DELETE" size="32px" color="#ff4655" />
                    <div className="stack--tight">
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Desvincular Almacenamiento</h4>
                        <p className="font-mono" style={{ fontSize: '10px', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '4px' }}>
                            {atom.payload?.target_silo_id}
                        </p>
                    </div>
                    <p style={{ fontSize: '11px', opacity: 0.4, maxWidth: '280px', margin: '0 auto' }}>
                        Esta acción purgará los metadatos de conexión facilitando una re-configuración limpia. Los archivos físicos no serán eliminados.
                    </p>
                </div>
                
                <div className="shelf--tight" style={{ width: '100%', marginTop: 'auto' }}>
                    <button className="btn btn--ghost" onClick={onBack} style={{ flex: 1 }}>CANCELAR</button>
                    <button className="btn btn--danger" onClick={handleUnlink} disabled={isProcessing} style={{ flex: 2, height: '44px', borderRadius: '8px' }}>
                        {isProcessing ? "PROCESANDO..." : "CONFIRMAR ACCIÓN"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MenuCard({ icon, title, desc, onClick, danger }) {
    return (
        <div className="nexus-card glass-hover" onClick={onClick} style={{
            padding: '16px',
            borderRadius: '12px',
            background: danger ? 'rgba(255, 70, 85, 0.03)' : 'rgba(255,255,255,0.01)',
            border: `1px solid ${danger ? 'rgba(255, 70, 85, 0.1)' : 'rgba(255,255,255,0.05)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div className="card-icon center" style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                background: danger ? 'rgba(255, 70, 85, 0.1)' : 'rgba(255,255,255,0.03)',
                flexShrink: 0
            }}>
                <IndraIcon name={icon} size="18px" color={danger ? '#ff4655' : "var(--indra-dynamic-accent)"} />
            </div>
            <div className="stack--none">
                <h3 style={{ fontSize: '12px', fontWeight: '600', color: danger ? '#ff4655' : 'white', letterSpacing: '-0.01em' }}>{title.toUpperCase()}</h3>
                <p style={{ fontSize: '10px', opacity: 0.3 }}>{desc}</p>
            </div>
        </div>
    );
}

// 1. FLUJO: CONFIGURACIÓN DE BASE DE DATOS (CREAR NUEVA)
function PathIgnite({ atom, coreUrl, sessionSecret, activeWorkspaceId, onComplete, renderHeader }) {
    const [targetFolder, setTargetFolder] = useState({ 
        id: activeWorkspaceId, 
        title: activeWorkspaceId ? `ID: ${activeWorkspaceId.substring(0,10)}...` : 'SELECCIONAR DESTINO', 
        provider: 'drive',
        role: 'Carpeta del Workspace'
    });
    const [showFolderSelector, setShowFolderSelector] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [progress, setProgress] = useState([]);

    const addLog = (label, status = 'PENDING') => {
        setProgress(prev => [...prev, { label, status, id: Date.now() + Math.random() }]);
    };

    // BAUTIZADOR DE SILOS: Resolución de nombre real de la carpeta activa
    useEffect(() => {
        if (activeWorkspaceId && targetFolder.id === activeWorkspaceId) {
            setIsResolving(true);
            executeDirective({
                provider: 'drive',
                protocol: 'ATOM_READ',
                context_id: activeWorkspaceId
            }, coreUrl, sessionSecret).then(res => {
                if (res.items?.[0]) {
                    const resolvedAtom = res.items[0];
                    setTargetFolder(prev => ({ 
                        ...prev, 
                        id: resolvedAtom.id, // AXIOMA DE SINCERIDAD: Adoptar el ID físico real
                        title: resolvedAtom.handle?.label || activeWorkspaceId,
                        role: resolvedAtom.metadata?.role === 'WORKSPACE_FOLDER' ? 'Carpeta del Workspace' : prev.role
                    }));
                }
            })
            .catch(() => {})
            .finally(() => setIsResolving(false));
        }
    }, [activeWorkspaceId, coreUrl, sessionSecret, targetFolder.id]);

    const updateLastLog = (status) => {
        setProgress(prev => {
            const next = [...prev];
            if (next.length > 0) next[next.length - 1].status = status;
            return next;
        });
    };

    const handleAction = async () => {
        setIsProcessing(true);
        setProgress([]);
        
        try {
            // Paso 1: Solicitud inicial
            addLog("📡 Iniciando solicitud de configuración en el Core...", "DONE");
            
            // Paso 2: Creación física
            addLog("⚒️ Creando almacenamiento físico (Tabla/Spreadsheet)...");
            // Inferencia de Motor via Contexto (Axioma de Identidad Fractal)
            const inferredProvider = targetFolder.provider === 'drive' ? 'sheets' : (targetFolder.provider || 'sheets');
            
            const result = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_SCHEMA_IGNITE',
                context_id: atom.id,
                data: { target_provider: inferredProvider, parent_id: targetFolder.id }
            }, coreUrl, sessionSecret);
            if (result.metadata?.status === 'OK') {
                updateLastLog("DONE");
                
                // Paso 3: Vinculación de ID
                addLog(`🧬 Vinculando ID de almacenamiento [${result.metadata.silo_id?.substring(0,8)}...]`, "DONE");
                
                // Paso 4: Registro en Workspace (Pinning)
                addLog("📌 Registrando acceso en el panel de control...");
                
                // ULTRA SONDE: Captura de Identidad Post-Ignición
                const coreVersion = result.metadata?.core_patch_version || "LEGACY_PRE_IGNITION";
                console.log(`[UltraSonde] Core Version: ${coreVersion}`);
                console.log(`[UltraSonde] Silo ID (Metadata): ${result.metadata?.silo_id}`);
                console.log(`[UltraSonde] Silo URL (Metadata): ${result.metadata?.silo_url}`);
                console.log(`[UltraSonde] Items devueltos:`, result.items);
                
                if (coreVersion === "LEGACY_PRE_IGNITION") {
                    console.warn("⚠️ ALERTA: El Core está ejecutando una versión antigua.");
                    toastEmitter.warning("Despliegue de GAS desactualizado.");
                }

                await new Promise(r => setTimeout(r, 800));
                toastEmitter.success("Base de datos configurada y vinculada.");
                updateLastLog("DONE");
                
                onComplete(result.items[0]);
            } else {
                updateLastLog("ERROR");
                toastEmitter.error(result.metadata?.error || "Error en creación física.");
            }
        } catch (e) { 
            updateLastLog("ERROR");
            toastEmitter.error("Fallo crítico en el motor de configuración."); 
        } finally { 
            setIsProcessing(false); 
        }
    };

    if (isProcessing) {
        return (
            <div className="nexus-path fill stack">
                {renderHeader("PROGRESO DE CONFIGURACIÓN", "Procesando materialización física del esquema.")}
                <div className="nexus-content fill stack--loose" style={{ padding: '24px' }}>
                    <div className="progress-log stack--tight" style={{ 
                        background: 'rgba(0,0,0,0.2)', 
                        padding: '20px', 
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        minHeight: '200px'
                    }}>
                        {progress.map((p) => (
                            <div key={p.id} className="shelf--tight" style={{ 
                                padding: '8px 0', 
                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                opacity: p.status === 'PENDING' ? 0.5 : 1
                            }}>
                                <span style={{ 
                                    color: p.status === 'DONE' ? 'var(--color-success)' : p.status === 'ERROR' ? 'var(--color-danger)' : 'white',
                                    fontSize: '12px'
                                }}>
                                    {p.status === 'DONE' ? '✓' : p.status === 'ERROR' ? '✕' : '●'}
                                </span>
                                <span className="font-mono" style={{ fontSize: '11px', marginLeft: '10px' }}>{p.label.toUpperCase()}</span>
                            </div>
                        ))}
                        {isProcessing && <div className="indra-spin" style={{ width: '12px', height: '12px', marginTop: '15px' }}></div>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="nexus-path fill stack" style={{ background: '#0a0a0a' }}>
            {renderHeader("IGNICIÓN FÍSICA", "Configuración de motor y destino del silo.")}
            <div className="nexus-content fill stack--loose" style={{ padding: '32px' }}>
                <div className="setup-grid stack--loose">
                    <div className="location-picker stack--tight" onClick={() => setShowFolderSelector(true)} style={{ 
                        padding: '24px', 
                        borderRadius: '16px', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px dashed rgba(255,255,255,0.1)', 
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        textAlign: 'center'
                    }}>
                        <label className="font-mono" style={{ fontSize: '9px', opacity: 0.4, letterSpacing: '0.2em', display: 'block', marginBottom: '12px' }}>DESTINO_DE_MATERIALIZACIÓN</label>
                        <div className="stack--tight center">
                            <div className="center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', marginBottom: '8px', position: 'relative' }}>
                                <IndraIcon name={targetFolder.provider === 'drive' ? 'FOLDER' : 'VAULT'} size="20px" color="var(--indra-dynamic-accent)" />
                                {isResolving && (
                                    <div className="indra-spin" style={{ 
                                        position: 'absolute', 
                                        width: '56px', 
                                        height: '56px', 
                                        border: '1px solid var(--indra-dynamic-accent)',
                                        borderTopColor: 'transparent',
                                        borderRadius: '50%',
                                        opacity: 0.3
                                    }} />
                                )}
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{targetFolder.title}</span>
                            <div className="shelf--tight" style={{ opacity: 0.3 }}>
                                <span className="font-mono" style={{ fontSize: '9px' }}>{targetFolder.role?.toUpperCase()}</span>
                                <span className="font-mono" style={{ fontSize: '9px' }}>|</span>
                                <span className="font-mono" style={{ fontSize: '9px' }}>{targetFolder.provider?.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1 }} />
                
                <button className="btn btn--accent shelf--tight center" onClick={handleAction} disabled={isProcessing} style={{ 
                    height: '48px', 
                    borderRadius: '12px', 
                    width: '100%',
                    boxShadow: '0 4px 20px rgba(0, 255, 200, 0.1)'
                }}>
                    <IndraIcon name="VAULT" size="14px" />
                    <span style={{ fontWeight: 'bold', fontSize: '12px', letterSpacing: '0.05em' }}>INICIAR MATERIALIZACIÓN FÍSICA</span>
                </button>
            </div>

            {showFolderSelector && (
                <div className="indra-modal-overlay center" style={{ 
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, padding: '40px' 
                }}>
                    <div className="stack" style={{ 
                        width: '100%', maxWidth: '500px', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', overflow: 'hidden' 
                    }}>
                        <div className="shelf--loose" style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="stack--none">
                                <h3 className="font-mono" style={{ fontSize: '11px', color: 'var(--indra-dynamic-accent)' }}>SELECCIONAR_DESTINO_FÍSICO</h3>
                                <span style={{ fontSize: '9px', opacity: 0.3 }}>NAVEGACIÓN FRACTAL ACTIVADA</span>
                            </div>
                            <button className="btn btn--xs btn--ghost" onClick={() => setShowFolderSelector(false)}>
                                <IndraIcon name="CLOSE" size="12px" />
                            </button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <SiloFractalExplorer 
                                coreUrl={coreUrl}
                                sessionSecret={sessionSecret}
                                onSelect={f => { 
                                    setTargetFolder({ 
                                        id: f.id, 
                                        title: f.handle?.label || f.id, 
                                        provider: f.provider || 'drive',
                                        role: 'Destino Seleccionado'
                                    }); 
                                    setShowFolderSelector(false); 
                                }}
                            />
                        </div>
                        <div className="shelf--tight" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                            <button className="btn btn--ghost fill" onClick={() => setShowFolderSelector(false)}>CANCELAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 2. FLUJO: IMPORTAR ADN (ESTRUCTURA)
function PathImportDNA({ coreUrl, sessionSecret, onComplete, renderHeader }) {
    const [showSelector, setShowSelector] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileSelect = async (file) => {
        setIsProcessing(true);
        setShowSelector(false);
        try {
            const result = await executeDirective({
                provider: file.provider || 'drive',
                protocol: 'TABULAR_STREAM',
                context_id: file.id,
                data: { limit: 1 } // Solo queremos las cabeceras
            }, coreUrl, sessionSecret);

            if (result.metadata?.schema?.fields) {
                // Transformar cabeceras en campos de SchemaDesigner
                const newFields = result.metadata.schema.fields.map(h => ({
                    id: h.id || h.key,
                    alias: h.key,
                    label: h.label || h.key,
                    type: h.type || 'text',
                    children: []
                }));
                toastEmitter.success(`Estructura importada: ${newFields.length} campos detectados.`);
                onComplete(newFields, { 
                    origin_silo_id: file.id, 
                    origin_provider: file.provider || 'drive' 
                });
            } else {
                toastEmitter.error("No se detectó estructura tabular en el archivo.");
            }
        } catch (e) { toastEmitter.error("Error al leer estructura física."); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="nexus-path fill stack">
            {renderHeader("IMPORTAR ESTRUCTURA", "Clonar campos de un archivo existente.")}
            <div className="nexus-content fill center stack--loose" style={{ padding: '24px' }}>
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <IndraIcon name="SEARCH" size="48px" />
                    <p style={{ fontSize: '11px', marginTop: '12px', maxWidth: '240px' }}>
                        Seleccione un archivo con estructura tabular (Sheets, CSV, etc.) para extraer sus columnas.
                    </p>
                </div>
                
                <button className="btn btn--accent" onClick={() => setShowSelector(true)} disabled={isProcessing}>
                    {isProcessing ? "LEYENDO..." : "BUSCAR ARCHIVO ORIGEN"}
                </button>
            </div>

            {showSelector && (
                <ArtifactSelector 
                    title="SELECCIONAR TABLA ORIGEN" 
                    onSelect={handleFileSelect}
                    onCancel={() => setShowSelector(false)}
                />
            )}
        </div>
    );
}

// 3. FLUJO: VINCULAR (ENLACE)
function PathLink({ atom, bridge, onComplete, renderHeader }) {
    const [showSelector, setShowSelector] = useState(false);

    const handleLink = async (file) => {
        setShowSelector(false);
        try {
            // Actualizamos solo el payload de vinculación
            const updatedPayload = {
                ...atom.payload,
                target_silo_id: file.id,
                target_provider: file.provider || 'drive'
            };
            const result = await bridge.save({ ...atom, payload: updatedPayload });
            if (result.items?.[0]) {
                toastEmitter.success("Vínculo establecido físicamente.");
                onComplete(result.items[0]);
            }
        } catch (e) { toastEmitter.error("Error al guardar vínculo."); }
    };

    return (
        <div className="nexus-path fill stack">
            {renderHeader("VINCULAR BASE DE DATOS", "Conectar diseño a una tabla física existente.")}
            <div className="nexus-content fill center stack--loose" style={{ padding: '24px' }}>
                <div style={{ textAlign: 'center', opacity: 0.5 }}>
                    <IndraIcon name="RELATION" size="48px" />
                    <p style={{ fontSize: '11px', marginTop: '12px', maxWidth: '240px' }}>
                        Esta acción asocia permanentemente este esquema con un archivo de datos local o externo.
                    </p>
                </div>
                
                <button className="btn btn--accent" onClick={() => setShowSelector(true)}>
                    SELECCIONAR ARCHIVO DESTINO
                </button>
            </div>

            {showSelector && (
                <ArtifactSelector 
                    title="VINCULAR CON..." 
                    onSelect={handleLink}
                    onCancel={() => setShowSelector(false)}
                />
            )}
        </div>
    );
}

// 4. FLUJO: HIDRATACIÓN INDUSTRIAL (TRANSFERENCIA SOBERANA)
function PathHydrate({ atom, coreUrl, sessionSecret, onBack, renderHeader }) {
    const [source, setSource] = useState(null); // { id, provider, handle }
    const [mapping, setMapping] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [sourceOptions, setSourceOptions] = useState([]);

    // Efecto de Hidratación de Origen
    useEffect(() => {
        if (source) {
            executeDirective({
                provider: source.provider || 'notion',
                protocol: 'TABULAR_STREAM',
                context_id: source.id,
                data: { limit: 1 } // Solo headers
            }, coreUrl, sessionSecret).then(res => {
                if (res.metadata?.schema?.fields) {
                    const options = res.metadata.schema.fields.map(h => ({
                        value: h.id || h.key,
                        label: h.label || h.key
                    }));
                    setSourceOptions(options);
                }
            }).catch(e => toastEmitter.error("No se pudo leer la estructura del origen."));
        }
    }, [source, coreUrl, sessionSecret]);

    const handleExecute = async () => {
        setIsProcessing(true);
        try {
            const result = await executeDirective({
                provider: 'automation',
                protocol: 'INDUSTRIAL_IGNITE',
                data: {
                    source_id: source.id,
                    source_provider: source.provider || 'notion',
                    target_id: atom.payload?.target_silo_id,
                    target_provider: atom.payload?.target_provider || 'sheets',
                    mapping: mapping,
                    mode: 'OVERWRITE'
                }
            }, coreUrl, sessionSecret);

            if (result.metadata?.status === 'OK') {
                toastEmitter.success("Ingesta industrial completada.");
                onBack();
            }
        } catch (e) {
            toastEmitter.error("Fallo en la ejecución del Bridge.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!source) {
        return (
            <div className="nexus-path fill stack">
                {renderHeader("TRANSFERIR DATOS", "Seleccionar silo de origen para hidratación.")}
                <div className="nexus-content fill center" style={{ padding: '24px' }}>
                    <SiloFractalExplorer 
                        coreUrl={coreUrl} 
                        sessionSecret={sessionSecret} 
                        onSelect={setSource} 
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="nexus-path fill stack">
            {renderHeader("MAPEO DE HIDRATACIÓN", `Desde: ${source.handle?.label || source.id}`)}
            <div className="nexus-content fill stack--loose" style={{ padding: '20px', overflowY: 'auto' }}>
                <div className="mapping-container glass" style={{ padding: '16px', borderRadius: '12px' }}>
                    <FieldMapper 
                        targetId={atom.id}
                        schema={{ fields: atom.payload?.fields || [] }}
                        mapping={mapping}
                        mappingOptions={sourceOptions}
                        config={{ action: 'APPEND' }}
                        onUpdateMapping={setMapping}
                        onUpdateConfig={() => {}}
                    />
                </div>
            </div>
            <div className="nexus-footer shelf--tight" style={{ padding: '20px', background: 'rgba(255,255,255,0.02)' }}>
                <button className="btn btn--ghost" onClick={() => setSource(null)} style={{ flex: 1 }}>CAMBIAR ORIGEN</button>
                <button className="btn btn--accent" onClick={handleExecute} disabled={isProcessing || Object.keys(mapping).length === 0} style={{ flex: 2 }}>
                    {isProcessing ? "INGESTANDO..." : "EJECUTAR TRANSFERENCIA"}
                </button>
            </div>
        </div>
    );
}
