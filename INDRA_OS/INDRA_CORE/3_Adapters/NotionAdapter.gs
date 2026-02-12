
// ARTEFACTO: 3_Adapters/NotionAdapter.gs (VERSIÓN H7 AVANZADA - DEPLOY FORCE V8.0.2)
// DHARMA: Intérprete y Constructor Experto de Notion con Contrato Genérico H7
// PROPÓSITO: Unifica toda la comunicación con la API de Notion, traduciendo
//            estructuras complejas a JSON simple, soportando manipulación
//            avanzada de esquemas y relaciones. Conforme a contrato H7.
// ======================================================================

// ======================================================================
// DIRECTIVAS INMUTABLES DE CONSTRUCCIÓN
// ======================================================================
// #1: LECTURA DE ESQUEMA OBLIGATORIA - NO inferir tipos, leer schema antes de escribir
// #2: BARRERA DE AISLAMIENTO - Aplanar en lectura, enriquecer en escritura
// #3: UNIFICAR COMUNICACIÓN - Un solo helper _notionRequest para toda la red
// #4: MANEJAR LÍMITES - Recursividad controlada, paginación consciente
// #5: CONTRATO ULTRA-ESPECÍFICO - Implementación algorítmica exacta
// #6: CONTRATO H7 - Único parámetro (resolvedPayload), función pura, determinista
// ======================================================================

// ======================================================================
// CONSTANTES DEL ADAPTADOR
// ======================================================================

const NOTION_API_VERSION = '2022-06-28';  // Versión actual estable (2025-09-03 futuro)
const NOTION_BASE_URL = 'https://api.notion.com/v1';
const BLOCK_RECURSION_LIMIT = 5; // Profundidad máxima para bloques anidados
const RELATION_PAGE_LIMIT = 25; // Límite de páginas en propiedades de relación

// ======================================================================
// FACTORY: createNotionAdapter (CONFORME A H7)
// ======================================================================

/**
 * Crea una instancia del NotionAdapter conforme al contrato H7.
 * 
 * @param {object} deps - { errorHandler, tokenManager }
 * @returns {object} Instancia del NotionAdapter (Object.freeze)
 */
