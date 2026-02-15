// ======================================================================
// ARTEFACTO: 3_Adapters/WhatsAppAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el WhatsAppAdapter.
// ======================================================================

function testWhatsAppAdapter_Discovery() {
    const setup = _waba_setup();
    const adapter = createWhatsAppAdapter(setup.deps);

    assert.exists(adapter.sendMessage, 'Debe exponer el método sendMessage');
}

function testWhatsAppAdapter_SendText_Exito() {
    const setup = _waba_setup();
    const adapter = createWhatsAppAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            assert.includes('graph.facebook.com', url, 'Debe llamar a la API de Meta');
            assert.includes('106540352242922', url, 'Debe incluir el phoneNumberId en el URL');
            assert.areEqual('Bearer mock-api-key', options.headers.Authorization, 'Debe incluir el token Bearer');

            const payload = JSON.parse(options.payload);
            assert.areEqual('text', payload.type, 'El tipo debe ser text');
            assert.areEqual('Hola Mundo', payload.text.body, 'El cuerpo del mensaje debe ser correcto');

            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({ messaging_product: "whatsapp", contacts: [{ wa_id: "123" }], messages: [{ id: "wamid.123" }] })
            };
        }
    };

    const result = adapter.sendMessage({ to: '123456789', message: 'Hola Mundo' });
    assert.exists(result.messages[0].id, 'Debe retornar el ID del mensaje enviado');
}

function testWhatsAppAdapter_SendTemplate_Exito() {
    const setup = _waba_setup();
    const adapter = createWhatsAppAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            const payload = JSON.parse(options.payload);
            assert.areEqual('template', payload.type);
            assert.areEqual('hello_world', payload.template.name);
            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({ success: true })
            };
        }
    };

    adapter.sendMessage({
        to: '123',
        template: { name: 'hello_world', language: { code: 'en_US' } }
    });
}

function testWhatsAppAdapter_Error_APIFalla() {
    const setup = _waba_setup();
    const adapter = createWhatsAppAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: () => ({
            getResponseCode: () => 400,
            getContentText: () => JSON.stringify({ error: { message: "Invalid parameter" } })
        })
    };

    try {
        adapter.sendMessage({ to: '123', message: 'test' });
        assert.fail('Debe lanzar error si la API responde con error');
    } catch (e) {
        assert.areEqual('WHATSAPP_API_ERROR', e.code);
    }
}

// --- HELPERS DE SETUP ---

function _waba_setup() {
    const mockErrorHandler = {
        createError: (code, message) => {
            const e = new Error(message);
            e.code = code;
            return e;
        }
    };

    const mockTokenManager = {
        getToken: ({ provider, accountId }) => {
            return {
                apiKey: 'mock-api-key',
                phoneNumberId: '106540352242922'
            };
        }
    };

    return {
        deps: {
            errorHandler: mockErrorHandler,
            tokenManager: mockTokenManager
        }
    };
}





