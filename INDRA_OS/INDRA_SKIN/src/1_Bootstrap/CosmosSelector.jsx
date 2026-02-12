/**
 * CAPA 1: BOOTSTRAP
 * CosmosSelector.jsx
 * DHARMA: Selector de Universo (Simplified OMD-10).
 * Lista ÚNICAMENTE los artefactos Cosmos válidos desde la carpeta FLOWS canonizada.
 */

import React, { useState, useEffect } from 'react';
import { useAxiomaticStore } from '../core/state/AxiomaticStore';
import useAxiomaticState from '../core/state/AxiomaticState';
import adapter from '../core/Sovereign_Adapter';
import ComponentProjector from '../core/kernel/ComponentProjector';
import ArtifactExplorer from './ArtifactExplorer';

const CosmosSelector = () => {
    const { state, execute } = useAxiomaticStore();
    const globalLoading = useAxiomaticState(s => s.session.isLoading);
    const { availableCosmos, discoveryStatus } = state.phenotype;

    const [isCreating, setIsCreating] = useState(false);
    const [isDiagnosticMode, setIsDiagnosticMode] = useState(false);
    const [selectedCosmosId, setSelectedCosmosId] = useState(null);
    const [localError, setLocalError] = useState(null);

    const isLoading = globalLoading || discoveryStatus === 'SCANNING';

    // AXIOMA: Libertad de Carga (Delegado al Ciclo de Vida del Kernel)
    const handleRefresh = () => {
        execute('START_DISCOVERY');
    };

    const handleMountCosmos = () => {
        if (!selectedCosmosId) return;
        execute('MOUNT_COSMOS', { cosmosId: selectedCosmosId });
    };

    const handleDeleteCosmos = async (id, label) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar la realidad "${label || id}"?\nEsta acción moverá el archivo a la papelera.`)) return;

        try {
            // AXIOMA: Eliminación vía Adapter (V12)
            await adapter.call('cosmos', 'deleteCosmos', { cosmosId: id });
            execute('START_DISCOVERY'); // Actualizar lista de universos
            if (selectedCosmosId === id) setSelectedCosmosId(null);
        } catch (err) {
            setLocalError(`Delete Failed: ${err.message}`);
        }
    };

    const handleCreateCosmos = async (payload) => {
        setLocalError(null);
        execute('START_DISCOVERY'); // Activa el spinner global

        try {
            const identity = payload.identity || { label: payload.label, description: payload.description };

            // AXIOMA: Génesis Sincrónico (Capa 1)
            // No creamos ID temporal, esperamos al servidor para obtener la Verdad.
            const tempId = `temp_${Date.now()}`;
            const response = await adapter.call('cosmos', 'saveCosmos', {
                cosmosId: tempId,
                cosmos: {
                    id: tempId,
                    ...payload,
                    identity: {
                        label: identity.label || "Sin Título",
                        description: identity.description || "Realidad persistida por Indra App"
                    },
                    artifacts: [],
                    relationships: [],
                    activeLayout: { VIEW_MODE: 'GRAPH' },
                    last_modified: new Date().toISOString()
                }
            });

            if (response && (response.id || response.new_id)) {
                // Forzar actualización inmediata de la lista
                execute('START_DISCOVERY');
                setIsCreating(false);
            } else {
                throw new Error(response.error || "El servidor no devolvió una identidad válida.");
            }
        } catch (err) {
            setLocalError(`Fallo en el Génesis: ${err.message}`);
            execute('UPDATE_COSMOS_REGISTRY', availableCosmos); // Restaurar estado
        }
    };

    if (isCreating) {
        return (
            <div className="w-full h-full flex flex-col justify-start items-center p-8 pt-28 bg-[var(--bg-primary)] overflow-hidden">
                <div className="max-w-2xl w-full max-h-[80vh] flex flex-col p-8 bg-[var(--bg-secondary)]/90 border border-[var(--border-subtle)] rounded-3xl backdrop-blur-xl shadow-2xl animate-in zoom-in-95 duration-500 overflow-hidden">
                    <ComponentProjector
                        perspective="SCHEMA_PROJECTION"
                        schemaId="COSMOS_V1"
                        onCommit={handleCreateCosmos}
                        onCancel={() => setIsCreating(false)}
                        error={localError}
                    />
                </div>
            </div>
        );
    }

    // Diagnostic Mode
    if (isDiagnosticMode) {
        return (
            <div className="w-full h-full relative">
                <button
                    onClick={() => setIsDiagnosticMode(false)}
                    className="absolute top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:brightness-125 transition-all"
                >
                    ✕ Cerrar Diagnóstico
                </button>
                <ArtifactExplorer />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-transparent">
            <div className="max-w-2xl w-full flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-2 border-b border-[var(--indra-glass-border)] pb-6 relative">
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">
                        Seleccionar Cosmos
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] font-mono opacity-60">
                        Elige una <span className="text-[var(--accent)] font-bold">Realidad Cuántica</span> para habitar.
                    </p>

                    <div className="absolute right-0 top-0 flex gap-2">
                        <button
                            onClick={() => setIsDiagnosticMode(true)}
                            className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all active:scale-95"
                        >
                            🔍 Diagnóstico
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-[var(--accent)] text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-[var(--accent)]/20"
                        >
                            + Nuevo Cosmos
                        </button>
                    </div>
                </div>

                {/* Cosmos Artifacts List */}
                <div className="flex-1 min-h-[300px] overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                    {isLoading && availableCosmos.length === 0 ? (
                        <div className="flex items-center justify-center h-48 border border-[var(--indra-glass-border)] rounded-xl opacity-40 italic font-mono text-xs">
                            Escaneando Registro de Flujos...
                        </div>
                    ) : availableCosmos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 border border-[var(--indra-glass-border)] rounded-xl text-[var(--text-dim)] gap-4 border-dashed">
                            <div className="text-center">
                                <p className="font-mono text-xs uppercase tracking-widest">No se identificaron Cosmos en el directorio FLOWS</p>
                                <p className="text-[10px] mt-2 opacity-50">Carga un artefacto cosmos.json válido para comenzar.</p>
                            </div>
                        </div>
                    ) : (
                        availableCosmos.map(artifact => (
                            <div
                                key={artifact.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedCosmosId(artifact.id)}
                                className={`
                                    w-full p-5 rounded-xl border text-left transition-all group relative overflow-hidden
                                    ${selectedCosmosId === artifact.id
                                        ? 'bg-[var(--accent)]/5 border-[var(--accent)] shadow-xl'
                                        : 'bg-[var(--bg-secondary)] border-[var(--indra-glass-border)] hover:border-[var(--text-dim)] shadow-sm'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`
                                        w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl border
                                        ${selectedCosmosId === artifact.id ? 'bg-[var(--accent)] text-black border-transparent' : 'bg-[var(--bg-deep)] border-[var(--indra-glass-border)] text-[var(--accent)]'}
                                    `}>
                                        {artifact.identity?.label?.charAt(0) || 'C'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">
                                                {artifact.identity?.label || artifact.name}
                                            </div>
                                            <div className="text-[9px] font-mono opacity-30">
                                                ID: {artifact.id?.substring(0, 8) || '...'}...
                                            </div>
                                        </div>
                                        <div className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-1 opacity-70">
                                            {artifact.identity?.description || 'Definición axiomática de un espacio de trabajo.'}
                                        </div>
                                    </div>

                                    {/* Botón de Borrado - siempre visible en hover */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCosmos(artifact.id, artifact.identity?.label);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-all z-20 absolute right-4"
                                        title="Eliminar Realidad"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                                        </svg>
                                    </button>

                                    {selectedCosmosId === artifact.id && (
                                        <div className="absolute right-0 top-0 h-full w-1 bg-[var(--accent)]"></div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-xl font-mono text-[10px] uppercase tracking-[0.2em] bg-[var(--bg-secondary)] border border-[var(--indra-glass-border)] text-[var(--text-dim)] hover:text-[var(--text-primary)] transition-all shadow-sm"
                    >
                        {isLoading ? 'Escaneando...' : 'Re-Escanear Flujos'}
                    </button>
                    <button
                        onClick={handleMountCosmos}
                        disabled={!selectedCosmosId || isLoading}
                        className={`
                            flex-1 py-3 px-6 rounded-xl font-mono text-[10px] uppercase tracking-[0.3em] font-bold
                            transition-all duration-500
                            ${selectedCosmosId
                                ? 'bg-[var(--accent)] text-black shadow-xl hover:scale-[1.02] active:scale-95'
                                : 'bg-white/5 text-[var(--text-dim)] cursor-not-allowed grayscale'
                            }
                        `}
                    >
                        Habitar Realidad Cuántica
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CosmosSelector;
