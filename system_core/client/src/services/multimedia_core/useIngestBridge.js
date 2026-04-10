import { executeDirective } from '../directive_executor';
import { useAppState } from '../../state/app_state';

/**
 * useIngestBridge - El Puente Universal (MCEP Protocol)
 * 
 * Este hook provee un canal de comunicación para la ingesta de archivos.
 * Detecta automáticamente el contexto:
 * 1. NATIVE: Dentro de Indra Core con un bridge inyectado (CapabilityBridge).
 * 2. SATELLITE: Entorno remoto con credenciales de sesión en el estado global.
 * 3. EMERGENCY: Modo fallback (Barichara) usando el Gateway hardcodeado.
 */
export function useIngestBridge(bridge = null) {
    const coreUrlFromState = useAppState(s => s.coreUrl);
    const secretFromState = useAppState(s => s.sessionSecret);

    // MODO NATIVE: El AEE nos pasa el bridge oficial del Core
    if (bridge) {
        return { 
            mode: 'NATIVE', 
            request: (directive) => bridge.request(directive) 
        };
    }

    // MODO SATELLITE: Tenemos URL y Token, pero no bridge físico (MCEP)
    if (coreUrlFromState && secretFromState) {
        return { 
            mode: 'SATELLITE', 
            request: (directive) => executeDirective(directive, coreUrlFromState, secretFromState) 
        };
    }

    // MODO PUBLIC_SATELLITE: Entorno configurado estáticamente vía SATELLITE_TOKEN (ADR-041)
    // Se usa cuando el Satélite es público (sin sesión OAuth) pero tiene llaves maestras en variables globales.
    const globalCoreUrl = window?.INDRA_CORE_URL;
    const globalSatelliteToken = window?.INDRA_SATELLITE_TOKEN;

    if (globalCoreUrl && globalSatelliteToken) {
        return {
            mode: 'PUBLIC_SATELLITE',
            request: async (directive) => {
                // Inyectar el token maestro en la directiva
                const payload = { ...directive, satellite_token: globalSatelliteToken };
                const res = await fetch(globalCoreUrl, { 
                    method: 'POST', 
                    mode: 'cors',
                    body: JSON.stringify(payload) 
                });
                return await res.json();
            }
        };
    }

    // MODO FALLBACK LEGACY (Montechico Original)
    return {
        mode: 'LEGACY_FALLBACK',
        request: async (directive) => {
            const URL = "https://script.google.com/macros/s/AKfycbyhEucpkr6GtpMqQ0LnenhP4SIUXOUJ2M4ycFIVGLBmUuxWYL6hXRTUOBESiC6LlpfA/exec";
            // Asegurar que si el servicio no inyectó el token, mandamos el omega
            const payload = { 
                satellite_token: 'indra_satellite_omega', 
                ...directive 
            };
            const res = await fetch(URL, { 
                method: 'POST', 
                mode: 'cors',
                body: JSON.stringify(payload) 
            });
            return await res.json();
        }
    };
}
