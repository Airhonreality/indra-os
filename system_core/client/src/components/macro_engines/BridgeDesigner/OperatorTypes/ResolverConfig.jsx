import React, { useState, useEffect } from 'react';
import { MappingSelect } from '../MappingSelect';
import ArtifactSelector from '../../../utilities/ArtifactSelector';
import { IndraIcon } from '../../../utilities/IndraIcons';
import { useAppState } from '../../../../state/app_state';

export function ResolverConfig({ config, onUpdate, options = [], bridge }) {
    const { pins, services } = useAppState();
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
        if (!bridge) return;
        setLoadingSchema(true);
        try {
            const provider = getProviderForId(siloId);
            
            // INTENTO DE SINCERIDAD MÁXIMA (ATOM_READ)
            const isLocal = provider === 'system' || pins?.some(p => p.id === siloId);
            let result = null;

            if (isLocal) {
                try {
                    result = await bridge.execute({
                        provider: provider,
                        protocol: 'ATOM_READ',
                        context_id: siloId
                    }, { vaultKey: `schema_fields_${siloId}` });
                } catch (e) {
                    console.warn(`[ResolverConfig] ATOM_READ falló, reintentando con STREAM...`);
                }
            }

            // DETERMINISMO DINÁMICO (TABULAR_STREAM)
            if (!result || !result.payload?.fields) {
                result = await bridge.execute({
                    provider: provider,
                    protocol: 'TABULAR_STREAM',
                    context_id: siloId
                }, { vaultKey: `schema_fields_${siloId}` });
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

    const handleInputMapping = (key, value) => {
        const option = options.find(opt => opt.value === value);
        onUpdate({
            ...config,
            [key]: value,
            [key + '_label']: option?.label || value
        });
    };

    return (
        <div className="stack--tight glass" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>

            {/* 1. INPUT SLOT */}
            <div className="stack--tight" style={{ borderBottom: '1px solid var(--color-border-strong)', paddingBottom: 'var(--space-3)' }}>
                <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>CLAVE_DE_BÚSQUEDA</span>
                <MappingSelect
                    value={config.pointer}
                    options={options}
                    onChange={(val) => handleInputMapping('pointer', val)}
                    placeholder="ELEGIR CAMPO PARA BUSCAR..."
                />
            </div>

            {/* 2. TARGET SILO (PUNTERO) */}
            <div className="stack--tight" style={{ borderBottom: '1px solid var(--color-border-strong)', paddingBottom: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>BASE_DE_DATOS_DESTINO</span>
                <div className="shelf--tight">
                    <button
                        className={`btn btn--xs ${config.mode === 'MANUAL' ? 'btn--accent' : 'btn--ghost'}`}
                        onClick={toggleManualMode}
                        style={{ fontSize: '9px', padding: '4px 10px', fontWeight: 'bold' }}
                    >
                        {config.mode === 'MANUAL' ? 'MODO MANUAL' : 'MODO INFERIDO'}
                    </button>

                    {config.mode === 'MANUAL' && (
                        <div
                            className="shelf--tight glass-hover fill"
                            onClick={() => setShowSelector(true)}
                            style={{
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--color-border)',
                                cursor: 'pointer',
                                background: 'rgba(255,255,255,0.02)',
                                minHeight: '26px'
                            }}
                        >
                            <IndraIcon name="FOLDER" size="10px" color="var(--color-accent)" />
                            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', flex: 1, color: config.silo_id ? 'var(--color-accent)' : 'inherit' }}>
                                {config.silo_label || 'SELECCIONAR SILO EXTERNO...'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. OUTPUT FIELD (RESULTADO) */}
            <div className="stack--tight" style={{ marginTop: 'var(--space-2)' }}>
                <span style={{ fontSize: '8px', opacity: 0.4, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>CAMPO_A_EXTRAER</span>

                {config.mode === 'MANUAL' && config.silo_id ? (
                    <div className="fill">
                        {loadingSchema ? (
                            <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>CARGANDO ESQUEMA...</span>
                        ) : (
                            <MappingSelect
                                value={config.target_field}
                                options={fields.map(f => ({ value: f.id, label: (f.label || f.id).toUpperCase(), type: 'SOURCE' }))}
                                onChange={(val) => onUpdate({ ...config, target_field: val })}
                                placeholder="ELEGIR COLUMNA DE RETORNO..."
                            />
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', opacity: 0.3 }}>ESPERANDO SELECCIÓN DE SILO...</span>
                    </div>
                )}
            </div>

            {showSelector && (
                <ArtifactSelector
                    onSelect={selectSilo}
                    onCancel={() => setShowSelector(false)}
                    title="SELECCIONAR ARTEFACTO DE DATOS"
                />
            )}
        </div>
    );
}
