/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/SchemaDesigner/LayersPanel.jsx
 * RESPONSABILIDAD: Gestión jerárquica del AST de datos.
 *
 * DHARMA:
 *   - Estructura Pura: Proyecta la jerarquía de capas sin ruido.
 *   - Precisión Operativa: Intercambio de posiciones discreto (no D&D caótico).
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../utilities/IndraActionTrigger';

export function LayersPanel({ fields, setFields, selectedId, onSelect }) {

    const addField = (type = 'TEXT') => {
        const newField = {
            id: 'field_' + Date.now(),
            type: type,
            label: 'Nuevo Campo',
            alias: 'nuevo_campo_' + Date.now(),
            config: {}
        };
        if (type === 'FRAME' || type === 'REPEATER') {
            newField.children = [];
        }
        setFields([...fields, newField]);
        onSelect(newField.id);
    };

    const moveField = (index, direction) => {
        const newFields = [...fields];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newFields.length) return;

        const temp = newFields[index];
        newFields[index] = newFields[targetIndex];
        newFields[targetIndex] = temp;
        setFields(newFields);
    };

    const removeField = (id) => {
        setFields(fields.filter(f => f.id !== id));
        if (selectedId === id) onSelect(null);
    };

    const [layersSearch, setLayersSearch] = React.useState('');

    const filteredFields = fields.filter(f => {
        if (!layersSearch) return true;
        const term = layersSearch.toUpperCase();
        return f.label?.toUpperCase().includes(term) || f.alias?.toUpperCase().includes(term) || f.type?.toUpperCase().includes(term);
    });

    return (
        <aside className="stack" style={{
            width: '300px',
            borderRight: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
            height: '100%'
        }}>
            {/* Header del Panel */}
            <div className="spread" style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold', opacity: 0.6 }}>DNA_LAYERS</span>
                <div className="shelf--tight">
                    <button className="btn btn--ghost btn--sm" onClick={() => addField('TEXT')}>
                        <IndraIcon name="PLUS" size="12px" />
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => addField('FRAME')}>
                        <IndraIcon name="FRAME" size="12px" />
                    </button>
                </div>
            </div>

            {/* Búsqueda de Capas */}
            <div style={{ padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="shelf--tight" style={{
                    background: 'var(--color-bg-void)',
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)'
                }}>
                    <IndraIcon name="EYE" size="10px" style={{ opacity: 0.3 }} />
                    <input
                        type="text"
                        placeholder="FILTER_LAYERS..."
                        value={layersSearch}
                        onChange={e => setLayersSearch(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono)',
                            outline: 'none',
                            width: '100%'
                        }}
                    />
                </div>
            </div>

            {/* Lista de Capas */}
            <div className="fill stack--tight" style={{ overflowY: 'auto', padding: 'var(--space-2)' }}>
                {filteredFields.map((field, index) => {
                    const originalIndex = fields.findIndex(f => f.id === field.id);
                    return (
                        <LayerItem
                            key={field.id}
                            field={field}
                            isSelected={selectedId === field.id}
                            onSelect={() => onSelect(field.id)}
                            onMoveUp={() => moveField(originalIndex, -1)}
                            onMoveDown={() => moveField(originalIndex, 1)}
                            onRemove={() => removeField(field.id)}
                        />
                    );
                })}

                {fields.length === 0 && (
                    <div className="center stack" style={{ padding: 'var(--space-8)', opacity: 0.3 }}>
                        <span style={{ fontSize: '10px' }}>NO_ATOMS_FOUND</span>
                    </div>
                )}
            </div>
        </aside>
    );
}

function LayerItem({ field, isSelected, onSelect, onMoveUp, onMoveDown, onRemove }) {
    return (
        <div
            onClick={onSelect}
            className={`shelf--tight glass-hover ${isSelected ? 'active-layer' : ''}`}
            style={{
                padding: 'var(--space-2) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                border: isSelected ? '1px solid var(--color-accent)' : '1px solid transparent',
                background: isSelected ? 'rgba(var(--rgb-accent), 0.1)' : 'transparent'
            }}
        >
            <IndraIcon
                name={field.type === 'FRAME' || field.type === 'REPEATER' ? 'FRAME' : 'SCHEMA'}
                size="14px"
                style={{ opacity: isSelected ? 1 : 0.5, color: isSelected ? 'var(--color-accent)' : 'inherit' }}
            />

            <div className="stack--tight fill">
                <span style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? 'var(--color-accent)' : 'var(--color-text)'
                }}>
                    {field.label || 'S/N'}
                </span>
                <span style={{ fontSize: '8px', opacity: 0.4 }}>{field.type} // {field.alias}</span>
            </div>

            {/* Controles de Capa (Solo visibles si seleccionado) */}
            {isSelected && (
                <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                    <button
                        className="btn btn--ghost btn--xs"
                        onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                        style={{ border: 'none' }}
                    >
                        <IndraIcon name="ARROW_UP" size="10px" />
                    </button>
                    <button
                        className="btn btn--ghost btn--xs"
                        onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                        style={{ border: 'none' }}
                    >
                        <IndraIcon name="ARROW_DOWN" size="10px" />
                    </button>
                    <IndraActionTrigger
                        icon="DELETE"
                        size="10px"
                        requiresHold={true}
                        holdTime={800}
                        onClick={onRemove}
                        color="var(--color-danger)"
                    />
                </div>
            )}
        </div>
    );
}
