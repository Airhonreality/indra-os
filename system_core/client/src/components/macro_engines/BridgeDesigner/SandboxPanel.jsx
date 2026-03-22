/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/SandboxPanel.jsx
 * RESPONSABILIDAD: Panel de Pruebas Colapsable (Axioma de Espacio).
 * DHARMA:
 *   - Minimalismo: Barra inferior elegante de 30px cuando esta cerrada.
 *   - Expansion: Se despliega hacia arriba con el Simulador Vectorial.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';

export function SandboxPanel({ 
    localAtom, 
    schemas = {}, 
    isExecuting, 
    testResult, 
    runTest,
    isExpanded,
    onToggle 
}) {
    const [triggerData, setTriggerData] = useState({}); 
    const [inputMode, setInputMode] = useState('FORM');
    const [resultMode, setResultMode] = useState('TRACE');

    const sources = localAtom.payload?.sources || [];
    const sourceConfigs = localAtom.payload?.sourceConfigs || {};

    // 1. Sincronizacion de Datos (Entropy Fix: Sincronismo proactivo)
    useEffect(() => {
        const newData = { ...triggerData };
        let changed = false;

        const getEmptyItem = (fields) => {
            const item = {};
            fields.forEach(f => {
                if (f.children && f.children.length > 0) item[f.id] = getEmptyItem(f.children);
                else item[f.id] = (f.type === 'NUMBER' ? 0 : f.type === 'BOOLEAN' ? false : '');
            });
            return item;
        };

        sources.forEach(sid => {
            const schema = schemas[sid];
            if (!schema) return;
            const config = sourceConfigs[sid] || {};
            const alias = (config.alias || schema.handle?.label || schema.label || sid).toLowerCase().replace(/\s+/g, '_');
            if (!newData[alias]) {
                newData[alias] = [getEmptyItem(schema.fields || [])];
                changed = true;
            }
        });

        if (changed) setTriggerData(newData);
    }, [sources, schemas, sourceConfigs]);

    // 2. Render de Inputs (Interno)
    const renderInputFields = (fields, alias, rowIndex, pathPrefix = '', level = 0) => {
        return fields.map(field => {
            const currentPath = pathPrefix ? `${pathPrefix}.${field.id}` : field.id;
            const isNested = field.children && field.children.length > 0;
            let value = triggerData[alias]?.[rowIndex];
            const keys = currentPath.split('.');
            for (const key of keys) { value = value?.[key]; }

            const updateField = (val) => {
                const newList = [...(triggerData[alias] || [])];
                const ks = currentPath.split('.');
                let tg = { ...newList[rowIndex] };
                let cr = tg;
                for (let i = 0; i < ks.length - 1; i++) { cr[ks[i]] = { ...cr[ks[i]] }; cr = cr[ks[i]]; }
                cr[ks[ks.length-1]] = val;
                newList[rowIndex] = tg;
                setTriggerData({ ...triggerData, [alias]: newList });
            };

            return (
                <div key={field.id} className="stack--tight" style={{ marginTop: 'var(--space-1)', paddingLeft: level > 0 ? 'var(--space-2)' : 0 }}>
                    <div className="shelf--tight" style={{ gap: 'var(--space-3)' }}>
                        <label className="text-hint font-mono truncate" style={{ width: '70px', fontSize: '8px', opacity: isNested ? 0.2 : 0.6 }}>{field.label.toUpperCase()}</label>
                        {!isNested && (
                            <input
                                type={field.type === 'NUMBER' ? 'number' : field.type === 'BOOLEAN' ? 'checkbox' : 'text'}
                                className={field.type === 'BOOLEAN' ? '' : 'input-base fill'}
                                style={field.type === 'BOOLEAN' ? {} : { padding: '2px 6px', fontSize: '10px', height: '20px', background: 'rgba(255,255,255,0.01)' }}
                                checked={field.type === 'BOOLEAN' ? !!value : undefined}
                                value={field.type !== 'BOOLEAN' ? (value || '') : undefined}
                                onChange={e => updateField(field.type === 'BOOLEAN' ? e.target.checked : (field.type === 'NUMBER' ? parseFloat(e.target.value) || 0 : e.target.value))}
                            />
                        )}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className={`indra-sandbox-shell ${isExpanded ? 'is-expanded' : 'is-collapsed'} glass`}>
            {/* MICRO-HEADER (30px de Resonancia) */}
            <header className="indra-sandbox-header spread" onClick={onToggle}>
                <div className="shelf--tight" style={{ gap: 'var(--space-3)' }}>
                    <IndraIcon name="BOLT" size="12px" color="var(--color-accent)" />
                    <span className="font-mono" style={{ fontSize: '9px', letterSpacing: '2px', fontWeight: 'bold' }}>
                        {sources.length > 0 ? `LABS // ${sources.length} SOURCES` : 'LABS // IDLE'}
                    </span>
                    {isExecuting && <span className="badge badge--accent" style={{ fontSize: '7px' }}>EJECUTANDO...</span>}
                </div>
                
                <div className="shelf--tight">
                    <button 
                        className={`btn btn--xs ${isExecuting ? 'btn--ghost' : 'btn--accent'}`}
                        onClick={(e) => { e.stopPropagation(); runTest(triggerData); }}
                        disabled={isExecuting}
                        style={{ height: '20px', padding: '0 10px', fontSize: '8px', borderRadius: '2px' }}
                    >
                        <IndraIcon name={isExecuting ? 'REFRESH' : 'PLAY'} size="10px" className={isExecuting ? 'spin' : ''} />
                        <span style={{ marginLeft: '4px' }}>IGNITE_RESONANCE</span>
                    </button>
                    <div className="spacer--h" style={{ width: 'var(--space-3)' }} />
                    <IndraIcon name={isExpanded ? 'ARROW_DOWN' : 'ARROW_UP'} size="10px" opacity={0.5} />
                </div>
            </header>

            {/* CUERPO DEL SIMULADOR (Solo si expandido) */}
            {isExpanded && (
                <main className="indra-sandbox-body">
                    {/* COLUMNA 1: ENTRADAS */}
                    <div className="sandbox-col stack--tight">
                        <div className="spread" style={{ padding: '0 4px', marginBottom: '8px' }}>
                            <span className="text-label" style={{ fontSize: '8px', opacity: 0.4 }}>SIMULADOR_INPUT</span>
                            <div className="shelf--tight glass" style={{ borderRadius: '2px' }}>
                                {['FORM', 'JSON'].map(m => (
                                    <button key={m} onClick={() => setInputMode(m)} className={`btn btn--xs ${inputMode === m ? 'btn--accent' : ''}`} style={{ fontSize: '7px', padding: '0 6px' }}>{m}</button>
                                ))}
                            </div>
                        </div>
                        <div className="fill overflow-auto scrollbar-hidden">
                            {inputMode === 'FORM' ? (
                                sources.map(sid => {
                                    const sc = schemas[sid]; if (!sc) return null;
                                    const al = (sourceConfigs[sid]?.alias || sc.label || sid).toLowerCase().replace(/\s+/g, '_');
                                    return (
                                        <div key={sid} className="stack--tight" style={{ marginBottom: '12px' }}>
                                            <div className="text-hint font-mono" style={{ fontSize: '7px', color: 'var(--color-accent)' }}>{al.toUpperCase()}</div>
                                            {(triggerData[al] || []).map((rw, i) => (
                                                <div key={i} className="stack--tight glass-void" style={{ padding: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                    {renderInputFields(sc.fields || [], al, i)}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })
                            ) : (
                                <textarea 
                                    value={JSON.stringify(triggerData, null, 2)} 
                                    className="util-input--sm fill font-mono" 
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-success)', fontSize: '9px' }}
                                    readOnly 
                                />
                            )}
                        </div>
                    </div>

                    <div className="sandbox-divider" />

                    {/* COLUMNA 2: TRAZA Y RESULTADOS */}
                    <div className="sandbox-col stack--tight fill">
                        <div className="spread" style={{ padding: '0 4px', marginBottom: '8px' }}>
                            <span className="text-label" style={{ fontSize: '8px', opacity: 0.4 }}>AUDITORIA_MANIFESTACION</span>
                            <div className="shelf--tight glass" style={{ borderRadius: '2px' }}>
                                {['TRACE', 'RESULT'].map(m => (
                                    <button key={m} onClick={() => setResultMode(m)} className={`btn btn--xs ${resultMode === m ? 'btn--accent' : ''}`} style={{ fontSize: '7px', padding: '0 6px' }}>{m}</button>
                                ))}
                            </div>
                        </div>
                        <div className="fill overflow-auto scrollbar-hidden">
                            {testResult && resultMode === 'RESULT' ? (
                                <pre className="font-mono" style={{ fontSize: '9px', color: 'var(--color-success)' }}>{JSON.stringify(testResult, null, 2)}</pre>
                            ) : testResult && !testResult.error ? (
                                <div className="stack--tight">
                                    {Object.entries(testResult.metadata?.debug?.[0] || {}).map(([op, val]) => (
                                        <div key={op} className="shelf--tight" style={{ gap: '10px', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <div className="text-hint font-mono" style={{ minWidth: '70px', fontSize: '8px' }}>{op.toUpperCase()}</div>
                                            <div className="font-mono truncate" style={{ fontSize: '9px', color: 'var(--color-accent)' }}>{JSON.stringify(val)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : <div className="center fill opacity-20 font-mono" style={{ fontSize: '9px' }}>AWAITING_IGNITION..</div>}
                        </div>
                    </div>
                </main>
            )}

            <style>{`
                .indra-sandbox-shell {
                    transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border-top: 1px solid var(--indra-dynamic-border);
                    display: flex;
                    flex-direction: column;
                    background: var(--color-bg-void) !important;
                    margin: 0 var(--space-4);
                    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
                    overflow: hidden;
                    box-shadow: 0 -10px 40px rgba(0,0,0,0.5);
                }
                .is-collapsed { height: 32px; cursor: pointer; }
                .is-expanded { height: 260px; }
                .is-collapsed:hover { background: rgba(255,255,255,0.03) !important; }
                .indra-sandbox-header { height: 32px; padding: 0 var(--space-4); align-items: center; user-select: none; }
                .indra-sandbox-body { flex: 1; display: flex; padding: var(--space-3); gap: var(--space-4); overflow: hidden; }
                .sandbox-col { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
                .sandbox-divider { width: 1px; background: rgba(255,255,255,0.05); }
                .scrollbar-hidden::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
