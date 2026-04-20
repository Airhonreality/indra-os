/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/SchemaDesigner.jsx 
 * RESPONSABILIDAD: El Orquestador de la Arquitectura de Datos (Bipartito Sincero).
 * =============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLexicon } from '../../../services/lexicon';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useSchemaAST } from './useSchemaAST';

// Sub-Componentes Visuales
import { LayersPanel } from './LayersPanel';
import { DNAInspector } from './DNAInspector';
import { SchemaNexusControl } from './SchemaNexusControl';

// Utilidades UI
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraIcon } from '../../utilities/IndraIcons';
import { RenameDryRunModal } from '../../utilities/primitives';
import { prepareCanonicalRename, commitCanonicalRename } from '../../../services/rename_protocol_runtime';

export function SchemaDesigner({ atom, bridge }) {
    const { updateAxiomaticIdentity } = useWorkspace();
    const t = useLexicon(bridge.protocol.lang || 'es');
    
    const ast = useSchemaAST(atom, bridge);
    const { localAtom, setLocalAtom, fields, lastSavedRef, updateFields, pushToHistory, updateStatus } = ast;

    const [selectedFieldId, setSelectedFieldId] = useState(null);
    const [activeSlot, setActiveSlot] = useState('NAV');
    const [isSaving, setIsSaving] = useState(false);
    const [pendingRename, setPendingRename] = useState(null);
    const [isCommittingRename, setIsCommittingRename] = useState(false);
    const [renameError, setRenameError] = useState('');
    const [aliasResetNonce, setAliasResetNonce] = useState(0);
    const [showProvisionManager, setShowProvisionManager] = useState(false);

    const hasHydrated = useRef(false);

    // ── PERSISTENCIA ──
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

    // ── HIDRATACIÓN ──
    useEffect(() => {
        const hydrate = async () => {
            if (hasHydrated.current && localAtom.id === atom.id) return;
            try {
                const res = await bridge.read({ raw: true });
                if (res && res.payload?.fields) {
                    setLocalAtom(res);
                    lastSavedRef.current = JSON.stringify(res);
                    hasHydrated.current = true;
                }
            } catch (err) { console.error('[SchemaDesigner] Hydrate failed:', err); }
        };
        hydrate();
    }, [atom.id, bridge]);

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

    // ── HOTKEYS ──
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

    const isOrphan = !localAtom.payload?.target_silo_id && !localAtom.payload?.silo_id && !localAtom.payload?.bridge_id;
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

    const currentField = selectedFieldId ? findFieldById(fields, selectedFieldId) : null;

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
                        <button className="btn btn--xs btn--accent shadow-hover" onClick={handleManualSave} style={{ height: '32px', padding: '0 16px', borderRadius: '8px' }}>
                            <IndraIcon name="SAVE" size="12px" />
                            <span style={{ marginLeft: '8px' }}>{t('action_save').toUpperCase()}</span>
                        </button>
                    </div>
                }
            />

            <div className="fill indra-engine-shell sd-shell" data-active-tab={activeSlot}>
                <div className="fill indra-engine-body designer-body indra-layout-bipartite">
                    
                    {/* COL 1: ESTRUCTURA (30% - 40%) */}
                    <div className="bipartite-side indra-container indra-slot-nav">
                        <div className="indra-header-label">PROYECTOR_DE_ESTRUCTURA</div>
                        <LayersPanel fields={fields} selectedId={selectedFieldId} onSelect={setSelectedFieldId} onAdd={ast.addField} onRemove={ast.removeField} onMove={ast.moveField} onClone={ast.cloneField} currentAtom={localAtom} />
                    </div>

                    {/* COL 2: INSPECTOR (60% - 70%) */}
                    <div className="bipartite-main indra-container indra-slot-insp">
                        <div className="indra-header-label">INSPECTOR_GENÉTICO</div>
                        
                        {/* ── BANNER DE ESTADO Y METADATA ENRIQUECIDA ── */}
                        <div className="infra-status-banner stack" style={{ 
                            padding: '16px', 
                            margin: '12px',
                            background: isOrphan ? 'rgba(255, 70, 85, 0.08)' : 'rgba(0, 245, 212, 0.04)',
                            border: `1px solid ${isOrphan ? '#ff465533' : 'var(--indra-dynamic-accent)22'}`,
                            borderRadius: '12px',
                            gap: '12px'
                        }}>
                            <div className="shelf--loose" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="stack" style={{ gap: '4px' }}>
                                    <div className="shelf--tight">
                                        <div style={{ padding: '4px 8px', borderRadius: '4px', background: isOrphan ? '#ff4655' : 'var(--indra-dynamic-accent)', color: 'black', fontSize: '8px', fontWeight: '900' }}>
                                            {isOrphan ? 'DESCONECTADO' : 'CONECTADO'}
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                            {isOrphan ? 'SIN ALMACENAMIENTO FÍSICO' : `VINCULADO A ${localAtom.payload?.target_provider?.toUpperCase()}`}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '9px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                                        ID_FÍSICO: {localAtom.payload?.target_silo_id || (isOrphan ? 'NONE' : 'ID_PENDIENTE')}
                                    </span>
                                </div>
                                <button className={`btn btn--xs ${isOrphan ? 'btn--accent' : 'btn--ghost shadow-glow'}`} onClick={() => setShowProvisionManager(true)} style={{ height: '28px', padding: '0 12px', fontSize: '9px' }}>
                                    {isOrphan ? 'CONFIGURAR ALMACENAMIENTO' : 'GESTIONAR CONEXIÓN'}
                                </button>
                            </div>

                            <div className="grid-metadata" style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '15px', 
                                paddingTop: '12px', 
                                borderTop: '1px solid rgba(255,255,255,0.05)' 
                            }}>
                                <MetaField label="CREACIÓN" value={new Date(localAtom.created_at || Date.now()).toLocaleDateString()} />
                                <MetaField label="ÚLTIMA MOD" value={new Date(localAtom.updated_at || Date.now()).toLocaleDateString()} />
                                <MetaField label="PROVEEDOR" value={localAtom.provider?.toUpperCase()} />
                                
                                {localAtom.payload?.origin_silo_id && (
                                    <MetaField 
                                        label="ORIGEN (DNA)" 
                                        value={`${localAtom.payload.origin_provider?.toUpperCase()}:${localAtom.payload.origin_silo_id.substring(0,8)}...`} 
                                        highlight 
                                    />
                                )}
                                <MetaField label="VERSION" value={localAtom.version || 'v1.0.0'} />
                                <MetaField label="CLASE" value={localAtom.class} />
                            </div>
                        </div>

                        <div className="fill" style={{ padding: '0 var(--space-8)', overflowY: 'auto' }}>
                            {currentField ? (
                                <DNAInspector
                                    field={currentField} allFields={fields} bridge={bridge} aliasResetNonce={aliasResetNonce}
                                    onUpdate={async (updatedField) => {
                                        const current = findFieldById(fields, selectedFieldId);
                                        const oldAlias = String(current?.alias || '').trim();
                                        const nextAlias = String(updatedField?.alias || '').trim();
                                        const aliasChanged = !!nextAlias && nextAlias !== oldAlias;

                                        if (aliasChanged && current?.id === updatedField?.id) {
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
                                        ast.updateFields(recursiveUpdate(fields, selectedFieldId, updatedField));
                                    }}
                                    onReparent={(fieldId, newParentId) => {
                                        const moveNode = (list, id, targetParentId) => {
                                            let nodeToMove = null;
                                            const removeNode = (l) => l.filter(f => { if (f.id === id) { nodeToMove = f; return false; } if (f.children) f.children = removeNode(f.children); return true; });
                                            const listWithoutNode = removeNode(JSON.parse(JSON.stringify(list)));
                                            const insertNode = (l) => l.map(f => { if (f.id === targetParentId) return { ...f, children: [...(f.children || []), nodeToMove] }; if (f.children) return { ...f, children: insertNode(f.children) }; return f; });
                                            return (!targetParentId || targetParentId === 'ROOT') ? [...listWithoutNode, nodeToMove] : insertNode(listWithoutNode);
                                        };
                                        ast.updateFields(moveNode(fields, fieldId, newParentId));
                                    }}
                                />
                            ) : (
                                <div className="center stack" style={{ opacity: 0.3, textAlign: 'center', padding: '60px 40px' }}>
                                    <IndraIcon name="INFO" size="32px" />
                                    <p style={{ fontSize: '10px', marginTop: '10px' }}>SELECCIONA UN CAMPO EN LA ESTRUCTURA PARA INSPECCIÓN</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showProvisionManager && (
                <div className="indra-overlay center">
                    <div className="slot-large shadow-glow" style={{ width: '600px', height: '480px', background: 'var(--color-bg-void)', position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
                        <button onClick={() => setShowProvisionManager(false)} className="btn btn--xs" style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 10 }}>✕</button>
                        <SchemaNexusControl 
                            atom={localAtom} 
                            bridge={bridge} 
                            onUpdate={(u) => { setLocalAtom(u); pushToHistory(u); lastSavedRef.current = JSON.stringify(u); setShowProvisionManager(false); }}
                            onFieldsImported={(newFields, metadata) => {
                                const updatedPayload = {
                                    ...localAtom.payload,
                                    origin_silo_id: metadata?.origin_silo_id,
                                    origin_provider: metadata?.origin_provider,
                                    imported_at: new Date().toISOString()
                                };
                                setLocalAtom(prev => ({ ...prev, payload: updatedPayload }));
                                ast.updateFields(newFields);
                                setShowProvisionManager(false);
                            }}
                        />
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

function MetaField({ label, value, highlight }) {
    return (
        <div className="stack--none">
            <span style={{ fontSize: '7px', fontWeight: '900', opacity: 0.4, letterSpacing: '0.05em' }}>{label}</span>
            <div style={{ 
                fontSize: '9px', 
                fontWeight: highlight ? '900' : 'bold', 
                color: highlight ? 'var(--indra-dynamic-accent)' : 'white',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {value || '---'}
            </div>
        </div>
    );
}
