import { executeDirective } from './directive_executor';

/**
 * IngestBridge Singleton — MCEP Protocol & Satellite Connection (ADR-041)
 * 
 * Este Singleton desacopla la comunicación del motor de ingesta de la jerarquía de React.
 * MODELO: "Noisy Error" — Sin fallbacks silenciosos ni protocolos de emergencia.
 */
class IngestBridgeSingleton {
    constructor() {
        this.activeBridge = null;
    }

    /**
     * Inicializa el bridge.
     * @param {Object} config - { mode, coreUrl, satelliteToken, bridgeInstance }
     */
    init(config = {}) {
        if (config.mode === 'NATIVE' && config.bridgeInstance) {
            this.activeBridge = {
                mode: 'NATIVE',
                request: (directive) => config.bridgeInstance.request(directive)
            };
            console.log("[IngestBridge] Inicializado en modo NATIVE.");
            return;
        }

        if (config.mode === 'SATELLITE' && config.coreUrl && config.satelliteToken) {
            this.activeBridge = {
                mode: 'SATELLITE',
                request: (directive) => executeDirective({
                    ...directive,
                    satellite_token: config.satelliteToken
                }, config.coreUrl, config.satelliteToken)
            };
            console.log("[IngestBridge] Inicializado en modo SATELLITE.");
            return;
        }

        if (config.mode === 'PUBLIC_SATELLITE' && config.coreUrl && config.satelliteToken) {
            this.activeBridge = {
                mode: 'PUBLIC_SATELLITE',
                request: async (directive) => {
                    const payload = { ...directive, satellite_token: config.satelliteToken };
                    const res = await fetch(config.coreUrl, { 
                        method: 'POST', 
                        mode: 'cors',
                        body: JSON.stringify(payload) 
                    });
                    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
                    return await res.json();
                }
            };
            console.log("[IngestBridge] Inicializado en modo PUBLIC_SATELLITE.");
            return;
        }

        // Si se llama init() sin parámetros claros, intentamos auto-detección pero sin basura espacial
        const globalCoreUrl = window?.INDRA_CORE_URL;
        const globalSatelliteToken = window?.INDRA_SATELLITE_TOKEN;
        
        if (globalCoreUrl && globalSatelliteToken) {
            this.activeBridge = {
                mode: 'PUBLIC_SATELLITE',
                request: async (directive) => {
                    const payload = { ...directive, satellite_token: globalSatelliteToken };
                    const res = await fetch(globalCoreUrl, { method: 'POST', mode: 'cors', body: JSON.stringify(payload) });
                    return await res.json();
                }
            };
            console.log("[IngestBridge] Auto-detectado modo PUBLIC_SATELLITE.");
            return;
        }

        // --- PULVERIZACIÓN ---
        // Si llegamos aquí, no hay conexión válida. No hay fallback. Hay error ruidoso.
        console.error("[IngestBridge] FALLO CRÍTICO: Configuración de Bridge insuficiente.", config);
        throw new Error("ERROR_ALTA_PRIORIDAD: No se puede establecer Bridge de Ingesta. Se requiere modo NATIVE o SATELLITE válido.");
    }

    /**
     * Obtiene el bridge activo. Lanza error si no fue inicializado.
     */
    getBridge() {
        if (!this.activeBridge) {
            console.error("[IngestBridge] Acceso denegado: Bridge no inicializado.");
            throw new Error("SISTEMA_BLOQUEADO: El Bridge debe ser inicializado antes de procesar transferencias.");
        }
        return this.activeBridge;
    }
}

export const IngestBridge = new IngestBridgeSingleton();
window.IngestBridge = IngestBridge;
