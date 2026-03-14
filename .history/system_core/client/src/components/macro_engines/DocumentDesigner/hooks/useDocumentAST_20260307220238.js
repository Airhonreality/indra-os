/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/hooks/useDocumentAST.js
 * RESPONSABILIDAD: Gestión de mutaciones inmutables del Árbol de Sintaxis (AST).
 * =============================================================================
 */

import { useState, useCallback } from 'react';

export function useDocumentAST(initialBlocks = []) {
    const [blocks, setBlocks] = useState(initialBlocks);
    const [history, setHistory] = useState([JSON.parse(JSON.stringify(initialBlocks))]);
    const [pointer, setPointer] = useState(0);

    const pushToHistory = (newBlocks) => {
        const cleanBlocks = JSON.parse(JSON.stringify(newBlocks));
        const newHistory = history.slice(0, pointer + 1);
        newHistory.push(cleanBlocks);

        // Limit history to 50 steps
        if (newHistory.length > 50) newHistory.shift();

        setHistory(newHistory);
        setPointer(newHistory.length - 1);
    };

    const undo = useCallback(() => {
        if (pointer > 0) {
            const prevPointer = pointer - 1;
            setPointer(prevPointer);
            setBlocks(JSON.parse(JSON.stringify(history[prevPointer])));
        }
    }, [history, pointer]);

    const redo = useCallback(() => {
        if (pointer < history.length - 1) {
            const nextPointer = pointer + 1;
            setPointer(nextPointer);
            setBlocks(JSON.parse(JSON.stringify(history[nextPointer])));
        }
    }, [history, pointer]);

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
            let newNode = { ...node };
            if (newNode.children) {
                newNode.children = removeNodeFromTree(newNode.children, id);
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

        let newTree = [];
        setBlocks(prev => {
            let actualParentId = parentId;

            // Axioma ontológico: PAGE siempre es nivel raíz
            if (type === 'PAGE') {
                newTree = [...prev, newNode];
            } else {
                // Verificamos si el padre es un contenedor válido
                if (actualParentId) {
                    const parentNode = findNode(prev, actualParentId);
                    if (parentNode && parentNode.type !== 'FRAME' && parentNode.type !== 'ITERATOR' && parentNode.type !== 'PAGE') {
                        actualParentId = prev[0]?.id || 'root';
                    }
                }

                const targetId = actualParentId || (prev[0]?.id || 'root');
                const rootExists = findNode(prev, targetId);

                if (rootExists) {
                    newTree = updateNodeInTree(prev, targetId, {
                        children: [...(findNode(prev, targetId)?.children || []), newNode]
                    });
                } else {
                    newTree = [...prev, newNode];
                }
            }
            pushToHistory(newTree);
            return newTree;
        });

        return newNode.id;
    }, [history, pointer]);

    const updateNode = useCallback((id, newData) => {
        setBlocks(prev => {
            const newTree = updateNodeInTree(prev, id, newData);
            pushToHistory(newTree);
            return newTree;
        });
    }, [history, pointer]);

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
            const newTree = findAndMove(prev);
            pushToHistory(newTree);
            return newTree;
        });
    }, [history, pointer]);

    const removeNode = useCallback((id) => {
        if (id === 'root') {
            console.warn('[useAST] Cannot remove root node (Axiomatic Protection)');
            return;
        }
        setBlocks(prev => {
            const newTree = removeNodeFromTree(prev, id);
            pushToHistory(newTree);
            return newTree;
        });
    }, [history, pointer]);

    // Mover nodo un nivel hacia ADENTRO (al hermano anterior si es contenedor)
    const indentNode = useCallback((id) => {
        setBlocks(prev => {
            let nodeToIndent = null;
            let prevSibling = null;

            const findContext = (nodes, targetId) => {
                const index = nodes.findIndex(n => n.id === targetId);
                if (index !== -1) {
                    nodeToIndent = nodes[index];
                    prevSibling = index > 0 ? nodes[index - 1] : null;
                    return true;
                }
                for (let n of nodes) {
                    if (n.children && findContext(n.children, targetId)) return true;
                }
                return false;
            };

            findContext(prev, id);

            if (nodeToIndent && prevSibling && (prevSibling.type === 'FRAME' || prevSibling.type === 'ITERATOR')) {
                const cleanTree = removeNodeFromTree(prev, id);
                const newTree = updateNodeInTree(cleanTree, prevSibling.id, {
                    children: [...(prevSibling.children || []), nodeToIndent]
                });
                pushToHistory(newTree);
                return newTree;
            }
            return prev;
        });
    }, [history, pointer]);

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

            if (nodeToMove && parentOfNode) {
                const cleanTree = removeNodeFromTree(prev, id);
                let newTree;
                if (grandparentOfNode) {
                    const children = grandparentOfNode.children || [];
                    const parentIndex = children.findIndex(n => n.id === parentOfNode.id);
                    const newChildren = [...children];
                    newChildren.splice(parentIndex + 1, 0, nodeToMove);
                    newTree = updateNodeInTree(cleanTree, grandparentOfNode.id, { children: newChildren });
                } else {
                    const parentIndex = cleanTree.findIndex(n => n.id === parentOfNode.id);
                    newTree = [...cleanTree];
                    newTree.splice(parentIndex + 1, 0, nodeToMove);
                }
                pushToHistory(newTree);
                return newTree;
            }
            return prev;
        });
    }, [history, pointer]);

    return {
        blocks,
        setBlocks,
        findNode: (id) => findNode(blocks, id),
        addNode,
        updateNode,
        moveNode,
        indentNode,
        outdentNode,
        removeNode,
        undo,
        redo,
        canUndo: pointer > 0,
        canRedo: pointer < history.length - 1
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

