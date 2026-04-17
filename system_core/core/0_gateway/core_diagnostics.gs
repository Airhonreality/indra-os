// =============================================================================
// ARTEFACTO: 0_gateway/core_diagnostics.gs
// PROPÓSITO: Capa de diagnóstico y testing del Core. Solo para uso en el
//            editor GAS. NO forma parte del sistema en producción.
//            NO se llama desde doPost. Es invocado manualmente por el dev.
//
// USO:
//   Editor GAS → Seleccionar función → ▶ Run
//   Ver resultados en: Editor GAS → Historial de ejecuciones (Ctrl+Shift+Enter)
//
// COBERTURA:
//   Capa 4 Support  → testLayer4_ErrorHandler
//   Capa 3 Services → testLayer3_MonitoringService, testLayer3_SystemConfig
//   Capa 1 Logic    → testLayer1_ProviderRegistry, testLayer1_ProtocolRouter
//   Capa 0 Gateway  → testLayer0_Gateway (simulación completa de doPost)
//   Suite completa  → testAll
// =============================================================================

// ─── UTILIDAD DE REPORTE ──────────────────────────────────────────────────────

/**
 * Imprime el resultado de un test en la consola de GAS.
 * @param {string}  testName - Nombre del test.
 * @param {boolean} passed   - Si el test pasó.
 * @param {string}  [detail] - Información adicional.
 */
function _report_(testName, passed, detail) {
  const icon   = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} [${status}] ${testName}${detail ? ' — ' + detail : ''}`);
}

/**
 * Marca el inicio de una suite de tests.
 * @param {string} suiteName - Nombre de la suite.
 */
function _suite_(suiteName) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🧪 SUITE: ${suiteName}`);
  console.log(`${'─'.repeat(60)}`);
}

// ─── CAPA 4: ERROR_HANDLER ────────────────────────────────────────────────────

function testLayer4_ErrorHandler() {
  _suite_('Capa 4 — error_handler.gs');

  // Test 1: createError con código CRITICAL
  const err = createError('UNAUTHORIZED', 'Test: acceso no autorizado.');
  _report_('createError retorna objeto',         typeof err === 'object',   JSON.stringify(err));
  _report_('error.code está presente',           err.code === 'UNAUTHORIZED');
  _report_('error.severity es CRITICAL',         err.severity === 'CRITICAL');
  _report_('error.timestamp es ISO string',      typeof err.timestamp === 'string');
  _report_('error es inmutable (frozen)',        Object.isFrozen(err));

  // Test 2: código desconocido defaultea a WARNING
  const unknown = createError('INEXISTENTE', 'Test desconocido.');
  _report_('Código desconocido → severity WARNING', unknown.severity === 'WARNING');

  // Test 3: detalles con referencia circular son serializados de forma segura
  const circular = {};
  circular.self = circular;
  const withCircular = createError('SYSTEM_FAILURE', 'Con circular.', circular);
  _report_('Referencia circular no explota',    typeof withCircular.details === 'string');

  // Test 4: isRecoverable y requiresImmediateAttention
  _report_('CRITICAL no es recoverable',        !isRecoverable(err));
  _report_('CRITICAL requiere atención inmediata', requiresImmediateAttention(err));
  const warn = createError('NOT_FOUND', 'No encontrado.');
  _report_('WARNING es recoverable',            isRecoverable(warn));
}

// ─── CAPA 3: MONITORING_SERVICE ───────────────────────────────────────────────

function testLayer3_MonitoringService() {
  _suite_('Capa 3 — monitoring_service.gs');

  // Test: Buffer comienza vacío
  flushLogs(); // Limpiar cualquier residuo
  _report_('Buffer inicial vacío',       getBufferSize() === 0);

  // Test: Logs se acumulan en el buffer
  logInfo('Test INFO desde diagnostics.');
  logWarn('Test WARN desde diagnostics.');
  logError('Test ERROR desde diagnostics.', createError('NOT_FOUND', 'Simulado.'));
  _report_('Tres logs acumulados',       getBufferSize() === 3, `size: ${getBufferSize()}`);

  // Test: flush retorna los logs y vacía el buffer
  const flushed = flushLogs();
  _report_('flush retorna los 3 logs',   flushed.length === 3, `length: ${flushed.length}`);
  _report_('Buffer vacío después del flush', getBufferSize() === 0);

  // Test: segunda llamada a flush retorna array vacío
  const empty = flushLogs();
  _report_('Doble flush retorna []',     empty.length === 0);

  // Test: estructura de una entrada de log
  logDebug('Test DEBUG.', { metaKey: 'metaValue' });
  const logs = flushLogs();
  const entry = logs[0];
  _report_('Entrada tiene `level`',      entry && entry.level === 'DEBUG');
  _report_('Entrada tiene `message`',    entry && typeof entry.message === 'string');
  _report_('Entrada tiene `timestamp`',  entry && typeof entry.timestamp === 'string');
  _report_('Entrada tiene `context`',    entry && entry.context && entry.context.metaKey === 'metaValue');
}

