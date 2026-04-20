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
import ArtifactSelector from '../../utilities/ArtifactSelector';

export function SchemaNexusControl({ atom, bridge, onUpdate, onFieldsImported }) {
    const [currentPath, setCurrentPath] = useState('MENU'); // MENU, IGNITE, IMPORT_DNA, LINK, HYDRATE
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Estados compartidos
    const services = useAppState(s => s.services || []);
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);
    const activeWorkspaceId = useAppState(s => s.activeWorkspaceId);

    const tabularProviders = services.filter(s => 
        s.protocols?.includes('TABULAR_STREAM') && s.id !== 'system'
    );

    const renderHeader = (title, subtitle) => (
        <div className="nexus-header shelf--loose" style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <button className="btn btn--xs btn--ghost" onClick={() => setCurrentPath('MENU')} style={{ width: '32px', height: '32px', borderRadius: '50%' }}>
                <IndraIcon name="BACK" size="14px" />
            </button>
            <div className="stack--none">
                <h2 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--indra-dynamic-accent)' }}>{title}</h2>
                <span style={{ fontSize: '10px', opacity: 0.5 }}>{subtitle}</span>
            </div>
        </div>
    );

    if (currentPath === 'MENU') {
        return (
            <div className="nexus-menu fill stack" style={{ padding: '24px', background: 'var(--color-bg-void)', borderRadius: '12px' }}>
                <div className="stack--none" style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '-0.02em' }}>GESTIÓN DE ALMACENAMIENTO</h1>
                    <p style={{ fontSize: '11px', opacity: 0.5 }}>Seleccione cómo desea conectar este esquema con el mundo físico.</p>
                </div>

                <div className="nexus-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px',
                    flex: 1
                }}>
                    <MenuCard 
                        icon="VAULT" 
                        title="Crear Nueva" 
                        desc="Generar una nueva tabla física desde cero." 
                        onClick={() => setCurrentPath('IGNITE')} 
                    />
                    <MenuCard 
                        icon="SEARCH" 
                        title="Importar ADN" 
                        desc="Traer campos de una tabla existente al diseño." 
                        onClick={() => setCurrentPath('IMPORT_DNA')} 
                    />
                    <MenuCard 
                        icon="RELATION" 
                        title="Vincular Existente" 
                        desc="Conectar este diseño a una tabla física activa." 
                        onClick={() => setCurrentPath('LINK')} 
                    />
                    <MenuCard 
                        icon="SYNC" 
                        title="Transferir Datos" 
                        desc="Mover registros entre tablas mediante mapeo." 
                        onClick={() => setCurrentPath('HYDRATE')} 
                    />
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
                providers={tabularProviders}
                onComplete={onUpdate}
                onBack={() => setCurrentPath('MENU')}
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

    return null;
}

// --- SUB-COMPONENTES DE APOYO ---

function MenuCard({ icon, title, desc, onClick }) {
    return (
        <div className="nexus-card glass-hover" onClick={onClick} style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'all 0.2s ease'
        }}>
            <IndraIcon name={icon} size="24px" color="var(--indra-dynamic-accent)" />
            <div className="stack--none">
                <h3 style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>{title.toUpperCase()}</h3>
                <p style={{ fontSize: '10px', opacity: 0.4, lineHeight: '1.4' }}>{desc}</p>
            </div>
        </div>
    );
}

