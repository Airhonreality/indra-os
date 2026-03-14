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
import { DataProjector } from '../../../services/DataProjector';

export function DNAInspector({ field, onUpdate }) {
    const [showArtifactSelector, setShowArtifactSelector] = useState(false);

    // 1. Proyectar el ADN del campo
    const projection = DataProjector.projectFieldDefinition(field);
    const availableTypes = DataProjector.getFieldTypes();

    const updateConfig = (key, value) => {
        onUpdate({
            ...field,
            config: { ...field.config, [key]: value }
        });
    };

    const handleArtifactSelect = (atom) => {
        const atomProjection = DataProjector.projectArtifact(atom);
        updateConfig('relation_silo_id', atomProjection.id);
        updateConfig('relation_silo_label', atomProjection.title);
        setShowArtifactSelector(false);
    };

    if (!projection) return null;

    return (
        <aside className="stack" style={{
            width: '320px',
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            height: '100%',
            overflow: 'hidden' // Forzar que solo el contenido interno haga scroll
        }}>
            <div className="spread" style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', opacity: 0.6 }}>DNA_PROPERTIES</span>
                <IndraIcon name="EDIT" size="12px" opacity={0.5} style={{ color: projection.theme.color }} />
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
                        style={{ borderColor: `${projection.theme.color}40` }}
                    />
                </div>

                <div className="stack--tight">
                    <label className="dna-label">FIELD_ALIAS (SLUG)</label>
                    <input
                        type="text"
                        className="dna-input mono"
                        value={field.alias || ''}
                        onChange={e => onUpdate({ ...field, alias: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                        style={{ color: projection.theme.color }}
                    />
                </div>

                <div className="stack--tight">
                    <label className="dna-label">FIELD_TYPE</label>
                    <select
                        className="dna-input"
                        value={field.type}
                        onChange={e => onUpdate({ ...field, type: e.target.value })}
                    >
                        {availableTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>
                </div>

                {/* ── JERARQUÍA (Reparenting) ── */}
                <div className="stack--tight">
                    <label className="dna-label">PARENT_CONTAINER</label>
                    <select
                        className="dna-input mono"
                        value={getParentId(field.id)}
                        onChange={e => onReparent(field.id, e.target.value)}
                    >
                        <option value="ROOT">ROOT_LEVEL</option>
                        {getAvailableParents(allFields, field.id).map(p => (
                            <option key={p.id} value={p.id}>{p.label.toUpperCase()} ({p.type})</option>
                        ))}
                    </select>
                </div>

                <div style={{ height: '1px', background: 'var(--color-border)', margin: 'var(--space-2) 0' }}></div>

                {/* ── CONFIGURACIÓN SEGÚN TIPO ── */}
                {field.type === 'RELATION_SELECT' && (
                    <div className="stack--tight">
                        <label className="dna-label">RELATION_SOURCE</label>
                        <div
                            onClick={() => setShowArtifactSelector(true)}
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

            {showArtifactSelector && (
                <ArtifactSelector
                    onSelect={handleArtifactSelect}
                    onCancel={() => setShowArtifactSelector(false)}
                />
            )}
        </aside>
    );
}
