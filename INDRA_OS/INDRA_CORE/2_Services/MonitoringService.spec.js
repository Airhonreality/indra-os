// ======================================================================
// ARTEFACTO: 2_Services/MonitoringService.spec.js (REFACTORIZADO)
// PROPÓSITO: Suite de tests para MonitoringService, verificando la delegación
//            correcta de llamadas a sus dependencias (sheetAdapter, emailAdapter).
// ======================================================================

function _setupMonitoringServiceTests() {
  const originals = {}; // No hay globales que mockear

  const mocks = {
    mockManifest: {
      SHEETS_SCHEMA: {
        AUDIT_LOG: {
          PROPERTY: 'AUDIT_LOG_SHEET_ID',
          HEADER: ['timestamp', 'eventType', 'status', 'details']
        }
      }
    },
    mockConfigurator: {
      _config: {
        'ADMIN_EMAIL': 'admin@example.com',
        'AUDIT_LOG_SHEET_ID': 'mock-sheet-id'
      },
      retrieveParameter: function (payload) { return this._config[payload.key] || null; }
    },
    mockErrorHandler: {
      _isCritical: false,
      requiresImmediateAttention: function (error) { return this._isCritical; },
      createError: (code, msg, details) => { const e = new Error(msg); e.code = code; e.details = details; return e; }
    },
    mockSheetAdapter: {
      _callLog: [],
      appendRow: function (p) { this._callLog.push({ method: 'appendRow', args: [p] }); }
    },
    mockEmailAdapter: {
      _callLog: [],
      send: function (p) { this._callLog.push({ method: 'send', args: [p] }); }
    }
  };

  return { mocks, originals };
}

function _teardownMonitoringServiceTests(originals) {
  // No hay nada que restaurar
}

// ============================================================
// SUITE DE TESTS PARA MONITORINGSERVICE
// ============================================================

function testMonitoringService_FailFast_debeFallarSiFaltaSheetAdapter() {
  const setup = _setupMonitoringServiceTests();
  try {
    assert.throws(() => {
      createMonitoringService({
        manifest: setup.mocks.mockManifest,
        configurator: setup.mocks.mockConfigurator,
        errorHandler: setup.mocks.mockErrorHandler,
        sheetAdapter: null, // Dependencia faltante
        emailAdapter: setup.mocks.mockEmailAdapter
      });
    }, 'CONFIGURATION_ERROR');
    return true;
  } finally {
    _teardownMonitoringServiceTests(setup.originals);
  }
}

function testMonitoringService_FailFast_debeFallarSiFaltaEmailAdapter() {
  const setup = _setupMonitoringServiceTests();
  try {
    assert.throws(() => {
      createMonitoringService({
        manifest: setup.mocks.mockManifest,
        configurator: setup.mocks.mockConfigurator,
        errorHandler: setup.mocks.mockErrorHandler,
        sheetAdapter: setup.mocks.mockSheetAdapter,
        emailAdapter: {} // Contrato incorrecto
      });
    }, 'CONFIGURATION_ERROR');
    return true;
  } finally {
    _teardownMonitoringServiceTests(setup.originals);
  }
}

function testMonitoringService_LogEvent_debeDelegarAAppendRowDelAdapter() {
  const setup = _setupMonitoringServiceTests();
  try {
    const monitoringService = createMonitoringService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      emailAdapter: setup.mocks.mockEmailAdapter
    });

    monitoringService.logEvent({ eventType: 'TEST_EVENT', status: 'SUCCESS', details: { info: 'data' } });

    assert.arrayLength(setup.mocks.mockSheetAdapter._callLog, 1, "sheetAdapter.appendRow debió ser llamado.");
    const call = setup.mocks.mockSheetAdapter._callLog[0];

    assert.areEqual('mock-sheet-id', call.args[0].sheetId, "El sheetId es incorrecto.");

    const rowData = call.args[0].rowData;
    const header = setup.mocks.mockManifest.SHEETS_SCHEMA.AUDIT_LOG.HEADER;
    assert.areEqual('TEST_EVENT', rowData[header.indexOf('eventType')], "La fila no contiene el eventType correcto.");
    assert.areEqual('{"info":"data"}', rowData[header.indexOf('details')], "Los details no fueron serializados a JSON.");

    return true;
  } finally {
    _teardownMonitoringServiceTests(setup.originals);
  }
}

function testMonitoringService_LogEvent_noDebeHacerNadaSiSheetIdNoEstaConfigurado() {
  const setup = _setupMonitoringServiceTests();
  try {
    setup.mocks.mockConfigurator._config['AUDIT_LOG_SHEET_ID'] = null;
    const monitoringService = createMonitoringService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      emailAdapter: setup.mocks.mockEmailAdapter
    });

    monitoringService.logEvent({ eventType: 'TEST_EVENT' });

    assert.arrayLength(setup.mocks.mockSheetAdapter._callLog, 0, "sheetAdapter.appendRow NO debió ser llamado.");
    return true;
  } finally {
    _teardownMonitoringServiceTests(setup.originals);
  }
}

function testMonitoringService_SendCriticalAlert_noDebeEnviarEmailSiElErrorNoEsCritico() {
  const setup = _setupMonitoringServiceTests();
  try {
    setup.mocks.mockErrorHandler._isCritical = false;
    const monitoringService = createMonitoringService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      emailAdapter: setup.mocks.mockEmailAdapter
    });

    const result = monitoringService.sendCriticalAlert({ code: 'WARNING' }, {});

    assert.isFalse(result.sent, 'El resultado "sent" debe ser false.');
    assert.arrayLength(setup.mocks.mockEmailAdapter._callLog, 0, 'emailAdapter.send NO debió ser llamado.');
    return true;
  } finally {
    _teardownMonitoringServiceTests(setup.originals);
  }
}

function testMonitoringService_SendCriticalAlert_debeDelegarAEmailAdapterEnExito() {
  const setup = _setupMonitoringServiceTests();
  try {
    setup.mocks.mockErrorHandler._isCritical = true;
    const monitoringService = createMonitoringService({
      manifest: setup.mocks.mockManifest,
      configurator: setup.mocks.mockConfigurator,
      errorHandler: setup.mocks.mockErrorHandler,
      sheetAdapter: setup.mocks.mockSheetAdapter,
      emailAdapter: setup.mocks.mockEmailAdapter
    });

    const result = monitoringService.sendCriticalAlert({ code: 'DB_FAILURE', message: 'Connection lost' }, { flow: 'test' });

    assert.isTrue(result.sent, 'El resultado "sent" debe ser true.');
    assert.arrayLength(setup.mocks.mockEmailAdapter._callLog, 1, 'emailAdapter.send debió ser llamado.');

    const callPayload = setup.mocks.mockEmailAdapter._callLog[0].args[0];
    assert.areEqual('admin@example.com', callPayload.to);
    assert.isTrue(callPayload.subject.includes('DB_FAILURE'));
    assert.isTrue(callPayload.body.includes('Connection lost'));
    assert.isTrue(callPayload.body.includes('"flow": "test"'), "El contexto debe estar en el cuerpo del email.");

    return true;
  } finally {
    _teardownMonitoringServiceTests(setup.originals);
  }
}





