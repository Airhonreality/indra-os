/**
 * DataLobe.js
 * DHARMA: Gestor de Datos del Fenotipo.
 * Misión: Manejo de Silos, Caché L1, Artefactos y Relaciones.
 */
import Validator_IO_node_Data from '../Infrastructure/Validator_IO_node_Data';
import { injectAxiomaticMock } from '../Infrastructure/AxiomaticMocks';


export const initialDataState = {
    phenotype: {
        vault: [],
        artifacts: [],
        relationships: [],
        silos: {},
        siloMetadata: {},
        cosmosIdentity: null,
        activeLayout: null,
        activeFlow: null,
        focusStack: [],
        activePulses: [],
        // AXIOMA V12: Registro de Universos (Discovery)
        availableCosmos: [],
        discoveryStatus: 'IDLE'
    }
};

export const dataReducer = (state, action) => {
    switch (action.type) {
        case 'SELECT_ARTIFACT': {
            const targetArtifact = action.payload;
            if (!targetArtifact || (state.phenotype.cosmosIdentity && targetArtifact.id === state.phenotype.cosmosIdentity.id)) {
                return {
                    ...state,
                    phenotype: {
                        ...state.phenotype,
                        activeLayout: state.phenotype.cosmosIdentity,
                        focusStack: [state.phenotype.cosmosIdentity].filter(Boolean)
                    }
                };
            }
            const newStack = [...(state.phenotype.focusStack || [])];
            if (!newStack.some(a => a.id === targetArtifact.id)) newStack.push(targetArtifact);
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    activeLayout: targetArtifact,
                    focusStack: newStack
                }
            };
        }

        case 'EXIT_FOCUS': {
            const currentStack = [...(state.phenotype.focusStack || [])];
            currentStack.pop();
            const previousArtifact = currentStack[currentStack.length - 1] || state.phenotype.cosmosIdentity;
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    activeLayout: previousArtifact,
                    focusStack: currentStack
                }
            };
        }

        case 'VAULT_LOAD_SUCCESS': {
            const nodeId = action.payload.nodeId || 'unknown_node';
            const dataPayload = action.payload.data;
            const items = Array.isArray(dataPayload) ? dataPayload : (dataPayload.results || dataPayload.items || []);
            const metadata = dataPayload.metadata || { hydrationLevel: 100, total: items.length };

            // AXIOMA: Reificación Directa (Auto-Render)
            // 1. Si el silo cargado es el artefacto que estamos mirando, inyectamos la data al vuelo.
            let updatedActiveLayout = state.phenotype.activeLayout;
            if (updatedActiveLayout?.id === nodeId) {
                updatedActiveLayout = { ...updatedActiveLayout, ...dataPayload, items };
            }

            // 2. Propagación a Artefactos del Grafo (Evitar limbo de datos en el Diagrama Fractal)
            const updatedArtifacts = (state.phenotype.artifacts || []).map(art => {
                // Buscamos coincidencia por ID (Soberanía de Identidad)
                if (art.id === nodeId || art.data?.id === nodeId) {
                    return {
                        ...art,
                        data: { ...art.data, ...dataPayload, items, _reifiedAt: Date.now() }
                    };
                }
                return art;
            });

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    activeLayout: updatedActiveLayout,
                    artifacts: updatedArtifacts,
                    vault: items, // AXIOMA: La última carga exitosa es la vista activa del Vault.
                    silos: { ...state.phenotype.silos, [nodeId]: items },
                    siloMetadata: {
                        ...state.phenotype.siloMetadata,
                        [nodeId]: {
                            ...metadata,
                            ORIGIN_SOURCE: dataPayload.ORIGIN_SOURCE,
                            SCHEMA: dataPayload.SCHEMA,
                            PAGINATION: dataPayload.PAGINATION,
                            IDENTITY_CONTEXT: dataPayload.IDENTITY_CONTEXT
                        }
                    }
                }
            };
        }

        case 'VAULT_WRITE': {
            const newNode = action.payload;
            const updatedVault = [newNode, ...state.phenotype.vault.filter(n => n.id !== newNode.id)];
            return {
                ...state,
                phenotype: { ...state.phenotype, vault: updatedVault }
            };
        }

        case 'UPDATE_ARTIFACT_POSITION': {
            const { nodeId, x, y } = action.payload;
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: state.phenotype.artifacts.map(node =>
                        node.id === nodeId ? { ...node, x, y, _isDirty: true } : node
                    )
                }
            };
        }

        case 'ADD_ARTIFACT_REQUEST': {
            const { artifact, position, schemaId } = action.payload;
            const nodeCount = state.phenotype.artifacts?.length || 0;
            const dispersionOffset = nodeCount * 30;
            const safePos = position || { x: dispersionOffset, y: dispersionOffset };

            const label = artifact.LABEL || artifact.label || artifact.functional_name || artifact.name || 'Manifested Protocol';
            const domain = (artifact.DOMAIN || artifact.domain || 'SYSTEM').toUpperCase();

            // AXIOMA: Inferencia de Arquetipo basada en MimeType o Definición Explícita
            let archetype = artifact.ARCHETYPE || artifact.archetype || 'NODE';
            let capabilities = artifact.CAPABILITIES || artifact.capabilities || artifact.schemas || {};

            if (archetype === 'BRIDGE') archetype = 'VAULT';

            const isDatabase =
                artifact.mimeType === 'application/vnd.indra.notion-db' ||
                artifact.mimeType === 'application/vnd.google-apps.spreadsheet' ||
                artifact.mimeType?.includes('sheet') ||
                artifact.type === 'DATABASE' ||
                archetype === 'DATABASE';

            if (isDatabase) {
                archetype = 'DATABASE';
                capabilities = {
                    ...capabilities,
                    "rows": { "io": "OUTPUT", "type": "JSON", "human_label": "Data Rows 🔢" },
                    "query": { "io": "INPUT", "type": "QUERY", "human_label": "Query Filter 🔍" }
                };
            }

            const newGraphNode = {
                id: artifact.id || `temp_node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                schemaId: schemaId || (artifact?.type === 'DIRECTORY' ? 'FOLDER_NODE' : 'FILE_NODE'),
                LABEL: label,
                DOMAIN: domain,
                ARCHETYPE: archetype,
                x: safePos.x,
                y: safePos.y,
                data: artifact || {},
                CAPABILITIES: capabilities,
                _isDirty: true // AXIOMA: Soberanía de Escritura
            };

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: [...(state.phenotype.artifacts || []), newGraphNode]
                }
            };
        }

        case 'COSMOS_MOUNTED': {
            const flowState = action.payload?.flow_state || {};
            const cosmosData = {
                ...action.payload,
                id: action.payload.id || action.payload.cosmos_id || action.payload.ID
            };

            // AXIOMA: Desempaquetado Genérico de Silos
            const newSilos = {};
            const newSiloMetadata = {};
            let primaryVaultData = [];

            Object.entries(flowState).forEach(([key, silo]) => {
                const items = Array.isArray(silo) ? silo : (silo?.items || silo?.vault_tree || []);
                newSilos[key] = items;
                newSiloMetadata[key] = {
                    hydrationLevel: action.payload?._SIGNAL === 'PATIENCE_TOKEN' ? 20 : 100,
                    status: 'SYNCED',
                    total: items.length,
                    source: 'CACHE'
                };
                // Si es el primer silo o se llama drive/root, lo usamos como vista inicial
                if (!primaryVaultData.length || key === 'drive' || key === 'root') {
                    primaryVaultData = items;
                }
            });

            return {
                ...state,
                sovereignty: { ...state.sovereignty, status: 'ACTIVE' },
                phenotype: {
                    ...state.phenotype,
                    cosmosIdentity: cosmosData,
                    activeLayout: cosmosData,
                    focusStack: cosmosData ? [cosmosData] : [],
                    isDeepHydrating: action.payload?._SIGNAL === 'PATIENCE_TOKEN',
                    ui: { ...state.phenotype.ui, currentLayer: null },
                    silos: { ...state.phenotype.silos, ...newSilos },
                    vault: primaryVaultData,
                    siloMetadata: { ...state.phenotype.siloMetadata, ...newSiloMetadata },
                    artifacts: action.payload?.artifacts || [],
                    relationships: action.payload?.relationships || []
                }
            };
        }

        case 'ADD_RELATIONSHIP': {
            const { source, target, sourcePort, targetPort } = action.payload;
            const exists = (state.phenotype.relationships || []).some(r =>
                r.source === source && r.target === target &&
                r.sourcePort === sourcePort && r.targetPort === targetPort
            );
            if (exists) return state;

            // Tarea 2: Validación de Polaridad (Sentinel)
            const sourceNode = state.phenotype.artifacts.find(n => n.id === source);
            const targetNode = state.phenotype.artifacts.find(n => n.id === target);
            if (!Validator_IO_node_Data.validateRelationship(sourceNode, targetNode, action.payload)) {
                return state;
            }

            const newRelationship = {
                id: `temp_rel_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                source, target, sourcePort, targetPort,
                created_at: new Date().toISOString(),
                _isDirty: true
            };

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    relationships: [...(state.phenotype.relationships || []), newRelationship],
                    ui: { ...state.phenotype.ui, pendingConnection: null },
                    _relationshipsDirty: true
                }
            };
        }

        case 'VAULT_LOADING': {
            const loadingNodeId = action.payload?.nodeId?.toLowerCase();
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    siloMetadata: {
                        ...state.phenotype.siloMetadata,
                        [loadingNodeId]: {
                            ...state.phenotype.siloMetadata[loadingNodeId],
                            hydrationLevel: 5,
                            status: 'SCANNING'
                        }
                    }
                }
            };
        }

        case 'HYDRATION_LOADING':
            return state; // AHORA MANEJADO POR AxiomaticState.setLoading

        case 'VAULT_ITEM_DELETED': {
            const delNodeId = (action.payload.nodeId || 'drive').toLowerCase();
            const delSilo = state.phenotype.silos[delNodeId] || [];
            const itemId = action.payload.itemId;

            const now = Date.now();
            const currentCycle = (window.useAxiomaticState?.getState?.() || { session: { revisionCycle: 0 } }).session.revisionCycle;

            // Tarea 1: Marcado Lógico (Tombstone Protocol)
            // No borramos físicamente aún; creamos una "Lápida" con marca de tiempo y ciclo.
            const updatedArtifacts = state.phenotype.artifacts.map(art =>
                art.data?.id === itemId ? { ...art, _isDeleted: true, _isDirty: true, _tombstoneAt: now, _deathCycle: currentCycle } : art
            );

            // Tarea 4: Integridad Referencial (Edge Integrity)
            const deletedArtIds = updatedArtifacts.filter(a => a._isDeleted && a.data?.id === itemId).map(a => a.id);
            const updatedRelationships = state.phenotype.relationships.map(rel =>
                deletedArtIds.includes(rel.source) || deletedArtIds.includes(rel.target)
                    ? { ...rel, _isDeleted: true, _isDirty: true, _tombstoneAt: now, _deathCycle: currentCycle }
                    : rel
            );

            const relsChanged = updatedRelationships !== state.phenotype.relationships;

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    vault: state.phenotype.vault.filter(n => n.id !== itemId),
                    silos: {
                        ...state.phenotype.silos,
                        [delNodeId]: Array.isArray(delSilo) ? delSilo.filter(n => n.id !== itemId) : delSilo
                    },
                    artifacts: updatedArtifacts,
                    relationships: updatedRelationships,
                    _relationshipsDirty: state.phenotype._relationshipsDirty || relsChanged
                }
            };
        }

        case 'VAULT_ITEM_RENAMED': {
            const renNodeId = (action.payload.nodeId || 'drive').toLowerCase();
            const renSilo = state.phenotype.silos[renNodeId] || [];
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    vault: state.phenotype.vault.map(n => n.id === action.payload.itemId ? { ...n, name: action.payload.newName } : n),
                    silos: {
                        ...state.phenotype.silos,
                        [renNodeId]: Array.isArray(renSilo) ? renSilo.map(n => n.id === action.payload.itemId ? { ...n, name: action.payload.newName } : n) : renSilo
                    },
                    artifacts: state.phenotype.artifacts.map(node =>
                        node.data?.id === action.payload.itemId ? { ...node, LABEL: action.payload.newName, _isDirty: true } : node
                    )
                }
            };
        }

        case 'VAULT_ITEM_MOVED': {
            const movNodeId = (action.payload.nodeId || 'drive').toLowerCase();
            const movSilo = state.phenotype.silos[movNodeId] || [];
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    vault: state.phenotype.vault.filter(n => n.id !== action.payload.itemId),
                    silos: {
                        ...state.phenotype.silos,
                        [movNodeId]: Array.isArray(movSilo) ? movSilo.filter(n => n.id !== action.payload.itemId) : movSilo
                    }
                }
            };
        }

        case 'HYDRATE_FROM_PERSISTENCE': {
            if (state.phenotype.cosmosIdentity?.id !== action.payload.cosmosId) return state;
            const hydratedData = action.payload.hydratedData || {};

            // Reificar silas desde la hidratación
            const silos = hydratedData.silos || {};
            let mainVault = state.phenotype.vault;

            // Si hay un silo de drive o root en la hidratación, actualizamos el vault principal
            if (silos.drive) mainVault = Array.isArray(silos.drive) ? silos.drive : (silos.drive.items || silos.drive.vault_tree || []);
            else if (silos.root) mainVault = Array.isArray(silos.root) ? silos.root : (silos.root.items || silos.root.vault_tree || []);

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    ...hydratedData,
                    vault: mainVault,
                    silos: {
                        ...state.phenotype.silos,
                        ...silos
                    },
                    siloMetadata: {
                        ...state.phenotype.siloMetadata,
                        ...hydratedData.siloMetadata
                    }
                }
            };
        }

        case 'CLEAR_COSMOS_SESSION':
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    cosmosIdentity: null,
                    activeLayout: null,
                    activeFlow: null,
                    artifacts: [],
                    relationships: [],
                    focusStack: [],
                    ui: {
                        ...state.phenotype.ui,
                        currentLayer: state.phenotype.ui.currentLayer === 'DEV_LAB' ? 'DEV_LAB' : 'SELECTOR'
                    }
                }
            };

        case 'SET_PENDING_CONNECTION':
            return {
                ...state,
                phenotype: { ...state.phenotype, ui: { ...state.phenotype.ui, pendingConnection: action.payload } }
            };

        case 'PURGE_LOGICAL_DELETION': {
            const idsToPurge = action.payload?.ids;
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: state.phenotype.artifacts.filter(a =>
                        idsToPurge ? !(idsToPurge.includes(a.id) && a._isDeleted) : !a._isDeleted
                    ),
                    relationships: state.phenotype.relationships.filter(r =>
                        idsToPurge ? !(idsToPurge.includes(r.id) && r._isDeleted) : !r._isDeleted
                    )
                }
            };
        }

        case 'CLEAR_PENDING_CONNECTION':
            return {
                ...state,
                phenotype: { ...state.phenotype, ui: { ...state.phenotype.ui, pendingConnection: null } }
            };

        case 'PULSE_START':
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    activePulses: [...state.phenotype.activePulses, action.payload]
                }
            };

        case 'PULSE_END':
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    activePulses: state.phenotype.activePulses.filter(id => id !== action.payload)
                }
            };

        case 'PURGE_TOMBSTONES': {
            const currentCycle = (window.useAxiomaticState?.getState?.() || { session: { revisionCycle: 0 } }).session.revisionCycle;

            const soulsToKeep = (item) => {
                if (!item._isDeleted) return true;
                // AXIOMA: Poda de 2 Ciclos (Capa 0.9)
                // Solo purgamos si han pasado al menos 2 rotaciones de realidad.
                const deathAge = currentCycle - (item._deathCycle || 0);
                return deathAge < 2;
            };

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: state.phenotype.artifacts.filter(soulsToKeep),
                    relationships: state.phenotype.relationships.filter(soulsToKeep)
                }
            };
        }

        case 'UPDATE_COSMOS_REGISTRY':
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    availableCosmos: action.payload || [],
                    discoveryStatus: 'READY'
                }
            };

        case 'SET_DISCOVERY_STATUS':
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    discoveryStatus: action.payload
                }
            };

        case 'REMOVE_ARTIFACT': {
            const artifactId = action.payload.id;
            const now = Date.now();
            const currentCycle = (window.useAxiomaticState?.getState?.() || { session: { revisionCycle: 0 } }).session.revisionCycle;

            // 1. Marcar Artefacto (Tombstone)
            const updatedArtifacts = state.phenotype.artifacts.map(art => {
                const isMatch = String(art.id).toLowerCase() === String(artifactId).toLowerCase();
                return isMatch
                    ? { ...art, _isDeleted: true, _isDirty: true, _tombstoneAt: now, _deathCycle: currentCycle }
                    : art;
            });

            // 2. Marcar Relaciones (Integridad)
            const updatedRelationships = state.phenotype.relationships.map(rel => {
                const isSource = String(rel.source).toLowerCase() === String(artifactId).toLowerCase();
                const isTarget = String(rel.target).toLowerCase() === String(artifactId).toLowerCase();
                return (isSource || isTarget)
                    ? { ...rel, _isDeleted: true, _isDirty: true, _tombstoneAt: now, _deathCycle: currentCycle }
                    : rel;
            });

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    artifacts: updatedArtifacts,
                    relationships: updatedRelationships,
                    _relationshipsDirty: true
                }
            };
        }

        default:
            return state;
    }
};
