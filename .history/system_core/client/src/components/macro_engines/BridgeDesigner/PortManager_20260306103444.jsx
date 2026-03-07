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

export function PortManager({ title, ids, schemas, mappings = {}, onAdd, onRemove, onUpdateMapping, onOpenSelector, type = 'SOURCE' }) {
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
                        mapping={mappings[id]}
                        onRemove={() => onRemove(id)}
                        onUpdateMapping={(m) => onUpdateMapping(id, m)}
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

function PortCard({ id, schema, mapping, onRemove, onUpdateMapping, onOpenSelector, type }) {
    const [expanded, setExpanded] = React.useState(type === 'TARGET');

    return (
        <div className="stack--tight glass" style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
        }}>
            <div className="spread">
                <div className="shelf--tight" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer', maxWidth: 'calc(100% - 24px)', overflow: 'hidden' }}>
                    <IndraIcon
                        name={type === 'SOURCE' ? 'EYE' : 'TARGET'}
                        size="14px"
                        style={{ color: 'var(--color-accent)', flexShrink: 0 }}
                    />
                    <div className="stack--tight" style={{ overflow: 'hidden' }}>
                        <span style={{
                            fontSize: '11px',
                            fontWeight: 'bold',
                            fontFamily: 'var(--font-mono)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {schema?.handle?.label || schema?.label || id.split('/').pop() || 'LOADING...'}
                        </span>
                        <span style={{ fontSize: '7px', opacity: 0.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            ID: {id.split('/').pop().substring(0, 16)}...
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
                        schema={schema}
                        mapping={mapping}
                        onUpdateMapping={onUpdateMapping}
                        onOpenSelector={onOpenSelector}
                    />
                ) : (
                    <div className="stack--tight" style={{
                        marginTop: 'var(--space-2)',
                        paddingTop: 'var(--space-2)',
                        borderTop: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        {schema.fields.map(f => (
                            <div key={f.id} className="shelf--tight" style={{ opacity: 0.6 }}>
                                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)' }}>• {f.label || f.id}</span>
                                <span style={{ fontSize: '8px', opacity: 0.5 }}>({f.type})</span>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
