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
import contextClient from '../core/kernel/ContextClient';
import ComponentProjector from '../core/kernel/ComponentProjector';
import ArtifactExplorer from './ArtifactExplorer';
import HoldToDeleteButton from '../4_Atoms/HoldToDeleteButton';

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

    const handleDeleteCosmos = (id) => {
        // AXIOMA: Delegación Soberana (El Store lo maneja TODO en tiempo real)
        execute('DELETE_COSMOS', { cosmosId: id });
        if (selectedCosmosId === id) setSelectedCosmosId(null);
    };

    const handleCreateCosmos = async (payload) => {
        setLocalError(null);
        execute('START_DISCOVERY'); // Activa el spinner global

        try {
            const identity = payload.identity || { label: payload.label, description: payload.description };

            // AXIOMA: Identidad Determinista al Nacer (UUID Final)
            const finalUuid = `cosmos_${crypto.randomUUID().split('-')[0]}_${Date.now().toString(36)}`;

            const response = await adapter.call('cosmos', 'saveCosmos', {
                cosmosId: finalUuid,
                fileName: identity.label ? `${identity.label}.cosmos.json` : "mi_universo.cosmos.json",
                cosmos: {
                    id: finalUuid,
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

            if (response && response.success && (response.id || response.new_id || response.fileId)) {
                const realId = response.new_id || response.id || response.fileId;

                console.info(`%c ✨ [Genesis] Identity granted by Core: ${realId}`, "color: #10b981; font-weight: bold;");

                // 4. AXIOMA: Inmediatez de Propósito. Si lo creo, quiero habitarlo.
                setIsCreating(false);
                setSelectedCosmosId(realId);

                // Forzamos un pequeño delay para que Drive asiente el archivo
                setTimeout(() => {
                    execute('MOUNT_COSMOS', { cosmosId: realId });
                }, 500);

            } else {
                throw new Error(response?.error || response?.result?.error || "El servidor no devolvió una identidad válida.");
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

                                    {/* Botón de Borrado - Cinético (Hold to Delete) */}
                                    <div className="opacity-0 group-hover:opacity-100 absolute right-4 transition-all z-20 hover:scale-110">
                                        <HoldToDeleteButton
                                            onComplete={() => handleDeleteCosmos(artifact.id)}
                                            size={32}
                                            iconSize={16}
                                        />
                                    </div>

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
