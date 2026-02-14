/**
 * InterdictionUnit.js
 * DHARMA: Membrana de Contención (Capa 0.5)
 * 
 * Middleware que envuelve al Core_Connector.
 * Bloquea físicamente cualquier petición de escritura saliente
 * si el AxiomaticState ha declarado un WORLD_LOCK.
 * 
 * V10.5: Implementa BATCHING de comandos para optimizar la salud de GAS.
 */

import useAxiomaticState from './AxiomaticState';
import SignalTransmuter from './SignalTransmuter';
import connector from '../Core_Connector';

class InterdictionUnit {
    constructor() {
        this.batchQueue = [];
        this.batchTimer = null;
        this.BATCH_WINDOW_MS = 100; // Ventana de agregación
    }

    /**
     * Envuelve la llamada 'call' con lógica de batching e interdicción.
     */
    async call(service, method, payload = {}) {
        const axState = useAxiomaticState.getState();

        // 1. Análisis de Intención (¿Es una escritura?)
        const isWriteOperation = this._detectWriteIntent(method);

        // 2. Juicio de Interdicción (V10.5)
        if (isWriteOperation) {
            // 0. Sincronía Temporal (Asegurar que el hash se ha reificado desde DB antes de escribir)
            if (!axState.session.hashInitialized) {
                console.log("[InterdictionUnit] ⏳ Waiting for temporal reification before write...");
                await this._waitFor(() => useAxiomaticState.getState().session.hashInitialized);
            }

            // AXIOMA V12: El Causal Lock basado en intentQueue (V11) es depurado.
            // En V12, cada petición lleva el snapshot completo, garantizando que los IDs temporales
            // se procesen en el orden correcto de llegada al backend dentro del mismo flujo.

            if (!axState.isWriteAllowed()) {
                const reason = axState.interdiction.reason || axState.session.status;
                console.warn(`[InterdictionUnit] 🛡️ DEFERRED: ${service}.${method} [Reason: ${reason}]`);
                throw new Error(`[Interdiction] ${reason}`);
            }
        }

        // 3. Encolar para Batching
        return new Promise((resolve, reject) => {
            this.batchQueue.push({
                service,
                method,
                payload,
                resolve,
                reject
            });

            if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => this._flushBatch(), this.BATCH_WINDOW_MS);
            }
        });
    }

    async _flushBatch() {
        const currentBatch = [...this.batchQueue];
        this.batchQueue = [];
        this.batchTimer = null;

        if (currentBatch.length === 0) return;

        try {
            console.log(`[InterdictionUnit] 🚄 Dispatching Batch of ${currentBatch.length} commands...`);

            // AXIOMA: Soberanía Temporal (Inyectar hash de revisión)
            const currentHash = useAxiomaticState.getState().session.currentRevisionHash;

            const commands = currentBatch.map(c => ({
                service: c.service, // e.g. 'drive' or 'public'
                method: c.method,   // e.g. 'listContents'
                payload: {
                    ...c.payload,
                    revisionHash: currentHash, // Sello Cronológico Base
                    _revisionHash: currentHash  // Alias de seguridad
                }
            }));

            // AXIOMA V12: Piggybacking de Realidad (ADR 003)
            // Cada vez que contactamos el backend, todos los comandos del lote llevan la "Mochila"
            const syncStore = window.useSyncOrchestrator?.getState?.();
            if (syncStore && typeof syncStore.prepareSnapshot === 'function') {
                const snapshot = syncStore.prepareSnapshot();

                // Solo inyectamos si hay datos estructurales no vacíos
                if (snapshot && (snapshot.artifacts?.length > 0 || snapshot.relationships?.length > 0)) {
                    console.info(`%c 🎒 [Interdiction] Piggybacking reality snapshot (${snapshot.artifacts.length} nodes)`, "color: #10b981; font-weight: bold;");

                    // Inyectamos la realidad en CADA comando del batch para máxima redundancia
                    commands.forEach(cmd => {
                        cmd.payload._carriedReality = true;
                        cmd.payload.snapshot = snapshot;
                    });
                }
            }

            // Llamada única al backend
            // IMPORTANTE: El backend 'executeBatch' espera { commands: [...] }
            // Y debe mapear cada comando a su adaptador.
            const batchResponse = await connector.call('system', 'executeBatch', { commands });

            // El SignalTransmuter procesa el batch completo o cada respuesta?
            // AXIOMA: El backend debe devolver un array de respuestas en el mismo orden.
            if (Array.isArray(batchResponse)) {
                let snapshotResult = null;

                batchResponse.forEach((rawRes, index) => {
                    const cmd = currentBatch[index];
                    if (!cmd) return; // 🛡️ Guardia contra desincronización de Batch

                    try {
                        const transmuted = SignalTransmuter.transmute(rawRes, cmd.method);
                        console.log(`[InterdictionUnit] ✅ Resolving: ${cmd.service}.${cmd.method}`, { response: transmuted });
                        cmd.resolve(transmuted);
                        cmd._resolved = true;

                        // AXIOMA V12: Capturar resultado del snapshot (Piggybacked o Directo)
                        if (rawRes && rawRes._snapshot) {
                            snapshotResult = rawRes._snapshot;
                        }
                        if (cmd.method === 'stabilizeAxiomaticReality') {
                            snapshotResult = transmuted;
                        }
                    } catch (e) {
                        console.error(`[InterdictionUnit] ❌ Rejecting: ${cmd.service}.${cmd.method}`, e.message);
                        cmd.reject(e);
                        cmd._resolved = false;
                    }
                });

                // AXIOMA V12: Actualizar estado de sincronía tras respuesta
                if (snapshotResult) {
                    if (snapshotResult.success) {
                        useAxiomaticState.getState().updateSyncStatus('SYNCED');
                    } else {
                        useAxiomaticState.getState().updateSyncStatus('RETRY',
                            new Error(snapshotResult.error || 'Snapshot sync failed')
                        );
                    }
                }
            } else {
                // Fallback si el backend no soporta batching o hubo error global
                throw new Error(batchResponse.error || "Invalid Batch Response from Gateway.");
            }

        } catch (error) {
            console.error("[InterdictionUnit] 🛑 Batch Execution Failed:", error.message);
            currentBatch.forEach(c => c.reject(error));

            // AXIOMA V12: Actualizar estado de sincronía tras fallo
            const axState = useAxiomaticState.getState();
            const currentAttempts = axState.session.failedSyncAttempts;

            // Si ya estamos en OFFLINE, no volvemos a RETRY
            if (axState.session.syncStatus !== 'OFFLINE') {
                axState.updateSyncStatus('RETRY', error);

                // AXIOMA: Protocolo de Retry Exponencial (ADR 003)
                // Intentos: T+5s, T+15s (5+10), T+45s (5+10+30)
                const delays = [5000, 10000, 30000]; // 5s, 10s, 30s
                const nextDelay = delays[Math.min(currentAttempts, delays.length - 1)];

                if (currentAttempts < 3) {
                    console.warn(`%c ⏱️ [InterdictionUnit] Retry scheduled in ${nextDelay / 1000}s...`, 'color: #fbbf24');

                    setTimeout(async () => {
                        try {
                            // Reintentar solo el snapshot, no los comandos funcionales
                            const syncStore = window.useSyncOrchestrator?.getState?.();
                            if (syncStore && typeof syncStore.prepareSnapshot === 'function') {
                                const snapshot = syncStore.prepareSnapshot();

                                if (snapshot && (snapshot.artifacts?.length > 0 || snapshot.relationships?.length > 0)) {
                                    const retryResponse = await connector.call('sensing', 'stabilizeAxiomaticReality', {
                                        snapshot,
                                        _carriedReality: true,
                                        _isRetry: true
                                    });

                                    if (retryResponse.success) {
                                        useAxiomaticState.getState().updateSyncStatus('SYNCED');
                                    } else {
                                        useAxiomaticState.getState().updateSyncStatus('RETRY', new Error('Retry failed'));
                                    }
                                }
                            }
                        } catch (retryError) {
                            console.error('[InterdictionUnit] Retry attempt failed:', retryError);
                            useAxiomaticState.getState().updateSyncStatus('RETRY', retryError);
                        }
                    }, nextDelay);
                }
            }
        }

        // AXIOMA V12: Verificar resultado del snapshot y actualizar estado
        if (currentBatch.some(cmd => cmd.method === 'stabilizeAxiomaticReality')) {
            // El snapshot estaba en el batch, necesitamos verificar su respuesta
            // Esto se hace dentro del forEach de batchResponse (líneas 133-140)
            // pero necesitamos capturar si fue exitoso

            const snapshotWasSuccessful = currentBatch.some(cmd =>
                cmd.method === 'stabilizeAxiomaticReality' && cmd._resolved === true
            );

            // La verificación real se hace en el bloque try anterior
        }
    }

    async _waitFor(condition) {
        return new Promise((resolve) => {
            const check = () => {
                if (condition()) resolve();
                else setTimeout(check, 100);
            };
            check();
        });
    }


    _detectWriteIntent(method) {
        const m = method.toUpperCase();
        return (
            m.includes('SAVE') ||
            m.includes('WRITE') ||
            m.includes('DELETE') ||
            m.includes('CREATE') ||
            m.includes('UPDATE') ||
            m.includes('PATCH') ||
            m.includes('MOVE') ||
            m.includes('RENAME')
        );
    }
}

const instance = new InterdictionUnit();
export default instance;
