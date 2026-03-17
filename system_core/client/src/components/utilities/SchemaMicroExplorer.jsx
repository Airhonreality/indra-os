/**
 * =============================================================================
 * ARTEFACTO: components/utilities/SchemaMicroExplorer.jsx
 * RESPONSABILIDAD: Explorador de estructuras de datos ultra-compacto.
 * DHARMA:
 *   - Visualización recursiva de alta densidad.
 *   - Identidad Visual: Usa los tokens del DataProjector.
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
    if (!schema || !schema.payload?.fields) return null;

    return (
        <div className="schema-micro-explorer stack--tight">
            <RecursiveTree 
                fields={schema.payload.fields} 
                depth={0} 
                onFieldClick={onFieldClick}
                onAddClick={onAddClick}
                onContextMenu={onContextMenu}
                selectedId={selectedId}
            />
        </div>
    );
}

function RecursiveTree({ fields, depth, onFieldClick, onAddClick, onContextMenu, selectedId }) {
    return fields.map(field => (
        <React.Fragment key={field.id}>
            <SchemaTreeItem 
                field={field} 
                depth={depth} 
                onFieldClick={onFieldClick}
                onAddClick={onAddClick}
                onContextMenu={onContextMenu}
                isSelected={selectedId === field.id}
            />
            {field.children && field.children.length > 0 && (
                <RecursiveTree 
                    fields={field.children} 
                    depth={depth + 1} 
                    onFieldClick={onFieldClick}
                    onAddClick={onAddClick}
                    onContextMenu={onContextMenu}
                    selectedId={selectedId}
                />
            )}
        </React.Fragment>
    ));
}

function SchemaTreeItem({ field, depth, onFieldClick, onAddClick, onContextMenu, isSelected }) {
    const projection = DataProjector.projectFieldDefinition(field);
    const isContainer = field.type === 'FRAME' || field.type === 'REPEATER';

    return (
        <div 
            className={`schema-tree-item shelf--tight glass-hover ${isSelected ? 'active' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                if (onFieldClick) onFieldClick(field);
            }}
            onContextMenu={(e) => {
                if (onContextMenu) {
                    e.preventDefault();
                    onContextMenu(e, field);
                }
            }}
            style={{
                padding: '4px 8px',
                paddingLeft: `calc(8px + ${depth * 12}px)`,
                cursor: 'pointer',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: isSelected ? projection.theme.color : 'var(--color-text-primary)',
                background: isSelected ? `${projection.theme.color}20` : 'transparent',
                borderLeft: isSelected ? `2px solid ${projection.theme.color}` : '2px solid transparent',
                minHeight: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
            }}
        >
            <IndraIcon 
                name={projection.theme.icon} 
                size="12px" 
                style={{ opacity: 0.6, color: projection.theme.color }} 
            />
            
            <span className="fill truncate" title={field.label}>
                {field.alias?.toUpperCase() || field.label?.toUpperCase()}
            </span>

            {isContainer && onAddClick && (
                <button 
                    className="btn btn--ghost btn--xs opacity-20 hover-opacity-100"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddClick(field.id);
                    }}
                    style={{ padding: '2px', border: 'none' }}
                >
                    <IndraIcon name="PLUS" size="10px" />
                </button>
            )}
        </div>
    );
}
