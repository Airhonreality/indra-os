/**
 * =============================================================================
 * ARTEFACTO: DocumentDesigner/hooks/useDocumentAST.js
 * RESPONSABILIDAD: Gestión de mutaciones inmutables del Árbol de Sintaxis (AST).
 * AXIOMA: El estado de documento (bloques/variables/layoutMeta) se versiona juntos.
 * =============================================================================
 */

import { useState, useCallback } from 'react';

const genId = () => `block_${Math.random().toString(36).substr(2, 9)}`;
const deepClone = (value) => JSON.parse(JSON.stringify(value));

const DEFAULT_LAYOUT_META = {
    canvas: {
        zoom: 0.8,
        unit: 'mm',
        mediaPreset: 'PRINT',
        showRulers: true,
        showGuides: true,
        showGrid: false,
        snapToGrid: true,
        gridSize: 10,
        hoodDock: 'BOTTOM_CENTER'
    },
    pagination: {
        mode: 'hybrid',
        autoFlow: true,
        startAt: 1,
        showNumbers: true
    },
    masters: {
        mode: 'mixed',
        headerEnabled: false,
        footerEnabled: false,
        headerTemplate: '',
        footerTemplate: 'Página {{page}}',
        allowPerPageOverride: true
    }
};

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

const mergeLayoutMeta = (incoming = null) => {
    const safe = incoming && typeof incoming === 'object' ? incoming : {};

    return {
        ...DEFAULT_LAYOUT_META,
        ...safe,
        canvas: {
            ...DEFAULT_LAYOUT_META.canvas,
            ...(safe.canvas || {})
        },
        pagination: {
            ...DEFAULT_LAYOUT_META.pagination,
            ...(safe.pagination || {})
        },
        masters: {
            ...DEFAULT_LAYOUT_META.masters,
            ...(safe.masters || {})
        }
    };
};

