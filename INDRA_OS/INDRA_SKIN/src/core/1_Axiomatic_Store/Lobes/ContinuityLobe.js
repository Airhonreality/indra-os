/**
 * ContinuityLobe.js
 * DHARMA: Custodio de la Conciencia y la Sesión (COSMOS).
 * Misión: Manejo de Silos de datos, Bóveda (Vault) y persistencia de Realidad.
 */

export const continuityReducer = (state, action) => {
    switch (action.type) {
        case 'VAULT_LOADING': {
            return {
                ...state,
                phenotype: { ...state.phenotype, discoveryStatus: 'LOADING' }
            };
        }

        case 'COSMOS_MOUNTED': {
            const cosmosId = action.payload.id || action.payload.ID || action.payload.cosmos_id;
            console.log(`🧠 [ContinuityLobe] Mounting Realities for: ${cosmosId}`);

            // AXIOMA: Persistencia de Sesión Activa (Continuidad de Conciencia)
            localStorage.setItem('ACTUAL_REALITY', cosmosId);
            console.log(`💾 [ContinuityLobe] Reality Anchor Saved: ${cosmosId}`);

            const cosmosData = {
                ...action.payload,
                id: cosmosId,
                LABEL: action.payload.LABEL || cosmosId
            };

            // AXIOMA: Desempaquetado Genérico de Silos y Metadata Persistida
            const newSilos = action.payload?.silos || {};
            const newSiloMetadata = action.payload?.siloMetadata || {};

            // Determinismo de Vault Principal
            let primaryVaultData = newSilos.drive || newSilos.root || newSilos.vault || [];
            if (!Array.isArray(primaryVaultData)) {
                primaryVaultData = primaryVaultData.items || [];
            }

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    cosmosIdentity: cosmosData,
                    vault: primaryVaultData,
                    silos: newSilos,
                    siloMetadata: newSiloMetadata,
                    discoveryStatus: 'READY',
                    activeLayout: cosmosData, // Por defecto al montar, el layout es el cosmos mismo
                    focusStack: [cosmosData]
                }
            };
        }

        case 'UPDATE_SILO': {
            const { nodeId, dataPayload } = action.payload;
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    silos: {
                        ...state.phenotype.silos,
                        [nodeId]: dataPayload
                    }
                }
            };
        }

        case 'CLEAR_COSMOS_SESSION': {
            localStorage.removeItem('ACTUAL_REALITY');
            localStorage.removeItem('LAST_ACTIVE_COSMOS_ID');
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    cosmosIdentity: null,
                    activeLayout: null,
                    activeFlow: null,
                    vault: [],
                    artifacts: {},
                    relationships: [],
                    focusStack: [],
                    silos: {},
                    siloMetadata: {},
                    ui: {
                        ...state.phenotype.ui,
                        currentLayer: 'SELECTOR'
                    }
                }
            };
        }

        case 'UPDATE_DISCOVERY_STATUS': {
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    discoveryStatus: action.payload
                }
            };
        }

        case 'SET_AVAILABLE_COSMOS':
        case 'UPDATE_COSMOS_REGISTRY': {
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    availableCosmos: action.payload || []
                }
            };
        }

        case 'VAULT_LOAD_SUCCESS': {
            const { nodeId, data } = action.payload;
            const items = Array.isArray(data) ? data : (data.items || data.results || []);

            console.log(`🧠 [ContinuityLobe] Reifying Slow Matter for silo: ${nodeId} (${items.length} items)`);

            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    silos: {
                        ...state.phenotype.silos,
                        [nodeId]: items
                    },
                    // Si el nodo que cargó es el actual en foco, actualizamos la bóveda visual
                    vault: state.phenotype.cosmosIdentity?.id === nodeId ? items : state.phenotype.vault
                }
            };
        }

        default:
            return state;
    }
};