// 1. FLUJO: IGNITAR (CREAR NUEVA)
function PathIgnite({ atom, coreUrl, sessionSecret, activeWorkspaceId, providers, onComplete, onBack, renderHeader }) {
    const [selectedProvider, setSelectedProvider] = useState(providers[0]?.id || '');
    const [targetFolder, setTargetFolder] = useState({ id: activeWorkspaceId, title: 'Carpeta del Workspace' });
    const [showFolderSelector, setShowFolderSelector] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAction = async () => {
        setIsProcessing(true);
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_SCHEMA_IGNITE',
                context_id: atom.id,
                data: { target_provider: selectedProvider, parent_id: targetFolder.id }
            }, coreUrl, sessionSecret);

            if (result.metadata?.status === 'OK') {
                toastEmitter.success("Base de datos creada y vinculada.");
                onComplete(result.items[0]);
            } else {
                toastEmitter.error(result.metadata?.error || "Error en creación física.");
            }
        } catch (e) { toastEmitter.error("Fallo crítico en el motor."); }
        finally { setIsProcessing(false); }
    };

    return (
        <div className="nexus-path fill stack">
            {renderHeader("CREAR NUEVA BASE DE DATOS", "Generación de materia física desde el diseño.")}
            <div className="nexus-content fill stack--loose" style={{ padding: '24px' }}>
                <div className="stack--tight">
                    <label className="font-mono" style={{ fontSize: '9px', opacity: 0.5 }}>MOTOR_DESTINO</label>
                    <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="indra-select">
                        {providers.map(p => <option key={p.id} value={p.id}>{p.id.toUpperCase()}</option>)}
                    </select>
                </div>

                <div className="location-picker stack--tight" onClick={() => setShowFolderSelector(true)} style={{ padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', cursor: 'pointer' }}>
                    <label className="font-mono" style={{ fontSize: '9px', opacity: 0.5 }}>UBICACIÓN_DESTINO</label>
                    <div className="shelf--tight" style={{ marginTop: '4px' }}>
                        <IndraIcon name="FOLDER" size="14px" />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{targetFolder.title}</span>
                    </div>
                </div>

                <div style={{ flex: 1 }} />
                
                <button className="btn btn--accent" onClick={handleAction} disabled={isProcessing} style={{ height: '50px', borderRadius: '12px' }}>
                    {isProcessing ? "CREANDO..." : "INICIAR CREACIÓN FÍSICA"}
                </button>
            </div>

            {showFolderSelector && (
                <ArtifactSelector 
                    title="SELECCIONAR CARPETA" 
                    filter={{ class: 'FOLDER' }} 
                    onSelect={f => { setTargetFolder({ id: f.id, title: f.handle?.label || f.id }); setShowFolderSelector(false); }}
                    onCancel={() => setShowFolderSelector(false)}
                />
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

            if (result.metadata?.headers) {
                // Transformar cabeceras en campos de SchemaDesigner
                const newFields = result.metadata.headers.map(h => ({
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

// 4. FLUJO: HIDRATAR (TRANSFERENCIA)
function PathHydrate({ atom, coreUrl, sessionSecret, renderHeader }) {
    const [step, setStep] = useState('SOURCE'); // SOURCE, MAPPING, SYNCING
    const [sourceFile, setSourceFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    if (step === 'SOURCE') {
        return (
            <div className="nexus-path fill stack">
                {renderHeader("TRANSFERIR DATOS", "Paso 1: Seleccionar origen de datos.")}
                <div className="nexus-content fill center stack--loose" style={{ padding: '24px' }}>
                    <div style={{ textAlign: 'center', opacity: 0.5 }}>
                        <IndraIcon name="SYNC" size="48px" />
                        <p style={{ fontSize: '11px', marginTop: '12px', maxWidth: '240px' }}>
                            Mueva registros desde otra tabla a la base de datos vinculada a este esquema.
                        </p>
                    </div>
                    <button className="btn btn--accent" onClick={() => setStep('PICKER')}>SELECCIONAR ORIGEN</button>
                </div>
                {step === 'PICKER' && <ArtifactSelector onSelect={f => { setSourceFile(f); setStep('MAPPING'); }} onCancel={() => setStep('SOURCE')} />}
            </div>
        );
    }

    if (step === 'MAPPING') {
        return (
            <div className="nexus-path fill stack">
                {renderHeader("MAPEADO DE CAMPOS", "Paso 2: Relacionar columnas origen/destino.")}
                <div className="nexus-content fill stack--loose" style={{ padding: '24px' }}>
                    <div className="mapping-info stack--none" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <span style={{ fontSize: '9px', opacity: 0.5 }}>ORIGEN</span>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{sourceFile.handle?.label}</span>
                    </div>

                    <p style={{ fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>
                        Se realizará una sincronización industrial basada en compatibilidad de nombres.
                    </p>

                    <div style={{ flex: 1 }} />
                    <button className="btn btn--accent" onClick={async () => {
                        setIsProcessing(true);
                        try {
                            const res = await executeDirective({
                                provider: 'automation',
                                protocol: 'INDUSTRIAL_SYNC',
                                data: {
                                    source_id: sourceFile.id,
                                    target_id: atom.payload.target_silo_id,
                                    mode: 'SMART_MAPPING'
                                }
                            }, coreUrl, sessionSecret);
                            if (res.metadata?.status === 'OK') toastEmitter.success("Transferencia completada.");
                            else toastEmitter.error("Fallo al inyectar datos.");
                        } catch (e) { toastEmitter.error("Fallo de comunicación industrial."); }
                        finally { setIsProcessing(false); setStep('SOURCE'); }
                    }}>
                        {isProcessing ? "SINCRONIZANDO..." : "INICIAR TRANSFERENCIA"}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
