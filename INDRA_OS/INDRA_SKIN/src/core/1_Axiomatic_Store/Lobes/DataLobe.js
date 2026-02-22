/**
 * DataLobe.js
 * DHARMA: Coordinador de Órganos de Datos (Master Reducer).
 * Misión: Orquestar la mutación del Fenotipo delegando en Lobes especializados.
 * 
 * V15.0: Fragmentación Total (ADR-022 / TTGS Compliance).
 * Reducido de 700+ líneas a un ensamblador liviano.
 */

import { identityReducer } from './IdentityLobe.js';
import { topologyReducer } from './TopologyLobe.js';
import { continuityReducer } from './ContinuityLobe.js';
import { navigationReducer } from './NavigationLobe.js';

export const initialDataState = {
    phenotype: {
        vault: [],
        artifacts: {},
        relationships: [],
        silos: {},
        siloMetadata: {},
        cosmosIdentity: null,
        activeLayout: null,
        activeFlow: null,
        focusStack: [],
        activePulses: [],
        availableCosmos: [],
        discoveryStatus: 'IDLE'
    }
};

/**
 * dataReducer: El punto de entrada para cambios en el Fenotipo.
 * Aplica el patrón de "Tubos y Filtros" (TGS) donde cada acción
 * pasa por los órganos especializados.
 */
export const dataReducer = (state, action) => {
    // 1. Órgano de Identidad (Artefactos)
    let nextState = identityReducer(state, action);

    // 2. Órgano de Topología (Relaciones)
    nextState = topologyReducer(nextState, action);

    // 3. Órgano de Continuidad (Sesión/Silos)
    nextState = continuityReducer(nextState, action);

    // 4. Órgano de Navegación (UI/Focus)
    nextState = navigationReducer(nextState, action);

    // [AXIOMA] Purgas lógicas especiales (Pendiente mover a HygieneLobe si escala)
    switch (action.type) {
        case 'PURGE_LOGICAL_DELETION': {
            const idsToPurge = action.payload?.ids;
            return {
                ...nextState,
                phenotype: {
                    ...nextState.phenotype,
                    artifacts: (() => {
                        const newMap = {};
                        Object.keys(nextState.phenotype.artifacts).forEach(id => {
                            const a = nextState.phenotype.artifacts[id];
                            const shouldKeep = idsToPurge ? !(idsToPurge.includes(a.id) && a._isDeleted) : !a._isDeleted;
                            if (shouldKeep) newMap[id] = a;
                        });
                        return newMap;
                    })(),
                    relationships: nextState.phenotype.relationships.filter(r =>
                        idsToPurge ? !(idsToPurge.includes(r.id) && r._isDeleted) : !r._isDeleted
                    )
                }
            };
        }

        case 'HYDRATE_COSMOS_STATE': {
            const { silos, hydratedData } = action.payload;
            return {
                ...nextState,
                phenotype: {
                    ...nextState.phenotype,
                    silos: { ...nextState.phenotype.silos, ...silos },
                    siloMetadata: { ...nextState.phenotype.siloMetadata, ...(hydratedData.siloMetadata || {}) },
                    artifacts: hydratedData.artifacts || nextState.phenotype.artifacts
                }
            };
        }

        default:
            return nextState;
    }
};