// ─── CAPA 3: SYSTEM_CONFIG ────────────────────────────────────────────────────

function testLayer3_SystemConfig() {
  _suite_('Capa 3 — system_config.gs');

  const TEST_KEY   = 'SYS_DIAGNOSTIC_TEST_KEY';
  const TEST_VALUE = 'diagnostics_value_' + Date.now();

  // Test: storeConfig / readConfig
  storeConfig(TEST_KEY, TEST_VALUE);
  const readBack = readConfig(TEST_KEY);
  _report_('storeConfig + readConfig',   readBack === TEST_VALUE, `value: "${readBack}"`);

  // Test: deleteConfig
  deleteConfig(TEST_KEY);
  const afterDelete = readConfig(TEST_KEY);
  _report_('deleteConfig elimina la clave', afterDelete === null, `after: "${afterDelete}"`);

  // Test: readConfig con default
  const withDefault = readConfig('SYS_INEXISTENTE', 'mi_default');
  _report_('readConfig retorna default si clave no existe', withDefault === 'mi_default');

  // Test: prefijo de clave inválido es rechazado
  let invalidKeyRejected = false;
  try {
    storeConfig('CLAVE_SIN_PREFIJO', 'valor');
  } catch (e) {
    invalidKeyRejected = true;
  }
  _report_('Prefijo inválido lanza error', invalidKeyRejected);

  // Test: isBootstrapped (no modificar el estado real)
  const bootstrapped = isBootstrapped();
  _report_('isBootstrapped retorna boolean', typeof bootstrapped === 'boolean',
           `actual: ${bootstrapped}`);

  // Test: storeRootFolderId / readRootFolderId (sin modificar si ya existe)
  const existingFolder = readRootFolderId();
  if (!existingFolder) {
    storeRootFolderId('test_folder_id_diagnostic');
    _report_('storeRootFolderId guarda el ID', readRootFolderId() === 'test_folder_id_diagnostic');
    deleteConfig('SYS_ROOT_FOLDER_ID'); // Limpiar el test
  } else {
    _report_('readRootFolderId retorna el ID existente', typeof existingFolder === 'string',
             `id: "${existingFolder}"`);
  }

  flushLogs(); // Limpiar logs generados por este test
}

// ─── CAPA 1: PROVIDER_REGISTRY ───────────────────────────────────────────────

function testLayer1_ProviderRegistry() {
  _suite_('Capa 1 — provider_registry.gs');

  // Test: buildManifest retorna estructura The Return Law
  const manifest = buildManifest();
  _report_('buildManifest retorna { items, metadata }',
           manifest && Array.isArray(manifest.items) && typeof manifest.metadata === 'object',
           JSON.stringify(manifest.metadata));

  // Test: metadata tiene status
  _report_('manifest.metadata.status presente',
           typeof manifest.metadata.status === 'string',
           `status: "${manifest.metadata.status}"`);

  // Test: buildConfigSchema retorna estructura correcta
  const schema = buildConfigSchema();
  _report_('buildConfigSchema retorna { items, metadata }',
           schema && Array.isArray(schema.items) && typeof schema.metadata === 'object');

  // Test: getProviderConf con ID inválido retorna null
  const nullConf = getProviderConf('provider_inexistente_xyz');
  _report_('getProviderConf("inexistente") retorna null', nullConf === null);

  // Test: autoescaneo de globalThis
  const keys = Object.keys(globalThis).filter(k => k.startsWith('PROVIDER_CONF_'));
  _report_(`Providers PROVIDER_CONF_* en scope: ${keys.length}`,
           true, keys.join(', ') || '(ninguno — normal si no hay providers aún)');

  flushLogs();
}

// ─── CAPA 1: PROTOCOL_ROUTER ──────────────────────────────────────────────────

