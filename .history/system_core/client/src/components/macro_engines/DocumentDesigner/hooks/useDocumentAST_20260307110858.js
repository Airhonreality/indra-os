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
            children: type === 'FRAME' || type === 'ITERATOR' ? [] : undefined
        };

        setBlocks(prev => {
            if (!parentId) return [...prev, newNode];
            return updateNodeInTree(prev, parentId, {
                children: [...(findNode(prev, parentId)?.children || []), newNode]
            });
        });

        return newNode.id; // Retornamos el ID para que el llamador decida si seleccionarlo
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
        setBlocks(prev => removeNodeFromTree(prev, id));
    }, []);

    return {
        blocks,
        setBlocks,
        findNode: (id) => findNode(blocks, id),
        addNode,
        updateNode,
        moveNode,
        removeNode
    };
}

function getDefaultProps(type) {
    switch (type) {
        case 'FRAME':
            return {
                direction: 'column',
                padding: '10mm',
                gap: '5mm',
                background: 'transparent',
                width: '100%',
                minHeight: '20mm'
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

