// ======================================================================
// ARTEFACTO: 3_Adapters/MessengerAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el MessengerAdapter.
// ======================================================================

function testMessengerAdapter_Routing_Exito() {
    const setup = _messenger_setup();
    const adapter = createMessengerAdapter(setup.deps);

    let waCalled = false;
    const mockWA = {
        sendMessage: (params) => {
            waCalled = true;
            return {
                metaResponse: {
                    messages: [{ id: 'wa_123' }]
                }
            };
        }
    };

    adapter.registerProvider('whatsapp', mockWA);

    const result = adapter.send({
        to: '57300',
        body: 'Test messenger',
        platform: 'whatsapp'
    });

    assert.areEqual(true, result.success);
    assert.areEqual('whatsapp', result.platform);
    assert.areEqual('wa_123', result.externalId);
    assert.areEqual(true, waCalled, 'Debe llamar al adapter de WhatsApp');
}

function _messenger_setup() {
    return {
        deps: {
            errorHandler: {
                createError: (code, msg) => {
                    const e = new Error(msg);
                    e.code = code;
                    return e;
                }
            }
        }
    };
}
