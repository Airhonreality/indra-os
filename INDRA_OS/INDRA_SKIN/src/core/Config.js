/**
 * src/core/Config.js
 * DHARMA: Gestión de Configuración Axiomática (Pure Persistence).
 * Axioma: "La soberanía reside en el navegador del usuario, no en archivos estáticos."
 */

const getUrlParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
};

const getSafePersisted = (key, urlKey) => {
    const urlVal = urlKey ? getUrlParam(urlKey) : null;
    if (urlVal) {
        localStorage.setItem(key, urlVal);
        return urlVal;
    }
    const val = localStorage.getItem(key);
    return (val && val !== 'undefined' && val !== 'null') ? val : "";
};

export const CONFIG = {
    // IDENTIDAD FIJA (No sensible)
    CLIENT_NAME: 'AXIOM_V2_ARCHITECT',
    VERSION: '2.1.0-SOVEREIGN',

    // CONECTIVIDAD DINÁMICA
    // Prioridad: URL Param > LocalStorage (Address Book)
    CORE_URL: (() => {
        const url = getSafePersisted('AXIOM_OVERRIDE_URL', 'core');
        if (url) console.log(`📡 [Config] Core URL detected: ${url}`);
        return url || "";
    })(),

    // El Token reside únicamente en el almacenamiento persistente del usuario
    SYSTEM_TOKEN: getSafePersisted('AXIOM_SESSION_TOKEN', 'token') || "",

    // Bóveda de Realidades (Cores Conocidos)
    getKnownCores: () => {
        try {
            const stored = localStorage.getItem('AXIOM_KNOWN_CORES');
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    }
};

/**
 * Persiste una nueva URL de Core y reinicia el sistema para sincronizar.
 */
export const updateCoreUrl = (newUrl) => {
    if (newUrl && newUrl.startsWith('http')) {
        localStorage.setItem('AXIOM_OVERRIDE_URL', newUrl);
        console.log("📡 Cambio de Plano de Realidad detectado. Sincronizando Core...");
        window.location.reload();
    }
};

