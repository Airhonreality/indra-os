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
import { SchemaIgnitionPanel } from './SchemaIgnitionPanel';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraEngineHood } from '../../utilities/IndraEngineHood';
import { IndraIcon } from '../../utilities/IndraIcons';
import { RenameDryRunModal } from '../../utilities/primitives';
import { useLexicon } from '../../../services/lexicon';
import { prepareCanonicalRename, commitCanonicalRename } from '../../../services/rename_protocol_runtime';
import { useWorkspace } from '../../../context/WorkspaceContext';

export function SchemaDesigner({ atom, bridge }) {
    const { updateAxiomaticIdentity } = useWorkspace();
    const [localAtom, setLocalAtom] = useState(atom);
    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [activeSlot, setActiveSlot] = useState('CORE');
    const [isSaving, setIsSaving] = useState(false);
    const [pendingRename, setPendingRename] = useState(null);
    const [isCommittingRename, setIsCommittingRename] = useState(false);
    const [renameError, setRenameError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [aliasResetNonce, setAliasResetNonce] = useState(0);

    const t = useLexicon(bridge.protocol.lang || 'es');

    const lastSavedRef = React.useRef(JSON.stringify(atom));
    const hasHydrated = React.useRef(false);
    const isInternalUpdate = React.useRef(false);


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

    // 3. Guardado Manual Explícito
    const handleManualSave = async (overrideAtom = null) => {
        const atomToSave = overrideAtom || localAtom;
        const currentData = JSON.stringify(atomToSave);
        if (currentData === lastSavedRef.current) return;

        setIsSaving(true);
        try {
            const result = await bridge.save(atomToSave);
            if (result.items?.[0]) {
                lastSavedRef.current = JSON.stringify(result.items[0]);
            }
        } catch (err) {
            console.error('[SchemaDesigner] Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const localAtomRef = React.useRef(localAtom);
    useEffect(() => { localAtomRef.current = localAtom; }, [localAtom]);

    // 4. Garantía de Persistencia al Desmontar (Capa de Sinceridad)
    useEffect(() => {
        return () => {
            const latestAtom = localAtomRef.current;
            const currentData = JSON.stringify(latestAtom);
            if (currentData !== lastSavedRef.current) {
                // Flush final solo al salir si hay cambios pendientes
                bridge.save(latestAtom).catch(() => {});
            }
        };
    }, [bridge]); // Solo al desmontar o si el bridge cambia

    const hydrate = async () => {
        if (hasHydrated.current && localAtom.id === atom.id) return;
        try {
            const result = await bridge.read({ raw: true });
            if (result) {
                let fullAtom = result;

                const slugifyAlias = (value) => String(value || '')
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9_-]+/g, '_')
                    .replace(/^_+|_+$/g, '');

                const normalizeLegacyAliases = (fields) => {
                    const used = new Set();

                    const collect = (list) => {
                        (list || []).forEach(field => {
                            const alias = String(field?.alias || '').trim().toLowerCase();
                            if (alias) used.add(alias);
                            if (Array.isArray(field?.children)) collect(field.children);
                        });
                    };

                    const ensure = (list, prefix = 'field') => {
                        return (list || []).map((field, idx) => {
                            const cloned = { ...field };
                            let alias = String(cloned?.alias || '').trim().toLowerCase();

                            if (!alias) {
                                const rawBase = cloned?.id || cloned?.label || `${prefix}_${idx + 1}`;
                                const base = slugifyAlias(rawBase) || `${prefix}_${idx + 1}`;
                                let candidate = base;
                                let seq = 2;
                                while (used.has(candidate)) {
                                    candidate = `${base}_${seq}`;
                                    seq += 1;
                                }
                                alias = candidate;
                                cloned.alias = alias;
                            }

                            used.add(alias);
                            if (Array.isArray(cloned?.children)) {
                                cloned.children = ensure(cloned.children, `${prefix}_${idx + 1}`);
                            }
                            return cloned;
                        });
                    };

                    collect(fields || []);
                    return ensure(fields || []);
                };
                
                // SEGURIDAD: Deduplicar campos raíz por ID (Evitar triplicación de carga)
                if (fullAtom.payload?.fields) {
                    const seen = new Set();
                    fullAtom.payload.fields = fullAtom.payload.fields.filter(f => {
                        if (seen.has(f.id)) return false;
                        seen.add(f.id);
                        return true;
                    });

                    fullAtom.payload.fields = normalizeLegacyAliases(fullAtom.payload.fields);
                }

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

    useEffect(() => {
        hydrate();
    }, [atom.id, bridge]);

    // Resonancia de Identidad: Si el Header renombra el átomo, sincronizamos el handle local
    useEffect(() => {
        if (atom?.handle && JSON.stringify(atom.handle) !== JSON.stringify(localAtom.handle)) {
            setLocalAtom(prev => ({ ...prev, handle: atom.handle }));
        }
    }, [atom?.handle]);

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

    // Hotkeys
    useEffect(() => {
        const handleKeys = (e) => {
            // AXIOMA DE AISLAMIENTO: Si el usuario está escribiendo en un INPUT o TEXTAREA,
            // no debemos interceptar las teclas de borrado o comandos.
            const isInputField = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;
            if (isInputField) return;

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
                handleManualSave();
            }

            // Duplicar seleccionado (Ctrl+D)
            if (e.ctrlKey && e.key === 'd' && selectedFieldId) {
                e.preventDefault();
                cloneField(selectedFieldId);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [historyIndex, history, selectedFieldId, localAtom, bridge]);

    const fields = localAtom.payload?.fields || [];

    const findFieldById = (list, id) => {
        for (const field of (list || [])) {
            if (field.id === id) return field;
            if (Array.isArray(field.children)) {
                const found = findFieldById(field.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const recursiveUpdate = (list, id, updatedField) => {
        return (list || []).map((field) => {
            if (field.id === id) {
                return {
                    ...field,
                    ...updatedField,
                    children: updatedField?.children ?? field.children,
                };
            }
            if (Array.isArray(field.children)) {
                return {
                    ...field,
                    children: recursiveUpdate(field.children, id, updatedField)
                };
            }
            return field;
        });
    };

    // Validación de Colisiones de Alias
    const checkAliasCollisions = (list) => {
        const aliases = new Set();
        const duplicates = [];
        const traverse = (l) => {
            l.forEach(f => {
                if (aliases.has(f.alias)) duplicates.push(f.alias);
                aliases.add(f.alias);
                if (f.children) traverse(f.children);
            });
        };
        traverse(list);
        return duplicates;
    };

    const duplicateAliases = checkAliasCollisions(fields);
    const _hasCollisions = duplicateAliases.length > 0;

    const cancelPendingRename = () => {
        setPendingRename(null);
        setIsCommittingRename(false);
        setRenameError('');
        setAliasResetNonce(v => v + 1);
    };

    const confirmPendingRename = async () => {
        if (!pendingRename || pendingRename?.preview?.has_blockers) return;
        setIsCommittingRename(true);
        setRenameError('');
        try {
            const result = await commitCanonicalRename({ bridge, pendingRename });
            const syncedAtom = result.items[0];
            setLocalAtom(syncedAtom);
            pushToHistory(syncedAtom);
            updateAxiomaticIdentity(localAtom.id, localAtom.provider, {
                label: syncedAtom.handle?.label,
                alias: syncedAtom.handle?.alias,
                handle: syncedAtom.handle,
            });
            lastSavedRef.current = JSON.stringify(syncedAtom);
            setPendingRename(null);
            setIsCommittingRename(false);
        } catch (err) {
            setRenameError(String(err?.message || 'No se pudo ejecutar el commit del renombrado.'));
            setIsCommittingRename(false);
            setAliasResetNonce(v => v + 1);
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

    const accentColor = localAtom?.color || '#00f5d4';
    const dynamicStyles = {
        '--indra-dynamic-accent': accentColor,
        '--indra-dynamic-border': `${accentColor}26`,
        '--indra-dynamic-bg': `${accentColor}08`,
    };

    return (
        <div className="macro-designer-wrapper fill" style={dynamicStyles}>
            {/* 0. INDRA MACRO HEADER */}
            <IndraMacroHeader
                atom={localAtom}
                bridge={bridge}
                onClose={() => bridge.close()}
                isSaving={isSaving}
                isLive={isLive}
                rightSlot={
                    <div className="shelf--tight" style={{ gap: 'var(--space-2)' }}>
                        {/* Status Toggles (Industrial Pills) */}
                        <div className="engine-hood__capsule" style={{ gap: '1px', background: 'var(--color-bg-deep)', padding: '2px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                            <button
                                className={`btn btn--xs ${!isLive ? 'active' : ''}`}
                                onClick={() => updateStatus('DRAFT')}
                                style={{ 
                                    fontSize: '8px', padding: '4px 10px', borderRadius: '2px', border: 'none', 
                                    background: !isLive ? 'var(--indra-dynamic-accent)' : 'transparent', 
                                    color: !isLive ? 'var(--color-bg-void)' : 'var(--color-text-dim)',
                                    fontWeight: '900'
                                }}
                            >BORRADOR</button>
                            <button
                                className={`btn btn--xs ${isLive ? 'active' : ''}`}
                                onClick={() => updateStatus('LIVE')}
                                style={{ 
                                    fontSize: '8px', padding: '4px 10px', borderRadius: '2px', border: 'none', 
                                    background: isLive ? '#ff4655' : 'transparent', 
                                    color: isLive ? 'white' : 'var(--color-text-dim)',
                                    fontWeight: '900'
                                }}
                            >PUBLICADO</button>
                        </div>

                        {/* Mode Switch (Edit/Preview) */}
                        <button
                            className={`btn btn--xs ${previewMode ? 'btn--accent' : 'btn--ghost'}`}
                            onClick={() => setPreviewMode(!previewMode)}
                            title={previewMode ? t('action_edit') : t('action_preview')}
                            style={{ padding: '0 12px', height: '32px', gap: '8px', borderRadius: 'var(--radius-md)' }}
                        >
                            <IndraIcon name={previewMode ? "EDIT" : "EYE"} size="12px" />
                            <span style={{ fontSize: '9px', fontWeight: '900' }}>{previewMode ? t('action_edit') : t('action_preview')}</span>
                        </button>

                        <div className="macro-header__divider-block" style={{ width: '1px', height: '16px', background: 'var(--color-border)', opacity: 0.3, margin: '0 4px' }} />

                        {/* Global Save Button */}
                        <button 
                            className="btn btn--xs btn--accent shadow-hover" 
                            onClick={() => handleManualSave()}
                            style={{ 
                                height: '32px',
                                padding: '0 16px',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--indra-dynamic-accent)',
                                boxShadow: '0 0 15px var(--indra-dynamic-glow)'
                            }}
                        >
                            <IndraIcon name="SAVE" size="12px" />
                            <span style={{ marginLeft: "8px", fontWeight: '900', fontSize: '9px', letterSpacing: '0.05em' }}>{t('action_save').toUpperCase()}</span>
                        </button>
                    </div>
                }
            />

            {/* 2. MAIN CANVAS AREA (ADR-016 Tripartite Slot Model) */}
            <div className="fill indra-engine-shell sd-shell" data-active-tab={activeSlot} style={{ height: 'calc(100vh - var(--indra-header-height))' }}>
                {/* INDUSTRIAL MOBILE TABS */}
                <nav className="indra-mobile-tabs">
                    <button className={`btn btn--xs fill ${activeSlot === 'NAV' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setActiveSlot('NAV')}>ESQUEMA</button>
                    <button className={`btn btn--xs fill ${activeSlot === 'INSP' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setActiveSlot('INSP')}>PROPIEDADES</button>
                </nav>

                <div className={`fill indra-engine-body designer-body indra-layout-bipartite ${previewMode ? 'preview-mode' : ''}`}>
                    <div className="bipartite-side indra-container indra-slot-nav">
                        <div className="indra-header-label">ESTRUCTURA</div>
                        <LayersPanel
                            fields={fields}
                            selectedId={selectedFieldId}
                            onSelect={(id) => { setSelectedFieldId(id); if (window.innerWidth < 900) setActiveSlot('INSP'); }}
                            onAdd={addField}
                            onRemove={removeField}
                            onMove={moveField}
                            onClone={cloneField}
                            onDemote={demoteField}
                            onPromote={promoteField}
                            currentAtom={localAtom}
                            onSwitchSchema={(newAtomId) => {
                                if (bridge.navigate) bridge.navigate(newAtomId);
                            }}
                        />
                    </div>

                    <div className="bipartite-main indra-container indra-slot-insp">
                        <div className="indra-header-label">{t('ui_properties')}</div>
                        <div className="fill" style={{ overflowY: 'auto' }}>
                            {selectedFieldId ? (
                                <DNAInspector
                                    field={findFieldById(fields, selectedFieldId)}
                                    allFields={fields}
                                    bridge={bridge}
                                    aliasResetNonce={aliasResetNonce}
                                    onUpdate={async (updatedField) => {
                                        const currentField = findFieldById(fields, selectedFieldId);
                                        const oldAlias = String(currentField?.alias || '').trim();
                                        const nextAlias = String(updatedField?.alias || '').trim();
                                        const aliasChanged = !!nextAlias && nextAlias !== oldAlias;

                                        if (aliasChanged && currentField?.id === updatedField?.id) {
                                            try {
                                                const prepared = await prepareCanonicalRename({
                                                    bridge,
                                                    provider: localAtom.provider || 'system',
                                                    protocol: 'SCHEMA_FIELD_ALIAS_RENAME',
                                                    contextId: localAtom.id,
                                                    kind: 'FIELD_ALIAS',
                                                    data: {
                                                        field_id: updatedField.id,
                                                        old_alias: oldAlias || undefined,
                                                        new_alias: nextAlias,
                                                    },
                                                });

                                                if (prepared.status === 'PENDING') {
                                                    setRenameError('');
                                                    setPendingRename(prepared.pendingRename);
                                                    return;
                                                }

                                                if (prepared.status === 'NOOP' && prepared.result?.items?.[0]) {
                                                    const syncedAtom = prepared.result.items[0];
                                                    setLocalAtom(syncedAtom);
                                                    pushToHistory(syncedAtom);
                                                    lastSavedRef.current = JSON.stringify(syncedAtom);
                                                    return;
                                                }
                                            } catch (err) {
                                                console.error('[SchemaDesigner] SCHEMA_FIELD_ALIAS_RENAME dry_run failed:', err);
                                                setRenameError(String(err?.message || 'No se pudo validar el renombrado de campo.'));
                                                setAliasResetNonce(v => v + 1);
                                                return;
                                            }
                                        }

                                        const newFields = recursiveUpdate(fields, selectedFieldId, updatedField);
                                        updateFields(newFields);
                                    }}
                                    onReparent={(fieldId, newParentId) => {
                                        const moveNode = (list, id, targetParentId) => {
                                            let nodeToMove = null;
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
                            ) : (
                                <SchemaIgnitionPanel 
                                    atom={localAtom} 
                                    bridge={bridge} 
                                    onIgnited={(updatedAtom) => {
                                        setLocalAtom(updatedAtom);
                                        pushToHistory(updatedAtom);
                                        lastSavedRef.current = JSON.stringify(updatedAtom);
                                    }} 
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <RenameDryRunModal
                pendingRename={pendingRename}
                isCommitting={isCommittingRename}
                error={renameError}
                onCancel={cancelPendingRename}
                onConfirm={confirmPendingRename}
            />
        </div>
    );
}
