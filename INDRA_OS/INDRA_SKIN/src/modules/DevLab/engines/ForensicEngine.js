/**
 * ForensicEngine.js
 * DHARMA: El Observador Participante.
 * Misión: Instrumentar la trayectoria de la señal para revelar el Limbo.
 */

import useAxiomaticState from '../../../core/state/AxiomaticState';
import interdiction from '../../../core/state/InterdictionUnit';
import transmuter from '../../../core/state/SignalTransmuter';
import connector from '../../../core/Core_Connector';

export const createForensicEngine = (dispatch, execute) => {

    const igniteForensicChain = async (targetId) => {
        console.clear();
        console.log("%c 🔬 [FORENSIC_CHAIN] Igniting Ultra-Diagnostic Chain...", "color: #f472b6; font-weight: bold; font-size: 14px;");

        const results = {
            startTime: Date.now(),
            interdiction: 'PROBING',
            connector: 'PROBING',
            transmuter: 'PROBING',
            state: 'PROBING'
        };

        // --- SONDA 1: Interdicción (Zombis y Tapones) ---
        const originalCall = interdiction.call.bind(interdiction);
        interdiction.call = async (service, method, payload) => {
            console.group(`%c 🛡️ [FORENSIC:Interdiction] ${service}.${method}`, "color: #38bdf8;");
            console.log("Queue size:", interdiction.batchQueue.length);
            console.log("Timer active:", !!interdiction.batchTimer);
            console.log("Write allowed?", useAxiomaticState.getState().isWriteAllowed());
            console.log("Hash Init?", useAxiomaticState.getState().session.hashInitialized);
            console.groupEnd();
            return originalCall(service, method, payload);
        };

        // --- SONDA 2: Conector (Bypass de Red) ---
        const originalConnectorCall = connector.call.bind(connector);
        connector.call = async (service, method, payload) => {
            console.log(`%c 🚄 [FORENSIC:Connector] Outgoing -> ${service}.${method}`, "color: #10b981; font-weight: bold;");
            try {
                const res = await originalConnectorCall(service, method, payload);
                console.log(`%c 📥 [FORENSIC:Connector] Incoming <- ${method}`, "color: #10b981;", { size: JSON.stringify(res).length });
                return res;
            } catch (e) {
                console.error("❌ [FORENSIC:Connector] Physical Drop:", e.message);
                throw e;
            }
        };

        // --- SONDA 3: Transmutador (Veneno Semántico) ---
        const originalTransmute = transmuter.transmute.bind(transmuter);
        transmuter.transmute = (response, context) => {
            console.group(`%c 🧪 [FORENSIC:Transmuter] Analyzing ${context}`, "color: #a855f7;");
            console.log("Raw Response:", response);
            const result = originalTransmute(response, context);
            console.log("Transmuted Result:", result);
            console.groupEnd();
            return result;
        };

        // --- SONDA 4: Harakiri (Guardia de Timeout) ---
        dispatch({ type: 'LOG_ENTRY', payload: { msg: "🛰️ Cadena Forense Activa. Disparando Sonda FETCH...", type: 'INFO' } });

        // Ejecutar el test real
        setTimeout(async () => {
            console.log("%c 🚀 [FORENSIC] Triggering Target Action...", "color: #f472b6; font-weight: bold;");

            // AXIOMA: Recuperar el ID real de la Bóveda si el targetId es genérico
            const state = useAxiomaticState.getState();
            const labState = state.phenotype.devLab || {};

            // Si el targetId es un contenedor ('DRIVE', 'VAULT'), buscamos si hay un artefacto específico en foco
            const realDatabaseId = targetId === 'DRIVE' || targetId === 'VAULT'
                ? (labState.selectedArtifactId || targetId)
                : targetId;

            console.log(`[FORENSIC] Target Resolved: ${realDatabaseId}`);

            try {
                execute('FETCH_DATABASE_CONTENT', {
                    databaseId: realDatabaseId,
                    nodeId: 'notion',
                    refresh: true
                });

                // Timeout de 10 segundos para declarar fallo de resolución
                setTimeout(() => {
                    console.log("%c 🏮 [FORENSIC:Timeout] 10 seconds without resolution. Checking queue status...", "color: #ef4444;");
                    console.log("Stuck Queue:", interdiction.batchQueue);
                }, 10000);

            } catch (e) {
                console.error("💥 [FORENSIC:Chain] Broken at dispatch:", e);
            }
        }, 1000);
    };

    return { igniteForensicChain };
};



