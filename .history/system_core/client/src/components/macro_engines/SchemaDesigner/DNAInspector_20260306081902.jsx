/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/SchemaDesigner/DNAInspector.jsx
 * RESPONSABILIDAD: Edición de la estructura cromosómica de los campos.
 *
 * DHARMA:
 *   - Sinceridad Atómica: Solo edita lo que el átomo es, no lo que hace.
 *   - Vinculación Exterior: Usa ArtifactSelector para portales de relación.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import ArtifactSelector from '../../utilities/ArtifactSelector';
import { useLexicon } from '../../../services/lexicon';
import { useAppState } from '../../../state/app_state';

export function DNAInspector({ field, onUpdate }) {
    const [showSiloSelector, setShowSiloSelector] = useState(false);
    const lang = useAppState(s => s.lang);
    const t = useLexicon(lang);

    const updateConfig = (key, value) => {
        onUpdate({
            ...field,
            config: { ...field.config, [key]: value }
        });
    };

    const handleSiloSelect = (atom) => {
        updateConfig('relation_silo_id', atom.id);
        updateConfig('relation_silo_label', atom.handle?.label);
        setShowSiloSelector(false);
    };

    return (
        <aside className="stack" style={{
            width: '320px',
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            height: '100%'
        }}>
            <div className="spread" style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', opacity: 0.6 }}>DNA_PROPERTIES</span>
                <IndraIcon name="EDIT" size="12px" opacity={0.5} />
            </div>

            <div className="fill stack" style={{ padding: 'var(--space-6)', gap: 'var(--space-6)', overflowY: 'auto' }}>

                {/* ── IDENTIDAD ── */}
                <div className="stack--tight">
                    <label className="dna-label">FIELD_LABEL</label>
                    <input
                        type="text"
                        className="dna-input"
                        value={field.label || ''}
                        onChange={e => onUpdate({ ...field, label: e.target.value })}
                    />
                </div>

                <div className="stack--tight">
                    <label className="dna-label">FIELD_ALIAS (SLUG)</label>
                    <input
                        type="text"
                        className="dna-input mono"
                        value={field.alias || ''}
                        onChange={e => onUpdate({ ...field, alias: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    />
                </div>

                <div className="stack--tight">
                    <label className="dna-label">FIELD_TYPE</label>
                    <select
                        className="dna-input"
                        value={field.type}
                        onChange={e => onUpdate({ ...field, type: e.target.value })}
                    >
                        <option value="TEXT">TEXT_STRING</option>
                        <option value="NUMBER">NUMERIC_VALUE</option>
                        <option value="DATE">TEMPORAL_MARK</option>
                        <option value="BOOLEAN">BINARY_SWITCH</option>
                        <option value="RELATION_SELECT">EXTERNAL_PORTAL (RELATION)</option>
                        <option value="REPEATER">RECURSIVE_VECTOR (REPEATER)</option>
                        <option value="FRAME">STRUCTURAL_FRAME (GROUP)</option>
                    </select>
                </div>

                <div style={{ height: '1px', background: 'var(--color-border)', margin: 'var(--space-2) 0' }}></div>

                {/* ── CONFIGURACIÓN SEGÚN TIPO ── */}
                {field.type === 'RELATION_SELECT' && (
                    <div className="stack--tight">
                        <label className="dna-label">RELATION_SOURCE</label>
                        <div
                            onClick={() => setShowSiloSelector(true)}
                            className="shelf glass-hover"
                            style={{
                                padding: 'var(--space-3)',
                                border: '1px dashed var(--color-border-strong)',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer'
                            }}
                        >
                            <IndraIcon name="FOLDER" size="14px" color="var(--color-accent)" />
                            <span style={{ fontSize: '11px', flex: 1, marginLeft: 'var(--space-2)' }}>
                                {field.config?.relation_silo_label || 'VINCULAR_SILO_DESTINO...'}
                            </span>
                        </div>
                    </div>
                )}

                <div className="stack--tight shelf">
                    <input
                        type="checkbox"
                        checked={field.config?.required || false}
                        onChange={e => updateConfig('required', e.target.checked)}
                    />
                    <label className="dna-label" style={{ margin: 0 }}>MANDATORY_FIELD</label>
                </div>

                <div className="stack--tight">
                    <label className="dna-label">PLACEHOLDER_TEXT</label>
                    <input
                        type="text"
                        className="dna-input"
                        value={field.config?.placeholder || ''}
                        onChange={e => updateConfig('placeholder', e.target.value)}
                    />
                </div>

            </div>

            {/* Inyección de Estilos Locales CSS Axiomáticos */}
            <style jsx>{`
                .dna-label {
                    font-size: 9px;
                    font-family: var(--font-mono);
                    opacity: 0.5;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .dna-input {
                    background: var(--color-bg-void);
                    border: 1px solid var(--color-border-strong);
                    color: white;
                    padding: var(--space-2) var(--space-3);
                    border-radius: var(--radius-sm);
                    font-size: 11px;
                    width: 100%;
                    outline: none;
                    transition: border-color var(--transition-fast);
                }
                .dna-input:focus {
                    border-color: var(--color-accent);
                }
                .dna-input.mono {
                    font-family: var(--font-mono);
                    color: var(--color-accent);
                }
            `}</style>

            {showSiloSelector && (
                <ArtifactSelector
                    onSelect={handleSiloSelect}
                    onCancel={() => setShowSiloSelector(false)}
                />
            )}
        </aside>
    );
}
