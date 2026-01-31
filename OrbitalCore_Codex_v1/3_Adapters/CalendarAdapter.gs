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
   * 
   * @param {Object} payload
   * @param {string} payload.calendarId - ID del calendario (ej: 'primary')
   * @param {string} [payload.syncToken] - Token para sincronización incremental
   * @param {string} [payload.timeMin] - Fecha mínima (ISO 8601)
   * @param {string} [payload.timeMax] - Fecha máxima (ISO 8601)
   * @param {number} [payload.maxResults=250] - Máximo de resultados por página
   * 
   * @returns {Object} { items: Array, nextSyncToken: string, nextPageToken: string }
   */
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
      
      return {
        items: response.items || [],
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
      return calendarList.items || [];
    } catch (e) {
      throw errorHandler.createError('EXTERNAL_API_ERROR', `Fallo al listar calendarios: ${e.message}`, { originalError: e.toString() });
    }
  }

  const schemas = {
    listCalendars: {
      description: "Retrieves a comprehensive list of all technical calendars accessible via the current authorization scope.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          items: { type: "array", io_behavior: "STREAM", description: "Collection of calendar metadata objects." }
        } 
      }
    },
    listEvents: {
      description: "Extracts a chronological stream of events from a target registry, permitting incremental synchronization tokens.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          calendarId: { type: "string", io_behavior: "GATE", description: "Unique calendar identifier (primary as default)." },
          timeMin: { type: "string", io_behavior: "GATE", description: "Start bound for temporal filtering (ISO 8601)." },
          syncToken: { type: "string", io_behavior: "GATE", description: "Incremental synchronization token." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          items: { type: "array", io_behavior: "STREAM", description: "Collection of event resource objects." },
          nextSyncToken: { type: "string", io_behavior: "STREAM", description: "Opaque token for subsequent delta retrieval." }
        } 
      }
    },
    createEvent: {
      description: "Initializes a high-integrity event entry within the target temporal registry.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          calendarId: { type: "string", io_behavior: "GATE", description: "Target calendar identifier." },
          eventPayload: { type: "object", io_behavior: "STREAM", description: "Full event resource definition." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          event: { type: "object", io_behavior: "PROBE", description: "Resulting event record metadata." }
        } 
      }
    },
    updateEvent: {
      description: "Applies atomic transformations (PATCH) to an existing temporal entry.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          calendarId: { type: "string", io_behavior: "GATE", description: "Target calendar identifier." },
          eventId: { type: "string", io_behavior: "GATE", description: "Unique event record identifier." },
          eventPayload: { type: "object", io_behavior: "STREAM", description: "Modified field dictionary for transformation." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          event: { type: "object", io_behavior: "PROBE", description: "Updated event record metadata." }
        } 
      }
    },
    deleteEvent: {
      description: "Permanently removes a temporal entry from the industrial registry.",
      semantic_intent: "INHIBIT",
      io_interface: { 
        inputs: {
          calendarId: { type: "string", io_behavior: "GATE", description: "Target calendar identifier." },
          eventId: { type: "string", io_behavior: "GATE", description: "Target event record identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Inhibition status confirmation." }
        } 
      }
    }
  };

  return Object.freeze({
    label: "Chronos Orchestrator",
    description: "Industrial temporal registry engine for advanced scheduling and incremental synchronization.",
    semantic_intent: "BRIDGE",
    schemas: schemas,
    listCalendars,
    listEvents,
    createEvent,
    updateEvent,
    deleteEvent
  });
}

