// =============================================================================
// ARTEFACTO: 2_providers/google_rest/provider_google_calendar_rest.gs
// CAPA: 2 — Provider Layer (Silo Federal)
// RESPONSABILIDAD: Gestión de Google Calendar vía Protocolos Canónicos ATOM (REST).
// =============================================================================

/**
 * @dharma MANIFIESTO DEL SILO (CANÓNICO v16.2)
 */
function CONF_GOOGLE_CALENDAR_REST() {
  return {
    id: 'google_calendar_rest',
    class: 'SILO',
    handle: {
      label: 'Google Calendar (Remote)',
      icon: 'GOOGLE',
      entry_point: 'primary'
    },
    capabilities: {
      'ATOM_READ': { handler: 'handleGoogleCalendarREST' },
      'ATOM_CREATE': { handler: 'handleGoogleCalendarREST' },
      'ATOM_UPDATE': { handler: 'handleGoogleCalendarREST' },
      'ATOM_DELETE': { handler: 'handleGoogleCalendarREST' },
      'ATOM_DISCOVER': { handler: 'handleGoogleCalendarREST' }
    },
    config_schema: [
      { id: 'client_id', label: 'Client ID', type: 'text' },
      { id: 'client_secret', label: 'Client Secret', type: 'password' },
      { id: 'refresh_token', label: 'Refresh Token', type: 'password' }
    ],
    protocol_meta: {
      is_temporal: true,
      remote_federal: true,
      supported_classes: ['CALENDAR_EVENT', 'CALENDAR_MANIFEST']
    }
  };
}

/**
 * Orquestador Canónico REST de Calendario.
 */
function handleGoogleCalendarREST(uqo) {
  const { protocol, context_id, data } = uqo;
  
  const secrets = INFRA_PERSISTENCE.getProviderSecrets('google_calendar_rest', uqo.account_id || 'default');
  if (!secrets) throw new Error("CREDENTIALS_NOT_FOUND: Nexo social no establecido.");

  logInfo(`📡 [GCal:REST] Axioma Protocolar: ${protocol}`);
  const calendarId = context_id || 'primary';

  switch (protocol) {
    case 'ATOM_DISCOVER':
      return _googleCalendarREST_Discover(secrets);
    
    case 'ATOM_READ':
      return _googleCalendarREST_Read(calendarId, data, secrets);

    case 'ATOM_CREATE':
      return _googleCalendarREST_Create(calendarId, data, secrets);

    case 'ATOM_DELETE':
      return _googleCalendarREST_Delete(calendarId, data, secrets);

    default:
      throw new Error(`PROTOCOL_NOT_SUPPORTED_BY_PROVIDER: ${protocol} (REST)`);
  }
}

// --- IMPLEMENTACIÓN FÍSICA (FETCH REST) ---

function _googleCalendarREST_Discover(secrets) {
  const token = _googleCalendarREST_GetAccessToken(secrets);
  const url = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
  
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const resData = JSON.parse(response.getContentText());
  return {
    items: (resData.items || []).map(item => ({
      id: item.id,
      class: 'CALENDAR_MANIFEST',
      handle: {
        alias: item.summary.toLowerCase().replace(/\s/g, '_'),
        label: item.summary,
        is_primary: item.primary || false
      },
      payload: { 
        description: item.description,
        color: item.backgroundColor
      }
    })),
    metadata: { status: 'OK' }
  };
}

function _googleCalendarREST_Read(calendarId, data, secrets) {
  const token = _googleCalendarREST_GetAccessToken(secrets);
  const calId = encodeURIComponent(calendarId || 'primary');
  
  const timeMin = data.start ? new Date(data.start).toISOString() : new Date().toISOString();
  const timeMax = data.end ? new Date(data.end).toISOString() : new Date(Date.now() + 86400000).toISOString();
  
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true`;
  
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const resData = JSON.parse(response.getContentText());
  return {
    items: (resData.items || []).map(ev => ({
      id: ev.id,
      class: 'CALENDAR_EVENT',
      handle: { label: ev.summary },
      payload: {
        description: ev.description,
        location: ev.location,
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
        colorId: ev.colorId,
        attendees: (ev.attendees || []).map(a => a.email),
        link: ev.htmlLink
      }
    })),
    metadata: { status: 'OK', count: (resData.items || []).length }
  };
}

function _googleCalendarREST_Create(calendarId, data, secrets) {
  const token = _googleCalendarREST_GetAccessToken(secrets);
  const calId = encodeURIComponent(calendarId);
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?sendUpdates=${data.sendInvites ? 'all' : 'none'}`;

  const payload = {
    summary: data.title || 'Nuevo Evento Indra (REST)',
    description: data.description,
    location: data.location,
    start: { dateTime: new Date(data.start).toISOString() },
    end: { dateTime: new Date(data.end).toISOString() },
    attendees: (data.attendees || []).map(email => ({ email })),
    colorId: data.colorId || null
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': `Bearer ${token}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const resData = JSON.parse(response.getContentText());
  return {
    items: [{ id: resData.id, class: 'CALENDAR_EVENT', handle: { label: resData.summary } }],
    metadata: { status: 'OK' }
  };
}

function _googleCalendarREST_Delete(calendarId, data, secrets) {
  const token = _googleCalendarREST_GetAccessToken(secrets);
  const calId = encodeURIComponent(calendarId);
  const eventId = data.id || data.event_id;
  const url = `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${eventId}`;

  UrlFetchApp.fetch(url, {
    method: 'delete',
    headers: { 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  });

  return {
    items: [{ id: eventId, status: 'DELETED' }],
    metadata: { status: 'OK' }
  };
}

/**
 * Refresca y devuelve un token de acceso válido usando el cliente universal.
 */
function _googleCalendarREST_GetAccessToken(secrets) {
  const config = {
    token_url: 'https://oauth2.googleapis.com/token',
    client_id: secrets.client_id,
    client_secret: secrets.client_secret,
    refresh_token: secrets.refresh_token
  };
  return OAUTH2_RefreshAccess(config);
}
