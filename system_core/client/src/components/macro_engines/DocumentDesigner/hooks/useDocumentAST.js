/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/hooks/useDocumentAST.js
 * RESPONSABILIDAD: Gestión de mutaciones inmutables del Árbol de Sintaxis (AST).
 * =============================================================================
 */

import { useState, useCallback } from 'react';

// Genera un ID único para nodos duplicados
const genId = () => `block_${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_VARIABLES = {
    colors: [
        { id: 'var_col_1', name: 'ACCENT_CORE', value: '#00f5d4' },
        { id: 'var_col_2', name: 'INK_PRIMARY', value: '#1a1a1a' },
        { id: 'var_col_3', name: 'SURFACE_WHITE', value: '#ffffff' }
    ],
    typography: {
        h1: { fontSize: '32pt', lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '800', fontFamily: 'Inter' },
        h2: { fontSize: '24pt', lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700', fontFamily: 'Inter' },
        paragraph: { fontSize: '11pt', lineHeight: '1.6', letterSpacing: '0', fontWeight: '400', fontFamily: 'Inter' },
        list: { fontSize: '11pt', lineHeight: '1.6', letterSpacing: '0', fontWeight: '400', fontFamily: 'Inter' }
    },
    spacing: {
        gap_sm: '4mm',
        gap_md: '10mm',
        pad_page: '20mm'
    }
};

export function useDocumentAST(initialBlocks = [], initialVariables = null) {
    const [blocks, setBlocks] = useState(initialBlocks);
    const [docVariables, setDocVariables] = useState(initialVariables || DEFAULT_VARIABLES);
    
    // El historial ahora guarda el estado completo (BLOCKS + VARIABLES)
    const [history, setHistory] = useState([{ 
        blocks: JSON.parse(JSON.stringify(initialBlocks)),
        variables: JSON.parse(JSON.stringify(initialVariables || DEFAULT_VARIABLES))
    }]);
    const [pointer, setPointer] = useState(0);

    // ── MOTOR DE HISTORIAL AUTOMÁTICO (Reactivo) ─────────────────────────────
    // Este efecto captura el estado estable y lo inyecta en el historial
    // evitando los cierres (closures) obsoletos de los handlers de mutación.
    const commitToHistory = useCallback((newBlocks, newVars) => {
        setHistory(prev => {
            const nextHistory = prev.slice(0, pointer + 1);
            const entry = {
                blocks: JSON.parse(JSON.stringify(newBlocks)),
                variables: JSON.parse(JSON.stringify(newVars))
            };
            
            // Solo añadir si es diferente al último (para evitar bucles)
            const last = nextHistory[nextHistory.length - 1];
            if (last && JSON.stringify(last) === JSON.stringify(entry)) return prev;

            nextHistory.push(entry);
            if (nextHistory.length > 50) nextHistory.shift();
            return nextHistory;
        });
        setPointer(prev => Math.min(pointer + 1, 49));
    }, [pointer]);

    const undo = useCallback(() => {
        if (pointer > 0) {
            const prevPointer = pointer - 1;
            const state = JSON.parse(JSON.stringify(history[prevPointer]));
            setBlocks(state.blocks);
            setDocVariables(state.variables);
            setPointer(prevPointer);
        }
    }, [history, pointer]);

    const redo = useCallback(() => {
        if (pointer < history.length - 1) {
            const nextPointer = pointer + 1;
            const state = JSON.parse(JSON.stringify(history[nextPointer]));
            setBlocks(state.blocks);
            setDocVariables(state.variables);
            setPointer(nextPointer);
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
            commitToHistory(newTree, docVariables);
            return newTree;
        });

        return newNode.id;
    }, [docVariables, commitToHistory]);

    const updateNode = useCallback((id, newData) => {
        setBlocks(prev => {
            const newTree = updateNodeInTree(prev, id, newData);
            commitToHistory(newTree, docVariables);
            return newTree;
        });
    }, [docVariables, commitToHistory]);

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
            commitToHistory(newTree, docVariables);
            return newTree;
        });
    }, [docVariables, commitToHistory]);

    const removeNode = useCallback((id) => {
        if (id === 'root') {
            console.warn('[useAST] Cannot remove root node (Axiomatic Protection)');
            return;
        }
        setBlocks(prev => {
            const newTree = removeNodeFromTree(prev, id);
            commitToHistory(newTree, docVariables);
            return newTree;
        });
    }, [docVariables, commitToHistory]);

    /**
     * duplicateNode (ADR_018 §A3)
     * Clona el nodo con un nuevo ID (y regenera IDs de hijos recursivamente).
     * El clon se inserta inmediatamente después del original en el mismo padre.
     * Protección: no puede duplicar el nodo root (PAGE).
     */
    const cloneNodeDeep = (node) => ({
        ...node,
        id: genId(),
        props: JSON.parse(JSON.stringify(node.props)),
        children: node.children ? node.children.map(cloneNodeDeep) : undefined
    });


    const insertAfterInTree = (nodes, targetId, newNode) => {
        // Busca en la lista directa
        const idx = nodes.findIndex(n => n.id === targetId);
        if (idx !== -1) {
            const result = [...nodes];
            result.splice(idx + 1, 0, newNode);
            return result;
        }
        // Busca recursivamente en hijos
        return nodes.map(node => {
            if (node.children) {
                return { ...node, children: insertAfterInTree(node.children, targetId, newNode) };
            }
            return node;
        });
    };

    const duplicateNode = useCallback((id) => {
        if (!id || id === 'root') {
            console.warn('[useAST] Cannot duplicate root node (ADR_018 §A7)');
            return;
        }
        setBlocks(prev => {
            const original = findNode(prev, id);
            if (!original) return prev;
            const clone = cloneNodeDeep(original);
            const newTree = insertAfterInTree(prev, id, clone);
            commitToHistory(newTree, docVariables);
            return newTree;
        });
    }, [docVariables, commitToHistory]);

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
                commitToHistory(newTree, docVariables);
                return newTree;
            }
            return prev;
        });
    }, [docVariables, commitToHistory]);

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
                commitToHistory(newTree, docVariables);
                return newTree;
            }
            return prev;
        });
    }, [docVariables, commitToHistory]);

    // ── GESTIÓN DE VARIABLES GLOBALES DE DISEÑO ────────────────────────────────
    const updateVariable = useCallback((category, path, value) => {
        setDocVariables(prev => {
            const next = JSON.parse(JSON.stringify(prev));
            
            // Lógica de actualización profunda
            if (category === 'typography') {
                const [preset, param] = path.split('.');
                if (next.typography[preset]) next.typography[preset][param] = value;
            } else if (category === 'colors') {
                const color = next.colors.find(c => c.id === path);
                if (color) color.value = value;
            } else {
                next[category][path] = value;
            }

            commitToHistory(blocks, next);
            return next;
        });
    }, [blocks, commitToHistory]);

    return {
        blocks,
        docVariables,
        setBlocks,
        findNode: (id) => findNode(blocks, id),
        addNode,
        updateNode,
        moveNode,
        indentNode,
        outdentNode,
        removeNode,
        duplicateNode,
        updateVariable,
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
                color: '#000000',
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
                color: '#000000',
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

