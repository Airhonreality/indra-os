/**
 * =============================================================================
 * ARTEFACTO: SchemaIgnitionPanel.jsx
 * RESPONSABILIDAD: Gestión de Provisionamiento de Almacenamiento (Sheets/DB).
 * 
 * DHARMA (Sinceridad de Interfaz):
 *   - Traditional UI: Usar términos claros (Base de Datos, Almacén) en lugar de abstractos.
 *   - Honestidad: Explicar qué archivos se crearán y dónde.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { useAppState } from '../../../state/app_state';
import { executeDirective } from '../../../services/directive_executor';
import { toastEmitter } from '../../../services/toastEmitter';

export function SchemaIgnitionPanel({ atom, bridge, onIgnited }) {
    const services = useAppState(s => s.services || []);
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);

    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('drive');

    // Filtrar proveedores que soportan el flujo de datos tabular (Silos reales)
    const tabularProviders = services.filter(s => 
        s.protocols?.includes('TABULAR_STREAM') && 
        s.id !== 'system'
    );

    const targetSiloId = atom.payload?.target_silo_id;
    const targetProvider = atom.payload?.target_provider;

    const handleProvision = async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        
        try {
            const result = await executeDirective({
                provider: 'system',
                protocol: 'SYSTEM_SCHEMA_IGNITE',
                context_id: atom.id,
                data: {
                    target_provider: selectedProvider
                }
            }, coreUrl, sessionSecret);

            if (result.metadata?.status === 'OK' && result.items?.[0]) {
                toastEmitter.success("Base de datos vinculada con éxito.");
                onIgnited(result.items[0]);
            } else {
                toastEmitter.error("Error al provisionar: " + (result.metadata?.error || 'Desconocido'));
            }
        } catch (err) {
            console.error("[Provisioning] Critical error:", err);
            toastEmitter.error("Error crítico en el servicio de creación.");
        } finally {
            setIsProcessing(false);
        }
    };

    // ESTADO 1: VINCULADO (Ya tiene almacenamiento)
    if (targetSiloId) {
        return (
            <div className="provision-panel stack--loose fill center" style={{ padding: '40px' }}>
                <div className="center stack--tight" style={{ opacity: 0.8 }}>
                    <div className="status-badge status--stable center" style={{ padding: '8px 16px', borderRadius: '20px', gap: '8px', background: 'var(--indra-dynamic-accent)', color: 'var(--color-bg-void)' }}>
                        <IndraIcon name="VAULT" size="14px" />
                        <span className="font-mono" style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em' }}>BASE_DE_DATOS_VINCULADA</span>
                    </div>
                </div>

                <div className="stack--loose center" style={{ width: '100%', maxWidth: '400px' }}>
                    <div className="terminal-inset stack--none" style={{ padding: '20px', width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                        <div className="shelf--tight" style={{ marginBottom: '10px' }}>
                            <IndraIcon name={targetProvider === 'drive' ? 'FOLDER' : 'DATABASE'} size="16px" color="var(--indra-dynamic-accent)" />
                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--indra-dynamic-accent)' }}>ALMACÉN FÍSICO ({targetProvider.toUpperCase()})</span>
                        </div>
                        <div className="font-mono" style={{ fontSize: '11px', opacity: 0.8, wordBreak: 'break-all', textAlign: 'left' }}>
                            ID: {targetSiloId}
                        </div>
                    </div>
                    <p style={{ fontSize: '11px', opacity: 0.5, textAlign: 'center', lineHeight: '1.6' }}>
                        Esta estructura de datos está vinculada a una ubicación física. Cualquier cambio en los campos se sincronizará automáticamente con el almacenamiento.
                    </p>
                </div>
            </div>
        );
    }

    // ESTADO 2: PROCESANDO
    if (isProcessing) {
        return (
            <div className="provision-panel fill center">
                <div className="stack--loose center">
                    <div className="indra-spin" style={{ width: '48px', height: '48px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--indra-dynamic-accent)', borderRadius: '50%' }}></div>
                    <div className="stack--none center">
                        <span className="font-mono" style={{ fontSize: '11px', fontWeight: '900', color: 'var(--indra-dynamic-accent)' }}>PROVISIONANDO_ESTRUCTURA...</span>
                        <span style={{ fontSize: '9px', opacity: 0.5 }}>Configurando tablas en {selectedProvider.toUpperCase()}</span>
                    </div>
                </div>
            </div>
        );
    }

    // ESTADO 3: PENDIENTE (Necesita Creación)
    return (
        <div className="provision-panel fill center" style={{ padding: '60px' }}>
            <div className="stack--loose center" style={{ maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ marginBottom: '20px', opacity: 0.1 }}>
                    <IndraIcon name="SCHEMA" size="64px" />
                </div>
                
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px', color: 'white' }}>Finalizar Configuración del Esquema</h2>
                <p style={{ fontSize: '12px', opacity: 0.6, lineHeight: '1.6', marginBottom: '30px' }}>
                    Has definido la estructura del <b>{atom.handle?.label || 'Proyecto'}</b>, pero aún no tiene un lugar donde guardar los datos reales.
                </p>

                <div className="stack--tight" style={{ width: '100%', marginBottom: '25px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label className="font-mono" style={{ fontSize: '9px', opacity: 0.5, marginBottom: '12px', display: 'block' }}>SELECCIONAR DESTINO DEL ALMACENAMIENTO</label>
                    <div className="shelf--tight wrap center">
                        {tabularProviders.map(p => (
                            <button 
                                key={p.id}
                                className={`btn btn--xs ${selectedProvider === p.id ? 'active' : ''}`}
                                onClick={() => setSelectedProvider(p.id)}
                                style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '8px', 
                                    border: '1px solid',
                                    borderColor: selectedProvider === p.id ? 'var(--indra-dynamic-accent)' : 'rgba(255,255,255,0.1)',
                                    background: selectedProvider === p.id ? 'var(--indra-dynamic-accent)' : 'transparent',
                                    color: selectedProvider === p.id ? 'black' : 'white',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    margin: '0 4px'
                                }}
                            >
                                {p.id.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="stack--tight" style={{ width: '100%' }}>
                    <button 
                        className="btn btn--accent shadow-glow" 
                        onClick={handleProvision}
                        style={{ 
                            width: '100%',
                            height: '54px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--indra-dynamic-accent)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px'
                        }}
                    >
                        <IndraIcon name={selectedProvider === 'drive' ? 'FOLDER' : 'DATABASE'} size="20px" color="black" />
                        <span style={{ fontWeight: '900', fontSize: '13px', letterSpacing: '0.05em', color: 'black' }}>
                            CREAR BASE DE DATOS EN {selectedProvider.toUpperCase()}
                        </span>
                    </button>
                    
                    <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.1)' }}>
                        <span style={{ fontSize: '10px', opacity: 0.5, lineHeight: '1.4', display: 'block', textAlign: 'left' }}>
                            <IndraIcon name="INFO" size="10px" style={{ marginBottom: '-1px', marginRight: '6px' }} />
                            <b>Este acto es una creación física:</b> Se generará una nueva hoja de cálculo en tu cuenta con las columnas correspondientes a tus campos.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
