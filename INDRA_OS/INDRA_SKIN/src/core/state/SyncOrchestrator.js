/**
 * SyncOrchestrator.js (V12 - Snapshot Purge Edition)
 * DHARMA: Gestor de Snapshot de Realidad
 * 
 * AXIOMA V12: "La realidad viaja completa, no fragmentada"
 * Este orquestador genera snapshots atómicos del estado actual para
 * ser enviados oportunistamente (piggybacking) al backend.
 */

import { create } from 'zustand';
import useAxiomaticState from './AxiomaticState';
import {
    cleanArtifactForSnapshot,
    cleanRelationshipsForSnapshot
} from './schemas/DataConventions';

const useSyncOrchestrator = create((set, get) => ({
    lastSnapshotTime: null,
    snapshotCount: 0,

    /**
     * AXIOMA V12: Preparación de Snapshot de Realidad (Soberanía Circular)
     * Genera un snapshot completo del estado actual para piggybacking.
     * 
     * AXIOMA DE LIMPIEZA (ADR 003):
     * - Solo persiste "Identidad y Geometría" de INDRA
     * - Elimina "Contenido Dinámico" de Terceros (_liveData, _cache, etc.)
     * - Preserva anotaciones y configuraciones del usuario
     */
    prepareSnapshot: () => {
        const axStore = window.AxiomaticStore?.getState?.();
        if (!axStore || !axStore.phenotype?.cosmosIdentity) return null;

        const cosmosId = axStore.phenotype.cosmosIdentity.id;
        const axState = useAxiomaticState.getState();

        // AXIOMA V12: Limpieza Semántica con DataConventions
        // Elimina campos volátiles (_isDirty, _simulated, _liveData, _cache, etc.)
        const cleanArtifacts = (axStore.phenotype.artifacts || [])
            .map(art => cleanArtifactForSnapshot(art));

        const cleanRelationships = cleanRelationshipsForSnapshot(
            axStore.phenotype.relationships || []
        );

        const snapshot = {
            cosmosId,
            artifacts: cleanArtifacts,
            relationships: cleanRelationships,
            activeLayout: axStore.phenotype.activeLayout,
            activeFlow: axStore.phenotype.activeFlow,
            devLab: axStore.phenotype.devLab,
            _timestamp: Date.now(),
            _revisionHash: axState.session.currentRevisionHash
        };

        set({
            lastSnapshotTime: Date.now(),
            snapshotCount: get().snapshotCount + 1
        });

        return snapshot;
    },

    /**
     * Obtiene estadísticas de sincronización (para DevLab)
     */
    getStats: () => ({
        lastSnapshotTime: get().lastSnapshotTime,
        snapshotCount: get().snapshotCount,
        timeSinceLastSnapshot: get().lastSnapshotTime
            ? Date.now() - get().lastSnapshotTime
            : null
    })
}));

// Helper functions para fusión de arrays (legacy, puede removerse si no se usa)
function _mergeArtifacts(base = [], delta = []) {
    const merged = [...base];
    delta.forEach(newArt => {
        const existingIndex = merged.findIndex(a => a.id === newArt.id);
        if (existingIndex !== -1) {
            merged[existingIndex] = { ...merged[existingIndex], ...newArt };
        } else {
            merged.push(newArt);
        }
    });
    return merged;
}

function _mergeRelationships(base = [], delta = []) {
    const merged = [...base];
    delta.forEach(newRel => {
        const existingIndex = merged.findIndex(r => r.id === newRel.id);
        if (existingIndex !== -1) {
            merged[existingIndex] = { ...merged[existingIndex], ...newRel };
        } else {
            merged.push(newRel);
        }
    });
    return merged;
}

export default useSyncOrchestrator;
