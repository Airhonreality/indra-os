/**
 * SessionGatekeeper.js
 * DHARMA: Centinela de Ignición (Capa 0.5)
 * 
 * El Primer Proceso.
 * Se ejecuta antes de que React monte el árbol.
 * Valida el ancla del localStorage contra el SessionCommander (simulado por ahora).
 * Decide si el sistema entra en:
 * - PORTAL (Sin sesión)
 * - COSMOS (Sesión validada)
 * - RECOVERY (Sesión dañada legible)
 */

import useAxiomaticState from './AxiomaticState.js';
import InterdictionUnit from './InterdictionUnit.js'; // Usamos la unidad, no el conector directo

const SessionGatekeeper = {

    /**
     * Secuencia de Ignición Maestra.
     * Debe ser llamada por main.jsx antes de createRoot.
     */
    ignite: async () => {
        console.group("🔥 [Gatekeeper] Ignition Sequence Initiated");

        const axState = useAxiomaticState.getState();
        const storedId = localStorage.getItem('LAST_ACTIVE_COSMOS_ID');

        if (!storedId) {
            console.log("⚪ [Gatekeeper] No session anchor found. Booting to PORTAL.");
            // axState.terminateSession('NO_ANCHOR'); // Eliminamos la terminación agresiva
            console.groupEnd();
            return { status: 'PORTAL' };
        }

        console.log(`⚓ [Gatekeeper] Anchor found: ${storedId}. Validating existence...`);

        try {
            // AXIOMA: Doble Check de Existencia
            // Llamamos al backend para ver si el Cosmos existe.
            // Usamos InterdictionUnit para que la respuesta pase por el Transmuter.

            // NOTA: Por ahora usamos 'mountCosmos' porque SessionCommander no existe aún.
            // El Transmuter interceptará si hay error.
            const validation = await InterdictionUnit.call('cosmos', 'mountCosmos', { cosmosId: storedId });

            if (validation && validation.id === storedId) {
                console.log("✅ [Gatekeeper] Session Validated. Authorizing Reality.");
                axState.setSessionAuthorized(storedId, 'STANDARD');
                console.groupEnd();
                return { status: 'COSMOS', cosmos: validation };
            } else {
                throw new Error("Validation mismatch or empty response");
            }

        } catch (error) {
            // Si llegamos aquí, el Transmuter ya debió haber matado la sesión en el State.
            // Pero por seguridad, forzamos la limpieza local.
            console.warn(`🛑 [Gatekeeper] Anchor rejected: ${error.message}`);

            // LIMPIEZA FORENSE
            localStorage.removeItem('LAST_ACTIVE_COSMOS_ID');
            localStorage.removeItem('AXIOM_FOCUS_STACK');
            axState.terminateSession('VALIDATION_FAILED');

            console.groupEnd();
            return { status: 'PORTAL_FORCED', error: error.message };
        }
    }
};

export default SessionGatekeeper;




