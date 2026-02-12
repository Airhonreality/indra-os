import React, { createContext, useContext, useReducer, useEffect } from 'react';
import adapter from '../Sovereign_Adapter';
import { contextClient } from '../kernel/ContextClient';
import { MOCK_GENOTYPE, MOCK_VAULT_DATA } from '../kernel/projections/mocks/MockFactory';
import persistenceManager from './PersistenceManager';
import { ProjectionKernel } from '../kernel/isk/ProjectionKernel';
import synapticDispatcher from '../kernel/SynapticDispatcher';
import compiler from '../laws/Law_Compiler';
import AxiomaticContext from './AxiomaticStore.Context';

// AXIOMA: Fragmentación por Lóbulos de Estado (V10.5 -> V12 Snapshot Purge)
import { interfaceReducer, initialInterfaceState } from './lobes/InterfaceLobe';
import { dataReducer, initialDataState } from './lobes/DataLobe';

import usageTracker from './UsageTracker';
import useAxiomaticState from './AxiomaticState'; // NEW MEMBRANE AUTHORITY

import useSyncOrchestrator from './SyncOrchestrator';
import Validator_IO_node_Data from './Infrastructure/Validator_IO_node_Data';
import AxiomaticDB from './Infrastructure/AxiomaticDB';

// ==========================================
// 1. EL CONTRATO DE ESTADO (Initial Truth)
// ==========================================
const INITIAL_STATE = {
    sovereignty: {
        ...initialInterfaceState.sovereignty,
        status: adapter.sovereigntyStatus || 'UNKNOWN',
        mode: localStorage.getItem('INDRA_MODE') || (window.location.href.includes('mode=lab') ? 'LAB' : 'LIVE'),
        genesisTime: Date.now()
    },
    genotype: null,
    phenotype: {
        ...initialDataState.phenotype,
        devLab: initialInterfaceState.devLab,
        ui: initialInterfaceState.ui,
        logs: [],
        // AXIOMA V12: Estado inicial limpio (sin simulación optimista)
        availableCosmos: [],
        discoveryStatus: 'IDLE',
        currentRevisionHash: null
    }
};

// ==========================================
// 2. EL EJECUTOR DE LA LEY (Reducer)
// ==========================================
const axiomaticReducer = (state, action) => {
    // AXIOMA: Registro de Traza Atómica
    if (action.type === 'LOG_ENTRY') {
        return {
            ...state,
            phenotype: {
                ...state.phenotype,
                logs: [action.payload, ...state.phenotype.logs].slice(0, 50)
            }
        };
    }

    if (action.type === 'NUCLEAR_PURGE') {
        localStorage.removeItem('INDRA_GENOTYPE_L0');
        localStorage.removeItem('INDRA_PERSISTENCE_CACHE');
        window.location.reload();
        return state;
    }

    if (action.type === 'IGNITE_SYSTEM') {
        return {
            ...state,
            sovereignty: {
                ...state.sovereignty,
                status: action.payload.sovereignty,
                portalOpen: true
            },
            genotype: action.payload.genotype || state.genotype,
            phenotype: {
                ...state.phenotype,
                logs: [{ time: new Date().toLocaleTimeString(), msg: `🔥 SYSTEM IGNITION: ${action.payload.sovereignty}`, type: 'SUCCESS' }, ...state.phenotype.logs].slice(0, 50)
            }
        };
    }

    // AXIOMA V12: Delegación por Lóbulos (Snapshot Purge)
    let nextState = state;
    nextState = interfaceReducer(nextState, action);
    nextState = dataReducer(nextState, action);
    // cortexReducer ELIMINATED - Reconciliación moved to snapshot persistence

    return nextState;
};

// ==========================================
// 4. EL TEMPLO (Provider)
// ==========================================

