// ======================================================================
// ARTEFACTO: 4_Infra/ErrorHandler.spec.js
// PROPÓSITO: Suite de tests unitarios COMPLETA y NATIVA para ErrorHandler.gs.
// ESTRATEGIA: Testeo de lógica pura. No se requieren mocks ya que el
//             artefacto es autocontenido y no tiene dependencias.
// ======================================================================

/**
 * Helper de Setup para todos los tests de ErrorHandler.
 * Este módulo es de lógica pura y no tiene dependencias, por lo que no se necesitan mocks.
 * @returns {Object} Un objeto con una propiedad 'originals' vacía por consistencia estructural.
 */
function _setupErrorHandlerTests() {
  return { originals: {} };
}

/**
 * Helper de Teardown para todos los tests de ErrorHandler.
 * No hay estado global que limpiar para este módulo.
 */
function _teardownErrorHandlerTests(originals) {
  // No hay nada que restaurar.
}

// ============================================================
// SUITE DE TESTS PARA ERRORHANDLER
// ============================================================

/**
 * VR-X-1.1: Probar que `createError` produce un objeto con la estructura completa.
 */
function testErrorHandler_CreateError_debeProducirUnObjetoDeErrorConEstructuraCompleta() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();
    const testDetails = { info: 'extra data' };

    // Act
    const error = errorHandler.createError('TEST_CODE', 'Test Message', testDetails);

    // Assert
    assert.isNotNull(error, 'El error no debe ser nulo.');
    assert.isTrue(error instanceof Error, 'El resultado debe ser una instancia de Error.');
    assert.areEqual('TEST_CODE', error.code, 'El código del error no coincide.');
    assert.areEqual('Test Message', error.message, 'El mensaje del error no coincide.');
    assert.isNotNull(error.timestamp, 'El timestamp no debe ser nulo.');
    assert.isType(error.timestamp, 'string', 'El timestamp debe ser un string ISO.');
    assert.areEqual('extra data', error.details.info, 'Los detalles del error no coinciden.');
    assert.isNotNull(error.severity, 'La severidad no debe ser nula.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}

/**
 * VR-X-2.1 (Caso Warning): Probar que un código no-crítico resulta en `severity: "WARNING"`.
 */
function testErrorHandler_CreateError_debeAsignarSeverityWarningPorDefecto() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();

    // Act
    const error = errorHandler.createError('UNCLASSIFIED_ERROR', 'This is a standard warning.');

    // Assert
    assert.areEqual('WARNING', error.severity, 'La severidad por defecto para un código no clasificado debe ser WARNING.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}

/**
 * VR-X-2.1 (Caso Critical): Probar que un código crítico resulta en `severity: "CRITICAL"`.
 */
function testErrorHandler_CreateError_debeAsignarSeverityCriticalParaCodigosCriticos() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();

    // Act
    const criticalError = errorHandler.createError('INVALID_CREDENTIALS', 'Token inválido.');

    // Assert
    assert.areEqual('CRITICAL', criticalError.severity, 'La severidad para INVALID_CREDENTIALS debe ser CRITICAL.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}

/**
 * VR-X-3.1 (Caso True): Probar que `isRecoverable` funciona para un código recuperable.
 */
function testErrorHandler_IsRecoverable_debeRetornarTrueParaCodigosRecuperables() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();
    const recoverableError = { code: 'RATE_LIMIT' }; // Objeto simple que cumple el contrato

    // Act
    const result = errorHandler.isRecoverable(recoverableError);

    // Assert
    assert.isTrue(result, 'isRecoverable debe retornar true para RATE_LIMIT.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}

/**
 * VR-X-3.1 (Caso False): Probar que `isRecoverable` devuelve false para un código no recuperable.
 */
function testErrorHandler_IsRecoverable_debeRetornarFalseParaCodigosNoRecuperables() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();
    const nonRecoverableError = { code: 'SYSTEM_FAILURE' };

    // Act
    const result = errorHandler.isRecoverable(nonRecoverableError);

    // Assert
    assert.isFalse(result, 'isRecoverable debe retornar false para SYSTEM_FAILURE.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}

/**
 * VR-X-3.1 (Caso Límite): Probar que `isRecoverable` devuelve false para entradas inválidas.
 */
function testErrorHandler_IsRecoverable_debeRetornarFalseParaEntradasInvalidas() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();
    const errorWithoutCode = { message: 'Some error' };
    const nullInput = null;
    const undefinedInput = undefined;

    // Act & Assert
    assert.isFalse(errorHandler.isRecoverable(errorWithoutCode), 'Debe retornar false para un error sin propiedad .code.');
    assert.isFalse(errorHandler.isRecoverable(nullInput), 'Debe retornar false para una entrada null.');
    assert.isFalse(errorHandler.isRecoverable(undefinedInput), 'Debe retornar false para una entrada undefined.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}

/**
 * VR-X-4.1 (Caso True): Probar que `requiresImmediateAttention` devuelve `true` para un error crítico.
 */
function testErrorHandler_RequiresImmediateAttention_debeRetornarTrueParaSeverityCritical() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();
    const criticalError = { severity: 'CRITICAL' };

    // Act
    const result = errorHandler.requiresImmediateAttention(criticalError);

    // Assert
    assert.isTrue(result, 'requiresImmediateAttention debe retornar true para severity CRITICAL.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}

/**
 * VR-X-4.1 (Caso False): Probar que `requiresImmediateAttention` devuelve false para un error no crítico.
 */
function testErrorHandler_RequiresImmediateAttention_debeRetornarFalseParaSeverityWarning() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();
    const warningError = { severity: 'WARNING' };

    // Act
    const result = errorHandler.requiresImmediateAttention(warningError);

    // Assert
    assert.isFalse(result, 'requiresImmediateAttention debe retornar false para severity WARNING.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}

/**
 * VR-X-4.1 (Caso Límite): Probar que `requiresImmediateAttention` devuelve false para entradas inválidas.
 */
function testErrorHandler_RequiresImmediateAttention_debeRetornarFalseParaEntradasInvalidas() {
  const setup = _setupErrorHandlerTests();
  try {
    // Arrange
    const errorHandler = createErrorHandler();
    const errorWithoutSeverity = { code: 'SOME_CODE' };
    const nullInput = null;
    const undefinedInput = undefined;

    // Act & Assert
    assert.isFalse(errorHandler.requiresImmediateAttention(errorWithoutSeverity), 'Debe retornar false para un error sin propiedad .severity.');
    assert.isFalse(errorHandler.requiresImmediateAttention(nullInput), 'Debe retornar false para una entrada null.');
    assert.isFalse(errorHandler.requiresImmediateAttention(undefinedInput), 'Debe retornar false para una entrada undefined.');
    
    return true;
  } finally {
    _teardownErrorHandlerTests(setup.originals);
  }
}