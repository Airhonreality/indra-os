/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/hooks/useDocumentAST.js
 * RESPONSABILIDAD: Gestión de mutaciones inmutables del Árbol de Sintaxis (AST).
 * =============================================================================
 */

import { useState, useCallback } from 'react';

export function useDocumentAST(initialBlocks = []) {
    const [blocks, setBlocks] = useState(initialBlocks);

    // Búsqueda recursiva de un nodo
    const findNode = (nodes, id) => {
        for (let node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    // ... (logic for updateNodeInTree, removeNodeFromTree remains same)

    // Actualización recursiva inmutable
    const updateNodeInTree = (nodes, id, newData) => {
        return nodes.map(node => {
            if (node.id === id) {
                return { ...node, ...newData };
            }
            if (node.children) {
                return { ...node, children: updateNodeInTree(node.children, id, newData) };
            }
            return node;
        });
    };

    // Eliminación recursiva inmutable
    const removeNodeFromTree = (nodes, id) => {
        return nodes.filter(node => {
            if (node.id === id) return false;
            if (node.children) {
                node.children = removeNodeFromTree(node.children, id);
            }
            return true;
        });
    };

    // Añadir nodo a un padre específico (o al root si parentId es null)
    const addNode = useCallback((type, parentId = null) => {
        const newNode = {
            id: `block_${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            props: getDefaultProps(type),
            children: (type === 'FRAME' || type === 'ITERATOR' || type === 'PAGE') ? [] : undefined
        };

        setBlocks(prev => {
            let actualParentId = parentId;

            // Axioma ontológico: PAGE siempre es nivel raíz
            if (type === 'PAGE') {
                return [...prev, newNode];
            }

            // Verificamos si el padre es un contenedor válido
            if (actualParentId) {
                const parentNode = findNode(prev, actualParentId);
                // Si el padre no es un contenedor, forzamos al root o la primera página
                if (parentNode && parentNode.type !== 'FRAME' && parentNode.type !== 'ITERATOR' && parentNode.type !== 'PAGE') {
                    actualParentId = prev[0]?.id || 'root';
                }
            }

            // Si no hay padre o decidimos ir al root
            const targetId = actualParentId || 'root';
            const rootExists = findNode(prev, 'root');

            if (rootExists) {
                return updateNodeInTree(prev, targetId, {
                    children: [...(findNode(prev, targetId)?.children || []), newNode]
                });
            } else {
                // Si por alguna razón no hay root, simplemente añadimos al nivel superior
                return [...prev, newNode];
            }
        });

        return newNode.id;
    }, []);

    const updateNode = useCallback((id, newData) => {
        setBlocks(prev => updateNodeInTree(prev, id, newData));
    }, []);

    const moveNode = useCallback((id, direction) => {
        setBlocks(prev => {
            const findAndMove = (nodes) => {
                const index = nodes.findIndex(n => n.id === id);
                if (index !== -1) {
                    const targetIndex = index + direction;
                    if (targetIndex < 0 || targetIndex >= nodes.length) return nodes;
                    const newNodes = [...nodes];
                    [newNodes[index], newNodes[targetIndex]] = [newNodes[targetIndex], newNodes[index]];
                    return newNodes;
                }
                return nodes.map(node => {
                    if (node.children) {
                        return { ...node, children: findAndMove(node.children) };
                    }
                    return node;
                });
            };
            return findAndMove(prev);
        });
    }, []);

    const removeNode = useCallback((id) => {
        if (id === 'root') {
            console.warn('[useAST] Cannot remove root node (Axiomatic Protection)');
            return;
        }
        setBlocks(prev => removeNodeFromTree(prev, id));
    }, []);

    // Mover nodo un nivel hacia ADENTRO (al hermano anterior si es contenedor)
    const indentNode = useCallback((id) => {
        setBlocks(prev => {
            let nodeToIndent = null;
            let parentOfNode = null;
            let prevSibling = null;

            // Buscador de objetivo
            const findContext = (nodes, targetId, parent = null) => {
                const index = nodes.findIndex(n => n.id === targetId);
                if (index !== -1) {
                    nodeToIndent = nodes[index];
                    parentOfNode = parent;
                    prevSibling = index > 0 ? nodes[index - 1] : null;
                    return true;
                }
                for (let n of nodes) {
                    if (n.children && findContext(n.children, targetId, n)) return true;
                }
                return false;
            };

            findContext(prev, id);

            // Solo indentamos si hay un hermano anterior que sea un contenedor (FRAME, ITERATOR)
            if (nodeToIndent && prevSibling && (prevSibling.type === 'FRAME' || prevSibling.type === 'ITERATOR')) {
                // 1. Quitar de su posición actual
                const cleanTree = removeNodeFromTree(prev, id);
                // 2. Insertar en el nuevo padre
                return updateNodeInTree(cleanTree, prevSibling.id, {
                    children: [...(prevSibling.children || []), nodeToIndent]
                });
            }
            return prev;
        });
    }, []);

    // Mover nodo un nivel hacia AFUERA (al abuelo)
    const outdentNode = useCallback((id) => {
        setBlocks(prev => {
            let nodeToMove = null;
            let parentOfNode = null;
            let grandparentOfNode = null;

            const findContext = (nodes, targetId, parent = null, grandparent = null) => {
                const index = nodes.findIndex(n => n.id === targetId);
                if (index !== -1) {
                    nodeToMove = nodes[index];
                    parentOfNode = parent;
                    grandparentOfNode = grandparent;
                    return true;
                }
                for (let n of nodes) {
                    if (n.children && findContext(n.children, targetId, n, parent)) return true;
                }
                return false;
            };

            findContext(prev, id);

            // Solo podemos salir si tenemos un padre y ese padre no es el nivel más alto (opcionalmente)
            if (nodeToMove && parentOfNode) {
                // 1. Quitar de su padre actual
                const cleanTree = removeNodeFromTree(prev, id);

                // 2. Insertar en el abuelo (o en el root si no hay abuelo)
                if (grandparentOfNode) {
                    const children = grandparentOfNode.children || [];
                    const parentIndex = children.findIndex(n => n.id === parentOfNode.id);
                    const newChildren = [...children];
                    newChildren.splice(parentIndex + 1, 0, nodeToMove);

                    return updateNodeInTree(cleanTree, grandparentOfNode.id, {
                        children: newChildren
                    });
                } else {
                    // Si el padre está en el root, el nodo sale al root
                    const parentIndex = cleanTree.findIndex(n => n.id === parentOfNode.id);
                    const newTree = [...cleanTree];
                    newTree.splice(parentIndex + 1, 0, nodeToMove);
                    return newTree;
                }
            }
            return prev;
        });
    }, []);

    return {
        blocks,
        setBlocks,
        findNode: (id) => findNode(blocks, id),
        addNode,
        updateNode,
        moveNode,
        indentNode,
        outdentNode,
        removeNode
    };
}

function getDefaultProps(type) {
    switch (type) {
        case 'PAGE':
            return {
                width: '210mm',
                minHeight: '297mm',
                background: '#ffffff',
                padding: '20mm',
                direction: 'column',
                gap: '10px',
                color: '#1a1a1a',
                overflow: 'visible'
            };
        case 'FRAME':
            return {
                direction: 'column',
                padding: 'var(--space-4)',
                gap: 'var(--space-4)',
                background: 'transparent',
                width: '100%',
                overflow: 'visible'
            };
        case 'TEXT':
            return {
                content: 'AXIOMATIC_TEXT_BLOCK...',
                fontSize: '12pt',
                color: '#1a1a1a',
                fontFamily: 'Inter, sans-serif'
            };
        case 'IMAGE':
            return {
                src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400',
                width: '100mm',
                height: '60mm',
                objectFit: 'cover'
            };
        case 'ITERATOR':
            return {
                source: null,
                direction: 'column',
                gap: '5mm'
            };
        default:
            return {};
    }
}

