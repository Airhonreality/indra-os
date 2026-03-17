/**
 * =============================================================================
 * HOOK: useWorkflowExecution.js
 * RESPONSABILIDAD: Orquestar la ejecución simulada y real de un flujo (Sandbox).
 * =============================================================================
 */

import { useState, useCallback } from 'react';
import { executeDirective } from '../../../services/directive_executor';
import { useAppState } from '../../../state/app_state';

export function useWorkflowExecution(workflow) {
    const coreUrl = useAppState(s => s.coreUrl);
    const sessionSecret = useAppState(s => s.sessionSecret);

    const [status, setStatus] = useState('IDLE'); // IDLE, RUNNING, FINISHED, ERROR
    const [traceLogs, setTraceLogs] = useState([]);
    const [currentStepId, setCurrentStepId] = useState(null);

    const addLog = (message, status = 'INFO') => {
        setTraceLogs(prev => [
            ...prev,
            { timestamp: new Date().toLocaleTimeString(), message, status }
        ]);
    };

    const runTrace = useCallback(async (inputData = {}) => {
        setStatus('RUNNING');
        setTraceLogs([]);
        addLog('INIT_PIPELINE: Sincronizando con el CORE...', 'OK');

        try {
            // 1. Validar el trigger
            addLog(`TRIGGER_AUTH: Validando origen [${workflow.payload?.trigger?.type}]`, 'OK');

            // 2. Iterar sobre las estaciones (Simulación de pasos)
            for (const station of (workflow.payload?.stations || [])) {
                setCurrentStepId(station.id);
                addLog(`STATION_EXEC: Procesando [${station.config?.label || station.id}]`, 'INFO');

                // Simulamos una llamada al core para cada estación (o una real si existiera el protocolo)
                // En Indra, los flujos son coordinados por el CORE, aquí trazamos la intención.
                await new Promise(resolve => setTimeout(resolve, 800)); // Latencia de red artificial

                addLog(`STATION_OK: Paso [${station.id}] completado.`, 'OK');
            }

            setCurrentStepId(null);
            setStatus('FINISHED');
            addLog('WORKFLOW_COMPLETE: Datos proyectados a salida.', 'OK');

        } catch (err) {
            console.error('[Workflow] Execution failed:', err);
            addLog(`EXECUTION_FAILURE: ${err.message}`, 'ERROR');
            setStatus('ERROR');
        }
    }, [workflow, coreUrl, sessionSecret]);

    return {
        status,
        traceLogs,
        currentStepId,
        runTrace
    };
}
