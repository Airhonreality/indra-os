/**
 * ======================================================================
 * ARTEFACTO: 3_Adapters/CalendarAdapter.gs
 * DHARMA: Ser el puente robusto entre el Core y Google Calendar.
 *         Soporta sincronización incremental, gestión total de 
 *         propiedades y actualizaciones atómicas (PATCH).
 * ======================================================================
 */

function createCalendarAdapter({ errorHandler }) {
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('CalendarAdapter requiere un errorHandler válido.');
  }

  // Verifica disponibilidad del Servicio Avanzado (Axioma de Entorno)
  if (typeof Calendar === 'undefined') {
    const errorMsg = 'El Servicio Avanzado "Google Calendar API" no está habilitado en este proyecto de Apps Script.';
    console.error(`[CalendarAdapter] ${errorMsg}`);
  }

  function _checkService() {
    if (typeof Calendar === 'undefined') {
      throw errorHandler.createError('ENVIRONMENT_LOCK', 'Servicio Avanzado de Calendar no disponible. Activa "Google Calendar API" en Servicios.');
    }
  }

  /**
   * Lista eventos de un calendario, soportando sincronización incremental.
   */
  // --- INDRA CANON: Normalización Semántica ---

  function _mapEventRecord(raw) {
    return {
      id: raw.id,
      title: raw.summary || "(Sin título)",
      description: raw.description || "",
      start: raw.start?.dateTime || raw.start?.date,
      end: raw.end?.dateTime || raw.end?.date,
      location: raw.location || "",
      attendees: (raw.attendees || []).map(a => ({
        email: a.email,
        displayName: a.displayName,
        responseStatus: a.responseStatus
      })),
      lastUpdated: raw.updated || new Date().toISOString(),
      raw: raw
    };
  }

  function listEvents(payload) {
    _checkService();
    const { 
      calendarId = 'primary', 
      syncToken, 
      timeMin, 
      timeMax, 
      maxResults = 250 
    } = payload;

    try {
      const options = {
        maxResults: maxResults
      };

      if (syncToken) {
        options.syncToken = syncToken;
      } else {
        if (timeMin) options.timeMin = timeMin;
        if (timeMax) options.timeMax = timeMax;
      }

      const response = Calendar.Events.list(calendarId, options);
      
      const items = (response.items || []).map(item => _mapEventRecord(item));
      
      // AXIOMA: Reducción de Entropía (Esquema de Calendario)
      const schema = {
        columns: [
          { id: 'title', label: 'EVENTO', type: 'STRING' },
          { id: 'start', label: 'INICIO', type: 'DATE' },
          { id: 'end', label: 'FIN', type: 'DATE' },
          { id: 'location', label: 'UBICACIÓN', type: 'STRING' }
        ]
      };

      return {
        results: items,
        items: items, // Backward compatibility
        ORIGIN_SOURCE: 'calendar',
        SCHEMA: schema,
        PAGINATION: {
          hasMore: !!response.nextPageToken,
          nextToken: response.nextPageToken,
          total: items.length,
          count: items.length
        },
        IDENTITY_CONTEXT: {
          accountId: payload.accountId || 'default',
          permissions: {
            canEdit: true,
            role: 'owner'
          }
        },
        nextSyncToken: response.nextSyncToken,
        nextPageToken: response.nextPageToken
      };
      
    } catch (e) {
      if (e.code === 410) {
        // Token expirado: el orquestador debe decidir si re-sincronizar completo
        throw errorHandler.createError('SYNC_TOKEN_EXPIRED', 'El syncToken ha expirado o es inválido.', { calendarId });
      }
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Fallo al listar eventos: ${e.message}`, { calendarId, originalError: e.toString() });
    }
  }

  /**
   * Crea un nuevo evento con soporte total de propiedades.
   * 
   * @param {Object} payload
   * @param {string} payload.calendarId - ID del calendario
   * @param {Object} payload.eventPayload - El recurso Event completo (v3)
   * @returns {Object} El evento creado
   */
  function createEvent(payload) {
    _checkService();
    const { calendarId = 'primary', eventPayload } = payload;
    
    try {
      if (!eventPayload || typeof eventPayload !== 'object') {
        throw errorHandler.createError('INVALID_INPUT', 'createEvent requiere un eventPayload válido.');
      }

      const createdEvent = Calendar.Events.insert(eventPayload, calendarId);
      return createdEvent;
      
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Fallo al crear evento: ${e.message}`, { calendarId, originalError: e.toString() });
    }
  }

  /**
   * Actualiza un evento existente usando la estrategia PATCH (atómica).
   * 
   * @param {Object} payload
   * @param {string} payload.calendarId - ID del calendario
   * @param {string} payload.eventId - ID del evento a modificar
   * @param {Object} payload.eventPayload - Campos a actualizar
   * @returns {Object} El evento actualizado
   */
  function updateEvent(payload) {
    _checkService();
    const { calendarId = 'primary', eventId, eventPayload } = payload;

    try {
      if (!eventId || !eventPayload) {
        throw errorHandler.createError('INVALID_INPUT', 'updateEvent requiere eventId y eventPayload.');
      }

      // El Servicio Avanzado usa Calendar.Events.patch para actualizaciones parciales
      const updatedEvent = Calendar.Events.patch(eventPayload, calendarId, eventId);
      return updatedEvent;

    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Fallo al actualizar evento ${eventId}: ${e.message}`, { calendarId, eventId, originalError: e.toString() });
    }
  }

  /**
   * Elimina un evento.
   * 
   * @param {Object} payload
   * @param {string} payload.calendarId
   * @param {string} payload.eventId
   */
  function deleteEvent(payload) {
    _checkService();
    const { calendarId = 'primary', eventId } = payload;
    
    try {
      if (!eventId) {
        throw errorHandler.createError('INVALID_INPUT', 'deleteEvent requiere eventId.');
      }

      Calendar.Events.remove(calendarId, eventId);
      return { success: true };
      
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Fallo al eliminar evento ${eventId}: ${e.message}`, { calendarId, eventId, originalError: e.toString() });
    }
  }

  /**
   * Lista los calendarios accesibles para el usuario.
   * @returns {Array} Lista de calendarios
   */
  function listCalendars() {
    _checkService();
    try {
      const calendarList = Calendar.CalendarList.list();
      const items = calendarList.items || [];
      
      return {
        results: items,
        items: items,
        ORIGIN_SOURCE: 'google_calendar',
        SCHEMA: {
          columns: [
            { id: 'summary', label: 'CALENDARIO', type: 'STRING' },
            { id: 'id', label: 'ID', type: 'STRING' },
            { id: 'accessRole', label: 'ROL', type: 'STRING' }
          ]
        },
        PAGINATION: {
          hasMore: false,
          nextToken: null,
          total: items.length,
          count: items.length
        }
      };
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Fallo al listar calendarios: ${e.message}`, { originalError: e.toString() });
    }
  }



  function calculateDuration(payload) {
    const { start, end } = payload;
    if (!start || !end) return { durationMinutes: 0 };
    const diff = new Date(end) - new Date(start);
    return { durationMinutes: Math.floor(diff / 60000) };
  }

  function verifyConnection() {
    try {
      _checkService();
      Calendar.CalendarList.list({ maxResults: 1 });
      return { status: "ACTIVE" };
    } catch (e) {
      return { status: "BROKEN", error: e.message };
    }
  }

  // --- SOVEREIGN CANON V8.0 ---
  const CANON = {
    LABEL: "Calendar Interface",
    ARCHETYPE: "ADAPTER",
    DOMAIN: "TEMPORAL",
    SEMANTIC_INTENT: "BRIDGE",
    CAPABILITIES: {
      "listCalendars": {
        "io": "READ",
        "desc": "Index accessible calendars",
        "inputs": {
          "accountId": { "type": "string", "desc": "Account selector for routing." }
        },
        "outputs": {
          "items": { "type": "array", "desc": "Collection of calendar metadata objects." }
        }
      },
      "listEvents": {
        "io": "STREAM",
        "desc": "Chronological event stream",
        "inputs": {
          "calendarId": { "type": "string", "desc": "Unique calendar identifier (primary as default)." },
          "timeMin": { "type": "string", "desc": "Start bound for temporal filtering (ISO 8601)." },
          "syncToken": { "type": "string", "desc": "Incremental synchronization token." },
          "accountId": { "type": "string", "desc": "Account selector." }
        },
        "outputs": {
          "items": { "type": "array", "desc": "Collection of Indra EventRecord." },
          "nextSyncToken": { "type": "string", "desc": "Opaque token for subsequent delta retrieval." }
        }
      },
      "createEvent": {
        "io": "WRITE",
        "desc": "Initialize high-integrity event",
        "inputs": {
          "calendarId": { "type": "string", "desc": "Target calendar identifier." },
          "eventPayload": { "type": "object", "desc": "Full event resource definition." },
          "accountId": { "type": "string", "desc": "Account selector." }
        },
        "outputs": {
          "event": { "type": "object", "desc": "Resulting event record metadata." }
        }
      },
      "updateEvent": {
        "io": "WRITE",
        "desc": "Apply atomic transformations",
        "inputs": {
          "calendarId": { "type": "string", "desc": "Target calendar identifier." },
          "eventId": { "type": "string", "desc": "Unique event record identifier." },
          "eventPayload": { "type": "object", "desc": "Modified field dictionary for transformation." },
          "accountId": { "type": "string", "desc": "Account selector." }
        },
        "outputs": {
          "event": { "type": "object", "desc": "Updated event record metadata." }
        }
      },
      "deleteEvent": {
        "io": "WRITE",
        "desc": "Permanently remove entry",
        "inputs": {
          "calendarId": { "type": "string", "desc": "Target calendar identifier." },
          "eventId": { "type": "string", "desc": "Target event record identifier." },
          "accountId": { "type": "string", "desc": "Account selector." }
        },
        "outputs": {
          "success": { "type": "boolean", "desc": "Inhibition status confirmation." }
        }
      }
    },
    VITAL_SIGNS: {
      "API_QUOTA": { "criticality": "NOMINAL", "value": "UNKNOWN", "trend": "flat" },
      "SYNC_STATUS": { "criticality": "NOMINAL", "value": "ACTIVE", "trend": "stable" }
    },
    UI_LAYOUT: {
      "SIDE_PANEL": "ENABLED",
      "TERMINAL_STREAM": "ENABLED"
    }
  };

  return {
    // Identidad Canónica (Auto-Descubrimiento)
    CANON: CANON,
    id: "calendar",

    // Legacy Bridge (Auto-generated from Canon)
    get schemas() {
      const s = {};
      for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
        s[key] = {
          description: cap.desc,
          io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
        };
      }
      return s;
    },
    // Protocol mapping (TEMPORAL_V1)
    getEvents: listEvents,
    createEvent,
    deleteEvent,
    calculateDuration,
    verifyConnection,
    // Original methods
    listCalendars,
    listEvents,
    updateEvent,
    CANON: CANON
  };
}

