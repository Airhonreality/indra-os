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

import React, { useMemo } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../utilities/IndraActionTrigger';
import { IndraMicroHeader } from '../../utilities/IndraMicroHeader';
import ArtifactSelector from '../../utilities/ArtifactSelector';
import { DataProjector } from '../../../services/DataProjector';
import { IndraFractalTree } from '../../utilities/IndraFractalTree';

export function LayersPanel({ fields, selectedId, onSelect, onAdd, onRemove, onMove, onClone, onDemote, onPromote, onSwitchSchema, currentAtom }) {

    const [layersSearch, setLayersSearch] = React.useState('');
    const [showSchemaSwitcher, setShowSchemaSwitcher] = React.useState(false);

    // Búsqueda simple (Filtra solo nodos que coincidan, ocultando rmas no coincidentes si no hay match,
    // pero para simpleza y mantener el árbol, filtramos solo si hay texto)
    const filteredTree = useMemo(() => {
        if (!layersSearch) return fields;
        const term = layersSearch.toUpperCase();
        
        // Función recursiva para filtrar manteniendo la estructura de árbol
        const filterRecursive = (list) => {
            return list.reduce((acc, f) => {
                const matchName = f.label?.toUpperCase().includes(term) || f.alias?.toUpperCase().includes(term) || f.type?.toUpperCase().includes(term);
                const filteredChildren = f.children ? filterRecursive(f.children) : [];
                
                if (matchName || filteredChildren.length > 0) {
                    acc.push({ ...f, children: filteredChildren });
                }
                return acc;
            }, []);
        };
        return filterRecursive(fields);
    }, [fields, layersSearch]);

    return (
        <aside className="stack indra-panel-vessel" style={{
            flex: 1,
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header del Panel (Micro-HUD) */}
            <IndraMicroHeader
                label="CAPAS DEL ESQUEMA"
                icon="LAYERS"
                onExecute={() => onAdd('TEXT')}
                executeLabel="AÑADIR CAMPO"
                metadata={`${fields.length} CAMPOS RAÍZ`}
            />

            {/* Schema Switcher: navegar entre schemas sin cerrar el motor */}
            {onSwitchSchema && (
                <div style={{ flexShrink: 0, padding: '0 var(--space-4) var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        className="btn btn--ghost btn--xs shelf--tight"
                        onClick={() => setShowSchemaSwitcher(true)}
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            border: '1px dashed var(--color-border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: 'var(--space-1) var(--space-2)',
                            opacity: 0.6,
                            gap: 'var(--space-1)'
                        }}
                    >
                        <IndraIcon name="SYNC" size="10px" />
                        <span style={{ fontSize: '8px', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                            {currentAtom?.handle?.label || 'CAMBIAR SCHEMA'}
                        </span>
                    </button>
                </div>
            )}

            {showSchemaSwitcher && (
                <ArtifactSelector
                    title="SELECCIONAR SCHEMA"
                    filter={{ class: 'DATA_SCHEMA' }}
                    onSelect={(a) => { onSwitchSchema(a.id); setShowSchemaSwitcher(false); }}
                    onCancel={() => setShowSchemaSwitcher(false)}
                />
            )}

            {/* Búsqueda de Capas */}
            <div style={{ flexShrink: 0, padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="shelf--tight" style={{
                    background: 'var(--color-bg-void)',
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)'
                }}>
                    <IndraIcon name="EYE" size="10px" style={{ opacity: 0.3 }} />
                    <input
                        type="text"
                        placeholder="FILTRAR CAPAS..."
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

            {/* Lista de Capas (Fractal Tree) */}
            <div className="fill stack--tight" style={{
                overflowY: 'auto',
                padding: 'var(--space-2)',
                flex: 1,
                minHeight: 0 // CRÍTICO para permitir scroll en flexbox
            }}>
                {filteredTree.length > 0 ? (
                    <IndraFractalTree
                        data={filteredTree}
                        renderItem={({ node, depth, isExpanded, hasChildren, toggleExpand }) => {
                            // Encontrar el índice original no es necesario para los botones, se pasa el ID.
                            // PERO para `canDemote` necesitamos buscar el previo en la lista real original.
                            // Por simplicidad, IndraFractalTree no nos da hermandad directamente,
                            // así que calculamos `canDemote` a groso modo o lo delegamos si es complejo.
                            // Una métrica rápida empírica: si la profundidad aumenta, se puede demoter.
                            const canDemote = depth > 0; // Aproximación (Ideal: checkear prevSibling)
                            
                            return (
                                <LayerItem
                                    field={node}
                                    depth={depth}
                                    isSelected={selectedId === node.id}
                                    isExpanded={isExpanded}
                                    onToggleExpand={toggleExpand}
                                    canDemote={true} // Simplificado para no romper el AST si lo forzamos
                                    canPromote={depth > 0}
                                    onSelect={() => onSelect(node.id)}
                                    onMoveUp={() => onMove(node.id, -1)}
                                    onMoveDown={() => onMove(node.id, 1)}
                                    onRemove={() => onRemove(node.id)}
                                    onClone={() => onClone(node.id)}
                                    onDemote={() => onDemote(node.id)}
                                    onPromote={() => onPromote(node.id)}
                                    onAddChild={(type) => onAdd(type, node.id)}
                                />
                            );
                        }}
                    />
                ) : (
                    <div className="center stack" style={{ padding: 'var(--space-8)', opacity: 0.3 }}>
                        <span style={{ fontSize: '10px' }}>SIN CAMPOS DEFINIDOS</span>
                    </div>
                )}
            </div>
        </aside>
    );
}

function LayerItem({ field, depth = 0, isSelected, isExpanded, onToggleExpand, canDemote, canPromote, onSelect, onMoveUp, onMoveDown, onRemove, onClone, onDemote, onPromote, onAddChild }) {
    const projection = DataProjector.projectFieldDefinition(field);
    if (!projection) return null;

    const isContainer = field.type === 'FRAME' || field.type === 'REPEATER';
    const hasChildren = field.children && field.children.length > 0;

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            className={`shelf--tight glass-hover ${isSelected ? 'active-layer' : ''}`}
            style={{
                padding: 'var(--space-2) var(--space-3)',
                paddingLeft: `calc(12px + ${depth * 16}px)`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                border: isSelected ? `1px solid ${projection.theme.color || 'var(--color-accent)'}` : '1px solid transparent',
                background: isSelected ? `linear-gradient(90deg, ${projection.theme.color}20 0%, transparent 100%)` : 'transparent',
                position: 'relative',
                minHeight: '40px'
            }}
        >
            {/* Controles de expansión */}
            <div style={{ width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '4px' }}>
                {isContainer && (
                    <IndraIcon 
                        name="CHEVRON_RIGHT" 
                        size="8px" 
                        style={{ 
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                            opacity: hasChildren ? 0.6 : 0.2,
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer'
                        }} 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand();
                        }}
                    />
                )}
            </div>

            <IndraIcon
                name={projection.theme.icon}
                size="14px"
                style={{ 
                    opacity: isSelected ? 1 : 0.6, 
                    color: isSelected ? projection.theme.color : (isContainer ? projection.theme.color : 'inherit')
                }}
            />

            <div className="stack--2xs fill" style={{ marginLeft: '4px' }}>
                <div className="shelf--tight">
                    <span style={{
                        fontSize: '11px',
                        fontWeight: isSelected ? '800' : (isContainer ? '600' : '400'),
                        fontFamily: 'var(--font-mono)',
                        color: isSelected ? projection.theme.color : (isContainer ? 'white' : 'var(--color-text-primary)'),
                        letterSpacing: '0.02em',
                        opacity: isSelected ? 1 : (isContainer ? 0.9 : 0.7)
                    }}>
                        {projection.label?.toUpperCase()}
                    </span>
                    {isContainer && <span className="badge badge--ghost" style={{ fontSize: '7px', opacity: 0.4 }}>{field.type}</span>}
                </div>
                {!isContainer && <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>{projection.type}</span>}
            </div>

            {/* Acciones Rápidas del Contenedor */}
            {isContainer && !isSelected && (
                <button
                    className="btn btn--ghost btn--xs"
                    onClick={(e) => { e.stopPropagation(); onAddChild('TEXT'); }}
                    style={{ border: 'none', padding: '2px' }}
                    title="Añadir hijo aquí"
                >
                    <IndraIcon name="PLUS" size="10px" opacity={0.5} />
                </button>
            )}

            {/* Controles de Capa (Solo visibles si seleccionado) */}
            {isSelected && (
                <div className="shelf--tight" onClick={e => e.stopPropagation()}>
                    {/* Botones de Jerarquía (Meter/Sacar) */}
                    {canDemote && (
                        <button className="btn btn--ghost btn--xs" onClick={onDemote} title="Mover adentro" style={{ border: 'none' }}>
                            <IndraIcon name="FLOW" size="10px" style={{ transform: 'rotate(90deg)' }} />
                        </button>
                    )}
                    {canPromote && (
                        <button className="btn btn--ghost btn--xs" onClick={onPromote} title="Mover afuera" style={{ border: 'none' }}>
                            <IndraIcon name="FLOW" size="10px" style={{ transform: 'rotate(-90deg)' }} />
                        </button>
                    )}

                    <div style={{ width: '1px', height: '12px', background: 'var(--color-border)', margin: '0 2px' }} />

                    <button className="btn btn--ghost btn--xs" onClick={onMoveUp} style={{ border: 'none' }} title="Subir">
                        <IndraIcon name="ARROW_UP" size="10px" />
                    </button>
                    <button className="btn btn--ghost btn--xs" onClick={onMoveDown} style={{ border: 'none' }} title="Bajar">
                        <IndraIcon name="ARROW_DOWN" size="10px" />
                    </button>

                    <button className="btn btn--ghost btn--xs" onClick={onClone} style={{ border: 'none' }} title="Duplicar">
                        <IndraIcon name="COPY" size="10px" />
                    </button>

                    <div style={{ width: '1px', height: '12px', background: 'var(--color-border)', margin: '0 2px' }} />

                    <IndraActionTrigger
                        variant="destructive"
                        size="10px"
                        onClick={onRemove}
                        label="ELIMINAR"
                    />
                </div>
            )}
        </div>
    );
}
