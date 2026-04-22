// =============================================================================
// ARTEFACTO: 2_providers/provider_google_calendar.gs
// CAPA: 2 — Provider Layer (Silo Nativo)
// RESPONSABILIDAD: Gestión de Google Calendar vía Protocolos Canónicos ATOM.
// =============================================================================

/**
 * @dharma MANIFIESTO DEL SILO (CANÓNICO v16.2)
 */
function CONF_GOOGLE_CALENDAR() {
  return {
    id: 'google_calendar',
    class: 'SILO',
    handle: {
      label: 'Google Calendar',
      icon: 'CALENDAR',
      entry_point: 'primary'
    },
    capabilities: {
      'ATOM_READ': { handler: 'handleGoogleCalendar' },
      'ATOM_CREATE': { handler: 'handleGoogleCalendar' },
      'ATOM_UPDATE': { handler: 'handleGoogleCalendar' },
      'ATOM_DELETE': { handler: 'handleGoogleCalendar' },
      'ATOM_DISCOVER': { handler: 'handleGoogleCalendar' }
    },
    config_schema: [], 
    protocol_meta: {
      is_temporal: true,
      supported_classes: ['CALENDAR_EVENT', 'CALENDAR_MANIFEST']
    }
  };
}

/**
 * Orquestador Canónico de Calendario.
 */
function handleGoogleCalendar(uqo) {
  const { protocol, context_id, data } = uqo;
  
  logInfo(`📅 [GCal:Native] Axioma Protocolar: ${protocol}`);

  // Normalización del contexto (Entry Point)
  const calendarId = context_id || 'primary';

  switch (protocol) {
    case 'ATOM_DISCOVER':
      return _googleCalendar_Discover();
    
    case 'ATOM_READ':
      return _googleCalendar_Read(calendarId, data);

    case 'ATOM_CREATE':
      return _googleCalendar_Create(calendarId, data);

    case 'ATOM_UPDATE':
      return _googleCalendar_Update(calendarId, data);

    case 'ATOM_DELETE':
      return _googleCalendar_Delete(calendarId, data);

    default:
      throw new Error(`PROTOCOL_NOT_SUPPORTED_BY_PROVIDER: ${protocol}`);
  }
}

// --- IMPLEMENTACIÓN CANÓNICA (FÍSICA) ---

function _googleCalendar_Discover() {
  const calendars = CalendarApp.getAllCalendars();
  return {
    items: calendars.map(cal => ({
      id: cal.getId(),
      class: 'CALENDAR_MANIFEST',
      handle: {
        alias: cal.getName().toLowerCase().replace(/\s/g, '_'),
        label: cal.getName(),
        is_primary: cal.isMyPrimaryCalendar()
      },
      payload: { 
        description: cal.getDescription(),
        color: cal.getColor()
      }
    })),
    metadata: { status: 'OK' }
  };
}

function _googleCalendar_Read(calendarId, data) {
  const cal = CalendarApp.getCalendarById(calendarId);
  const start = data.start ? new Date(data.start) : new Date();
  const end = data.end ? new Date(data.end) : new Date(Date.now() + 86400000);

  const events = cal.getEvents(start, end);
  
  return {
    items: events.map(ev => ({
      id: ev.getId(),
      class: 'CALENDAR_EVENT',
      handle: { label: ev.getTitle() },
      payload: {
        description: ev.getDescription(),
        location: ev.getLocation(),
        start: ev.getStartTime().toISOString(),
        end: ev.getEndTime().toISOString(),
        colorId: ev.getColor(),
        attendees: ev.getGuestList().map(g => g.getEmail())
      }
    })),
    metadata: { status: 'OK', count: events.length }
  };
}

function _googleCalendar_Create(calendarId, data) {
  const cal = CalendarApp.getCalendarById(calendarId);
  
  const options = {
    description: data.description || '',
    location: data.location || '',
    guests: (data.attendees || []).join(','),
    sendInvites: data.sendInvites || false
  };

  const event = cal.createEvent(
    data.title || 'Nuevo Evento Indra', 
    new Date(data.start), 
    new Date(data.end), 
    options
  );

  if (data.colorId) event.setColor(data.colorId);
  
  return {
    items: [{ id: event.getId(), class: 'CALENDAR_EVENT', handle: { label: event.getTitle() } }],
    metadata: { status: 'OK' }
  };
}

function _googleCalendar_Update(calendarId, data) {
  const eventId = data.id || data.event_id;
  const cal = CalendarApp.getCalendarById(calendarId);
  const event = cal.getEventById(eventId);
  
  if (!event) throw new Error(`EVENT_NOT_FOUND: ${eventId}`);

  if (data.title) event.setTitle(data.title);
  if (data.description) event.setDescription(data.description);
  if (data.start && data.end) event.setTime(new Date(data.start), new Date(data.end));
  if (data.colorId) event.setColor(data.colorId);

  return {
    items: [{ id: event.getId(), class: 'CALENDAR_EVENT', handle: { label: event.getTitle() } }],
    metadata: { status: 'OK' }
  };
}

function _googleCalendar_Delete(calendarId, data) {
  const eventId = data.id || data.event_id;
  const cal = CalendarApp.getCalendarById(calendarId);
  const event = cal.getEventById(eventId);
  if (event) event.deleteEvent();
  
  return {
    items: [{ id: eventId, status: 'DELETED' }],
    metadata: { status: 'OK' }
  };
}
