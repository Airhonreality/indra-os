/**
 * KERNEL: src/core/kernel/ContextClient.js
 * DHARMA: Cliente de Exploración y Montaje de Contexto.
 * Responsabilidad: Hablar con el 'commander' (L8) y traer la realidad al Frontend.
 * AXIOMA: "El cliente es el observador; la interdicción es su filtro."
 */

import InterdictionUnit from '../state/InterdictionUnit';
import backendLogger from '../utils/BackendLogger';
import Validator_IO_node_Data from '../state/Infrastructure/Validator_IO_node_Data';

class ContextClient {
    constructor() {
        this.activeCosmosId = null;
        this.memoryCache = new Map(); // Short-term RAM
        this.pendingRequests = new Map(); // Request Deduplication Locks
        this.PERSISTENCE_KEY = 'INDRA_CORTEX_CACHE_V1';
        this._loadPersistence(); // Load Long-term Memory

        // AXIOMA: Cola de Sincronización (Background Sync)
        this.syncQueue = Promise.resolve();
        this.isSyncing = false;
        this.lastRevisionHash = null;

        // AXIOMA: Bloqueo de Instancia Única (IndraLock)
        try {
            this.lockChannel = new BroadcastChannel('INDRA_SATTVA_LOCK');

            // Solo responder si llevamos más de 2 segundos vivos (evita conflictos en refresh)
            const ignitionTime = Date.now();

            this.lockChannel.onmessage = (event) => {
                if (event.data.type === 'CHECK_ALIVE') {
                    if (Date.now() - ignitionTime > 2000) {
                        this.lockChannel.postMessage({ type: 'I_AM_ALIVE', timestamp: ignitionTime });
                    }
                } else if (event.data.type === 'I_AM_ALIVE') {
                    // Si recibimos esto y somos "jóvenes", es que hay un veterano ya activo
                    if (Date.now() - ignitionTime < 2000) {
                        console.error("🛑 [CRITICAL] Instance Conflict. Locking UI.");
                        window.dispatchEvent(new CustomEvent('INDRA_LOCKDOWN', { detail: { reason: 'MULTIPLE_TABS' } }));
                    }
                }
            };

            // Preguntar si hay alguien
            this.lockChannel.postMessage({ type: 'CHECK_ALIVE' });

            // Cleanup on page unload
            window.addEventListener('beforeunload', () => {
                this.lockChannel.close();
            });
        } catch (e) {
            console.warn("BroadcastChannel not supported. IndraLock disabled.");
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
            dispatch({ type: 'UPDATE_COSMOS_REGISTRY', payload: cachedCosmos });
        }

        // 2. Silent Update (L8 discovery)
        this.listAvailableCosmos(false).then(fresh => {
            dispatch({ type: 'UPDATE_COSMOS_REGISTRY', payload: fresh.artifacts || [] });
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

                // AXIOMA: Soberanía de Datos
                const scrubbing = Validator_IO_node_Data.scrub(response, 'listAvailableCosmos');
                const processed = backendLogger.processResponse(scrubbing, 'listAvailableCosmos');

                if (processed && processed.artifacts) {
                    this.memoryCache.set(cacheKey, processed.artifacts);
                    if (!includeAll) this.memoryCache.set('availableCosmos', processed.artifacts);
                    this._savePersistence();
                }

                return processed;
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
            // Verificar Cache L7 primero (Velocidad Reactor)
            const cached = localStorage.getItem(`INDRA_COSMOS_${cosmosId}`);
            if (cached) {
                const localData = JSON.parse(cached);
                this.activeCosmosId = cosmosId;
                this.lastRevisionHash = localData._local_hash || 'unknown'; // Hash local temporal
                console.log("⚡ [ContextClient] L7 Cache Hit. Instant Mount.");
                // Devolvemos caché instantáneo, pero seguimos con fetch en background (SWR)
                // TODO: Implementar SWR real. Por ahora, priorizamos la verdad del servidor para evitar desincronización
            }

            // BACKEND BLINDADO: Recibimos un Sobre, no el Payload directo
            const envelope = await InterdictionUnit.call('cosmos', 'mountCosmos', { cosmosId });

            // AXIOMA: Validación de Sobre (Envelope Integrity)
            if (!envelope || !envelope.payload) {
                // FALLBACK LEGACY (Por si el deploy falló parcialmente)
                if (envelope && envelope.nodes) {
                    console.warn("[ContextClient] ⚠️ Legacy Response detected.");
                    this.activeCosmosId = cosmosId;
                    return envelope;
                }
                throw new Error("Invalid Reality Envelope received.");
            }

            // Extracción y Cache de Integridad
            const payload = envelope.payload;
            this.lastRevisionHash = envelope.revision_hash; // Guardamos hash para el próximo save

            // Actualizar Cache L7 (Persistencia Local para próxima vez)
            try {
                // Guardamos hash local para validación futura
                payload._local_hash = envelope.revision_hash;
                localStorage.setItem(`INDRA_COSMOS_${cosmosId}`, JSON.stringify(payload));
            } catch (e) { console.warn("L7 Cache Full"); }

            // AXIOMA: Soberanía de Datos (Logging en consola backend simulada)
            const scrubbing = Validator_IO_node_Data.scrub(payload, 'mountCosmos');
            const processedResponse = backendLogger.processResponse(scrubbing, 'mountCosmos');

            if (processedResponse) {
                this.activeCosmosId = cosmosId;
                return processedResponse;
            } else {
                throw new Error("Empty payload in envelope.");
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

        // 1. Persistencia Local Inmediata (Fire & Forget UI)
        try {
            localStorage.setItem(`INDRA_COSMOS_${this.activeCosmosId}`, JSON.stringify(cosmos));
            console.log("✅ [ContextClient] Local Save Secured.");
        } catch (e) { console.warn("⚠️ [ContextClient] LocalStorage Full. Risk of data loss."); }

        // 2. Encolar Subida en Background (No bloquea la UI)
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
        try {
            const response = await InterdictionUnit.call('cosmos', 'deleteCosmos', { cosmosId });

            const scrubbing = Validator_IO_node_Data.scrub(response, 'deleteCosmos');
            return backendLogger.processResponse(scrubbing, 'deleteCosmos');
        } catch (error) {
            console.error(`🛑 [ContextClient] Delete failed: ${error.message}`);
            throw error;
        }
    }
}

export const contextClient = new ContextClient();
export default contextClient;
