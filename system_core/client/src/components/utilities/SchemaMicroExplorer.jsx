/**
 * =============================================================================
 * ARTEFACTO: components/utilities/SchemaMicroExplorer.jsx
 * RESPONSABILIDAD: Explorador de estructuras de datos ultra-compacto e INTELIGENTE.
 * DHARMA:
 *   - Visualización recursiva de alta densidad con control de expansión.
 *   - Normalización Sincera: Acepta tanto átomos crudos como proyecciones.
 * =============================================================================
 */

import React from 'react';
import { IndraIcon } from './IndraIcons';
import { DataProjector } from '../../services/DataProjector';
import { IndraFractalTree } from './IndraFractalTree';

export function SchemaMicroExplorer({ 
    schema, 
    onFieldClick, 
    onAddClick, 
    onInsertField,
    onCopyField,
    onContextMenu, 
    selectedId 
}) {
    // Soportar tanto atom.payload.fields como schema.fields (Normalización)
    const fields = schema?.payload?.fields || schema?.fields || [];
    
    if (!schema) return null;
    if (fields.length === 0) return (
        <div style={{ padding: '8px', opacity: 0.3, fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
            [EMPTY_SCHEMA]
        </div>
    );

    return (
        <div className="schema-micro-explorer stack--none" style={{ marginTop: '4px' }}>
            <IndraFractalTree 
                data={fields}
                defaultExpanded={false}
                renderItem={({ node, depth, isExpanded, hasChildren, toggleExpand }) => (
                    <SchemaTreeItem 
                        field={node} 
                        depth={depth} 
                        isSelected={selectedId === node.id}
                        isExpanded={isExpanded}
                        onToggleExpand={toggleExpand}
                        onFieldClick={onFieldClick}
                        onAddClick={onAddClick}
                        onInsertField={onInsertField}
                        onCopyField={onCopyField}
                        onContextMenu={onContextMenu}
                    />
                )}
            />
        </div>
    );
}

function SchemaTreeItem({ field, depth, onFieldClick, onAddClick, onInsertField, onCopyField, onContextMenu, isSelected, isExpanded, onToggleExpand }) {
    const projection = DataProjector.projectFieldDefinition(field);
    const isContainer = field.type === 'FRAME' || field.type === 'REPEATER';
    const hasChildren = field.children && field.children.length > 0;

    return (
        <div 
            className={`schema-tree-item shelf--tight glass-hover ${isSelected ? 'active' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                if (onFieldClick) onFieldClick(field);
                if (isContainer) onToggleExpand();
            }}
            onContextMenu={(e) => {
                if (onContextMenu) {
                    e.preventDefault();
                    onContextMenu(e, field);
                }
            }}
            style={{
                padding: '2px 8px',
                paddingLeft: `calc(4px + ${depth * 10}px)`,
                cursor: 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-mono)',
                color: isSelected ? projection.theme.color : 'var(--color-text-primary)',
                background: isSelected ? `${projection.theme.color}15` : 'transparent',
                borderLeft: isSelected ? `2px solid ${projection.theme.color}` : '2px solid transparent',
                minHeight: '22px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
                opacity: isSelected ? 1 : 0.8
            }}
        >
            <div style={{ width: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isContainer && (
                    <IndraIcon 
                        name="CHEVRON_RIGHT" 
                        size="6px" 
                        style={{ 
                            transform: isExpanded ? 'rotate(90deg)' : 'none',
                            opacity: hasChildren ? 0.6 : 0.2,
                            transition: 'transform 0.2s ease'
                        }} 
                    />
                )}
            </div>

            <IndraIcon 
                name={projection.theme.icon} 
                size="10px" 
                style={{ opacity: 0.5, color: projection.theme.color }} 
            />
            
            <span className="fill truncate" style={{ letterSpacing: '0.02em' }}>
                {field.alias?.toUpperCase() || field.label?.toUpperCase()}
            </span>

            <div className="shelf--tight" style={{ gap: '2px' }}>
                {onCopyField && (
                    <button
                        className="btn btn--ghost btn--xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCopyField(field);
                        }}
                        title="COPY_PLACEHOLDER"
                        style={{ padding: '0 4px', border: 'none', background: 'transparent', opacity: 0.75 }}
                    >
                        <IndraIcon name="COPY" size="9px" />
                    </button>
                )}
                {onInsertField && (
                    <button
                        className="btn btn--ghost btn--xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            onInsertField(field);
                        }}
                        title="INSERT_PLACEHOLDER"
                        style={{ padding: '0 4px', border: 'none', background: 'transparent', opacity: 0.85, color: 'var(--color-accent)' }}
                    >
                        <IndraIcon name="PLUS" size="9px" />
                    </button>
                )}
                {isContainer && onAddClick && (
                    <button 
                        className="btn btn--ghost btn--xs"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddClick(field.id);
                        }}
                        title="ADD_CHILD_FIELD"
                        style={{ padding: '0 4px', border: 'none', background: 'transparent', opacity: 0.75 }}
                    >
                        <IndraIcon name="PLUS" size="8px" />
                    </button>
                )}
            </div>
        </div>
    );
}
