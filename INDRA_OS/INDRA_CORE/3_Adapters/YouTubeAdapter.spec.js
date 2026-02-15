// ======================================================================
// ARTEFACTO: 3_Adapters/YouTubeAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el operador de contenido YouTube.
// ======================================================================

function testYouTubeAdapter_Discovery() {
    const setup = _youtube_setup();
    const adapter = createYouTubeAdapter(setup.deps);

    assert.exists(adapter.listChannelVideos, 'Debe exponer listChannelVideos');
    assert.exists(adapter.getVideoMetadata, 'Debe exponer getVideoMetadata');
    assert.exists(adapter.extractTranscript, 'Debe exponer extractTranscript');
}

function testYouTubeAdapter_ListVideos_Exito() {
    const setup = _youtube_setup();
    const adapter = createYouTubeAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: (url) => {
            if (url.includes('channels')) {
                return { getContentText: () => JSON.stringify({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UU123' } } }] }) };
            }
            if (url.includes('playlistItems')) {
                return { getContentText: () => JSON.stringify({ items: [{ snippet: { resourceId: { videoId: 'vid1' }, title: 'Video 1' } }] }) };
            }
        }
    };

    const result = adapter.listChannelVideos({ channelId: 'UC123' });
    assert.areEqual(1, result.videos.length);
    assert.areEqual('Video 1', result.videos[0].caption);
}

function testYouTubeAdapter_ExtractTranscript_Fallback_Sensing() {
    const setup = _youtube_setup();

    // Simulamos un servicio de sensing (capaz de extraer contenido)
    setup.deps.sensingService = {
        extract: (params) => ({ markdown: "Texto extraído del video" })
    };

    const adapter = createYouTubeAdapter(setup.deps);

    const result = adapter.extractTranscript({ videoId: 'vid1' });
    assert.includes('Texto extraído', result.transcript);
    assert.areEqual('fallback_sensing', result.method);
}

function _youtube_setup() {
    return {
        deps: {
            errorHandler: { createError: (code, msg) => { const e = new Error(msg); e.code = code; return e; } },
            tokenManager: { getToken: () => ({ apiKey: 'mock-youtube-key' }) },
            sensingService: {} // Será inyectado en el test específico
        }
    };
}





