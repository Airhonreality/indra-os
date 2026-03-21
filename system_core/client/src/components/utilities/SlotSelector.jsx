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

    // 1. Procesar Sources (Gatillos/Trigger)
    Object.entries(contextStack.sources || {}).forEach(([alias, schema]) => {
        (schema.fields || []).forEach(f => {
            const isRoot = f.id === 'all';
            flatSlots.push({
                id: isRoot ? `$payload` : `$payload.${f.id}`,
                label: f.label || f.id,
                path: isRoot ? `$payload` : `$payload.${f.id}`,
                group: `ENTRADA: ${alias.toUpperCase()}`,
                type: f.type,
                icon: 'EYE'
            });
        });
    });

    // 2. Procesar Operadores (Pasos Anteriores)
    Object.entries(contextStack.ops || {}).forEach(([alias, opResult]) => {
        (opResult.fields || []).forEach(f => {
            const isRoot = f.id === 'all';
            flatSlots.push({
                id: `$steps.${alias}.${f.id}`,
                label: f.label || f.id,
                path: isRoot ? `$steps.${alias}.0` : `$steps.${alias}.0.${f.id}`,
                group: `FLUJO: ${alias.toUpperCase()}`,
                type: f.type,
                icon: 'LOGIC'
            });
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
                        <span style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>VINCULAR_DATO_AL_NODO</span>
                        <span style={{ fontSize: '9px', opacity: 0.5 }}>{filterType === 'ANY_TYPE' ? 'CUALQUIER_TIPO' : filterType || 'DATO_UNIVERSAL'}</span>
                    </div>
                    <input
                        autoFocus
                        type="text"
                        placeholder="BUSCAR_RUTA_DE_DATOS..."
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
                            fontFamily: 'var(--font-mono)',
                            fontSize: '11px'
                        }}
                    />
                </div>

                {/* Listado Jerárquico */}
                <div className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-2)', minHeight: '120px' }}>
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
                                <IndraIcon name={groupName.startsWith('PIPELINE') ? 'LOGIC' : 'EYE'} size="12px" />
                                <span>{groupName.replace('INPUT:', 'ENTRADA:').replace('PIPELINE:', 'FLUJO:')}</span>
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
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="center stack" style={{ padding: 'var(--space-8)', opacity: 0.4 }}>
                            <IndraIcon name="SEARCH" size="24px" style={{ marginBottom: '12px', opacity: 0.2 }} />
                            <span style={{ fontSize: '9px', textAlign: 'center', letterSpacing: '0.1em' }}>
                                NO_HAY_VARIABLES_DISPONIBLES_AQUÍ
                            </span>
                            <span style={{ fontSize: '7px', opacity: 0.5, marginTop: '4px', textAlign: 'center' }}>
                                CONECTA_UN_DISPARADOR_O_HAY_PASOS_PREVIOS_CON_SALIDA
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
