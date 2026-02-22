import React, { createContext, useContext, useReducer, useEffect } from 'react';
import adapter from '../Sovereign_Adapter.js';
import { contextClient } from '../kernel/ContextClient.js';
// ADR-021: MockFactory PURGADO — el sistema ya no admite datos de mentira
import persistenceManager from './PersistenceManager.jsx';
import { ProjectionKernel } from '../kernel/isk/ProjectionKernel.js';
import synapticDispatcher from '../kernel/SynapticDispatcher.js';
import compiler from '../2_Semantic_Transformation/Law_Compiler.js';
import AxiomaticContext from './AxiomaticStore.Context.js';
import { CONFIG } from '../Config.js';

// AXIOMA: Fragmentación por Lóbulos de Estado (V10.5 -> V12 Snapshot Purge)
import { interfaceReducer, initialInterfaceState } from './Lobes/InterfaceLobe.js';
import { dataReducer, initialDataState } from './Lobes/DataLobe.js';

import usageTracker from './UsageTracker.js';
import useAxiomaticState from './AxiomaticState.js'; // NEW MEMBRANE AUTHORITY

import useSyncOrchestrator from './SyncOrchestrator.js';
import AxiomaticDB from './Infrastructure/AxiomaticDB.js';
import realityManager from '../RealityManager.js';

// ==========================================
// 🛡️ AXIOM INTEGRITY GUARDIAN (Diagnostic Pulse)
// ==========================================
const auditIdentity = (artifacts, actionType) => {
    if (!artifacts || typeof artifacts !== 'object') return;

    const keys = Object.keys(artifacts);
    const values = Object.values(artifacts);
    const idMap = new Map();
    const collisions = [];

    values.forEach(art => {
        const id = art.id || art.ID;
        if (!id) return;

        if (idMap.has(id)) {
            collisions.push({
                id,
                existingKey: idMap.get(id),
                newKey: keys.find(k => artifacts[k] === art)
            });
        }
        idMap.set(id, keys.find(k => artifacts[k] === art));
    });

    if (collisions.length > 0) {
        console.group(`%c🚨 IDENTITY COLLISION DETECTED [Action: ${actionType}]`, "color: #ff4444; font-weight: bold;");
        console.error("Collision Details:", collisions);
        console.log("Current Identity Map:", artifacts);
        console.trace("Audit Trace");
        console.groupEnd();
    }
};

