/**
 * src/core/laws/Spatial_Physics.js
 * 
 * Espejo del Genotipo L0 para Física Espacial.
 * Define la geometría canónica de los nodos y puertos.
 */

export const SPATIAL_PHYSICS = Object.freeze({
    PHYSICS: {
        CABLE_TENSION: 0.5,
        CABLE_WIDTH: 2,
        GRID_SNAP: 20,
        SEMANTIC_GRAVITY: 0.5
    },
    GEOMETRY: {
        NODE_WIDTH: 256, // Ajustado para el diseño actual (w-64 en tailwind = 256px)
        HEADER_HEIGHT: 40,
        ROW_HEIGHT: 30,
        PORT_RADIUS: 6,
        PORT_MAPPING: {
            INPUT: { x_offset: 0, anchor_type: "left-center" },
            OUTPUT: { x_offset: 256, anchor_type: "right-center" }
        }
    }
});

export default SPATIAL_PHYSICS;