function testLayer1_ProtocolRouter() {
  _suite_('Capa 1 — protocol_router.gs');

  // Test: UQO sin provider es rechazado
  let noProviderRejected = false;
  try {
    route({ protocol: 'TABULAR_STREAM' });
  } catch (e) {
    noProviderRejected = e.code === 'INVALID_INPUT';
  }
  _report_('UQO sin provider → INVALID_INPUT',  noProviderRejected);

  // Test: UQO sin protocol es rechazado
  let noProtocolRejected = false;
  try {
    route({ provider: 'notion' });
  } catch (e) {
    noProtocolRejected = e.code === 'INVALID_INPUT';
  }
  _report_('UQO sin protocol → INVALID_INPUT',  noProtocolRejected);

  // Test: provider inexistente → PROVIDER_NOT_FOUND
  let providerNotFound = false;
  try {
    route({ provider: 'provider_xyz_inexistente', protocol: 'TABULAR_STREAM' });
  } catch (e) {
    providerNotFound = e.code === 'PROVIDER_NOT_FOUND';
  }
  _report_('Provider inexistente → PROVIDER_NOT_FOUND', providerNotFound);

  flushLogs();
}

// ─── CAPA 0: GATEWAY (SIMULACIÓN COMPLETA) ────────────────────────────────────

function testLayer0_Gateway() {
  _suite_('Capa 0 — api_gateway.gs (simulación de doPost)');

  // Test helper: construye un objeto evento falso de GAS
  function makeEvent(payload) {
    return { postData: { contents: JSON.stringify(payload) } };
  }

  // Test 1: Body vacío → error de parseo
  const emptyResponse = doPost({ postData: { contents: '' } });
  const emptyBody     = JSON.parse(emptyResponse.getContent());
  _report_('Body vacío → response con status ERROR o BOOTSTRAP',
           ['ERROR', 'BOOTSTRAP', 'UNAUTHORIZED'].includes(emptyBody.metadata?.status),
           `status: "${emptyBody.metadata?.status}"`);

  // Test 2: Servidor no bootstrapped → status BOOTSTRAP
  if (!isBootstrapped()) {
    const manifestResp = doPost(makeEvent({ protocol: 'SYSTEM_MANIFEST' }));
    const body = JSON.parse(manifestResp.getContent());
    _report_('Sin bootstrap → BOOTSTRAP status',
             body.metadata?.status === 'BOOTSTRAP', `status: "${body.metadata?.status}"`);
  } else {
    // Test 2b: Con servidor bootstrapped → password incorrecto → UNAUTHORIZED
    const badPassResp = doPost(makeEvent({ protocol: 'SYSTEM_MANIFEST', password: '___WRONG___' }));
    const body = JSON.parse(badPassResp.getContent());
    _report_('Password incorrecto → UNAUTHORIZED',
             body.metadata?.status === 'UNAUTHORIZED', `status: "${body.metadata?.status}"`);
  }

  // Test 3: Response siempre incluye metadata.logs
  const anyResp = doPost(makeEvent({ protocol: 'SYSTEM_MANIFEST' }));
  const anyBody = JSON.parse(anyResp.getContent());
  _report_('Response siempre tiene metadata.logs',
           Array.isArray(anyBody.metadata?.logs),
           `logs: ${anyBody.metadata?.logs?.length || 0} entries`);

  // Test 4: Response tiene items[]
  _report_('Response siempre tiene items[]',
           Array.isArray(anyBody.items));
}

// ─── SUITE COMPLETA ───────────────────────────────────────────────────────────

/**
 * Ejecuta todos los tests de todas las capas en secuencia.
 * Esta es la función principal para una verificación completa del Core.
 */
function testAll() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        UNIVERSAL CORE SYSTEM — DIAGNOSTIC SUITE         ║');
  console.log('║                   core_diagnostics.gs                   ║');
  console.log(`║           ${new Date().toISOString()}           ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  testLayer4_ErrorHandler();
  testLayer3_MonitoringService();
  testLayer3_SystemConfig();
  testLayer1_ProviderRegistry();
  testLayer1_ProtocolRouter();
  testLayer0_Gateway();

  console.log('');
  console.log('═'.repeat(60));
  console.log('✓ Suite de diagnóstico completada.');
  console.log('  Revisar ❌ FAIL para errores. ✅ PASS = correcto.');
  console.log('═'.repeat(60));
}