// ==========================================
// 1. EL CONTRATO DE ESTADO (Initial Truth)
// ==========================================
const INITIAL_STATE = {
    sovereignty: {
        ...initialInterfaceState.sovereignty,
        status: adapter.sovereigntyStatus || 'UNKNOWN',
        mode: 'LIVE', // ADR-021: DevLab Erradicado. Solo existe la realidad LIVE.
        genesisTime: Date.now()
    },
    genotype: null,
    phenotype: {
        ...initialDataState.phenotype,
        // ADR-021: devLab PURGADO del fenotipo inicial
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

    const nextState = dataReducer(interfaceReducer(state, action), action);

    // AXIOMA: Guardia de Integridad en Caliente
    if (action.type !== 'LOG_ENTRY' && action.type !== 'UPDATE_DISCOVERY_STATUS') {
        const artifactsCount = Object.keys(nextState.phenotype?.artifacts || {}).length;
        const relsCount = nextState.phenotype?.relationships?.length || 0;
        console.log(`[Store:Audit] 🧩 Action: ${action.type} | Artifacts: ${artifactsCount} | Edges: ${relsCount}`);
    }

    if (nextState.phenotype?.artifacts) {
        auditIdentity(nextState.phenotype.artifacts, action.type);
    }

    return nextState;
};

// ==========================================
// 4. EL TEMPLO (Provider)
// ==========================================

import { StateBridge } from './StateBridge.js';

export const AxiomaticProvider = ({ children }) => {
    const [state, dispatch] = useReducer(axiomaticReducer, INITIAL_STATE);
    const kernelRef = React.useRef(new ProjectionKernel());
    const stateRef = React.useRef(state);
    const lastStructCountRef = React.useRef(0);

    // [AXIOMA] Registro de Puente (Sustituye a window.XXX)
    useEffect(() => {
        stateRef.current = state;
        StateBridge.setState(state);
        StateBridge.setKernel(kernelRef.current);
        StateBridge.setOrchestrator(useSyncOrchestrator);
    }, [state]);



    // AXIOMA: Configuración Única (Mount)
    useEffect(() => {
        // [Task 1] Reificar Identidad Temporal (Iron Memory)
        useAxiomaticState.getState().igniteHash();

        // [Task 2] Vincular Sentinel al DeepLog
        synapticDispatcher.setDispatcher(dispatch);
        realityManager.setDispatcher(dispatch);

        // window.ISK_KERNEL = kernelRef.current; // UNCOMMENT FOR CORE DEBUGGING ONLY

        const unsubscribeSovereignty = useAxiomaticState.subscribe((sovereignState) => {
            if (sovereignState.session.status === 'TERMINATED') {
                dispatch({ type: 'CLEAR_COSMOS_SESSION' });
            }
        });

        // AXIOMA V12: Callbacks eliminados - La reconciliación ahora es automática vía snapshot

        // AXIOMA V12: Persistencia de Emergencia Silenciosa
        const handleBeforeUnload = (e) => {
            const syncStore = useSyncOrchestrator.getState();
            if (syncStore && typeof syncStore.prepareSnapshot === 'function') {
                syncStore.prepareSnapshot();
                // Eliminamos e.preventDefault() y e.returnValue para no mostrar diálogo
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            unsubscribeSovereignty();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []); // SOLO UNA VEZ AL MONTAR

    useEffect(() => {
        // AXIOMA V12: L2 Background Synchronization
        // Guardado local determinista para no perder posiciones espaciales (Drag & Drop) en f5.
        const syncStore = useSyncOrchestrator.getState();
        if (state.phenotype.cosmosIdentity?.id && syncStore && typeof syncStore.prepareSnapshot === 'function') {
            const snapshot = syncStore.prepareSnapshot();
            if (snapshot) {
                AxiomaticDB.setItem(`COSMOS_STATE_${snapshot.cosmosId}`, snapshot).catch(err => {
                    console.warn("[AxiomaticStore] Local persistence failed:", err);
                });
            }
        }
    }, [state]);

    /**
     * ACCIÓN MAESTRA: Ejecuta una acción soberana.
     */
    const execute = async (actionType, payload) => {
        console.info(`%c [EXECUTE] ⚡ ${actionType}`, "color: #fbbf24; font-weight: bold;", { payload });

        if (actionType === 'NUCLEAR_PURGE') {
            console.warn("☢️ [NUCLEAR_PURGE] Initializing system wipe (Preserving Address Book)...");

            // AXIOMA: Preservación de Navegación
            const addressBook = localStorage.getItem('AXIOM_KNOWN_CORES');

            localStorage.clear();

            // Restaurar el Address Book tras la limpieza
            if (addressBook) localStorage.setItem('AXIOM_KNOWN_CORES', addressBook);

            try {
                await AxiomaticDB.purge();
                console.log("🏛️ [AxiomaticDB] L2 Repository purged.");
            } catch (e) {
                console.error("🛑 [AxiomaticDB] Purge failed:", e);
            }

            window.location.reload();
            return;
        }

        if (actionType === 'IGNITE_SYSTEM') {
            contextClient.igniteReflexes(dispatch);
        }

        if (actionType === 'CLEAR_COSMOS_SESSION') {
            localStorage.removeItem('LAST_ACTIVE_COSMOS_ID');
            persistenceManager.clearCache();
        }

        if (actionType === 'MOUNT_COSMOS') {
            realityManager.mountCosmos(payload.cosmosId);
            return;
        }

        if (actionType === 'SELECT_ARTIFACT') {
            let target = payload;

            // AXIOMA: Resolución de Identidad (ID -> Canon)
            // Si recibimos un ID técnico (string), buscamos su canon en el compilador o el fenotipo
            if (typeof target === 'string') {
                const canon = compiler.getCanon(target) || state.phenotype.artifacts?.[target];
                if (!canon) {
                    console.error(`[Axiom:Store] FATAL: Cannot resolve identity for: ${target}`);
                    return;
                }
                target = canon;
            }

            dispatch({ type: 'SELECT_ARTIFACT', payload: target });

            // AXIOMA: Pre-Reificación Determinista (v14.0)
            // Si el objeto es una Base de Datos y el silo está vacío, disparamos la hidratación.
            const resolvedArchetype = (target?.ARCHETYPE || '').toUpperCase();
            if (resolvedArchetype === 'DATABASE') {
                const artifactId = target.id;
                const siloData = state.phenotype.silos?.[artifactId];
                if (!siloData || siloData.length === 0) {
                    // ADR-022: 'origin' es el campo canónico.
                    const origin = target.origin;
                    const account = target.accountId;
                    if (origin) {
                        console.info(`%c[Reify:Middleware] ⚡ Pre-loading database: ${artifactId} from ${origin}`, "color: #38bdf8; font-weight: bold;");
                        execute('FETCH_DATABASE_CONTENT', { databaseId: artifactId, nodeId: origin, accountId: account });
                    }
                }
            }

            if (target?.ARCHETYPE === 'VAULT' || target?.schemaId === 'FOLDER_NODE') {
                const folderId = target.id;
                const originNodeId = target.origin?.toLowerCase() || 'drive';
                execute('FETCH_VAULT_CONTENT', { folderId, nodeId: originNodeId });
            }
            return;
        }

        if (actionType === 'EXIT_FOCUS') {
            dispatch({ type: 'SELECT_ARTIFACT', payload: null });
            return;
        }

        if (actionType === 'EXECUTE_NODE_ACTION') {
            const { nodeId, capability, payload: rawPayload, _ttl, _visited } = payload;
            const targetNode = state.phenotype.artifacts?.[nodeId];
            if (!targetNode) return;

            // AXIOMA: Descorchado Ontológico (Unwrapping Matter)
            // El sistema extrae la esencia del dato si este viene envuelto en un sobre de red.
            const actionPayload = (rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload))
                ? (rawPayload.results || rawPayload.payload || rawPayload.result || rawPayload.data || rawPayload)
                : rawPayload;

            // AXIOMA: Feedback Kinético (Visual Pulse)
            window.dispatchEvent(new CustomEvent('ISK_SYNAPTIC_PULSE', { detail: { nodeId } }));

            dispatch({ type: 'LOG_ENTRY', payload: { time: new Date().toLocaleTimeString(), msg: `🔌 Action: ${targetNode.LABEL} -> ${capability}`, type: 'INFO' } });

            try {
                // 1. Ejecución Local (Adapter)
                const capConfig = targetNode.CAPABILITIES?.[capability];

                // AXIOMA: Polaridad Emisiva (Output Detection)
                // Cualquier puerto con naturaleza de salida (STREAM, READ, PROBE) no requiere ejecución local,
                // actúa como un emisor de señal hacia el grafo.
                const isOutputPort = ['OUTPUT', 'STREAM', 'READ', 'PROBE', 'REFRESH'].includes(capConfig?.io || capConfig?.io_interface?.io);

                let result = null;
                if (!isOutputPort) {
                    // AXIOMA: Inyección de Materia Agnostica (Polymorphic Receiver)
                    const isInput = capConfig?.io === 'INPUT' || capConfig?.io === 'WRITE';

                    if (isInput) {
                        dispatch({
                            type: 'UPDATE_NODE',
                            payload: { id: nodeId, updates: { _currentProjection: actionPayload } }
                        });
                    }

                    // Ejecución en el adaptador (si existe contrato)
                    if (capConfig) {
                        result = await adapter.executeAction(`${targetNode.id}:${capability}`, actionPayload);
                    } else {
                        result = actionPayload;
                    }
                } else {
                    console.info(`%c[Store:Synapse] 📡 Signaling output: ${capability} on ${nodeId}`, "color: #a78bfa; font-weight: bold;");
                    result = actionPayload;
                }

                // 2. Propagación Sináptica (Synaptic Dispatcher - Tarea 1)
                synapticDispatcher.propagate(
                    { state, execute },
                    nodeId,
                    result,
                    _ttl !== undefined ? _ttl : 10,
                    _visited || new Set(),
                    capability // Pasamos el puerto que disparó
                );

            } catch (err) {
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `❌ Flow Error: ${err.message}`, type: 'ERROR' } });
            }
            return;
        }

        if (actionType === 'FETCH_VAULT_CONTENT') {
            const { folderId, query, accountId, nodeId, refresh } = payload;

            // AXIOMA: Resolución de Identidad Sugerida
            // Mantenemos el ID original para el Silo, pero mapeamos para el Backend si es necesario
            const originalNodeId = (nodeId || 'drive').toLowerCase();
            const targetNodeId = originalNodeId === 'vault_global' ? 'drive' : originalNodeId;

            const targetFolder = folderId || 'ROOT';

            useAxiomaticState.getState().setLoading(true);
            dispatch({ type: 'VAULT_LOADING', payload: { nodeId: originalNodeId, folderId: targetFolder } });
            try {
                const result = await persistenceManager.fetchContent(targetNodeId, { folderId: targetFolder, query, accountId, forceRefresh: refresh }, adapter);
                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'VAULT_LOAD_SUCCESS', payload: { nodeId: originalNodeId, data: result } });
            } catch (err) {
                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `[IO:${originalNodeId.toUpperCase()}] Error: ${err.message}`, type: 'ERROR' } });
            }
            return;
        }

        if (actionType === 'FETCH_COMMUNICATION_CONTENT') {
            const { nodeId, accountId, query, refresh } = payload;
            const targetNodeId = (nodeId || 'email').toLowerCase();

            useAxiomaticState.getState().setLoading(true);
            try {
                // AXIOMA: Reutilizamos el PersistenceManager para coherencia de silos
                const result = await persistenceManager.fetchContent(targetNodeId, { query, accountId, forceRefresh: refresh }, adapter);

                dispatch({
                    type: 'VAULT_LOAD_SUCCESS',
                    payload: {
                        nodeId: targetNodeId,
                        data: result
                    }
                });
                useAxiomaticState.getState().setLoading(false);
            } catch (err) {
                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `[Comm:${targetNodeId}] Error: ${err.message}`, type: 'ERROR' } });
            }
            return;
        }

        if (actionType === 'START_DISCOVERY') {
            realityManager.startDiscovery();
            return;
        }

        if (actionType === 'FETCH_DATABASE_CONTENT') {
            let { databaseId, nodeId, refresh, accountId } = payload;

            // AXIOMA: Determinismo de Identidad (Cosmos-Centric ADR-009)
            // Primero buscamos en el grafo del Cosmos si este artefacto ya tiene una identidad declarada.
            const cosmosNode = state.phenotype.artifacts?.[databaseId] ||
                Object.values(state.phenotype.artifacts || {}).find(a => a.data?.id === databaseId);
            // ADR-022: Leer 'origin' (canónico) con fallback a ORIGIN_SOURCE (legacy)
            const declaredOrigin = cosmosNode?.origin || cosmosNode?.ORIGIN_SOURCE || cosmosNode?.data?.origin || cosmosNode?.data?.ORIGIN_SOURCE;

            if (declaredOrigin && declaredOrigin !== nodeId) {
                console.info(`%c[DB:COSMOS_RESOLVER] 🌌 Using deterministic origin from Cosmos: ${declaredOrigin}`, "color: #10b981; font-weight: bold;");
                nodeId = declaredOrigin;
            }

            // AXIOMA: Identidad por Herencia (Zero-Guesswork)
            // Ya no hay Regex de Notion ni hardcoding. Si el nodeId está presente, lo usamos.
            // El backend se encargará de firmar el resultado con el ORIGIN_SOURCE real.

            console.log(`%c[DB:IGNITION] 🚀 Origin: ${nodeId || 'AUTO'} | ID: ${databaseId}`, "color: #fbbf24; font-weight: bold;");

            // AXIOMA: NO asumir origen si no hay forma de resolverlo
            if (!nodeId) {
                console.error(`[AxiomaticStore] ❌ FETCH_DATABASE_CONTENT called without nodeId for database: ${databaseId}`);
                dispatch({
                    type: 'LOG_ENTRY',
                    payload: {
                        msg: `Cannot fetch database ${databaseId}: origin source (nodeId) is missing`,
                        type: 'ERROR'
                    }
                });
                return;
            }

            const targetNodeId = nodeId.toLowerCase();

            useAxiomaticState.getState().setLoading(true);
            try {
                // AXIOMA: Despacho Agnóstico (Soberanía de Nodo)
                // Invocamos directamente al nodo responsable usando su señal de lectura.
                let result;
                if (targetNodeId === 'notion') {
                    result = await adapter.notion('queryDatabase', { databaseId, accountId });
                } else if (targetNodeId === 'drive' || targetNodeId === 'sheet') {
                    // Si el origen es Drive, usamos el adaptador de Sheets para "reificar" la tabla
                    result = await adapter.sheet('read', { sheetId: databaseId, accountId });
                } else {
                    // Fallback universal: listContents
                    result = await adapter.executeAction(`${targetNodeId}:listContents`, { databaseId, accountId });
                }

                // AXIOMA: Soberanía de Transmutación Centralizada
                // El 'result' ya ha sido transmutado por el InterdictionUnit antes de llegar aquí.
                // Contiene el envoltorio con 'items' y 'SCHEMA' preservados.
                let rows = result.items || result.results || (Array.isArray(result) ? result : []);
                let schema = result.SCHEMA;

                // Si el backend lo devuelve en un envoltorio tipo [{ items: [...] }]
                if (Array.isArray(rows) && rows.length === 1 && (rows[0].items || rows[0].results)) {
                    schema = rows[0].SCHEMA || schema;
                    rows = rows[0].items || rows[0].results || [];
                }

                const finalData = {
                    items: rows,
                    SCHEMA: schema
                };

                dispatch({
                    type: 'VAULT_LOAD_SUCCESS',
                    payload: {
                        nodeId: databaseId, // Silo case-sensitive para preservar integridad
                        data: finalData
                    }
                });

                // AXIOMA: Persistencia en L2 (Caché de Larga Duración)
                // Usamos la misma convención de claves que useAxiomaticHydration para recuperación automática.
                // Guardamos el envoltorio completo (items + SCHEMA) para preservar la estructura.
                if (result) {
                    persistenceManager.saveLocal(`${databaseId}.database_${databaseId}`, finalData);
                }

                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `📊 Data reified: ${rows.length} records retrieved.`, type: 'SUCCESS' } });
            } catch (err) {
                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `[DB:${targetNodeId.toUpperCase()}] Failure: ${err.message}`, type: 'ERROR' } });
            }
            return;
        }

        if (actionType === 'TRACE_SOVEREIGN_DATABASE') {
            const { databaseId, nodeId } = payload;
            const tracer = (step, data) => {
                console.group(`%c[🛰️ SOVEREIGN_TRACE] ${step}`, 'color: #10b981; font-weight: bold;');
                console.log('Context:', { databaseId, nodeId, timestamp: new Date().toISOString() });
                if (data) console.log('Payload:', data);
                console.groupEnd();
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `🛰️ [TRACE:${step}] ${databaseId}`, type: 'INFO' } });
            };

            tracer('IGNITION', payload);

            if (!nodeId || !databaseId) {
                tracer('FAILURE: Missing Params', { nodeId, databaseId });
                return;
            }

            useAxiomaticState.getState().setLoading(true);

            try {
                const targetNode = nodeId?.toLowerCase();
                let result;

                if (targetNode === 'notion') {
                    result = await adapter.notion('queryDatabase', { databaseId });
                } else if (targetNode === 'drive' || targetNode === 'sheet') {
                    result = await adapter.sheet('read', { sheetId: databaseId });
                } else {
                    result = await adapter.executeAction(`${targetNode}:listContents`, { databaseId });
                }

                tracer('ADAPTER_CALL_SUCCESS', {
                    resultType: typeof result,
                    isObject: typeof result === 'object',
                    hasResults: !!(result?.results || result?.items)
                });

                // AXIOMA: Desempaquetado Directo (Zero Magic)
                const rows = result.items || (Array.isArray(result.results) ? result.results : (Array.isArray(result) ? result : []));

                tracer('DATA_REIFICATION', { rowCount: rows.length });

                dispatch({
                    type: 'VAULT_LOAD_SUCCESS',
                    payload: {
                        nodeId: databaseId,
                        data: typeof result === 'object' && !Array.isArray(result)
                            ? { ...result, items: rows }
                            : { items: rows }
                    }
                });

                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `🎯 Trace Complete: ${rows.length} records reified.`, type: 'SUCCESS' } });

            } catch (err) {
                tracer('CRITICAL_FAILURE', { error: err.message, stack: err.stack });
                useAxiomaticState.getState().setLoading(false);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `🛰️ Trace Failed: ${err.message}`, type: 'ERROR' } });
            }
            return;
        }

        if (actionType === 'INTEGRATE_SMART_NODE') {
            const { baseNode, config, schemaId } = payload;
            console.log(`[Store] 🧬 Integrating Smart Node: ${baseNode.name} using schema ${schemaId}`);

            // AXIOMA: Transformación Semántica
            // Mapeamos la data del formulario a una estructura de CANON de Axiom
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
                    msg: `Axiom Node Reified: ${newSmartNode.LABEL}. Semantic bridge active.`,
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

            // AXIOMA: Reificación Inmediata vía Compilador de Leyes
            const reifiedArtifact = compiler.compileItem(artifact);

            dispatch({ type: 'LOG_ENTRY', payload: { msg: `Entrelazando ${reifiedArtifact.LABEL}...`, type: 'INFO' } });

            try {
                // 1. Registro en el Core (Cloud Consensus)
                const response = await adapter.call('system', 'bindArtifactToCosmos', {
                    cosmosId,
                    artifactId: reifiedArtifact.id,
                    metadata: {
                        name: reifiedArtifact.LABEL,
                        type: reifiedArtifact.ARCHETYPE,
                        origin: reifiedArtifact.ORIGIN_SOURCE || 'VAULT'
                    }
                });

                if (response?.success) {
                    dispatch({ type: 'LOG_ENTRY', payload: { msg: `Vínculo atómico establecido para ${reifiedArtifact.LABEL}`, type: 'SUCCESS' } });

                    // 2. Manifestación en el Grafo Local
                    execute('ADD_ARTIFACT_REQUEST', {
                        artifact: {
                            ...reifiedArtifact,
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
                execute('ADD_ARTIFACT_REQUEST', { artifact: reifiedArtifact });
                // AXIOMA: Revelación Automática (Incluso en Fallback)
                execute('TOGGLE_UI_PANEL', { panel: 'vault' });
            }
            return;
        }

        if (actionType === 'LINK_SLOT_PROPERTY') {
            const { slotId, propertyId, targetArtifact } = payload;

            // AXIOMA: Vinculación Semántica (Slot -> Artifact)
            console.log(`[Axiom:Link] 🔗 Binding ${propertyId} to ${targetArtifact.id}`);

            dispatch({
                type: 'LOG_ENTRY',
                payload: {
                    msg: `🔗 Vinculación Axiomática: ${propertyId} <-> ${targetArtifact.LABEL}`,
                    type: 'SUCCESS'
                }
            });

            // TODO: Persistir el vínculo en el DataLobe (state.phenotype.artifacts)
            // dispatch({ type: 'UPDATE_SLOT_BINDING', payload: { slotId, propertyId, targetId: targetArtifact.id } });

            return;
        }

        // ADR-021: INJECT_PHANTOM_ARTIFACT PURGADO — los artefactos solo nacen del servidor.

        if (actionType === 'DELETE_COSMOS') {
            const { cosmosId } = payload;

            // 1. OPTIMISTIC UPDATE (Estado Soberano Inmediato)
            const currentList = state.phenotype.availableCosmos || [];
            const optimisticList = currentList.filter(c => c.id !== cosmosId);

            dispatch({ type: 'SET_AVAILABLE_COSMOS', payload: optimisticList });

            // AXIOMA: Purgado Nuclear del Rastro Local
            try {
                AxiomaticDB.deleteCosmos(`COSMOS_STATE_${cosmosId}`);
                if (localStorage.getItem('LAST_ACTIVE_COSMOS_ID') === cosmosId) {
                    localStorage.removeItem('LAST_ACTIVE_COSMOS_ID');
                }
            } catch (e) { console.error("[Store:Delete] Failed to purge local L2 cache:", e); }

            if (state.phenotype.cosmosIdentity?.id === cosmosId) {
                dispatch({ type: 'CLEAR_COSMOS_SESSION' });
            }

            // 2. EJECUCIÓN ASÍNCRONA (RealityManager)
            contextClient.deleteCosmos(cosmosId).then(async () => {
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `Cosmos ${cosmosId} borrado del servidor con éxito.`, type: 'SUCCESS' } });
                realityManager.startDiscovery(); // Refrescar lista real
            }).catch(err => {
                console.error("Delete Failed:", err);
                dispatch({ type: 'LOG_ENTRY', payload: { msg: `Fallo al borrar en servidor: ${err.message}`, type: 'ERROR' } });
                realityManager.startDiscovery();
            });

            return;
        }

        dispatch({ type: actionType, payload });

        setTimeout(() => {
            if (kernelRef.current) {
                kernelRef.current.update({ ...state, _lastAction: { type: actionType, payload } });
            }
        }, 0);
    };

    const hashInitialized = useAxiomaticState(s => s.session.hashInitialized);
    const globalLoading = useAxiomaticState(s => s.session.isLoading);

    // AXIOMA: Auto-Montaje de Sesión Persistida
    const hasAttemptedAutoMount = React.useRef(false);

    useEffect(() => {
        if (!hashInitialized) return;
        if (hasAttemptedAutoMount.current) return;

        // AXIOMA: No despertar a la fiera si no hay jaula (Core URL)
        if (!CONFIG.CORE_URL) {
            console.log("[Axiom:Store] 🔇 Connectivity not established. Reality ignition postponed.");
            return;
        }

        hasAttemptedAutoMount.current = true;
        realityManager.ignite();
    }, [hashInitialized]);

    // AXIOMA: Persistencia de Metadatos de Navegación (V11.1)
    useEffect(() => {
        const cosmosId = state.phenotype.cosmosIdentity?.id;

        // 1. Persistencia de Navegación
        localStorage.setItem('AXIOM_ANCHOR_LAYER', state.phenotype.ui.currentLayer || '');
        if (state.phenotype.focusStack?.length > 0) {
            localStorage.setItem('AXIOM_FOCUS_STACK', JSON.stringify(state.phenotype.focusStack.map(a => a.id)));
        } else {
            localStorage.removeItem('AXIOM_FOCUS_STACK');
        }

        // Persistir cosmos activo para auto-mount al recargar
        if (cosmosId) {
            localStorage.setItem('LAST_ACTIVE_COSMOS_ID', cosmosId);
        }

        // AXIOMA V12: Persistencia Continua (Memoria Eterna)
        // Cada vez que hay un cambio en la estructura o el layout, actualizamos el repositorio local (L2)
        const currentCosmosId = state.phenotype.cosmosIdentity?.id || state.phenotype.cosmosIdentity?.cosmos_id;
        if (!currentCosmosId) return;

        const currentArtifactsCount = Object.keys(state.phenotype.artifacts || {}).length;
        const currentCount = currentArtifactsCount + (state.phenotype.relationships?.length || 0);
        const lastCount = lastStructCountRef.current;

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
            AxiomaticDB.setItem(`COSMOS_STATE_${currentCosmosId}`, cosmosSnapshot);

            if (currentCount !== lastCount) {
                lastStructCountRef.current = currentCount;
                console.info(`%c 🏛️ [Axiom:L2] Reality reified in local storage.`, "color: #38bdf8;");
            }
        }
    }, [
        state.phenotype.cosmosIdentity,
        state.phenotype.artifacts,
        state.phenotype.relationships,
        state.phenotype.activeLayout,
        state.phenotype.activeFlow
        // ADR-021: state.phenotype.devLab PURGADO
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




