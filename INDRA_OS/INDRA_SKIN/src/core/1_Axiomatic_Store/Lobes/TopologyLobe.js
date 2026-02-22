/**
 * TopologyLobe.js
 * DHARMA: Custodio de la Estructura del Grafo (RELATIONSHIPS).
 * Misión: Asegurar la integridad referencial de las conexiones entre nodos.
 */

export const topologyReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_RELATIONSHIP': {
            const { source, target, sourcePort, targetPort } = action.payload;

            // AXIOMA: Prevenir Duplicidad de Señal
            const exists = state.phenotype.relationships.some(rel =>
                rel.source === source &&
                rel.target === target &&
                rel.sourcePort === sourcePort &&
                rel.targetPort === targetPort
            );

            if (exists) return state;

            const newRel = {
                id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                source,
                target,
                sourcePort,
                targetPort,
                _isDirty: true
            };

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    relationships: [...state.phenotype.relationships, newRel]
                }
            };
        }

        case 'REMOVE_RELATIONSHIP': {
            const { id } = action.payload;
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    relationships: state.phenotype.relationships.filter(rel => rel.id !== id)
                }
            };
        }

        case 'SYNC_RELATIONSHIPS': {
            // AXIOMA: Sincronización Masiva (vía Genotype o Cosmos)
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    relationships: action.payload || []
                }
            };
        }

        case 'REMOVE_ARTIFACT': {
            // Cascada: Si se borra un nodo, limpiar conexiones huérfanas
            const { id } = action.payload;
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    relationships: state.phenotype.relationships.filter(rel =>
                        rel.source !== id && rel.target !== id
                    )
                }
            };
        }

        case 'COSMOS_MOUNTED': {
            // AXIOMA: Reificación de Canales de Energía (TTL Zero)
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    relationships: action.payload.relationships || []
                }
            };
        }

        default:
            return state;
    }
};
