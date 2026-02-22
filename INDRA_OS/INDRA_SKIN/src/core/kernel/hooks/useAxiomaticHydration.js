/**
 * useAxiomaticHydration.js
 * 
 * DHARMA: Garantizar la soberanía del dato en el cliente (Fat Client).
 * Automatiza la recuperación de L2 (Caché) e Ignición (Fetch) de manera agnóstica para todos los engines.
 * 
 * V11.0: Abstracción de lógica de hidratación centralizada.
 */
import { useEffect, useRef } from 'react';
import { useAxiomaticStore } from '../../1_Axiomatic_Store/AxiomaticStore.jsx';
import useAxiomaticState from '../../1_Axiomatic_Store/AxiomaticState.js';
import persistenceManager from '../../1_Axiomatic_Store/PersistenceManager.jsx';

export const useAxiomaticHydration = (nodeId, options = {}) => {
    const { execute, state } = useAxiomaticStore();
    const globalLoading = useAxiomaticState(s => s.session.isLoading);

    const {
        activeAccount = null,
        bypassCondition = false,
        fetchAction = 'FETCH_VAULT_CONTENT',
        fetchPayload = { folderId: 'ROOT' },
        cacheKey = null, // Si es null, se genera a partir de nodeId
        onHydrated = null,
        autoIgnite = true
    } = options;

    const finalCacheKey = cacheKey || `vault_tree_${fetchPayload.folderId || 'ROOT'}`;
    const ignitionRef = useRef(new Set());

    // AXIOMA: Normalización de Silo (Envelope Safety)
    // El silo puede ser un array directo O un envoltorio { items: [...], SCHEMA: {...} }.
    // Siempre normalizamos a un conteo real para evitar que .length devuelva undefined.
    const siloRaw = state.phenotype.silos?.[nodeId];
    const siloItems = siloRaw?.items || (Array.isArray(siloRaw) ? siloRaw : []);
    const siloData = siloItems; // Array normalizado para compatibilidad hacia abajo
    const siloCount = siloItems.length;

    // 1. AXIOMA: Recuperación de caché instantánea (Optimistic Recall)
    useEffect(() => {
        const tryCacheRecall = async () => {
            if (bypassCondition || !nodeId) return;

            // Verificamos si la caché es válida para este nodo y clave
            if (persistenceManager.isCacheValid(nodeId, finalCacheKey)) {
                const cached = await persistenceManager.getCached(nodeId, finalCacheKey);

                // Solo inyectamos si el silo actual está vacío para evitar sobrescribir data fresca
                if (cached && siloCount === 0) {
                    console.info(`%c⚛️ [Hydration:${nodeId}] Optimistic recall from L2 Repository`, 'color: #10b981; font-weight: bold;');

                    const items = cached.items || (Array.isArray(cached) ? cached : []);
                    const metadata = cached.metadata || { hydrationLevel: 100, source: 'CACHE' };

                    // Usamos un nombre de acción genérico para éxito de carga
                    execute('VAULT_LOAD_SUCCESS', {
                        nodeId,
                        data: {
                            ...((typeof cached === 'object' && !Array.isArray(cached)) ? cached : {}),
                            items,
                            metadata
                        }
                    });

                    if (onHydrated) onHydrated(items);
                }
            }
        };
        tryCacheRecall();
    }, [nodeId, bypassCondition, finalCacheKey]);

    // 2. AXIOMA: Ignición Automática (Self-Healing / Discovery)
    useEffect(() => {
        if (bypassCondition || !nodeId || !autoIgnite) return;

        // Disparamos ignición si:
        // 1. El silo está vacío (o es intencionalmente nulo)
        // 2. No estamos ya en un proceso de carga global
        // 3. El circuit breaker no ha bloqueado este nodeId en el ciclo actual
        if (siloCount === 0 && !globalLoading && !ignitionRef.current.has(nodeId)) {
            console.log(`%c🚀 [Hydration:${nodeId}] Silo empty. Triggering Ignition Protocol...`, 'color: #fbbf24; font-weight: bold;');

            ignitionRef.current.add(nodeId);

            // Construimos el payload de ejecución
            const payload = {
                nodeId,
                accountId: activeAccount,
                ...fetchPayload
            };

            execute(fetchAction, payload);
        }
    }, [nodeId, siloCount, globalLoading, bypassCondition, fetchAction, activeAccount]);

    return {
        siloData,
        siloCount,
        // isScanning: SOLO cuando no hay datos Y estamos cargando (primera carga, pantalla en blanco)
        isScanning: globalLoading && siloCount === 0,
        // isRefreshing: cuando hay datos pero está actualizando en background (fat client re-fetch)
        isRefreshing: globalLoading && siloCount > 0,
        hasData: siloData.length > 0
    };
};

