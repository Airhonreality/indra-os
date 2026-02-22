/**
 * KERNEL: src/core/kernel/ContextClient.js
 * DHARMA: Cliente de Exploración y Montaje de Contexto.
 * Responsabilidad: Hablar con el 'commander' (L8) y traer la realidad al Frontend.
 * AXIOMA: "El cliente es el observador; la interdicción es su filtro."
 */

import { StateBridge } from '../1_Axiomatic_Store/StateBridge.js';
import InterdictionUnit from '../1_Axiomatic_Store/InterdictionUnit.js';
import backendLogger from '../utils/BackendLogger.js';
import AxiomaticDB from '../1_Axiomatic_Store/Infrastructure/AxiomaticDB.js';

class ContextClient {
    constructor() {
        this.activeCosmosId = null;
        this.memoryCache = new Map(); // Short-term RAM
        this.pendingRequests = new Map(); // Request Deduplication Locks
        this.PERSISTENCE_KEY = 'AXIOM_CORTEX_CACHE_V1';
        this._loadPersistence(); // Load Long-term Memory

        // AXIOMA: Cola de Sincronización (Background Sync)
        this.syncQueue = Promise.resolve();
        this.isSyncing = false;
        this.lastRevisionHash = null; // TODO: Migrar a last_modified (Fase Verde)

        // AXIOMA: Bloqueo de Instancia Única (AxiomLock)
        const instanceId = sessionStorage.getItem('AXIOM_INSTANCE_ID') || Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('AXIOM_INSTANCE_ID', instanceId);

        try {
            this.lockChannel = new BroadcastChannel('AXIOM_SATTVA_LOCK');

            // Solo responder si llevamos más de 2 segundos vivos (evita conflictos en refresh)
            const ignitionTime = Date.now();

            this.lockChannel.onmessage = (event) => {
                // AXIOMA: Ignorar ecos de nuestra propia instancia (Refrescos rápidos)
                if (event.data.instanceId === instanceId) return;

                if (event.data.type === 'CHECK_ALIVE') {
                    if (Date.now() - ignitionTime > 2000) {
                        this.lockChannel.postMessage({ type: 'I_AM_ALIVE', timestamp: ignitionTime, instanceId });
                    }
                } else if (event.data.type === 'I_AM_ALIVE') {
                    // Si recibimos esto de OTRA instancia y somos "jóvenes", es que hay un veterano ya activo
                    // AXIOMA V13: Relajamos el check en DEV para evitar falsos positivos por StrictMode
                    const isStrictDevDouble = (Date.now() - ignitionTime < 1000);

                    if (Date.now() - ignitionTime < 2000 && !isStrictDevDouble) {
                        console.error("🛑 [CRITICAL] Instance Conflict detected. Locking UI.");
                        window.dispatchEvent(new CustomEvent('AXIOM_LOCKDOWN', { detail: { reason: 'MULTIPLE_TABS' } }));
                    } else if (isStrictDevDouble) {
                        console.warn("⚠️ [ContextClient] StrictMode Double Init detected. Ignoring echo.");
                    }
                }
            };

            // Preguntar si hay alguien
            this.lockChannel.postMessage({ type: 'CHECK_ALIVE', instanceId });

            // Cleanup on page unload
            window.addEventListener('beforeunload', () => {
                this.lockChannel.close();
            });
        } catch (e) {
            console.warn("BroadcastChannel not supported. AxiomLock disabled.");
        }

        // AXIOMA: Compresión Nativa (CompressionStream)
        this.compressionEngine = {
            compress: async (jsonObj) => {
                try {
                    const stream = new Blob([JSON.stringify(jsonObj)]).stream();
                    const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
                    const response = new Response(compressedStream);
                    const blob = await response.blob();
                    // Convertir Blob GZIP a Base64
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const res = reader.result;
                            // DataURL format: "data:application/octet-stream;base64,....."
                            resolve(res.split(',')[1]);
                        };
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    console.warn("Compression failed, fallback to raw JSON.");
                    return null; // Fallback to raw
                }
            }
        };
    }

    _loadPersistence() {
        try {
            const saved = localStorage.getItem(this.PERSISTENCE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.keys(parsed).forEach(key => this.memoryCache.set(key, parsed[key]));
            }
        } catch (e) { console.warn("[ContextClient] Memory corruption detected. Resetting Cortex."); }
    }

    _savePersistence() {
        try {
            const serializable = Object.fromEntries(this.memoryCache);
            localStorage.setItem(this.PERSISTENCE_KEY, JSON.stringify(serializable));
        } catch (e) { /* Quota exceeded or private mode */ }
    }

    /**
     * IGNITION REFLEX: Autonomic Homeostasis
     */
    async igniteReflexes(dispatch) {
        console.log("🧠 [Cortex] Igniting Autonomic Reflexes...");

        // 1. Immediate Recall
        const cachedCosmos = this.memoryCache.get('availableCosmos');
        if (cachedCosmos) {
            dispatch({ type: 'SET_AVAILABLE_COSMOS', payload: cachedCosmos });
        }

        // 2. Silent Update (L8 discovery)
        this.listAvailableCosmos(false).then(fresh => {
            dispatch({ type: 'SET_AVAILABLE_COSMOS', payload: fresh.artifacts || [] });
        }).catch(e => console.warn("[Cortex] Reflex fizzled:", e));
    }

    /**
     * Lista los universos vía commander (L8).
     */
    async listAvailableCosmos(includeAll = false) {
        const cacheKey = `availableCosmos_${includeAll}`;

        if (this.pendingRequests.has(cacheKey)) return this.pendingRequests.get(cacheKey);

        const requestPromise = (async () => {
            try {
                const response = await InterdictionUnit.call('cosmos', 'listAvailableCosmos', { includeAll });

                if (response && response.artifacts) {
                    this.memoryCache.set(cacheKey, response.artifacts);
                    if (!includeAll) this.memoryCache.set('availableCosmos', response.artifacts);
                    this._savePersistence();
                }

                return response;
            } catch (error) {
                console.error(`🛑 [Cortex] Synapse Failed: ${error.message}`);
                throw error;
            } finally {
                this.pendingRequests.delete(cacheKey);
            }
        })();

        this.pendingRequests.set(cacheKey, requestPromise);
        return requestPromise;
    }

    /**
     * Monta un Cosmos (Soporta Legacy y Envelope).
     */
    async mountCosmos(cosmosId) {
        if (!cosmosId) throw new Error("[ContextClient] cosmosId is required to mount.");

        try {
            // Fetch directo al backend — IndexedDB (L2) maneja la caché local
            const data = await InterdictionUnit.call('cosmos', 'mountCosmos', { cosmosId });

            if (data) {
                this.activeCosmosId = cosmosId;
                return data;
            } else {
                throw new Error("Materia Incoherente: No se detectó esencia de Cosmos en la respuesta.");
            }
        } catch (error) {
            console.error(`🛑 [ContextClient] Failed to mount: ${error.message}`);
            throw error;
        }
    }

    /**
     * Guarda un Cosmos (Optimistic UI + Background Sync + Compression).
     */
    async saveCosmos(cosmos) {
        if (!cosmos) throw new Error("[ContextClient] Invalid cosmos object");

        // Encolar subida al backend (IndexedDB maneja persistencia local)
        return this._enqueueUpload(cosmos);
    }

    /**
     * Cola de Subida Serializada (Privado)
     */
    async _enqueueUpload(cosmos) {
        // Encadenamos a la promesa anterior para garantizar orden (Serial Queue)
        this.syncQueue = this.syncQueue.then(async () => {
            this.isSyncing = true;
            try {
                console.log("📡 [ContextClient] Compressing & Uploading...");

                // Compresión GZIP en Cliente (Reactor a Madera)
                const base64Content = await this.compressionEngine.compress(cosmos);

                const response = await InterdictionUnit.call('cosmos', 'saveCosmos', {
                    cosmosId: this.activeCosmosId, // Enviamos ID explícito por si acaso
                    content_base64: base64Content, // NUEVO: Payload Comprimido
                    revisionHash: this.lastRevisionHash || 'force'
                });

                if (response && response.success && response.new_revision_hash) {
                    this.lastRevisionHash = response.new_revision_hash;
                    console.log(`✅ [ContextClient] Cloud Sync Complete. Hash: ${response.new_revision_hash.substr(0, 8)}`);
                }

                return response;
            } catch (error) {
                console.error(`🛑 [ContextClient] Background Sync Failed: ${error.message}`);
                // Aquí podríamos implementar Retry con backoff
                // O notificar a la UI: "Cambios guardados localmente pero pendientes de nube"
                return { success: false, local_saved: true, error: error.message };
            } finally {
                this.isSyncing = false;
            }
        });

        // Retornamos éxito optimista inmediato (La promesa real corre en fondo)
        return { success: true, optimistic: true };
    }

    /**
     * Elimina un Cosmos vía Gateway Público.
     */
    async deleteCosmos(cosmosId) {
        // 1. Optimistic Update (FAT CLIENT)
        // Eliminamos de la memoria inmediatamente
        const currentList = this.memoryCache.get('availableCosmos') || [];
        const optimisticList = currentList.filter(c => c.id !== cosmosId);
        this.memoryCache.set('availableCosmos', optimisticList);
        this._savePersistence();

        // 2. Deep Clean (L7 + Iron Memory + Session)
        // Eliminamos todo rastro local para evitar resurrección zombie.
        try {
            console.log(`🗑️ [ContextClient] Deep Cleaning: ${cosmosId}`);
            await AxiomaticDB.deleteCosmos(`COSMOS_STATE_${cosmosId}`);

            // Si era el cosmos activo por defecto, lo olvidamos
            if (localStorage.getItem('LAST_ACTIVE_COSMOS_ID') === cosmosId) {
                localStorage.removeItem('LAST_ACTIVE_COSMOS_ID');
                // Si la sesión está activa en este cosmos, la matamos
                const stateSnapshot = StateBridge.getState();
                if (stateSnapshot && typeof stateSnapshot.dispatch === 'function') {
                    stateSnapshot.dispatch({ type: 'CLEAR_COSMOS_SESSION' });
                }
            }
        } catch (e) {
            console.warn("[ContextClient] Deep Clean partial failure:", e);
        }

        try {
            const response = await InterdictionUnit.call('cosmos', 'deleteCosmos', { cosmosId });
            return response;
        } catch (error) {
            console.error(`🛑 [ContextClient] Delete failed: ${error.message}`);
            // Rollback (Opcional, por ahora confiamos en el reload si falla)
            throw error;
        }
    }
}

export const contextClient = new ContextClient();
export default contextClient;




