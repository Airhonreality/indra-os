import React from 'react';
import { OntologyService } from '../core/integrity/OntologyService';

/**
 * NanoForm: Semantic Schema-Driven Form Renderer (MasterLaw Edition)
 * Axiom: UI must be a pure projection of Backend Roles (Coherence).
 * This component maps the semantic ROLES from the Core Law to specific UI Widgets.
 */

const NanoForm = ({ schema, data, onChange, onSubmit, disabled, submitLabel }) => {

    const renderField = (key, fieldDef) => {
        const value = data[key] || '';
        const role = fieldDef.role || 'content/data';
        const meta = OntologyService.getRoleMeta(role);
        const Icon = meta.icon;

        // Intelligent Widget Selection based on Category + Role
        // Structural Predominance: If the contract specifies a complex widget, honor it.
        // Otherwise, allow the Semantic Role to suggest a better presentation (Ontology).
        const structuralTypes = ['selection', 'textarea', 'checkbox', 'url', 'number'];
        const widgetType = (structuralTypes.includes(fieldDef.type))
            ? fieldDef.type
            : (meta.widget || fieldDef.type || 'text');
        const isSecret = role.startsWith('security/') || role === 'security' || role === 'identity/key';

        // Automated Helper Text (No code understanding required by user)
        const placeholderText = fieldDef.placeholder ||
            (fieldDef.example ? `Manual entry like: ${fieldDef.example}` : `Input ${key}...`);

        return (
            <div key={key} className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-xs)' }}>
                    {Icon && <Icon size={11} style={{ opacity: 0.5 }} />}
                    <label htmlFor={key} style={{ margin: 0, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.5px' }}>
                        {fieldDef.label || key} {fieldDef.required && <span style={{ color: 'var(--accent-error)' }}>* REQUIRED</span>}
                    </label>
                </div>

                <div style={{ position: 'relative' }}>
                    {widgetType === 'textarea' ? (
                        <textarea
                            id={key}
                            placeholder={placeholderText}
                            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                            onChange={(e) => onChange(key, e.target.value)}
                            disabled={disabled}
                            required={fieldDef.required}
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: 'var(--space-sm)',
                                borderLeft: `3px solid ${isSecret ? 'var(--accent-error)' : 'var(--color-surface-bright)'}`
                            }}
                        />
                    ) : (widgetType === 'selection' ? (
                        <select
                            id={key}
                            value={value}
                            onChange={(e) => onChange(key, e.target.value)}
                            disabled={disabled}
                            required={fieldDef.required}
                            style={{
                                width: '100%',
                                background: 'var(--color-surface-soft)',
                                color: 'var(--text-primary)',
                                height: '36px',
                                border: 'none',
                                paddingLeft: '8px',
                                fontSize: '12px',
                                fontFamily: 'var(--font-mono)',
                                borderLeft: `3px solid var(--accent-success)`
                            }}
                        >
                            <option value="">-- SELECT {fieldDef.label || key} --</option>
                            {fieldDef.options && fieldDef.options.map((opt, idx) => {
                                const optVal = typeof opt === 'object' ? opt.id : opt;
                                const optLabel = typeof opt === 'object' ? opt.label : opt;
                                return <option key={idx} value={optVal}>{optLabel}</option>;
                            })}
                        </select>
                    ) : (
                        <input
                            id={key}
                            type={isSecret ? 'password' : (widgetType === 'url' ? 'url' : widgetType)}
                            placeholder={placeholderText}
                            value={value}
                            onChange={(e) => onChange(key, e.target.value)}
                            disabled={disabled}
                            required={fieldDef.required}
                            title={fieldDef.label}
                            autoComplete="off"
                            style={{
                                paddingLeft: 'var(--space-sm)',
                                borderLeft: `3px solid ${isSecret ? 'var(--accent-error)' : 'var(--color-surface-bright)'}`
                            }}
                        />
                    ))}
                </div>

                {fieldDef.description && (
                    <div style={{ fontSize: '9px', opacity: 0.4, marginTop: '2px', fontStyle: 'italic' }}>
                        {fieldDef.description}
                    </div>
                )}
            </div>
        );
    };

    return (
        <form
            className="nano-form"
            onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        >
            <div className="form-fields" key={Object.keys(schema).join('-')}>
                {Object.entries(schema).map(([key, def]) => renderField(key, def))}
            </div>

            <button
                type="submit"
                className="btn-primary"
                disabled={disabled}
                style={{
                    width: '100%',
                    marginTop: 'var(--space-md)',
                    background: disabled ? 'var(--color-surface-soft)' : 'var(--text-primary)',
                    color: disabled ? 'var(--text-secondary)' : 'var(--color-bg)'
                }}
            >
                {submitLabel || (disabled ? 'PROCESSING...' : 'EXECUTE_ACTION')}
            </button>
        </form>
    );
};

export default NanoForm;