export function useDocumentAST(initialBlocks = [], initialVariables = null, initialLayoutMeta = null) {
    const [blocks, setBlocks] = useState(initialBlocks);
    const [docVariables, setDocVariables] = useState(initialVariables || DEFAULT_VARIABLES);
    const [layoutMeta, setLayoutMeta] = useState(mergeLayoutMeta(initialLayoutMeta));

    const [history, setHistory] = useState([{
        blocks: deepClone(initialBlocks),
        variables: deepClone(initialVariables || DEFAULT_VARIABLES),
        layoutMeta: deepClone(mergeLayoutMeta(initialLayoutMeta))
    }]);
    const [pointer, setPointer] = useState(0);

    const commitToHistory = useCallback((newBlocks, newVars, newLayoutMeta) => {
        setHistory(prev => {
            const nextHistory = prev.slice(0, pointer + 1);
            const entry = {
                blocks: deepClone(newBlocks),
                variables: deepClone(newVars),
                layoutMeta: deepClone(mergeLayoutMeta(newLayoutMeta))
            };

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
            const state = deepClone(history[prevPointer]);
            setBlocks(state.blocks);
            setDocVariables(state.variables);
            setLayoutMeta(mergeLayoutMeta(state.layoutMeta));
            setPointer(prevPointer);
        }
    }, [history, pointer]);

    const redo = useCallback(() => {
        if (pointer < history.length - 1) {
            const nextPointer = pointer + 1;
            const state = deepClone(history[nextPointer]);
            setBlocks(state.blocks);
            setDocVariables(state.variables);
            setLayoutMeta(mergeLayoutMeta(state.layoutMeta));
            setPointer(nextPointer);
        }
    }, [history, pointer]);

    const findNode = (nodes, id) => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNode(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const updateNodeInTree = (nodes, id, newData) => nodes.map(node => {
        if (node.id === id) return { ...node, ...newData };
        if (node.children) return { ...node, children: updateNodeInTree(node.children, id, newData) };
        return node;
    });

    const removeNodeFromTree = (nodes, id) => nodes
        .filter(node => node.id !== id)
        .map(node => ({
            ...node,
            children: node.children ? removeNodeFromTree(node.children, id) : node.children
        }));

    const addNode = useCallback((type, parentId = null) => {
        const newNode = {
            id: genId(),
            type,
            props: getDefaultProps(type),
            children: (type === 'FRAME' || type === 'ITERATOR' || type === 'PAGE') ? [] : undefined
        };

        let newTree = [];
        setBlocks(prev => {
            let actualParentId = parentId;

            if (type === 'PAGE') {
                newTree = [...prev, newNode];
            } else {
                if (actualParentId) {
                    const parentNode = findNode(prev, actualParentId);
                    if (parentNode && !['FRAME', 'ITERATOR', 'PAGE'].includes(parentNode.type)) {
                        actualParentId = prev[0]?.id || null;
                    }
                }

                const targetId = actualParentId || (prev[0]?.id || null);
                const rootExists = targetId ? findNode(prev, targetId) : null;

                if (rootExists) {
                    const targetNode = findNode(prev, targetId);
                    newTree = updateNodeInTree(prev, targetId, {
                        children: [...(targetNode?.children || []), newNode]
                    });
                } else {
                    newTree = [...prev, newNode];
                }
            }

            commitToHistory(newTree, docVariables, layoutMeta);
            return newTree;
        });

        return newNode.id;
    }, [docVariables, layoutMeta, commitToHistory]);

    const updateNode = useCallback((id, newData) => {
        setBlocks(prev => {
            const newTree = updateNodeInTree(prev, id, newData);
            commitToHistory(newTree, docVariables, layoutMeta);
            return newTree;
        });
    }, [docVariables, layoutMeta, commitToHistory]);

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
            commitToHistory(newTree, docVariables, layoutMeta);
            return newTree;
        });
    }, [docVariables, layoutMeta, commitToHistory]);

    const removeNode = useCallback((id) => {
        setBlocks(prev => {
            const newTree = removeNodeFromTree(prev, id);
            commitToHistory(newTree, docVariables, layoutMeta);
            return newTree;
        });
    }, [docVariables, layoutMeta, commitToHistory]);

    const cloneNodeDeep = (node) => ({
        ...node,
        id: genId(),
        props: deepClone(node.props),
        children: node.children ? node.children.map(cloneNodeDeep) : undefined
    });

    const insertAfterInTree = (nodes, targetId, newNode) => {
        const idx = nodes.findIndex(n => n.id === targetId);
        if (idx !== -1) {
            const result = [...nodes];
            result.splice(idx + 1, 0, newNode);
            return result;
        }

        return nodes.map(node => {
            if (node.children) {
                return { ...node, children: insertAfterInTree(node.children, targetId, newNode) };
            }
            return node;
        });
    };

    const duplicateNode = useCallback((id) => {
        if (!id) return;

        setBlocks(prev => {
            const original = findNode(prev, id);
            if (!original) return prev;
            const clone = cloneNodeDeep(original);
            const newTree = insertAfterInTree(prev, id, clone);
            commitToHistory(newTree, docVariables, layoutMeta);
            return newTree;
        });
    }, [docVariables, layoutMeta, commitToHistory]);

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
                for (const n of nodes) {
                    if (n.children && findContext(n.children, targetId)) return true;
                }
                return false;
            };

            findContext(prev, id);

            if (nodeToIndent && prevSibling && ['FRAME', 'ITERATOR', 'PAGE'].includes(prevSibling.type)) {
                const cleanTree = removeNodeFromTree(prev, id);
                const newTree = updateNodeInTree(cleanTree, prevSibling.id, {
                    children: [...(prevSibling.children || []), nodeToIndent]
                });
                commitToHistory(newTree, docVariables, layoutMeta);
                return newTree;
            }
            return prev;
        });
    }, [docVariables, layoutMeta, commitToHistory]);

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
                for (const n of nodes) {
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

                commitToHistory(newTree, docVariables, layoutMeta);
                return newTree;
            }
            return prev;
        });
    }, [docVariables, layoutMeta, commitToHistory]);

    const updateVariable = useCallback((category, path, value) => {
        setDocVariables(prev => {
            const next = deepClone(prev);

            if (category === 'typography') {
                const [preset, param] = path.split('.');
                if (next.typography[preset]) next.typography[preset][param] = value;
            } else if (category === 'colors') {
                const color = next.colors.find(c => c.id === path);
                if (color) color.value = value;
            } else {
                next[category][path] = value;
            }

            commitToHistory(blocks, next, layoutMeta);
            return next;
        });
    }, [blocks, layoutMeta, commitToHistory]);

    const updateLayoutMeta = useCallback((partial) => {
        setLayoutMeta(prev => {
            const next = mergeLayoutMeta({
                ...prev,
                ...(partial || {}),
                canvas: {
                    ...(prev.canvas || {}),
                    ...((partial && partial.canvas) || {})
                },
                pagination: {
                    ...(prev.pagination || {}),
                    ...((partial && partial.pagination) || {})
                },
                masters: {
                    ...(prev.masters || {}),
                    ...((partial && partial.masters) || {})
                }
            });

            commitToHistory(blocks, docVariables, next);
            return next;
        });
    }, [blocks, docVariables, commitToHistory]);

    return {
        blocks,
        docVariables,
        layoutMeta,
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
        updateLayoutMeta,
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
                preset: 'A4',
                orientation: 'portrait',
                width: '210mm',
                minHeight: '297mm',
                background: '#ffffff',
                padding: '20mm',
                marginTop: '20mm',
                marginRight: '20mm',
                marginBottom: '20mm',
                marginLeft: '20mm',
                bleed: '3mm',
                safeTop: '10mm',
                safeRight: '10mm',
                safeBottom: '10mm',
                safeLeft: '10mm',
                direction: 'column',
                gap: '10px',
                color: '#000000',
                overflow: 'visible',
                gridColumns: '1',
                gridGap: '0mm',
                showPrintGuides: true,
                showPageNumber: true,
                paginationMode: 'hybrid',
                pageBreakBefore: false,
                pageBreakAfter: false,
                pageNumberOffsetX: '0mm',
                pageNumberOffsetY: '0mm',
                headerTemplate: '',
                footerTemplate: 'Página {{page}}',
                allowMasterOverride: true
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
