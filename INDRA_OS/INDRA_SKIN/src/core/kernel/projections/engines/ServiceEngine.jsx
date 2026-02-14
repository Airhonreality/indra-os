import React from 'react';
import { Icons } from '../../../../4_Atoms/IndraIcons';

/**
 * ServiceEngine.jsx
 * DHARMA: Proyector especializado en Artefactos de Procesamiento e Inteligencia.
 * AXIOMA: Un servicio no es un puente (Adapter), es un motor que transforma realidad.
 */
const ServiceEngine = ({ data, perspective }) => {
    // 1. Sensado del Canon
    const { LABEL, DOMAIN, CAPABILITIES: rawCaps, VITAL_SIGNS, technical_id } = data;
    const isIntelligence = DOMAIN === 'INTELLIGENCE' || DOMAIN === 'COGNITIVE';

    // AXIOMA: Fallback de Capacidades para Servicios Fantasma
    const CAPABILITIES = (rawCaps && Object.keys(rawCaps).length > 0) ? rawCaps : (data._isGhost ? {
        "can_think": true,
        "can_process": true,
        "can_hallucinate": false,
        "can_reify": true
    } : {});

    // 2. Determinar estado de salud del proceso
    const status = VITAL_SIGNS?.status || 'ACTIVE';
    const load = VITAL_SIGNS?.load || '0%';

    return (
        <div className="h-full w-full flex flex-col bg-[var(--bg-primary)] p-6 overflow-y-auto font-mono">
            {/* Cabecera de Servicio: Enfoque en Procesamiento */}
            <div className="flex items-start justify-between mb-8 border-b border-[var(--border-subtle)] pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-3 h-3 rounded-full animate-pulse ${status === 'ACTIVE' ? 'bg-[var(--accent)]' : 'bg-[var(--error)]'}`} />
                        <h1 className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">
                            {LABEL?.toUpperCase()}
                        </h1>
                    </div>
                    <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded border border-[var(--accent)]/20">
                        {DOMAIN} ENGINE
                    </span>
                </div>

                <div className="text-right">
                    <span className="text-[9px] text-[var(--text-dim)] block mb-1">COMPUTE_LOAD</span>
                    <span className="text-xl font-bold text-[var(--accent)]">{load}</span>
                </div>
            </div>

            {/* Malla de Capacidades (Reflejando la Inteligencia del Servicio) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Panel de Estado / Log de Pensamiento */}
                <div className="bg-[var(--bg-secondary)]/30 border border-[var(--border-subtle)] rounded-xl p-5">
                    <h3 className="text-[10px] font-bold text-[var(--text-dim)] mb-4 flex items-center gap-2">
                        <Icons.Activity size={12} />
                        PROCESS_TRACE
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 opacity-50">
                            <span className="text-[9px] text-[var(--accent)]">[08:24]</span>
                            <span className="text-[10px] text-[var(--text-soft)]">Kernel initialized...</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[9px] text-[var(--accent)]">[09:12]</span>
                            <span className="text-[10px] text-[var(--text-vibrant)]">Sensing context in active Cosmos...</span>
                        </div>
                        <div className="flex items-center gap-3 italic text-[var(--accent)]">
                            <span className="text-[9px] opacity-50">{'>>'}  </span>
                            <span className="text-[10px]">Awaiting cognitive trigger...</span>
                        </div>
                    </div>
                </div>

                {/* Controles de Configuración de Motor */}
                <div className="bg-[var(--bg-secondary)]/30 border border-[var(--border-subtle)] rounded-xl p-5">
                    <h3 className="text-[10px] font-bold text-[var(--text-dim)] mb-4 flex items-center gap-2">
                        <Icons.Settings size={12} />
                        ENGINE_PARAMETERS
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(CAPABILITIES || {}).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between border-b border-[var(--border-subtle)]/30 pb-2">
                                <span className="text-[10px] text-[var(--text-soft)] uppercase">{key.replace('can_', '')}</span>
                                <span className={`text-[9px] font-bold ${val ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}>
                                    {val ? 'ENABLED' : 'DISABLED'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer de Consola */}
            <div className="mt-auto pt-8 flex items-center justify-between text-[8px] text-[var(--text-dim)] border-t border-[var(--border-subtle)]/30">
                <span>V8.0 SERVICE_RUNTIME</span>
                <span>UUID: {data.technical_id || 'LOCAL-INSTANCE'}</span>
            </div>
        </div>
    );
};

export default ServiceEngine;
