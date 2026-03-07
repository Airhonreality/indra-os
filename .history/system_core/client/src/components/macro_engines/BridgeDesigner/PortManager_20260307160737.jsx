/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/PortManager.jsx
 * RESPONSABILIDAD: Panel dual para gestión de fuentes (SOURCES) y destinos (TARGETS).
 *
 * DHARMA:
 *   - Simetría Operativa: Las entradas y salidas se gestionan con la misma dignidad.
 *   - Transparencia Identitaria: Muestra qué campos "ofrece" o "pide" el artefacto.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../utilities/IndraActionTrigger';
import { FieldMapper } from './FieldMapper';

export function PortManager({ title, ids, schemas, configs = {}, mappings = {}, onAdd, onRemove, onUpdateMapping, onUpdateConfig, onOpenSelector, type = 'SOURCE' }) {
    return (
        <aside className="stack" style={{
            width: '320px',
            borderRight: type === 'SOURCE' ? '1px solid var(--color-border)' : 'none',
            borderLeft: type === 'TARGET' ? '1px solid var(--color-border)' : 'none',
            background: 'var(--color-bg-elevated)',
            height: '100%',
            overflow: 'hidden'
        }}>
            {/* Header del Puerto */}
            <div className="spread" style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', opacity: 0.6 }}>{title}</span>
                <button className="btn btn--ghost btn--sm" onClick={onAdd}>
                    <IndraIcon name="PLUS" size="12px" />
                </button>
            </div>

            {/* Lista de Artefactos Conectados */}
            <div className="fill stack--tight" style={{ overflowY: 'auto', padding: 'var(--space-2)' }}>
                {ids.map(id => (
                    <PortCard
                        key={id}
                        id={id}
                        schema={schemas[id]}
                        config={configs[id] || {}}
                        mapping={mappings[id]}
                        onRemove={() => onRemove(id)}
                        onUpdateMapping={(m) => onUpdateMapping(id, m)}
                        onUpdateConfig={(c) => onUpdateConfig(id, c)}
                        onOpenSelector={(fieldId) => onOpenSelector(id, fieldId)}
                        type={type}
                    />
                ))}

                {ids.length === 0 && (
                    <div className="center stack" style={{ padding: 'var(--space-8)', opacity: 0.3 }}>
                        <span style={{ fontSize: '10px' }}>NO_{type}S_CONNECTED</span>
                    </div>
                )}
            </div>
        </aside>
    );
}

function PortCard({ id, schema, mapping, config, onRemove, onUpdateMapping, onUpdateConfig, onOpenSelector, type }) {
    const [expanded, setExpanded] = React.useState(type === 'TARGET');
    const [isEditingAlias, setIsEditingAlias] = React.useState(false);

    const defaultAlias = schema?.label || id.split('/').pop() || 'LOADING...';
    const alias = config.alias || defaultAlias;
    const [tempAlias, setTempAlias] = React.useState(alias);

    const isBroken = schema?.error === true;

    // By default all fields are active
    const activeFields = config.activeFields || (schema?.fields ? schema.fields.map(f => f.id) : []);

    const toggleField = (fieldId) => {
        const next = activeFields.includes(fieldId)
            ? activeFields.filter(f => f !== fieldId)
            : [...activeFields, fieldId];
        onUpdateConfig({ activeFields: next });
    };

    const handleAliasCommit = () => {
        setIsEditingAlias(false);
        if (tempAlias !== alias && tempAlias.trim() !== '') {
            onUpdateConfig({ alias: tempAlias.trim() });
        } else {
            setTempAlias(alias);
        }
    };

    return (
        <div className="stack--tight glass" style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: isBroken ? '1px solid var(--color-danger)' : '1px solid var(--color-border)'
        }}>
            <div className="spread">
                <div className="shelf--tight" onClick={() => !isEditingAlias && setExpanded(!expanded)} style={{ cursor: 'pointer', maxWidth: 'calc(100% - 24px)', overflow: 'hidden' }}>
                    <IndraIcon
                        name={isBroken ? 'WARN' : (type === 'SOURCE' ? 'EYE' : 'TARGET')}
                        size="14px"
                        style={{ color: isBroken ? 'var(--color-danger)' : 'var(--color-accent)', flexShrink: 0 }}
                    />
                    <div className="stack--tight" style={{ overflow: 'hidden' }}>
                        {isEditingAlias ? (
                            <input
                                autoFocus
                                value={tempAlias}
                                onChange={e => setTempAlias(e.target.value)}
                                onBlur={handleAliasCommit}
                                onKeyDown={e => { if (e.key === 'Enter') handleAliasCommit(); }}
                                style={{
                                    background: 'var(--color-bg-void)', border: '1px solid var(--color-accent)',
                                    color: 'white', fontSize: '11px', fontFamily: 'var(--font-mono)', width: '100%', outline: 'none'
                                }}
                            />
                        ) : (
                            <span
                                onDoubleClick={(e) => { e.stopPropagation(); setIsEditingAlias(true); }}
                                style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    fontFamily: 'var(--font-mono)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: isBroken ? 'var(--color-danger)' : 'white'
                                }}
                            >
                                {alias}
                            </span>
                        )}
                        <span style={{ fontSize: '7px', opacity: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {isBroken ? 'BROKEN_LINK' : `ID: ${id.split('/').pop().substring(0, 16)}...`}
                        </span>
                    </div>
                </div>

                <IndraActionTrigger
                    icon="DELETE"
                    size="10px"
                    requiresHold={true}
                    holdTime={800}
                    onClick={onRemove}
                    color="var(--color-danger)"
                />
            </div>

            {/* Preview de campos o Mapper */}
            {expanded && schema && (
                type === 'TARGET' ? (
                    <FieldMapper
                        targetId={id}
                        config={config}
                        schema={schema}
                        mapping={mapping}
                        onUpdateConfig={onUpdateConfig}
                        onUpdateMapping={onUpdateMapping}
                        onOpenSelector={onOpenSelector}
                    />
                ) : (
                    <div className="stack--tight" style={{
                        marginTop: 'var(--space-2)',
                        paddingTop: 'var(--space-2)',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        {schema.fields.map(f => {
                            const isActive = activeFields.includes(f.id);
                            return (
                                <div key={f.id} className="shelf--tight" style={{ opacity: isActive ? 1 : 0.4, cursor: 'pointer' }} onClick={() => toggleField(f.id)}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '2px',
                                        border: `1px solid ${isActive ? 'var(--color-accent)' : 'var(--color-border-strong)'}`,
                                        background: isActive ? 'var(--color-accent)' : 'transparent',
                                        flexShrink: 0
                                    }} />
                                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: isActive ? 'white' : 'var(--color-text-secondary)' }}>{f.label || f.id}</span>
                                    <span style={{ fontSize: '8px', opacity: 0.5 }}>({f.type})</span>
                                </div>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
}
