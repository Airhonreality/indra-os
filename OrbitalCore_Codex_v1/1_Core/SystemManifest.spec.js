// ======================================================================
// ARTEFACTO: 1_Core/SystemManifest.spec.js
// PROPÓSITO: Suite de tests unitarios COMPLETA y NATIVA para SystemManifest.gs.
// ESTRATEGIA: Verificación directa de la estructura, tipos e integridad
//             de la constante global SYSTEM_MANIFEST. No requiere mocks.
// ======================================================================

/**
 * Helper de Setup para SystemManifest. No necesita mocks.
 */
function _setupSystemManifestTests() {
  return { originals: {} };
}

/**
 * Helper de Teardown. No necesita acciones.
 */
function _teardownSystemManifestTests(originals) {
  // No hay estado global que limpiar.
}

// ============================================================
// SUITE DE TESTS PARA SYSTEMMANIFEST
// ============================================================

/**
 * VR-S-1: Probar que la constante existe, es un objeto y es inmutable.
 */
function testSystemManifest_Estructura_debeExistirYSerInmutable() {
  const setup = _setupSystemManifestTests();
  try {
    // Arrange & Act
    assert.isNotNull(SYSTEM_MANIFEST, "SYSTEM_MANIFEST no debe ser nulo o undefined.");
    assert.isType(SYSTEM_MANIFEST, 'object', "SYSTEM_MANIFEST debe ser un objeto.");
    
    // Assert: Inmutabilidad
    const isFrozen = Object.isFrozen(SYSTEM_MANIFEST);
    assert.isTrue(isFrozen, "SYSTEM_MANIFEST debe estar congelado para ser inmutable.");

    // CORRECCIÓN: En el modo no estricto de Apps Script, la modificación de un objeto
    // congelado falla silenciosamente. En lugar de assert.throws, verificamos que
    // el valor no haya cambiado después del intento de modificación.
    const originalVersion = SYSTEM_MANIFEST.version;
    try {
      SYSTEM_MANIFEST.version = "9.9.9";
    } catch (e) {
      // En modo estricto, esto lanzaría un error, lo cual también es una prueba de éxito.
    }
    assert.areEqual(originalVersion, SYSTEM_MANIFEST.version, "No se debe permitir la modificación de propiedades de un objeto congelado.");

    return true;
  } finally {
    _teardownSystemManifestTests(setup.originals);
  }
}

/**
 * VR-S-2: Probar que el objeto contiene todas las claves raíz requeridas.
 */
function testSystemManifest_Estructura_debeContenerTodasLasClavesRaizRequeridas() {
  const setup = _setupSystemManifestTests();
  try {
    // Arrange & Act & Assert
    assert.hasProperty(SYSTEM_MANIFEST, 'version', "Debe tener la propiedad 'version'.");
    assert.hasProperty(SYSTEM_MANIFEST, 'anchorPropertyKey', "Debe tener la propiedad 'anchorPropertyKey'.");
    assert.hasProperty(SYSTEM_MANIFEST, 'driveSchema', "Debe tener la propiedad 'driveSchema'.");
    assert.hasProperty(SYSTEM_MANIFEST, 'sheetsSchema', "Debe tener la propiedad 'sheetsSchema'.");
    assert.hasProperty(SYSTEM_MANIFEST, 'requiredConnections', "Debe tener la propiedad 'requiredConnections'.");
    assert.hasProperty(SYSTEM_MANIFEST, 'systemLimits', "Debe tener la propiedad 'systemLimits'.");
    
    return true;
  } finally {
    _teardownSystemManifestTests(setup.originals);
  }
}

/**
 * VR-S-3: Probar que `driveSchema` tiene una estructura válida.
 */
function testSystemManifest_DriveSchema_debeTenerUnaEstructuraValida() {
  const setup = _setupSystemManifestTests();
  try {
    // Arrange
    const schema = SYSTEM_MANIFEST.driveSchema;
    
    // Act & Assert
    assert.isType(schema, 'object', 'driveSchema debe ser un objeto.');
    assert.isType(schema.rootFolderName, 'string', 'rootFolderName debe ser un string.');
    assert.isTrue(schema.rootFolderName.length > 0, 'rootFolderName no debe estar vacío.');
    
    assert.isType(schema.jsonFlowsFolder, 'object', 'jsonFlowsFolder debe ser un objeto.');
    assert.isType(schema.jsonFlowsFolder.path, 'string', 'jsonFlowsFolder.path debe ser un string.');
    assert.isTrue(schema.jsonFlowsFolder.path.length > 0, 'jsonFlowsFolder.path no debe estar vacío.');
    
    return true;
  } finally {
    _teardownSystemManifestTests(setup.originals);
  }
}

