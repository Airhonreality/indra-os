/**
 * NavigationLobe.js
 * DHARMA: Custodio de la Navegación y el Enfoque (DEEP FOCUS).
 * Misión: Gestión de la pila de enfoque (Focus Stack) y UI del Grafo.
 */

export const navigationReducer = (state, action) => {
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

        case 'SET_PENDING_CONNECTION':
            return {
                ...state,
                phenotype: { ...state.phenotype, ui: { ...state.phenotype.ui, pendingConnection: action.payload } }
            };

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
                    activePulses: (state.phenotype.activePulses || []).filter(id => id !== action.payload)
                }
            };

        default:
            return state;
    }
};
