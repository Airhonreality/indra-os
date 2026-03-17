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
import { IndraMicroHeader } from '../../utilities/IndraMicroHeader';
import ArtifactSelector from '../../utilities/ArtifactSelector';

export function LayersPanel({ fields, selectedId, onSelect, onAdd, onRemove, onMove, onClone, onDemote, onPromote, onSwitchSchema, currentAtom }) {

    const [layersSearch, setLayersSearch] = React.useState('');
    const [showSchemaSwitcher, setShowSchemaSwitcher] = React.useState(false);

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
        return list.map((field, index) => {
            const canDemote = index > 0 && (list[index - 1].type === 'FRAME' || list[index - 1].type === 'REPEATER');
            return (
                <React.Fragment key={field.id}>
                    <LayerItem
                        field={field}
                        depth={depth}
                        isSelected={selectedId === field.id}
                        canDemote={canDemote}
                        canPromote={depth > 0}
                        onSelect={() => onSelect(field.id)}
                        onMoveUp={() => onMove(field.id, -1)}
                        onMoveDown={() => onMove(field.id, 1)}
                        onRemove={() => onRemove(field.id)}
                        onClone={() => onClone(field.id)}
                        onDemote={() => onDemote(field.id)}
                        onPromote={() => onPromote(field.id)}
                        onAddChild={(type) => onAdd(type, field.id)}
                    />
                    {field.children && field.children.length > 0 && (
                        <RecursiveLayerList list={field.children} depth={depth + 1} />
                    )}
                </React.Fragment>
            );
        });
    };

    return (
        <aside className="stack" style={{
            width: '300px',
            flexShrink: 0,
            borderRight: '1px solid var(--color-border)',
            background: 'var(--color-bg-elevated)',
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
                metadata={`${fields.length} CAMPOS`}
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

            {/* Lista de Capas */}
            <div className="fill stack--tight" style={{
                overflowY: 'auto',
                padding: 'var(--space-2)',
                flex: 1,
                minHeight: 0 // CRÍTICO para permitir scroll en flexbox
            }}>
                {layersSearch ? (
                    filteredFields.map((field) => (
                        <LayerItem
                            key={field.id}
                            field={field}
                            depth={0}
                            isSelected={selectedId === field.id}
                            onSelect={() => onSelect(field.id)}
                            onMoveUp={() => onMove(field.id, -1)}
                            onMoveDown={() => onMove(field.id, 1)}
                            onRemove={() => onRemove(field.id)}
                        />
                    ))
                ) : (
                    <RecursiveLayerList list={fields} />
                )}

                {fields.length === 0 && (
                    <div className="center stack" style={{ padding: 'var(--space-8)', opacity: 0.3 }}>
                        <span style={{ fontSize: '10px' }}>SIN CAMPOS DEFINIDOS</span>
                    </div>
                )}
            </div>
        </aside>
    );
}

import { DataProjector } from '../../../services/DataProjector';

function LayerItem({ field, depth = 0, isSelected, canDemote, canPromote, onSelect, onMoveUp, onMoveDown, onRemove, onClone, onDemote, onPromote, onAddChild }) {
    const projection = DataProjector.projectFieldDefinition(field);
    if (!projection) return null;

    const isContainer = field.type === 'FRAME' || field.type === 'REPEATER';

    return (
        <div
            onClick={onSelect}
            className={`shelf--tight glass-hover ${isSelected ? 'active-layer' : ''}`}
            style={{
                padding: 'var(--space-2) var(--space-4)',
                paddingLeft: `calc(var(--space-4) + ${depth * 16}px)`,
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                border: isSelected ? `1px solid ${projection.theme.color || 'var(--color-accent)'}` : '1px solid transparent',
                background: isSelected ? `linear-gradient(90deg, ${projection.theme.color}20 0%, transparent 100%)` : 'transparent',
                position: 'relative',
                minHeight: '40px'
            }}
        >
            {/* Guía de profundidad */}
            {depth > 0 && (
                <div style={{
                    position: 'absolute',
                    left: `calc(${depth * 16}px + 4px)`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: 'var(--color-border)',
                    opacity: 0.4
                }} />
            )}

            <IndraIcon
                name={projection.theme.icon}
                size="14px"
                style={{ opacity: isSelected ? 1 : 0.4, color: isSelected ? projection.theme.color : 'inherit' }}
            />

            <div className="stack--tight fill">
                <span style={{
                    fontSize: '10px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? projection.theme.color : 'var(--color-text-primary)',
                    letterSpacing: '0.02em'
                }}>
                    {projection.label?.toUpperCase()}
                </span>
                <span style={{ fontSize: '8px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>{projection.type}</span>
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
