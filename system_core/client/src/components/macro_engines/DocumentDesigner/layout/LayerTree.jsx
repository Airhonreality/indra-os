/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/layout/LayerTree.jsx
 * RESPONSABILIDAD: Índice visual jerárquico de las capas (nodos) del AST.
 *
 * FASE 2 (ADR_018):
 * - ↑ ↓ siempre visibles a baja opacidad, se elevan en hover/selección.
 * - Botón DUPLICATE en cada fila (deshabilitado en root).
 * - DragHandle para reordenamiento drag-and-drop entre hermanos del mismo padre.
 * - Badge HEAD_LOCKED en el nodo root.
 * - Controles de indent/outdent ← → visibles solo al seleccionar (poco frecuentes).
 *
 * AXIOMA A6 (ADR_018 / ADR_004 §A6):
 * La indentación del árbol es un valor computado en JS (padding-left).
 * Es la ÚNICA excepción al uso de style inline. Todo lo demás usa clases y data-*.
 * =============================================================================
 */

import React, { useState, useRef, useCallback } from 'react';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../../utilities/IndraActionTrigger';
import { DragHandle } from '../../../utilities/primitives/DragHandle';
import { useAST } from '../context/ASTContext';
import { useSelection } from '../context/SelectionContext';
import { IndraFractalTree } from '../../../utilities/IndraFractalTree';

// ── Mapa de iconos canónico ───────────────────────────────────────────────────
const BLOCK_ICONS = {
    PAGE:     'DOCUMENT',
    FRAME:    'FRAME',
    TEXT:     'TEXT',
    IMAGE:    'IMAGE',
    ITERATOR: 'REPEATER',
};

// ── Color de acento por tipo de bloque ────────────────────────────────────────
const BLOCK_COLORS = {
    PAGE:     'var(--color-accent)',
    FRAME:    'var(--color-warm)',
    TEXT:     'var(--color-success)',
    IMAGE:    'var(--color-cold)',
    ITERATOR: 'var(--color-cold)',
};

// ── LayerRow — Renderizador de fila individual ────────────────────────────────
function LayerRow({ node, depth, isExpanded, hasChildren, toggleExpand }) {
    const { moveNode, indentNode, outdentNode, removeNode, duplicateNode } = useAST();
    const { selectedId, selectNode }  = useSelection();
    const [isHovered, setIsHovered]   = useState(false);

    const isRoot = node.id === 'root';
    const isSelected  = selectedId === node.id;
    const blockColor  = BLOCK_COLORS[node.type] || 'var(--color-text-secondary)';

    // ── Drag-and-drop Logic ──
    const handleDragStart = useCallback((e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', node.id);
        setTimeout(() => { if (e.target) e.target.setAttribute('data-dragging', 'true'); }, 0);
    }, [node.id]);

    const handleDragEnd = useCallback((e) => { e.target.removeAttribute('data-dragging'); }, []);
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.setAttribute('data-drop-target', 'true'); }, []);
    const handleDragLeave = useCallback((e) => { e.currentTarget.removeAttribute('data-drop-target'); }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.removeAttribute('data-drop-target');
        const draggedId = e.dataTransfer.getData('text/plain');
        if (!draggedId || draggedId === node.id) return;
        selectNode(draggedId);
    }, [node.id, selectNode]);

    return (
        <div
            className="layer-row"
            data-selected={isSelected}
            data-hovered={isHovered}
            onClick={() => selectNode(node.id)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
                // El padding lateral lo maneja la profundidad del árbol, 
                // pero mantenemos un gutter mínimo para el drag handle.
                paddingLeft: `calc(12px + ${depth * 2}px)`, 
            }}
        >
            {!isRoot ? (
                <div draggable onDragStart={handleDragStart} onDragEnd={handleDragEnd} style={{ display: 'flex' }}>
                    <DragHandle size="10px" style={{ opacity: isHovered || isSelected ? 0.6 : 0.15 }} />
                </div>
            ) : <div style={{ width: '14px' }} />}

            <div
                className="layer-row__chevron"
                onClick={(e) => { e.stopPropagation(); if (hasChildren) toggleExpand(); }}
                style={{ opacity: hasChildren ? (isSelected ? 0.8 : 0.4) : 0 }}
            >
                <IndraIcon
                    name="CHEVRON_RIGHT"
                    size="8px"
                    style={{
                        transform: (isExpanded && hasChildren) ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                    }}
                />
            </div>

            <IndraIcon
                name={BLOCK_ICONS[node.type] || 'ATOM'}
                size="10px"
                style={{ color: isSelected ? blockColor : 'inherit', opacity: isSelected ? 1 : 0.5, flexShrink: 0 }}
            />

            <span className="layer-row__label" data-selected={isSelected}>
                {node.props?.label || node.type}
            </span>

            <span className="layer-row__id">#{node.id.slice(-4)}</span>

            {isRoot && <span className="layer-row__badge">ROOT</span>}

            <div style={{ flex: 1 }} />

            {(isHovered || isSelected) && (
                <div className="layer-row__actions shelf--tight">
                    {!isRoot && (
                        <>
                            <button className="layer-ctrl-btn" onClick={() => moveNode(node.id, -1)} title="MOVE_UP"><IndraIcon name="ARROW_UP" size="9px" /></button>
                            <button className="layer-ctrl-btn" onClick={() => moveNode(node.id, 1)} title="MOVE_DOWN"><IndraIcon name="ARROW_DOWN" size="9px" /></button>
                            <button className="layer-ctrl-btn" onClick={() => outdentNode(node.id)} title="OUTDENT"><IndraIcon name="ARROW_LEFT" size="9px" /></button>
                            <button className="layer-ctrl-btn" onClick={() => indentNode(node.id)} title="INDENT"><IndraIcon name="ARROW_RIGHT" size="9px" /></button>
                        </>
                    )}
                    <button className="layer-ctrl-btn" onClick={() => duplicateNode && duplicateNode(node.id)} disabled={isRoot} title="DUPLICATE"><IndraIcon name="COPY" size="9px" /></button>
                    {!isRoot && (
                        <IndraActionTrigger icon="DELETE" size="9px" requiresHold={true} onClick={() => removeNode(node.id)} color="var(--color-danger)" />
                    )}
                </div>
            )}
        </div>
    );
}

