/**
 * PersistenceManager.jsx
 * 
 * Gestor de persistencia axiomática para el AxiomaticStore.
 * Mapea los PERSISTENCE_CONTRACT de los adapters al flow_state del Cosmos.
 * 
 * V10.5: Migración a AxiomaticDB (IndexedDB) para carga pesada.
 */

import AxiomaticDB from './Infrastructure/AxiomaticDB';

class PersistenceManager {
    constructor() {
        this.contracts = new Map(); // adapterId -> PERSISTENCE_CONTRACT
        this.metadataCache = new Map(); // cacheKey -> { timestamp, size }
        this.storageKey = 'INDRA_PERSISTENCE_METADATA';

        // AXIOMA: Cargar metadatos ligeros al iniciar
        this._loadMetadata();

        // AXIOMA: Registro de Contratos Canónicos (Fallback de Emergencia)
        this._registerDefaultContracts();
    }

    _registerDefaultContracts() {
        const standardVaultContract = {
            'vault_tree_ROOT': { hydrate: true, scope: 'COSMOS', ttl: 3600, compute: 'EAGER' },
            'metadata': { hydrate: true, scope: 'COSMOS', ttl: 3600, compute: 'EAGER' }
        };

        this.registerContract('drive', standardVaultContract);
        this.registerContract('notion', standardVaultContract);
    }

    registerContract(adapterId, contract) {
        if (!contract || typeof contract !== 'object') return;
        this.contracts.set(adapterId, contract);
        console.log(`[PersistenceManager] ✅ Registered contract for ${adapterId}`);
    }

    async hydrate(flowState, adapter) {
        const hydratedData = {};
        const now = Date.now();

        for (const [adapterId, contract] of this.contracts.entries()) {
            hydratedData[adapterId] = {};

            for (const [dataKey, config] of Object.entries(contract)) {
                if (!config.hydrate) continue;

                const cacheKey = `${adapterId}.${dataKey}`;
                const persistedData = flowState?.persistence?.[adapterId]?.[dataKey];

                // L2 Check (AxiomaticDB)
                let sourceData = persistedData;
                if (!sourceData) {
                    const cached = await AxiomaticDB.getItem(cacheKey);
                    if (cached) sourceData = cached;
                }

                if (sourceData && sourceData.timestamp) {
                    const age = (now - new Date(sourceData.timestamp).getTime()) / 1000;
                    if (age < config.ttl) {
                        hydratedData[adapterId][dataKey] = sourceData.data;
                        console.log(`[PersistenceManager] ✅ Hydrated ${cacheKey} from ${persistedData ? 'COSMOS' : 'L2_DB'}`);
                        continue;
                    }
                }

                try {
                    console.log(`[PersistenceManager] 🔄 Fetching fresh data for ${cacheKey}...`);
                    const freshData = await this._fetchData(adapterId, dataKey, adapter);
                    hydratedData[adapterId][dataKey] = freshData;
                    await this.saveLocal(cacheKey, freshData);
                } catch (error) {
                    console.error(`[PersistenceManager] ❌ Failed to fetch ${cacheKey}:`, error);
                }
            }
        }
        return hydratedData;
    }

    async saveLocal(cacheKey, data) {
        const entry = {
            data,
            timestamp: new Date().toISOString()
        };

        // 1. Guardar carga pesada en IndexedDB
        await AxiomaticDB.setItem(cacheKey, entry);

        // 2. Guardar metadatos en localStorage
        this.metadataCache.set(cacheKey, { timestamp: entry.timestamp });
        this._saveMetadata();
    }

    updateFlowState(adapterId, dataKey, data) {
        const contract = this.contracts.get(adapterId);
        if (!contract || !contract[dataKey] || contract[dataKey].scope !== 'COSMOS') return null;

        const cacheKey = `${adapterId}.${dataKey}`;
        const persistenceEntry = {
            data,
            timestamp: new Date().toISOString()
        };

        // El guardado en DB es async, pero devolvemos el entry para el dispatch inmediato
        this.saveLocal(cacheKey, data);

        return {
            adapterId,
            dataKey,
            entry: persistenceEntry
        };
    }

    isCacheValid(adapterId, dataKey) {
        const contract = this.contracts.get(adapterId);

        // Si no hay contrato, permitimos un TTL por defecto de 1 hora para árboles de vault
        if (!contract || !contract[dataKey]) {
            if (dataKey.startsWith('vault_tree_')) {
                const meta = this.metadataCache.get(`${adapterId}.${dataKey}`);
                if (!meta) return false;
                const age = (Date.now() - new Date(meta.timestamp).getTime()) / 1000;
                return age < 3600;
            }
            return false;
        }

        const cacheKey = `${adapterId}.${dataKey}`;
        const meta = this.metadataCache.get(cacheKey);
        if (!meta) return false;

        const age = (Date.now() - new Date(meta.timestamp).getTime()) / 1000;
        return age < contract[dataKey].ttl;
    }

    async getCached(adapterId, dataKey) {
        const cacheKey = `${adapterId}.${dataKey}`;
        const entry = await AxiomaticDB.getItem(cacheKey);
        return entry ? entry.data : null;
    }