/**
 * VR-S-4: Probar que `sheetsSchema` define `jobQueue` y `auditLog` correctamente.
 */
function testSystemManifest_SheetsSchema_debeDefinirJobQueueYAuditLogCorrectamente() {
  const setup = _setupSystemManifestTests();
  try {
    // Arrange
    const jobQueueSchema = SYSTEM_MANIFEST.sheetsSchema.jobQueue;
    const auditLogSchema = SYSTEM_MANIFEST.sheetsSchema.auditLog;

    // Act & Assert: Probar JobQueue
    assert.isNotNull(jobQueueSchema, 'jobQueue schema no debe ser nulo.');
    assert.isType(jobQueueSchema.propertyKey, 'string');
    assert.isTrue(jobQueueSchema.propertyKey.length > 0);
    assert.isType(jobQueueSchema.sheetName, 'string');
    assert.isTrue(Array.isArray(jobQueueSchema.header), 'jobQueue.header debe ser un array.');
    assert.isTrue(jobQueueSchema.header.includes('jobId'), 'El header de jobQueue debe incluir "jobId".');

    // Act & Assert: Probar AuditLog
    assert.isNotNull(auditLogSchema, 'auditLog schema no debe ser nulo.');
    assert.isType(auditLogSchema.propertyKey, 'string');
    assert.isTrue(auditLogSchema.propertyKey.length > 0);
    assert.isType(auditLogSchema.sheetName, 'string');
    assert.isTrue(Array.isArray(auditLogSchema.header), 'auditLog.header debe ser un array.');
    assert.isTrue(auditLogSchema.header.includes('timestamp'), 'El header de auditLog debe incluir "timestamp".');
    
    return true;
  } finally {
    _teardownSystemManifestTests(setup.originals);
  }
}

/**
 * VR-S-5: Probar que `requiredConnections` es un objeto con claves y tipos válidos.
 */
function testSystemManifest_RequiredConnections_debeSerUnObjetoConClavesYTiposValidos() {
  const setup = _setupSystemManifestTests();
  try {
    // Arrange
    const connections = SYSTEM_MANIFEST.requiredConnections;
    
    // Act & Assert
    assert.isType(connections, 'object', 'requiredConnections debe ser un objeto.');
    assert.isFalse(Array.isArray(connections), 'requiredConnections NO debe ser un array.');
    
    // Probar una conexión user_provided
    const notionKeyConfig = connections.NOTION_API_KEY;
    assert.isNotNull(notionKeyConfig, 'La conexión NOTION_API_KEY debe estar definida.');
    assert.areEqual('user_provided', notionKeyConfig.type, "El tipo de NOTION_API_KEY debe ser 'user_provided'");
    assert.isType(notionKeyConfig.prompt, 'string');
    
    // Probar una conexión system_generated
    const satelliteKeyConfig = connections.ORBITAL_CORE_SATELLITE_API_KEY;
    assert.isNotNull(satelliteKeyConfig, 'La conexión ORBITAL_CORE_SATELLITE_API_KEY debe estar definida.');
    assert.areEqual('system_generated', satelliteKeyConfig.type, "El tipo de ORBITAL_CORE_SATELLITE_API_KEY debe ser 'system_generated'");
    assert.isType(satelliteKeyConfig.generator, 'object');
    assert.areEqual('uuid', satelliteKeyConfig.generator.type);

    return true;
  } finally {
    _teardownSystemManifestTests(setup.originals);
  }
}

/**
 * VR-S-6: Probar que `systemLimits` contiene valores numéricos válidos.
 */
function testSystemManifest_SystemLimits_debeContenerValoresNumericosValidos() {
  const setup = _setupSystemManifestTests();
  try {
    // Arrange
    const limits = SYSTEM_MANIFEST.systemLimits;
    
    // Act & Assert
    assert.isType(limits, 'object');
    
    assert.isType(limits.maxRetries, 'number');
    assert.isTrue(limits.maxRetries >= 0, 'maxRetries debe ser no-negativo.');
    
    assert.isType(limits.initialBackoffMs, 'number');
    assert.isTrue(limits.initialBackoffMs > 0, 'initialBackoffMs debe ser positivo.');
    
    assert.isType(limits.jobProcessingLockTimeoutMs, 'number');
    assert.isTrue(limits.jobProcessingLockTimeoutMs > 0, 'jobProcessingLockTimeoutMs debe ser positivo.');

    return true;
  } finally {
    _teardownSystemManifestTests(setup.originals);
  }
}