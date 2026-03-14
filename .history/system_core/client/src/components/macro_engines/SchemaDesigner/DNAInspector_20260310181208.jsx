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
import { IndraMicroHeader } from '../../utilities/IndraMicroHeader';
import ArtifactSelector from '../../utilities/ArtifactSelector';
import { DataProjector } from '../../../services/DataProjector';

export function DNAInspector({ field, onUpdate, allFields, onReparent, bridge }) {
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
        // Reset label field when silo changes
        updateConfig('relation_label_field', null);
        setShowArtifactSelector(false);
    };

    // Helperes de Jerarquía
    const getParentId = (targetId) => {
        const search = (list, parentId = 'ROOT') => {
            for (const item of list) {
                if (item.id === targetId) return parentId;
                if (item.children) {
                    const found = search(item.children, item.id);
                    if (found) return found;
                }
            }
            return null;
        };
        return search(allFields);
    };

    const getAvailableParents = (list, excludeId) => {
        const parents = [];
        const traverse = (l) => {
            l.forEach(f => {
                // Solo campos tipo contenedor y no puede ser él mismo ni sus hijos (evitar circularidad)
                if ((f.type === 'FRAME' || f.type === 'REPEATER') && f.id !== excludeId) {
                    parents.push({ id: f.id, label: f.label, type: f.type });
                    if (f.children) traverse(f.children);
                }
            });
        };
        traverse(list);
        return parents;
    };

    if (!projection) return null;

    return (
        <aside className="stack" style={{
            width: '320px',
            flexShrink: 0,
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            height: '100%',
            overflow: 'hidden', // Forzar que solo el contenido interno haga scroll
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header del Panel (Micro-HUD) */}
            <IndraMicroHeader
                label="DNA_INSPECTOR"
                icon="DNA"
                metadata={projection.type}
            />

            <div className="fill stack" style={{
                padding: 'var(--space-6)',
                gap: 'var(--space-6)',
                overflowY: 'auto',
                flex: 1,
                minHeight: 0 // CRÍTICO
            }}>

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

                {/* ── VALORES Y VALIDACIONES ── */}
                <div className="stack--tight">
                    <label className="dna-label">DEFAULT_VALUE</label>
                    <input
                        type="text"
                        className="dna-input"
                        value={field.config?.default_value || ''}
                        onChange={e => updateConfig('default_value', e.target.value)}
                        placeholder="VALOR_POR_DEFECTO..."
                    />
                </div>

                {field.type === 'TEXT' && (
                    <div className="stack--tight">
                        <label className="dna-label">VALIDATION_REGEX (PATTERN)</label>
                        <input
                            type="text"
                            className="dna-input mono"
                            value={field.config?.pattern || ''}
                            onChange={e => updateConfig('pattern', e.target.value)}
                            placeholder="^[A-Z0-9...]"
                        />
                        <div className="shelf--tight" style={{ marginTop: 'var(--space-2)' }}>
                            <div className="stack--tight fill">
                                <label className="dna-label">MIN_LEN</label>
                                <input type="number" className="dna-input" value={field.config?.min_length || ''} onChange={e => updateConfig('min_length', e.target.value)} />
                            </div>
                            <div className="stack--tight fill">
                                <label className="dna-label">MAX_LEN</label>
                                <input type="number" className="dna-input" value={field.config?.max_length || ''} onChange={e => updateConfig('max_length', e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                {field.type === 'NUMBER' && (
                    <div className="shelf--tight">
                        <div className="stack--tight fill">
                            <label className="dna-label">MIN</label>
                            <input type="number" className="dna-input" value={field.config?.min_value || ''} onChange={e => updateConfig('min_value', e.target.value)} />
                        </div>
                        <div className="stack--tight fill">
                            <label className="dna-label">MAX</label>
                            <input type="number" className="dna-input" value={field.config?.max_value || ''} onChange={e => updateConfig('max_value', e.target.value)} />
                        </div>
                        <div className="stack--tight fill">
                            <label className="dna-label">STEP</label>
                            <input type="number" className="dna-input" step="0.01" value={field.config?.step || ''} onChange={e => updateConfig('step', e.target.value)} />
                        </div>
                    </div>
                )}

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

                        {field.config?.relation_silo_id && (
                            <div className="stack--tight" style={{ marginTop: 'var(--space-4)' }}>
                                <label className="dna-label">DISPLAY_LABEL_FIELD</label>
                                <RemoteFieldSelector
                                    siloId={field.config.relation_silo_id}
                                    value={field.config.relation_label_field}
                                    onChange={val => updateConfig('relation_label_field', val)}
                                    bridge={bridge}
                                />
                            </div>
                        )}
                    </div>
                )}

                <div className="stack--tight shelf">
                    <input
                        type="checkbox"
                        id="chk-required"
                        checked={field.config?.required || false}
                        onChange={e => updateConfig('required', e.target.checked)}
                    />
                    <label htmlFor="chk-required" className="dna-label" style={{ margin: 0, cursor: 'pointer' }}>MANDATORY_FIELD</label>
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

                <div style={{ height: '1px', background: 'var(--color-border)', margin: 'var(--space-2) 0' }}></div>

                {/* ── LÓGICA AVANZADA ── */}
                <div className="stack--tight">
                    <label className="dna-label" title="Ej: tipo_solicitud == 'VENTA'">VISIBILITY_CONDITION (SHOW_IF)</label>
                    <input
                        type="text"
                        className="dna-input mono"
                        value={field.config?.show_if || ''}
                        onChange={e => updateConfig('show_if', e.target.value)}
                        placeholder="EXPRESIÓN_LÓGICA..."
                        style={{ borderColor: field.config?.show_if ? 'var(--color-info)' : 'inherit' }}
                    />
                </div>

            </div>

            {/* Inyección de Estilos Locales CSS Axiomáticos */}
            <style>{`
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

/**
 * Componente interno para seleccionar campos de un silo remoto.
 */
function RemoteFieldSelector({ siloId, value, onChange, bridge }) {
    const [fields, setFields] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (!siloId || !bridge) return;

        const fetchSiloSchema = async () => {
            setLoading(true);
            try {
                // ATOM_READ del silo vinculado para obtener su esquema
                const result = await bridge.request({
                    protocol: 'ATOM_READ',
                    context_id: siloId
                });

                if (result.items?.[0]) {
                    const projected = DataProjector.projectSchema(result.items[0]);
                    setFields(projected.fields || []);
                }
            } catch (err) {
                console.error('[RemoteFieldSelector] Failed to fetch schema:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSiloSchema();
    }, [siloId, bridge]);

    if (loading) return <span style={{ fontSize: '9px', opacity: 0.5 }}>FETCHING_REMOTE_DNA...</span>;

    return (
        <select
            className="dna-input mono"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
        >
            <option value="">SELECT_FIELD...</option>
            {fields.map(f => (
                <option key={f.id} value={f.alias}>{f.label.toUpperCase()}</option>
            ))}
        </select>
    );
}
