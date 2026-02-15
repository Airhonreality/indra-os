// ======================================================================
// ARTEFACTO: 3_Adapters/EmailAdapter.spec.js (SINCRONIZADO)
// ======================================================================

/**
 * Helper de Setup centralizado para todos los tests de EmailAdapter.
 */
function _setupEmailAdapterTests() {
  const originals = {
    GmailApp: globalThis.GmailApp
  };

  const mocks = {
    mockErrorHandler: {
      createError: (code, msg, details) => { const e = new Error(msg); e.code = code; e.details = details; return e; }
    },
    mockGmailApp: {
      _callLog: [],
      sendEmail: function(to, subject, body, options) {
        this._callLog.push({ method: 'sendEmail', args: [to, subject, body, options] });
      }
    }
  };
  
  globalThis.GmailApp = mocks.mockGmailApp;

  return { mocks, originals };
}

/**
 * Helper de Teardown para restaurar el estado global.
 */
function _teardownEmailAdapterTests(originals) {
  globalThis.GmailApp = originals.GmailApp;
}

// ============================================================
// SUITE DE TESTS PARA EMAILADAPTER
// ============================================================

function testEmailAdapter_Send_debeLlamarAGmailAppConParametrosSimples() {
  const setup = _setupEmailAdapterTests();
  try {
    const emailAdapter = createEmailAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    const payload = {
      to: 'test@example.com',
      subject: 'Asunto de Prueba',
      body: 'Cuerpo del mensaje.'
    };
    
    emailAdapter.send(payload);
    
    assert.arrayLength(setup.mocks.mockGmailApp._callLog, 1, 'GmailApp.sendEmail debió ser llamado una vez.');
    
    const callArgs = setup.mocks.mockGmailApp._callLog[0].args;
    assert.areEqual('test@example.com', callArgs[0]);
    assert.areEqual('Asunto de Prueba', callArgs[1]);
    assert.areEqual('Cuerpo del mensaje.', callArgs[2]);
    
    return true;
  } finally {
    _teardownEmailAdapterTests(setup.originals);
  }
}

/**
 * VR-G-1.1 & VR-G-1.2: Probar que las opciones avanzadas se pasan correctamente a `GmailApp`.
 */
function testEmailAdapter_Send_debePasarLasOpcionesAvanzadasCorrectamente() {
  const setup = _setupEmailAdapterTests();
  try {
    const emailAdapter = createEmailAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    // --- INICIO DE LA CORRECCIÓN: Usar un mock de Blob de alta fidelidad ---
    const mockAttachment = { 
      getName: () => 'file.pdf',
      getBytes: () => [1,2,3] // Simular un blob real
    };
    // --- FIN DE LA CORRECCIÓN ---
    const payload = {
      to: 'test@example.com',
      subject: 'Asunto Avanzado',
      body: 'Cuerpo simple.',
      options: {
        htmlBody: '<p>Cuerpo HTML.</p>',
        cc: 'cc@example.com',
        bcc: 'bcc@example.com',
        attachments: [mockAttachment], // Pasarlo como un array
        name: 'Sistema Indra Core',
        replyTo: 'noreply@example.com'
      }
    };
    
    emailAdapter.send(payload);
    
    assert.arrayLength(setup.mocks.mockGmailApp._callLog, 1, 'GmailApp.sendEmail debió ser llamado.');
    const optionsPassed = setup.mocks.mockGmailApp._callLog[0].args[3];
    
    assert.isNotNull(optionsPassed, 'El objeto de opciones debió ser pasado.');
    assert.areEqual('<p>Cuerpo HTML.</p>', optionsPassed.htmlBody);
    assert.areEqual('cc@example.com', optionsPassed.cc);
    assert.areEqual('bcc@example.com', optionsPassed.bcc);
    // --- INICIO DE LA CORRECCIÓN: Verificar el array de adjuntos ---
    assert.isTrue(Array.isArray(optionsPassed.attachments), 'attachments debe ser un array.');
    // --- FIN DE LA CORRECCIÓN ---
    assert.arrayLength(optionsPassed.attachments, 1);
    assert.areEqual(mockAttachment, optionsPassed.attachments[0]);
    assert.areEqual('Sistema Indra Core', optionsPassed.name);
    assert.areEqual('noreply@example.com', optionsPassed.replyTo);

    return true;
  } finally {
    _teardownEmailAdapterTests(setup.originals);
  }
}

function testEmailAdapter_Send_debeRetornarElPayloadOriginalSinModificaciones() {
  const setup = _setupEmailAdapterTests();
  try {
    const emailAdapter = createEmailAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    const payload = { to: 'a@a.com', subject: 'b', body: 'c', options: { htmlBody: 'd' } };
    
    const result = emailAdapter.send(payload);
    
    assert.areEqual(payload, result, 'El objeto retornado debe ser el mismo objeto de entrada.');

    return true;
  } finally {
    _teardownEmailAdapterTests(setup.originals);
  }
}

/**
 * Probar que la validación de parámetros de entrada funciona.
 */
function testEmailAdapter_Validacion_debeFallarSiFaltanParametrosRequeridos() {
  const setup = _setupEmailAdapterTests();
  try {
    const emailAdapter = createEmailAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    
    assert.throws(() => {
      emailAdapter.send({ subject: 'Asunto', body: 'Cuerpo' });
    }, 'CONFIGURATION_ERROR');
    
    assert.throws(() => {
      emailAdapter.send({ to: 'test@example.com', body: 'Cuerpo' });
    }, 'CONFIGURATION_ERROR');
    
    assert.throws(() => {
      emailAdapter.send({ to: 'test@example.com', subject: 'Asunto' });
    }, 'CONFIGURATION_ERROR');
    
    return true;
  } finally {
    _teardownEmailAdapterTests(setup.originals);
  }
}

/**
 * VR-G-2.1: Probar que el adaptador captura y relanza los errores de `GmailApp`.
 */
function testEmailAdapter_ManejoDeErrores_debeCapturarYRelanzarErroresDeGmailApp() {
  const setup = _setupEmailAdapterTests();
  try {
    setup.mocks.mockGmailApp.sendEmail = () => { throw new Error('Invalid address'); };
    const emailAdapter = createEmailAdapter({ errorHandler: setup.mocks.mockErrorHandler });
    
    assert.throws(() => {
      emailAdapter.send({ to: 'invalid', subject: 'test', body: 'test' });
    }, 'SYSTEM_FAILURE');
    
    return true;
  } finally {
    _teardownEmailAdapterTests(setup.originals);
  }
}





