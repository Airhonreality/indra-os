/**
 * AxiomaticState.js
 * DHARMA: Autoridad Soberana de Identidad (Capa 0.5)
 * 
 * Este es el Singleton que define la "Situación" del sistema.
 * Es la ÚNICA autoridad sobre si una sesión es válida o no.
 * El AxiomaticStore obedece a este estado, no al revés.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import AxiomaticDB from './Infrastructure/AxiomaticDB';

const useAxiomaticState = create(subscribeWithSelector((set, get) => ({
    // ESTADO DE REALIDAD (The Truth)
    session: {
        id: null,           // El ID del Cosmos validado por el Gatekeeper
        status: 'BOOTING',  // BOOTING, READY, RECOVERY, TERMINATED
        mode: 'STANDARD',   // STANDARD, ARCHEOLOGICAL (Read-Only)
        last_validated: null,
        currentRevisionHash: null, // Se reifica asíncronamente
        revisionCycle: 0,   // Metrónomo temporal para la Poda
        hashInitialized: false,
        isLoading: false,   // Unificando la autoridad de carga

        // AXIOMA V12: Estado de Sincronía (ADR 003 - Latido Visual)
        syncStatus: 'SYNCED',  // SYNCED, RETRY, OFFLINE
        failedSyncAttempts: 0, // Contador de intentos fallidos consecutivos
        lastSyncTimestamp: null, // Última sincronización exitosa
        lastSyncError: null    // Último error de sincronía (para debugging)
    },

    // CONTENCIÓN (The Lock)
    interdiction: {
        active: false,      // Si true, BLOQUEA toda escritura saliente
        reason: null        // 'DELETING', 'MIGRATING', 'RECOVERY'
    },

    // ACCIONES DE AUTORIDAD (Solo llamar desde Gatekeeper o Commander)

    /**
     * Establece una sesión validada.
     * Desbloquea la interdicción si el modo es STANDARD.
     */
    setSessionAuthorized: (cosmosId, mode = 'STANDARD') => {
        console.log(`[AxiomaticState] 👑 Session Authorized: ${cosmosId} [${mode}]`);
        set({
            session: {
                id: cosmosId,
                status: 'READY',
                mode: mode,
                last_validated: Date.now()
            },
            interdiction: {
                active: mode === 'ARCHEOLOGICAL', // Bloqueo automático en modo arqueológico
                reason: mode === 'ARCHEOLOGICAL' ? 'READ_ONLY_RECOVERY' : null
            }
        });
    },

    /**
     * Colapso Controlado de la Realidad.
     * Revoca la identidad y activa bloqueo inmediato.
     */
    terminateSession: (reason) => {
        console.warn(`[AxiomaticState] 💀 Session Terminated: ${reason}`);
        set({
            session: {
                id: null,
                status: 'TERMINATED',
                mode: 'STANDARD',
                last_validated: null,
                hashInitialized: true // AXIOMA: No hay nada que esperar si la sesión ha muerto.
            },
            interdiction: {
                active: false,
                reason: null
            }
        });
    },

    /**
     * Activa el Bloqueo Mundial (World Lock).
     * Usado durante borrados o migraciones críticas.
     */
    engageWorldLock: (reason) => {
        console.log(`[AxiomaticState] 🔒 World Lock Engaged: ${reason}`);
        set((state) => ({
            interdiction: {
                active: true,
                reason: reason
            }
        }));
    },

    /**
     * Libera el Bloqueo Mundial.
     */
    releaseWorldLock: () => {
        console.log(`[AxiomaticState] 🔓 World Lock Released`);
        set((state) => ({
            interdiction: {
                active: false,
                reason: null
            }
        }));
    },

    /**
     * Reifica el hash desde la memoria de hierro (IndexedDB)
     */
    igniteHash: async () => {
        try {
            console.log("[AxiomaticState] 🏺 Recalling temporal identity from Iron Memory...");
            let hash = await AxiomaticDB.getItem('INDRA_REVISION_HASH');

            // Fallback de Emergencia
            if (!hash) {
                hash = localStorage.getItem('INDRA_REVISION_HASH');
                if (hash) console.info("[AxiomaticState] 🧪 Fallback to Legacy Memory successful.");
            }

            set((state) => ({
                session: { ...state.session, currentRevisionHash: hash, hashInitialized: true }
            }));
        } catch (e) {
            console.error("[AxiomaticState] 💀 Memory corrupted during ignition:", e);
            set((state) => ({ session: { ...state.session, hashInitialized: true } }));
        }
    },

    /**
     * Actualiza el Sello Cronológico de la realidad actual.
     */
    updateRevisionHash: (hash) => {
        if (!hash) return;

        // Persistencia Dual (Soberanía y Legado)
        localStorage.setItem('INDRA_REVISION_HASH', hash);
        AxiomaticDB.setItem('INDRA_REVISION_HASH', hash).catch(e =>
            console.warn("[AxiomaticState] Failed to persist hash to Iron Memory:", e)
        );

        set((state) => ({
            session: {
                ...state.session,
                currentRevisionHash: hash,
                revisionCycle: state.session.revisionCycle + 1,
                hashInitialized: true
            }
        }));
    },

    /**
     * Consulta de Autoridad (Para Membranas)
     */
    isWriteAllowed: () => {
        const state = get();

        // AXIOMA: Bloqueo de Interdicción Explícita (Priority 1)
        if (state.interdiction.active) {
            return false;
        }

        // AXIOMA: Libertad de Creación (Metaphysical Exception)
        // Permitimos el flujo si no hay sesión para facilitar el Génesis inicial.
        if (state.session.id === null) return true;

        // AXIOMA: Estado de Preparación Física
        return state.session.status === 'READY';
    },

    /**
     * Establece el estado de carga global.
     * AXIOMA: La resonancia activa interdicción automática (V11 Pureness)
     */
    setLoading: (bool) => {
        set((state) => {
            const currentReason = state.interdiction.reason;
            const isHighPriorityLock = currentReason && currentReason !== 'TRANSIT_RESONANCE';

            const nextActive = bool
                ? true
                : (currentReason === 'TRANSIT_RESONANCE' ? false : state.interdiction.active);

            return {
                session: { ...state.session, isLoading: bool },
                interdiction: {
                    active: nextActive,
                    reason: bool
                        ? (isHighPriorityLock ? currentReason : 'TRANSIT_RESONANCE')
                        : (currentReason === 'TRANSIT_RESONANCE' ? null : currentReason)
                }
            };
        });
    },

    /**
     * AXIOMA V12: Actualizar Estado de Sincronía (ADR 003)
     * Llamado desde InterdictionUnit tras cada intento de piggybacking.
     * 
     * @param {string} status - 'SYNCED' | 'RETRY' | 'OFFLINE'
     * @param {Error|null} error - Error de sincronía (opcional)
     */
    updateSyncStatus: (status, error = null) => {
        set((state) => {
            const updates = {
                session: {
                    ...state.session,
                    syncStatus: status,
                    lastSyncError: error
                }
            };

            // AXIOMA: Registro de Sincronía Exitosa
            if (status === 'SYNCED') {
                updates.session.lastSyncTimestamp = Date.now();
                updates.session.failedSyncAttempts = 0; // Reset contador

                console.log('%c 💾 [AxiomaticState] Sync SUCCESS - Reality backed up', 'color: #10b981');
            }

            // AXIOMA: Incremento de Contador de Fallos
            if (status === 'RETRY' || status === 'OFFLINE') {
                updates.session.failedSyncAttempts = state.session.failedSyncAttempts + 1;

                const attempts = updates.session.failedSyncAttempts;
                console.warn(`%c ⚠️ [AxiomaticState] Sync FAIL (attempt ${attempts}) - ${error?.message || 'Unknown error'}`, 'color: #f59e0b');

                // AXIOMA: Transición a OFFLINE tras 4 intentos fallidos
                if (attempts >= 4 && status === 'RETRY') {
                    updates.session.syncStatus = 'OFFLINE';
                    console.error('%c 🔴 [AxiomaticState] Entering OFFLINE MODE', 'color: #ef4444; font-weight: bold');
                }
            }

            return updates;
        });
    }
})));

// AXIOMA: Soberanía de Identidad (Encapsulado en ESM)
// No exposición global window.INDRA_AXIOMATIC_STATE

export default useAxiomaticState;



