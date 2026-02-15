// ======================================================================
// ARTEFACTO: 3_Adapters/TikTokAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el TikTokAdapter.
// ======================================================================

function testTikTokAdapter_Discovery() {
    const setup = _tiktok_setup();
    const adapter = createTikTokAdapter(setup.deps);

    assert.exists(adapter.getUserProfile, 'Debe exponer getUserProfile');
    assert.exists(adapter.getVideos, 'Debe exponer getVideos');
    assert.exists(adapter.publishVideo, 'Debe exponer publishVideo');
    assert.exists(adapter.getAnalytics, 'Debe exponer getAnalytics');
}

function testTikTokAdapter_GetUserProfile_Exito() {
    const setup = _tiktok_setup();
    const adapter = createTikTokAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            assert.includes('open.tiktokapis.com', url);
            assert.includes('/user/info/', url);
            assert.areEqual('Bearer mock-api-key', options.headers.Authorization);

            return {
                getResponseCode: () => 200,
                getContentText: () => JSON.stringify({ data: { user: { display_name: 'TikTok Indra' } } })
            };
        }
    };

    const result = adapter.getUserProfile();
    assert.areEqual('TikTok Indra', result.displayName);
}

function testTikTokAdapter_PublishVideo_Exito() {
    const setup = _tiktok_setup();
    const adapter = createTikTokAdapter(setup.deps);
    let calls = 0;

    globalThis.UrlFetchApp = {
        fetch: (url, options) => {
            calls++;
            if (calls === 1) {
                // Upload container
                assert.includes('/video/upload/', url);
                return {
                    getResponseCode: () => 200,
                    getContentText: () => JSON.stringify({ data: { upload_url: 'https://upload.tiktok.com/123' } })
                };
            } else {
                // Publish
                assert.includes('/video/publish/', url);
                const payload = JSON.parse(options.payload);
                assert.areEqual('https://upload.tiktok.com/123', payload.data.video.upload_url);
                return {
                    getResponseCode: () => 200,
                    getContentText: () => JSON.stringify({ data: { video_id: 'vid_789', status: 'PROCESSING' } })
                };
            }
        }
    };

    const result = adapter.publishVideo({ videoUrl: 'http://my.mp4', description: 'IA Test' });
    assert.areEqual('vid_789', result.data.video_id);
    assert.areEqual(2, calls, 'Debe realizar 2 llamadas');
}

function testTikTokAdapter_Error_APIFalla() {
    const setup = _tiktok_setup();
    const adapter = createTikTokAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: () => ({
            getResponseCode: () => 401,
            getContentText: () => JSON.stringify({ error: { message: "Invalid Token" } })
        })
    };

    try {
        adapter.getVideos();
        assert.fail('Debe lanzar error de API');
    } catch (e) {
        assert.areEqual('TIKTOK_API_ERROR', e.code);
    }
}

// --- HELPERS DE SETUP ---

function _tiktok_setup() {
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
                openId: 'mock_open_id'
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





