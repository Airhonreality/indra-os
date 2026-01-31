/**
 * 📡 CORE CONNECTOR (Pure Logic Layer)
 * Axiom: Separación total de la UI. 
 * Este archivo gestiona la comunicación con el backend en Google Apps Script (GAS).
 */

class CoreConnector {
    constructor() {
        this.config = {
            url: '',
            apiKey: '',
            clientName: 'INDRA_V2_SOLAR_PUNK',
            version: '2.0.0'
        };
    }

    /**
     * Inicializa la configuración del conector.
     * @param {string} url - URL del despliegue de GAS.
     * @param {string} apiKey - Llave de acceso (systemToken).
     */
    init(url, apiKey) {
        this.config.url = url;
        this.config.apiKey = apiKey;
        console.log(`[CORE] Initialized for: ${url}`);
    }

    /**
     * Ejecuta una llamada al Core.
     * @param {string} executor - El ejecutor (p.ej. 'public', 'system', 'indra').
     * @param {string} method - El método a invocar.
     * @param {object} payload - Los datos de la petición.
     * @returns {Promise<any>}
     */
    async call(executor, method, payload = {}) {
        if (!this.config.url) {
            throw new Error("CORE_NOT_INITIALIZED: Debes llamar a init(url, key) antes de realizar peticiones.");
        }

        const requestBody = {
            executor,
            method,
            payload,
            systemToken: this.config.apiKey,
            context: {
                timestamp: Date.now(),
                client: this.config.clientName,
                version: this.config.version
            }
        };

        try {
            /**
             * Usamos 'text/plain' para evitar el preflight OPTIONS en GAS,
             * lo cual optimiza la velocidad y evita bloqueos de CORS básicos.
             */
            const response = await fetch(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP_ERROR: ${response.status}`);
            }

            const data = await response.json();

            if (data.success === false) {
                console.error("[CORE] Veto Error:", data.error);
                throw new Error(data.error?.message || "Error desconocido en el Core");
            }

            return data.result;
        } catch (error) {
            console.error("[CORE] Transmission Fail:", error);
            throw error;
        }
    }

    /**
     * Método de acceso por acción directa (compatibilidad con flujos de procesos).
     */
    async executeAction(action, payload = {}) {
        const body = { action, ...payload };
        // En este patrón, el body entero se envía como raíz
        return await this.call('system', 'executeAction', body);
    }
}

// Exportamos una instancia única (Singleton)
const connector = new CoreConnector();
export default connector;
