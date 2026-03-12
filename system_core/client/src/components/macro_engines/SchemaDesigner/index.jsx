/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/SchemaDesigner.jsx
 * RESPONSABILIDAD: El Orquestador de la Arquitectura de Datos.
 *
 * DHARMA:
 *   - Sinceridad Estructural: Refleja el AST del esquema sin ruido.
 *   - Transparencia Core: Se dobla ante los protocolos ATOM_READ/UPDATE del GAS.
 * 
 * AXIOMAS:
 *   - El esquema es una colección recursiva de campos.
 *   - No inventa lógica; delega el procesamiento al Bridge.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { LayersPanel } from './LayersPanel';
import { BlueprintCanvas } from './BlueprintCanvas';
import { DNAInspector } from './DNAInspector';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { useLexicon } from '../../../services/lexicon';

export function SchemaDesigner({ atom, bridge }) {
    const [localAtom, setLocalAtom] = useState(atom);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const t = useLexicon(bridge.protocol.lang || 'es');

    const lastSavedRef = React.useRef(JSON.stringify(atom));
    const hasHydrated = React.useRef(false);
    const isInternalUpdate = React.useRef(false);

    // 1. Hidratación Única
    useEffect(() => {
        if (hasHydrated.current && localAtom.id === atom.id) return;

        const hydrate = async () => {
            try {
                const result = await bridge.read({ raw: true });
                if (result) {
                    const fullAtom = result;
                    setLocalAtom(fullAtom);
                    setHistory([fullAtom]);
                    setHistoryIndex(0);
                    lastSavedRef.current = JSON.stringify(fullAtom);
                    hasHydrated.current = true;
                }
            } catch (err) {
                console.error('[SchemaDesigner] Hydration failed:', err);
            }
        };
        hydrate();
    }, [atom.id, bridge]);

    // 2. Manejo de Historial (Undo/Redo)
    const pushToHistory = (newAtom) => {
        if (isInternalUpdate.current) {
            isInternalUpdate.current = false;
            return;
        }
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAtom);
        // Limitar historial a 50 estados
        if (newHistory.length > 50) newHistory.shift();

        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

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

    // Hotkeys
    useEffect(() => {
        const handleKeys = (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [historyIndex, history]);

    // 3. Persistencia Silenciosa
    useEffect(() => {
        const currentData = JSON.stringify(localAtom);
        if (currentData === lastSavedRef.current) return;

        const timer = setTimeout(async () => {
            setIsSaving(true);
            try {
                const result = await bridge.save(localAtom);

                if (result.items?.[0]) {
                    lastSavedRef.current = JSON.stringify(result.items[0]);
                }
            } catch (err) {
                console.error('[SchemaDesigner] Auto-save failed:', err);
            } finally {
                setIsSaving(false);
            }
        }, 2000); // 2s para mayor estabilidad al escribir

        return () => clearTimeout(timer);
    }, [localAtom, atom.id, bridge]);

    // 4. Garantía de Persistencia (Auto-Flush)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (JSON.stringify(localAtom) !== lastSavedRef.current) {
                // Notificar al bridge que debe hacer un flush final
                bridge.save(localAtom);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Flush al desmontar el componente (navegación interna)
            if (JSON.stringify(localAtom) !== lastSavedRef.current) {
                bridge.save(localAtom);
            }
        };
    }, [localAtom, bridge]);

    const status = localAtom.payload?.status || 'DRAFT';
    const isLive = status === 'LIVE';

    const updateStatus = (newStatus) => {
        const newAtom = {
            ...localAtom,
            payload: { ...localAtom.payload, status: newStatus }
        };
        setLocalAtom(newAtom);
        pushToHistory(newAtom);
    };

    // Hotkeys Expandidos
    useEffect(() => {
        const handleKeys = (e) => {
            // Undo/Redo
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }

            // Delete seleccionado
            if (e.key === 'Delete' && selectedFieldId) {
                e.preventDefault();
                removeField(selectedFieldId);
            }

            // Save manual (forzar sync)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                setIsSaving(true);
                bridge.save(localAtom).finally(() => setIsSaving(false));
            }

            // Duplicar seleccionado (Ctrl+D)
            if (e.ctrlKey && e.key === 'd' && selectedFieldId) {
                e.preventDefault();
                cloneField(selectedFieldId);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [historyIndex, history, selectedFieldId, localAtom, bridge]); // Asegurar que dependencias estén actualizadas

    const fields = localAtom.payload?.fields || [];

    // Validación de Colisiones de Alias
    const checkAliasCollisions = (list) => {
        const aliases = new Set();
        const duplicates = [];

        const traverse = (l) => {
            l.forEach(f => {
                if (aliases.has(f.alias)) {
                    duplicates.push(f.alias);
                }
                aliases.add(f.alias);
                if (f.children) traverse(f.children);
            });
        };

        traverse(list);
        return duplicates;
    };

    const duplicateAliases = checkAliasCollisions(fields);
    const hasCollisions = duplicateAliases.length > 0;

    const updateFields = (newFields) => {
        const newAtom = {
            ...localAtom,
            payload: { ...localAtom.payload, fields: newFields }
        };
        setLocalAtom(newAtom);
        pushToHistory(newAtom);
    };

    // ── LÓGICA DE MANIPULACIÓN DEL AST ──
    const addField = (type = 'TEXT', parentId = null) => {
        const newField = {
            id: 'field_' + Date.now(),
            type: type,
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
        setSelectedFieldId(newField.id);
    };

    const removeField = (id) => {
        const remove = (list) => {
            return list.filter(f => f.id !== id).map(f =>
                f.children ? { ...f, children: remove(f.children) } : f
            );
        };
        updateFields(remove(fields));
        if (selectedFieldId === id) setSelectedFieldId(null);
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

    const demoteField = (id) => {
        const demote = (list) => {
            const index = list.findIndex(f => f.id === id);
            if (index > 0) {
                const prev = list[index - 1];
                if (prev.type === 'FRAME' || prev.type === 'REPEATER') {
                    const newList = [...list];
                    const fieldToMove = newList.splice(index, 1)[0];
                    prev.children = [...(prev.children || []), fieldToMove];
                    return newList;
                }
            }
            return list.map(f => f.children ? { ...f, children: demote(f.children) } : f);
        };
        updateFields(demote(fields));
    };

    const promoteField = (id) => {
        const promote = (list, parentList = null, parentIndex = -1) => {
            const index = list.findIndex(f => f.id === id);
            if (index !== -1 && parentList) {
                const fieldToMove = list.splice(index, 1)[0];
                parentList.splice(parentIndex + 1, 0, fieldToMove);
                return true;
            }
            for (let i = 0; i < list.length; i++) {
                if (list[i].children && promote(list[i].children, list, i)) return true;
            }
            return false;
        };
        const newFields = JSON.parse(JSON.stringify(fields));
        promote(newFields);
        updateFields(newFields);
    };

    const updateLabel = (newLabel) => {
        const newAtom = {
            ...localAtom,
            handle: { ...localAtom.handle, label: newLabel }
        };
        setLocalAtom(newAtom);
        pushToHistory(newAtom);
    };

    // Helperes Recursivos
    function findFieldById(list, id) {
        for (const item of list) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findFieldById(item.children, id);
                if (found) return found;
            }
        }
        return null;
    }

    const recursiveUpdate = (list, id, updatedField) => {
        return list.map(f => {
            if (f.id === id) return updatedField;
            if (f.children) return { ...f, children: recursiveUpdate(f.children, id, updatedField) };
            return f;
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden', background: 'var(--color-bg-void)', color: 'white' }}>

            {/* ── HEADER HUD (Resonancia) ── */}
            <IndraMacroHeader
                atom={localAtom}
                onClose={() => bridge.close()}
                onUndo={undo}
                onRedo={redo}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < history.length - 1}
                isSaving={isSaving}
                isLive={isLive}
                onUpdateStatus={updateStatus}
                onTitleChange={updateLabel}
                previewMode={previewMode}
                onTogglePreview={() => setPreviewMode(!previewMode)}
            />

            {/* ── MAIN DESIGN WORKSPACE ── */}
            <main className="fill shelf" style={{ overflow: 'hidden', flex: 1, minHeight: 0, alignItems: 'stretch', gap: 0 }}>

                {/* 1. LAYERS PANEL (Navegación Jerárquica) */}
                {!previewMode && (
                    <LayersPanel
                        fields={fields}
                        selectedId={selectedFieldId}
                        onSelect={setSelectedFieldId}
                        onAdd={addField}
                        onRemove={removeField}
                        onMove={moveField}
                        onClone={cloneField}
                        onDemote={demoteField}
                        onPromote={promoteField}
                    />
                )}

                {/* 2. BLUEPRINT CANVAS (Previsualización Viva) */}
                <BlueprintCanvas
                    fields={fields}
                    selectedId={selectedFieldId}
                    onSelect={setSelectedFieldId}
                    previewMode={previewMode}
                />

                {/* 3. DNA INSPECTOR (Propiedades Atómicas) */}
                {!previewMode && selectedFieldId && (
                    <DNAInspector
                        field={findFieldById(fields, selectedFieldId)}
                        allFields={fields}
                        bridge={bridge} // Prop crucial para el RemoteFieldSelector
                        onUpdate={(updatedField) => {
                            const newFields = recursiveUpdate(fields, selectedFieldId, updatedField);
                            updateFields(newFields);
                        }}
                        onReparent={(fieldId, newParentId) => {
                            // Lógica de reparenting (más compleja)
                            const moveNode = (list, id, targetParentId) => {
                                let nodeToMove = null;

                                // 1. Extraer el nodo
                                const removeNode = (l) => {
                                    return l.filter(f => {
                                        if (f.id === id) {
                                            nodeToMove = f;
                                            return false;
                                        }
                                        if (f.children) f.children = removeNode(f.children);
                                        return true;
                                    });
                                };

                                const listWithoutNode = removeNode(JSON.parse(JSON.stringify(list)));

                                // 2. Insertar el nodo
                                if (!targetParentId || targetParentId === 'ROOT') {
                                    return [...listWithoutNode, nodeToMove];
                                }

                                const insertNode = (l) => {
                                    return l.map(f => {
                                        if (f.id === targetParentId) {
                                            return { ...f, children: [...(f.children || []), nodeToMove] };
                                        }
                                        if (f.children) return { ...f, children: insertNode(f.children) };
                                        return f;
                                    });
                                };

                                return insertNode(listWithoutNode);
                            };

                            updateFields(moveNode(fields, fieldId, newParentId));
                        }}
                    />
                )}
            </main>
        </div>
    );
}
