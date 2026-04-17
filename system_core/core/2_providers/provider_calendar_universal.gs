// =============================================================================
// ARTEFACTO: 2_providers/provider_calendar_universal.js
// CAPA: 2 — Providers
// RESPONSABILIDAD: Orchestrador del Silo Universal de Calendario.
//
// AXIOMA ESTRUCTURAL:
//   Este provider orquesta datos de calendarios. Su único adaptador activo
//   es adapter_google_calendar.js, que usa CalendarApp (GAS nativo).
//   NO requiere API Keys. NO requiere tokens. La identidad del Core es suficiente.
//   La sesión GAS es la aduana de entrada. Si el script corre, la autenticación ya existe.
//
// LEY DE ADUANAS — CONTRATO DE ENTRADA:
//   El UQO que llega DEBE tener: protocol, provider.
//   El context_id determina el calendarId ('primary' si no se especifica).
//
// LEY DE ADUANAS — CONTRATO DE SALIDA:
//   Todo átomo que sale DEBE tener: id, handle { ns, alias, label }, class, protocols, payload.
//   El campo payload.fields es SIEMPRE un objeto con los datos del evento.
//
// ARQUITECTURA:
//   handleCalendarUniversal (Router) -> _ucp_handle*() (Handlers) -> _gcal_*() (Adaptador Nativo)
// =============================================================================

/**
 * Manifestación del Silo Universal de Calendario.
 * @returns {Object} Contrato de configuración de Silo.
 */
function CONF_CALENDAR_UNIVERSAL() {
  return Object.freeze({
    id: 'calendar_universal',
    handle: {
      ns: 'com.indra.system.silo',
      alias: 'calendar',
      label: 'Universal Calendar'
    },
    icon: 'CALENDAR',
    // AXIOMA: Este silo NO requiere configuración de credenciales.
    // La autenticación es implícita a través del runtime de Google Apps Script.
    needs_setup: false,
    class: 'FOLDER',
    version: '2.1 (Synthesis)',
    capabilities: {
      ATOM_READ:      { sync: 'BLOCKING', purge: 'NONE', handler: 'handleCalendarUniversal' },
      ATOM_CREATE:    { sync: 'BLOCKING', purge: 'ALL',  handler: 'handleCalendarUniversal' },
      ATOM_UPDATE:    { sync: 'BLOCKING', purge: 'ID',   handler: 'handleCalendarUniversal' },
      ATOM_DELETE:    { sync: 'BLOCKING', purge: 'ALL',  handler: 'handleCalendarUniversal' },
      TABULAR_STREAM: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleCalendarUniversal' },
      HIERARCHY_TREE: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleCalendarUniversal' },
      CALENDAR_BATCH: { sync: 'ASYNC',    purge: 'ALL',  handler: 'handleCalendarUniversal' },
      ACCOUNT_RESOLVE: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleCalendarUniversal' },
      SYSTEM_CONNECTION_TEST: { sync: 'BLOCKING', purge: 'NONE', handler: 'handleCalendarUniversal' }
    },
    protocol_meta: {
      HIERARCHY_TREE: { label: 'Descubriendo Calendarios', help: 'Listando calendarios disponibles en la sesión.' },
      TABULAR_STREAM: { label: 'Sincronizando Realidades', help: 'Consolidando eventos de múltiples calendarios.' },
      CALENDAR_BATCH: { label: 'Ejecución Masiva', help: 'Aplicando cambios en bloque.' }
    }
  });
}

// =============================================================================
// ROUTER PRINCIPAL
// =============================================================================

/**
 * Punto de entrada principal del UCP.
 * AXIOMA: No hay lógica de autenticación aquí. CalendarApp ya autenticó.
 * El provider solo necesita despachar al handler correcto.
 *
 * @param {Object} uqo - Universal Query Object.
 */
function handleCalendarUniversal(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();
  logInfo(`[UCP] Despachando: ${protocol}`, { context_id: uqo.context_id });

  try {
    switch (protocol) {
      case 'ACCOUNT_RESOLVE':   return _ucp_handleAccountResolve(uqo);
      case 'HIERARCHY_TREE':    return _ucp_handleHierarchyTree(uqo);
      case 'TABULAR_STREAM':    return _ucp_handleTabularStream(uqo);
      case 'ATOM_READ':         return _ucp_handleAtomRead(uqo);
      case 'ATOM_CREATE':       return _ucp_handleAtomCreate(uqo);
      case 'ATOM_UPDATE':       return _ucp_handleAtomUpdate(uqo);
      case 'ATOM_DELETE':       return _ucp_handleAtomDelete(uqo);
      case 'CALENDAR_BATCH':    return _ucp_handleBatch(uqo);
      case 'SYSTEM_CONNECTION_TEST': return _ucp_handleConnectionTest(uqo);
      default:
        throw createError('PROTOCOL_NOT_SUPPORTED', `Protocolo ${protocol} no implementado en UCP.`);
    }
  } catch (err) {
    logError(`[UCP] Fallo crítico en ${protocol}`, err);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
  }
}

