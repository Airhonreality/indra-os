/**
 * =============================================================================
 * ARTEFACTO: components/utilities/SlotSelector.jsx
 * RESPONSABILIDAD: Buscador de variables (slots) en el contexto de la pipeline.
 *
 * DHARMA:
 *   - Precisión Semántica: Agrupa variables por origen (Source/Op).
 *   - Agnosticismo de Tipo: Filtra variables por compatibilidad de datos.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from './IndraIcons';

export function SlotSelector({ contextStack, onSelect, onCancel, filterType = null }) {
    const [search, setSearch] = useState('');

    // Flatten el contextStack para búsqueda
    // contextStack debe ser: { sources: { alias: [fields] }, ops: { alias: [fields/value] } }
    const flatSlots = [];

    // 1. Procesar Sources
    Object.entries(contextStack.sources || {}).forEach(([alias, schema]) => {
        schema.fields.forEach(f => {
            flatSlots.push({
                id: `source.${alias}.${f.id}`,
                label: f.label || f.id,
                path: `source.${alias}.${f.id}`,
                group: `SOURCE: ${alias}`,
                type: f.type,
                icon: 'EYE'
            });
        });
    });

    // 2. Procesar Operadores (Anteriores)
    Object.entries(contextStack.ops || {}).forEach(([alias, opResult]) => {
        // Si el operador produce un valor simple
        flatSlots.push({
            id: `op.${alias}`,
            label: alias.toUpperCase() + '_RESULT',
            path: `op.${alias}`,
            group: `OPERATOR: ${alias}`,
            type: opResult.type || 'UNKNOWN',
            icon: 'LOGIC'
        });
    });

    const filtered = flatSlots.filter(s => {
        const matchesSearch = s.label.toUpperCase().includes(search.toUpperCase()) || s.path.toUpperCase().includes(search.toUpperCase());
        const matchesType = !filterType || s.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="glass modal-overlay center" style={{ zIndex: 1000 }} onClick={onCancel}>
            <div className="stack glass-strong" style={{
                width: '400px',
                maxHeight: '600px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-accent)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Search Header */}
                <div className="stack" style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                    <div className="spread">
                        <span style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>SELECT_VARIABLE_SLOT</span>
                        <span style={{ fontSize: '9px', opacity: 0.5 }}>{filterType || 'ANY_TYPE'}</span>
                    </div>
                    <input
                        autoFocus
                        type="text"
                        placeholder="SEARCH_CONTEXT_PATH..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            background: 'var(--color-bg-void)',
                            border: '1px solid var(--color-border)',
                            padding: 'var(--space-2) var(--space-4)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'white',
                            marginTop: 'var(--space-4)',
                            outline: 'none',
                            fontFamily: 'var(--font-mono)'
                        }}
                    />
                </div>

                {/* Listado Jerárquico */}
                <div className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-2)' }}>
                    {Object.entries(filtered.reduce((acc, slot) => {
                        if (!acc[slot.group]) acc[slot.group] = [];
                        acc[slot.group].push(slot);
                        return acc;
                    }, {})).map(([groupName, groupSlots]) => (
                        <div key={groupName} className="stack--tight" style={{ marginBottom: 'var(--space-3)' }}>
                            <div className="shelf--tight" style={{
                                padding: 'var(--space-2) var(--space-4)',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--color-accent)',
                                fontSize: '10px',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                <IndraIcon name={groupName.startsWith('OP') ? 'LOGIC' : 'EYE'} size="12px" />
                                <span>{groupName}</span>
                            </div>

                            <div className="stack--tight" style={{ paddingLeft: 'var(--space-4)' }}>
                                {groupSlots.map(slot => (
                                    <div
                                        key={slot.id}
                                        className="shelf--tight glass-hover"
                                        onClick={() => onSelect(slot)}
                                        style={{
                                            padding: 'var(--space-2)',
                                            borderRadius: 'var(--radius-sm)',
                                            cursor: 'pointer',
                                            borderLeft: '1px solid var(--color-border)',
                                            marginLeft: '4px'
                                        }}
                                    >
                                        <IndraIcon name={slot.icon} size="10px" style={{ opacity: 0.3 }} />
                                        <div className="stack--tight fill" style={{ gap: '2px' }}>
                                            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{slot.label}</span>
                                            <span style={{ fontSize: '7px', opacity: 0.3 }}>{slot.path}</span>
                                        </div>
                                        <span style={{ fontSize: '7px', opacity: 0.5, fontFamily: 'var(--font-mono)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: '4px' }}>
                                            {slot.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="center stack" style={{ padding: 'var(--space-8)', opacity: 0.2 }}>
                            <span style={{ fontSize: '10px' }}>NO_SLOTS_MATCH_CRITERIA</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