    async clearCache(adapterId = null) {
        if (adapterId) {
            for (const key of this.metadataCache.keys()) {
                if (key.startsWith(`${adapterId}.`)) {
                    this.metadataCache.delete(key);
                    await AxiomaticDB.deleteCosmos(key); // Asumimos deleteCosmos es genérico
                }
            }
        } else {
            this.metadataCache.clear();
            await AxiomaticDB.purge();
        }
        this._saveMetadata();
    }

    async fetchContent(adapterId, params, adapter) {
        const { folderId = 'ROOT', query } = params;
        const cacheKey = query ? null : `${adapterId}.vault_tree_${folderId}`;
        const forceRefresh = params.forceRefresh || params.refresh;

        if (cacheKey && this.isCacheValid(adapterId, `vault_tree_${folderId}`) && !forceRefresh) {
            const cached = await this.getCached(adapterId, `vault_tree_${folderId}`);
            if (cached) {
                console.log(`[PersistenceManager] ⚡ DB Hit for ${cacheKey}`);
                return { items: cached, fromCache: true };
            }
        }

        try {
            // AXIOMA: Soberanía de Ejecución (V12)
            // No llamamos funciones globales. Usamos el pipeline 'system:executeAction'.

            // 1. Construir Payload Seguro
            const safeAccountId = params.accountId || null; // AXIOMA: Identidad Dinámica (Soberanía Absoluta)

            const actionPayload = {
                folderId,
                query,
                accountId: safeAccountId,
                forceRefresh
            };

            // 2. Ejecutar Acción Soberana
            const rawResult = await adapter.executeAction(`${adapterId}:listContents`, actionPayload);

            if (rawResult && rawResult.error) {
                throw new Error(`[${rawResult.error_code || 'UNKNOWN'}] ${rawResult.error}`);
            }

            const data = Array.isArray(rawResult)
                ? rawResult
                : (rawResult?.results || rawResult?.items || rawResult?.artifacts || rawResult?.result || []);

            const metadata = rawResult?.metadata || { hydrationLevel: 100, total: data ? data.length : 0 };

            if (cacheKey && data) {
                await this.saveLocal(cacheKey, data);
            }

            // AXIOMA: Preservación de Origen (ISR Compliance)
            return typeof rawResult === 'object' && !Array.isArray(rawResult)
                ? { ...rawResult, items: data || [], metadata }
                : { items: data || [], metadata };
        } catch (error) {
            console.error(`[PersistenceManager] ❌ Signal Lost for ${adapterId}:`, error);
            // AXIOMA: Honestidad Brutal. Si falla, el UI debe saberlo para mostrar el estado de error/reintento.
            throw error;
        }
    }

    async _fetchData(adapterId, dataKey, adapter) {
        let params = { folderId: 'ROOT' };
        if (dataKey.startsWith('vault_tree_')) {
            params.folderId = dataKey.replace('vault_tree_', '');
        }
        const result = await this.fetchContent(adapterId, params, adapter);
        return result.items;
    }

    async triggerBackgroundHydration(activeLayout, adapter, onComplete) {
        console.log('[PersistenceManager] 🧠 Background Hydration sequence initiated...');
        const activeAdapters = activeLayout?.adapters || [];
        const promises = [];

        try {
            for (const [adapterId, contract] of this.contracts.entries()) {
                const isVisible = activeAdapters.includes(adapterId);
                for (const [dataKey, config] of Object.entries(contract)) {
                    if (config.compute === 'EAGER' || (isVisible && config.hydrate)) {
                        if (!this.isCacheValid(adapterId, dataKey)) {
                            promises.push(this._fetchData(adapterId, dataKey, adapter).then(data => this.saveLocal(`${adapterId}.${dataKey}`, data)));
                        }
                    }
                }
            }
            if (promises.length > 0) await Promise.all(promises);
        } catch (error) {
            console.error('[PersistenceManager] ⚠️ Hydration sweep interrupted:', error);
        } finally {
            if (onComplete) onComplete();
        }
    }

