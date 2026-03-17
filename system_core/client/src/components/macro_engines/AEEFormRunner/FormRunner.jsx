/**
 * =============================================================================
 * ARTEFACTO: FormRunner.jsx
 * RESPONSABILIDAD: Proyecta un DATA_SCHEMA como formulario interactivo.
 * SOPORTA: Estructuras jerárquicas (FRAME) y vectores recursivos (REPEATER).
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { DataProjector } from '../../../services/DataProjector';
import { useLexicon } from '../../../services/lexicon';

/**
 * Componente Recursivo para renderizar nodos del esquema.
 */
function FormNode({ field, value, onChange, disabled }) {
    const isFrame = field.type === 'FRAME';
    const isRepeater = field.type === 'REPEATER';

    // ── RENDERIZADO DE CONTENEDOR (FRAME) ──
    if (isFrame) {
        return (
            <div className="indra-container">
                <div className="indra-header-label" style={{ opacity: 0.7 }}>{t('ui_group')}::{field.alias.toUpperCase()}</div>
                <div className="node-body grid-split--tight" style={{ padding: 'var(--space-4) var(--space-3)' }}>
                    {field.children?.map(child => (
                        <FormNode
                            key={child.id}
                            field={child}
                            value={value?.[child.alias]}
                            onChange={(alias, val) => onChange(field.alias, { ...value, [alias]: val })}
                            disabled={disabled}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // ── RENDERIZADO DE VECTOR (REPEATER) ──
    if (isRepeater) {
        const items = Array.isArray(value) ? value : [];
        
        const addItem = () => {
            const newItem = {};
            field.children?.forEach(c => newItem[c.alias] = null);
            onChange(field.alias, [...items, newItem]);
        };

        const removeItem = (index) => {
            const newItems = items.filter((_, i) => i !== index);
            onChange(field.alias, newItems);
        };

        const updateItem = (index, itemValue) => {
            const newItems = [...items];
            newItems[index] = itemValue;
            onChange(field.alias, newItems);
        };

        return (
            <div className="indra-container" style={{ background: 'var(--color-bg-void)' }}>
                <div className="indra-header-label" style={{ background: 'var(--color-warm)', color: 'black' }}>{t('ui_list')}::{field.alias.toUpperCase()}</div>
                <div style={{ padding: 'var(--space-3)' }}>
                    <header className="node-header shelf--between" style={{ marginBottom: 'var(--space-2)' }}>
                        <span className="util-label" style={{ fontSize: '10px' }}>{field.label}</span>
                        <button 
                            className="btn btn--xs" 
                            onClick={addItem} 
                            disabled={disabled}
                            style={{ 
                                borderRadius: '4px', 
                                border: '1px solid var(--indra-dynamic-accent)',
                                color: 'var(--indra-dynamic-accent)',
                                background: 'var(--indra-dynamic-bg)',
                                fontSize: '8px',
                                padding: '1px 8px'
                            }}
                        >
                            <IndraIcon name="PLUS" size="8px" color="var(--indra-dynamic-accent)" />
                            <span style={{ marginLeft: '4px' }}>{t('action_add_item')}</span>
                        </button>
                    </header>
                    
                    <div className="repeater-list stack--tight" style={{ gap: 'var(--indra-ui-gap)' }}>
                        {items.length > 0 ? items.map((item, idx) => (
                            <div key={idx} className="indra-container shelf--tight" style={{ background: 'var(--color-bg-deep)', padding: 'var(--space-2)' }}>
                                <div className="item-content grid-split--tight fill">
                                    {field.children?.map(child => (
                                        <FormNode
                                            key={child.id}
                                            field={child}
                                            value={item[child.alias]}
                                            onChange={(alias, val) => updateItem(idx, { ...item, [alias]: val })}
                                            disabled={disabled}
                                        />
                                    ))}
                                </div>
                                <button className="btn btn--xs btn--danger btn--icon" onClick={() => removeItem(idx)} disabled={disabled}>
                                    <IndraIcon name="CLOSE" size="8px" color="var(--color-danger)" />
                                </button>
                            </div>
                        )) : (
                            <p className="util-hint center" style={{ padding: '10px', fontSize: '9px', opacity: 0.4 }}>{t('status_empty_list')}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── RENDERIZADO DE CAMPO ATÓMICO ──
    return (
        <div className="form-item stack--tight">
            <label className="util-label" style={{ fontSize: '10px', opacity: 0.7 }}>{field.label}</label>

            {field.type === 'LONG_TEXT' ? (
                <textarea
                    className="input-base"
                    rows="2"
                    placeholder="..."
                    value={value || ''}
                    onChange={(e) => onChange(field.alias, e.target.value)}
                    disabled={disabled}
                />
            ) : field.type === 'SELECT' ? (
                <select
                    className="input-base"
                    value={value || ''}
                    onChange={(e) => onChange(field.alias, e.target.value)}
                    disabled={disabled}
                >
                    <option value="">...</option>
                    {field.config?.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ) : (
                <input
                    className="input-base"
                    type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                    placeholder="..."
                    value={value || ''}
                    onChange={(e) => onChange(field.alias, e.target.value)}
                    disabled={disabled}
                />
            )}
        </div>
    );
}

export function FormRunner({ schema, formData, onFieldChange, onExecute, status }) {
    const t = useLexicon();
    const projection = DataProjector.projectSchema(schema);
    const fields = projection.fields || [];

    return (
        <div className="aee-form-runner__form stack--loose">
            <header className="form-header stack--tight">
                <div className="shelf--tight">
                    <IndraIcon name="SCHEMA" size="12px" style={{ color: 'var(--color-accent)' }} />
                    <span className="util-label">{t('ui_schema_projection')}</span>
                </div>
                <h2>{projection.label}</h2>
                <p className="util-hint">Configure los parámetros del flujo de negocio.</p>
            </header>

            <section className="form-grid stack--loose">
                {fields.length > 0 ? (
                    fields.map(field => (
                        <FormNode
                            key={field.id}
                            field={field}
                            value={formData[field.alias]}
                            onChange={onFieldChange}
                            disabled={status === 'EXECUTING'}
                        />
                    ))
                ) : (
                    <div className="empty-state center stack--tight slot-small">
                        <IndraIcon name="WARN" size="24px" />
                        <span className="util-label">NO_SCHEMA_FIELDS</span>
                        <p className="util-hint">Este esquema no tiene campos definidos.</p>
                    </div>
                )}
            </section>

            <footer className="form-actions shelf--tight">
                <button
                    className={`btn btn--accent ${status === 'EXECUTING' ? 'active' : ''}`}
                    onClick={onExecute}
                    disabled={status === 'EXECUTING' || fields.length === 0}
                >
                    <IndraIcon name={status === 'EXECUTING' ? 'SYNC' : 'PLAY'} className={status === 'EXECUTING' ? 'spin' : ''} />
                    <span>{status === 'EXECUTING' ? t('status_executing') : t('action_execute')}</span>
                </button>
            </footer>
        </div>
    );
}
