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

    const findAndAddChild = (list, parentId, newNode) => {
        return list.map(item => {
            if (item.id === parentId) {
                return { ...item, children: [...(item.children || []), newNode] };
            }
            if (item.children) {
                return { ...item, children: findAndAddChild(item.children, parentId, newNode) };
            }
            return item;
        });
    };

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

        // Si hay un contenedor seleccionado, añadir dentro
        const selectedField = findFieldById(fields, selectedId);
        const isContainer = selectedField && (selectedField.type === 'FRAME' || selectedField.type === 'REPEATER');

        if (isContainer) {
            setFields(findAndAddChild(fields, selectedId, newField));
        } else {
            setFields([...fields, newField]);
        }
        onSelect(newField.id);
    };

    function findFieldById(list, id) {
        for (const item of list) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findFieldById(item.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    const moveField = (id, direction) => {
        const moveInList = (list) => {
            const index = list.findIndex(f => f.id === id);
            if (index !== -1) {
                const targetIndex = index + direction;
                if (targetIndex < 0 || targetIndex >= list.length) return list;
                const newList = [...list];
                const temp = newList[index];
                newList[index] = newList[targetIndex];
                newList[targetIndex] = temp;
                return newList;
            }
            return list.map(item => item.children ? { ...item, children: moveInList(item.children) } : item);
        };
        setFields(moveInList(fields));
    };

    const removeField = (id) => {
        const removeFromList = (list) => {
            return list.filter(f => f.id !== id).map(item =>
                item.children ? { ...item, children: removeFromList(item.children) } : item
            );
        };
        setFields(removeFromList(fields));
        if (selectedId === id) onSelect(null);
    };

    const [layersSearch, setLayersSearch] = React.useState('');

    const flattenFields = (list) => {
        return list.reduce((acc, field) => {
            acc.push(field);
            if (field.children) acc.push(...flattenFields(field.children));
            return acc;
        }, []);
    };

    const filteredFields = flattenFields(fields).filter(f => {
        if (!layersSearch) return true;
        const term = layersSearch.toUpperCase();
        return f.label?.toUpperCase().includes(term) || f.alias?.toUpperCase().includes(term) || f.type?.toUpperCase().includes(term);
    });

    const RecursiveLayerList = ({ list, depth = 0 }) => {
        return list.map((field) => (
            <React.Fragment key={field.id}>
                <LayerItem
                    field={field}
                    depth={depth}
                    isSelected={selectedId === field.id}
                    onSelect={() => onSelect(field.id)}
                    onMoveUp={() => moveField(field.id, -1)}
                    onMoveDown={() => moveField(field.id, 1)}
                    onRemove={() => removeField(field.id)}
                />
                {field.children && field.children.length > 0 && (
                    <RecursiveLayerList list={field.children} depth={depth + 1} />
                )}
            </React.Fragment>
        ));
    };

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
                    <button className="btn btn--ghost btn--sm" onClick={() => addField('TEXT')} title="Añadir Texto">
                        <IndraIcon name="PLUS" size="12px" />
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => addField('FRAME')} title="Añadir Frame">
                        <IndraIcon name="FRAME" size="12px" />
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => addField('REPEATER')} title="Añadir Repeater">
                        <IndraIcon name="REPEATER" size="12px" />
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
                {layersSearch ? (
                    filteredFields.map((field) => (
                        <LayerItem
                            key={field.id}
                            field={field}
                            depth={0} // En búsqueda aplanamos visualmente
                            isSelected={selectedId === field.id}
                            onSelect={() => onSelect(field.id)}
                            onMoveUp={() => moveField(field.id, -1)}
                            onMoveDown={() => moveField(field.id, 1)}
                            onRemove={() => removeField(field.id)}
                        />
                    ))
                ) : (
                    <RecursiveLayerList list={fields} />
                )}

                {fields.length === 0 && (
                    <div className="center stack" style={{ padding: 'var(--space-8)', opacity: 0.3 }}>
                        <span style={{ fontSize: '10px' }}>NO_ATOMS_FOUND</span>
                    </div>
                )}
            </div>
        </aside>
    );
}

import { DataProjector } from '../../../services/DataProjector';

function LayerItem({ field, depth = 0, isSelected, onSelect, onMoveUp, onMoveDown, onRemove }) {
    const projection = DataProjector.projectFieldDefinition(field);
    if (!projection) return null;

    return (
        <div
            onClick={onSelect}
            className={`shelf--tight glass-hover ${isSelected ? 'active-layer' : ''}`}
            style={{
                padding: 'var(--space-2) var(--space-4)',
                paddingLeft: `calc(var(--space-4) + ${depth * 16}px)`,
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                border: isSelected ? `1px solid ${projection.theme.color || 'var(--color-accent)'}` : '1px solid transparent',
                background: isSelected ? `linear-gradient(90deg, ${projection.theme.color}20 0%, transparent 100%)` : 'transparent',
                position: 'relative'
            }}
        >
            {/* Indicador de profundidad visual (línea sutil) */}
            {depth > 0 && (
                <div style={{
                    position: 'absolute',
                    left: `calc(${depth * 16}px - 4px)`,
                    top: '20%',
                    bottom: '20%',
                    width: '1px',
                    background: 'var(--color-border)',
                    opacity: 0.5
                }} />
            )}

            <IndraIcon
                name={projection.theme.icon}
                size="14px"
                style={{ opacity: isSelected ? 1 : 0.5, color: isSelected ? projection.theme.color : 'inherit' }}
            />

            <div className="stack--tight fill">
                <span style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? projection.theme.color : 'var(--color-text)'
                }}>
                    {projection.label}
                </span>
                <span style={{ fontSize: '8px', opacity: 0.4 }}>{projection.type} // {projection.alias}</span>
            </div>

            {/* Controles de Capa (Solo visibles si seleccionado) */}
            {isSelected && (
                <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                    <button
                        className="btn btn--ghost btn--xs"
                        onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                        style={{ border: 'none' }}
                        title="Subir"
                    >
                        <IndraIcon name="ARROW_UP" size="10px" />
                    </button>
                    <button
                        className="btn btn--ghost btn--xs"
                        onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                        style={{ border: 'none' }}
                        title="Bajar"
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
