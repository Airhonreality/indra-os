import React from 'react';
import { useAxiomaticSense } from './hooks/useAxiomaticSense';
import { ActionTransmuter } from './transmuters/ActionTransmuter';
import { MateriaTransmuter } from './transmuters/MateriaTransmuter';
import { SenseTransmuter } from './transmuters/SenseTransmuter';

/**
 * AXIOMATIC TRANSMUTER (The Orchestrator)
 * 🔬 CAPA 2: MOTOR DE TRANSMUTACIÓN DE MATERIA
 */

/**
 * AxiomaticAtom: Transmuta un átomo individual en Materia.
 * Si el átomo tiene una fuente de datos, se hidrata antes de transmutar.
 */
export const AxiomaticAtom = ({ atom }) => {
    // AXIOMA: El hook decide si hidratar basándose en entity.data_source
    const { data: dynamicData, isLoading } = useAxiomaticSense(atom);

    if (isLoading) {
        return <div className="h-10 w-full animate-pulse bg-white/[0.02] border border-white/[0.03] rounded-sm"></div>;
    }

    const hydratedAtom = {
        ...atom,
        // Si la fuente devolvió opciones (ej: DROPDOWN), las inyectamos. 
        // Si devolvió un valor simple (ej: STATUS), lo mezclamos.
        ...(Array.isArray(dynamicData) ? { options: dynamicData } : dynamicData?.[0] || {})
    };

    if (!hydratedAtom.type) return null;

    if (hydratedAtom.type.startsWith('ACTION_')) {
        return <ActionTransmuter atom={hydratedAtom} />;
    }

    if (hydratedAtom.type.startsWith('INPUT_') || ['DROPDOWN', 'TEXTAREA', 'TOGGLE', 'SLIDER'].includes(hydratedAtom.type)) {
        return <MateriaTransmuter atom={hydratedAtom} />;
    }

    if (['DATA_ROW', 'STATUS_PULSE', 'PROGRESS_BAR', 'STATUS_TAG'].includes(hydratedAtom.type)) {
        return <SenseTransmuter atom={hydratedAtom} />;
    }

    return <div className="text-[7px] font-mono opacity-20">[UNKNOWN_MATTER::{hydratedAtom.type}]</div>;
};

/**
 * AxiomaticGroup: Manifiesta sub-módulos agrupados (The UI Fabric)
 * Dharma: Determinismo espacial y jerarquía visual + Hidratación de Grupo.
 */
export const AxiomaticGroup = ({ subModule }) => {
    if (!subModule) return null;

    // Hidratación del Grupo (Determinismo asíncrono)
    const { data: dynamicAtoms, isLoading } = useAxiomaticSense(subModule);

    const atoms = dynamicAtoms || subModule.atoms || [];

    return (
        <div className="stark-ui-group">
            <header className="flex items-center justify-between border-b border-white/[0.04] pb-3 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-3 bg-accent-primary opacity-60"></div>
                    <div className="stack-v">
                        <h4 className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em]">
                            {subModule.label}
                        </h4>
                        {isLoading && <span className="text-[6px] animate-pulse text-accent-primary/40 uppercase tracking-widest">Sensing_Signal_</span>}
                    </div>
                </div>
                {/* Arquetipo oculto para limpieza visual por canon v2.1 */}
            </header>

            <div className={`stark-group-atoms-container ${subModule.layout_mode === 'FLOW_H' ? 'flow-h' : ''} flex flex-col gap-4`}>
                {atoms.map(atom => (
                    <AxiomaticAtom
                        key={atom.id}
                        atom={{
                            ...atom,
                            data_params: atom.data_params || subModule.data_params
                        }}
                    />
                ))}

                {atoms.length === 0 && !isLoading && (
                    <div className="text-[8px] font-mono opacity-10 uppercase py-4 border border-dashed border-white/[0.05] text-center">
                        Zero_Signals_Detected
                    </div>
                )}
            </div>
        </div>
    );
};
