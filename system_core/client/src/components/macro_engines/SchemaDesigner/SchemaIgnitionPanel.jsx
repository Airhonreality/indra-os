/**
 * =============================================================================
 * ARTEFACTO: SchemaIgnitionPanel.jsx
 * RESPONSABILIDAD: Orquestación de Materialización Física (Schema to DB).
 * DOGMA: TRÍPTICO DE AGENCIA / DESACOPLAMIENTO TOTAL.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useAppState } from '../../../state/app_state';
import { toastEmitter } from '../../../services/toastEmitter';
import ArtifactSelector from '../../utilities/ArtifactSelector';

export function SchemaIgnitionPanel({ atom, bridge, onIgnited }) {
    const services = useAppState(s => s.services || []);
    const activeWorkspaceId = useAppState(s => s.activeWorkspaceId);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedProviderId, setSelectedProviderId] = useState('');
    const [targetFolder, setTargetFolder] = useState({ 
        id: activeWorkspaceId || 'ROOT', 
        title: activeWorkspaceId ? 'Carpeta del Workspace' : 'Mi Unidad (Google Drive)' 
    });
    const [showFolderSelector, setShowFolderSelector] = useState(false);

    // 1. DESCUBRIMIENTO DE CAPACIDADES (Filtrar proveedores que soporten TABULAR_STREAM)
    const tabularProviders = services.filter(s => 
        s.protocols?.includes('TABULAR_STREAM') && 
        s.id !== 'system'
    );

    // Auto-selección del primer proveedor si hay uno (ej: 'sheets')
    useEffect(() => {
        if (!selectedProviderId && tabularProviders.length > 0) {
            // Preferir 'sheets' por defecto si existe
            const defaultProv = tabularProviders.find(p => p.id === 'sheets') || tabularProviders[0];
            setSelectedProviderId(defaultProv.id);
        }
    }, [tabularProviders]);

    const handleProvision = async () => {
        if (!selectedProviderId) return toastEmitter.error("Seleccione un motor de base de datos.");
        if (isProcessing) return;
        setIsProcessing(true);
        
        try {
            const result = await bridge.execute({
                provider: 'system',
                protocol: 'SYSTEM_SCHEMA_IGNITE',
                context_id: atom.id,
                data: {
                    mode: 'IN_PLACE_IGNITION',
                    target_provider: selectedProviderId,
                    parent_id: targetFolder.id
                }
            });

            if (result.metadata?.status === 'OK' && result.items?.[0]) {
                toastEmitter.success("Estructura materializada con éxito.");
                onIgnited(result.items[0]);
            } else {
                toastEmitter.error("Error al materializar: " + (result.metadata?.error || 'Desconocido'));
            }
        } catch (err) {
            console.error("[Materialization] Critical error:", err);
            toastEmitter.error("Error crítico en el servicio de materialización.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isProcessing) {
        return (
            <div className="provision-panel fill center">
                <div className="stack--loose center">
                    <div className="indra-spin" style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--indra-dynamic-accent)', borderRadius: '50%' }}></div>
                    <div className="stack--none center">
                        <span className="font-mono" style={{ fontSize: '11px', fontWeight: '900', color: 'var(--indra-dynamic-accent)' }}>MATERIALIZANDO_FÍSICAMENTE...</span>
                        <span style={{ fontSize: '9px', opacity: 0.5 }}>Creando tabla en: {targetFolder.title}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="provision-panel fill indra-layout-triptych" style={{ 
            display: 'grid', 
            gridTemplateColumns: '28% 44% 28%', 
            height: '100%',
            background: 'var(--color-bg-void)',
            color: 'white',
            borderRadius: '12px',
            overflow: 'hidden'
        }}>
            
            {/* LADO IZQUIERDO: CONTEXTO / TÍTULO */}
            <div className="triptych-side center stack" style={{ padding: 'var(--space-8)', borderRight: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ opacity: 0.2, marginBottom: '20px' }}>
                    <IndraIcon name="VAULT" size="48px" />
                </div>
                <h1 style={{ 
                    fontSize: '24px', 
                    fontWeight: '900', 
                    textAlign: 'right', 
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    lineHeight: '1',
                    color: 'var(--indra-dynamic-accent)'
                }}>
                    Finalizar<br/>Configuración<br/>del Esquema
                </h1>
            </div>

            {/* CENTRO: CUERPO / SELECCIÓN DE DESTINO */}
            <div className="triptych-main stack center" style={{ padding: 'var(--space-12)' }}>
                <div className="stack--loose" style={{ maxWidth: '320px' }}>
                    <p style={{ fontSize: '12px', opacity: 0.6, lineHeight: '1.6' }}>
                        Has definido la estructura del <strong style={{color:'white'}}>"{atom.handle?.label || 'Sin título'}"</strong>, pero aún no tiene un lugar donde guardar los datos reales.
                    </p>

                    <div 
                        className="location-card glass-hover" 
                        onClick={() => setShowFolderSelector(true)}
                        style={{ 
                            padding: '24px', 
                            borderRadius: '16px', 
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginTop: '20px',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ marginBottom: '12px', opacity: 0.4 }}>
                            <IndraIcon name="FOLDER" size="32px" />
                        </div>
                        <span className="font-mono" style={{ fontSize: '9px', opacity: 0.4, display: 'block', marginBottom: '4px' }}>DESTINO DEL ALMACENAMIENTO</span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{targetFolder.title}</span>
                        <div style={{ marginTop: '12px', fontSize: '10px', color: 'var(--indra-dynamic-accent)', fontWeight: 'bold' }}>
                            CAMBIAR UBICACIÓN
                        </div>
                    </div>
                </div>
            </div>

            {/* LADO DERECHO: ACCIÓN / PROVEEDOR */}
            <div className="triptych-side center stack" style={{ padding: 'var(--space-8)', borderLeft: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                <div className="stack--loose" style={{ width: '100%' }}>
                    
                    {/* Selector de Proveedor */}
                    <div className="stack--tight">
                        <label className="font-mono" style={{ fontSize: '9px', opacity: 0.5, textAlign: 'left', display: 'block' }}>MOTOR_DB</label>
                        <select 
                            value={selectedProviderId} 
                            onChange={(e) => setSelectedProviderId(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'var(--color-bg-deep)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '10px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontFamily: 'var(--font-mono)',
                                outline: 'none'
                            }}
                        >
                            {tabularProviders.map(p => (
                                <option key={p.id} value={p.id}>{p.id.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ height: '40px' }} />

                    <button 
                        className="btn btn--accent shadow-glow" 
                        onClick={handleProvision}
                        style={{ 
                            width: '100%', 
                            height: '64px', 
                            borderRadius: '16px', 
                            border: 'none',
                            background: 'var(--indra-dynamic-accent)', 
                            cursor: 'pointer',
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center', 
                            justifyContent: 'center',
                            transition: 'transform 0.1s ease'
                        }}
                    >
                        <div className="shelf--tight" style={{ gap: '8px' }}>
                            <IndraIcon name="VAULT" size="16px" color="black" />
                            <span style={{ fontWeight: '900', fontSize: '11px', color: 'black' }}>
                                CREAR BASE DE DATOS EN {selectedProviderId.toUpperCase()}
                            </span>
                        </div>
                        <span style={{ fontSize: '8px', color: 'black', opacity: 0.5, marginTop: '4px' }}>Este acto es una creación física.</span>
                    </button>

                    <p style={{ fontSize: '9px', opacity: 0.4, marginTop: '20px', lineHeight: '1.4' }}>
                        <IndraIcon name="INFO" size="10px" style={{marginRight:'5px'}} />
                        Se generará una nueva tabla en su cuenta con las columnas correspondientes a sus campos.
                    </p>
                </div>
            </div>

            {/* Picker Fractal (ArtifactSelector) */}
            {showFolderSelector && (
                <ArtifactSelector
                    title="SELECCIONAR_UBICACIÓN_FÍSICA"
                    filter={{ class: 'FOLDER' }}
                    onSelect={(folder) => {
                        setTargetFolder({ id: folder.id, title: folder.handle?.label || folder.id });
                        setShowFolderSelector(false);
                    }}
                    onCancel={() => setShowFolderSelector(false)}
                />
            )}

        </div>
    );
}
