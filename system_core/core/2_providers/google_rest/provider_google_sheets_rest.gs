// =============================================================================
// ARTEFACTO: 2_providers/google_rest/provider_google_sheets_rest.gs
// CAPA: 2 — Provider Layer (Silos Federales)
// RESPONSABILIDAD: Implementación REST de Google Sheets para cuentas secundarias.
// =============================================================================

/**
 * @dharma MANIFIESTO DEL SILO (Axioma de Auto-Registro)
 */
function CONF_GOOGLE_SHEETS_REST() {
  return {
    id: 'google_sheets_rest',
    class: 'SILO',
    handle: {
      label: 'Google Sheets (Remote)',
      icon: 'GOOGLE',
      entry_point: 'https://sheets.google.com'
    },
    capabilities: {
      'TABULAR_READ': { handler: 'handleGoogleSheetsREST' },
      'TABULAR_WRITE': { handler: 'handleGoogleSheetsREST' },
      'TABULAR_DISCOVER': { handler: 'handleGoogleSheetsREST' },
      'TABULAR_METADATA': { handler: 'handleGoogleSheetsREST' }
    },
    config_schema: [
      { id: 'client_id', label: 'Client ID (Google Cloud)', type: 'text' },
      { id: 'client_secret', label: 'Client Secret', type: 'password' },
      { id: 'refresh_token', label: 'Refresh Token', type: 'password' }
    ],
    protocol_meta: {
      tabular_capability: true,
      remote_federal: true
    }
  };
}

/**
 * Orquestador de Llamadas REST para Google Sheets.
 */
function handleGoogleSheetsREST(uqo) {
  const { protocol, context_id, data } = uqo;
  
  // 1. Recuperar Credenciales del Llavero (Cuenta Secundaria)
  const secrets = INFRA_PERSISTENCE.getProviderSecrets('google_sheets_rest', uqo.account_id || 'default');
  if (!secrets) throw new Error("CREDENTIALS_NOT_FOUND: Verifique vinculación en Service Manager.");

  logInfo(`📡 [GSheets:REST] Ejecutando ${protocol} en Silo ${context_id}`);

  switch (protocol) {
    case 'TABULAR_READ':
      return _googleSheetsREST_Read(context_id, data, secrets);
    
    case 'TABULAR_DISCOVER':
      return _googleSheetsREST_Discover(secrets);

    default:
      throw new Error(`PROTOCOL_NOT_IMPLEMENTED: ${protocol} en Google REST Provider.`);
  }
}

// --- IMPLEMENTACIÓN FÍSICA (FETCH) ---

function _googleSheetsREST_Read(spreadsheetId, data, secrets) {
  const range = data.range || 'Sheet1!A1:Z100';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
  
  const token = _googleSheetsREST_GetAccessToken(secrets);
  
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': `Bearer ${token}` },
    muteHttpExceptions: true
  });

  const resData = JSON.parse(response.getContentText());
  if (response.getResponseCode() !== 200) {
    throw new Error(`GOOGLE_API_ERROR: ${resData.error?.message || 'Unknown Error'}`);
  }

  return {
    items: resData.values || [],
    metadata: {
      status: 'OK',
      range: resData.range,
      count: resData.values ? resData.values.length : 0
    }
  };
}

/**
 * Refresca y devuelve un token de acceso válido usando el cliente universal.
 */
function _googleSheetsREST_GetAccessToken(secrets) {
  if (!secrets.refresh_token || !secrets.client_id || !secrets.client_secret) {
    throw new Error("OAUTH2_MISSING_CONFIG: Falta configuración OAuth en el Silo.");
  }

  // AXIOMA DE ENCAPSULAMIENTO: Solo este provider sabe que el token_url es de Google.
  const config = {
    token_url: 'https://oauth2.googleapis.com/token', 
    client_id: secrets.client_id,
    client_secret: secrets.client_secret,
    refresh_token: secrets.refresh_token
  };

  return OAUTH2_RefreshAccess(config); 
}
