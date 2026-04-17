/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner.jsx
 * RESPONSABILIDAD: El Orquestador de la Lógica Lineal (Pipeline).
 *
 * DHARMA:
 *   - Determinismo Secuencial: El orden es ley.
 *   - Alambrado Transparente: Proyecta el flujo de datos sin magia.
 * =============================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useBridgeHydration } from './useBridgeHydration';
import { PortManager } from './PortManager';
import { OperatorCard } from './OperatorCard';
import { SandboxPanel } from './SandboxPanel';
import ArtifactSelector from '../../utilities/ArtifactSelector';
import { IndraIcon } from '../../utilities/IndraIcons';
import { Spinner, EmptyState, RenameDryRunModal } from '../../utilities/primitives';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraEngineHood } from '../../utilities/IndraEngineHood';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useLexicon } from '../../../services/lexicon';
import { prepareCanonicalRename, commitCanonicalRename } from '../../../services/rename_protocol_runtime';
import { useShell } from '../../../context/ShellContext';
export function BridgeDesigner({ atom, bridge }) {
    const shell = useShell();
    const lang = shell?.lang || 'es';
    const t = useLexicon(lang);
    const { updateAxiomaticIdentity } = useWorkspace();
    const [isSaving, setIsSaving] = useState(false);
    const [showSelector, setShowSelector] = useState(null); // 'FUENTE' | 'DESTINO'
    const [showSandbox, setShowSandbox] = useState(false);
    const [pendingRename, setPendingRename] = useState(null);
    const [isCommittingRename, setIsCommittingRename] = useState(false);
    const [renameError, setRenameError] = useState('');

    // 1. Hidratación y Alambrado Técnico
    const { localAtom, setLocalAtom, schemas, isLoading } = useBridgeHydration(atom, bridge);

    // 2. Historial (Undo/Redo)
    const [history, setHistory] = useState([localAtom]);
    const [pointer, setPointer] = useState(0);

    const pushToHistory = (newState) => {
        const newHistory = history.slice(0, pointer + 1);
        newHistory.push(newState);
        if (newHistory.length > 50) newHistory.shift();
        else setPointer(newHistory.length - 1);
        setHistory(newHistory);
        setLocalAtom(newState);
    };

    const undo = () => {
        if (pointer > 0) {
            const prev = history[pointer - 1];
            setPointer(pointer - 1);
            setLocalAtom(prev);
        }
    };

    const redo = () => {
        if (pointer < history.length - 1) {
            const next = history[pointer + 1];
            setPointer(pointer + 1);
            setLocalAtom(next);
        }
    };

    const [activeSlot, setActiveSlot] = useState('FLOW'); // FLOW | IO | TEST
    const [focusedTarget, setFocusedTarget] = useState(null);

    // --- ESTADOS DE SIMULACIÓN (SANDBOX) ---
    const [isExecuting, setIsExecuting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const slugify = (value) => String(value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/[\s_-]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const buildNamespacedSourceAlias = (schema, fallbackId) => {
        const provider = (schema?.raw?.provider || schema?.provider || 'system').split(':')[0];
        const sourceId = slugify(schema?.id || fallbackId || 'source');
        const sourceLabel = slugify(schema?.handle?.label || schema?.label || fallbackId || 'source');

        if (provider === 'notion') {
            return `${sourceId}_${sourceLabel}`;
        }

        return `${slugify(provider)}_${sourceId}_${sourceLabel}`;
    };

    const runTest = async (triggerData) => {
        setIsExecuting(true);
        setTestResult(null);
        try {
            // AXIOMA DE DETERMINISMO: Enviamos el puente efímero para probar sin guardar
            const result = await bridge.request({
                protocol: 'LOGIC_EXECUTE',
                context_id: localAtom.id,
                data: {
                    trigger_data: triggerData,
                    bridge: localAtom.payload // Inyectamos configuración local actual
                }
            });
            setTestResult(result);
        } catch (err) {
            console.error('[Sandbox] Execution failed:', err);
            setTestResult({ error: err.message });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleSelectInput = (slot) => {
        if (!focusedTarget) return;

        const { mode, id, key } = focusedTarget;

        if (mode === 'OPERATOR') {
            const operators = [...(localAtom.payload?.operators || [])];
            const opIndex = operators.findIndex(o => o.id === id);
            if (opIndex === -1) return;

            const op = { ...operators[opIndex] };
            op.config = {
                ...op.config,
                [key]: slot.path,
                [key + '_label']: slot.label
            };
            operators[opIndex] = op;

            pushToHistory({
                ...localAtom,
                payload: { ...localAtom.payload, operators }
            });
        } else if (mode === 'TARGET') {
            const mappings = { ...(localAtom.payload?.mappings || {}) };
            const targetMapping = { ...(mappings[id] || {}) };
            targetMapping[key] = slot.path;
            targetMapping[key + '_label'] = slot.label;
            mappings[id] = targetMapping;

            pushToHistory({
                ...localAtom,
                payload: { ...localAtom.payload, mappings }
            });
        }

        setFocusedTarget(null);
    };

    const lastSavedRef = useRef(JSON.stringify(atom));

    const handleManualSave = async (overrideAtom = null) => {
        const atomToSave = overrideAtom || localAtom;
        const currentData = JSON.stringify(atomToSave);
        if (currentData === lastSavedRef.current) return;

        setIsSaving(true);
        try {
            const result = await bridge.save(atomToSave);
            
            // ADR-003: Sincronizar RAM (Realidad A) con Drive (Realidad B)
            if (result.items?.[0]) {
                const refreshedAtom = result.items[0];
                setLocalAtom(refreshedAtom);
                lastSavedRef.current = JSON.stringify(refreshedAtom);
            } else {
                lastSavedRef.current = currentData;
            }
        } catch (err) {
            console.error('[BridgeDesigner] Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // 4. Persistencia al Desmontar (Garantía de Sinceridad)
    const localAtomRef = useRef(localAtom);
    useEffect(() => { localAtomRef.current = localAtom; }, [localAtom]);

    useEffect(() => {
        return () => {
            const latestAtom = localAtomRef.current;
            const currentData = JSON.stringify(latestAtom);
            if (currentData !== lastSavedRef.current) {
                // Flash final de memoria antes de salir de la realidad del bridge
                bridge.save(latestAtom).catch(() => {});
            }
        };
    }, [bridge]);

    // Handlers de Operadores
    const addOperator = (type) => {
        const operators = localAtom.payload?.operators || [];
        const newOp = {
            id: 'op_' + Date.now(),
            type: type,
            alias: `operacion_${operators.length + 1}`,
            config: {}
        };
        pushToHistory({
            ...localAtom,
            payload: { ...localAtom.payload, operators: [...operators, newOp] }
        });
    };

    const updateOperator = (index, updatedOp) => {
        const operators = [...(localAtom.payload?.operators || [])];
        operators[index] = updatedOp;
        pushToHistory({
            ...localAtom,
            payload: { ...localAtom.payload, operators: operators }
        });
    };

    const removeOperator = (id) => {
        pushToHistory({
            ...localAtom,
            payload: { ...localAtom.payload, operators: (localAtom.payload.operators || []).filter(o => o.id !== id) }
        });
    };

    const getOptionsFor = (index = null) => {
        const options = [];

        const flattenOptions = (fields, prefix, alias) => {
            fields.forEach(f => {
                const fieldLabel = f.handle?.label || f.label || f.id;
                options.push({
                    value: `${prefix}.${alias}.${f.id}`,
                    label: `${alias.toUpperCase()} > ${fieldLabel}`,
                    type: prefix === 'source' ? 'SOURCE' : 'OPERATOR'
                });
                if (f.children && f.children.length > 0) {
                    flattenOptions(f.children, prefix, alias);
                }
            });
        };

        // 1. Fuentes (SOURCES)
        (localAtom.payload?.sources || []).forEach(sid => {
            if (schemas[sid]) {
                const config = localAtom.payload?.sourceConfigs?.[sid] || {};
                const customAlias = config.alias || buildNamespacedSourceAlias(schemas[sid], sid);
                const alias = slugify(customAlias);
                const activeFields = config.activeFields;
                const fields = activeFields ? schemas[sid].fields?.filter(f => activeFields.includes(f.id)) : schemas[sid].fields;
                
                flattenOptions(fields || [], 'source', alias);
            }
        });

        // 2. Operadores (OPS)
        const opsToInclude = index === null 
            ? (localAtom.payload?.operators || [])
            : (localAtom.payload?.operators || []).slice(0, index);

        opsToInclude.forEach(op => {
            if (op.alias) {
                options.push({
                    value: `op.${op.alias}`,
                    label: `OP // ${op.alias.toUpperCase()}`,
                    type: 'OPERATOR'
                });
            }
        });

        return options;
    };

    const addPort = (id) => {
        const key = (showSelector === 'FUENTE' || showSelector === 'SOURCE') ? 'sources' : 'targets';
        const currentList = localAtom.payload?.[key] || [];
        if (currentList.includes(id)) return;

        const nextPayload = { ...localAtom.payload, [key]: [...currentList, id] };

        if (key === 'sources') {
            const sourceSchema = schemas[id] || null;
            const defaultAlias = buildNamespacedSourceAlias(sourceSchema, id);
            nextPayload.sourceConfigs = {
                ...(localAtom.payload?.sourceConfigs || {}),
                [id]: {
                    ...(localAtom.payload?.sourceConfigs?.[id] || {}),
                    alias: localAtom.payload?.sourceConfigs?.[id]?.alias || defaultAlias
                }
            };
        }

        pushToHistory({
            ...localAtom,
            payload: nextPayload
        });
        setShowSelector(null);
    };

    const removePort = (id, type) => {
        const key = type === 'SOURCE' ? 'sources' : 'targets';
        pushToHistory({
            ...localAtom,
            payload: { ...localAtom.payload, [key]: (localAtom.payload[key] || []).filter(item => item !== id) }
        });
    };

    const updatePortConfig = (id, newConfig, type) => {
        const key = type === 'SOURCE' ? 'sourceConfigs' : 'targetConfigs';
        pushToHistory({
            ...localAtom,
            payload: {
                ...localAtom.payload,
                [key]: {
                    ...(localAtom.payload[key] || {}),
                    [id]: { ...(localAtom.payload[key]?.[id] || {}), ...newConfig }
                }
            }
        });
    };

    const updateMapping = (id, mapping) => {
        const mappings = { ...(localAtom.payload?.mappings || {}) };
        mappings[id] = mapping;
        pushToHistory({
            ...localAtom,
            payload: { ...localAtom.payload, mappings }
        });
    };

    const updateIdentity = async ({ label: newLabel, alias: newAlias }) => {
        const cleanLabel = newLabel === '' ? 'PUENTE SIN TÍTULO' : newLabel;
        const cleanAlias = String(newAlias || '').trim() || localAtom?.handle?.alias;
        const prevAlias = String(localAtom?.handle?.alias || '').trim();
        const aliasChanged = !!cleanAlias && cleanAlias !== prevAlias;

        if (aliasChanged) {
            try {
                const prepared = await prepareCanonicalRename({
                    bridge,
                    provider: localAtom.provider || 'system',
                    protocol: 'ATOM_ALIAS_RENAME',
                    contextId: localAtom.id,
                    kind: 'ATOM_ALIAS',
                    data: {
                        old_alias: prevAlias || undefined,
                        new_alias: cleanAlias,
                        new_label: cleanLabel,
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
                    updateAxiomaticIdentity(localAtom.id, localAtom.provider, {
                        label: syncedAtom.handle?.label,
                        alias: syncedAtom.handle?.alias,
                        handle: syncedAtom.handle
                    });
                    lastSavedRef.current = JSON.stringify(syncedAtom);
                    return;
                }
            } catch (err) {
                setRenameError(String(err?.message || 'No se pudo validar el renombrado.'));
                return;
            }
        }

        const nextHandle = {
            ...localAtom.handle,
            label: cleanLabel,
            ...(cleanAlias ? { alias: cleanAlias } : {})
        };
        const newAtom = {
            ...localAtom,
            handle: nextHandle
        };
        setLocalAtom(newAtom);
        updateAxiomaticIdentity(localAtom.id, localAtom.provider, {
            label: cleanLabel,
            ...(cleanAlias ? { alias: cleanAlias } : {}),
            handle: nextHandle
        });
        handleManualSave(newAtom);
    };

    const cancelPendingRename = () => {
        setPendingRename(null);
        setIsCommittingRename(false);
        setRenameError('');
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
                handle: syncedAtom.handle
            });
            lastSavedRef.current = JSON.stringify(syncedAtom);
            setPendingRename(null);
            setIsCommittingRename(false);
        } catch (err) {
            setRenameError(String(err?.message || 'No se pudo ejecutar el commit del renombrado.'));
            setIsCommittingRename(false);
        }
    };

    if (isLoading) return (
        <div className="fill center">
            <Spinner size="32px" label={t('status_loading')} />
        </div>
    );


    return (
        <div className="fill stack" style={{ backgroundColor: 'var(--color-bg-void)', overflow: 'hidden' }}>
            {/* 0. INDRA MACRO HEADER */}
            <IndraMacroHeader
                atom={localAtom}
                onClose={() => bridge.close()}
                isSaving={isSaving}
                onIdentityChange={updateIdentity}
            />

            {/* ENVOLTURA TOPOLÓGICA DEL MOTOR */}
            <div className="fill stack overflow-hidden" style={{ padding: 'var(--indra-ui-margin)', gap: 'var(--indra-ui-gap)' }}>
                {/* 1. TOP HOOD: ENGINE FUNCTIONS (FLOATING) */}
                <div style={{ flexShrink: 0, position: 'relative' }}>
                    <div className="indra-header-label" style={{ position: 'absolute', top: '-10px', left: '20px', background: 'var(--color-bg-void)' }}>{t('ui_controls')}</div>
                    <IndraEngineHood
                        onUndo={undo}
                        onRedo={redo}
                        canUndo={pointer > 0}
                        canRedo={pointer < history.length - 1}
                        leftSlot={
                            <div className="engine-hood__capsule">
                                <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.8, margin: '0 var(--space-2)' }}>{t('ui_new_operation')}:</span>
                                {[
                                    { type: 'MATH', color: 'var(--color-accent)', label: 'MATH' },
                                    { type: 'TEXT', color: 'var(--color-text-primary)', label: 'STRING' },
                                    { type: 'RESOLVER', color: 'var(--color-success)', label: 'VAULT' },
                                    { type: 'EXPRESSION', color: 'var(--color-cold)', label: 'EXPR' },
                                    { type: 'FILTER', color: 'var(--color-warning)', label: 'FILTER' },
                                    { type: 'LOOKUP', color: 'var(--color-accent)', label: 'LOOKUP' }
                                ].map(op => (
                                    <button 
                                        key={op.type} 
                                        className="engine-hood__btn" 
                                        onClick={() => addOperator(op.type)} 
                                        style={{ width: 'auto', padding: '0 8px', fontSize: '9px', fontWeight: 'bold', color: op.color }}
                                    >
                                        {op.label}
                                    </button>
                                ))}
                            </div>
                        }
                        rightSlot={
                            <button 
                                className="btn btn--xs" 
                                onClick={() => handleManualSave()}
                                style={{ 
                                    borderRadius: 'var(--indra-ui-radius)', 
                                    padding: '2px 12px', 
                                    backgroundColor: 'var(--indra-dynamic-bg)',
                                    border: '1px solid var(--indra-dynamic-accent)',
                                    color: 'var(--indra-dynamic-accent)'
                                }}
                            >
                                <IndraIcon name="SAVE" size="10px" color="var(--indra-dynamic-accent)" />
                                <span style={{ marginLeft: "6px" }}>{t('action_save')}</span>
                            </button>
                        }
                    />
                </div>
                {/* 2. MAIN WORKSPACE (AXIOM: Body & Footer Shell) */}
                <div className="fill indra-engine-shell" data-active-tab={activeSlot}>
                    {/* INDUSTRIAL MOBILE TABS */}
                    <nav className="indra-mobile-tabs">
                        <button className={`btn btn--xs fill ${activeSlot === 'FLOW' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setActiveSlot('FLOW')}>FLOW</button>
                        <button className={`btn btn--xs fill ${activeSlot === 'IO' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setActiveSlot('IO')}>I/O</button>
                        <button className={`btn btn--xs fill ${activeSlot === 'TEST' ? 'btn--accent' : 'btn--ghost'}`} onClick={() => setActiveSlot('TEST')}>TEST</button>
                    </nav>

                    {/* COLUMNS AXIS (H-AXIS) */}
                    <div className="fill indra-engine-body bridge-designer-workspace indra-layout-tripartite">
                        {/* SLOT: NAV (FUENTES DE ENTRADA) */}
                        <div className="tripartite-side indra-container indra-slot-nav" style={{ height: '100%', overflow: 'hidden' }}>
                            <PortManager
                                title={t('ui_sources')}
                                ids={localAtom.payload?.sources || []}
                                configs={localAtom.payload?.sourceConfigs || {}}
                                schemas={schemas}
                                onAdd={() => setShowSelector('FUENTE')}
                                onRemove={(id) => removePort(id, 'SOURCE')}
                                onUpdateConfig={(id, conf) => updatePortConfig(id, conf, 'SOURCE')}
                                type="SOURCE"
                            />
                        </div>

                        {/* SLOT: CORE (PIPELINE CANVAS) */}
                        <div className="tripartite-center indra-container indra-slot-core" style={{ height: '100%', overflow: 'hidden' }}>
                            <div className="indra-header-label">{t('ui_transformation')}</div>
                            <section className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-4)' }}>
                                <div className="stack--loose mobile-full-width" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', alignItems: 'stretch' }}>
                                    <div className="stack--loose" style={{ flex: 1 }}>
                                        {isLoading ? (
                                            <div className="center fill stack">
                                                <Spinner size="80px" variant="rich" label={t('status_loading')} />
                                            </div>
                                        ) : (localAtom.payload?.operators || []).length === 0 ? (
                                            <EmptyState
                                                icon="BRIDGE"
                                                title="FLUJO DE LÓGICA VACÍO"
                                                description="Añade operadores matemáticos, de texto o resolutores para construir el pipeline de transformación."
                                            />
                                        ) : (localAtom.payload?.operators || []).map((op, index) => (
                                            <OperatorCard
                                                key={op.id}
                                                op={op}
                                                onUpdate={(updated) => updateOperator(index, updated)}
                                                onRemove={() => removeOperator(op.id)}
                                                options={getOptionsFor(index)}
                                            />
                                        ))}
                                    </div>

                                    {/* ADD OPERATOR GHOST */}
                                    <div 
                                        className="center glass-hover clickable" 
                                        style={{ 
                                            height: '40px', 
                                            borderRadius: 'var(--radius-md)', 
                                            border: '1px dashed var(--color-border)',
                                            marginTop: 'var(--space-4)'
                                        }}
                                        onClick={() => setShowSelector('OPERADOR')}
                                    >
                                        <div className="shelf--tight opacity-40">
                                            <IndraIcon name="PLUS" size="12px" />
                                            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{t('ui_add_operator').toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* SLOT: INSP (DESTINOS DE SALIDA) */}
                        <div className="tripartite-side indra-container indra-slot-target" style={{ height: '100%', overflow: 'hidden' }}>
                            <PortManager
                                title={t('ui_targets')}
                                ids={localAtom.payload?.targets || []}
                                schemas={schemas}
                                configs={localAtom.payload?.targetConfigs || {}}
                                mappings={localAtom.payload?.mappings || {}}
                                mappingOptions={getOptionsFor(null)}
                                onAdd={() => setShowSelector('DESTINO')}
                                onRemove={(id) => removePort(id, 'TARGET')}
                                onUpdateMapping={updateMapping}
                                onUpdateConfig={(id, conf) => updatePortConfig(id, conf, 'TARGET')}
                                type="TARGET"
                            />
                        </div>
                    </div>

                    {/* AXIS: SANDBOX (V-AXIS COLLAPSIBLE) */}
                    <SandboxPanel 
                        localAtom={localAtom} 
                        schemas={schemas}
                        isExecuting={isExecuting}
                        testResult={testResult}
                        runTest={runTest}
                        isExpanded={showSandbox}
                        onToggle={() => setShowSandbox(!showSandbox)}
                    />
                </div>
            </div>

            {showSelector && (
                <ArtifactSelector 
                    title={`SELECCIONAR ${showSelector}`} 
                    onSelect={(selectedAtom) => addPort(selectedAtom.id)} 
                    onCancel={() => setShowSelector(null)} 
                />
            )}

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
