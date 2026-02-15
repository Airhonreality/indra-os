// ======================================================================
// ARTEFACTO: 3_Adapters/OracleAdapter.spec.js
// PROPÓSITO: Pruebas unitarias para el OracleAdapter.
// ======================================================================

function testOracleAdapter_Discovery() {
    const setup = _oracle_setup();
    const adapter = createOracleAdapter(setup.deps);

    assert.exists(adapter.search, 'Debe exponer search');
    assert.exists(adapter.extract, 'Debe exponer extract');
    assert.exists(adapter.deepResearch, 'Debe exponer deepResearch');
}

function testOracleAdapter_MultiProvider_Search_Fallback() {
    const setup = _oracle_setup();
    const adapter = createOracleAdapter(setup.deps);
    let calls = [];

    globalThis.UrlFetchApp = {
        fetch: (url) => {
            calls.push(url);
            if (url.includes('api.tavily.com')) {
                // Simulamos que Tavily falla o no tiene tokens
                return {
                    getResponseCode: () => 401,
                    getContentText: () => JSON.stringify({ error: "Unauthorized" })
                };
            }
            if (url.includes('serper.dev')) {
                // Simulamos que Serper funciona
                return {
                    getResponseCode: () => 200,
                    getContentText: () => JSON.stringify({ organic: [{ title: 'Serper Result', link: 'http://ok.com' }] })
                };
            }
            return { getResponseCode: () => 500 };
        }
    };

    const result = adapter.search({ query: 'test' });
    assert.areEqual('serper', result.source, 'Debe haber saltado a Serper tras el fallo de Tavily');
    assert.areEqual('Serper Result', result.results[0].fields.title);
}

function testOracleAdapter_JinaSearch_Exito() {
    const setup = _oracle_setup();
    // Forzamos que no haya llaves para probar Jina (que es libre)
    setup.deps.tokenManager.getToken = () => ({ apiKey: null });
    const adapter = createOracleAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: (url) => {
            if (url.includes('s.jina.ai')) {
                return {
                    getResponseCode: () => 200,
                    getContentText: () => JSON.stringify({ data: [{ title: 'Jina Result', url: 'http://jina.com' }] })
                };
            }
        }
    };

    const result = adapter.search({ query: 'test' });
    assert.areEqual('jina', result.source);
    assert.areEqual('Jina Result', result.results[0].fields.title);
}

function testOracleAdapter_Extract_Exito() {
    const setup = _oracle_setup();
    const adapter = createOracleAdapter(setup.deps);

    globalThis.UrlFetchApp = {
        fetch: () => ({
            getResponseCode: () => 200,
            getContentText: () => "Contenido Markdown"
        })
    };

    const result = adapter.extract({ url: 'http://test.com' });
    assert.includes('Contenido Markdown', result.markdown);
}

function _oracle_setup() {
    return {
        deps: {
            errorHandler: {
                createError: (code, msg) => {
                    const e = new Error(msg);
                    e.code = code;
                    return e;
                }
            },
            tokenManager: {
                getToken: ({ provider }) => {
                    return { apiKey: 'mock-key-' + provider };
                }
            }
        }
    };
}