// =============================================================================
// HANDLERS DE PROTOCOLO
// =============================================================================

/**
 * ACCOUNT_RESOLVE: Identifica la cuenta activa de la sesión.
 * AXIOMA: No necesita token. Session.getActiveUser() es la fuente de verdad.
 */
function _ucp_handleAccountResolve(uqo) {
  const userEmail = Session.getActiveUser().getEmail();
  const alias     = userEmail.split('@')[0].replace(/[^\w]/g, '_');
  return {
    items: [{
      id: alias,
      handle: {
        ns: 'com.indra.calendar.account',
        alias: alias,
        label: `Google Calendar (${userEmail})`
      },
      class: 'ACCOUNT_IDENTITY',
      protocols: ['HIERARCHY_TREE', 'TABULAR_STREAM']
    }],
    metadata: { status: 'OK' }
  };
}

/**
 * HIERARCHY_TREE: Lista todos los calendarios disponibles en la sesión.
 * AXIOMA: Llama al adaptador nativo. Sin tokens.
 */
function _ucp_handleHierarchyTree(uqo) {
  logInfo(`[UCP] Listando calendarios vía CalendarApp.`);
  const calendars = _gcal_listCalendars();

  const items = calendars.map(cal => ({
    id: cal.getId(),
    handle: {
      ns: 'com.indra.calendar.folder',
      alias: _system_slugify_(cal.getName()),
      label: cal.getName()
    },
    class: 'CALENDAR_HIVE',
    provider: uqo.provider,
    protocols: ['TABULAR_STREAM', 'ATOM_READ', 'ATOM_CREATE'],
    payload: {
      fields: {
        description: cal.getDescription(),
        color:       cal.getColor(),
        is_hidden:   cal.isHidden(),
        is_owned:    cal.isOwnedByMe()
      }
    }
  }));

  return { items, metadata: { status: 'OK', total: items.length } };
}

/**
 * TABULAR_STREAM: Proyecta eventos como flujo de átomos canónicos.
 * AXIOMA: context_id es el calendarId. 'primary' si no se especifica.
 */
function _ucp_handleTabularStream(uqo) {
  const calendarId = uqo.context_id || 'primary';
  logInfo(`[UCP] Stream de eventos: calendarId=${calendarId}`);

  const events = _gcal_listEvents(calendarId, uqo.query);
  const items  = events.map(ev => _ucp_nativeEventToAtom(ev, uqo.provider, calendarId));

  return {
    items,
    metadata: {
      status: 'OK',
      total: items.length,
      schema: {
        fields: [
          { id: 'summary',     alias: 'summary',     label: 'Evento',     type: 'TEXT' },
          { id: 'start',       alias: 'start',       label: 'Inicio',     type: 'DATE' },
          { id: 'end',         alias: 'end',         label: 'Fin',        type: 'DATE' },
          { id: 'location',    alias: 'location',    label: 'Ubicación',  type: 'TEXT' },
          { id: 'description', alias: 'description', label: 'Descripción',type: 'TEXT' }
        ]
      }
    }
  };
}

/**
 * ATOM_READ: Lee un evento individual por su ID nativo.
 */
function _ucp_handleAtomRead(uqo) {
  if (!uqo.context_id) throw createError('INVALID_INPUT', 'ATOM_READ requiere context_id.');
  // context_id formato: "calendarId|eventId"
  const [calendarId, eventId] = uqo.context_id.split('|');
  const calendar = _gcal_getCalendar(calendarId);
  const event    = calendar.getEventById(eventId);
  if (!event) throw createError('NOT_FOUND', `Evento no encontrado: ${eventId}`);

  return { items: [_ucp_nativeEventToAtom(event, uqo.provider, calendarId)], metadata: { status: 'OK' } };
}

/**
 * ATOM_CREATE: Crea un evento en el calendario especificado.
 */
function _ucp_handleAtomCreate(uqo) {
  const calendarId = uqo.context_id || 'primary';
  const data       = uqo.data?.fields || uqo.data || {};
  const event      = _gcal_createEvent(calendarId, {
    title:       data.summary || data.title || 'Nuevo Evento',
    start:       data.start,
    end:         data.end,
    description: data.description,
    location:    data.location
  });
  return { items: [_ucp_nativeEventToAtom(event, uqo.provider, calendarId)], metadata: { status: 'OK' } };
}

/**
 * ATOM_UPDATE: Actualiza un evento existente.
 */
function _ucp_handleAtomUpdate(uqo) {
  if (!uqo.context_id) throw createError('INVALID_INPUT', 'ATOM_UPDATE requiere context_id.');
  const [calendarId, eventId] = uqo.context_id.split('|');
  const data                  = uqo.data?.fields || uqo.data || {};
  const event                 = _gcal_updateEvent(calendarId, eventId, {
    title:       data.summary || data.title,
    description: data.description,
    location:    data.location,
    start:       data.start,
    end:         data.end
  });
  return { items: [_ucp_nativeEventToAtom(event, uqo.provider, calendarId)], metadata: { status: 'OK' } };
}

