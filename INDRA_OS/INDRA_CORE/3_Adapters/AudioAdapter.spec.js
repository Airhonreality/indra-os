// ======================================================================
// ARTEFACTO: 3_Adapters/AudioAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el sentido del oído y habla (Wit.ai / Google).
// ======================================================================

function testAudioAdapter_Discovery() {
    const setup = _audio_setup();
    const adapter = createAudioAdapter(setup.deps);

    assert.exists(adapter.speechToText, 'Debe exponer speechToText');
    assert.exists(adapter.textToSpeech, 'Debe exponer textToSpeech');
}

function testAudioAdapter_TTS_Core_Exito() {
    const setup = _audio_setup();
    const adapter = createAudioAdapter(setup.deps);

    // Verificamos que genere una URL válida para el motor core
    const result = adapter.textToSpeech({ text: 'Hola mundo' });
    assert.exists(result.audioUrl, 'Debe devolver una URL de audio');
}

function testAudioAdapter_STT_Primary_Exito() {
    const setup = _audio_setup();
    const adapter = createAudioAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: () => ({
            getResponseCode: () => 200,
            getContentText: () => JSON.stringify({ text: 'Transcripción exitosa' })
        })
    };

    const result = adapter.speechToText({ audioUrl: 'http://test.com/audio.ogg' });
    assert.areEqual('Transcripción exitosa', result.content.text);
}

function testAudioAdapter_STT_GracefulDegradation() {
    const setup = _audio_setup();
    // Simulamos que NO hay llave de Wit.ai (Etapa 1 del Bootstrap)
    setup.deps.tokenManager.getToken = () => ({ apiKey: null });
    const adapter = createAudioAdapter(setup.deps);

    const result = adapter.speechToText({ audioUrl: 'http://...' });
    assert.includes('dormido', result.content.text, 'Debe informar que el sentido está dormido sin fallar');
}

function _audio_setup() {
    return {
        deps: {
            errorHandler: { createError: (code, msg) => { const e = new Error(msg); e.code = code; return e; } },
            tokenManager: { getToken: () => ({ apiKey: 'mock-key' }) }
        }
    };
}





