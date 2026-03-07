/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/hooks/useDocumentAST.js
 * RESPONSABILIDAD: Gestión de mutaciones inmutables del Árbol de Sintaxis (AST).
 * =============================================================================
 */

import { useState, useCallback } from 'react';

export function useDocumentAST(initialBlocks = []) {
    const [blocks, setBlocks] = useState(initialBlocks);
    const [selectedId, setSelectedId] = useState(null);

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

        setSelectedId(newNode.id);
    }, []);

    const updateNode = useCallback((id, newData) => {
        setBlocks(prev => updateNodeInTree(prev, id, newData));
    }, []);

    const removeNode = useCallback((id) => {
        setBlocks(prev => removeNodeFromTree(prev, id));
        if (selectedId === id) setSelectedId(null);
    }, [selectedId]);

    const selectNode = useCallback((id) => {
        setSelectedId(id);
    }, []);

    return {
        blocks,
        setBlocks,
        selectedId,
        selectNode,
        addNode,
        updateNode,
        removeNode,
        selectedNode: selectedId ? findNode(blocks, selectedId) : null
    };
}

function getDefaultProps(type) {
    switch (type) {
        case 'FRAME':
            return {
                direction: 'column',
                padding: 'var(--space-4)',
                gap: 'var(--space-2)',
                background: 'transparent',
                width: '100%',
                height: 'hug'
            };
        case 'TEXT':
            return {
                content: 'NEW_TEXT_BLOCK...',
                fontSize: 'var(--text-base)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-sans)'
            };
        case 'IMAGE':
            return {
                src: '',
                width: '100%',
                height: '200px',
                objectFit: 'cover'
            };
        case 'ITERATOR':
            return {
                source: null,
                direction: 'column',
                gap: 'var(--space-2)'
            };
        default:
            return {};
    }
}
