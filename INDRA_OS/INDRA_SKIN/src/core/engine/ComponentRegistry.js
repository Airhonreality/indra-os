/**
 * src/core/engine/ComponentRegistry.js
 * DHARMA: Vincular el Nombre (Ley) con la Forma (Materia).
 */

import IdentityVault from '../../modules/Nivel_3_Sovereignty/OMD-02_Vault/IdentityVault';
import ContextInspector from '../../modules/Nivel_2_Services/OMD-05_ContextInspector/ContextInspector';
import FlowCanvas from '../../modules/Nivel_1_Views/OMD-03_Canvas/FlowCanvas';
import AccessPortal from '../../modules/Nivel_3_Sovereignty/OMD-01_Portal/AccessPortal';
import TraceabilityMonitor from '../../modules/Nivel_3_Sovereignty/OMD-06_Traceability/TraceabilityMonitor';

/**
 * Registro Maestro de Componentes
 * Mapea 'clase_ui' del JSON Structural Law a componentes reales de React.
 */
const ComponentRegistry = {
    "MODAL_OVERLAY": AccessPortal,
    "IDENTITY_VAULT": IdentityVault,
    "CONTEXT_INSPECTOR": ContextInspector,
    "FLOW_CANVAS": FlowCanvas,
    "REAL_TIME_TERMINAL": TraceabilityMonitor,
    "EXECUTION_MONITOR": TraceabilityMonitor,
    "NEURAL_COPILOT": null
};

/**
 * Resuelve un componente basado en su tipo técnico.
 * @param {string} uiClass - El identificador del componente en el JSON.
 * @returns {React.Component|null}
 */
export const resolveComponent = (uiClass) => {
    return ComponentRegistry[uiClass] || null;
};

export default ComponentRegistry;
