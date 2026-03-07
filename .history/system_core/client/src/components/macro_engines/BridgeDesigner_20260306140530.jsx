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

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../state/app_state';
import { executeDirective } from '../../services/directive_executor';
import { useBridgeHydration } from './BridgeDesigner/useBridgeHydration';
import { PortManager } from './BridgeDesigner/PortManager';
import { OperatorCard } from './BridgeDesigner/OperatorCard';
import { SandboxPanel } from './BridgeDesigner/SandboxPanel';
import ArtifactSelector from '../utilities/ArtifactSelector';
import { SlotSelector } from '../utilities/SlotSelector';
import { IndraIcon } from '../utilities/IndraIcons';
import { IndraActionTrigger } from '../utilities/IndraActionTrigger';

export function BridgeDesigner({ atom }) {
    const { coreUrl, sessionSecret, closeArtifact } = useAppState();
    const [isSaving, setIsSaving] = useState(false);
    const [showSelector, setShowSelector] = useState(null); // 'SOURCE' | 'TARGET'
    const [slotSelectorConfig, setSlotSelectorConfig] = useState(null); // { index, targetKey }

    // 1. Hidratación y Alambrado Técnico
    const { localAtom, setLocalAtom, schemas, isLoading } = useBridgeHydration(atom, coreUrl, sessionSecret);
    const lastSavedRef = useRef(JSON.stringify(atom));

    // 2. Persistencia Silenciosa (Optimistic)
    useEffect(() => {
        const currentData = JSON.stringify(localAtom);
        if (currentData === lastSavedRef.current) return;

        const timer = setTimeout(async () => {
            setIsSaving(true);
            try {
                await executeDirective({
                    provider: 'system',
                    protocol: 'ATOM_UPDATE',
                    context_id: atom.id,
                    data: localAtom
                }, coreUrl, sessionSecret);
                lastSavedRef.current = currentData;
            } catch (err) {
                console.error('[BridgeDesigner] Auto-save failed:', err);
            } finally {
                setIsSaving(false);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [localAtom, atom.id, coreUrl, sessionSecret]);

    // Handlers de Operadores
    const addOperator = (type) => {
        const operators = localAtom.payload?.operators || [];
        const newOp = {
            id: 'op_' + Date.now(),
            type: type,
            alias: `operation_${operators.length + 1}`,
            config: {}
        };
        setLocalAtom(prev => ({
            ...prev,
            payload: { ...prev.payload, operators: [...operators, newOp] }
        }));
    };

    const updateOperator = (index, updatedOp) => {
        const operators = [...(localAtom.payload?.operators || [])];
        operators[index] = updatedOp;
        setLocalAtom(prev => ({
            ...prev,
            payload: { ...prev.payload, operators: operators }
        }));
    };

    const removeOperator = (id) => {
        setLocalAtom(prev => ({
            ...prev,
            payload: { ...prev.payload, operators: (prev.payload.operators || []).filter(o => o.id !== id) }
        }));
    };

    // Cálculo del Contexto Acumulado (The Dharma of Flow)
    const getContextAt = (index) => {
        const context = {
            sources: {},
            ops: {}
        };

        // 1. Añadir Sources
        (localAtom.payload?.sources || []).forEach(sid => {
            if (schemas[sid]) {
                const config = localAtom.payload?.sourceConfigs?.[sid] || {};
                const customAlias = config.alias || schemas[sid].handle?.label || schemas[sid].label || sid;
                const alias = customAlias.toLowerCase().replace(/\s+/g, '_');

                const activeFields = config.activeFields;
                const filteredFields = activeFields ? schemas[sid].fields?.filter(f => activeFields.includes(f.id)) : schemas[sid].fields;

                context.sources[alias] = { ...schemas[sid], fields: filteredFields };
            }
        });

        // 2. Añadir Operadores anteriores
        (localAtom.payload?.operators || []).slice(0, index).forEach(op => {
            if (op.alias) {
                context.ops[op.alias] = { type: 'UNKNOWN' }; // Simplificación inicial
            }
        });

        return context;
    };

    const handleSlotSelect = (slot) => {
        const { index, targetKey, mode, targetId } = slotSelectorConfig;

        if (mode === 'OPERATOR') {
            const operators = [...(localAtom.payload?.operators || [])];
            operators[index].config[targetKey] = slot.path;
            operators[index].config[targetKey + '_label'] = slot.label;

            setLocalAtom(prev => ({
                ...prev,
                payload: { ...prev.payload, operators: operators }
            }));
        } else if (mode === 'TARGET') {
            const mappings = { ...(localAtom.payload?.mappings || {}) };
            const targetMapping = { ...(mappings[targetId] || {}) };
            targetMapping[targetKey] = slot.path;
            targetMapping[targetKey + '_label'] = slot.label;
            mappings[targetId] = targetMapping;

            setLocalAtom(prev => ({
                ...prev,
                payload: { ...prev.payload, mappings: mappings }
            }));
        }

        setSlotSelectorConfig(null);
    };

    // Handlers de Puertos
    const addPort = (id) => {
        const key = showSelector === 'SOURCE' ? 'sources' : 'targets';
        const currentList = localAtom.payload?.[key] || [];
        if (currentList.includes(id)) return;

        setLocalAtom(prev => ({
            ...prev,
            payload: { ...prev.payload, [key]: [...currentList, id] }
        }));
        setShowSelector(null);
    };

    const removePort = (id, type) => {
        const key = type === 'SOURCE' ? 'sources' : 'targets';
        setLocalAtom(prev => ({
            ...prev,
            payload: { ...prev.payload, [key]: (prev.payload[key] || []).filter(item => item !== id) }
        }));
    };

    const updatePortConfig = (id, newConfig, type) => {
        const key = type === 'SOURCE' ? 'sourceConfigs' : 'targetConfigs';
        setLocalAtom(prev => ({
            ...prev,
            payload: {
                ...prev.payload,
                [key]: {
                    ...(prev.payload[key] || {}),
                    [id]: {
                        ...(prev.payload[key]?.[id] || {}),
                        ...newConfig
                    }
                }
            }
        }));
    };

    if (isLoading) return <div className="fill center">LOADING_BRIDGE_RESONANCE...</div>;

    return (
        <div className="stack" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-void)', color: 'white', overflow: 'hidden', zIndex: 100 }}>

            {/* HUD HEADER */}
            <header className="spread glass" style={{ padding: 'var(--space-2) var(--space-6)', borderBottom: '1px solid var(--color-border-strong)', zIndex: 100 }}>
                <div className="shelf--loose fill">
                    <IndraIcon name="LOGIC" size="18px" style={{ color: 'var(--color-accent)' }} />
                    <div className="shelf--loose fill">
                        <span style={{ fontSize: 'var(--text-md)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                            {localAtom.handle?.label || 'UNTITLED_BRIDGE'}
                        </span>
                        <span style={{ fontSize: '8px', opacity: 0.5, fontFamily: 'var(--font-mono)' }}>
                            // BRIDGE_PIPELINE: {isSaving ? 'SYNCING...' : 'STABLE'} // ID: {atom.id}
                        </span>
                    </div>
                </div>

                <div className="shelf">
                    <IndraActionTrigger
                        icon="CLOSE"
                        label="EXIT_DESIGNER"
                        onClick={closeArtifact}
                        color="var(--color-danger)"
                        activeColor="var(--color-danger)"
                        requiresHold={false}
                    />
                </div>
            </header>

            {/* OPERATOR TOOLBAR (Top Bar) */}
            <div className="shelf glass" style={{
                padding: 'var(--space-1) var(--space-6)',
                borderBottom: '1px solid var(--color-border)',
                background: 'rgba(0,0,0,0.3)',
                minHeight: '32px'
            }}>
                <div className="shelf--tight" style={{ opacity: 0.5, marginRight: 'var(--space-4)' }}>
                    <IndraIcon name="PLUS" size="10px" />
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>ADD_OP:</span>
                </div>
                <div className="shelf--tight" style={{ gap: 'var(--space-2)' }}>
                    <button className="shelf--tight btn btn--xs btn--ghost" onClick={() => addOperator('MATH')} style={{ borderRadius: 'var(--radius-pill)', fontSize: '10px', opacity: 0.8, padding: '2px 8px' }}>
                        <IndraIcon name="PLUS" size="8px" /> MATH
                    </button>
                    <button className="shelf--tight btn btn--xs btn--ghost" onClick={() => addOperator('TEXT')} style={{ borderRadius: 'var(--radius-pill)', fontSize: '10px', opacity: 0.8, padding: '2px 8px' }}>
                        <IndraIcon name="PLUS" size="8px" /> TEXT
                    </button>
                    <button className="shelf--tight btn btn--xs btn--ghost" onClick={() => addOperator('EXTRACTOR')} style={{ borderRadius: 'var(--radius-pill)', fontSize: '10px', opacity: 0.8, padding: '2px 8px' }}>
                        <IndraIcon name="PLUS" size="8px" /> RESOLVER
                    </button>
                    <button className="shelf--tight btn btn--xs btn--ghost" onClick={() => addOperator('EXPRESSION')} style={{ borderRadius: 'var(--radius-pill)', fontSize: '10px', opacity: 0.8, padding: '2px 8px' }}>
                        <IndraIcon name="PLUS" size="8px" /> EXPRESSION
                    </button>
                </div>
            </div>

            {/* MAIN WORKSPACE (3 Columnas + Sandbox Inferior) */}
            <main className="fill stack" style={{ overflow: 'hidden' }}>
                <div className="fill shelf" style={{ overflow: 'hidden' }}>

                    {/* COLUMNA A: FUENTES */}
                    <PortManager
                        title="INPUT_SOURCES"
                        ids={localAtom.payload?.sources || []}
                        configs={localAtom.payload?.sourceConfigs || {}}
                        schemas={schemas}
                        onAdd={() => setShowSelector('SOURCE')}
                        onRemove={(id) => removePort(id, 'SOURCE')}
                        onUpdateConfig={(id, conf) => updatePortConfig(id, conf, 'SOURCE')}
                        type="SOURCE"
                    />

                    {/* COLUMNA B: PIPELINE (El Cerebro) */}
                    <section className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-8)' }}>
                        <div className="stack--loose" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>

                            {/* Lista de Operadores */}
                            <div className="stack--loose">
                                {(localAtom.payload?.operators || []).map((op, index) => (
                                    <OperatorCard
                                        key={op.id}
                                        op={op}
                                        onUpdate={(updated) => updateOperator(index, updated)}
                                        onRemove={() => removeOperator(op.id)}
                                        contextBefore={getContextAt(index)}
                                        onOpenSelector={(targetKey) => setSlotSelectorConfig({ mode: 'OPERATOR', index, targetKey })}
                                    />
                                ))}
                            </div>

                            {/* Placeholder de Pipeline Vacía */}
                            {(localAtom.payload?.operators || []).length === 0 && (
                                <div className="center stack" style={{ padding: '100px 0', opacity: 0.2 }}>
                                    <IndraIcon name="LOGIC" size="48px" />
                                    <span style={{ marginTop: 'var(--space-4)' }}>PIPELINE_EMPTY_AWAITING_RESONANCE</span>
                                </div>
                            )}

                        </div>
                    </section>

                    {/* COLUMNA C: DESTINOS */}
                    <PortManager
                        title="OUTPUT_TARGETS"
                        ids={localAtom.payload?.targets || []}
                        schemas={schemas}
                        mappings={localAtom.payload?.mappings || {}}
                        onAdd={() => setShowSelector('TARGET')}
                        onRemove={(id) => removePort(id, 'TARGET')}
                        onOpenSelector={(targetId, fieldId) => setSlotSelectorConfig({
                            mode: 'TARGET',
                            targetId,
                            targetKey: fieldId,
                            index: (localAtom.payload?.operators || []).length
                        })}
                        type="TARGET"
                    />

                </div>

                {/* LIVE SANDBOX (Panel Inferior) */}
                <div style={{ borderTop: '1px solid var(--color-border-strong)', background: 'var(--color-bg-void)', zIndex: 50 }}>
                    <SandboxPanel bridgeId={atom.id} coreUrl={coreUrl} sessionSecret={sessionSecret} />
                </div>
            </main>

            {/* Artifact Selector Modal */}
            {showSelector && (
                <ArtifactSelector
                    title={`SELECT_${showSelector}`}
                    onSelect={(selectedAtom) => addPort(selectedAtom.id)}
                    onCancel={() => setShowSelector(null)}
                />
            )}
            {/* Slot Selector Modal */}
            {slotSelectorConfig && (
                <SlotSelector
                    contextStack={getContextAt(slotSelectorConfig.index)}
                    onSelect={handleSlotSelect}
                    onCancel={() => setSlotSelectorConfig(null)}
                />
            )}
        </div>
    );
}
