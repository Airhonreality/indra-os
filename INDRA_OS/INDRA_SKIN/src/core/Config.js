/**
 * src/core/Config.js
 * DHARMA: Gestión de Configuración Híbrida (Env + Persistence).
 * Axioma: "La conectividad debe ser administrable sin reconstruir el sistema."
 */

const getSafeEnv = (key, fallback) => {
    return import.meta.env[key] || fallback;
};

const getSafePersisted = (key) => {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null') return "";
    return val;
};

export const CONFIG = {
    // URL del Core: Prioridad LocalStorage (Override) > .env > Hardcode Fallback
    CORE_URL: getSafePersisted('INDRA_OVERRIDE_URL') ||
        getSafeEnv('VITE_CORE_URL', 'https://script.google.com/macros/s/AKfycbydiid-N9D6YW-Q5ldpRAhpi9pv6mDRwfMuFaQ97EXhR1qg8bbknwMiPI8xIL6an16o/exec'),

    // API Key (Se recomienda manejar vía Vault/Portal, no por Config)
    SYSTEM_TOKEN: getSafePersisted('INDRA_SESSION_TOKEN') || getSafeEnv('VITE_SYSTEM_TOKEN', ''),

    CLIENT_NAME: getSafeEnv('VITE_CLIENT_NAME', 'INDRA_V2_Axiom'),
    VERSION: getSafeEnv('VITE_VERSION', '2.0.0'),

    // Bóveda de Realidades (Cores Conocidos)
    getKnownCores: () => {
        const stored = localStorage.getItem('INDRA_KNOWN_CORES');
        return stored ? JSON.parse(stored) : [];
    }
};

/**
 * Función auxiliar para actualizar la URL desde la UI sin tocar código.
 */
export const updateCoreUrl = (newUrl) => {
    if (newUrl && newUrl.startsWith('http')) {
        localStorage.setItem('INDRA_OVERRIDE_URL', newUrl);
        console.log("📡 URL del Core actualizada en persistencia local. Recargando...");
        window.location.reload();
    }
};



