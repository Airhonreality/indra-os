// ======================================================================
// ARTEFACTO: 3_Adapters/LLMAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el LLMAdapter.
// ======================================================================

function testLLMAdapter_Discovery() {
    const setup = _llm_setup();
    const adapter = createLLMAdapter(setup.deps);

    assert.exists(adapter.chat, 'Debe exponer el método chat');
    assert.exists(adapter.chatGemini, 'Debe exponer el método chatGemini');
}

function testLLMAdapter_Gemini_Exito() {
    const setup = _llm_setup();
    const adapter = createLLMAdapter(setup.deps);

    // Mock de UrlFetchApp para simular respuesta de Gemini
    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            assert.includes('generativelanguage.googleapis.com', url, 'Debe llamar a la API de Google');
            assert.includes('key=mock-api-key', url, 'Debe incluir la API Key en el URL');

            const payload = JSON.parse(options.payload);
            assert.areEqual('Hola Gemini', payload.contents[0].parts[0].text, 'El prompt debe ser correcto');

            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({
                    candidates: [{
                        content: { parts: [{ text: 'Respuesta simulada' }] },
                        finishReason: 'STOP'
                    }]
                })
            };
        }
    };

    const result = adapter.chatGemini({ prompt: 'Hola Gemini' });

    assert.areEqual('Respuesta simulada', result.response, 'La respuesta debe ser la del mock');
    assert.areEqual('gemini', result.metadata.provider, 'El provider debe ser gemini');
}

function testLLMAdapter_Gemini_ConCuentaEspecifica() {
    const setup = _llm_setup();
    const adapter = createLLMAdapter(setup.deps);

    setup.mocks.mockTokenManager.getToken = (payload) => {
        assert.areEqual('gemini', payload.provider);
        assert.areEqual('work-account', payload.accountId, 'Debe solicitar la cuenta de trabajo');
        return { apiKey: 'work-api-key' };
    };

    globalThis.UrlFetchApp = {
        fetch: (url) => {
            assert.includes('key=work-api-key', url, 'Debe usar la API Key de la cuenta de trabajo');
            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] })
            };
        }
    };

    adapter.chatGemini({ prompt: 'test', accountId: 'work-account' });
}

function testLLMAdapter_Error_ProviderFalla() {
    const setup = _llm_setup();
    const adapter = createLLMAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: () => ({
            getResponseCode: () => 400,
            getContentText: () => '{"error": "API Key Invalid"}'
        })
    };

    try {
        adapter.chatGemini({ prompt: 'falla' });
        assert.fail('Debe lanzar error si el proveedor falla');
    } catch (e) {
        assert.areEqual('LLM_PROVIDER_ERROR', e.code, 'El código de error debe ser consistente');
    }
}

// --- HELPERS DE SETUP ---

function _llm_setup() {
    const mockErrorHandler = {
        createError: (code, message) => {
            const e = new Error(message);
            e.code = code;
            return e;
        }
    };

    const mockTokenManager = {
        getToken: ({ provider, accountId }) => {
            return { apiKey: 'mock-api-key' };
        }
    };

    return {
        deps: {
            errorHandler: mockErrorHandler,
            tokenManager: mockTokenManager
        },
        mocks: {
            mockErrorHandler,
            mockTokenManager
        }
    };
}
