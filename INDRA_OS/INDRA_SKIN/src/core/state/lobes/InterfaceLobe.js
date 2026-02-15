/**
 * InterfaceLobe.js
 * DHARMA: Controlador de Interfaz de INDRA.
 * Misión: Gestionar exclusivamente mutaciones de UI, layout y visibilidad.
 */

export const initialInterfaceState = {
    sovereignty: {
        status: 'UNKNOWN',
        mode: localStorage.getItem('INDRA_MODE') || 'LIVE',
        theme: 'dark',
        portalOpen: false
    },
    ui: {
        dnaPanelOpen: false,
        chaosPanelOpen: false,
        currentLayer: localStorage.getItem('INDRA_ANCHOR_LAYER') || null,
        pendingConnection: null,
        vaultPanelOpen: false
    },
    devLab: {
        perspective: 'VAULT',
        targetId: 'VAULT',
        isMockEnabled: true
    }
};

export const interfaceReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CURRENT_LAYER':
            if (action.payload) {
                localStorage.setItem('INDRA_ANCHOR_LAYER', action.payload);
            } else {
                localStorage.removeItem('INDRA_ANCHOR_LAYER');
            }
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    ui: { ...state.phenotype.ui, currentLayer: action.payload }
                }
            };

        case 'TOGGLE_UI_PANEL': {
            const panel = action.payload.panel;
            const currentUi = state.phenotype.ui;
            let newUi = { ...currentUi };
            if (panel === 'dna') newUi.dnaPanelOpen = !currentUi.dnaPanelOpen;
            if (panel === 'chaos') newUi.chaosPanelOpen = !currentUi.chaosPanelOpen;
            if (panel === 'vault') newUi.vaultPanelOpen = !currentUi.vaultPanelOpen;
            // Sidebars purgados (V12 Tabula Rasa)
            return {
                ...state,
                phenotype: { ...state.phenotype, ui: newUi }
            };
        }

        case 'SET_THEME':
            return {
                ...state,
                sovereignty: { ...state.sovereignty, theme: action.payload.theme }
            };

        case 'SET_MODE':
            localStorage.setItem('INDRA_MODE', action.payload.mode);
            return {
                ...state,
                sovereignty: { ...state.sovereignty, mode: action.payload.mode }
            };

        case 'TOGGLE_PORTAL':
            return {
                ...state,
                sovereignty: {
                    ...state.sovereignty,
                    portalOpen: action.payload !== undefined ? action.payload : !state.sovereignty.portalOpen
                }
            };

        case 'TOGGLE_VISUALIZATION_MODE': {
            const currentMode = state.phenotype.activeLayout?.VIEW_MODE || 'GRAPH';
            const newMode = currentMode === 'GRAPH' ? 'DASHBOARD' : 'GRAPH';
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    activeLayout: {
                        ...(state.phenotype.activeLayout || {}),
                        VIEW_MODE: newMode
                    }
                }
            };
        }

        case 'SET_LAB_PERSPECTIVE':
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    devLab: { ...state.phenotype.devLab, perspective: action.payload }
                }
            };

        case 'SET_LAB_TARGET':
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    devLab: { ...state.phenotype.devLab, targetId: action.payload }
                }
            };

        case 'TOGGLE_LAB_MOCK':
            return {
                ...state,
                phenotype: {
                    ...state.phenotype,
                    devLab: { ...state.phenotype.devLab, isMockEnabled: !state.phenotype.devLab.isMockEnabled }
                }
            };

        case 'SYSTEM_LOCKED':
            return {
                ...state,
                sovereignty: { ...state.sovereignty, status: 'LOCKED', portalOpen: false }
            };

        case 'SYSTEM_HALTED':
            return {
                ...state,
                sovereignty: { ...state.sovereignty, status: 'HALTED' }
            };

        case 'SET_LAYOUT_DIRTY':
            return {
                ...state,
                _layoutDirty: action.payload
            };

        default:
            return state;
    }
};



