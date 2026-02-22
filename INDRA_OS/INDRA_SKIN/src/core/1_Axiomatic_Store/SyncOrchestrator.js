/**
 * SyncOrchestrator.js (V12 - Snapshot Purge Edition)
 * DHARMA: Gestor de Snapshot de Realidad
 * 
 * AXIOMA V12: "La realidad viaja completa, no fragmentada"
 * Este orquestador genera snapshots atómicos del estado actual para
 * ser enviados oportunistamente (piggybacking) al backend.
 */

import { create } from 'zustand';
import useAxiomaticState from './AxiomaticState.js';
import {
    cleanArtifactForSnapshot,
    cleanRelationshipsForSnapshot
} from './schemas/DataConventions.js';

import { StateBridge } from './StateBridge.js';

const useSyncOrchestrator = create((set, get) => ({
    lastSnapshotTime: null,
    snapshotCount: 0,

    /**
     * AXIOMA V12: Preparación de Snapshot de Realidad (Soberanía Circular)
     * Genera un snapshot completo del estado actual para piggybacking.
     */
    prepareSnapshot: () => {
        const axStore = StateBridge.getState();
        if (!axStore || !axStore.phenotype?.cosmosIdentity) return null;

        const cosmosId = axStore.phenotype.cosmosIdentity.id;
        const axState = useAxiomaticState.getState();

        // AXIOMA V12: Limpieza Semántica con DataConventions
        // 1. Filtrar Fantasmas (GHOST PROTOCOL)
        // 2. Limpiar campos volátiles
        const artifactsList = Object.values(axStore.phenotype.artifacts || {});
        const cleanArtifacts = artifactsList
            .filter(art => !art._isGhost && !art._isMock) // 🛡️ ELIMINAR FANTASMAS
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
            // ADR-021: devLab PURGADO del snapshot soberano
            _timestamp: Date.now(),
            _revisionHash: axState.session.currentRevisionHash,
            last_modified: new Date().toISOString()
        };

        set({
            lastSnapshotTime: Date.now(),
            snapshotCount: get().snapshotCount + 1
        });

        return snapshot;
    },

    /**
     * Obtiene estadísticas de sincronización.
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




