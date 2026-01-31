// ======================================================================
// ARTEFACTO: 3_Adapters/OracleAdapter.gs
// DHARMA: Proporcionar búsqueda web profunda y extracción de conocimiento (Oráculo).
// VERSION: 5.5.0 (MCEP-Ready)
// ======================================================================

/**
 * Factory para el OracleAdapter (Knowledge Orchestrator).
 * @param {object} dependencies - Dependencias inyectadas.
 * @returns {object} El adaptador congelado.
 */
function createOracleAdapter({ errorHandler, tokenManager }) {
    if (!errorHandler) throw new Error("OracleAdapter: errorHandler is required");
    if (!tokenManager) throw new Error("OracleAdapter: tokenManager is required");

    const schemas = {
        search: {
            description: "Executes institucional web search using a high-integrity cascade of cognitive discovery circuits (Tavily, Serper, Jina).",
            semantic_intent: "SENSOR",
            io_interface: {
                inputs: {
                    query: { type: "string", io_behavior: "STREAM", description: "Natural language query or technical search term." },
                    limit: { type: "number", io_behavior: "SCHEMA", description: "Maximum number of discovery results to return." },
                    provider: { type: "string", io_behavior: "SCHEMA", description: "Target discovery circuit (auto, tavily, serper, jina)." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for identifier routing." }
                },
                outputs: {
                    results: { type: "array", io_behavior: "STREAM", description: "Collection of discovered resource descriptors." },
                    source: { type: "string", io_behavior: "SCHEMA", description: "Successful discovery circuit identifier." }
                }
            }
        },
        extract: {
            description: "Transforms a target external resource (URL) into an institutional markdown data stream via cognitive reading.",
            semantic_intent: "PROBE",
            io_interface: {
                inputs: {
                    url: { type: "string", io_behavior: "GATE", description: "Target resource identifier (URL)." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
                },
                outputs: {
                    content: { type: "string", io_behavior: "STREAM", description: "Extracted linguistic content stream." },
                    title: { type: "string", io_behavior: "STREAM", description: "Resource title descriptor." },
                    markdown: { type: "string", io_behavior: "STREAM", description: "Institutional markdown representation." }
                }
            }
        },
        deepResearch: {
            description: "Orchestrates multi-layered cognitive research by recursive discovery and systematic content extraction.",
            semantic_intent: "SENSOR",
            io_interface: {
                inputs: {
                    topic: { type: "string", io_behavior: "STREAM", description: "Primary research domain or query." },
                    depth: { type: "number", io_behavior: "SCHEMA", description: "Technical depth level for recursive discovery." },
                    accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
                },
                outputs: {
                    context: { type: "string", io_behavior: "STREAM", description: "Compiled institutional research report." },
                    sources: { type: "array", io_behavior: "STREAM", description: "Collection of verified resource descriptors." }
                }
            }
        }
    };

    /**
     * Realiza búsqueda web con lógica de cascada inteligente.
     */
    function search(params = {}) {
        const { query, limit = 5, provider = 'auto', accountId = 'system_default' } = params;
        
        const providersToTry = provider === 'auto' 
            ? ['tavily', 'serper', 'jina'] 
            : [provider];

        for (const p of providersToTry) {
            try {
                const results = _executeSearch(p, query, limit, accountId);
                if (results && results.length > 0) {
                    return { results, source: p };
                }
            } catch (e) {
                console.warn(`Oracle: Circuit ${p} failed, attempting next... Error: ${e.message}`);
                continue;
            }
        }

        throw errorHandler.createError("ORACLE_NO_RESULTS", "All discovery circuits failed or returned empty results for the query.", { query });
    }

    /**
     * Despachador interno de proveedores.
     */
    function _executeSearch(providerName, query, limit, accountId) {
        const connection = _getConnectionData(providerName, accountId);
        
        if (!connection.apiKey && providerName !== 'jina') return null;

        switch (providerName) {
            case 'tavily':
                return _searchTavily(query, limit, connection.apiKey);
            case 'serper':
                return _searchSerper(query, limit, connection.apiKey);
            case 'jina':
                return _searchJina(query, limit);
            default:
                return null;
        }
    }

    function _searchTavily(query, limit, apiKey) {
        const response = UrlFetchApp.fetch("https://api.tavily.com/search", {
            method: "post",
            contentType: "application/json",
            payload: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "smart",
                max_results: limit
            }),
            muteHttpExceptions: true
        });
        
        if (response.getResponseCode() !== 200) return null;
        
        const data = JSON.parse(response.getContentText());
        return (data.results || []).map(r => ({
            title: r.title,
            link: r.url,
            snippet: r.content,
            relevance: r.score
        }));
    }

    function _searchSerper(query, limit, apiKey) {
        const response = UrlFetchApp.fetch("https://google.serper.dev/search", {
            method: "post",
            headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
            payload: JSON.stringify({ q: query, num: limit }),
            muteHttpExceptions: true
        });
        
        if (response.getResponseCode() !== 200) return null;

        const data = JSON.parse(response.getContentText());
        return (data.organic || []).map(r => ({
            title: r.title,
            link: r.link,
            snippet: r.snippet
        }));
    }

    function _searchJina(query, limit) {
        const response = UrlFetchApp.fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
            headers: { "Accept": "application/json" },
            muteHttpExceptions: true
        });
        
        if (response.getResponseCode() !== 200) return null;

        const data = JSON.parse(response.getContentText());
        const items = data.data || data;
        return (Array.isArray(items) ? items : []).slice(0, limit).map(r => ({
            title: r.title,
            link: r.url,
            snippet: r.description || r.content
        }));
    }

    /**
     * Extrae contenido de una URL vía Jina Reader.
     */
    function extract(params = {}) {
        const { url } = params;
        
        try {
            const response = UrlFetchApp.fetch(`https://r.jina.ai/${url}`, {
                headers: { "Accept": "application/json" },
                muteHttpExceptions: true
            });

            if (response.getResponseCode() !== 200) {
                throw errorHandler.createError("ORACLE_EXTRACT_ERROR", `Failed to extract content from ${url}. Code: ${response.getResponseCode()}`);
            }

            const contentText = response.getContentText();
            let data;
            try {
                data = JSON.parse(contentText);
            } catch (e) {
                data = { content: contentText, markdown: contentText, title: "Web Content" };
            }

            return {
                content: data.content || data.markdown || contentText,
                markdown: data.markdown || contentText,
                title: data.title || "Contenido Extraído"
            };
        } catch (e) {
            if (e.code) throw e;
            throw errorHandler.createError("ORACLE_API_FAILURE", e.message, { service: 'jina', url });
        }
    }

    /**
     * Investiga profundamente un tema mediante recursión y extracción sistemática.
     */
    function deepResearch(params = {}) {
        const { topic, depth = 3, accountId = 'system_default' } = params;
        
        const searchResponse = search({ query: topic, limit: depth, accountId });
        const topLinks = searchResponse.results;
        
        let compiledContext = `# REPORTE DE INVESTIGACIÓN INDUSTRIAL: ${topic.toUpperCase()}\n`;
        compiledContext += `*Circuit Discovery: ${searchResponse.source}*\n\n`;
        const sources = [];

        topLinks.forEach((link, index) => {
            try {
                const extraction = extract({ url: link.link, accountId });
                compiledContext += `## FUENTE ${index + 1}: ${link.title}\n`;
                compiledContext += `> URL: ${link.link}\n\n`;
                // Limitación de tamaño para evitar desbordamiento de contexto
                compiledContext += (extraction.markdown.substring(0, 4000)) + "\n\n"; 
                sources.push({ title: link.title, url: link.link });
            } catch (e) {
                compiledContext += `## FUENTE ${index + 1}: [EXTRACTION_FAILURE] ${link.title} (${link.link})\n\n`;
            }
        });

        return {
            context: compiledContext,
            sources: sources
        };
    }

    /**
     * Helper para obtener credenciales de circuitos externos.
     */
    function _getConnectionData(provider, accountId) {
        try {
            return tokenManager.getToken({ provider, accountId }) || { apiKey: null };
        } catch (e) {
            return { apiKey: null };
        }
    }

    return Object.freeze({
        label: "Knowledge Orchestrator",
        description: "Industrial engine for deep web discovery, cognitive content extraction, and recursive research orchestration.",
        semantic_intent: "SENSOR",
        schemas: schemas,
        search,
        extract,
        deepResearch
    });
}

