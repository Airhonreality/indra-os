/**
 * =============================================================================
 * ARTEFACTO: components/dashboard/ResonanceTuningPanel.jsx
 * RESPONSABILIDAD: Sintonía de esquemas externos (Nexus/Resonancia).
 *
 * DHARMA:
 *   - Sinceridad de Origen: Muestra de dónde viene el dato.
 *   - Sintonía Biyectiva: Control total sobre el flujo de verdad.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';

export function ResonanceTuningPanel({ artifact, onConfirm, onCancel }) {
    const [mode, setMode] = useState('MIRROR'); // MIRROR | SOVEREIGN
    const [frequency, setFrequency] = useState('LATENT'); // LOW | LATENT | VITAL
    const [mutedFields, setMutedFields] = useState([]);

    const fields = artifact.payload?.fields || [];
    const provider = artifact.provider || 'UNKNOWN';

    const toggleField = (id) => {
        setMutedFields(prev => 
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleConfirm = () => {
        const resonantAtom = {
            ...artifact,
            origin: 'RESONANT',
            resonance_config: {
                mode,
                frequency,
                mutedFields
            }
        };
        onConfirm(resonantAtom);
    };

    return (
        <div className="selector-overlay center" style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(20px)',
            zIndex: 1100
        }}>
            <div className="indra-container stack" style={{
                width: '600px',
                maxHeight: '80vh',
                background: 'var(--color-bg-void)',
                border: '1px solid var(--indra-dynamic-border)',
                borderRadius: 'var(--indra-ui-radius)',
                padding: 'var(--space-6)',
                boxShadow: '0 0 50px rgba(var(--rgb-accent), 0.1)'
            }}>
                {/* HEADER: DISECCIÓN LÓGICA */}
                <header className="spread" style={{ marginBottom: 'var(--space-6)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'var(--space-4)' }}>
                    <div className="shelf--tight">
                        <div className="pulse-cyan" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-accent)' }} />
                        <div className="stack--tight">
                            <h2 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', letterSpacing: '2px' }}>
                                SINTONIZAR_RESPONSABILIDAD
                            </h2>
                            <span style={{ fontSize: '9px', opacity: 0.4 }}>
                                ORIGEN: {provider.toUpperCase()} // ID: {artifact.id.substring(0, 16)}...
                            </span>
                        </div>
                    </div>
                    <button onClick={onCancel} className="btn-icon">
                        <IndraIcon name="CLOSE" size="14px" />
                    </button>
                </header>

                <div className="spread fill" style={{ gap: 'var(--space-6)', overflow: 'hidden' }}>
                    {/* IZQUIERDA: MAPA DE CAMPOS (ADUANA) */}
                    <div className="stack--tight fill" style={{ overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
                        <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)', marginBottom: 'var(--space-2)' }}>FILTRO_DE_INGESTA</span>
                        {fields.map(f => (
                            <div key={f.id} 
                                className={`spread glass-hover ${mutedFields.includes(f.id) ? 'opacity-30' : ''}`}
                                style={{ 
                                    padding: 'var(--space-2) var(--space-3)', 
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255,255,255,0.02)',
                                    marginBottom: '2px'
                                }}
                                onClick={() => toggleField(f.id)}
                            >
                                <div className="shelf--tight">
                                    <IndraIcon name={mutedFields.includes(f.id) ? 'CLOSE' : 'CHECK'} size="10px" color={mutedFields.includes(f.id) ? 'var(--color-danger)' : 'var(--color-accent)'} />
                                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{f.id.toUpperCase()}</span>
                                </div>
                                <span style={{ fontSize: '7px', opacity: 0.4 }}>{f.type}</span>
                            </div>
                        ))}
                    </div>

                    {/* DERECHA: SENTIDO DE LA VERDAD Y FRECUENCIA */}
                    <div className="stack" style={{ width: '220px', gap: 'var(--space-6)' }}>
                        {/* MODO DE RESONANCIA */}
                        <div className="stack--tight">
                            <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>SENTIDO_DE_LA_VERDAD</span>
                            <div className="stack--tight" style={{ marginTop: 'var(--space-2)' }}>
                                <button 
                                    className={`btn btn--xs ${mode === 'MIRROR' ? 'btn--accent' : 'btn--ghost'}`}
                                    onClick={() => setMode('MIRROR')}
                                    style={{ justifyContent: 'flex-start', padding: '10px' }}
                                >
                                    <div className="stack--tight" style={{ textAlign: 'left' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>REFLEJO PASIVO</span>
                                        <span style={{ fontSize: '7px', opacity: 0.6 }}>Solo lectura. INDRA observa.</span>
                                    </div>
                                </button>
                                <button 
                                    className={`btn btn--xs ${mode === 'SOVEREIGN' ? 'btn--accent' : 'btn--ghost'}`}
                                    onClick={() => setMode('SOVEREIGN')}
                                    style={{ justifyContent: 'flex-start', padding: '10px' }}
                                >
                                    <div className="stack--tight" style={{ textAlign: 'left' }}>
                                        <span style={{ fontSize: '10px', fontWeight: 'bold' }}>COMANDO ACTIVO</span>
                                        <span style={{ fontSize: '7px', opacity: 0.6 }}>Bidireccional. INDRA muta.</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* FRECUENCIA DE PRESENCIA */}
                        <div className="stack--tight">
                            <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>FRECUENCIA_DE_PRESENCIA</span>
                            <input 
                                type="range" 
                                min="0" max="2" step="1"
                                value={frequency === 'LOW' ? 0 : frequency === 'LATENT' ? 1 : 2}
                                onChange={(e) => {
                                    const v = parseInt(e.target.value);
                                    setFrequency(v === 0 ? 'LOW' : v === 1 ? 'LATENT' : 'VITAL');
                                }}
                                style={{ width: '100%', marginTop: 'var(--space-3)' }}
                            />
                            <div className="spread" style={{ marginTop: 'var(--space-2)' }}>
                                <span style={{ fontSize: '7px', opacity: frequency === 'LOW' ? 1 : 0.3 }}>BAJA</span>
                                <span style={{ fontSize: '7px', opacity: frequency === 'LATENT' ? 1 : 0.3 }}>LATENTE</span>
                                <span style={{ fontSize: '7px', opacity: frequency === 'VITAL' ? 1 : 0.3 }}>VITAL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACCIÓN FINAL */}
                <footer style={{ marginTop: 'var(--space-8)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 'var(--space-6)' }}>
                    <IndraActionTrigger 
                        label="ESTABLECER VÍNCULO DETERMINISTA"
                        onClick={handleConfirm}
                        variant="accent"
                        size="large"
                        fullWidth
                    />
                </footer>
            </div>

            <style>{`
                .indra-container {
                    animation: indra-panel-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes indra-panel-enter {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                input[type='range'] {
                    -webkit-appearance: none;
                    background: rgba(255,255,255,0.1);
                    height: 2px;
                    border-radius: 2px;
                }
                input[type='range']::-webkit-scrollbar-thumb {
                    -webkit-appearance: none;
                    width: 12px;
                    height: 12px;
                    background: var(--color-accent);
                    border-radius: 50%;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
}
