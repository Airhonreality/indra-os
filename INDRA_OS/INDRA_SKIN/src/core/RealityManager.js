/**
 * RealityManager.js
 * DHARMA: Cerebro de la Continuidad y la Reificación de Cosmos.
 * Misión: Orquestar el ciclo de vida de los Cosmos (Discovery, Mount, Save, Sync).
 * 
 * V15.0: Fragmentación de la Voluntad (ADR-022 / TTGS Compliance).
 */
import { contextClient } from './kernel/ContextClient.js';
import persistenceManager from './1_Axiomatic_Store/PersistenceManager.jsx';
import compiler from './2_Semantic_Transformation/Law_Compiler.js';
import AxiomaticDB from './1_Axiomatic_Store/Infrastructure/AxiomaticDB.js';
import useAxiomaticState from './1_Axiomatic_Store/AxiomaticState.js';
import adapter from './Sovereign_Adapter.js';

class RealityManager {
    constructor() {
        this.dispatch = null;
    }

    setDispatcher(dispatch) {
        this.dispatch = dispatch;
    }

    /**
     * IGNITE: Punto de entrada para la reconstrucción de la realidad tras un reload.
     */
    async ignite() {
        const lastCosmosId = localStorage.getItem('LAST_ACTIVE_COSMOS_ID');
        if (!lastCosmosId) {
            console.log('[RealityManager] 📭 No previously active cosmos found. Triggering discovery for selector...');
            this.startDiscovery();
            return;
        }

        console.log(`[RealityManager] ⚡ Igniting continuity for: ${lastCosmosId}`);
        // Lanzamos el montaje (el método mountCosmos ya maneja el Instant-Mount de L2)
        return this.mountCosmos(lastCosmosId);
    }

    /**
     * DISCOVERY: Escanea realidades disponibles en el horizonte del backend.
     */
    async startDiscovery() {
        if (!this.dispatch) return;

        this.dispatch({ type: 'UPDATE_DISCOVERY_STATUS', payload: 'SCANNING' });
        try {
            const response = await contextClient.listAvailableCosmos(true);
            const artifacts = response.artifacts || [];

            this.dispatch({ type: 'SET_AVAILABLE_COSMOS', payload: artifacts });
            this.dispatch({ type: 'UPDATE_DISCOVERY_STATUS', payload: 'READY' });

            return artifacts;
        } catch (err) {
            console.error('[RealityManager] ❌ Discovery failed:', err);
            this.dispatch({ type: 'SET_AVAILABLE_COSMOS', payload: [] });
            this.dispatch({ type: 'UPDATE_DISCOVERY_STATUS', payload: 'ERROR' });
            throw err;
        }
    }

    /**
     * MOUNT: Orquestación de montaje de doble pulso (L2 + L8).
     */
    async mountCosmos(cosmosId) {
        if (!this.dispatch) return;

        useAxiomaticState.getState().setLoading(true);
        this.dispatch({ type: 'VAULT_LOADING' });

        try {
            // 1. Instant-Mount (L2 Cache)
            const localData = await AxiomaticDB.getItem(`COSMOS_STATE_${cosmosId}`);
            if (localData) {
                console.info(`%c [RealityManager] 💾 Pulse 1: Instant L2 Mount.`, "color: #a78bfa; font-weight: bold;");
                const reifiedLocal = compiler.compileCosmos(localData);
                this.dispatch({ type: 'COSMOS_MOUNTED', payload: reifiedLocal });
                // Liberamos UI temporalmente si hay caché
                useAxiomaticState.getState().setLoading(false);
                this.dispatch({ type: 'SET_CURRENT_LAYER', payload: null });
            }

            // 2. Pulse of Truth (L8 Backend)
            console.log(`[RealityManager] ☁️ Pulse 2: Fetching truth from backend...`);
            const cloudData = await contextClient.mountCosmos(cosmosId);

            if (!cloudData) throw new Error("Cosmos Data is empty or corrupted.");

            const finalId = cosmosId || cloudData.id || cloudData.ID;

            // Reconciliación de Timestamps (Axioma: El más nuevo gana)
            const cloudTime = cloudData.server_timestamp || (cloudData.last_modified ? new Date(cloudData.last_modified).getTime() : 0);
            const localTime = Math.max(
                localData?.server_timestamp || (localData?.last_modified ? new Date(localData.last_modified).getTime() : 0),
                localData?._localTimestamp || 0
            );

            let truthData;
            if (localData && localTime >= cloudTime) {
                console.info(`%c [RealityManager] ✅ Local cache is up-to-date.`, "color: #10b981; font-weight: bold;");
                truthData = localData;
            } else {
                console.info(`%c [RealityManager] ☁️ Cloud data is newer. Syncing...`, "color: #38bdf8; font-weight: bold;");
                truthData = cloudData;
                await AxiomaticDB.setItem(`COSMOS_STATE_${finalId}`, cloudData);
            }

            // 3. Reificación Final y Dispatch
            const compiledTruth = compiler.compileCosmos(truthData);
            this.dispatch({ type: 'COSMOS_MOUNTED', payload: compiledTruth });

            // 4. Asegurar PERSISTENCIA de Sesión
            useAxiomaticState.getState().setSessionAuthorized(finalId);
            localStorage.setItem('LAST_ACTIVE_COSMOS_ID', finalId);

            // 5. Cleanup
            useAxiomaticState.getState().setLoading(false);
            this.dispatch({ type: 'SET_CURRENT_LAYER', payload: null }); // Aseguramos estar en el graph

            // Hidratación de fondo
            persistenceManager.triggerBackgroundHydration(compiledTruth?.activeLayout, adapter);

            return compiledTruth;

        } catch (error) {
            console.error("[RealityManager] 🛑 Total Mount Failure:", error);

            // Si el error es 404, purgar rastro
            const isNotFound = error.message.includes("No se encontró") || error.message.includes("404");
            if (isNotFound) {
                localStorage.removeItem('LAST_ACTIVE_COSMOS_ID');
                await AxiomaticDB.deleteCosmos(`COSMOS_STATE_${cosmosId}`);
            }

            // Si no hay nada montado, devolvemos al selector
            const currentState = useAxiomaticState.getState();
            if (!currentState.isAuthorized) {
                this.dispatch({ type: 'CLEAR_COSMOS_SESSION' });
                this.dispatch({ type: 'SET_CURRENT_LAYER', payload: 'SELECTOR' });
            }

            useAxiomaticState.getState().setLoading(false);
            throw error;
        }
    }
}

export const realityManager = new RealityManager();
export default realityManager;
