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
import { Spinner, EmptyState } from '../../utilities/primitives';
import { IndraMacroHeader } from '../../utilities/IndraMacroHeader';
import { IndraEngineHood } from '../../utilities/IndraEngineHood';
import { useWorkspace } from '../../../context/WorkspaceContext';

export function BridgeDesigner({ atom, bridge }) {
    const { updatePinIdentity } = useWorkspace();
    const [isSaving, setIsSaving] = useState(false);
    const [showSelector, setShowSelector] = useState(null); // 'FUENTE' | 'DESTINO'

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
    const [focusedTarget, setFocusedTarget] = useState(null);

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
            await bridge.save(atomToSave);
            lastSavedRef.current = currentData;
        } catch (err) {
            console.error('[BridgeDesigner] Save failed:', err);
        } finally {
            setIsSaving(false);
        }
    };

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
                    res: `RESULTADO_DE_${op.alias.toUpperCase()}`
                };
            }
        });

        return context;
    };

    const addPort = (id) => {
        const key = (showSelector === 'FUENTE' || showSelector === 'SOURCE') ? 'sources' : 'targets';
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
        const cleanLabel = newLabel === '' ? 'PUENTE SIN TÍTULO' : newLabel;
        const newAtom = {
            ...localAtom,
            handle: { ...localAtom.handle, label: cleanLabel }
        };
        setLocalAtom(newAtom);
        updatePinIdentity(localAtom.id, localAtom.provider, { label: cleanLabel });
        handleManualSave(newAtom);
    };

    if (isLoading) return (
        <div className="fill center">
            <Spinner size="32px" label="INICIALIZANDO LÓGICA DEL PUENTE..." />
        </div>
    );

    return (
        <div className="fill stack" style={{ backgroundColor: 'var(--color-bg-void)', overflow: 'hidden' }}>
            {/* 0. INDRA MACRO HEADER */}
            <IndraMacroHeader
                atom={localAtom}
                onClose={() => bridge.close()}
                isSaving={isSaving}
                onTitleChange={updateLabel}
            />

            {/* ENVOLTURA TOPOLÓGICA DEL MOTOR */}
            <div className="fill stack overflow-hidden" style={{ padding: 'var(--indra-ui-margin)', gap: 'var(--indra-ui-gap)' }}>
                {/* 1. TOP HOOD: ENGINE FUNCTIONS */}
                <div className="indra-container" style={{ flexShrink: 0 }}>
                <div className="indra-header-label">LOGIC_PIPELINE_ENGINE</div>
                <IndraEngineHood
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={pointer > 0}
                    canRedo={pointer < history.length - 1}
                    leftSlot={
                        <div className="engine-hood__capsule">
                            <span className="text-hint font-mono" style={{ fontSize: '8px', opacity: 0.5, margin: '0 var(--space-2)' }}>AÑADIR_OP:</span>
                            {[
                                { type: 'MATH', color: 'var(--color-accent)', label: 'MATH' },
                                { type: 'TEXT', color: 'var(--color-text-primary)', label: 'STRING' },
                                { type: 'RESOLVER', color: 'var(--color-success)', label: 'VAULT' },
                                { type: 'EXPRESSION', color: 'var(--color-cold)', label: 'EXPR' }
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
                            <span style={{ marginLeft: "6px" }}>MEMORIZE_SYNC</span>
                        </button>
                    }
                />
                </div>

                {/* 2. MAIN WORKSPACE */}
                <div className="fill shelf overflow-hidden" style={{ gap: 'var(--indra-ui-gap)', alignItems: 'stretch' }}>
                    {/* LEFT: INPUT PORTS */}
                <div className="indra-container" style={{ width: '280px' }}>
                    <div className="indra-header-label">INPUT_PORT_SYSTEM</div>
                    <PortManager
                        title="FUENTES DE ENTRADA"
                        ids={localAtom.payload?.sources || []}
                        configs={localAtom.payload?.sourceConfigs || {}}
                        schemas={schemas}
                        onAdd={() => setShowSelector('FUENTE')}
                        onRemove={(id) => removePort(id, 'SOURCE')}
                        onUpdateConfig={(id, conf) => updatePortConfig(id, conf, 'SOURCE')}
                        onSelectField={handleSelectInput}
                        type="SOURCE"
                    />
                </div>

                {/* MIDDLE: PIPELINE CANVAS */}
                <div className="indra-container fill stack bg-black-soft relative overflow-hidden" style={{ borderLeft: 'none', borderRight: 'none' }}>
                    <div className="indra-header-label">OPERATOR_PIPELINE_FABRIC</div>
                    <section className="fill stack" style={{ overflowY: 'auto', padding: 'var(--space-4)' }}>
                        <div className="stack--loose" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', alignItems: 'stretch' }}>
                            <div className="stack--loose" style={{ flex: 1 }}>
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
                                <EmptyState
                                    icon="BRIDGE"
                                    title="FLUJO DE LÓGICA VACÍO"
                                    description="Añade operadores matemáticos, de texto o resolutores para construir el pipeline de transformación."
                                />
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT: OUTPUT PORTS */}
                <div className="indra-container" style={{ width: '280px' }}>
                    <div className="indra-header-label">OUTPUT_PORT_SYSTEM</div>
                    <PortManager
                        title="SALIDAS DE DATOS"
                        ids={localAtom.payload?.targets || []}
                        schemas={schemas}
                        configs={localAtom.payload?.targetConfigs || {}}
                        mappings={localAtom.payload?.mappings || {}}
                        focusedTarget={focusedTarget}
                        setFocusedTarget={setFocusedTarget}
                        onAdd={() => setShowSelector('DESTINO')}
                        onRemove={(id) => removePort(id, 'TARGET')}
                        onUpdateMapping={updateMapping}
                        onUpdateConfig={(id, conf) => updatePortConfig(id, conf, 'TARGET')}
                        type="TARGET"
                    />
                    </div>
                </div>

                {/* 3. LOWER SANDBOX */}
                <div className="indra-container" style={{ flexShrink: 0, height: '220px' }}>
                    <div className="indra-header-label">REALTIME_SANDBOX_STATION</div>
                    <SandboxPanel bridge={bridge} schemas={schemas} sources={localAtom.payload?.sources || []} sourceConfigs={localAtom.payload?.sourceConfigs || {}} />
                </div>
            </div>

            {showSelector && (
                <ArtifactSelector 
                    title={`SELECCIONAR ${showSelector}`} 
                    onSelect={(selectedAtom) => addPort(selectedAtom.id)} 
                    onCancel={() => setShowSelector(null)} 
                />
            )}
        </div>
    );
}
