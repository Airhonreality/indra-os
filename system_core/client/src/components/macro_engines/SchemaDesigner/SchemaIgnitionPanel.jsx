/**
 * =============================================================================
 * ARTEFACTO: SchemaIgnitionPanel.jsx
 * RESPONSABILIDAD: Gestionar el Paso de Idea (Esquema) a Materia (Silo).
 * 
 * DHARMA (Agnosticismo Crítico):
 *   - Un Esquema sin Silo es un Planeta sin Gravedad.
 *   - Este panel permite al arquitecto "Ignitar" el universo físico.
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

    const [isIgniting, setIsIgniting] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('drive');

    // Filtrar proveedores que soportan creación tabular
    const tabularProviders = services.filter(s => 
        s.protocols?.includes('ATOM_CREATE') && 
        s.id !== 'system'
    );

    const targetSiloId = atom.payload?.target_silo_id;
    const targetProvider = atom.payload?.target_provider;

    const handleIgnite = async () => {
        if (isIgniting) return;
        setIsIgniting(true);
        
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
                toastEmitter.success("¡Ignición completada! El ADN ha cobrado vida.");
                onIgnited(result.items[0]);
            } else {
                toastEmitter.error("Fallo en la ignición: " + (result.metadata?.error || 'Error desconocido'));
            }
        } catch (err) {
            console.error("[Ignition] Critical error:", err);
            toastEmitter.error("Error crítico del sistema durante la ignición.");
        } finally {
            setIsIgniting(false);
        }
    };

    // ESTADO 1: INCARNATED (Ya tiene materia)
    if (targetSiloId) {
        return (
            <div className="ignition-panel stack--loose fill center">
                <div className="center stack--tight" style={{ opacity: 0.8 }}>
                    <div className="resonance-glow-accent center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--indra-dynamic-accent)', color: 'var(--color-bg-void)' }}>
                        <IndraIcon name="VAULT" size="24px" />
                    </div>
                    <span className="font-mono" style={{ fontSize: '10px', fontWeight: '900', marginTop: 'var(--space-4)', letterSpacing: '0.1em' }}>ESQUEMA_MANIFESTADO</span>
                </div>

                <div className="stack--tight shelf--center" style={{ width: '100%', marginTop: 'var(--space-6)' }}>
                    <div className="terminal-inset shelf--tight" style={{ padding: 'var(--space-4)', width: '280px' }}>
                        <IndraIcon name={targetProvider === 'drive' ? 'FOLDER' : 'DATABASE'} size="14px" color="var(--indra-dynamic-accent)" />
                        <div className="stack--none">
                            <span style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase' }}>Proveedor: {targetProvider}</span>
                            <span className="font-mono" style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{targetSiloId}</span>
                        </div>
                    </div>
                    <span style={{ fontSize: '9px', opacity: 0.4, textAlign: 'center', maxWidth: '240px' }}>
                        Este mapa ya está sincronizado con su territorio físico. Cualquier cambio en el ADN se reflejará en la estructura del silo.
                    </span>
                </div>
            </div>
        );
    }

    // ESTADO 2: IGNITING (En proceso)
    if (isIgniting) {
        return (
            <div className="ignition-panel fill center unselectable">
                <div className="stack--loose center">
                    <div className="indra-spin center" style={{ width: '64px', height: '64px', border: '2px solid var(--indra-dynamic-accent)', borderTopColor: 'transparent', borderRadius: '50%' }}>
                        <IndraIcon name="DNA" size="24px" className="pulse" />
                    </div>
                    <div className="stack--none center">
                        <span className="font-mono" style={{ fontSize: '12px', fontWeight: '900', color: 'var(--indra-dynamic-accent)' }}>GENESIS_EN_CURSO</span>
                        <span style={{ fontSize: '9px', opacity: 0.5 }}>Imprimiendo materia física...</span>
                    </div>
                </div>
            </div>
        );
    }

    // ESTADO 3: ORPHAN (Falta materia)
    return (
        <div className="ignition-panel stack--loose fill center" style={{ padding: 'var(--space-8)' }}>
            <div className="center stack--tight" style={{ opacity: 0.3, marginBottom: 'var(--space-6)' }}>
                <IndraIcon name="SCHEMA" size="48px" />
                <span className="font-mono" style={{ fontSize: '10px', letterSpacing: '0.1em' }}>ESQUEMA_EN_POTENCIA</span>
            </div>

            <div className="stack--loose center" style={{ maxWidth: '300px' }}>
                <p style={{ fontSize: '11px', textAlign: 'center', lineHeight: '1.6', opacity: 0.7 }}>
                    Este esquema existe como <b>Idea Pura</b>. Para poder guardar datos reales, primero debes <b>Ignitar</b> su materia física en un proveedor.
                </p>

                <div className="stack--tight" style={{ width: '100%' }}>
                    <label className="font-mono" style={{ fontSize: '9px', opacity: 0.5 }}>SELECCIONAR DESTINO</label>
                    <div className="shelf--tight wrap center" style={{ gap: 'var(--space-2)' }}>
                        {tabularProviders.map(p => (
                            <button 
                                key={p.id}
                                className={`btn btn--xs ${selectedProvider === p.id ? 'btn--accent' : 'btn--ghost'}`}
                                onClick={() => setSelectedProvider(p.id)}
                                style={{ padding: '4px 12px', borderRadius: '12px', border: 'none', background: selectedProvider === p.id ? 'var(--indra-dynamic-accent)' : 'var(--color-bg-deep)' }}
                            >
                                {p.id.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    className="btn btn--accent shadow-hover" 
                    onClick={handleIgnite}
                    style={{ 
                        width: '100%',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        marginTop: 'var(--space-4)',
                        border: 'none',
                        boxShadow: '0 0 20px var(--indra-dynamic-glow)'
                    }}
                >
                    <IndraIcon name="MAGIC" size="16px" />
                    <span style={{ marginLeft: '12px', fontWeight: '900', fontSize: '12px', letterSpacing: '0.05em' }}>IGNITAR MATERIA FÍSICA</span>
                </button>
                
                <span className="font-mono" style={{ fontSize: '8px', opacity: 0.3, marginTop: 'var(--space-2)' }}>
                    ESTE ACTO CREARÁ UNA TABLA EN {selectedProvider.toUpperCase()}
                </span>
            </div>
        </div>
    );
}
