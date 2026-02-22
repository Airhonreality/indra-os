/**
 * InterfaceLobe.js
 * DHARMA: Controlador de Interfaz de AXIOM.
 * Misión: Gestionar exclusivamente mutaciones de UI, layout y visibilidad.
 */

export const initialInterfaceState = {
    sovereignty: {
        status: 'UNKNOWN',
        mode: 'LIVE', // ADR-021: DevLab Erradicado. Solo existe la realidad LIVE.
        theme: 'dark',
        portalOpen: false
    },
    ui: {
        dnaPanelOpen: false,
        chaosPanelOpen: false,
        currentLayer: localStorage.getItem('AXIOM_ANCHOR_LAYER') || null,
        pendingConnection: null,
        vaultPanelOpen: false
    }
    // ADR-021: devLab PURGADO del estado inicial
};

export const interfaceReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CURRENT_LAYER':
            if (action.payload) {
                localStorage.setItem('AXIOM_ANCHOR_LAYER', action.payload);
            } else {
                localStorage.removeItem('AXIOM_ANCHOR_LAYER');
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

        // ADR-021: SET_LAB_PERSPECTIVE, SET_LAB_TARGET, TOGGLE_LAB_MOCK — PURGADOS

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




