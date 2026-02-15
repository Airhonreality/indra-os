/**
 * StateBridge.js
 * DHARMA: Puente de Estado para Sistemas No-React
 * AXIOMA: "La realidad se comparte por contrato, no por exposición pública."
 */

let currentAxiomaticState = null;
let currentOrchestrator = null;
let currentKernel = null;
const debugLogs = [];
let spatialBindingActive = false;
let currentToolId = null;

export const StateBridge = {
    setState: (state) => {
        currentAxiomaticState = state;
    },
    getState: () => currentAxiomaticState,

    setOrchestrator: (orch) => {
        currentOrchestrator = orch;
    },
    getOrchestrator: () => currentOrchestrator,

    setKernel: (kernel) => {
        currentKernel = kernel;
    },
    getKernel: () => currentKernel,

    // [DEBUG] Sustituye a window.INDRA_DEBUG
    addLog: (msg, level = 'info', node = 'SYSTEM') => {
        const log = { msg, level, time: new Date().toLocaleTimeString(), node, timestamp: Date.now() };
        debugLogs.push(log);
        if (debugLogs.length > 500) debugLogs.shift();
    },
    getLogs: () => [...debugLogs],

    // [SPATIAL] Sustituye a window.SpatialBridge
    activateBinding: (toolId) => {
        spatialBindingActive = true;
        currentToolId = toolId;
        console.log(`[StateBridge] Spatial Binding Activated for ${toolId}`);
    },
    isBindingActive: () => spatialBindingActive,
    getCurrentTool: () => currentToolId
};




