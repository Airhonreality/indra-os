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
import { useBridgeHydration } from './useBridgeHydration';
import { PortManager } from './PortManager';
import { OperatorCard } from './OperatorCard';
import { SandboxPanel } from './SandboxPanel';
import ArtifactSelector from '../../utilities/ArtifactSelector';
import { IndraIcon } from '../../utilities/IndraIcons';
import { IndraActionTrigger } from '../../utilities/IndraActionTrigger';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';

export function BridgeDesigner({ atom, bridge }) {
    const [isSaving, setIsSaving] = useState(false);
    const [showSelector, setShowSelector] = useState(null); // 'SOURCE' | 'TARGET'

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

    // 3. Focussed Target (Select & Insert Axiom)
    // { mode: 'OPERATOR' | 'TARGET', id, key, index? }
    const [focusedTarget, setFocusedTarget] = useState(null);

    const handleSelectInput = (slot) => {
        if (!focusedTarget) return;

        const { mode, id, key, index } = focusedTarget;

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

        // Auto-release focus after selection for fluidity
        setFocusedTarget(null);
    };

    const lastSavedRef = useRef(JSON.stringify(atom));

    // 2. Persistencia Silenciosa (Vía Bridge)
    useEffect(() => {
        const currentData = JSON.stringify(localAtom);
        if (currentData === lastSavedRef.current) return;

        const timer = setTimeout(async () => {
            setIsSaving(true);
            try {
                await bridge.save(localAtom);
                lastSavedRef.current = currentData;
            } catch (err) {
                console.error('[BridgeDesigner] Auto-save failed:', err);
            } finally {
                setIsSaving(false);
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [localAtom, atom.id, bridge]);

    // Handlers de Operadores
    const addOperator = (type) => {
        const operators = localAtom.payload?.operators || [];
        const newOp = {
            id: 'op_' + Date.now(),
            type: type,
            alias: `operation_${operators.length + 1}`,
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

    // Cálculo del Contexto Acumulado
    const getContextAt = (index) => {
        const context = { sources: {}, ops: {} };

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

        (localAtom.payload?.operators || []).slice(0, index).forEach(op => {
            if (op.alias) {
                context.ops[op.alias] = {
                    type: op.type,
                    res: `RESULT_OF_${op.alias.toUpperCase()}`
                };
            }
        });

        return context;
    };

    // Handlers de Puertos
    const addPort = (id) => {
        const key = showSelector === 'SOURCE' ? 'sources' : 'targets';
        const currentList = localAtom.payload?.[key] || [];
        if (currentList.includes(id)) return;

        pushToHistory({
            ...localAtom,
            payload: { ...localAtom.payload, [key]: [...currentList, id] }
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

    const updateLabel = (newLabel) => {
        setLocalAtom(prev => ({
            ...prev,
            handle: { ...prev.handle, label: newLabel }
        }));
    };

    if (isLoading) return <div className="fill center">LOADING_BRIDGE_RESONANCE...</div>;

    return (
        <div className="stack" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'var(--color-bg-void)', color: 'white', overflow: 'hidden', zIndex: 100 }}>

            {/* HUD HEADER */}
            <IndraMacroHeader
                atom={localAtom}
                onClose={() => bridge.close()}
                onUndo={undo}
                onRedo={redo}
                canUndo={pointer > 0}
                canRedo={pointer < history.length - 1}
                isSaving={isSaving}
                onTitleChange={updateLabel}
                extraControls={
                    <div className="shelf--tight glass" style={{ padding: 'var(--space-1) var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-pill)', background: 'rgba(0,0,0,0.3)' }}>
                        <span className="text-hint font-mono" style={{ fontSize: '9px', opacity: 0.5, marginRight: 'var(--space-2)' }}>ADD_OP:</span>
                        {['MATH', 'TEXT', 'RESOLVER', 'EXPRESSION'].map(type => (
                            <button key={type} className="btn btn--xs btn--ghost" onClick={() => addOperator(type)} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                {type}
                            </button>
                        ))}
                    </div>
                }
            />

            {/* MAIN WORKSPACE */}
            <main className="fill stack" style={{ overflow: 'hidden' }}>
                <div className="fill shelf" style={{ overflow: 'hidden' }}>

                    <PortManager
                        title="INPUT_SOURCES"
                        ids={localAtom.payload?.sources || []}
                        configs={localAtom.payload?.sourceConfigs || {}}
                        schemas={schemas}
                        onAdd={() => setShowSelector('SOURCE')}
                        onRemove={(id) => removePort(id, 'SOURCE')}
                        onUpdateConfig={(id, conf) => updatePortConfig(id, conf, 'SOURCE')}
                        onSelectField={handleSelectInput}
                        type="SOURCE"
                    />

                    <section className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-8)' }}>
                        <div className="stack--loose" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                            <div className="stack--loose">
                                {(localAtom.payload?.operators || []).map((op, index) => (
                                    <OperatorCard
                                        key={op.id}
                                        op={op}
                                        onUpdate={(updated) => updateOperator(index, updated)}
                                        onRemove={() => removeOperator(op.id)}
                                        contextBefore={getContextAt(index)}
                                        focusedTarget={focusedTarget}
                                        setFocusedTarget={setFocusedTarget}
                                        onSelectOpResult={handleSelectInput}
                                    />
                                ))}
                            </div>

                            {(localAtom.payload?.operators || []).length === 0 && (
                                <div className="center stack" style={{ padding: '100px 0', opacity: 0.2 }}>
                                    <IndraIcon name="LOGIC" size="48px" />
                                    <span style={{ marginTop: 'var(--space-4)' }}>PIPELINE_EMPTY</span>
                                </div>
                            )}
                        </div>
                    </section>

                    <PortManager
                        title="OUTPUT_TARGETS"
                        ids={localAtom.payload?.targets || []}
                        schemas={schemas}
                        configs={localAtom.payload?.targetConfigs || {}}
                        mappings={localAtom.payload?.mappings || {}}
                        focusedTarget={focusedTarget}
                        setFocusedTarget={setFocusedTarget}
                        onAdd={() => setShowSelector('TARGET')}
                        onRemove={(id) => removePort(id, 'TARGET')}
                        onUpdateMapping={updateMapping}
                        onUpdateConfig={(id, conf) => updatePortConfig(id, conf, 'TARGET')}
                        type="TARGET"
                    />

                </div>

                <div style={{ borderTop: '1px solid var(--color-border-strong)', background: 'var(--color-bg-void)', zIndex: 50 }}>
                    <SandboxPanel bridge={bridge} schemas={schemas} sources={localAtom.payload?.sources || []} sourceConfigs={localAtom.payload?.sourceConfigs || {}} />
                </div>
            </main>

            {showSelector && (
                <ArtifactSelector title={`SELECT_${showSelector}`} onSelect={(selectedAtom) => addPort(selectedAtom.id)} onCancel={() => setShowSelector(null)} />
            )}
        </div>
    );
}
