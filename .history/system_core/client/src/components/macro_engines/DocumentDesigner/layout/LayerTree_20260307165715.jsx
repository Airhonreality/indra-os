/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/LayerTree.jsx
 * RESPONSABILIDAD: Índice visual de las capas (nodos) del AST.
 * =============================================================================
 */

import React, { useState } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../../utilities/IndraActionTrigger';

import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';

export function LayerTree({ node, depth }) {
    const { moveNode, indentNode, outdentNode, removeNode } = useAST();
    const { selectedId, selectNode } = useSelection();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    const ICONS = {
        'PAGE': 'DOCUMENT',
        'FRAME': 'FRAME',
        'TEXT': 'TEXT',
        'IMAGE': 'IMAGE',
        'ITERATOR': 'REPEATER'
    };

    return (
        <div className="stack--tight">
            <div
                className="shelf--tight glass-hover"
                onClick={() => selectNode(node.id)}
                style={{
                    padding: 'var(--space-1) var(--space-2)',
                    paddingLeft: `calc(var(--space-2) + ${depth * 12}px)`,
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-accent-dim)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent'
                }}
            >
                {hasChildren && (
                    <div onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}>
                        <IndraIcon
                            name={isCollapsed ? 'EXPAND' : 'CHEVRON_RIGHT'}
                            size="8px"
                            style={{ opacity: 0.5, transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }}
                        />
                    </div>
                )}
                {!hasChildren && <div style={{ width: '8px' }} />}

                <IndraIcon
                    name={ICONS[node.type] || 'ATOM'}
                    size="10px"
                    style={{ color: isSelected ? 'var(--color-accent)' : 'inherit', opacity: isSelected ? 1 : 0.6 }}
                />

                <span style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? 'var(--color-accent)' : 'inherit',
                    opacity: isSelected ? 1 : 0.8,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {node.type}
                </span>

                <span style={{ fontSize: '8px', opacity: 0.2, fontFamily: 'var(--font-mono)' }}>#{node.id.slice(-4)}</span>

                {/* CONTROLES DE CAPA (Solo seleccionados) */}
                {isSelected && (
                    <div className="shelf--tight" onClick={e => e.stopPropagation()} style={{ marginLeft: 'auto' }}>
                        <button className="btn btn--xs btn--ghost" onClick={() => outdentNode(node.id)} title="Outdent (Extraer)" style={{ border: 'none', padding: 0 }}>
                            <IndraIcon name="ARROW_LEFT" size="10px" />
                        </button>
                        <button className="btn btn--xs btn--ghost" onClick={() => indentNode(node.id)} title="Indent (Anidar)" style={{ border: 'none', padding: 0 }}>
                            <IndraIcon name="ARROW_RIGHT" size="10px" />
                        </button>
                        <div style={{ width: '4px' }} />
                        <button className="btn btn--xs btn--ghost" onClick={() => moveNode(node.id, -1)} style={{ border: 'none', padding: 0 }}>
                            <IndraIcon name="ARROW_UP" size="10px" />
                        </button>
                        <button className="btn btn--xs btn--ghost" onClick={() => moveNode(node.id, 1)} style={{ border: 'none', padding: 0 }}>
                            <IndraIcon name="ARROW_DOWN" size="10px" />
                        </button>
                        <IndraActionTrigger
                            icon="DELETE"
                            size="10px"
                            requiresHold={true}
                            holdTime={800}
                            onClick={() => removeNode(node.id)}
                            color="var(--color-danger)"
                        />
                    </div>
                )}
            </div>

            {hasChildren && !isCollapsed && (
                <div className="stack--tight">
                    {node.children.map(child => (
                        <LayerTree
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
