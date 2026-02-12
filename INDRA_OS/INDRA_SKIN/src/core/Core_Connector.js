/**
 * 📡 CORE CONNECTOR (Pure Logic Layer)
 * Axiom: Separación total de la UI. 
 * Este archivo gestiona la comunicación con el backend en Google Apps Script (GAS).
 */

import { CONFIG } from './Config';

class CoreConnector {
    constructor() {
        this.config = {
            url: CONFIG.CORE_URL,
            // AXIOMA: Lectura dinámica para evitar tokens obsoletos en singletons
            getApiKey: () => localStorage.getItem('INDRA_SESSION_TOKEN') || CONFIG.SYSTEM_TOKEN || "",
            clientName: CONFIG.CLIENT_NAME,
            version: CONFIG.VERSION
        };
        // Log de seguridad para el token
        const safeToken = this.config.apiKey || "";
        const tokenSummary = safeToken.length > 0
            ? `${safeToken.length} chars (starts: ${safeToken.substring(0, 3)}... ends: ...${safeToken.substring(safeToken.length - 2)})`
            : "EMPTY";
        console.warn(`[CORE] Initializing with URL: ${this.config.url} | Token: ${tokenSummary}`);
    }

    /**
     * Inicializa la configuración del conector.
     */
    init(url, apiKey) {
        this.config.url = url;
        this.config.apiKey = apiKey;
        console.warn(`[CORE] Re-Initialized for: ${url}`);
    }

    /**
     * Ejecuta una llamada al Core.
     */
    async call(executor, method, payload = {}) {
        if (!this.config.url) {
            throw new Error("CORE_NOT_INITIALIZED: Debes llamar a init(url, key) antes de realizar peticiones.");
        }

        const token = this.config.getApiKey();
        const tokenSummary = token.length > 0
            ? `${token.length} chars (starts: ${token.substring(0, 3)}... ends: ...${token.substring(token.length - 2)})`
            : "EMPTY";

        console.warn(`[CORE] Call: ${executor}:${method} | Token: ${tokenSummary}`);

        const requestBody = {
            executor,
            method,
            payload,
            // AXIOMA: Multi-Key Compatibility (V12.2)
            Axiom: token,
            systemToken: token,
            context: {
                timestamp: Date.now(),
                client: this.config.clientName,
                version: this.config.version
            }
        };

        try {
            console.warn(`[CORE] ⏳ Awaiting fetch to: ${this.config.url}...`);

            const response = await fetch(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                    // AXIOMA: No usamos headers de Auth estándar para evitar Preflight CORS en GAS.
                },
                body: JSON.stringify(requestBody)
            });

            console.warn(`[CORE] 📥 Response Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                throw new Error(`HTTP_ERROR: ${response.status}`);
            }

            const text = await response.text();
            console.warn(`[CORE] 📄 Raw Response (${text.length} chars):`, text.substring(0, 150) + '...');

            let data;
            try {
                // AXIOMA: Limpieza de Ruido (GAS HTML Injection)
                const sanitizedText = this._sanitizeResponse(text);
                data = JSON.parse(sanitizedText);
                console.warn(`[CORE] ✅ Parsed JSON keys:`, Object.keys(data));
            } catch (jsonError) {
                this._handleTransmissionError(text, jsonError);
                throw new Error("CORE_PARSING_ERROR: La respuesta del Core no es un JSON válido.");
            }

            // AXIOMA: Protocolo de Señalización (V10.0)
            // Si la respuesta trae una señal de protocolo (EJECT, WAIT, etc), el Transmuter la intercepta.
            if (data && data._SIGNAL) {
                const { _SIGNAL, payload } = data;
                console.warn(`[CORE] 📡 Signal Intercepted: ${_SIGNAL}`);

                // Importación dinámica para evitar ciclos, o usar un bus de eventos global
                // Por ahora, lanzamos un evento al window para que el Transmuter (que escucha) actúe
                // O mejor, devolvemos la señal tal cual para que la capa superior (InterdictionUnit) la procese.
                return data;
            }

            // AXIOMA: Validación de Membrana
            this._validateSovereignResponse(data);

            if (data.success === false) {
                console.error("[CORE] Veto Error:", data.error);
                const error = new Error(data.error?.message || "Error desconocido en el Core");
                // Preservar código de error para el Transmuter
                if (data.error?.code) error.code = data.error.code;
                throw error;
            }

            return data.result;
        } catch (error) {
            // AXIOMA: Diagnóstico Forense de Red (V9.5)
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                console.group("🛑 [CORE] Fallo Crítico de Handshake (Network Break)");
                console.error("Contexto:", `${executor}:${method}`);
                console.warn("Posibles Causas:");
                console.warn("1. La URL del Core ha caducado (necesitas nuevo despliegue GAS).");
                console.warn("2. Bloqueo de CORS (GAS ha devuelto una página de error HTML).");
                console.warn("3. Estás offline o el dominio script.google.com es inalcanzable.");
                console.warn("URL Intentada:", this.config.url);
                console.groupEnd();

                const enrichedError = new Error(`FALLO_DE_CONEXIÓN: El Core en ${this.config.url} no responde.`);
                enrichedError.code = 'NETWORK_DISRUPTION';
                throw enrichedError;
            }

            console.error(`[CORE] Transmission Fail (${executor}:${method}):`, error);
            throw error;
        }
    }

    /**
     * Membrana de Soberanía: Limpia trazas de diagnóstico inyectadas por GAS.
     */
    _sanitizeResponse(text) {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            return text.substring(firstBrace, lastBrace + 1);
        }
        return text;
    }

    /**
     * Membrana de Soberanía: Valida la integridad estructural de la respuesta.
     */
    _validateSovereignResponse(data) {
        if (!data || typeof data !== 'object') {
            throw new Error("VIOLACIÓN_DE_SOBERANÍA: La respuesta no es un objeto válido.");
        }
        if (data.success === undefined) {
            throw new Error("VIOLACIÓN_DE_SOBERANÍA: Estructura de respuesta corrupta (missing success bit).");
        }
    }

    /**
     * Gestión forense de errores de transmisión.
     */
    _handleTransmissionError(rawText, error) {
        console.group("🛑 [CORE] Handshake Failure: Sovereign Membrane Breach");
        console.error("Error Detail:", error.message);
        console.warn("Raw Payload (possible leak):", rawText);
        console.groupEnd();
    }

    /**
     * Método de acceso por acción directa. (Soberanía Sintáctica v12.1)
     * AXIOMA: No aplanar el payload. El Core espera un objeto 'payload' íntegro para desacoplar metadata.
     */
    async executeAction(action, payload = {}) {
        const body = { action, payload };
        return await this.call('system', 'executeAction', body);
    }
}

// Exportamos una instancia única (Singleton)
const connector = new CoreConnector();
export default connector;
