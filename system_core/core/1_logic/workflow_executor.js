// =============================================================================
// ARTEFACTO: 1_logic/workflow_executor.gs
// CAPA: 1 — Logic Layer (Orquestación)
// RESPONSABILIDAD: Motor de ejecución de workflows. Toma un DAG canónico (DATA_CONTRACTS §7.1)
//         y lo ejecuta paso a paso, pasando el output de cada step al siguiente.
//         El front no sabe qué hace internamente — solo recibe { items: [], metadata: {} }.
//
// AXIOMAS:
//   - ADR-003 Soberanía Glandular: TODA la lógica de automatización vive aquí.
//     El front solo arma la especificación del workflow en formato DAG canónico.
//   - DATA_CONTRACTS §7.1: Cada step USA exactamente la firma UQO estándar.
//   - The Return Law: Siempre retorna { items: [], metadata: { status, execution } }.
//   - Cada step delega en protocol_router.route() — mismo pipeline que cualquier request.
//     No hay código especial por provider aquí. El executor es ciego a los providers.
//
// FLUJO DE EJECUCIÓN:
//   1. Validar el DAG (id, steps con provider, protocol)
//   2. Resolver orden topológico (respetar depends_on)
//   3. Por cada step: construir UQO → route(uqo) → guardar en contexto
//   4. Retornar resumen de ejecución
//
// RESTRICCIONES:
//   - NO puede tener lógica específica de ningún provider (sin ifs de 'notion' o 'drive').
//   - NO puede modificar datos entre steps. Solo pasa items de un step al siguiente.
//   - NO puede hacer llamadas HTTP directas. Solo llama route() del protocol_router.
// =============================================================================

/**
 * Punto de entrada del motor de workflows.
 * Llamado por protocol_router cuando protocol = 'WORKFLOW_EXECUTE'.
 *
 * @param {Object} uqo - UQO con uqo.data.workflow = { id, name, trigger, steps[] }
 * @returns {{ items: [], metadata: { status, execution } }}
 */
