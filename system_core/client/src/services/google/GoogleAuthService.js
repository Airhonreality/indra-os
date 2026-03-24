/**
 * =============================================================================
 * SERVICIO: GoogleAuthService.js
 * RESPONSABILIDAD: Gestión soberana de la identidad y autorización de Google.
 * AXIOMA: Indra es un sistema operativo que vive sobre la suite de Google.
 * =============================================================================
 */

const CLIENT_ID = '1036306511394-lv1ndfubr33q69l6isv0lvv7j1m0iom4.apps.googleusercontent.com'; // TODO: Confirmar ID oficial
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// La suite completa de Indra (Sovereign Suite)
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.deployments',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/forms'
].join(' ');

export const GoogleAuthService = {
  /**
   * Inicia el flujo de autenticación mediante redirección de OAuth2 (Implicit Grant).
   * No requiere backend ni cliente secreto.
   */
  login() {
    const root = window.location.origin + window.location.pathname.replace(/\/$/, "");
    const redirect_uri = root + '/'; // Redirigir a la raíz para que el main.jsx capture el fragmento
    
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
