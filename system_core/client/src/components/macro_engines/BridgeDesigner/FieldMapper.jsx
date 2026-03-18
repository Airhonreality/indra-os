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
        <div className="stack--tight" style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-2)' }}>
            
            <div className="stack--2xs">
                <div className="spread">
                    <span className="text-hint" style={{ fontSize: '7px', opacity: 0.4 }}>FLUJO_INTENT</span>
                    <select
                        value={action}
                        onChange={(e) => onUpdateConfig({ action: e.target.value, match_key: null })}
                        className="select-transparent-accent"
                        style={{ fontSize: '9px', fontWeight: 'bold' }}
                    >
                        <option value="APPEND">INSERT</option>
                        <option value="UPDATE">MUTATE</option>
                    </select>
                </div>
            </div>

            {action === 'UPDATE' && (
                <div className="stack--2xs" style={{ marginTop: 'var(--space-1)' }}>
                    <div className="spread">
                        <span className="text-hint" style={{ fontSize: '7px', color: 'var(--color-danger)', opacity: 0.6 }}>CLAVE_PRIMARIA</span>
                        <select
                            value={config.match_key || ''}
                            onChange={(e) => onUpdateConfig({ match_key: e.target.value })}
                            className="select-transparent-danger"
                            style={{ fontSize: '9px', fontWeight: 'bold' }}
                        >
                            <option value="">-- PK --</option>
                            {schema.fields.map(f => (
                                <option key={f.id} value={f.id}>{(f.handle?.label || f.label || f.id).toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="indra-blueprint-divider" style={{ margin: 'var(--space-2) 0' }} />

            <div className="stack--tight" style={{ overflow: 'visible' }}>
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
        <div className="stack--2xs" style={{ 
            padding: '2px 0', 
            marginLeft: level > 0 ? 'var(--space-2)' : 0,
            borderLeft: level > 0 ? '1px solid var(--color-border)' : 'none',
            paddingLeft: level > 0 ? 'var(--space-2)' : 0,
            opacity: hasChildren ? 0.4 : 1
        }}>
            <div className="spread shelf--tight" style={{ marginBottom: hasChildren ? '2px' : 0 }}>
                <span style={{ 
                    fontSize: level === 0 ? '10px' : '9px', 
                    fontFamily: 'var(--font-mono)', 
                    fontWeight: level === 0 ? '800' : '500',
                    textTransform: 'uppercase',
                    color: mappedValue ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    letterSpacing: '0.02em'
                }}>
                    {field.handle?.label || field.label || field.id}
                </span>
                {!hasChildren && <span style={{ fontSize: '7px', opacity: 0.2 }}>{field.type}</span>}
            </div>

            {!hasChildren && (
                <div style={{ marginTop: '2px' }}>
                    <MappingSelect
                        value={mappedValue}
                        options={options}
                        onChange={(val) => onMapping(field.id, val)}
                        placeholder="ORIGEN_DATOS"
                    />
                </div>
            )}

            {hasChildren && (
                <div className="stack--2xs" style={{ marginTop: 'var(--space-1)' }}>
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
