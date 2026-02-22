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
function createMapsAdapter({ errorHandler, tokenManager }) {
    if (!errorHandler) throw new Error("MapsAdapter: errorHandler is required");

    /**
     * @description Obtiene el token para una cuenta de Google (Cloud API Key).
     * @param {string|null} accountId 
     * @returns {string|null} API Key o null si debe usar el servicio nativo de GAS
     */
    function _getAccessToken(accountId) {
      if (!tokenManager) return null;
      try {
        const tokenData = tokenManager.getToken({ provider: 'google', accountId });
        return tokenData ? (tokenData.accessToken || tokenData.apiKey) : null;
      } catch (e) {
        return null;
      }
    }

    const schemas = {
        getTravelTime: {
            id: "READ_DATA",
            io: "READ",
            description: "Computes institutional travel logistics between two spatial markers.",
            traits: ["ROUTING", "LOGISTICS"]
        },
        findNearby: {
            id: "SEARCH_SPATIAL",
            io: "READ",
            description: "Executes spatial discovery to locate institutional assets or commercial entities.",
            traits: ["SENSE", "GEOLOCATION", "EXPLORE"]
        },
        geocode: {
            id: "READ_DATA",
            io: "READ",
            description: "Transforms a linguistic address stream into technical spatial coordinates (lat/lng).",
            traits: ["GEOLOCATION", "TRANSFORM"]
        }
    };

    // --- AXIOM CANON: Normalización Semántica ---

    function _mapDataEntry(item, collectionId = 'maps_nearby') {
        return {
            id: item.address || Utilities.getUuid(),
            collection: collectionId,
            fields: item,
            timestamp: new Date().toISOString(),
            raw: item
        };
    }

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

            const places = results.results.slice(0, 5).map(r => ({
                name: r.formatted_address.split(',')[0],
                address: r.formatted_address,
                location: r.geometry.location,
                types: r.types
            }));

            return {
                results: places.map(p => _mapDataEntry(p, `nearby_${type}`))
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

    function verifyConnection() {
        // Light probe: check if Maps service is available (it's a GAS built-in)
        try {
            const probe = Maps.newGeocoder();
            return { status: "ACTIVE", provider: "Google Maps Internal" };
        } catch (e) {
            return { status: "BROKEN", error: e.message };
        }
    }

  // --- SOVEREIGN CANON V14.0 (ADR-022 Compliant — Pure Source) ---
  const CANON = {
      id: "maps",
      label: "Spatial Navigation Engine",
      archetype: "adapter",
      domain: "spatial",
      REIFICATION_HINTS: {
          id: "id || place_id",
          label: "name || formatted_address || label",
          items: "results || items"
      },
      CAPABILITIES: {
          "getTravelTime": {
              "id": "READ_DATA",
              "io": "READ",
              "desc": "Computes institutional travel logistics between two spatial markers.",
              "traits": ["ROUTING", "LOGISTICS"],
              "inputs": {
                "origin": { "type": "string", "desc": "Spatial starting point." },
                "destination": { "type": "string", "desc": "Spatial target point." }
              }
          },
          "findNearby": {
              "id": "SEARCH_SPATIAL",
              "io": "READ",
              "desc": "Executes spatial discovery to locate institutional assets.",
              "traits": ["SENSE", "GEOLOCATION", "EXPLORE"],
              "inputs": {
                "location": { "type": "string", "desc": "Center coordinate or address." },
                "type": { "type": "string", "desc": "Asset category." }
              }
          },
          "geocode": {
              "id": "READ_DATA",
              "io": "READ",
              "desc": "Transforms a linguistic address stream into technical spatial coordinates.",
              "traits": ["GEOLOCATION", "TRANSFORM"],
              "inputs": {
                "address": { "type": "string", "desc": "Linguistic address descriptor." }
              }
          }
      }
  };

    return {
        id: "maps",
        label: CANON.label,
        archetype: CANON.archetype,
        domain: CANON.domain,
        description: "Industrial engine for geolocalization, logistical rounting, and spatial coordinate transformation.",
        CANON: CANON,
        
        verifyConnection: verifyConnection,
        setTokenManager: (tm) => { tokenManager = tm; },
        
        getTravelTime: getTravelTime,
        findNearby: findNearby,
        geocode: geocode
    };
}








