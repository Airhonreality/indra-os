/**
 * =============================================================================
 * ARTEFACTO: components/utilities/IndraFractalTree.jsx
 * RESPONSABILIDAD: Motor Recursivo Universal para Visualización de Jerarquías.
 *
 * DHARMA:
 *   - Agnosticidad Total: Solo maneja la recursión, la profundidad y el colapso.
 *   - Estética Inherente: inyecta las guías de profundidad canonicas de Indra.
 *   - Delegación de Responsabilidad: El renderizado visual de cada nodo se delega
 *     a través de la prop `renderItem`.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';

export function IndraFractalTree({ 
    data = [], 
    renderItem, 
    childrenKey = 'children',
    idKey = 'id',
    defaultExpanded = true 
}) {
    // Inicializar estado de expansión
    const [expandedIds, setExpandedIds] = useState(() => {
        const initial = new Set();
        if (defaultExpanded) {
            const traverse = (list) => {
                list.forEach(item => {
                    initial.add(item[idKey]);
                    if (item[childrenKey]) traverse(item[childrenKey]);
                });
            };
            traverse(data);
        }
        return initial;
    });

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="indra-fractal-tree stack--none fill" style={{ position: 'relative' }}>
            <RecursiveNodeList 
                list={data}
                depth={0}
                renderItem={renderItem}
                childrenKey={childrenKey}
                idKey={idKey}
                expandedIds={expandedIds}
                toggleExpand={toggleExpand}
            />
        </div>
    );
}

function RecursiveNodeList({ list, depth, renderItem, childrenKey, idKey, expandedIds, toggleExpand }) {
    return list.map((node, index) => {
        const nodeId = node[idKey];
        const isExpanded = expandedIds.has(nodeId);
        const children = node[childrenKey] || [];
        const hasChildren = children.length > 0;

        return (
            <React.Fragment key={nodeId}>
                <FractalNodeWrapper 
                    depth={depth}
                    isLast={index === list.length - 1} // Podría usarse para estilos futuros
                >
                    {renderItem({ 
                        node, 
                        depth, 
                        isExpanded, 
                        hasChildren, 
                        toggleExpand: () => toggleExpand(nodeId)
                    })}
                </FractalNodeWrapper>

                {hasChildren && isExpanded && (
                    <RecursiveNodeList 
                        list={children}
                        depth={depth + 1}
                        renderItem={renderItem}
                        childrenKey={childrenKey}
                        idKey={idKey}
                        expandedIds={expandedIds}
                        toggleExpand={toggleExpand}
                    />
                )}
            </React.Fragment>
        );
    });
}

function FractalNodeWrapper({ children, depth }) {
    return (
        <div style={{ position: 'relative' }}>
            {/* Guía de Profundidad Fractal (Canon de Indra) */}
            {depth > 0 && (
                <div style={{
                    position: 'absolute',
                    left: `calc(${(depth - 1) * 16}px + 12px)`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: 'var(--color-border)',
                    opacity: 0.3,
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />
            )}
            
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}
