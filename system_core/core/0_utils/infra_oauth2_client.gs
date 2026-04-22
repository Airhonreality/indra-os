// =============================================================================
// ARTEFACTO: 0_utils/infra_oauth2_client.gs
// CAPA: 0 — Utility Layer (Infraestructura Pura)
// RESPONSABILIDAD: Cliente genérico para protocolos OAuth2.
// AXIOMA: No conoce nombres de servicios, solo URLs y parámetros.
// =============================================================================

/**
 * Realiza un Refresh Token Flow genérico.
 * @param {Object} config - Configuración { token_url, client_id, client_secret, refresh_token }
 * @returns {string} El nuevo Access Token.
 */
function OAUTH2_RefreshAccess(config) {
  const { token_url, client_id, client_secret, refresh_token } = config;

  if (!token_url || !client_id || !client_secret || !refresh_token) {
    throw new Error("OAUTH2_HANDLER_ERROR: Parámetros de refresco incompletos.");
  }

  const payload = {
    client_id: client_id,
    client_secret: client_secret,
    refresh_token: refresh_token,
    grant_type: 'refresh_token'
  };

  const options = {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(token_url, options);
    const result = JSON.parse(response.getContentText());

    if (response.getResponseCode() !== 200) {
      console.error(`[OAuth2:Fatal] Fallo en refresco: ${response.getContentText()}`);
      throw new Error(`OAUTH2_REFRESH_FAILED: ${result.error_description || result.error || 'Unknown error'}`);
    }

    return result.access_token;
  } catch (e) {
    console.error(`[OAuth2:Exception] Error crítico en transporte OAuth: ${e.message}`);
    throw e;
  }
}
