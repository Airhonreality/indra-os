/**
 * 0_Laws/Spatial_Physics.gs
 * Version: 1.0.0-STARK
 * Dharma: Geometry - The Brain of the Indra Spatial Kernel (ISK).
 * Formerly: SpatialLaws.gs
 */
var SPATIAL_PHYSICS = Object.freeze({
    /**
     * PHYSICAL LAWS (Thorne Metric ADR-004)
     */
    "PHYSICS": {
        "cable_physics": {
            "cable_tension": 0.5,
            "cable_width": 2,
            "cable_opacity": 0.6,
            "forward_tension_min": 80,
            "bezier_control_multiplier": 0.5
        },
        "interaction": {
            "grid_snap": 20,
            "semantic_gravity": 0.5,
            "influence_radius": 100,
            "repel_distance": 40 // Distancia de repulsión entre nodos
        }
    },

    /**
     * CANONICAL NODE GEOMETRY
     */
    "GEOMETRY": {
        "NODE_WIDTH": 220,
        "HEADER_HEIGHT": 40,
        "ROW_HEIGHT": 30,
        "PORT_RADIUS": 6,
        "ANCHOR_X_REPEL": 10,
        "PORT_MAPPING": {
            "INPUT": { "x_offset": 0, "anchor_type": "left-center" },
            "OUTPUT": { "x_offset": 220, "anchor_type": "right-center" },
            "Y_STRATEGY": {
                "base_offset": 40,
                "step": 30,
                "padding": 15
            }
        }
    },

    /**
     * PERFORMANCE ORCHESTRATION
     */
    "RENDERER_TUNING": {
        "viewport": {
            "zoom_min": 0.2,
            "zoom_max": 3.0,
            "initial_zoom": 1.0,
            "culling_margin": 100
        },
        "batching": {
            "max_elements_per_draw": 5000,
            "group_by": "archetype"
        }
    }
});

/**
 * LEGACY ALIAS
 */
var SpatialLaws = {
    physics: SPATIAL_PHYSICS.PHYSICS,
    geometry: {
        ...SPATIAL_PHYSICS.GEOMETRY,
        port_mapping: {
            ...SPATIAL_PHYSICS.GEOMETRY.PORT_MAPPING,
            // Re-injecting the function for backward compatibility in the legacy object
            calculate_y: (index) => SPATIAL_PHYSICS.GEOMETRY.PORT_MAPPING.Y_STRATEGY.base_offset + 
                                   (index * SPATIAL_PHYSICS.GEOMETRY.PORT_MAPPING.Y_STRATEGY.step) + 
                                   SPATIAL_PHYSICS.GEOMETRY.PORT_MAPPING.Y_STRATEGY.padding
        }
    },
    renderer_tuning: SPATIAL_PHYSICS.RENDERER_TUNING
};