/**
 * ATOM_DELETE: Elimina un evento del calendario.
 */
function _ucp_handleAtomDelete(uqo) {
  if (!uqo.context_id) throw createError('INVALID_INPUT', 'ATOM_DELETE requiere context_id.');
  const [calendarId, eventId] = uqo.context_id.split('|');
  _gcal_deleteEvent(calendarId, eventId);
  return { items: [], metadata: { status: 'OK' } };
}

/**
 * SYSTEM_CONNECTION_TEST: Verifica que CalendarApp puede acceder a la sesión.
 * AXIOMA: Si CalendarApp responde, la autenticación es válida. Sin token requerido.
 */
function _ucp_handleConnectionTest(uqo) {
  try {
    const cal = CalendarApp.getDefaultCalendar();
    const name = cal.getName();
    return { items: [], metadata: { status: 'OK', message: `Conectado a: ${name}` } };
  } catch (err) {
    return { items: [], metadata: { status: 'ERROR', error: `Fallo de conexión nativa: ${err.message}` } };
  }
}

/**
 * CALENDAR_BATCH: Ejecuta múltiples operaciones en lote.
 */
function _ucp_handleBatch(uqo) {
  const operations = uqo.data?.operations || [];
  logInfo(`[UCP] BATCH de ${operations.length} operaciones.`);
  const results = operations.map(op => {
    try {
      return handleCalendarUniversal({ ...uqo, ...op });
    } catch (e) {
      return { items: [], metadata: { status: 'ERROR', error: e.message } };
    }
  });
  return {
    items: results.flatMap(r => r.items || []),
    metadata: { status: 'OK', execution_id: `batch_${Date.now()}`, total: operations.length }
  };
}

// =============================================================================
// NORMALIZACIÓN: CalendarEvent nativo → Átomo Canónico Indra
// LEY DE ADUANAS — ADUANA INTERNA DEL PROVIDER
// =============================================================================

/**
 * Convierte un CalendarEvent nativo de GAS a un Átomo Canónico de Indra.
 * AXIOMA ADR-008: Este es el único punto de normalización. La materia que
 * sale de aquí ya pasa la aduana. Nunca sale sin identidad sincera.
 *
 * @param {CalendarEvent} ev - Evento nativo de CalendarApp.
 * @param {string} providerId - ID del provider activo.
 * @param {string} calendarId - ID del calendario de origen.
 * @returns {Object} Átomo canónico de Indra.
 */
function _ucp_nativeEventToAtom(ev, providerId, calendarId) {
  const nativeId = ev.getId();
  const title    = ev.getTitle() || 'Sin título';
  const start    = ev.getStartTime();
  const end      = ev.getEndTime();
  const summary  = ev.getDescription() || '';

  // 1. TRADUCCIÓN ONTOLÓGICA (AXIOMA DE INTENCIÓN)
  const ontology_type = _ucp_projectOntology(title, summary);

  // 2. EXTRACCIÓN DE PARTICIPANTES (ANCLAS DE RED)
  const guest_nodes = ev.getGuestList().map(guest => ({
    handle: {
      ns: 'com.indra.identity',
      alias: _system_slugify_(guest.getEmail()),
      label: guest.getEmail()
    },
    status: guest.getGuestStatus().toString()
  }));

  return {
    id: `${calendarId}|${nativeId}`,
    class: 'CALENDAR_EVENT',
    handle: {
      ns:    'com.indra.calendar.event',
      alias: _system_slugify_(title),
      label: title
    },
    provider:  providerId,
    protocols: ['ATOM_READ', 'ATOM_UPDATE', 'ATOM_DELETE'],
    created_at: start ? start.toISOString() : null,
    updated_at: end   ? end.toISOString()   : null,
    payload: {
      fields: {
        summary:      title,
        description:  summary,
        location:     ev.getLocation()    || '',
        start:        start ? start.toISOString() : null,
        end:          end   ? end.toISOString()   : null,
        is_all_day:   ev.isAllDayEvent(),
        status:       ev.getStatus(),
        ontology:     ontology_type,
        participants: guest_nodes,
        source_identity: {
          silo:        'google_native',
          calendar_id: calendarId,
          event_id:    nativeId
        }
      }
    }
  };
}

/**
 * PROYECTOR DE INTENCIÓN SEMÁNTICA (ONTOLOGÍA)
 * @param {string} title
 * @param {string} description
 * @returns {string} Clasificación axiomática de la actividad.
 */
function _ucp_projectOntology(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('venta') || text.includes('pago') || text.includes('cotización') || text.includes('invoices')) {
    return 'INTENT_COMMERCIAL';
  }
  if (text.includes('reunión') || text.includes('sincro') || text.includes('call') || text.includes('meet')) {
    return 'INTENT_SYNC';
  }
  if (text.includes('entrega') || text.includes('hito') || text.includes('milestone') || text.includes('deadline')) {
    return 'INTENT_MILESTONE';
  }
  if (text.includes('descanso') || text.includes('vacaciones') || text.includes('break')) {
    return 'INTENT_REST';
  }
  return 'INTENT_GENERIC';
}
