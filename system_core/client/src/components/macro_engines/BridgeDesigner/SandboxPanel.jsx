/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/SandboxPanel.jsx
 * RESPONSABILIDAD: Pruebas en vivo del motor lógico con formularios dinámicos.
 * DHARMA:
 *   - Sinceridad de Entrada: Refleja la estructura de los esquemas conectados.
 *   - Profesionalismo UI: Elimina etiquetas especulativas por términos claros.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { IndraIcon } from '../../utilities/IndraIcons';
import { DataProjector } from '../../../services/DataProjector';

export function SandboxPanel({ localAtom, schemas = {}, isExecuting, testResult, runTest }) {
    const [triggerData, setTriggerData] = useState({});
    const [viewMode, setViewMode] = useState('FORM'); // 'FORM' | 'JSON'

    const sources = localAtom.payload?.sources || [];
    const sourceConfigs = localAtom.payload?.sourceConfigs || {};

    // Sincronización proactiva del estado local con los esquemas de entrada (SINCERIDAD RECURSIVA)
    useEffect(() => {
        const newData = { ...triggerData };
        let changed = false;

        const getFieldShape = (fields) => {
            const shape = {};
            fields.forEach(f => {
                if (f.children && f.children.length > 0) {
                    shape[f.id] = getFieldShape(f.children);
                } else {
                    shape[f.id] = f.type === 'NUMBER' ? 0 : f.type === 'BOOLEAN' ? false : '';
                }
            });
            return shape;
        };

        sources.forEach(sid => {
            const schema = schemas[sid];
            if (!schema) return;

            const config = sourceConfigs[sid] || {};
            const alias = (config.alias || schema.handle?.label || schema.label || sid)
                .toLowerCase().replace(/\s+/g, '_');

            if (!newData[alias]) {
                newData[alias] = getFieldShape(schema.fields || []);
                changed = true;
            }
        });

        if (changed) setTriggerData(newData);
    }, [sources, schemas, sourceConfigs]);

    const updateField = (path, value) => {
        const keys = path.split('.');
        setTriggerData(prev => {
            const next = { ...prev };
            let current = next;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return next;
        });
    };

    const renderFields = (fields, pathPrefix, level = 0) => {
        return fields.map(field => {
            const currentPath = `${pathPrefix}.${field.id}`;
            const isNested = field.children && field.children.length > 0;
            
            // Acceder al valor actual mediante el pathPrefix
            const keys = currentPath.split('.');
            let value = triggerData;
            for (const key of keys) { value = value?.[key]; }

            return (
                <div key={field.id} className="stack--tight" style={{ 
                    borderLeft: isNested ? '1px solid rgba(255,255,255,0.05)' : 'none', 
                    paddingLeft: isNested ? 'var(--space-2)' : 0,
                    marginTop: 'var(--space-2)'
                }}>
                    <div className="shelf--tight" style={{ gap: 'var(--space-3)' }}>
                        <label className="text-hint font-mono truncate" style={{ 
                            width: level === 0 ? '80px' : '60px', 
                            fontSize: '9px',
                            opacity: isNested ? 0.4 : 0.8,
                            fontWeight: isNested ? 'bold' : 'normal'
                        }}>
                            {field.label.toUpperCase()}
                        </label>
                        
                        {!isNested && (
                            field.type === 'BOOLEAN' ? (
                                <input type="checkbox" checked={!!value} onChange={e => updateField(currentPath, e.target.checked)} />
                            ) : (
                                <input
                                    type={field.type === 'NUMBER' ? 'number' : 'text'}
                                    className="input-base fill"
                                    style={{
                                        padding: '4px 8px',
                                        fontSize: '10px',
                                        height: '24px',
                                        fontFamily: 'var(--font-mono)',
                                        border: '1px solid var(--color-border-strong)'
                                    }}
                                    value={value || ''}
                                    onChange={e => updateField(currentPath, field.type === 'NUMBER' ? parseFloat(e.target.value) || 0 : e.target.value)}
                                    placeholder={field.type}
                                />
                            )
                        )}
                    </div>
                    {isNested && renderFields(field.children, currentPath, level + 1)}
                </div>
            );
        });
    };

    return (
        <div className="indra-slot-utility stack--tight" style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            gap: 'var(--space-2)',
            padding: 'var(--space-3)',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            flexWrap: 'wrap'
        }}>
            {/* 1. MÓDULO DE ENTRADA (SIMULADOR) */}
            <div className="indra-container" style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', minWidth: '280px' }}>
                <header className="indra-header-label" style={{ position: 'sticky', top: 0 }}>{viewMode === 'FORM' ? 'SIMULADOR DE ENTRADAS' : 'JSON INPUT'}</header>
                <div className="fill" style={{ padding: 'var(--space-4)', overflowY: 'auto' }}>
                    <div className="spread" style={{ marginBottom: 'var(--space-3)' }}>
                        <div className="shelf--tight">
                            <IndraIcon name="PLAY" size="12px" color="var(--color-accent)" />
                            <span className="text-label" style={{ fontSize: '10px' }}>INPUTS</span>
                        </div>
                        <div className="shelf--tight glass" style={{ padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                            <button className={`btn btn--xs ${viewMode === 'FORM' ? 'btn--accent' : ''}`} onClick={() => setViewMode('FORM')} style={{ fontSize: '8px', padding: '2px 8px' }}>FORM</button>
                            <button className={`btn btn--xs ${viewMode === 'JSON' ? 'btn--accent' : ''}`} onClick={() => setViewMode('JSON')} style={{ fontSize: '8px', padding: '2px 8px' }}>JSON</button>
                        </div>
                    </div>

                    {viewMode === 'FORM' ? (
                        <div className="stack--tight">
                            {sources.length === 0 && <div className="center opacity-30 italic text-2xs">CONECTA UNA FUENTE</div>}
                            {sources.map(sid => {
                                const schema = schemas[sid];
                                if (!schema) return null;
                                const config = sourceConfigs[sid] || {};
                                const alias = (config.alias || schema.handle?.label || schema.label || sid).toLowerCase().replace(/\s+/g, '_');
                                return (
                                    <div key={sid} className="stack--tight" style={{ borderLeft: '2px solid var(--color-accent)', paddingLeft: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                                        <div className="shelf--tight opacity-60 font-mono" style={{ fontSize: '8px', marginBottom: 'var(--space-2)' }}>{alias.toUpperCase()}</div>
                                        <div className="stack--tight">
                                            {renderFields(schema.fields || [], alias)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <textarea value={JSON.stringify(triggerData, null, 2)} onChange={e => { try { setTriggerData(JSON.parse(e.target.value)); } catch(err) {} }} className="util-input--sm fill" style={{ height: '150px', background: 'rgba(0,0,0,0.3)' }} />
                    )}
                </div>
            </div>

            {/* 2. MÓDULO DE CONTROL */}
            <div className="center stack--tight" style={{ padding: 'var(--space-4)', flex: '0 0 auto' }}>
                <button
                    className={`btn ${isExecuting ? 'btn--ghost' : 'btn--accent'}`}
                    onClick={() => runTest(triggerData)}
                    disabled={isExecuting}
                    style={{
                        padding: 'var(--space-3)',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        flexDirection: 'column',
                        boxShadow: '0 0 20px var(--color-accent-dim)'
                    }}
                >
                    <IndraIcon name={isExecuting ? 'REFRESH' : 'PLAY'} size="18px" className={isExecuting ? 'spin' : ''} />
                    <span style={{ fontSize: '7px', fontWeight: 'bold' }}>{isExecuting ? 'WAIT' : 'TEST'}</span>
                </button>
            </div>

            {/* 3. MÓDULO DE SALIDA (RESULTADOS) */}
            <div className="indra-container fill" style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', minWidth: '220px' }}>
                <header className="indra-header-label">RESULTADOS</header>
                <div className="fill" style={{ padding: 'var(--space-4)', overflowY: 'auto' }}>
                    {testResult ? (
                        <div className="stack--tight">
                            {testResult.error ? (
                                <div className="shelf--tight color-danger font-mono" style={{ fontSize: '10px' }}>
                                    <IndraIcon name="WARN" size="14px" /> ERROR: {testResult.error}
                                </div>
                            ) : (
                                <pre className="font-mono color-success" style={{ fontSize: '10px', margin: 0 }}>
                                    {JSON.stringify(testResult, null, 2)}
                                </pre>
                            )}
                        </div>
                    ) : (
                        <div className="center fill stack--tight opacity-20">
                            <IndraIcon name="CLOCK" size="20px" />
                            <span className="text-hint font-mono" style={{ fontSize: '8px' }}>AWAITING_INPUT</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