export const AxiomaticProvider = ({ children }) => {
    const [state, dispatch] = useReducer(axiomaticReducer, INITIAL_STATE);
    const kernelRef = React.useRef(new ProjectionKernel());



    // AXIOMA: Configuración Única (Mount)
    useEffect(() => {
        // [Task 1] Reificar Identidad Temporal (Iron Memory)
        useAxiomaticState.getState().igniteHash();

        // [Task 2] Vincular Sentinel al DeepLog
        Validator_IO_node_Data.setDispatcher(dispatch);
        synapticDispatcher.setDispatcher(dispatch);

        window.ISK_KERNEL = kernelRef.current;

        const unsubscribeSovereignty = useAxiomaticState.subscribe((sovereignState) => {
            if (sovereignState.session.status === 'TERMINATED') {
                dispatch({ type: 'CLEAR_COSMOS_SESSION' });
            }
        });

        // AXIOMA V12: Callbacks eliminados - La reconciliación ahora es automática vía snapshot

        // AXIOMA V12: Persistencia de Emergencia (beforeunload)
        const handleBeforeUnload = (e) => {
            const syncStore = useSyncOrchestrator.getState();
            if (syncStore && typeof syncStore.prepareSnapshot === 'function') {
                const snapshot = syncStore.prepareSnapshot();
                if (snapshot && (snapshot.artifacts?.length > 0 || snapshot.relationships?.length > 0)) {
                    // Intentamos persistencia local inmediata (IndexedDB suele ser asíncrono pero rápido)
                    // Para el servidor, usamos un truco: si hay cambios significativos, mostramos el prompt 
                    // para dar tiempo a que termine el sync en vuelo.

                    // Usamos window.AxiomaticStore para evitar el stale closure del primer render
                    const currentState = window.AxiomaticStore?.getState?.();
                    const artifacts = currentState?.phenotype?.artifacts || [];

                    const isDirty = artifacts.some(a => a._isDirty);
                    if (isDirty) {
                        e.preventDefault();
                        e.returnValue = ''; // Muestra diálogo de confirmación
                    }
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            unsubscribeSovereignty();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []); // SOLO UNA VEZ AL MONTAR

    // AXIOMA: Actualización de Exposición Global
    useEffect(() => {
        window.AxiomaticStore = {
            getState: () => state,
            dispatch,
            kernel: kernelRef.current
        };
        // AXIOMA V12: Registro de Orquestador para Interadicción (ADR 003)
        window.useSyncOrchestrator = useSyncOrchestrator;
    }, [state]);

    /**
     * ACCIÓN MAESTRA: Ejecuta una acción soberana.
     */
    const execute = async (actionType, payload) => {
        // DIAGNÓSTICO: Rastreo de Intención Atómica
        console.error(`[EXECUTE] ⚡ ${actionType}`, { payload, thread: 'AXIOM_MAIN' });

        if (actionType === 'IGNITE_SYSTEM') {
            contextClient.igniteReflexes(dispatch);
        }

        if (actionType === 'CLEAR_COSMOS_SESSION') {
            localStorage.removeItem('LAST_ACTIVE_COSMOS_ID');
            persistenceManager.clearCache();
        }

        if (actionType === 'MOUNT_COSMOS') {
            const cosmosId = payload.cosmosId;
            useAxiomaticState.getState().setLoading(true);
            dispatch({ type: 'VAULT_LOADING' });

            // AXIOMA V12: Protocolo Local-First (Solución a la Paradoja de Indra)
            // Usamos una variable para rastrear si ya liberamos la UI
            let uiLiberated = false;

            const liberateUI = (cosmosData) => {
                if (uiLiberated) return;
                uiLiberated = true;
                // AXIOMA V12: Libertad Instantánea. 
                // No esperamos a la hidratación para quitar el spinner.
                useAxiomaticState.getState().setLoading(false);
                persistenceManager.triggerBackgroundHydration(cosmosData?.activeLayout, adapter);
            };

            // 1. Hidratación Prospectiva Inmediata (Desde IndexedDB)
            try {
                const localData = await AxiomaticDB.getItem(`COSMOS_STATE_${cosmosId}`);
                if (localData) {
                    console.info(`%c 🏛️ [Axiom:Store] Local-First: Instant mount from L2 Repository.`, "color: #10b981; font-weight: bold;");
                    dispatch({ type: 'COSMOS_MOUNTED', payload: localData });
                    useAxiomaticState.getState().setSessionAuthorized(cosmosId);
                    liberateUI(localData);
                }
            } catch (e) { console.warn("[Axiom:Store] L2 Read failed:", e); }

            // 2. Sincronía de Fondo (Validación de Nube)
            try {
                const response = await contextClient.mountCosmos(cosmosId);
                const rawData = response.result || response;
                const cloudData = Array.isArray(rawData) ? rawData[0] : rawData;

                if (!cloudData) throw new Error("Cosmos Data is empty or corrupted.");

                const finalId = cloudData.id || cloudData.cosmos_id || cloudData.ID;
                const localData = await AxiomaticDB.getItem(`COSMOS_STATE_${finalId}`);

                // AXIOMA: Resolución de Conflictos (Indra Drift)
                // Si la realidad en la nube es más reciente que nuestra caché local (o no hay caché)...
                if (!localData || cloudData._revisionHash !== localData._revisionHash) {
                    console.info(`%c ☁️ [Axiom:Store] Cloud Consensus: Updating reality to latest server revision.`, "color: #38bdf8;");
                    dispatch({ type: 'COSMOS_MOUNTED', payload: cloudData });

                    // Actualizar Sello Cronológico
                    const revisionHash = response.revision_hash || cloudData?.revision_hash || response._revisionHash;
                    if (revisionHash) {
                        useAxiomaticState.getState().updateRevisionHash(revisionHash);
                    }

                    // Guardar la nueva verdad en el repositorio local
                    await AxiomaticDB.setItem(`COSMOS_STATE_${finalId}`, cloudData);

                    // Si no habíamos liberado la UI (porque no había local), lo hacemos ahora
                    liberateUI(cloudData);
                }

                useAxiomaticState.getState().setSessionAuthorized(finalId);
                localStorage.setItem('LAST_ACTIVE_COSMOS_ID', finalId);

                // Asegurar liberación de UI si por alguna razón sigue bloqueada
                if (!uiLiberated) liberateUI(cloudData);

                dispatch({ type: 'LOG_ENTRY', payload: { time: new Date().toLocaleTimeString(), msg: `🌌 Cosmos '${cloudData?.label || cloudData?.LABEL || 'unnamed'}' sincronizado`, type: 'SUCCESS' } });
            } catch (error) {
                console.warn('[Store:Mount] Background Sync failed, relying on Local-First sovereignty.', error);

                // Si falló el cloud y NO pudimos liberar la UI (no había local), liberamos con error
                if (!uiLiberated) {
                    useAxiomaticState.getState().setLoading(false);
                    dispatch({ type: 'LOG_ENTRY', payload: { time: new Date().toLocaleTimeString(), msg: `🛑 Error al montar: ${error.message}`, type: 'ERROR' } });
                }
            }
            return;
        }

        if (actionType === 'SELECT_ARTIFACT') {
            let target = payload;

            // AXIOMA: Resolución de Identidad (ID -> Canon)
            // Si recibimos un ID técnico (string), buscamos su canon en el compilador o el fenotipo
            if (typeof target === 'string') {
                const canon = compiler.getCanon(target) || state.phenotype.artifacts?.find(a => a.id === target);
                if (!canon) {
                    console.error(`[Axiom:Store] FATAL: Cannot resolve identity for: ${target}`);
                    return;
                }
                target = canon;
            }

            // AXIOMA: Navegación Polimórfica (V10.5)
            // Si es un Cosmos, montamos. Si es carpeta, entramos.
            if (target?.schemaId === 'COSMOS_NODE' || target?.ARCHETYPE === 'COSMOS') {
                execute('MOUNT_COSMOS', { cosmosId: target.data?.id || target.id });
                return;
            }

            dispatch({ type: 'SELECT_ARTIFACT', payload: target });

            if (target?.schemaId === 'FOLDER_NODE' || target?.data?.type === 'DIRECTORY') {
                const folderId = target.data?.id || target.id;
                // AXIOMA: Soberanía de Origen. Usamos el ORIGIN_SOURCE del metadato si existe.
                const originNodeId = (target.data?.ORIGIN_SOURCE || target.ORIGIN_SOURCE || 'drive').toLowerCase();
                execute('FETCH_VAULT_CONTENT', { folderId, nodeId: originNodeId });
            }
            return;
        }

        if (actionType === 'EXIT_FOCUS') {
            dispatch({ type: 'SELECT_ARTIFACT', payload: null });
            return;
        }

        if (actionType === 'EXECUTE_NODE_ACTION') {
            const { nodeId, capability, payload: actionPayload, _ttl, _visited } = payload;
            const targetNode = state.phenotype.artifacts?.find(n => n.id === nodeId);
            if (!targetNode) return;

            dispatch({ type: 'LOG_ENTRY', payload: { time: new Date().toLocaleTimeString(), msg: `🔌 Triggering ${targetNode.LABEL} -> ${capability}`, type: 'INFO' } });
            try {
                // 1. Ejecución Local (Adapter)
                const result = await adapter.executeAction(`${targetNode.data?.id || targetNode.id}:${capability}`, actionPayload);

                // 2. Propagación Sináptica (Synaptic Dispatcher - Tarea 1)
                synapticDispatcher.propagate(
                    { state, execute },
                    nodeId,
                    result,
                    _ttl !== undefined ? _ttl : 10,
                    _visited || new Set()
                );

            } catch (err) {
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `❌ Flow Error: ${err.message}`, type: 'ERROR' } });
            }
            return;
        }

        if (actionType === 'FETCH_VAULT_CONTENT') {
            const { folderId, query, accountId, nodeId, refresh } = payload;

            // AXIOMA: Resolución de Identidad Sugerida
            // Usamos el nodeId proporcionado, o 'drive' como fallback canónico.
            let targetNodeId = (nodeId || 'drive').toLowerCase();
            if (targetNodeId === 'vault_global') targetNodeId = 'drive'; // Mantenemos el mapeo por compatibilidad con el backend

            const targetFolder = folderId || 'ROOT';

            useAxiomaticState.getState().setLoading(true);
            dispatch({ type: 'VAULT_LOADING', payload: { nodeId: targetNodeId, folderId: targetFolder } });
            try {
                const result = await persistenceManager.fetchContent(targetNodeId, { folderId: targetFolder, query, accountId, forceRefresh: refresh }, adapter);
                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'VAULT_LOAD_SUCCESS', payload: { nodeId: targetNodeId, data: result } });
            } catch (err) {
                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `[IO:${targetNodeId.toUpperCase()}] Error: ${err.message}`, type: 'ERROR' } });
            }
            return;
        }

        if (actionType === 'START_DISCOVERY') {
            dispatch({ type: 'SET_DISCOVERY_STATUS', payload: 'SCANNING' });
            try {
                const response = await contextClient.listAvailableCosmos(true);
                dispatch({ type: 'UPDATE_COSMOS_REGISTRY', payload: response.artifacts || [] });
            } catch (err) {
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `Discovery Failed: ${err.message}`, type: 'ERROR' } });
                dispatch({ type: 'UPDATE_COSMOS_REGISTRY', payload: [] }); // Reset to Ready even on fail
            }
            return;
        }

        if (actionType === 'FETCH_DATABASE_CONTENT') {
            const { databaseId, nodeId, refresh, accountId } = payload;
            const targetNodeId = (nodeId || 'drive').toLowerCase();

            useAxiomaticState.getState().setLoading(true);
            try {
                // AXIOMA: Resolución de Protocolo de Datos
                let result;
                if (targetNodeId === 'drive') {
                    result = await adapter.executeAction('sheet:read', { sheetId: databaseId, accountId });
                } else if (targetNodeId === 'notion') {
                    result = await adapter.executeAction('notion:query_db', { databaseId, accountId });
                }

                const rows = Array.isArray(result) ? result : (result?.results || result?.items || []);
                const schema = result?.SCHEMA || null;

                dispatch({
                    type: 'VAULT_LOAD_SUCCESS',
                    payload: {
                        nodeId: databaseId, // Silo case-sensitive para preservar integridad
                        data: typeof result === 'object' && !Array.isArray(result)
                            ? { ...result, items: rows, SCHEMA: schema }
                            : { items: rows, SCHEMA: schema }
                    }
                });

                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `📊 Data reified: ${rows.length} records retrieved.`, type: 'SUCCESS' } });
            } catch (err) {
                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `[DB:${targetNodeId.toUpperCase()}] Failure: ${err.message}`, type: 'ERROR' } });
            }
            return;
        }

        if (actionType === 'INTEGRATE_SMART_NODE') {
            const { baseNode, config, schemaId } = payload;
            console.log(`[Store] 🧬 Integrating Smart Node: ${baseNode.name} using schema ${schemaId}`);

            // AXIOMA: Transformación Semántica
            // Mapeamos la data del formulario a una estructura de CANON de Indra
            const newSmartNode = {
                id: `smart_${baseNode.id}`,
                LABEL: config.base_info?.label || baseNode.name,
                ARCHETYPE: 'ADAPTER',
                DOMAIN: 'USER_TOOL',
                VITAL_SIGNS: {
                    'Status': { value: 'ACTIVE', criticality: 'NOMINAL', trend: 'stable' },
                    'Configuration': { value: 'HYDRATED', criticality: 'NOMINAL', trend: 'rising' }
                },
                MATH_CAPABILITIES: {
                    engine: 'ISK_NEURAL_MATH',
                    constructs: {
                        'EstimationLogic': {
                            syntax: `PRICE = ${config.pricing_logic?.base_rate || 0} * ${config.pricing_logic?.complexity_factor || 1.0} ${config.pricing_logic?.enable_urgency ? '+ URGENCY_FEE' : ''}`,
                            desc: 'Logic projected from user configuration.'
                        }
                    }
                },
                UI_LAYOUT: {
                    TERMINAL_STREAM: 'ENABLED',
                    VIEW_MODE_SELECTOR: { OPTIONS: ['GRID', 'METRICS'], DEFAULT: 'GRID' }
                }
            };

            dispatch({
                type: 'LOG_ENTRY',
                payload: {
                    msg: `Indra Node Reified: ${newSmartNode.LABEL}. Semantic bridge active.`,
                    type: 'SUCCESS'
                }
            });

            // En un sistema real, esto se añadiría a la ontología local del compilador
            // o se guardaría en el Cosmos.
            return;
        }

        if (actionType === 'BIND_TO_COSMOS') {
            const { artifact } = payload;
            const cosmosId = state.phenotype.cosmosIdentity?.id;
            if (!cosmosId) {
                dispatch({ type: 'LOG_ENTRY', payload: { msg: "Debe haber un Cosmos activo para entrelazar artefactos.", type: 'ERROR' } });
                return;
            }

            dispatch({ type: 'LOG_ENTRY', payload: { msg: `Entrelazando ${artifact.name}...`, type: 'INFO' } });

            try {
                // 1. Registro en el Core (Cloud Consensus)
                const response = await adapter.call('system', 'bindArtifactToCosmos', {
                    cosmosId,
                    artifactId: artifact.id,
                    metadata: {
                        name: artifact.name,
                        type: artifact.type,
                        origin: artifact.origin || 'VAULT'
                    }
                });

                if (response?.success) {
                    dispatch({ type: 'LOG_ENTRY', payload: { msg: `Vínculo atómico establecido para ${artifact.name}`, type: 'SUCCESS' } });

                    // 2. Manifestación en el Grafo Local
                    execute('ADD_ARTIFACT_REQUEST', {
                        artifact: {
                            ...artifact,
                            LABEL: artifact.name,
                            DOMAIN: 'VAULT_BOND'
                        }
                    });

                    // AXIOMA: Revelación Automática (Opcional, removido para evitar fricción)
                    // execute('TOGGLE_UI_PANEL', { panel: 'vault' });
                }
            } catch (err) {
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `Fallo de Entrelazamiento: ${err.message}`, type: 'ERROR' } });

                // Fallback: Si el backend falla, permitimos manifestar localmente (Local-First) pero avisamos
                console.warn("[Store:Bind] Backend failed, manifesting locally only.");
                execute('ADD_ARTIFACT_REQUEST', { artifact });
                // AXIOMA: Revelación Automática (Incluso en Fallback)
                execute('TOGGLE_UI_PANEL', { panel: 'vault' });
            }
            return;
        }

        dispatch({ type: actionType, payload });

        setTimeout(() => {
            if (window.ISK_KERNEL) {
                window.ISK_KERNEL.update({ ...state, _lastAction: { type: actionType, payload } });
            }
        }, 0);
    };

    const hashInitialized = useAxiomaticState(s => s.session.hashInitialized);
    const globalLoading = useAxiomaticState(s => s.session.isLoading);

    useEffect(() => {
        if (!hashInitialized) return; // AXIOMA: No ignición sin reificación (Task 4)

        const lastCosmosId = localStorage.getItem('LAST_ACTIVE_COSMOS_ID');
        if (lastCosmosId && !state.phenotype.cosmosIdentity && !globalLoading) {
            execute('MOUNT_COSMOS', { cosmosId: lastCosmosId });
        }
    }, [hashInitialized, globalLoading]);
    // AXIOMA: Persistencia de Metadatos de Navegación y Homeostasis Reactiva (V11.1)
    useEffect(() => {
        const cosmosId = state.phenotype.cosmosIdentity?.id;

        // 1. Persistencia de Navegación
        localStorage.setItem('INDRA_ANCHOR_LAYER', state.phenotype.ui.currentLayer || '');
        if (state.phenotype.focusStack?.length > 0) {
            localStorage.setItem('INDRA_FOCUS_STACK', JSON.stringify(state.phenotype.focusStack.map(a => a.id)));
        } else {
            localStorage.removeItem('INDRA_FOCUS_STACK');
        }
        if (cosmosId && !cosmosId.toString().startsWith('temp_')) {
            localStorage.setItem('LAST_ACTIVE_COSMOS_ID', cosmosId);
        }

        // AXIOMA V12: Persistencia Continua (Memoria Eterna)
        // Cada vez que hay un cambio en la estructura o el layout, actualizamos el repositorio local (L2)
        const currentCosmosId = state.phenotype.cosmosIdentity?.id || state.phenotype.cosmosIdentity?.cosmos_id;
        if (!currentCosmosId) return;

        const currentCount = (state.phenotype.artifacts?.length || 0) + (state.phenotype.relationships?.length || 0);
        const lastCount = window._INDRA_LAST_STRUCT_COUNT || 0;

        // Solo persistimos si el cosmos está activo y no estamos en un estado de error crítico
        if (state.session?.status !== 'HALTED') {
            const cosmosSnapshot = {
                ...state.phenotype.cosmosIdentity,
                artifacts: state.phenotype.artifacts,
                relationships: state.phenotype.relationships,
                silos: state.phenotype.silos,
                siloMetadata: state.phenotype.siloMetadata,
                activeLayout: state.phenotype.activeLayout,
                activeFlow: state.phenotype.activeFlow,
                _revisionHash: useAxiomaticState.getState().session.currentRevisionHash,
                _localTimestamp: Date.now()
            };

            // Guardar en Repositorio Local (L2)
            AxiomaticDB.setItem(`COSMOS_STATE_${cosmosId}`, cosmosSnapshot);

            if (currentCount !== lastCount) {
                window._INDRA_LAST_STRUCT_COUNT = currentCount;
                console.info(`%c 🏛️ [Axiom:L2] Reality reified in local storage.`, "color: #38bdf8;");
            }
        }
    }, [
        state.phenotype.cosmosIdentity,
        state.phenotype.artifacts,
        state.phenotype.relationships,
        state.phenotype.activeLayout,
        state.phenotype.activeFlow,
        state.phenotype.devLab
    ]);

    // AXIOMA: Guardián de Resonancia (Zustand Listener inside Context)
    useEffect(() => {
        const unsubscribe = useAxiomaticState.subscribe(
            (s) => s.session.isLoading,
            (isLoading, prevLoading) => {
                if (prevLoading === true && isLoading === false) {
                    console.log("%c[Axiom:Guardian] Reality stabilized.", "color: #00ffcc; font-weight: bold;");
                }
            }
        );
        return unsubscribe;
    }, [state]);

    return (
        <AxiomaticContext.Provider value={{ state, dispatch, execute }}>
            {children}
        </AxiomaticContext.Provider>
    );
};

export const useAxiomaticStore = () => {
    const context = useContext(AxiomaticContext);
    if (!context) throw new Error("useAxiomaticStore must be used within an AxiomaticProvider.");
    return context;

};
