/**
 * =============================================================================
 * HOOK: useWorkflowExecution.js
 * RESPONSABILIDAD: Orquestar la ejecución simulada y real de un flujo (Sandbox).
 * =============================================================================
 */

import { useState, useCallback } from 'react';

function buildExecutionSteps(workflow) {
    const stations = workflow?.payload?.stations || [];
    const steps = [];

    stations.forEach((station, index) => {
        const dependsOn = Array.isArray(station?.depends_on)
            ? station.depends_on.filter(Boolean)
            : [];

        if (dependsOn.length === 0 && index > 0) {
            dependsOn.push(stations[index - 1].id);
        }

        // 1. Manejo Especial de Estaciones de Control (ROUTER)
        if (station.type === 'ROUTER') {
            const route = station.config?.route;
            if (!route || !route.leftPath || !route.operator) {
                console.warn(`[useWorkflowExecution] Router ${station.id} incompleto.`);
            }
            steps.push({
                id: station.id,
                type: 'ROUTER',
                route: route || {},
                depends_on: dependsOn,
                export_as: station.export_as || station.id
            });
            return; // Siguiente estación
        }

        // 2. Manejo de Estaciones de Acción (PROTOCOL)
        const provider = station?.config?.provider || station?.provider;
        const protocol = station?.config?.protocol || station?.protocol;

        if (!provider || !protocol) {
            console.warn(`[useWorkflowExecution] Station ${station.id} sin provider/protocol.`);
            return;
        }

        const mappingData = Object.entries(station?.mapping || {}).reduce((acc, [key, value]) => {
            if (value?.type === 'REFERENCE' && value?.path) {
                acc[key] = `=${value.path}`;
            } else if (value?.type === 'STATIC' && value?.value !== undefined) {
                acc[key] = value.value;
            }
            return acc;
        }, {});

        steps.push({
            id: station.id,
            type: 'PROTOCOL',
            provider,
            protocol,
            context_id: station?.config?.context_id || station?.context_id || '',
            query: station?.config?.query || station?.query || {},
            data: {
                ...(station?.config?.data || station?.data || {}),
                ...mappingData
            },
            depends_on: dependsOn,
            export_as: station?.export_as || station.id,
            input_from: station?.input_from || undefined
        });
    });

    return steps;
}

function validateExecutionReadiness(workflow) {
    if (!workflow?.id) {
        throw new Error('WORKFLOW_ID_MISSING: No hay workflow cargado.');
    }
    const stations = workflow?.payload?.stations || [];
    if (stations.length === 0) {
        throw new Error('WORKFLOW_EMPTY: El workflow no tiene estaciones.');
    }
}

export function useWorkflowExecution(workflow, bridge) {
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
        if (!bridge) return;
        setStatus('RUNNING');
        setTraceLogs([]);
        addLog('INIT_PIPELINE: Sincronizando con el CORE...', 'OK');

        try {
            validateExecutionReadiness(workflow);

            const workflowSpec = {
                id: workflow.id,
                name: workflow?.handle?.label || workflow.id,
                handle: workflow?.handle || {},
                trigger: workflow?.payload?.trigger || { type: 'MANUAL' },
                steps: buildExecutionSteps(workflow)
            };

            addLog(`TRIGGER_AUTH: Validando origen [${workflowSpec.trigger?.type || 'MANUAL'}]`, 'OK');
            addLog(`WORKFLOW_EXECUTE: Enviando ${workflowSpec.steps.length} steps al Core.`, 'INFO');

            const response = await bridge.execute({
                provider: 'system',
                protocol: 'WORKFLOW_EXECUTE',
                data: {
                    workflow: workflowSpec,
                    workflow_id: workflow.id,
                    trigger_data: inputData
                }
            });

            const execution = response?.metadata?.execution;
            if (!execution) {
                throw new Error('WORKFLOW_EXECUTION_MISSING: No se recibió metadata.execution desde Core.');
            }

            (execution.log || []).forEach((entry) => {
                if (entry?.step_id) {
                    setCurrentStepId(entry.step_id);
                }
                addLog(
                    `STEP[${entry.step_id}] ${entry.provider}:${entry.protocol} -> ${entry.status} (${entry.items_out || 0} items)`,
                    entry.status === 'ERROR' ? 'ERROR' : 'OK'
                );
            });

            setCurrentStepId(null);
            setStatus('FINISHED');
            addLog(`WORKFLOW_COMPLETE: ${execution.steps_total || 0} pasos, ${execution.items_processed || 0} items.`, 'OK');

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
