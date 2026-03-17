/**
 * =============================================================================
 * ARTEFACTO: components/utilities/SchemaMicroExplorer.jsx
 * RESPONSABILIDAD: Explorador de estructuras de datos ultra-compacto e INTELIGENTE.
 * DHARMA:
 *   - Visualización recursiva de alta densidad con control de expansión.
 *   - Normalización Sincera: Acepta tanto átomos crudos como proyecciones.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from './IndraIcons';
import { DataProjector } from '../../services/DataProjector';

export function SchemaMicroExplorer({ 
    schema, 
    onFieldClick, 
    onAddClick, 
    onContextMenu, 
    selectedId 
}) {
    const [expandedIds, setExpandedIds] = useState(new Set());

    if (!schema) return null;
    
    // Suportar tanto atom.payload.fields como schema.fields (Normalización)
    const fields = schema.payload?.fields || schema.fields || [];
    if (fields.length === 0) return (
        <div style={{ padding: '8px', opacity: 0.3, fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
            [EMPTY_SCHEMA]
        </div>
    );

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div className="schema-micro-explorer stack--none" style={{ marginTop: '4px' }}>
            <RecursiveTree 
                fields={fields} 
                depth={0} 
                onFieldClick={onFieldClick}
                onAddClick={onAddClick}
                onContextMenu={onContextMenu}
                selectedId={selectedId}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
            />
        </div>
    );
}

function RecursiveTree({ fields, depth, onFieldClick, onAddClick, onContextMenu, selectedId, expandedIds, onToggleExpand }) {
    return fields.map(field => {
        const isExpanded = expandedIds.has(field.id);
        const hasChildren = field.children && field.children.length > 0;

        return (
            <React.Fragment key={field.id}>
                <SchemaTreeItem 
                    field={field} 
                    depth={depth} 
                    onFieldClick={onFieldClick}
                    onAddClick={onAddClick}
                    onContextMenu={onContextMenu}
                    isSelected={selectedId === field.id}
                    isExpanded={isExpanded}
                    onToggleExpand={() => onToggleExpand(field.id)}
                />
                {hasChildren && isExpanded && (
                    <RecursiveTree 
                        fields={field.children} 
                        depth={depth + 1} 
                        onFieldClick={onFieldClick}
                        onAddClick={onAddClick}
                        onContextMenu={onContextMenu}
                        selectedId={selectedId}
                        expandedIds={expandedIds}
                        onToggleExpand={onToggleExpand}
                    />
                )}
            </React.Fragment>
        );
    });
}

function SchemaTreeItem({ field, depth, onFieldClick, onAddClick, onContextMenu, isSelected, isExpanded, onToggleExpand }) {
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

            {isContainer && onAddClick && (
                <button 
                    className="btn btn--ghost btn--xs opacity-0 hover-opacity-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddClick(field.id);
                    }}
                    style={{ padding: '0 4px', border: 'none', background: 'transparent' }}
                >
                    <IndraIcon name="PLUS" size="8px" />
                </button>
            )}
        </div>
    );
}
