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

export function PortManager({ title, ids, schemas, onAdd, onRemove, type = 'SOURCE' }) {
    return (
        <aside className="stack" style={{
            width: '300px',
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
                        onRemove={() => onRemove(id)}
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

function PortCard({ id, schema, onRemove, type }) {
    const [expanded, setExpanded] = React.useState(false);

    return (
        <div className="stack--tight glass" style={{
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
        }}>
            <div className="spread">
                <div className="shelf--tight" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
                    <IndraIcon
                        name={type === 'SOURCE' ? 'EYE' : 'TARGET'}
                        size="14px"
                        style={{ color: 'var(--color-accent)' }}
                    />
                    <div className="stack--tight">
                        <span style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                            {schema?.label || id.split('/').pop() || 'LOADING...'}
                        </span>
                        <span style={{ fontSize: '8px', opacity: 0.4 }}>ID: {id.substring(0, 8)}...</span>
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

            {/* Preview de campos si está expandido */}
            {expanded && schema && (
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
            )}
        </div>
    );
}
