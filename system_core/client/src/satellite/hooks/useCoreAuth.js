/**
 * =============================================================================
 * SATÉLITE: useCoreAuth.js
 * Handshake de Soberanía: Google OAuth → Core Discovery → Sesión.
 * DHARMA: Sin dependencias externas. La sesión vive en sessionStorage.
 * =============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { discoverCore } from '../services/core_bridge';

const SESSION_KEY = 'INDRA_SAT_SESSION';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/**
 * Hook principal de autenticación del Satélite.
 * @param {string} discoveryUrl - URL del Core de Indra para descubrimiento
 */
export function useCoreAuth(discoveryUrl) {
  const [session, setSession] = useState(() => loadSession());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detectar si Google Identity Services está disponible
  const isGISReady = typeof window !== 'undefined' && !!window.google?.accounts;

  const handleLogin = useCallback(() => {
    if (!isGISReady) {
      setError('Google Identity Services no está disponible. Añade el script de GIS a tu index.html.');
      return;
    }
    if (!discoveryUrl) {
      setError('No se proporcionó una Discovery URL. Verifica la configuración del IndraBridge.');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Solicitar un ID Token con Google One Tap / Popup
    window.google.accounts.id.initialize({
      client_id: window.INDRA_GOOGLE_CLIENT_ID || '',
      callback: async (response) => {
        try {
          const coreSession = await discoverCore(response.credential, discoveryUrl);
          const fullSession = {
            ...coreSession,
            id_token: response.credential,
            expires_at: Date.now() + (1000 * 60 * 60 * 8) // 8h
          };
          saveSession(fullSession);
          setSession(fullSession);
        } catch (err) {
          setError(`Fallo en el Handshake: ${err.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    });

    window.google.accounts.id.prompt();
  }, [discoveryUrl, isGISReady]);

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  // Auto-logout si la sesión expiró
  useEffect(() => {
    if (session && session.expires_at < Date.now()) {
      handleLogout();
    }
  }, [session, handleLogout]);

  return {
    session,           // { core_url, session_secret, user_handle } | null
    isAuthenticated: !!session,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout
  };
}
