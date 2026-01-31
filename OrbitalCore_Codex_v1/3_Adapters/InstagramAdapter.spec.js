// ======================================================================
// ARTEFACTO: 3_Adapters/InstagramAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el InstagramAdapter.
// ======================================================================

function testInstagramAdapter_Discovery() {
    const setup = _ig_setup();
    const adapter = createInstagramAdapter(setup.deps);

    assert.exists(adapter.getUserProfile, 'Debe exponer getUserProfile');
    assert.exists(adapter.getMedia, 'Debe exponer getMedia');
    assert.exists(adapter.postComment, 'Debe exponer postComment');
    assert.exists(adapter.publishMedia, 'Debe exponer publishMedia');
    assert.exists(adapter.sendDirectMessage, 'Debe exponer sendDirectMessage');
}

function testInstagramAdapter_GetUserProfile_Exito() {
    const setup = _ig_setup();
    const adapter = createInstagramAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            assert.includes('graph.facebook.com', url);
            assert.includes('mock_ig_id', url);
            assert.areEqual('Bearer mock-api-key', options.headers.Authorization);

            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({ id: 'mock_ig_id', username: 'indra_ai' })
            };
        }
    };

    const result = adapter.getUserProfile();
    assert.areEqual('indra_ai', result.username);
}

function testInstagramAdapter_PostComment_Exito() {
    const setup = _ig_setup();
    const adapter = createInstagramAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            assert.areEqual('post', options.method);
            const payload = JSON.parse(options.payload);
            assert.areEqual('Hola!', payload.message);

            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({ id: 'comment_123' })
            };
        }
    };

    const result = adapter.postComment({ mediaId: 'media_456', message: 'Hola!' });
    assert.areEqual('comment_123', result.id);
}

function testInstagramAdapter_PublishMedia_Exito() {
    const setup = _ig_setup();
    const adapter = createInstagramAdapter(setup.deps);
    let calls = 0;

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            calls++;
            if (calls === 1) {
                // Creación de contenedor
                assert.includes('/media', url);
                return {
                    getResponseCode: () => 200,
                    getContentText: () => JSON.stringify({ id: 'container_999' })
                };
            } else {
                // Publicación
                assert.includes('/media_publish', url);
                const payload = JSON.parse(options.payload);
                assert.areEqual('container_999', payload.creation_id);
                return {
                    getResponseCode: () => 200,
                    getContentText: () => JSON.stringify({ id: 'media_post_111' })
                };
            }
        }
    };

    const result = adapter.publishMedia({ imageUrl: 'http://img.jpg', caption: 'Test' });
    assert.areEqual('media_post_111', result.id);
    assert.areEqual(2, calls, 'Debe realizar 2 llamadas (container + publish)');
}

function testInstagramAdapter_SendDM_Exito() {
    const setup = _ig_setup();
    const adapter = createInstagramAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            assert.includes('/messages', url);
            assert.areEqual('post', options.method);
            const payload = JSON.parse(options.payload);
            assert.areEqual('user_123', payload.recipient.id);
            assert.areEqual('Hola DM', payload.message.text);

            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({ message_id: 'dm_789' })
            };
        }
    };

    const result = adapter.sendDirectMessage({ recipientId: 'user_123', message: 'Hola DM' });
    assert.areEqual('dm_789', result.message_id);
}

function testInstagramAdapter_Error_RateLimit() {
    const setup = _ig_setup();
    const adapter = createInstagramAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: () => ({
            getResponseCode: () => 429,
            getContentText: () => JSON.stringify({ error: { message: "Rate limit hit" } })
        })
    };

    try {
        adapter.getUserProfile();
        assert.fail('Debe lanzar error de Rate Limit');
    } catch (e) {
        assert.areEqual('RATE_LIMIT_EXCEEDED', e.code);
    }
}

// --- HELPERS DE SETUP ---

function _ig_setup() {
    const mockErrorHandler = {
        createError: (code, message, context) => {
            const e = new Error(message);
            e.code = code;
            e.context = context;
            return e;
        }
    };

    const mockTokenManager = {
        getToken: ({ provider, accountId }) => {
            return {
                apiKey: 'mock-api-key',
                igUserId: 'mock_ig_id'
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
