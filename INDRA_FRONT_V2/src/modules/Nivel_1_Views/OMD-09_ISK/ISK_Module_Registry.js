/**
 * modules/isk/ISK_Module_Registry.js
 * 
 * MAPEO DE COMPONENTES DEL ISK (Indra Spatial Kernel)
 * 
 * SOBERANÍA: El ISK ahora consume servicios globales de Indra (OMD-10, OMD-05).
 */

// Módulos Internos (Específicos del ISK)
import { SpatialCanvas } from './components/SpatialCanvas';
import { StateHUD } from './components/StateHUD';

// Servicios Globales (Elevados a Indra Shared)
import { ContextExplorer } from '../../Nivel_2_Services/OMD-10_ContextExplorer/ContextExplorer';
import { ContextInspector } from '../../Nivel_2_Services/OMD-05_ContextInspector/ContextInspector';

export const ISK_MODULE_REGISTRY = {
    // Escenarios (Nivel 1)
    'spatial_canvas': SpatialCanvas,
    'state_hud': StateHUD,

    // Servicios Globales (Nivel 2) inyectados en ISK
    'semantic_data_cube': ContextExplorer, // Mantenemos el key por retrocompatibilidad con el layout
    'visual_inspector': ContextInspector   // Mantenemos el key
};

export default ISK_MODULE_REGISTRY;
