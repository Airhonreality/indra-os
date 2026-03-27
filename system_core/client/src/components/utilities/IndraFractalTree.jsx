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
    defaultExpanded = false,
    onExpand = null // Nueva prop: async (node) => { return children }
}) {
    // AXIOMA: Estado de expansión y carga de resonancia
    const [expandedIds, setExpandedIds] = useState(() => {
        if (Array.isArray(defaultExpanded)) return new Set(defaultExpanded);
        if (defaultExpanded === true) return new Set(data.map(n => n[idKey]));
        return new Set();
    });
    const [loadingIds, setLoadingIds] = useState(new Set());

    const toggleExpand = async (node) => {
        const id = node[idKey];
        const isExpanded = expandedIds.has(id);

        if (!isExpanded) {
            // Caso: Vamos a expandir. ¿Necesita carga asíncrona (Axioma de Materia Diferida)?
            const hasStaticChildren = node[childrenKey] && node[childrenKey].length > 0;
            
            if (!hasStaticChildren && onExpand) {
                setLoadingIds(prev => new Set(prev).add(id));
                try {
                    await onExpand(node);
                } catch (e) {
                    console.error("[FractalTree] Error en resonancia de rama:", e);
                } finally {
                    setLoadingIds(prev => {
                        const next = new Set(prev);
                        next.delete(id);
                        return next;
                    });
                }
            }
            setExpandedIds(prev => new Set(prev).add(id));
        } else {
            // Caso: Colapsar
            setExpandedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
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
                loadingIds={loadingIds}
                onExpand={onExpand}
                toggleExpand={toggleExpand}
            />
        </div>
    );
}

function RecursiveNodeList({ list, depth, renderItem, childrenKey, idKey, expandedIds, loadingIds, onExpand, toggleExpand }) {
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
                        isLoading: loadingIds.has(nodeId),
                        hasChildren: hasChildren || (!!onExpand && !node.isLeaf), // Axioma: Si hay onExpand y no es hoja, se asume potencial de hijos
                        toggleExpand: () => toggleExpand(node)
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
                        loadingIds={loadingIds}
                        onExpand={onExpand}
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
