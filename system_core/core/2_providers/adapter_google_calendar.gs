// =============================================================================
// ARTEFACTO: 2_providers/adapter_google_calendar.js
// CAPA: 2 — Providers (Adaptador Nativo)
// RESPONSABILIDAD: Comunicación PURA con la API nativa de CalendarApp (GAS).
//
// AXIOMA FUNDAMENTAL:
//   Este adaptador NO usa UrlFetchApp. NO necesita tokens. NO necesita API Keys.
//   Funciona exactamente como DriveApp en provider_drive:
//   La sesión del usuario ya autenticó el script. CalendarApp es un handle directo.
//
// LEY DE ADUANAS (ADR-008):
//   - ENTRADA: Parámetros primitivos (calendarId, fechas, query).
//   - SALIDA: Objetos crudos de la API de CalendarApp. Sin normalizar.
//   - La normalización a Átomo Canónico ocurre en provider_calendar_universal.
//   - Este adaptador NO conoce el protocolo UQO. Solo conoce CalendarApp.
// =============================================================================

/**
 * Lista los calendarios del usuario autenticado en la sesión GAS.
 * Equivalente a DriveApp.getFolders() en el silo de Drive.
 *
 * @returns {Calendar[]} Lista de objetos Calendar nativos de GAS.
 */
function _gcal_listCalendars() {
  return CalendarApp.getAllCalendars();
}

/**
 * Obtiene un calendario específico por su ID.
 * Equivalente a DriveApp.getFolderById() en el silo de Drive.
 *
 * @param {string} calendarId - ID del calendario ('primary' para el principal).
 * @returns {Calendar} Objeto Calendar nativo de GAS.
 */
function _gcal_getCalendar(calendarId) {
  if (!calendarId || calendarId === 'primary') {
    return CalendarApp.getDefaultCalendar();
  }
  const cal = CalendarApp.getCalendarById(calendarId);
  if (!cal) throw createError('NOT_FOUND', `Calendario no encontrado: ${calendarId}`);
  return cal;
}

/**
 * Lista los eventos de un calendario en un rango de fechas.
 * La materia cruda que sale aquí es normalizada por el orchestrador.
 *
 * @param {string} calendarId - ID del calendario.
 * @param {Object} query - Filtros: { start, end, search }.
 * @returns {CalendarEvent[]} Lista de eventos nativos de GAS.
 */
function _gcal_listEvents(calendarId, query) {
  const calendar = _gcal_getCalendar(calendarId);

  // Ventana temporal por defecto: hoy hasta 30 días hacia adelante
  const now = new Date();
  const start = query?.start ? new Date(query.start) : now;
  const end   = query?.end   ? new Date(query.end)   : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const options = { includeDeleted: false };
  if (query?.search) options.search = query.search;

  return calendar.getEvents(start, end, options);
}

/**
 * Crea un evento en el calendario especificado.
 *
 * @param {string} calendarId - ID del calendario destino.
 * @param {Object} data - Datos del evento: { title, start, end, description, location }.
 * @returns {CalendarEvent} El evento recién creado.
 */
function _gcal_createEvent(calendarId, data) {
  const calendar = _gcal_getCalendar(calendarId);
  if (!data.title || !data.start || !data.end) {
    throw createError('INVALID_INPUT', 'ATOM_CREATE requiere title, start y end.');
  }

  const options = {};
  if (data.description) options.description = data.description;
  if (data.location)    options.location    = data.location;

  return calendar.createEvent(data.title, new Date(data.start), new Date(data.end), options);
}

/**
 * Actualiza un evento existente por su ID nativo.
 *
 * @param {string} calendarId - ID del calendario.
 * @param {string} eventId - ID nativo del evento en GAS (event.getId()).
 * @param {Object} updates - Campos a actualizar: { title, description, location }.
 * @returns {CalendarEvent} El evento actualizado.
 */
function _gcal_updateEvent(calendarId, eventId, updates) {
  const calendar = _gcal_getCalendar(calendarId);
  const event = calendar.getEventById(eventId);
  if (!event) throw createError('NOT_FOUND', `Evento no encontrado: ${eventId}`);

  if (updates.title)       event.setTitle(updates.title);
  if (updates.description) event.setDescription(updates.description);
  if (updates.location)    event.setLocation(updates.location);
  if (updates.start && updates.end) {
    event.setTime(new Date(updates.start), new Date(updates.end));
  }
  return event;
}

/**
 * Elimina un evento por su ID nativo.
 *
 * @param {string} calendarId - ID del calendario.
 * @param {string} eventId - ID nativo del evento.
 */
function _gcal_deleteEvent(calendarId, eventId) {
  const calendar = _gcal_getCalendar(calendarId);
  const event = calendar.getEventById(eventId);
  if (!event) throw createError('NOT_FOUND', `Evento no encontrado: ${eventId}`);
  event.deleteEvent();
}