    _loadMetadata() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                for (const [key, val] of Object.entries(parsed)) {
                    this.metadataCache.set(key, val);
                }
            }
        } catch (e) { console.warn('[PersistenceManager] Meta-error:', e); }
    }

    _saveMetadata() {
        try {
            const obj = Object.fromEntries(this.metadataCache);
            localStorage.setItem(this.storageKey, JSON.stringify(obj));
        } catch (e) { console.warn('[PersistenceManager] Meta-save fail:', e); }
    }

    /**
     * ADR-012: Identity Reconciliation Protocol
     * Fase 5: Persistencia y Entropía (TGS)
     * 
     * Reconcilia el estado entre Frontend (IndexedDB) y Backend (Drive).
     * Aplica higiene de datos ANTES de que lleguen al Store.
     * 
     * @param {Object} localState - Estado cargado desde IndexedDB
     * @param {Object} backendState - Estado cargado desde Drive (o null si falló)
     * @returns {Object} - Estado reconciliado y sanitizado
     */
    async reconcileCosmosState(localState, backendState = null) {
        console.log('🚀 [DEBUG] reconcileCosmosState CALLED', {
            hasLocal: !!localState,
            hasBackend: !!backendState,
            localArtifactsCount: localState?.artifacts?.length || 0
        });

        console.group('🔬 [ADR-012] Reconciliation Protocol');

        // 1. Determinar la Verdad (Timestamp Comparison)
        let truthState = localState;
        let truthSource = 'LOCAL';

        if (backendState) {
            const localTimestamp = new Date(localState?.last_modified || localState?._timestamp || 0).getTime();
            const backendTimestamp = new Date(backendState?.last_modified || backendState?._timestamp || 0).getTime();

            console.log(`📅 Local timestamp: ${new Date(localTimestamp).toISOString()}`);
            console.log(`📅 Backend timestamp: ${new Date(backendTimestamp).toISOString()}`);

            if (backendTimestamp > localTimestamp) {
                truthState = backendState;
                truthSource = 'BACKEND';
                console.log('✅ Backend is newer, using backend state');
            } else {
                console.log('✅ Local is newer or equal, using local state');
            }
        } else {
            console.log('⚠️ Backend unavailable, using local state');
        }

        // 2. Estado de Higiene (Middleware de Limpieza)
        const sanitizedState = this._sanitizeCosmosState(truthState);

        // 3. Sincronización Bidireccional
        if (truthSource === 'LOCAL' && backendState === null) {
            console.log('🔄 Backend unavailable, state will sync on next connection');
            // TODO: Marcar para sincronización diferida cuando el backend vuelva
        } else if (truthSource === 'LOCAL' && backendState) {
            console.log('📤 Local is newer, should upload to backend');
            // TODO: Trigger background upload
        }

        console.log(`✅ Reconciliation complete. Truth source: ${truthSource}`);
        console.groupEnd();

        return sanitizedState;
    }

    /**
     * Middleware de Higiene de Datos (Data Sanitization)
     * Aplica las siguientes transformaciones:
     * 1. Deduplicación de artefactos por ID
     * 2. Normalización de capabilities (QUERY FILTER → QUERY_FILTER)
     * 3. Filtrado de zombies (_isDeleted: true)
     */
    _sanitizeCosmosState(state) {
        if (!state) return state;

        console.group('🧹 [Hygiene] State Sanitization');

        const sanitized = { ...state };

        // 1. Deduplicación de Artefactos
        if (Array.isArray(sanitized.artifacts)) {
            const beforeCount = sanitized.artifacts.length;

            // Filtrar zombies
            const alive = sanitized.artifacts.filter(art => !art._isDeleted);

            // Deduplicar por ID (Map mantiene el último encontrado)
            const dedupedMap = new Map();
            alive.forEach(art => {
                dedupedMap.set(art.id, art);
            });

            sanitized.artifacts = Array.from(dedupedMap.values());

            const afterCount = sanitized.artifacts.length;
            if (beforeCount !== afterCount) {
                console.warn(`⚠️ Removed ${beforeCount - afterCount} duplicate/zombie artifacts`);
            } else {
                console.log('✅ Artifacts array is clean (no duplicates)');
            }

            // 2. Normalización de Capabilities
            sanitized.artifacts = sanitized.artifacts.map(art => {
                if (!art.CAPABILITIES) return art;

                const normalizedCaps = { ...art.CAPABILITIES };

                // Normalizar QUERY_FILTER
                const filterKey = Object.keys(normalizedCaps).find(
                    k => k.replace(/_/g, ' ').trim().toUpperCase() === 'QUERY FILTER'
                );

                if (filterKey && filterKey !== 'QUERY_FILTER') {
                    normalizedCaps.QUERY_FILTER = normalizedCaps[filterKey];
                    delete normalizedCaps[filterKey];
                    console.log(`🔧 Normalized '${filterKey}' → 'QUERY_FILTER' for artifact ${art.id}`);
                }

                // Normalizar capabilities dentro de data (coherencia)
                const normalizedArt = {
                    ...art,
                    CAPABILITIES: normalizedCaps
                };

                if (art.data && typeof art.data === 'object') {
                    normalizedArt.data = {
                        ...art.data,
                        CAPABILITIES: normalizedCaps
                    };
                }

                return normalizedArt;
            });
        }

        // 3. Limpieza de Relaciones Huérfanas
        if (Array.isArray(sanitized.relationships)) {
            const artifactIds = new Set(sanitized.artifacts?.map(a => a.id) || []);
            const beforeRelCount = sanitized.relationships.length;

            sanitized.relationships = sanitized.relationships.filter(rel =>
                !rel._isDeleted &&
                artifactIds.has(rel.source) &&
                artifactIds.has(rel.target)
            );

            const afterRelCount = sanitized.relationships.length;
            if (beforeRelCount !== afterRelCount) {
                console.warn(`⚠️ Removed ${beforeRelCount - afterRelCount} orphaned/zombie relationships`);
            }
        }

        console.log('✅ State sanitization complete');
        console.groupEnd();

        return sanitized;
    }
}

const instance = new PersistenceManager();
export default instance;



