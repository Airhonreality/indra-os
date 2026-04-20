import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook para la gestión del Árbol de Sintaxis Abstracta (AST) del Esquema.
 * Responsabilidad: Estados puros de los datos e historial.
 */
export function useSchemaAST(initialAtom, bridge) {
    const [localAtom, setLocalAtom] = useState(initialAtom);
    const [history, setHistory] = useState([initialAtom]);
    const [historyIndex, setHistoryIndex] = useState(0);
    
    const isInternalUpdate = useRef(false);
    const lastSavedRef = useRef(JSON.stringify(initialAtom));

    const fields = localAtom.payload?.fields || [];

    const pushToHistory = useCallback((newAtom) => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAtom);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const undo = () => {
        if (historyIndex > 0) {
            isInternalUpdate.current = true;
            const prevAtom = history[historyIndex - 1];
            setLocalAtom(prevAtom);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            isInternalUpdate.current = true;
            const nextAtom = history[historyIndex + 1];
            setLocalAtom(nextAtom);
            setHistoryIndex(historyIndex + 1);
        }
    };

    const updateFields = (newFields) => {
        const newAtom = {
            ...localAtom,
            payload: { ...localAtom.payload, fields: newFields }
        };
        setLocalAtom(newAtom);
        pushToHistory(newAtom);
    };

    const addField = (type = 'TEXT', parentId = null) => {
        const newField = {
            id: 'field_' + Date.now(),
            type,
            label: 'NUEVO_CAMPO',
            alias: 'nuevo_campo_' + Date.now().toString().slice(-4),
            config: {}
        };
        if (type === 'FRAME' || type === 'REPEATER') newField.children = [];

        const insert = (list) => {
            if (!parentId) return [...list, newField];
            return list.map(f => {
                if (f.id === parentId) return { ...f, children: [...(f.children || []), newField] };
                if (f.children) return { ...f, children: insert(f.children) };
                return f;
            });
        };
        updateFields(insert(fields));
        return newField.id;
    };

    const removeField = (id) => {
        const remove = (list) => list.filter(f => f.id !== id).map(f => f.children ? { ...f, children: remove(f.children) } : f);
        updateFields(remove(fields));
    };

    const moveField = (id, direction) => {
        const move = (list) => {
            const index = list.findIndex(f => f.id === id);
            if (index !== -1) {
                const target = index + direction;
                if (target < 0 || target >= list.length) return list;
                const newList = [...list];
                [newList[index], newList[target]] = [newList[target], newList[index]];
                return newList;
            }
            return list.map(f => f.children ? { ...f, children: move(f.children) } : f);
        };
        updateFields(move(fields));
    };

    const cloneField = (id) => {
        const clone = (list) => {
            const index = list.findIndex(f => f.id === id);
            if (index !== -1) {
                const deepCloneNode = (node) => {
                    const suffix = Math.random().toString(36).substr(2, 4);
                    const newNode = {
                        ...JSON.parse(JSON.stringify(node)),
                        id: 'field_' + Date.now() + '_' + suffix,
                        alias: node.alias + '_copy_' + suffix,
                        label: node.label + ' (COPY)'
                    };
                    if (node.children) newNode.children = node.children.map(c => deepCloneNode(c));
                    return newNode;
                };
                const newList = [...list];
                newList.splice(index + 1, 0, deepCloneNode(list[index]));
                return newList;
            }
            return list.map(f => f.children ? { ...f, children: clone(f.children) } : f);
        };
        updateFields(clone(fields));
    };

    const updateStatus = (newStatus) => {
        const newAtom = {
            ...localAtom,
            payload: { ...localAtom.payload, status: newStatus }
        };
        setLocalAtom(newAtom);
        pushToHistory(newAtom);
    };

    return {
        localAtom, setLocalAtom,
        fields,
        undo, redo, pushToHistory,
        addField, removeField, moveField, cloneField,
        updateFields, updateStatus,
        lastSavedRef
    };
}
