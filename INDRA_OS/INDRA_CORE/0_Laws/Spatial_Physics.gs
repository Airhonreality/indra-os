/**
 * 0_Laws/Spatial_Physics.gs
 * Version: 5.5.0-STARK
 * Dharma: Cerebro del Indra Spatial Kernel (ISK). Geometría y física.
 */

var SPATIAL_PHYSICS = Object.freeze({
    // ============================================================
    // SECTION 1: FÍSICA DE CABLES Y SNAP (Materia L1.5)
    // ============================================================
    "PHYSICS": {
        "CABLE_TENSION": 0.5,
        "CABLE_WIDTH": 2,
        "GRID_SNAP": 20,
        "SEMANTIC_GRAVITY": 0.5
    },

    // ============================================================
    // SECTION 2: GEOMETRÍA CANÓNICA DE NODOS
    // ============================================================
    "GEOMETRY": {
        "NODE_WIDTH": 220,
        "HEADER_HEIGHT": 40,
        "ROW_HEIGHT": 30,
        "PORT_RADIUS": 6,
        "PORT_MAPPING": {
            "INPUT": { "x_offset": 0, "anchor_type": "left-center" },
            "OUTPUT": { "x_offset": 220, "anchor_type": "right-center" }
        }
    },

    // ============================================================
    // SECTION 3: TUNING DEL RENDERER
    // ============================================================
    "RENDERER_TUNING": {
        "viewport": {
            "zoom_min": 0.2,
            "zoom_max": 3.0,
            "initial_zoom": 1.0
        }
    }
});
