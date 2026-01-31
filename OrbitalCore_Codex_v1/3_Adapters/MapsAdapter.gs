// ======================================================================
// ARTEFACTO: 3_Adapters/MapsAdapter.gs
// DHARMA: Proporcionar capacidades de geolocalización, logística y ruteo espacial.
// VERSION: 5.5.0 (MCEP-Ready)
// ======================================================================

/**
 * Factory para el MapsAdapter (Spatial Orchestrator).
 * @param {object} dependencies - Dependencias inyectadas.
 * @returns {object} El adaptador congelado.
 */
function createMapsAdapter({ errorHandler }) {
    if (!errorHandler) throw new Error("MapsAdapter: errorHandler is required");

    const schemas = {
        getTravelTime: {
            description: "Computes institutional travel logistics between two spatial markers using native routing circuits.",
            semantic_intent: "PROBE",
            io_interface: {
                inputs: {
                    origin: { type: "string", io_behavior: "GATE", description: "Primary spatial origin marker (address/coords)." },
                    destination: { type: "string", io_behavior: "GATE", description: "Target spatial destination marker." },
                    mode: { type: "string", io_behavior: "SCHEMA", description: "Technical transit mode (driving, walking, bicycling, transit)." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
                },
                outputs: {
                    durationSeconds: { type: "number", io_behavior: "STREAM", description: "Temporal duration in seconds." },
                    humanReadableDuration: { type: "string", io_behavior: "STREAM", description: "Linguistic temporal descriptor." },
                    distanceMeters: { type: "number", io_behavior: "STREAM", description: "Spatial distance in meters." },
                    status: { type: "string", io_behavior: "PROBE", description: "Logistical operation status." }
                }
            }
        },
        findNearby: {
            description: "Executes spatial discovery to locate institutional assets or commercial entities within a defined technical radius.",
            semantic_intent: "SENSOR",
            io_interface: {
                inputs: {
                    location: { type: "string", io_behavior: "GATE", description: "Spatial focus marker for discovery." },
                    type: { type: "string", io_behavior: "SCHEMA", description: "Technical category discriminator (restaurant, hospital, etc.)." },
                    radius: { type: "number", io_behavior: "SCHEMA", description: "Technical discovery radius in meters." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
                },
                outputs: {
                    results: { type: "array", io_behavior: "STREAM", description: "Collection of discovered spatial entities." }
                }
            }
        },
        geocode: {
            description: "Transforms a linguistic address stream into technical spatial coordinates (lat/lng).",
            semantic_intent: "PROBE",
            io_interface: {
                inputs: {
                    address: { type: "string", io_behavior: "STREAM", description: "Linguistic address stream to be transformed." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
                },
                outputs: {
                    lat: { type: "number", io_behavior: "STREAM", description: "Technical latitude coordinate." },
                    lng: { type: "number", io_behavior: "STREAM", description: "Technical longitude coordinate." },
                    formattedAddress: { type: "string", io_behavior: "STREAM", description: "Standardized institutional address stream." }
                }
            }
        }
    };

    /**
     * Calcula tiempo de viaje entre dos puntos.
     */
    function getTravelTime(params = {}) {
        const { origin, destination, mode = 'driving' } = params;
        
        try {
            const directions = Maps.newDirectionFinder()
                .setOrigin(origin)
                .setDestination(destination)
                .setMode(mode)
                .getDirections();

            if (directions.status !== 'OK') {
                throw errorHandler.createError("MAPS_API_ERROR", `Directions status: ${directions.status}`, { origin, destination });
            }

            const route = directions.routes[0].legs[0];
            return {
                durationSeconds: route.duration.value,
                humanReadableDuration: route.duration.text,
                distanceMeters: route.distance.value,
                status: directions.status
            };
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError("MAPS_API_ERROR", e.message, { origin, destination });
        }
    }

    /**
     * Busca lugares cerca de una ubicación.
     * Nota: Utiliza el Geocoder como fallback industrial ante la falta de Places API nativa en el servicio Maps de GAS.
     */
    function findNearby(params = {}) {
        const { location, type, radius = 1000 } = params;
        
        try {
            const results = Maps.newGeocoder().geocode(`${location} ${type}`);
            
            if (results.status !== 'OK') {
                return { results: [] };
            }

            return {
                results: results.results.slice(0, 5).map(r => ({
                    name: r.formatted_address.split(',')[0],
                    address: r.formatted_address,
                    location: r.geometry.location,
                    types: r.types
                }))
            };
        } catch (e) {
            throw errorHandler.createError("MAPS_API_ERROR", e.message, { location, type });
        }
    }

    /**
     * Codifica una dirección en coordenadas.
     */
    function geocode(params = {}) {
        const { address } = params;
        try {
            const results = Maps.newGeocoder().geocode(address);
            if (results.status !== 'OK') {
                throw errorHandler.createError("MAPS_NOT_FOUND", "No se encontró la dirección especificada.", { address });
            }
            const res = results.results[0];
            return {
                lat: res.geometry.location.lat,
                lng: res.geometry.location.lng,
                formattedAddress: res.formatted_address
            };
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError("MAPS_API_ERROR", e.message, { address });
        }
    }

    return Object.freeze({
        label: "Spatial Orchestrator",
        description: "Industrial engine for geolocalization, logistical rounting, and spatial coordinate transformation.",
        semantic_intent: "SENSOR",
        schemas: schemas,
        getTravelTime,
        findNearby,
        geocode
    });
}

