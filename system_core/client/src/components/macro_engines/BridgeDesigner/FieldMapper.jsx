import React from 'react';
import { MappingSelect } from './MappingSelect';

export function FieldMapper({ targetId, config = {}, schema, mapping = {}, mappingOptions = [], onUpdateConfig, onUpdateMapping }) {
    if (!schema) return <div style={{ opacity: 0.3 }}>LOADING_TARGET_SCHEMA...</div>;

    const action = config.action || 'APPEND';

    const handleFieldMapping = (fieldId, value) => {
        const option = mappingOptions.find(opt => opt.value === value);
        onUpdateMapping({
            ...mapping,
            [fieldId]: value,
            [fieldId + '_label']: option?.label || value
        });
    };

    return (
        <div className="stack--tight" style={{
            marginTop: 'var(--space-2)',
            padding: 'var(--space-2)',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: 'var(--radius-sm)'
        }}>

            <div className="stack--tight" style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>DIRECCIÓN_DE_FLUJO</span>
                <div className="shelf--tight" style={{ background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '4px' }}>
                    <div className="badge badge--ghost" style={{ fontSize: '8px' }}>INTENT:</div>
                    <select
                        value={action}
                        onChange={(e) => onUpdateConfig({ action: e.target.value, match_key: null })}
                        className="select-transparent-accent"
                        style={{ flex: 1, fontWeight: 'bold' }}
                    >
                        <option value="APPEND">INSERT (APPEND_ROW)</option>
                        <option value="UPDATE">MUTATE (UPDATE_ROW)</option>
                    </select>
                </div>
            </div>

            {action === 'UPDATE' && (
                <div className="stack--tight" style={{ paddingBottom: 'var(--space-3)', borderBottom: '1px solid rgba(255,255,255,0.05)', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>CLAVE_DE_CRUCE</span>
                    <div className="shelf--tight" style={{ background: 'rgba(255,0,0,0.05)', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,0,0,0.1)' }}>
                        <div className="badge badge--danger" style={{ fontSize: '8px' }}>MATCH_PK:</div>
                        <select
                            value={config.match_key || ''}
                            onChange={(e) => onUpdateConfig({ match_key: e.target.value })}
                            className="select-transparent-danger"
                            style={{ flex: 1, fontWeight: 'bold' }}
                        >
                            <option value="">-- SELECCIONAR PK --</option>
                            {schema.fields.map(f => (
                                <option key={f.id} value={f.id}>{f.id.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="spread" style={{ paddingBottom: 'var(--space-1)', marginTop: 'var(--space-2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '8px', opacity: 0.5 }}>TARGET_FIELD_HIERARCHY</span>
                <span style={{ fontSize: '8px', opacity: 0.5 }}>DATA_SOURCE_MAPPING</span>
            </div>

            <div className="stack--tight" style={{ marginTop: 'var(--space-2)' }}>
                {schema.fields.map(field => (
                    <RecursiveMappingItem
                        key={field.id}
                        field={field}
                        mapping={mapping}
                        options={mappingOptions}
                        onMapping={(fid, val) => handleFieldMapping(fid, val)}
                        level={0}
                    />
                ))}
            </div>
        </div>
    );
}

function RecursiveMappingItem({ field, mapping, options, onMapping, level }) {
    const hasChildren = field.children && field.children.length > 0;
    const mappedValue = mapping[field.id];

    return (
        <div className="stack--tight" style={{ 
            padding: '4px 0', 
            marginLeft: level > 0 ? 'var(--space-3)' : 0,
            borderLeft: level > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            paddingLeft: level > 0 ? 'var(--space-2)' : 0
        }}>
            <div className="spread" style={{ marginBottom: hasChildren ? '4px' : 0 }}>
                <div className="stack--tight">
                    <span style={{ 
                        fontSize: level === 0 ? '10px' : '9px', 
                        fontFamily: 'var(--font-mono)', 
                        fontWeight: level === 0 ? 'bold' : 'normal',
                        opacity: hasChildren ? 0.5 : 1
                    }}>
                        {field.label || field.id}
                    </span>
                    {!hasChildren && <span style={{ fontSize: '7px', opacity: 0.3 }}>{field.type}</span>}
                </div>
            </div>

            {!hasChildren && (
                <MappingSelect
                    value={mappedValue}
                    options={options}
                    onChange={(val) => onMapping(field.id, val)}
                    placeholder={`MAP_TO_${field.id.toUpperCase()}...`}
                />
            )}

            {hasChildren && (
                <div className="stack--tight">
                    {field.children.map(child => (
                        <RecursiveMappingItem
                            key={child.id}
                            field={child}
                            mapping={mapping}
                            options={options}
                            onMapping={onMapping}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