function handleWorkflowExecute(uqo) {
  const workflow = uqo && uqo.data && uqo.data.workflow;

  if (!workflow) {
    return {
      items: [],
      metadata: { status: 'ERROR', error: 'WORKFLOW_EXECUTE requiere uqo.data.workflow.' }
    };
  }

  if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) {
    return {
      items: [],
      metadata: { status: 'ERROR', error: 'El workflow no tiene steps definidos.' }
    };
  }

  logInfo('[workflow_executor] Iniciando workflow: "' + (workflow.handle?.label || workflow.name || workflow.id) + '" con ' + workflow.steps.length + ' steps.');

  // ── CONTEXTO DE EJECUCIÓN ──────────────────────────────────────────────────
  // stepOutputs guarda los items de cada step bajo su export_as alias.
  // Permite que un step siguiente lea input_from con el alias del paso anterior.
  const stepOutputs = {};
  const executionLog = [];
  let totalItemsProcessed = 0;

  // ── ORDENAMIENTO TOPOLÓGICO ───────────────────────────────────────────────
  // Resuelve el orden correcto de ejecución de los steps respetando depends_on.
  const orderedSteps = _wf_topologicalSort(workflow.steps);
  if (!orderedSteps) {
    return {
      items: [],
      metadata: {
        status: 'ERROR',
        error: 'El workflow contiene una dependencia circular o un step inexistente en depends_on.'
      }
    };
  }

  // ── EJECUCIÓN SECUENCIAL DE STEPS ────────────────────────────────────────
  for (let i = 0; i < orderedSteps.length; i++) {
    const step = orderedSteps[i];

    logInfo('[workflow_executor] Ejecutando step ' + (i + 1) + '/' + orderedSteps.length + ': "' + step.id + '" → ' + step.provider + ':' + step.protocol);

    // 1. Resolver inputs del step anterior (si aplica)
    let inputItems = null;
    if (step.input_from) {
      inputItems = stepOutputs[step.input_from];
      if (!inputItems) {
        logWarn('[workflow_executor] Step "' + step.id + '" requiere input_from "' + step.input_from + '" pero ese alias no existe en el contexto.');
      }
    }

    // 2. Construir el UQO del step (DATA_CONTRACTS §3.1 — firma estándar)
    const stepUqo = {
      workspace_id: uqo.workspace_id,
      provider:     step.provider,
      protocol:     step.protocol,
      context_id:   step.context_id,
      query:        step.query || {},
    };

    // Para protocolos de escritura (ATOM_CREATE): inyectar los items del paso anterior
    // El provider de destino recibe los items en stepUqo.data.items (Return Law §2.3)
    if (inputItems && inputItems.length > 0) {
      stepUqo.data = { items: inputItems };
    }

    // 3. Ejecutar a través del router (mismo pipeline de validación de contrato)
    let stepResult;
    try {
      // — BURST CONTROL (A3) —
      // Steps de ESCRITURA se segmentan respetando max_records_per_burst del provider.
      // Steps de LECTURA y TRANSFORM operan sobre el array completo en memoria.
      const WRITE_PROTOCOLS = ['ATOM_CREATE', 'ATOM_UPDATE'];
      const isWriteStep     = WRITE_PROTOCOLS.indexOf(step.protocol) !== -1;

      if (isWriteStep && inputItems && inputItems.length > 0) {
        const destConf  = getProviderConf(step.provider);
        const burstSize = (destConf && destConf.burst_config && destConf.burst_config.max_records_per_burst) || 100;
        const chunks    = _wf_chunkArray_(inputItems, burstSize);

        logInfo('[workflow_executor] Burst mode: ' + inputItems.length + ' items ÷ ' + burstSize + ' = ' + chunks.length + ' chunks.');

        var burstItems = [];
        for (var ci = 0; ci < chunks.length; ci++) {
          stepUqo.data = { items: chunks[ci] };
          var chunkResult = route(stepUqo);
          if (chunkResult.metadata && chunkResult.metadata.status === 'ERROR') {
            return {
              items: [],
              metadata: {
                status: 'ERROR',
                error: 'Burst chunk ' + (ci + 1) + '/' + chunks.length + ' fall\u00f3: ' + (chunkResult.metadata.error || 'Error desconocido.'),
                execution: { workflow_id: workflow.id, steps_completed: i, steps_total: orderedSteps.length, log: executionLog }
              }
            };
          }
          burstItems = burstItems.concat(chunkResult.items || []);
        }
        stepResult = { items: burstItems, metadata: { status: 'OK', burst_chunks: chunks.length } };

      } else {
        // Lectura y Transform: sin burst, el array viaja completo en memoria
        stepResult = route(stepUqo);
      }
    } catch (stepError) {
      logError('[workflow_executor] Step "' + step.id + '" falló: ' + stepError.message);
      // Fallo en un step = fallo del workflow completo
      return {
        items: [],
        metadata: {
          status: 'ERROR',
          error: 'El step "' + step.id + '" falló: ' + (stepError.message || 'Error desconocido.'),
          execution: {
            workflow_id: workflow.id,
            steps_completed: i,
            steps_total: orderedSteps.length,
            log: executionLog,
          }
        }
      };
    }

    // 4. Guardar el output del step para que steps posteriores puedan leerlo
    if (step.export_as) {
      stepOutputs[step.export_as] = stepResult.items || [];
    }

    const stepItemCount = (stepResult.items || []).length;
    totalItemsProcessed += stepItemCount;

    executionLog.push({
      step_id:    step.id,
      protocol:   step.protocol,
      provider:   step.provider,
      items_out:  stepItemCount,
      status:     stepResult.metadata?.status || 'OK',
    });

    logInfo('[workflow_executor] Step "' + step.id + '" completado. Items: ' + stepItemCount);
  }

  logInfo('[workflow_executor] Workflow "' + (workflow.handle?.label || workflow.name || workflow.id) + '" completado. Total items procesados: ' + totalItemsProcessed);

  return {
    items: [], // El workflow no retorna datos al front — solo el resumen de ejecución
    metadata: {
      status: 'OK',
      execution: {
        workflow_id:     workflow.id,
        workflow_name:   workflow.handle?.label || workflow.name || '',
        trigger_type:    workflow.trigger?.type || 'MANUAL',
        steps_total:     orderedSteps.length,
        items_processed: totalItemsProcessed,
        log:             executionLog,
        completed_at:    new Date().toISOString(),
      }
    }
  };
}

/**
 * Divide un array en sub-arrays de tamaño `size`.
 * Usado por el burst control del workflow executor.
 * @private
 */
function _wf_chunkArray_(arr, size) {
  var chunks = [];
  if (!arr || !Array.isArray(arr)) return chunks;
  for (var i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─── ORDENAMIENTO TOPOLÓGICO ──────────────────────────────────────────────────

/**
 * Ordena los steps del DAG en el orden de ejecución correcto,
 * respetando las dependencias declaradas en depends_on.
 * Detecta ciclos y dependencias inexistentes.
 *
 * @param {Array} steps - Array de steps del workflow.
 * @returns {Array|null} Steps ordenados, o null si hay un ciclo/error.
 * @private
 */
function _wf_topologicalSort(steps) {
  const stepMap = {};
  steps.forEach(function(s) { stepMap[s.id] = s; });

  const visited  = {};  // { stepId: 'visiting' | 'done' }
  const ordered  = [];

  function visit(stepId) {
    if (visited[stepId] === 'done')     return true;  // Ya procesado
    if (visited[stepId] === 'visiting') return false; // Ciclo detectado
    if (!stepMap[stepId])               return false; // Dependencia inexistente

    visited[stepId] = 'visiting';

    const step = stepMap[stepId];
    const deps = step.depends_on || [];

    for (let i = 0; i < deps.length; i++) {
      if (!visit(deps[i])) return false; // Ciclo o dependencia inexistente
    }

    visited[stepId] = 'done';
    ordered.push(step);
    return true;
  }

  for (let i = 0; i < steps.length; i++) {
    if (!visit(steps[i].id)) return null; // Ciclo detectado
  }

  return ordered;
}
