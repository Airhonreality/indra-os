/**
 * =============================================================================
 * ARTEFACTO: components/macro_engines/BridgeDesigner/OperatorTypes/ResolverConfig.jsx
 * RESPONSABILIDAD: Configuración de cruce de datos y extracción.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import { MicroSlot } from '../MicroSlot';
import ArtifactSelector from '../../../utilities/ArtifactSelector';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAppState } from '../../../../state/app_state';
import { executeDirective } from '../../../../services/directive_executor';

export function ResolverConfig({ config, onUpdate, focusedTarget, setFocusedTarget, opId }) {
    const { coreUrl, sessionSecret, pins, services } = useAppState();
    const [showSelector, setShowSelector] = useState(false);
    const [fields, setFields] = useState([]);
    const [loadingSchema, setLoadingSchema] = useState(false);

    useEffect(() => {
        if (config.mode === 'MANUAL' && config.silo_id) {
            fetchSiloSchema(config.silo_id);
        } else {
            setFields([]);
        }
    }, [config.mode, config.silo_id]);

    const getProviderForId = (targetId) => {
        const pin = pins?.find(p => p.id === targetId);
        if (pin) return pin.provider;
        const service = services?.find(s => s.id === targetId);
        if (service) return service.provider || service.id;
        return 'system';
    };

    const fetchSiloSchema = async (siloId) => {
        setLoadingSchema(true);
        try {
            const provider = getProviderForId(siloId);
            
            // INTENTO DE SINCERIDAD MÁXIMA (ATOM_READ)
            const isLocal = provider === 'system' || pins?.some(p => p.id === siloId);
            let result = null;

            if (isLocal) {
                try {
                    result = await executeDirective({
                        provider: provider,
                        protocol: 'ATOM_READ',
                        context_id: siloId
                    }, coreUrl, sessionSecret);
                } catch (e) {
                    console.warn(`[ResolverConfig] ATOM_READ falló, reintentando con STREAM...`);
                }
            }

            // DETERMINISMO DINÁMICO (TABULAR_STREAM)
            if (!result || !result.payload?.fields) {
                result = await executeDirective({
                    provider: provider,
                    protocol: 'TABULAR_STREAM',
                    context_id: siloId
                }, coreUrl, sessionSecret);
            }

            const fields = result.payload?.fields || [];
            if (fields.length > 0) {
                setFields(fields);
            }
        } catch (err) {
            console.error('[ResolverConfig] Error de Sinceridad:', err);
            setFields([]);
        } finally {
            setLoadingSchema(false);
        }
    };

    const toggleManualMode = () => {
        onUpdate({
            ...config,
            mode: config.mode === 'MANUAL' ? 'INFERRED' : 'MANUAL',
            silo_id: null,
            silo_label: null,
            target_field: null
        });
    };

    const selectSilo = (silo) => {
        onUpdate({
            ...config,
            silo_id: silo.id,
            silo_label: silo.handle?.label || silo.id,
            target_field: null
        });
        setShowSelector(false);
    };

    return (
        <div className="stack--loose glass" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)' }}>

            {/* 1. INPUT SLOT */}
            <div className="shelf--tight" style={{ borderBottom: '1px solid var(--color-border-strong)', paddingBottom: 'var(--space-2)' }}>
                <IndraIcon name="ARROW_RIGHT" size="10px" style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.7, width: '80px' }}>SEARCH_KEY</span>
                <MicroSlot
                    value={config.pointer}
                    label={config.pointer_label}
                    isActive={focusedTarget?.id === opId && focusedTarget?.key === 'pointer'}
                    onActivate={() => setFocusedTarget({ mode: 'OPERATOR', id: opId, key: 'pointer' })}
                    placeholder="CHOOSE_SLOT_TO_SEARCH"
                />
            </div>

            {/* 2. TARGET SILO (PUNTERO) */}
            <div className="shelf--tight" style={{ borderBottom: '1px solid var(--color-border-strong)', paddingBottom: 'var(--space-2)' }}>
                <IndraIcon name="FOLDER" size="10px" style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.7, width: '80px' }}>IN_DATABASE</span>

                <button
                    className={`btn btn--xs ${config.mode === 'MANUAL' ? 'btn--accent' : 'btn--ghost'}`}
                    onClick={toggleManualMode}
                    style={{ fontSize: '8px', padding: '2px 8px' }}
                >
                    {config.mode === 'MANUAL' ? 'MANUAL' : 'INFERRED'}
                </button>

                {config.mode === 'MANUAL' && (
                    <div
                        className="shelf--tight glass-hover fill"
                        onClick={() => setShowSelector(true)}
                        style={{
                            padding: 'var(--space-1) var(--space-3)',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            background: config.silo_id ? 'rgba(var(--rgb-accent), 0.05)' : 'transparent'
                        }}
                    >
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', flex: 1 }}>
                            {config.silo_label || 'SELECT_EXT_SILO...'}
                        </span>
                    </div>
                )}
            </div>

            {/* 3. OUTPUT FIELD (RESULTADO) */}
            <div className="shelf--tight">
                <IndraIcon name="TARGET" size="10px" style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.7, width: '80px' }}>EXTRACT_FIELD</span>

                {config.mode === 'MANUAL' && config.silo_id ? (
                    <div className="fill">
                        {loadingSchema ? (
                            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>LOADING_COLUMNS...</span>
                        ) : (
                            <select
                                value={config.target_field || ''}
                                onChange={(e) => onUpdate({ ...config, target_field: e.target.value })}
                                style={{
                                    width: '100%',
                                    background: 'var(--color-bg-void)',
                                    border: '1px solid var(--color-border)',
                                    color: 'white',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '10px',
                                    padding: 'var(--space-1) var(--space-2)',
                                    borderRadius: 'var(--radius-sm)'
                                }}
                            >
                                <option value="">SELECT_COLUMN...</option>
                                {fields.map(f => (
                                    <option key={f.id} value={f.id}>{f.label || f.id}</option>
                                ))}
                            </select>
                        )}
                    </div>
                ) : (
                    <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.4 }}>AWAITING_SILO_SELECTION...</span>
                )}
            </div>

            {showSelector && (
                <ArtifactSelector
                    onSelect={selectSilo}
                    onCancel={() => setShowSelector(false)}
                    title="RESOLVER_TARGET_SILO"
                />
            )}
        </div>
    );
}