function createNotionAdapter({ errorHandler, tokenManager, keyGenerator, monitoringService }) {
  // AXIOMA: Normalización de Monitoreo.
  // Proporciona una interfaz unificada entre el MonitoringService estructurado y el console nativo.
  const _monitor = {
    log: (...args) => (monitoringService && monitoringService.logInfo) ? monitoringService.logInfo(...args) : console.log(...args),
    warn: (...args) => (monitoringService && monitoringService.logWarn) ? monitoringService.logWarn(...args) : console.warn(...args),
    error: (...args) => (monitoringService && monitoringService.logError) ? monitoringService.logError(...args) : console.error(...args),
    info: (...args) => (monitoringService && monitoringService.logInfo) ? monitoringService.logInfo(...args) : console.log(...args)
  };
  
  // ============================================================
  // VALIDACIÓN DE DEPENDENCIAS Y CONFIGURACIÓN
  // ============================================================
  
  if (!errorHandler || typeof errorHandler.createError !== 'function') {
    throw new TypeError('[NotionAdapter] errorHandler contract not fulfilled');
  }
  
  if (!tokenManager || typeof tokenManager.getToken !== 'function') {
    throw errorHandler.createError('CONFIGURATION_ERROR', '[NotionAdapter] tokenManager es obligatorio');
  }
  
  // ============================================================
  // ESTADO INTERNO: CACHÉ DE ESQUEMAS Y TOKEN
  // ============================================================
  
  const schemaCache = {};

  // --- INDRA CANON: Normalización Semántica ---

  function _mapDocumentRecord(page) {
    return {
      id: page.id,
      title: page.properties?.title || page.properties?.Name || page.id,
      content: {
        properties: _flattenProperties(page.properties),
        type: 'NOTION_PAGE'
      },
      url: page.url,
      ORIGIN_SOURCE: 'notion', // AXIOMA: Soberanía de Origen
      mimeType: 'application/vnd.indra.notion-page',
      lastUpdated: page.last_edited_time,
      raw: page
    };
  }

  function _mapDataEntry(page, collectionId = 'notion_db') {
    return {
      id: page.id,
      collection: collectionId,
      fields: _flattenProperties(page.properties),
      timestamp: page.last_edited_time,
      raw: page
    };
  }
  /**
   * Obtiene el token de API de Notion para una cuenta específica.
   * @param {string|null} accountId - ID de la cuenta (null para default)
   * @returns {string} El token de API de Notion
   */
  function _getToken(accountId = null) {
    try {
      // AXIOMA: Soberanía de Identidad (L8)
      // Si accountId es null, el TokenManager buscará la cuenta marcada como 'isDefault'
      const tokenData = tokenManager.getToken({ provider: 'notion', accountId });
      
      if (!tokenData) {
        throw new Error(`Account '${accountId || 'default'}' not found in vault.`);
      }
      
      if (!tokenData.apiKey) {
        throw new Error(`Token data for '${accountId || 'default'}' exists but lacks 'apiKey'.`);
      }
      
      return tokenData.apiKey;
    } catch (e) {
      throw errorHandler.createError(
        'CONFIGURATION_ERROR',
        `[NotionAdapter] Identity Error: ${e.message}`,
        { accountId, provider: 'notion' }
      );
    }
  }
  
  // ============================================================
  // MÉTODO PRIVADO: _notionRequest (CRÍTICO - DIRECTIVA #3)
  // ============================================================
  
  /**
   * Cliente HTTP unificado para toda la comunicación con la API de Notion.
   * Centraliza autenticación, serialización, y manejo de errores HTTP.
   * 
   * @param {string} endpoint - Ruta relativa (ej: '/pages', '/databases/xxx')
   * @param {object} options - { method, payload?, contentType? }
   * @returns {object} Respuesta JSON parseada
   */
  function _notionRequest(endpoint, options = {}) {
    const url = NOTION_BASE_URL + endpoint;
    const accountId = options.accountId || null; // Ya no hay fallback hardcodeado aquí
    const method = options.method || 'get';
    _monitor.info(`[Notion:HTTP] >> ${method.toUpperCase()} ${url} (Account: ${accountId || 'DEFAULT'})`);

    const headers = {
      'Authorization': 'Bearer ' + _getToken(accountId),
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': 'application/json'
    };
    
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: headers,
      muteHttpExceptions: true
    };
    
    if (options.payload) {
      fetchOptions.payload = JSON.stringify(options.payload);
    }
    
    try {
      const response = globalThis.UrlFetchApp.fetch(url, fetchOptions);
      const statusCode = response.getResponseCode();
      const responseText = response.getContentText();
      
      if (statusCode < 200 || statusCode >= 300) {
        let errorMessage = 'Notion API error: ' + statusCode;
        let errorCode = 'NOTION_API_ERROR';
        
        try {
          const errorBody = JSON.parse(responseText);
          errorMessage = errorBody.message || errorMessage;
          errorCode = errorBody.code || errorCode;
        } catch (e) {
          // Ignorar si no se puede parsear
        }
        
        throw errorHandler.createError(
          errorCode,
          errorMessage,
          { statusCode: statusCode, endpoint: endpoint }
        );
      }
      
      return JSON.parse(responseText);
      
    } catch (error) {
      if (error.code) {
        throw error;
      }
      
      throw errorHandler.createError(
        'NETWORK_ERROR',
        '[NotionAdapter] Error de red al comunicarse con Notion: ' + error.message,
        { endpoint: endpoint, originalError: error.message }
      );
    }
  }


  // ============================================================
  // MÉTODO PRIVADO: _getDatabaseSchema (CRÍTICO - DIRECTIVA #1)
  // ============================================================
  
  /**
   * Obtiene el esquema de propiedades de una base de datos con cacheo.
   * 
   * @param {string} databaseId - ID de la base de datos
   * @returns {object} Esquema con estructura { propertyName: { type, ... } }
   */
  function _getDatabaseSchema(databaseId) {
    if (schemaCache[databaseId]) {
      return schemaCache[databaseId];
    }
    
    const database = _notionRequest('/databases/' + databaseId, { method: 'get' });
    const schema = database.properties || {};
    schemaCache[databaseId] = schema;
    
    return schema;
  }
  
  // ============================================================
  // MÉTODO PRIVADO: _flattenProperties (DIRECTIVA #2 - LECTURA)
  // ============================================================
  
  /**
   * Aplana las complejas estructuras de propiedades de Notion a objetos simples.
   * 
   * @param {object} properties - Propiedades de página/BD de Notion
   * @returns {object} Propiedades aplanadas
   */
  function _flattenProperties(properties) {
    const flattened = {};
    
    for (const propName in properties) {
      const prop = properties[propName];
      const propType = prop.type;
      
      switch (propType) {
        case 'title':
          flattened[propName] = prop.title && prop.title[0] ? prop.title[0].plain_text : '';
          break;
        
        case 'rich_text':
          flattened[propName] = prop.rich_text && prop.rich_text[0] ? prop.rich_text[0].plain_text : '';
          break;
        
        case 'number':
          flattened[propName] = prop.number;
          break;
        
        case 'select':
          flattened[propName] = prop.select ? prop.select.name : null;
          break;
        
        case 'multi_select':
          flattened[propName] = prop.multi_select ? prop.multi_select.map(function(item) { return item.name; }) : [];
          break;
        
        case 'date':
          if (prop.date) {
            flattened[propName] = {
              start: prop.date.start,
              end: prop.date.end || null
            };
          } else {
            flattened[propName] = null;
          }
          break;
        
        case 'checkbox':
          flattened[propName] = prop.checkbox;
          break;
        
        case 'url':
          flattened[propName] = prop.url;
          break;
        
        case 'email':
          flattened[propName] = prop.email;
          break;
        
        case 'phone_number':
          flattened[propName] = prop.phone_number;
          break;
        
        case 'status':
          flattened[propName] = prop.status ? prop.status.name : null;
          break;
        
        case 'relation':
          flattened[propName] = prop.relation ? prop.relation.slice(0, RELATION_PAGE_LIMIT).map(function(rel) { return rel.id; }) : [];
          break;
        
        case 'people':
          flattened[propName] = prop.people ? prop.people.map(function(person) { return person.id; }) : [];
          break;
        
        case 'files':
          flattened[propName] = prop.files ? prop.files.map(function(file) {
            return {
              name: file.name,
              url: file.file ? file.file.url : (file.external ? file.external.url : null)
            };
          }) : [];
          break;
        
        case 'created_time':
          flattened[propName] = prop.created_time;
          break;
        
        case 'last_edited_time':
          flattened[propName] = prop.last_edited_time;
          break;
        
        case 'created_by':
          flattened[propName] = prop.created_by ? prop.created_by.id : null;
          break;
        
        case 'last_edited_by':
          flattened[propName] = prop.last_edited_by ? prop.last_edited_by.id : null;
          break;
        
        case 'formula':
          if (prop.formula) {
            const formulaType = prop.formula.type;
            flattened[propName] = prop.formula[formulaType];
          } else {
            flattened[propName] = null;
          }
          break;
        
        case 'rollup':
          if (prop.rollup) {
            const rollupType = prop.rollup.type;
            flattened[propName] = prop.rollup[rollupType];
          } else {
            flattened[propName] = null;
          }
          break;
        
        default:
          flattened[propName] = prop;
      }
    }
    
    return flattened;
  }
  
  // ============================================================
  // MÉTODO PRIVADO: _enrichProperties (DIRECTIVA #2 - ESCRITURA)
  // ============================================================
  
  /**
   * Enriquece objetos JavaScript simples a payloads complejos de Notion.
   * CRÍTICO: Usa el esquema de la BD para determinar el tipo de cada propiedad.
   * 
   * @param {object} simpleProps - Propiedades simples { nombre: valor }
   * @param {object} schema - Esquema de la BD { nombre: { type, ... } }
   * @returns {object} Propiedades enriquecidas para API de Notion
   */
  function _enrichProperties(simpleProps, schema) {
    const enriched = {};
    
    for (const propName in simpleProps) {
      const value = simpleProps[propName];
      const schemaProp = schema[propName];
      
      if (!schemaProp) {
        continue;
      }
      
      const propType = schemaProp.type;
      
      switch (propType) {
        case 'title':
          enriched[propName] = {
            title: [{ text: { content: String(value || '') } }]
          };
          break;
        
        case 'rich_text':
          enriched[propName] = {
            rich_text: [{ text: { content: String(value || '') } }]
          };
          break;
        
        case 'number':
          enriched[propName] = {
            number: value !== null && value !== undefined ? Number(value) : null
          };
          break;
        
        case 'select':
          enriched[propName] = {
            select: value ? { name: String(value) } : null
          };
          break;
        
        case 'multi_select':
          enriched[propName] = {
            multi_select: Array.isArray(value) ? value.map(function(item) { return { name: String(item) }; }) : []
          };
          break;
        
        case 'date':
          if (value && value.start) {
            enriched[propName] = {
              date: {
                start: value.start,
                end: value.end || null
              }
            };
          } else {
            enriched[propName] = { date: null };
          }
          break;
        
        case 'checkbox':
          enriched[propName] = {
            checkbox: Boolean(value)
          };
          break;
        
        case 'url':
          enriched[propName] = {
            url: value ? String(value) : null
          };
          break;
        
        case 'email':
          enriched[propName] = {
            email: value ? String(value) : null
          };
          break;
        
        case 'phone_number':
          enriched[propName] = {
            phone_number: value ? String(value) : null
          };
          break;
        
        case 'status':
          enriched[propName] = {
            status: value ? { name: String(value) } : null
          };
          break;
        
        case 'relation':
          enriched[propName] = {
            relation: Array.isArray(value) ? value.map(function(id) { return { id: String(id) }; }) : []
          };
          break;
        
        case 'people':
          enriched[propName] = {
            people: Array.isArray(value) ? value.map(function(id) { return { id: String(id) }; }) : []
          };
          break;
        
        case 'created_time':
        case 'last_edited_time':
        case 'created_by':
        case 'last_edited_by':
        case 'formula':
        case 'rollup':
          break;
        
        default:
          enriched[propName] = value;
      }
    }
    
    return enriched;
  }

  // ============================================================
  // MÉTODO PRIVADO: _mapNotionSchemaToGeneric (REDUCCIÓN DE ENTROPÍA)
  // ============================================================
  function _mapNotionSchemaToGeneric(notionSchema) {
      if (!notionSchema) return { columns: [] };

      const columns = Object.entries(notionSchema).map(([key, prop]) => {
          let type = 'STRING';
          const t = prop.type;
          
          if (t === 'number') type = 'NUMBER';
          else if (t === 'date' || t === 'created_time' || t === 'last_edited_time') type = 'DATE';
          else if (t === 'checkbox') type = 'BOOLEAN';
          else if (t === 'select' || t === 'status') type = 'SELECT';
          else if (t === 'multi_select') type = 'MULTI_SELECT';
          else if (t === 'email') type = 'EMAIL';
          else if (t === 'url') type = 'URL';
          else if (t === 'files') type = 'FILE';
          else if (t === 'formula' || t === 'rollup') type = 'COMPUTED';
          
          return {
              id: key,
              label: key.replace(/_/g, ' ').toUpperCase(),
              type: type,
              options: (prop.select?.options || prop.multi_select?.options || []).map(o => o.name)
          };
      });

      return { columns };
  }
  
  // ============================================================
  // MÉTODO PRIVADO: _renderBlocksToHtml (DIRECTIVA #2 - BLOQUES)
  // ============================================================
  
  /**
   * Convierte bloques de Notion a HTML estándar.
   * 
   * @param {Array} blocks - Array de bloques de Notion
   * @returns {string} HTML renderizado
   */
  function _renderBlocksToHtml(blocks) {
    if (!blocks || blocks.length === 0) {
      return '';
    }
    
    let html = '';
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockType = block.type;
      const blockData = block[blockType];
      
      switch (blockType) {
        case 'paragraph':
          const paragraphText = _extractPlainTextFromRichText(blockData.rich_text);
          html += '<p>' + _escapeHtml(paragraphText) + '</p>\n';
          break;
        
        case 'heading_1':
          const h1Text = _extractPlainTextFromRichText(blockData.rich_text);
          html += '<h1>' + _escapeHtml(h1Text) + '</h1>\n';
          break;
        
        case 'heading_2':
          const h2Text = _extractPlainTextFromRichText(blockData.rich_text);
          html += '<h2>' + _escapeHtml(h2Text) + '</h2>\n';
          break;
        
        case 'heading_3':
          const h3Text = _extractPlainTextFromRichText(blockData.rich_text);
          html += '<h3>' + _escapeHtml(h3Text) + '</h3>\n';
          break;
        
        case 'bulleted_list_item':
          const bulletText = _extractPlainTextFromRichText(blockData.rich_text);
          html += '<ul><li>' + _escapeHtml(bulletText) + '</li></ul>\n';
          break;
        
        case 'numbered_list_item':
          const numberedText = _extractPlainTextFromRichText(blockData.rich_text);
          html += '<ol><li>' + _escapeHtml(numberedText) + '</li></ol>\n';
          break;
        
        case 'to_do':
          const todoText = _extractPlainTextFromRichText(blockData.rich_text);
          const checked = blockData.checked ? 'checked' : '';
          html += '<input type="checkbox" ' + checked + '> ' + _escapeHtml(todoText) + '<br>\n';
          break;
        
        case 'toggle':
          const toggleText = _extractPlainTextFromRichText(blockData.rich_text);
          html += '<details><summary>' + _escapeHtml(toggleText) + '</summary></details>\n';
          break;
        
        case 'code':
          const codeText = _extractPlainTextFromRichText(blockData.rich_text);
          const language = blockData.language || 'plaintext';
          html += '<pre><code class="language-' + language + '">' + _escapeHtml(codeText) + '</code></pre>\n';
          break;
        
        case 'quote':
          const quoteText = _extractPlainTextFromRichText(blockData.rich_text);
          html += '<blockquote>' + _escapeHtml(quoteText) + '</blockquote>\n';
          break;
        
        case 'divider':
          html += '<hr>\n';
          break;
        
        case 'image':
          const imageUrl = blockData.file ? blockData.file.url : (blockData.external ? blockData.external.url : '');
          const caption = blockData.caption ? _extractPlainTextFromRichText(blockData.caption) : '';
          html += '<img src="' + imageUrl + '" alt="' + _escapeHtml(caption) + '">\n';
          break;
        
        default:
          break;
      }
      
      if (block.children && block.children.length > 0) {
        html += _renderBlocksToHtml(block.children);
      }
    }
    
    return html;
  }
  
  function _extractPlainTextFromRichText(richTextArray) {
    if (!richTextArray || richTextArray.length === 0) {
      return '';
    }
    return richTextArray.map(function(rt) { return rt.plain_text || ''; }).join('');
  }
  
  function _escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
  }
  
  // ============================================================
  // MÉTODOS PÚBLICOS: PÁGINAS Y BASES DE DATOS
  // ============================================================
  
  function search(resolvedPayload) {
    if (!resolvedPayload || Object.keys(resolvedPayload).length === 0) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.search] el payload no puede estar vacío. Proporcione al menos "query", "filter" o "sorts".');
    }

    if (resolvedPayload.hasOwnProperty('query') && (resolvedPayload.query === null || (typeof resolvedPayload.query !== 'string'))) {
       throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.search] query debe ser un string');
    }

    const requestPayload = {
      query: resolvedPayload.query || undefined,
      filter: resolvedPayload.filter || undefined,
      sort: resolvedPayload.sort || (resolvedPayload.query ? undefined : {
        direction: 'descending',
        timestamp: 'last_edited_time'
      })
    };

    return _notionRequest('/search', {
      method: 'post',
      payload: requestPayload,
      accountId: resolvedPayload.accountId
    });
  }
  
  function retrieveDatabase(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.databaseId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.retrieveDatabase] databaseId es obligatorio');
    }
    
    return _notionRequest('/databases/' + resolvedPayload.databaseId, { 
      method: 'get',
      accountId: resolvedPayload.accountId
    });
  }

  /**
   * Verifica la conectividad y validez del token actual con diagnóstico profundo.
   * @param {object} payload - { accountId? }
   * @returns {object} { success: boolean, ... }
   */
  function verifyConnection(payload = {}) {
    const accountId = payload.accountId || null;
    const logger = _monitor;
    
    try {
      const token = _getToken(accountId);
      const maskedToken = token.substring(0, 10) + "..." + token.substring(token.length - 4);
      
      logger.log(`[Notion:Ping] Verificando identidad con token: ${maskedToken}`);
      logger.log(`[Notion:Ping] Endpoint: ${NOTION_BASE_URL}/users/me`);

      const response = _notionRequest('/users/me', { 
        method: 'get',
        accountId: accountId
      });

      logger.log(`[Notion:Ping] ✅ Conexión Exitosa. Autenticado como: ${response.name || 'Bot'}`);
      
      return { 
        success: true, 
        message: "Conexión exitosa con Notion",
        authenticatedAs: response.name || 'Notion Bot',
        type: response.type,
        bot_owner: response.bot?.owner?.user?.name || 'Unknown'
      };
    } catch (e) {
      logger.error(`[Notion:Ping] ❌ Fallo Crítico en Ping: ${e.message}`);
      return { 
        success: false, 
        message: e.message,
        error_code: e.code || 'UNKNOWN'
      };
    }
  }

  /**
   * Configura la identidad de Notion en el Vault.
   * @param {object} payload - { accountId, apiKey, isDefault }
   */
  function configureIdentity(payload = {}) {
    const { accountId, apiKey, isDefault = false } = payload;
    if (!accountId || !apiKey) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.configureIdentity] accountId y apiKey son obligatorios');
    }
    
    tokenManager.setToken({ 
      provider: 'notion', 
      accountId, 
      tokenData: { apiKey, isDefault } 
    });
    
    return { success: true, message: `Cuenta '${accountId}' configurada correctamente para Notion.` };
  }
  
  function queryDatabase(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.databaseId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.queryDatabase] databaseId es obligatorio');
    }
    
    const requestPayload = {};
    
    if (resolvedPayload.filter) {
      requestPayload.filter = resolvedPayload.filter;
    }
    
    if (resolvedPayload.sorts) {
      requestPayload.sorts = resolvedPayload.sorts;
    } else {
      // AXIOMA: Relevancia Temporal Crítica
      requestPayload.sorts = [{
          timestamp: 'last_edited_time',
          direction: 'descending'
      }];
    }
    
    if (resolvedPayload.pageSize) {
      requestPayload.page_size = resolvedPayload.pageSize;
    }

    if (resolvedPayload.start_cursor) {
      requestPayload.start_cursor = resolvedPayload.start_cursor;
    }
    
    // AXIOMA: Reducción de Entropía (Inyección de Esquema Polimórfico)
    // Para que el frontend (DatabaseEngine) sepa cómo renderizar sin adivinar.
    let schema = null;
    try {
        const rawSchema = _getDatabaseSchema(resolvedPayload.databaseId);
        schema = _mapNotionSchemaToGeneric(rawSchema);
    } catch (e) {
        console.warn(`[NotionAdapter] Failed to fetch schema for ${resolvedPayload.databaseId}`, e);
    }

    const response = _notionRequest('/databases/' + resolvedPayload.databaseId + '/query', {
      method: 'post',
      payload: requestPayload,
      accountId: resolvedPayload.accountId
    });
    
    return {
      results: response.results,
      ORIGIN_SOURCE: 'notion',
      SCHEMA: schema,
      PAGINATION: {
        hasMore: !!response.has_more,
        nextToken: response.next_cursor || null,
        total: response.results.length, // Notion exact total requires search or count
        count: response.results.length
      },
      IDENTITY_CONTEXT: {
        accountId: resolvedPayload.accountId || null,
        permissions: {
          canEdit: true,
          role: 'editor'
        }
      },
      // AXIOMA: Burst Mode Metadata (for NetworkDispatcher compatibility)
      BURST_METADATA: {
        cursorField: 'start_cursor',
        hasMoreField: 'has_more',
        resultsField: 'results'
      }
    };
  }

  /**
   * DEPRECATED: Use NetworkDispatcher.executeBurst with queryDatabase instead.
   * 
   * Legacy method for backward compatibility. This method previously used internal 
   * pagination loops which caused timeout issues with large datasets.
   * 
   * @deprecated Use NetworkDispatcher for burst operations instead
   * @param {object} resolvedPayload - Debe incluir databaseId
   * @returns {object} Single page response with deprecation warning
   */
  function queryDatabaseContent(resolvedPayload) {
    _monitor.warn('[NotionAdapter.queryDatabaseContent] DEPRECATED: This method previously used internal loops. Use NetworkDispatcher.executeBurst for multi-page operations.');
    
    // AXIOMA: Backward Compatibility Fallback
    // Return single page with warning to migrate to burst mode
    const response = queryDatabase(resolvedPayload);
    
    // Add deprecation warning in response
    response.DEPRECATION_WARNING = {
      message: 'queryDatabaseContent is deprecated. Use NetworkDispatcher for multi-page operations.',
      migrateToMethod: 'NetworkDispatcher.executeBurst',
      reason: 'Internal loops cause timeout issues with large datasets',
      recommendation: 'Use CoreOrchestrator with enableBurst: true'
    };
    
    return response;
  }
  
  function retrievePage(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.pageId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.retrievePage] pageId es obligatorio');
    }
    
    const page = _notionRequest('/pages/' + resolvedPayload.pageId, { 
      method: 'get',
      accountId: resolvedPayload.accountId
    });
    
    return _mapDocumentRecord(page);
  }
  
  function createPage(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.parent || !resolvedPayload.properties) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.createPage] parent y properties son obligatorios');
    }
    
    const parentType = resolvedPayload.parent.database_id ? 'database' : 'page';
    
    let enrichedProperties;
    
    if (parentType === 'database') {
      const databaseId = resolvedPayload.parent.database_id;
      const schema = _getDatabaseSchema(databaseId);
      enrichedProperties = _enrichProperties(resolvedPayload.properties, schema);
    } else {
      enrichedProperties = resolvedPayload.properties;
    }
    
    const requestPayload = {
      parent: resolvedPayload.parent,
      properties: enrichedProperties
    };
    
    const createdPage = _notionRequest('/pages', {
      method: 'post',
      payload: requestPayload,
      accountId: resolvedPayload.accountId
    });
    
    return {
      id: createdPage.id,
      properties: _flattenProperties(createdPage.properties),
      created_time: createdPage.created_time
    };
  }
  
  function updatePageProperties(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.pageId || !resolvedPayload.properties) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.updatePageProperties] pageId y properties son obligatorios');
    }
    
    const page = _notionRequest('/pages/' + resolvedPayload.pageId, { 
      method: 'get',
      accountId: resolvedPayload.accountId
    });
    
    let enrichedProperties;
    
    if (page.parent && page.parent.database_id) {
      const databaseId = page.parent.database_id;
      const schema = _getDatabaseSchema(databaseId);
      enrichedProperties = _enrichProperties(resolvedPayload.properties, schema);
    } else {
      enrichedProperties = resolvedPayload.properties;
    }
    
    const updatedPage = _notionRequest('/pages/' + resolvedPayload.pageId, {
      method: 'patch',
      payload: { properties: enrichedProperties },
      accountId: resolvedPayload.accountId
    });
    
    return {
      id: updatedPage.id,
      properties: _flattenProperties(updatedPage.properties),
      last_edited_time: updatedPage.last_edited_time
    };
  }
  
  // ============================================================
  // MÉTODOS PÚBLICOS: BLOQUES (CONTENIDO DE PÁGINA)
  // ============================================================
  
  function retrieveBlockChildren(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.blockId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.retrieveBlockChildren] blockId es obligatorio');
    }
    
    const depth = resolvedPayload._depth || 0;
    
    if (depth >= BLOCK_RECURSION_LIMIT) {
      return { results: [], has_more: false };
    }
    
    const requestPayload = {};
    if (resolvedPayload.pageSize) {
      requestPayload.page_size = resolvedPayload.pageSize;
    }
    
    const response = _notionRequest('/blocks/' + resolvedPayload.blockId + '/children', {
      method: 'get',
      accountId: resolvedPayload.accountId
    });
    
    const blocks = response.results || [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.has_children) {
        const childrenResponse = retrieveBlockChildren({
          blockId: block.id,
          _depth: depth + 1,
          accountId: resolvedPayload.accountId
        });
        
        block.children = childrenResponse.results;
      }
    }
    
    return {
      results: blocks,
      has_more: response.has_more || false,
      next_cursor: response.next_cursor || null
    };
  }
  
  function retrievePageWithContent(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.pageId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.retrievePageWithContent] pageId es obligatorio');
    }
    
    const pageData = retrievePage({ pageId: resolvedPayload.pageId, accountId: resolvedPayload.accountId });
    const blocksData = retrieveBlockChildren({ blockId: resolvedPayload.pageId, accountId: resolvedPayload.accountId });
    const contentHtml = _renderBlocksToHtml(blocksData.results);
    
    return {
      properties: pageData.properties,
      blocks: blocksData.results,
      contentHtml: contentHtml
    };
  }
  
  function appendBlockChildren(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.blockId || !resolvedPayload.blocks) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.appendBlockChildren] blockId y blocks son obligatorios');
    }
    
    const requestPayload = {
      children: resolvedPayload.blocks
    };
    
    if (resolvedPayload.after) {
      requestPayload.after = resolvedPayload.after;
    }
    
    return _notionRequest('/blocks/' + resolvedPayload.blockId + '/children', {
      method: 'patch',
      payload: requestPayload,
      accountId: resolvedPayload.accountId
    });
  }
  
  function updateBlock(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.blockId || !resolvedPayload.blockData) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.updateBlock] blockId y blockData son obligatorios');
    }
    
    return _notionRequest('/blocks/' + resolvedPayload.blockId, {
      method: 'patch',
      payload: resolvedPayload.blockData
    });
  }
  
  function deleteBlock(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.blockId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.deleteBlock] blockId es obligatorio');
    }
    
    return _notionRequest('/blocks/' + resolvedPayload.blockId, {
      method: 'delete'
    });
  }
  
  // ============================================================
  // MÉTODOS PÚBLICOS: ARCHIVOS (UPLOAD WORKFLOW)
  // ============================================================
  
  function startFileUpload(resolvedPayload) {
    return _notionRequest('/file_uploads', {
      method: 'post',
      payload: {}
    });
  }
  
  function uploadFileContent(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.uploadUrl || !resolvedPayload.fileBlob) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.uploadFileContent] uploadUrl y fileBlob son obligatorios');
    }
    
    const uploadUrl = resolvedPayload.uploadUrl;
    const fileBlob = resolvedPayload.fileBlob;
    const contentType = resolvedPayload.contentType || 'application/octet-stream';
    
    const boundary = '----NotionUploadBoundary' + (keyGenerator ? keyGenerator.generate() : Utilities.getUuid());
    
    const payloadParts = [];
    payloadParts.push('--' + boundary);
    payloadParts.push('Content-Disposition: form-data; name="file"; filename="' + fileBlob.getName() + '"');
    payloadParts.push('Content-Type: ' + contentType);
    payloadParts.push('');
    payloadParts.push(fileBlob.getDataAsString());
    payloadParts.push('--' + boundary + '--');
    
    const payloadBody = payloadParts.join('\r\n');
    
    const options = {
      method: 'post',
      contentType: 'multipart/form-data; boundary=' + boundary,
      payload: Utilities.newBlob(payloadBody).getBytes(),
      muteHttpExceptions: true
    };
    
    try {
      const response = globalThis.UrlFetchApp.fetch(uploadUrl, options);
      const statusCode = response.getResponseCode();
      
      if (statusCode < 200 || statusCode >= 300) {
        throw errorHandler.createError(
          'FILE_UPLOAD_ERROR',
          'Error al subir archivo: ' + statusCode,
          { statusCode: statusCode }
        );
      }
      
      return JSON.parse(response.getContentText());
      
    } catch (error) {
      if (error.code) {
        throw error;
      }
      
      throw errorHandler.createError(
        'FILE_UPLOAD_ERROR',
        'Error de red al subir archivo: ' + error.message
      );
    }
  }
  
  function uploadAndAttachFile(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.fileBlob || !resolvedPayload.parentBlockId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.uploadAndAttachFile] fileBlob y parentBlockId son obligatorios');
    }
    
    const fileBlob = resolvedPayload.fileBlob;
    const contentType = resolvedPayload.contentType || 'application/octet-stream';
    const parentBlockId = resolvedPayload.parentBlockId;
    
    const uploadData = startFileUpload();
    const uploadId = uploadData.id;
    const uploadUrl = uploadData.upload_url;
    
    uploadFileContent({
      uploadUrl: uploadUrl,
      fileBlob: fileBlob,
      contentType: contentType
    });
    
    let blockType = 'file';
    if (contentType.indexOf('image/') === 0) {
      blockType = 'image';
    } else if (contentType === 'application/pdf') {
      blockType = 'pdf';
    } else if (contentType.indexOf('video/') === 0) {
      blockType = 'video';
    }
    
    const block = {};
    block.type = blockType;
    block[blockType] = {
      type: 'file_upload',
      file_upload: {
        id: uploadId
      }
    };
    
    return appendBlockChildren({
      blockId: parentBlockId,
      blocks: [block]
    });
  }
  
  // ============================================================
  // MÉTODOS PÚBLICOS: COMENTARIOS
  // ============================================================
  
  function retrieveComments(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.blockId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.retrieveComments] blockId es obligatorio');
    }
    
    return _notionRequest('/comments?block_id=' + resolvedPayload.blockId, {
      method: 'get'
    });
  }
  
  function createComment(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.richText) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.createComment] richText es obligatorio');
    }
    
    if (!resolvedPayload.parentPageId && !resolvedPayload.discussionId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.createComment] Debe proporcionar parentPageId o discussionId');
    }
    
    const requestPayload = {
      rich_text: resolvedPayload.richText
    };
    
    if (resolvedPayload.parentPageId) {
      requestPayload.parent = {
        page_id: resolvedPayload.parentPageId
      };
    }
    
    if (resolvedPayload.discussionId) {
      requestPayload.discussion_id = resolvedPayload.discussionId;
    }
    
    return _notionRequest('/comments', {
      method: 'post',
      payload: requestPayload
    });
  }
  
  // ============================================================
  // MÉTODOS PÚBLICOS: EXTENSIONES AVANZADAS (H7)
  // ============================================================
  
  /**
   * Crea una nueva base de datos en una página.
   * @param {object} resolvedPayload - { parentPageId, title, properties }
   * @returns {object} Resultado de la creación
   */
  function createDatabase(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.parentPageId || !resolvedPayload.title) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.createDatabase] parentPageId y title son obligatorios');
    }
    
    const requestPayload = {
      parent: {
        page_id: resolvedPayload.parentPageId
      },
      title: [{ text: { content: resolvedPayload.title } }],
      properties: resolvedPayload.properties || { 'Name': { title: {} } }
    };
    
    return _notionRequest('/databases', {
      method: 'post',
      payload: requestPayload
    });
  }
  
  /**
   * Crea una propiedad de relación bidireccional entre dos bases de datos.
   * @param {object} resolvedPayload - { databaseId, propertyName, targetDatabaseId, dualPropertyName? }
   * @returns {object} Resultado del PATCH
   */
  function createRelationProperty(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.databaseId || !resolvedPayload.propertyName || !resolvedPayload.targetDatabaseId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.createRelationProperty] databaseId, propertyName, y targetDatabaseId son obligatorios');
    }
    
    const propertyConfig = {
      relation: {
        data_source_id: resolvedPayload.targetDatabaseId
      }
    };

    if (resolvedPayload.dualPropertyName) {
      propertyConfig.relation.dual_property = {
        synced_property_name: resolvedPayload.dualPropertyName
      };
    } else if (resolvedPayload.databaseId === resolvedPayload.targetDatabaseId) {
      // Relación unidireccional a la misma tabla: Notion exige single_property
      propertyConfig.relation.single_property = {};
    }
    
    const requestPayload = {
      properties: {}
    };
    requestPayload.properties[resolvedPayload.propertyName] = propertyConfig;
    
    return _notionRequest('/databases/' + resolvedPayload.databaseId, {
      method: 'patch',
      payload: requestPayload
    });
  }
  
  /**
   * Crea una propiedad de rollup (agregación) sobre una relación.
   * @param {object} resolvedPayload - { databaseId, propertyName, relationPropertyName, targetPropertyName, aggregationFunction }
   * @returns {object} Resultado del PATCH
   */
  function createRollupProperty(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.databaseId || !resolvedPayload.propertyName || 
        !resolvedPayload.relationPropertyName || !resolvedPayload.targetPropertyName || !resolvedPayload.aggregationFunction) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.createRollupProperty] todos los parámetros son obligatorios');
    }
    
    const propertyConfig = {
      rollup: {
        relation_property_name: resolvedPayload.relationPropertyName,
        rollup_property_name: resolvedPayload.targetPropertyName,
        function: resolvedPayload.aggregationFunction
      }
    };
    
    const requestPayload = {
      properties: {}
    };
    requestPayload.properties[resolvedPayload.propertyName] = propertyConfig;
    
    return _notionRequest('/databases/' + resolvedPayload.databaseId, {
      method: 'patch',
      payload: requestPayload
    });
  }
  
  /**
   * Elimina una propiedad de una base de datos.
   * @param {object} resolvedPayload - { databaseId, propertyId }
   * @returns {object} Resultado de la eliminación
   */
  function deleteProperty(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.databaseId || !resolvedPayload.propertyId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.deleteProperty] databaseId y propertyId son obligatorios');
    }
    
    return _notionRequest('/databases/' + resolvedPayload.databaseId + '/properties/' + resolvedPayload.propertyId, {
      method: 'delete'
    });
  }
  
  /**
   * Actualiza la configuración de una propiedad existente.
   * @param {object} resolvedPayload - { databaseId, propertyId, newConfig }
   * @returns {object} Propiedad actualizada
   */
  function updateProperty(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.databaseId || !resolvedPayload.propertyId || !resolvedPayload.newConfig) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.updateProperty] databaseId, propertyId, y newConfig son obligatorios');
    }
    
    return _notionRequest('/databases/' + resolvedPayload.databaseId + '/properties/' + resolvedPayload.propertyId, {
      method: 'patch',
      payload: resolvedPayload.newConfig
    });
  }
  
  // ============================================================


  // ============================================================
  // RETORNAR INTERFAZ PÚBLICA (Object.freeze - Axioma 1 DADC)
  // ============================================================
  
  // --- SOVEREIGN CANON V8.0 (Poly-Archetype Composition) ---
  const CANON = {
      LABEL: "Notion",
      // AXIOMA: Identidad Compuesta. Notion no es una cosa, es muchas.
      // El Frontend iterará esta lista y montará los motores necesarios (Tabs/Vistas).
      ARCHETYPES: ["ADAPTER", "VAULT", "GRID", "DOC"], 
      
      // Fallback para sistemas legacy que esperan un solo string
      // AUDITORÍA: Forzamos VAULT para que el Frontend actual use VaultEngine (Drive-like UX).
      ARCHETYPE: "VAULT", 
      
      DOMAIN: "KNOWLEDGE_GRAPH",
      SEMANTIC_INTENT: "BRIDGE",
      
      // 1. MATH & LOGIC CAPABILITIES (Notion Native Engines)
      MATH_CAPABILITIES: {
          "engine": "NOTION_FORMULA", 
          "injectable": true, 
          "desc": "Propel logic via Formulas and Rollups",
          "constructs": {
              "rollup": { "syntax": "RELATION_AGGREGATION", "desc": "Calculate based on relations" },
              "formula": { "syntax": "prop('Field A') + prop('Field B')", "desc": "Native property calculation" }
          }
      },

      // 2. DUAL INTERFACE CAPABILITIES (The Chameleon)
      CAPABILITIES: {
          listContents: { desc: "Explora la estructura del grafo de Notion como un sistema de archivos.", exposure: "public" },
          queryDatabase: { desc: "Consulta una base de datos con filtros y ordenación.", exposure: "public" },
          queryDatabaseContent: { desc: "Obtiene todas las páginas de una base de datos.", exposure: "public" },
          search: { desc: "Busca páginas y bases de datos por título.", exposure: "public" },
          retrievePage: { desc: "Obtiene los metadatos de una página.", exposure: "public" },
          retrievePageWithContent: { desc: "Obtiene una página incluyendo sus bloques de contenido.", exposure: "public" },
          appendBlockChildren: { desc: "Añade bloques de contenido a una página.", exposure: "public" },
          updatePageProperties: { desc: "Actualiza las propiedades de una página.", exposure: "public" },
          createPage: { desc: "Crea una nueva página.", exposure: "public" },
          createDatabase: { desc: "Crea una nueva base de datos.", exposure: "public" },
          "read_content": { 
              "io": "READ", "desc": "Read as Document (Markdown)",
              "inputs": { "pageId": "string" }
          },
          "query_db": { 
              "io": "READ", "desc": "Read as DataGrid (Rows/Cols)", 
              "inputs": { "databaseId": "string", "filter": "object" }
          },
          "search": {
              "io": "READ", "desc": "Global Workspace Search",
              "inputs": { "query": "string" }
          },
          "create_page": { 
              "io": "WRITE", "desc": "Generate new page entry", 
              "inputs": { "parent": "object", "properties": "object" }
          },
          "append_block": { 
              "io": "WRITE", "desc": "Write content (Doc Mode)", 
              "inputs": { "blockId": "string", "children": "array" }
          },
          "update_props": { 
              "io": "WRITE", "desc": "Update fields (Grid Mode)", 
              "inputs": { "pageId": "string", "properties": "object" }
          },
          "configure_schema": {
              "io": "WRITE", "desc": "Mutate Structure (Create DB)",
              "inputs": { "parentPageId": "string", "title": "string", "properties": "object" }
          }
      },

      // 3. VITAL SIGNS
      VITAL_SIGNS: {
          "API_RATE": { "criticality": "WARNING", "value": "3 req/sec", "trend": "variable" },
          "TOKEN_STATUS": { "criticality": "NOMINAL", "value": "VALID", "trend": "stable" }
      },

      // 4. UI PROJECTION MANIFEST
      UI_LAYOUT: {
          "SIDE_PANEL": "ENABLED",
          "TERMINAL_STREAM": "ENABLED",
          "VIEW_MODE_SELECTOR": {
              "DEFAULT": "GRID",
              "OPTIONS": ["GRID", "DOC", "VAULT"] // <--- The Polymorphic Lens
          }
      },
      PERSISTENCE_CONTRACT: {
        "vault_tree": {
            "ttl": 300,           // 5 minutes
            "scope": "COSMOS",
            "hydrate": true,
            "compute": "EAGER"
        }
      }
  };

  // Helper interno para mapeo consistente de Notion a la estructura de INDRA
  function _mapNotionToIndra(node) {
      const isDb = node.object === 'database';
      let name = "Untitled Artifact";
      
      // AXIOMA: Resolución de Título (Polimorfismo de Propiedades)
      if (isDb) {
          name = (node.title && node.title[0] ? node.title[0].plain_text : "Untitled Database");
      } else {
          const props = node.properties || {};
          // Buscamos la propiedad de tipo 'title' sin importar su nombre (Name, Nombre, Título, etc.)
          const titleKey = Object.keys(props).find(key => props[key] && props[key].type === 'title');
          const titleProp = titleKey ? props[titleKey] : null;
          
          if (titleProp && titleProp.title && titleProp.title[0]) {
              name = titleProp.title[0].plain_text;
          } else if (node.url) {
              name = node.url.split('/').pop().split('-').slice(0, -1).join(' ') || "Untitled Page";
          }
      }

      return {
          id: node.id,
          name: name,
          LABEL: name,
          type: isDb ? "DATABASE" : "FILE",
          ARCHETYPE: isDb ? "DATABASE" : "FILE",
          mimeType: isDb ? "application/vnd.indra.notion-db" : "text/markdown",
          ORIGIN_SOURCE: 'notion',
          lastUpdated: node.last_edited_time,
          path: `notion://${node.id}`,
          raw: { 
              object: node.object,
              parentId: node.parent?.type === 'workspace' ? 'ROOT' : (node.parent?.id || 'ORPHAN')
          }
      };
  }

  // ============================================================
  // RETORNAR INTERFAZ PÚBLICA (Object.freeze - Axioma 1 DADC)
  // ============================================================
  
  return {
    // Identity
    CANON: CANON, // <--- Exposed DNA
    id: "notion", // Legacy ID

    description: "Technical interface for Notion database operations and block-level content management.",
    semantic_intent: "BRIDGE",

    // Legacy Bridge (Derived)
    get schemas() {
        const s = {};
        for (const [key, cap] of Object.entries(CANON.CAPABILITIES)) {
            s[key] = {
                description: cap.desc,
                exposure: cap.exposure || "private",
                io_interface: { inputs: cap.inputs || {}, outputs: cap.outputs || {} }
            };
        }
        return s;
    },

    // AXIOMA: Burst Mode Configuration (for NetworkDispatcher)
    BURST_CONFIG: {
      cursorField: 'start_cursor',
      hasMoreField: 'has_more',
      resultsField: 'results',
      maxBurstSize: 1000,
      estimatedPageSize: 100
    },
    
    // Protocol-Standard Aliases (STORAGE_V1)
    read: retrievePage,     // Default to Doc read
    write: createPage,      // Default to Create
    query: queryDatabase,   // Default to Grid query (burst-capable)
    
    // Capabilities Mapped to CANON
    read_content: retrievePageWithContent,
    query_db: queryDatabase, // CHANGED: Now uses atomic queryDatabase (burst via NetworkDispatcher)
    search: search,
    create_page: createPage,
    append_block: appendBlockChildren,
    update_props: updatePageProperties,
    configure_schema: createDatabase, // Proxy for schema creation

    // Full Technical Surface
    search,
    retrieveDatabase,
    queryDatabase,
    queryDatabaseContent,
    retrievePage,
    createPage,
    updatePageProperties,
    retrieveBlockChildren,
    retrievePageWithContent,
    appendBlockChildren,
    updateBlock,
    deleteBlock,
    startFileUpload,
    uploadFileContent,
    uploadAndAttachFile,
    retrieveComments,
    createComment,
    createDatabase,
    createRelationProperty,
    createRollupProperty,
    deleteProperty,
    updateProperty,
    verifyConnection,
    configureIdentity,
    
    /**
     * INTERFAZ VAULT V8.1: Protocolo de Descubrimiento Canónico (Resonancia Global).
     * Mapea el grafo de Notion a una estructura jerárquica compatible con el Kernel.
     */
    listContents: function(payload = {}) {
        const { folderId = 'ROOT', query = '', accountId } = payload;
        const logger = _monitor;
        
        try {
            if (query) {
                logger.log(`[Notion:Vault] Iniciando Búsqueda Inducida: "${query}"`);
                const response = search({ accountId, query: query });
                const results = response.results || [];
                
                const items = results.map(node => _mapNotionToIndra(node));
                return {
                    items,
                    metadata: {
                        total: items.length,
                        hasMore: response.has_more,
                        nextCursor: response.next_cursor,
                        hydrationLevel: response.has_more ? 70 : 100
                    }
                };
            }

            if (folderId === 'ROOT') {
                logger.log("[Notion:Vault] Iniciando Escaneo de Resonancia Global (Limitado)...");
                // AXIOMA: No pedimos TODO, pedimos los primeros 100 para dar feedback instantáneo.
                const response = search({ accountId, query: "", page_size: 100 });
                const results = response.results || [];
                
                const items = results.map(node => _mapNotionToIndra(node));
                    // AXIOMA: En Notion, el ROOT es una abstracción virtual.
                    // Mostramos la "Resonancia Reciente" sin filtrar jerarquías pesadas de inicio.

                return {
                    items,
                    metadata: {
                        total: items.length,
                        hasMore: response.has_more,
                        hydrationLevel: response.has_more ? 50 : 100 // Si hay más, advertimos que aún falta
                    }
                };
            } else {
                logger.log(`[Notion:Vault] Navegando en contenedor: ${folderId}`);
                // AXIOMA: No usamos queryDatabaseContent (bucle infinito) para navegación UI.
                // Usamos queryDatabase simple (paginado).
                const response = queryDatabase({ databaseId: folderId, accountId, pageSize: 50 });
                const results = response.results || [];
                
                // AXIOMA: Unificación de Mapeo. Usamos el mismo helper _mapNotionToIndra
                const items = results.map(node => _mapNotionToIndra(node));

                return {
                    items,
                    metadata: { 
                        total: items.length, 
                        hasMore: response.has_more, 
                        nextCursor: response.next_cursor,
                        hydrationLevel: 100 
                    }
                };
            }
        } catch (e) {
            console.error(`[NotionAdapter:listContents] Error en Proyección: ${e.message}`);
            throw e;
        }
    }
  };
}
