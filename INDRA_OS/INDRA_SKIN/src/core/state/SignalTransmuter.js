/**
 * SignalTransmuter.js
 * DHARMA: Alquimista Semántico (Capa 0.5)
 * 
 * Intercepta respuestas crudas del Backend (JSON) y las transmuta
 * en Señales Axiomáticas (EJECT, HALT, RECOVERY).
 * Es el filtro que impide que datos "envenenados" lleguen al Store.
 */

import useAxiomaticState from './AxiomaticState';

const SignalTransmuter = {

    /**
     * Analiza una respuesta del Backend antes de que llegue al componente.
     * @param {Object} response - Payload crudo del servidor
     * @param {string} context - Origen de la llamada (ej: 'MOUNT', 'SAVE')
     * @returns {Object} - Payload sanitizado o lanza una Excepción Axiomática
     */
    transmute: (response, context) => {
        const axState = useAxiomaticState.getState();

        // 0. Desempaquetado Polimórfico (Unwrapping)
        // AXIOMA: El backend de GAS a veces devuelve el resultado envuelto en un array.
        let data = response?.result !== undefined ? response.result : response;
        if (Array.isArray(data)) data = data[0];

        if (!data) return response; // No hay nada que transmutar

        // 1. Normalización Quirúrgica de Identidad
        // Aseguramos que el campo 'id' sea la autoridad única.
        if (!data.id && (data.cosmos_id || data.ID || data.cosmosId)) {
            data.id = data.cosmos_id || data.ID || data.cosmosId;
        }

        // 2. Detección de Señales de Protocolo (Core Signals)
        if (data._SIGNAL) {
            return _handleProtocolSignal(data._SIGNAL, data.payload || data);
        }

        // 3. Detección de Errores Semánticos (Falsos Positivos)
        if (data.error) {
            _handleSemanticError(data.error, context);
            throw new Error(`[Transmuter] Blocked Error: ${data.error}`);
        }

        // 4. Detección de Incoherencia de Identidad (Ghost Busting)
        if (context === 'SYNC' && data.id && axState.session.id && data.id !== axState.session.id) {
            console.error(`[Transmuter] 👻 Ghost Data Detected! Incoming: ${data.id}, Session: ${axState.session.id}`);
            throw new Error('[Transmuter] Identity Mismatch blocked.');
        }

        return data; // Devolvemos la data ya normalizada
    }
};

/**
 * Maneja señales explícitas del ProtocolTransmitter / SessionCommander
 */
function _handleProtocolSignal(signal, payload) {
    const axState = useAxiomaticState.getState();

    switch (signal) {
        case 'PATIENCE_TOKEN':
            console.log(`[Transmuter] ⏳ Patience Token received. Identifying as Dark Matter...`);
            // Preservamos la señal para que el Store pueda activar la UI de "Deep Hydration"
            return { ...payload, _SIGNAL: 'PATIENCE_TOKEN' };

        case 'FORCE_EJECT':
            console.warn(`[Transmuter] ⏏️ FORCE EJECT SIGNAL RECEIVED.`);
            axState.terminateSession('CORE_EJECT_COMMAND');
            throw new Error('CORE_EJECT');

        case 'RECOVERY_MODE':
            console.warn(`[Transmuter] 🏺 RECOVERY MODE SIGNAL RECEIVED.`);
            // Autorizamos la sesión pero en modo Arqueológico
            if (payload && payload.id) {
                axState.setSessionAuthorized(payload.id, 'ARCHEOLOGICAL');
            }
            return payload; // Dejamos pasar los datos para lectura

        default:
            console.warn(`[Transmuter] Unknown Signal: ${signal}`);
            return payload;
    }
}

/**
 * Convierte errores de texto en decisiones de estado
 */
function _handleSemanticError(errorMsg, context) {
    const axState = useAxiomaticState.getState();
    const msg = (errorMsg || '').toUpperCase();

    // Patrones de Muerte Súbita
    if (msg.includes('NOT FOUND') || msg.includes('DELETED') || msg.includes('NO EXISTE')) {
        if (context === 'MOUNT' || context === 'SYNC') {
            console.error(`[Transmuter] 🛑 Fatal Reality Error detected: ${msg}`);
            axState.terminateSession('REALITY_NOT_FOUND');
        }
    }

    // Patrones de Bloqueo
    if (msg.includes('LOCKED') || msg.includes('READ ONLY')) {
        console.warn(`[Transmuter] 🔒 Locking Session due to server restriction.`);
        axState.engageWorldLock('SERVER_MANDATE');
    }
}

export default SignalTransmuter;



