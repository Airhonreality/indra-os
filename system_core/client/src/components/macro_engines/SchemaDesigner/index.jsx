/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/SchemaDesigner.jsx (RESTORED FROM GIT)
 * RESPONSABILIDAD: El Orquestador de la Arquitectura de Datos.
 * =============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { LayersPanel } from './LayersPanel';
import { BlueprintCanvas } from './BlueprintCanvas';
import { DNAInspector } from './DNAInspector';
import { SchemaIgnitionPanel } from './SchemaIgnitionPanel';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraIcon } from '../../utilities/IndraIcons';
import { RenameDryRunModal } from '../../utilities/primitives';
import { useLexicon } from '../../../services/lexicon';
import { prepareCanonicalRename, commitCanonicalRename } from '../../../services/rename_protocol_runtime';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useSchemaAST } from './useSchemaAST';

export function SchemaDesigner({ atom, bridge }) {
    const { updateAxiomaticIdentity } = useWorkspace();
    const t = useLexicon(bridge.protocol.lang || 'es');
    
    // Cerebro Micelar
    const ast = useSchemaAST(atom, bridge);
    const { localAtom, setLocalAtom, fields, lastSavedRef, updateFields, pushToHistory, updateStatus } = ast;

    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [activeSlot, setActiveSlot] = useState('CANVAS');
    const [isSaving, setIsSaving] = useState(false);
    const [pendingRename, setPendingRename] = useState(null);
    const [isCommittingRename, setIsCommittingRename] = useState(false);
    const [renameError, setRenameError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);
    const [aliasResetNonce, setAliasResetNonce] = useState(0);
    const [showProvisionManager, setShowProvisionManager] = useState(false);

    const hasHydrated = useRef(false);

    // ── 1. GARANTÍA DE PERSISTENCIA (ORIGINAL GIT) ──
    const localAtomRef = useRef(localAtom);
    useEffect(() => { localAtomRef.current = localAtom; }, [localAtom]);

    useEffect(() => {
        return () => {
            const latestAtom = localAtomRef.current;
            if (JSON.stringify(latestAtom) !== lastSavedRef.current) {
                bridge.save(latestAtom).catch(() => {});
            }
        };
    }, []);

    // ── 2. HIDRATACIÓN Y NORMALIZACIÓN (ORIGINAL GIT) ──
    const slugifyAlias = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');

    const hydrate = async () => {
        if (hasHydrated.current && localAtom.id === atom.id) return;
        try {
            const res = await bridge.read({ raw: true });
            if (res && res.payload?.fields) {
                const seen = new Set();
                res.payload.fields = res.payload.fields.filter(f => {
                    if (seen.has(f.id)) return false;
                    seen.add(f.id);
                    return true;
                });
                setLocalAtom(res);
                lastSavedRef.current = JSON.stringify(res);
                hasHydrated.current = true;
            }
        } catch (err) { console.error('[SchemaDesigner] Hydrate failed:', err); }
    };

    useEffect(() => { hydrate(); }, [atom.id, bridge]);

    useEffect(() => {
        if (atom?.handle && JSON.stringify(atom.handle) !== JSON.stringify(localAtom.handle)) {
            setLocalAtom(prev => ({ ...prev, handle: atom.handle }));
        }
    }, [atom?.handle]);

    const handleManualSave = async () => {
        if (JSON.stringify(localAtom) === lastSavedRef.current) return;
        setIsSaving(true);
        try {
            const result = await bridge.save(localAtom);
            if (result.items?.[0]) lastSavedRef.current = JSON.stringify(result.items[0]);
        } finally { setIsSaving(false); }
    };

    // ── 3. HOTKEYS DE INGENIERÍA (ORIGINAL GIT) ──
    useEffect(() => {
        const handleKeys = (e) => {
            const isInputField = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable;
            if (isInputField) return;
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); ast.undo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); ast.redo(); }
            if (e.key === 'Delete' && selectedFieldId) { e.preventDefault(); ast.removeField(selectedFieldId); }
            if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleManualSave(); }
            if (e.ctrlKey && e.key === 'd' && selectedFieldId) { e.preventDefault(); ast.cloneField(selectedFieldId); }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [selectedFieldId, localAtom]);

    const isOrphan = !localAtom.payload?.target_silo_id;
    const isLive = localAtom.payload?.status === 'LIVE';

    const findFieldById = (list, id) => {
        for (const field of (list || [])) {
            if (field.id === id) return field;
            if (field.children) {
                const found = findFieldById(field.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const recursiveUpdate = (list, id, updatedField) => {
        return (list || []).map((field) => {
            if (field.id === id) return { ...field, ...updatedField, children: updatedField?.children ?? field.children };
            if (field.children) return { ...field, children: recursiveUpdate(field.children, id, updatedField) };
            return field;
        });
    };

    return (
        <div className="macro-designer-wrapper fill" style={{
            '--indra-dynamic-accent': localAtom?.color || '#00f5d4',
            '--indra-dynamic-glow': `${localAtom?.color || '#00f5d4'}4d`
        }}>
            <IndraMacroHeader
                atom={localAtom} bridge={bridge} isSaving={isSaving} onClose={() => bridge.close()}
                rightSlot={
                    <div className="shelf--tight">
                        <div className="shelf--none" style={{ background: 'var(--color-bg-deep)', padding: '2px', borderRadius: '6px', border: '1px solid var(--color-border)', display: 'flex' }}>
                            <button className={`btn btn--xs ${!isLive ? 'active' : ''}`} onClick={() => updateStatus('DRAFT')} style={{ fontSize: '8px', padding: '4px 10px', background: !isLive ? 'var(--indra-dynamic-accent)' : 'transparent', color: !isLive ? 'black' : 'var(--color-text-dim)', border: 'none', fontWeight: '900', borderRadius: '4px' }}>BORRADOR</button>
                            <button className={`btn btn--xs ${isLive ? 'active' : ''}`} onClick={() => updateStatus('LIVE')} style={{ fontSize: '8px', padding: '4px 10px', background: isLive ? '#ff4655' : 'transparent', color: isLive ? 'white' : 'var(--color-text-dim)', border: 'none', fontWeight: '900', borderRadius: '4px' }}>PUBLICADO</button>
                        </div>
                        <button className={`btn btn--xs ${previewMode ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setPreviewMode(!previewMode)} style={{ height: '32px', borderRadius: '8px' }}>
                            <IndraIcon name={previewMode ? "EDIT" : "EYE"} size="12px" />
                            <span style={{ marginLeft: '6px' }}>{previewMode ? t('action_edit') : t('action_preview')}</span>
                        </button>
                        <button className="btn btn--xs btn--accent shadow-hover" onClick={handleManualSave} style={{ height: '32px', padding: '0 16px', borderRadius: '8px' }}>
                            <IndraIcon name="SAVE" size="12px" />
                            <span style={{ marginLeft: '8px' }}>{t('action_save').toUpperCase()}</span>
                        </button>
                    </div>
                }
            />

            <div className="fill indra-engine-shell sd-shell" data-active-tab={activeSlot}>
                <div className={`fill indra-engine-body designer-body indra-layout-tripartite ${previewMode ? 'preview-mode' : ''}`}>
                    <div className="tripartite-side indra-container indra-slot-nav">
                        <div className="indra-header-label">PROYECTOR_DE_ESTRUCTURA</div>
                        <LayersPanel fields={fields} selectedId={selectedFieldId} onSelect={setSelectedFieldId} onAdd={ast.addField} onRemove={ast.removeField} onMove={ast.moveField} onClone={ast.cloneField} currentAtom={localAtom} />
                    </div>

                    <div className="tripartite-center indra-container indra-slot-core">
                        <div className="indra-header-label">MAPA_DE_DATOS_VIVO</div>
                        <BlueprintCanvas fields={fields} selectedId={selectedFieldId} onSelect={setSelectedFieldId} previewMode={previewMode} isOrphan={isOrphan} targetSiloId={localAtom.payload?.target_silo_id} targetProvider={localAtom.payload?.target_provider} onProvisionClick={() => setShowProvisionManager(true)} />
                    </div>

                    <div className="tripartite-side indra-container indra-slot-insp">
                        <div className="indra-header-label">INSPECTOR_DNA</div>
                        <div className="fill" style={{ background: 'var(--color-bg-elevated)', overflowY: 'auto' }}>
                            {selectedFieldId ? (
                                <DNAInspector
                                    field={findFieldById(fields, selectedFieldId)} allFields={fields} bridge={bridge} aliasResetNonce={aliasResetNonce}
                                    onUpdate={async (updatedField) => {
                                        const currentField = findFieldById(fields, selectedFieldId);
                                        const oldAlias = String(currentField?.alias || '').trim();
                                        const nextAlias = String(updatedField?.alias || '').trim();
                                        const aliasChanged = !!nextAlias && nextAlias !== oldAlias;

                                        if (aliasChanged && currentField?.id === updatedField?.id) {
                                            try {
                                                const prepared = await prepareCanonicalRename({
                                                    bridge, provider: localAtom.provider || 'system', protocol: 'SCHEMA_FIELD_ALIAS_RENAME', contextId: localAtom.id, kind: 'FIELD_ALIAS',
                                                    data: { field_id: updatedField.id, old_alias: oldAlias || undefined, new_alias: nextAlias }
                                                });
                                                if (prepared.status === 'PENDING') { setRenameError(''); setPendingRename(prepared.pendingRename); return; }
                                                if (prepared.status === 'NOOP' && prepared.result?.items?.[0]) {
                                                    const syncedAtom = prepared.result.items[0];
                                                    setLocalAtom(syncedAtom); pushToHistory(syncedAtom);
                                                    lastSavedRef.current = JSON.stringify(syncedAtom);
                                                    return;
                                                }
                                            } catch (err) { setRenameError(String(err?.message || 'Error validando alias')); setAliasResetNonce(v => v + 1); return; }
                                        }
                                        updateFields(recursiveUpdate(fields, selectedFieldId, updatedField));
                                    }}
                                    onReparent={(fieldId, newParentId) => {
                                        const moveNode = (list, id, targetParentId) => {
                                            let nodeToMove = null;
                                            const removeNode = (l) => l.filter(f => { if (f.id === id) { nodeToMove = f; return false; } if (f.children) f.children = removeNode(f.children); return true; });
                                            const listWithoutNode = removeNode(JSON.parse(JSON.stringify(list)));
                                            if (!targetParentId || targetParentId === 'ROOT') return [...listWithoutNode, nodeToMove];
                                            const insertNode = (l) => l.map(f => { if (f.id === targetParentId) return { ...f, children: [...(f.children || []), nodeToMove] }; if (f.children) return { ...f, children: insertNode(f.children) }; return f; });
                                            return insertNode(listWithoutNode);
                                        };
                                        updateFields(moveNode(fields, fieldId, newParentId));
                                    }}
                                />
                            ) : (
                                <div className="center fill stack" style={{ opacity: 0.3, textAlign: 'center', padding: '40px' }}>
                                    <IndraIcon name="INFO" size="32px" />
                                    <p style={{ fontSize: '10px' }}>SELECCIONA ADN PARA INSPECCIÓN</p>
                                    {isOrphan && <button className="btn btn--xs btn--accent" onClick={() => setShowProvisionManager(true)} style={{ marginTop: '20px' }}>ESTABLECER SILO</button>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showProvisionManager && (
                <div className="indra-overlay center">
                    <div className="slot-large shadow-glow" style={{ width: '500px', background: 'var(--color-bg-void)', position: 'relative' }}>
                        <button onClick={() => setShowProvisionManager(false)} className="btn btn--xs" style={{ position: 'absolute', top: '10px', right: '10px' }}>✕</button>
                        <SchemaIgnitionPanel atom={localAtom} bridge={bridge} onIgnited={(u) => { setLocalAtom(u); pushToHistory(u); lastSavedRef.current = JSON.stringify(u); setShowProvisionManager(false); }} />
                    </div>
                </div>
            )}

            <RenameDryRunModal pendingRename={pendingRename} isCommitting={isCommittingRename} error={renameError} onCancel={() => { setPendingRename(null); setRenameError(''); setAliasResetNonce(v => v + 1); }} onConfirm={async () => {
                if (!pendingRename) return;
                setIsCommittingRename(true);
                try {
                    const res = await commitCanonicalRename({ bridge, pendingRename });
                    const syncedAtom = res.items[0];
                    setLocalAtom(syncedAtom); pushToHistory(syncedAtom);
                    updateAxiomaticIdentity(localAtom.id, localAtom.provider, { label: syncedAtom.handle?.label, alias: syncedAtom.handle?.alias, handle: syncedAtom.handle });
                    lastSavedRef.current = JSON.stringify(syncedAtom); setPendingRename(null);
                } catch (err) { setRenameError(String(err?.message)); } finally { setIsCommittingRename(false); }
            }} />
        </div>
    );
}
