/**
 * =============================================================================
 * SERVICIO: GoogleAuthService.js
 * RESPONSABILIDAD: Gestión soberana de la identidad y autorización de Google.
 * AXIOMA: Indra es un sistema operativo que vive sobre la suite de Google.
 * =============================================================================
 */

const CLIENT_ID = '763201635492-knsev26nk7std0kpnidfeqsringgr9v2.apps.googleusercontent.com'; // ID de cliente oficial del desarrollador
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// La suite de Poder Total de Indra (Sovereign Suite)
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive',            // Poder total sobre archivos
  'https://www.googleapis.com/auth/drive.appdata',    // La Carpeta Fantasma (Oculta)
  'https://www.googleapis.com/auth/script.projects',   // Forjar el Core
  'https://www.googleapis.com/auth/script.deployments',// Desplegar el Core
  'https://www.googleapis.com/auth/script.webapp.deploy', // Despliegue de Web App
  'https://www.googleapis.com/auth/spreadsheets',     // Bóvedas de Datos
  'https://www.googleapis.com/auth/gmail.modify',      // Orquestación de Email
  'https://www.googleapis.com/auth/calendar',         // Sincronización de Tiempo
  'https://www.googleapis.com/auth/contacts',         // Gestión de Identidades (CRM)
  'https://www.googleapis.com/auth/tasks',            // Gestión de Atenciones (Todo list)
  'https://www.googleapis.com/auth/forms',            // Sensores Externos (Forms)
  'https://www.googleapis.com/auth/youtube.readonly'    // Consumo de Medios
].join(' ');

export const GoogleAuthService = {
  /**
   * Inicia el flujo de autenticación mediante redirección de OAuth2 (Implicit Grant).
   * No requiere backend ni cliente secreto.
   */
  login() {
    const root = window.location.origin + window.location.pathname.replace(/\/$/, "");
    const redirect_uri = root + '/'; // Redirigir a la raíz para que el main.jsx capture el fragmento

    // AXIOMA: Persistencia de Intención
    // Guardamos la ruta actual (ej: #/resonate?...) para restaurarla tras el handshake de Google
    if (window.location.hash) {
      sessionStorage.setItem('INDRA_RESONANCE_INTENT', window.location.hash);
      console.log("[GoogleAuth] Intención de resonancia guardada:", window.location.hash);
    }
    
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
      `response_type=token id_token&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `nonce=${crypto.getRandomValues(new Uint32Array(1))[0]}&` +
      `prompt=select_account`;
      
    window.location.href = oauthUrl;
  },

  /**
   * Extrae los tokens del fragmento de la URL tras el callback.
   */
  handleCallback() {
    const fragment = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = fragment.get('access_token');
    const idToken = fragment.get('id_token');
    const error = fragment.get('error');

    if (error) {
        console.error('[GoogleAuth] OAuth Error:', error);
        return { error };
    }

    if (accessToken) {
        // Limpiamos la URL para una UX impecable
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        return { accessToken, idToken };
    }

    return null;
  },

  /**
   * Obtiene la identidad del usuario (email y avatar) a través del id_token o la API userinfo.
   */
  async getUserInfo(accessToken) {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Falló la obtención de identidad.');
        return await response.json();
    } catch (err) {
        console.error('[GoogleAuth] Error getUserInfo:', err);
        return null;
    }
  }
};