// ── LayerTree — Punto de entrada público ─────────────────────────────────────
export function LayerTree({ node }) {
    // Si recibimos un solo nodo, lo envolvemos en array para el motor.
    // Generalmente recibimos la raíz del documento.
    const data = Array.isArray(node) ? node : [node];
    
    return (
        <IndraFractalTree 
            data={data}
            renderItem={LayerRow}
            defaultExpanded={true}
        />
    );
}

// ── Estilos encapsulados del LayerTree ────────────────────────────────────────

export const LAYER_TREE_STYLES = `
    /* ── Nodo contenedor ─────────────────────────────────────────────── */
    .layer-tree-node {
        display: flex;
        flex-direction: column;
    }

    /* ── Fila de la capa ─────────────────────────────────────────────── */
    .layer-row {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 3px;
        padding-top: var(--space-1);
        padding-bottom: var(--space-1);
        padding-right: var(--space-2);
        border-radius: var(--radius-sm);
        cursor: pointer;
        min-height: 26px;
        border-left: 2px solid transparent;
        transition: background 0.1s, border-color 0.15s;
        position: relative;
    }

    .layer-row:hover,
    .layer-row[data-hovered="true"] {
        background: var(--color-bg-hover);
    }

    .layer-row[data-selected="true"] {
        background: var(--color-accent-dim);
        border-left-color: var(--color-accent);
    }

    /* Estado drag-over: indica zona de drop */
    .layer-row[data-drop-target="true"] {
        background: rgba(0, 245, 212, 0.08);
        border-left-color: var(--color-accent);
        outline: 1px dashed var(--color-accent);
    }

    /* Nodo siendo arrastrado */
    .layer-tree-node[data-dragging="true"] > .layer-row {
        opacity: 0.4;
    }

    /* ── Label de la capa ────────────────────────────────────────────── */
    .layer-row__label {
        font-size: 11px;
        font-family: var(--font-mono);
        opacity: 0.75;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
        min-width: 0;
    }

    .layer-row__label[data-selected="true"] {
        opacity: 1;
        color: var(--color-accent);
    }

    /* ── ID corto ────────────────────────────────────────────────────── */
    .layer-row__id {
        font-size: 7px;
        font-family: var(--font-mono);
        opacity: 0.15;
        flex-shrink: 0;
        letter-spacing: 0.05em;
    }

    /* ── Badge ROOT ──────────────────────────────────────────────────── */
    .layer-row__badge {
        font-size: 6px;
        font-family: var(--font-mono);
        color: var(--color-accent);
        border: 1px solid var(--color-accent-glow);
        border-radius: 2px;
        padding: 1px 3px;
        opacity: 0.5;
        flex-shrink: 0;
        letter-spacing: 0.08em;
    }

    .layer-row__badge--abs {
        color: var(--color-text-primary);
        border-color: var(--color-border);
        opacity: 0.8;
    }

    /* ── Chevron zona de click ───────────────────────────────────────── */
    .layer-row__chevron {
        width: 12px;
        height: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        cursor: pointer;
        transition: opacity 0.15s;
    }

    .layer-row__chevron:hover {
        opacity: 0.9 !important;
    }

    /* ── Controles ↑↓ siempre presentes ─────────────────────────────── */
    .layer-row__move-controls {
        display: flex;
        gap: 1px;
        opacity: 0.15;
        flex-shrink: 0;
        transition: opacity 0.15s;
    }

    .layer-row__move-controls[data-visible="true"] {
        opacity: 0.7;
    }

    /* ── Controles ←→ solo al seleccionar ───────────────────────────── */
    .layer-row__indent-controls {
        display: flex;
        gap: 1px;
        flex-shrink: 0;
    }

    /* ── Botón de control atómico ────────────────────────────────────── */
    .layer-ctrl-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-secondary);
        border-radius: 2px;
        transition: background 0.1s, color 0.1s;
        flex-shrink: 0;
    }

    .layer-ctrl-btn:hover:not(:disabled) {
        background: var(--color-bg-elevated);
        color: var(--color-text-primary);
    }

    .layer-ctrl-btn:disabled {
        opacity: 0.1;
        cursor: not-allowed;
    }

    /* ── Árbol de hijos ──────────────────────────────────────────────── */
    .layer-tree-children {
        display: flex;
        flex-direction: column;
    }
`;
