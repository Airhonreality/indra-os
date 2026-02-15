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
    // Escenarios de Manifestación (Nivel 1)
    'logic_stage': SpatialCanvas,    // El escenario principal de diseño
    'spatial_canvas': SpatialCanvas, // Alias legacy

    'logic_entities': null,          // Capa de Nodos (Caja vacía por ahora)
    'photon_links': null,            // Capa de Cables (Caja vacía por ahora)

    'state_hud': StateHUD,           // Hud de estatus

    // Servicios Globales (Nivel 2) inyectados en ISK
    'semantic_data_cube': ContextExplorer,
    'visual_inspector': ContextInspector
};

export default ISK_MODULE_REGISTRY;



