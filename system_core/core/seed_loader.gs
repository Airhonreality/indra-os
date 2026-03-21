// =============================================================================
// ARTEFACTO: seed_loader.gs
// RESPONSABILIDAD: Carga automática de artefactos de demostración (seeds)
//         Ejecutado UNA SOLA VEZ durante `first-time-setup.ps1`.
//         Lee JSON de seeds/ y crea átomos (SCHEMA, DOCUMENT, WORKFLOW).
//
// AXIOMA: Los seeds son la tabla de referencia de demostración. Se inyectan
//         como constantes globales en tiempo de compilación.
// =============================================================================

/**
 * PUNTO DE ENTRADA: Ejecutado via `clasp run seedDemo`
 * desde el script de setup automático.
 *
 * Precondiciones:
 * - Core ya está deployado (doPost funciona)
 * - Constantes SEED_DEMO_* están definidas globalmente (compiladas)
 * - Existe workspace 'default_workspace'
 *
 * @returns {Object} { schemaId, documentId, workflowId, status }
 */
function seedDemo() {
  const PROVIDER = 'system';
  const WORKSPACE_ID = 'default_workspace';

  logInfo('════════════════════════════════════════════════════════════');
  logInfo('🌱 INICIANDO SEED DEMO: Carga automática de flujo demostrativo');
  logInfo('════════════════════════════════════════════════════════════');

  try {
    // ────────────────────────────────────────────────────────────────
    // PASO 1: Parsear JSONs de seeds (inyectados como constantes)
    // ────────────────────────────────────────────────────────────────

    logInfo('[seed] Parseando semillas JSON...');

    let schemaJson, documentJson, workflowJson;

    try {
      // NOTA: Estas constantes DEBEN estar compiladas en el tipo de proyecto.
      // Si no existen, el setup fallará en la fase anterior (validación).
      schemaJson = JSON.parse(typeof SEED_DEMO_SCHEMA === 'string' ? SEED_DEMO_SCHEMA : '{}');
      documentJson = JSON.parse(typeof SEED_DEMO_DOCUMENT === 'string' ? SEED_DEMO_DOCUMENT : '{}');
      workflowJson = JSON.parse(typeof SEED_DEMO_WORKFLOW === 'string' ? SEED_DEMO_WORKFLOW : '{}');
    } catch (parseErr) {
      throw createError(
        'SEED_PARSE_ERROR',
        'Constantes SEED_DEMO_* inválidas o no compiladas. Detalle: ' + parseErr.message
      );
    }

    if (!schemaJson.handle || !schemaJson.payload) {
      throw createError('SEED_SCHEMA_INVALID', 'SEED_DEMO_SCHEMA malformado.');
    }

    if (!documentJson.handle || !documentJson.payload) {
      throw createError('SEED_DOCUMENT_INVALID', 'SEED_DEMO_DOCUMENT malformado.');
    }

    if (!workflowJson.handle || !workflowJson.payload) {
      throw createError('SEED_WORKFLOW_INVALID', 'SEED_DEMO_WORKFLOW malformado.');
    }

    logSuccess('[seed] JSONs parseados correctamente');

    // ────────────────────────────────────────────────────────────────
    // PASO 2: Crear SCHEMA (Formulario)
    // ────────────────────────────────────────────────────────────────

    logInfo('[seed] Creando DATA_SCHEMA...');

    const schemaUqo = {
      provider: PROVIDER,
      protocol: 'ATOM_CREATE',
      data: {
        class: 'DATA_SCHEMA',
        handle: schemaJson.handle || { label: 'Esquema Demo' },
        payload: schemaJson.payload || { fields: [] }
      }
    };

    const schemaResult = route(schemaUqo);

    if (schemaResult.metadata.status === 'ERROR') {
      throw createError('SCHEMA_CREATE_FAILED', schemaResult.metadata.error || 'Error desconocido');
    }

    const schemaAtom = schemaResult.items[0];
    const schemaId = schemaAtom.id;

    logSuccess('[seed] SCHEMA creado: ' + schemaId);
    logInfo('  Handle: ' + (schemaAtom.handle?.label || 'untitled'));

    // ────────────────────────────────────────────────────────────────
    // PASO 3: Crear DOCUMENT (Plantilla PDF)
    // ────────────────────────────────────────────────────────────────

    logInfo('[seed] Creando DOCUMENT...');

    const documentUqo = {
      provider: PROVIDER,
      protocol: 'ATOM_CREATE',
      data: {
        class: 'DOCUMENT',
        handle: documentJson.handle || { label: 'Plantilla Demo' },
        payload: documentJson.payload || { elements: [] }
      }
    };

    const documentResult = route(documentUqo);

    if (documentResult.metadata.status === 'ERROR') {
      throw createError('DOCUMENT_CREATE_FAILED', documentResult.metadata.error || 'Error desconocido');
    }

    const documentAtom = documentResult.items[0];
    const documentId = documentAtom.id;

    logSuccess('[seed] DOCUMENT creado: ' + documentId);
    logInfo('  Handle: ' + (documentAtom.handle?.label || 'untitled'));

    // ────────────────────────────────────────────────────────────────
    // PASO 4: Crear WORKFLOW (Orquestación)
    // ────────────────────────────────────────────────────────────────

    logInfo('[seed] Creando WORKFLOW...');

    // Resolver placeholders en el workflow JSON
    const resolvedWorkflowJson = JSON.parse(JSON.stringify(workflowJson)); // Deep copy

    // Reemplazar placeholders de IDs
    if (resolvedWorkflowJson.payload && Array.isArray(resolvedWorkflowJson.payload.stations)) {
      resolvedWorkflowJson.payload.stations.forEach(function(station) {
        if (station.schema_id === '=PLACEHOLDER_SCHEMA_ID') {
          station.schema_id = schemaId;
        }
        if (station.template_id === '=PLACEHOLDER_DOCUMENT_ID' || station.context_id === '=PLACEHOLDER_DOCUMENT_ID') {
          station.template_id = documentId;
          station.context_id = documentId;
        }
      });
    }

    const workflowUqo = {
      provider: PROVIDER,
      protocol: 'ATOM_CREATE',
      data: {
        class: 'WORKFLOW',
        handle: resolvedWorkflowJson.handle || { label: 'Flujo Demo' },
        payload: resolvedWorkflowJson.payload || { stations: [] }
      }
    };

    const workflowResult = route(workflowUqo);

    if (workflowResult.metadata.status === 'ERROR') {
      throw createError('WORKFLOW_CREATE_FAILED', workflowResult.metadata.error || 'Error desconocido');
    }

    const workflowAtom = workflowResult.items[0];
    const workflowId = workflowAtom.id;

    logSuccess('[seed] WORKFLOW creado: ' + workflowId);
    logInfo('  Handle: ' + (workflowAtom.handle?.label || 'untitled'));

    // ────────────────────────────────────────────────────────────────
    // PASO 5: Anclar átomos al workspace (SYSTEM_PIN)
    // ────────────────────────────────────────────────────────────────

    logInfo('[seed] Anclando átomos al workspace...');

    const pinSchema = route({
      provider: PROVIDER,
      protocol: 'SYSTEM_PIN',
      workspace_id: WORKSPACE_ID,
      data: { atom: schemaAtom }
    });

    if (pinSchema.metadata.status === 'ERROR') {
      logWarn('[seed] No se pudo anclar SCHEMA, continuando...');
    } else {
      logSuccess('[seed] SCHEMA anclado');
    }

    const pinDocument = route({
      provider: PROVIDER,
      protocol: 'SYSTEM_PIN',
      workspace_id: WORKSPACE_ID,
      data: { atom: documentAtom }
    });

    if (pinDocument.metadata.status === 'ERROR') {
      logWarn('[seed] No se pudo anclar DOCUMENT, continuando...');
    } else {
      logSuccess('[seed] DOCUMENT anclado');
    }

    const pinWorkflow = route({
      provider: PROVIDER,
      protocol: 'SYSTEM_PIN',
      workspace_id: WORKSPACE_ID,
      data: { atom: workflowAtom }
    });

    if (pinWorkflow.metadata.status === 'ERROR') {
      logWarn('[seed] No se pudo anclar WORKFLOW, continuando...');
    } else {
      logSuccess('[seed] WORKFLOW anclado');
    }

    // ────────────────────────────────────────────────────────────────
    // PASO 6: Reportar éxito
    // ────────────────────────────────────────────────────────────────

    logInfo('════════════════════════════════════════════════════════════');
    logSuccess('🚀 SEED DEMO COMPLETADO EXITOSAMENTE');
    logInfo('════════════════════════════════════════════════════════════');
    logInfo('');
    logInfo('📊 Artefactos creados:');
    logInfo('  • SCHEMA:   ' + schemaId);
    logInfo('  • DOCUMENT: ' + documentId);
    logInfo('  • WORKFLOW: ' + workflowId);
    logInfo('');
    logInfo('💾 Estado: Todos están anclados al workspace "' + WORKSPACE_ID + '"');
    logInfo('🎯 El usuario verá la demo en el dashboard al primer inicio');
    logInfo('');

    return {
      success: true,
      schemaId: schemaId,
      documentId: documentId,
      workflowId: workflowId,
      workspaceId: WORKSPACE_ID,
      message: 'Demo seed cargada completamente'
    };

  } catch (fatalErr) {
    logError('════════════════════════════════════════════════════════════');
    logError('❌ SEED DEMO FALLÓ');
    logError('════════════════════════════════════════════════════════════');
    logError('Error: ' + (fatalErr.message || 'Desconocido'));
    logError('Code: ' + (fatalErr.code || 'SYSTEM_FAILURE'));

    return {
      success: false,
      error: fatalErr.message || 'Error desconocido en seedDemo',
      code: fatalErr.code || 'SYSTEM_FAILURE'
    };
  }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────

/**
 * Wrapper de logging que se integra con el sistema de logs del Core.
 * @private
 */
function logSuccess(msg) {
  logInfo('✅ ' + msg);
}

/**
 * Valida que los JSONs de seed tengan estructura mínima válida.
 * @private
 */
function _seed_validateSchema(schema) {
  if (!schema || typeof schema !== 'object') return false;
  if (!schema.handle || !schema.handle.label) return false;
  if (!schema.payload) return false;
  return true;
}

/**
 * Valida que el JSON de workflow tenga estructura mínima válida.
 * @private
 */
function _seed_validateWorkflow(workflow) {
  if (!workflow || typeof workflow !== 'object') return false;
  if (!workflow.handle || !workflow.handle.label) return false;
  if (!workflow.payload || !Array.isArray(workflow.payload.stations)) return false;
  if (workflow.payload.stations.length === 0) return false;
  return true;
}
