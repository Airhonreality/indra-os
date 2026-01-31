
// ARTEFACTO: 3_Adapters/NotionAdapter.gs (VERSIÓN H7 AVANZADA)
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
function createNotionAdapter({ errorHandler, tokenManager }) {
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
  /**
   * Obtiene el token de API de Notion para una cuenta específica.
   * @param {string|null} accountId - ID de la cuenta (null para default)
   * @returns {string} El token de API de Notion
   */
  function _getToken(accountId = null) {
    try {
      const tokenData = tokenManager.getToken({ provider: 'notion', accountId });
      if (!tokenData || !tokenData.apiKey) {
        throw new Error('Token data is empty or missing apiKey');
      }
      return tokenData.apiKey;
    } catch (e) {
      throw errorHandler.createError(
        'CONFIGURATION_ERROR',
        `[NotionAdapter] No se pudo obtener el token para la cuenta '${accountId || 'default'}': ${e.message}`
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
  function _notionRequest(endpoint, options) {
    options = options || {};
    const method = options.method || 'get';
    const payload = options.payload;
    const contentType = options.contentType || 'application/json';
    
    const url = NOTION_BASE_URL + endpoint;
    
    const accountId = options.accountId || null;
    const currentToken = _getToken(accountId);
    const headers = {
      'Authorization': 'Bearer ' + currentToken,
      'Notion-Version': NOTION_API_VERSION,
      'Content-Type': contentType
    };
    
    const fetchOptions = {
      method: method.toUpperCase(),
      headers: headers,
      muteHttpExceptions: true
    };
    
    if (payload) {
      fetchOptions.payload = JSON.stringify(payload);
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
      sorts: resolvedPayload.sorts || undefined
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
   * Verifica la conectividad y validez del token actual.
   * @param {object} payload - { accountId? }
   * @returns {object} { success: boolean, user: object }
   */
  function verifyConnection(payload = {}) {
    try {
      // Intentar una operación mínima: buscar el usuario del bot
      const response = _notionRequest('/users/me', { 
        method: 'get',
        accountId: payload.accountId || null
      });
      return { 
        success: true, 
        message: "Conexión exitosa con Notion",
        authenticatedAs: response.name || 'Notion Bot'
      };
    } catch (e) {
      return { 
        success: false, 
        message: e.message 
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
    }
    
    if (resolvedPayload.pageSize) {
      requestPayload.page_size = resolvedPayload.pageSize;
    }
    
    const response = _notionRequest('/databases/' + resolvedPayload.databaseId + '/query', {
      method: 'post',
      payload: requestPayload,
      accountId: resolvedPayload.accountId
    });
    
    response.results = response.results.map(function(page) {
      return {
        id: page.id,
        properties: _flattenProperties(page.properties),
        created_time: page.created_time,
        last_edited_time: page.last_edited_time
      };
    });
    
    return response;
  }

  /**
   * Recupera todo el contenido de una base de datos de Notion, manejando paginación y aplanando resultados.
   * @param {object} resolvedPayload - Debe incluir databaseId, y opcionalmente filter, sorts, pageSize.
   * @returns {object} Objeto con todas las páginas y sus propiedades aplanadas.
   */
  function queryDatabaseContent(resolvedPayload) {
    if (!resolvedPayload || typeof resolvedPayload.databaseId !== "string" || !resolvedPayload.databaseId.trim()) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.queryDatabaseContent] databaseId es obligatorio y debe ser un string no vacío');
    }
    let results = [];
    let hasMore = true;
    let startCursor = undefined;
    try {
      while (hasMore) {
        const queryPayload = Object.assign({}, resolvedPayload);
        if (startCursor) queryPayload.start_cursor = startCursor;
        const response = queryDatabase(queryPayload);
        if (response.results && Array.isArray(response.results)) {
          results = results.concat(response.results);
        }
        hasMore = response.has_more;
        startCursor = response.next_cursor;
      }
      return { results };
    } catch (e) {
      throw errorHandler.createError('NOTION_ADAPTER_ERROR', `[NotionAdapter.queryDatabaseContent] ${e.message}`);
    }
  }
  
  function retrievePage(resolvedPayload) {
    if (!resolvedPayload || !resolvedPayload.pageId) {
      throw errorHandler.createError('INVALID_INPUT', '[NotionAdapter.retrievePage] pageId es obligatorio');
    }
    
    const page = _notionRequest('/pages/' + resolvedPayload.pageId, { 
      method: 'get',
      accountId: resolvedPayload.accountId
    });
    
    return {
      id: page.id,
      properties: _flattenProperties(page.properties),
      created_time: page.created_time,
      last_edited_time: page.last_edited_time,
      parent: page.parent
    };
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
    
    const boundary = '----NotionUploadBoundary' + Utilities.getUuid();
    
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
  // SCHEMAS: METADATA PARA OPERADOR UNIVERSAL
  // ============================================================
  const schemas = {
    createPage: {
      description: "Generates a new page entry within a specific database or parent page.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          properties: { type: "object", io_behavior: "STREAM", description: "Technical map of property keys and their values." },
          parent: { type: "object", io_behavior: "GATE", description: "Target container reference (database_id or page_id)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Optional account selector for multi-tenant access." }
        }, 
        outputs: {
          id: { type: "string", io_behavior: "PROBE", description: "Unique identifier of the generated page." },
          url: { type: "string", io_behavior: "BRIDGE", description: "External URL to access the page in Notion." }
        } 
      }
    },
    retrievePage: {
      description: "Extracts metadata and property values for a specific Notion page.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          pageId: { type: "string", io_behavior: "GATE", description: "Unique page identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for authentication routing." }
        }, 
        outputs: {
          page: { 
            type: "object", 
            io_behavior: "STREAM", 
            description: "Flattened representation of page properties and system timestamps."
          }
        } 
      }
    },
    updatePageProperties: {
      description: "Modifies existing property values for a target page.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          pageId: { type: "string", io_behavior: "GATE", description: "Target page identifier." },
          properties: { type: "object", io_behavior: "STREAM", description: "Map of properties to be updated." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          id: { type: "string", io_behavior: "PROBE", description: "Confirmation identifier of the updated page." }
        } 
      }
    },
    queryDatabase: {
      description: "Filters and sorts database records based on technical query parameters.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          databaseId: { type: "string", io_behavior: "GATE", description: "Source database identifier." },
          filter: { type: "object", io_behavior: "SCHEMA", description: "Notion-standard filter object." },
          sorts: { type: "array", io_behavior: "SCHEMA", description: "Array of sort criteria." },
          pageSize: { type: "number", io_behavior: "GATE", description: "Number of records per page (max 100)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          results: { type: "array", io_behavior: "STREAM", description: "List of page records with flattened properties." }
        } 
      }
    },
    queryDatabaseContent: {
      description: "Orchestrates full database retrieval with automated pagination handling.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          databaseId: { type: "string", io_behavior: "GATE", description: "Target database identifier." },
          filter: { type: "object", io_behavior: "SCHEMA", description: "Optional filters for the query." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          results: { type: "array", io_behavior: "STREAM", description: "Complete record set from the database." }
        } 
      }
    },
    retrievePageWithContent: {
      description: "Extracts page metadata along with a processed HTML representation of its block structure.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          pageId: { type: "string", io_behavior: "GATE", description: "Target page identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          contentHtml: { type: "string", io_behavior: "STREAM", description: "Processed HTML content of the page." },
          properties: { type: "object", io_behavior: "STREAM", description: "Original page property values." }
        } 
      }
    },
    search: {
      description: "Performs a global workspace search for pages or databases matching a query string.",
      semantic_intent: "PROBE",
      io_interface: { 
        inputs: {
          query: { type: "string", io_behavior: "STREAM", description: "Search query string." },
          filter: { type: "object", io_behavior: "GATE", description: "Search filters (e.g. object type)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          results: { type: "array", io_behavior: "STREAM", description: "List of matching objects and metadata." }
        } 
      }
    },
    createDatabase: {
      description: "Initializes a new database structure within a target page.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          parentPageId: { type: "string", io_behavior: "GATE", description: "Parent page identifier." },
          title: { type: "string", io_behavior: "STREAM", description: "Database display title." },
          properties: { type: "object", io_behavior: "SCHEMA", description: "Initial column configuration and types." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          id: { type: "string", io_behavior: "PROBE", description: "New database identifier." },
          url: { type: "string", io_behavior: "BRIDGE", description: "URL to the new database." }
        } 
      }
    },
    createRelationProperty: {
      description: "Establishes a bilateral relation property between two databases.",
      semantic_intent: "SCHEMA",
      io_interface: { 
        inputs: {
          databaseId: { type: "string", io_behavior: "GATE", description: "Origin database identifier." },
          propertyName: { type: "string", io_behavior: "STREAM", description: "Name for the new relation column." },
          targetDatabaseId: { type: "string", io_behavior: "GATE", description: "Target database identifier." },
          dualPropertyName: { type: "string", io_behavior: "STREAM", description: "Optional name for the reciprocal relation column." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          id: { type: "string", io_behavior: "PROBE", description: "Confirmation identifier of the modified database." }
        } 
      }
    },
    createRollupProperty: {
      description: "Aggregates data from a related database through a rollup property.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          databaseId: { type: "string", io_behavior: "GATE", description: "Source database identifier." },
          propertyName: { type: "string", io_behavior: "STREAM", description: "Name for the rollup column." },
          relationPropertyName: { type: "string", io_behavior: "GATE", description: "The relation property to aggregate from." },
          targetPropertyName: { type: "string", io_behavior: "GATE", description: "The property in the target database to roll up." },
          aggregationFunction: { type: "string", io_behavior: "TRANSFORM", description: "Mathematical function (sum, average, etc.) to apply." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          id: { type: "string", io_behavior: "PROBE", description: "Confirmation identifier." }
        } 
      }
    },
    deleteProperty: {
      description: "Permanently removes a column definition from a database schema.",
      semantic_intent: "INHIBIT",
      io_interface: { 
        inputs: {
          databaseId: { type: "string", io_behavior: "GATE", description: "Target database identifier." },
          propertyId: { type: "string", io_behavior: "GATE", description: "Identifier of the property to remove." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Deletion status confirmation." }
        } 
      }
    },
    updateProperty: {
      description: "Updates the technical configuration or name of a database property.",
      semantic_intent: "SCHEMA",
      io_interface: { 
        inputs: {
          databaseId: { type: "string", io_behavior: "GATE", description: "Target database identifier." },
          propertyId: { type: "string", io_behavior: "GATE", description: "Identifier of the property to update." },
          newConfig: { type: "object", io_behavior: "SCHEMA", description: "Technical map of property updates." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Update status confirmation." }
        } 
      }
    },
    appendBlockChildren: {
      description: "Appends content blocks to the end of a page or block container.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          blockId: { type: "string", io_behavior: "GATE", description: "Target container identifier." },
          children: { type: "array", io_behavior: "STREAM", description: "Array of block objects to add." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          results: { type: "array", io_behavior: "STREAM", description: "Metadata of created blocks." }
        } 
      }
    },
    retrieveDatabase: {
      description: "Fetches technical definition and property schema for a database.",
      semantic_intent: "SCHEMA",
      io_interface: { 
        inputs: {
          databaseId: { type: "string", io_behavior: "GATE", description: "Source database identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          database: { 
            type: "object", 
            io_behavior: "SCHEMA", 
            description: "Database metadata object."
          }
        } 
      }
    },
    retrieveBlockChildren: {
      description: "Fetches a collection of child blocks for a target container page or block.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          blockId: { type: "string", io_behavior: "GATE", description: "Target container identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          results: { type: "array", io_behavior: "STREAM", description: "List of structured blocks with their content." }
        } 
      }
    },
    updateBlock: {
      description: "Modifies the content or structure of an existing block.",
      semantic_intent: "TRANSFORM",
      io_interface: { 
        inputs: {
          blockId: { type: "string", io_behavior: "GATE", description: "Target block identifier." },
          blockContent: { type: "object", io_behavior: "STREAM", description: "New block configuration map." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          id: { type: "string", io_behavior: "PROBE", description: "Identifier of the updated block." }
        } 
      }
    },
    deleteBlock: {
      description: "Permanently removes a content block from the system.",
      semantic_intent: "INHIBIT",
      io_interface: { 
        inputs: {
          blockId: { type: "string", io_behavior: "GATE", description: "Target block identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          id: { type: "string", io_behavior: "PROBE", description: "Deleted block identifier." }
        } 
      }
    },
    startFileUpload: {
      description: "Initiates a file upload session for external storage attachment.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          parentId: { type: "string", io_behavior: "GATE", description: "Page identifier to receive the file." },
          fileName: { type: "string", io_behavior: "STREAM", description: "Name of the file including extension." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          uploadUrl: { type: "string", io_behavior: "BRIDGE", description: "External URL for binary stream submission." }
        } 
      }
    },
    uploadFileContent: {
      description: "Submits binary content to a pre-authorized upload endpoint.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          uploadUrl: { type: "string", io_behavior: "BRIDGE", description: "Target upload endpoint." },
          fileBlob: { type: "object", io_behavior: "STREAM", description: "Binary file data (Blob format)." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Upload status confirmation." }
        } 
      }
    },
    uploadAndAttachFile: {
      description: "Orchestrates a full upload and attachment cycle to a Notion page.",
      semantic_intent: "BRIDGE",
      io_interface: { 
        inputs: {
          fileBlob: { type: "object", io_behavior: "STREAM", description: "Binary file data." },
          parentId: { type: "string", io_behavior: "GATE", description: "Destination page identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          results: { type: "object", io_behavior: "STREAM", description: "Notion file object metadata." }
        } 
      }
    },
    retrieveComments: {
      description: "Extracts comment threads from a target page or block.",
      semantic_intent: "STREAM",
      io_interface: { 
        inputs: {
          blockId: { type: "string", io_behavior: "GATE", description: "Target object identifier." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          results: { type: "array", io_behavior: "STREAM", description: "List of comment objects." }
        } 
      }
    },
    createComment: {
      description: "Creates a new comment thread on a target page or block.",
      semantic_intent: "TRIGGER",
      io_interface: { 
        inputs: {
          pageId: { type: "string", io_behavior: "GATE", description: "Target page identifier." },
          text: { type: "string", io_behavior: "STREAM", description: "Content of the comment." },
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for routing." }
        }, 
        outputs: {
          id: { type: "string", io_behavior: "PROBE", description: "Unique comment identifier." }
        } 
      }
    },
    verifyConnection: {
      description: "Executes a high-integrity health check of the Notion connectivity and token validity.",
      semantic_intent: "PROBE",
      io_interface: {
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Account selector for the health check." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "True if connectivity is established and token is valid." },
          message: { type: "string", io_behavior: "PROBE", description: "Status message or error detail." }
        }
      }
    },
    configureIdentity: {
      description: "Registers or updates the secure credentials for the Notion technical circuit within the system vault.",
      semantic_intent: "TRIGGER",
      io_interface: {
        inputs: {
          accountId: { type: "string", io_behavior: "GATE", description: "Unique identifier for this industrial account linkage." },
          apiKey: { type: "string", io_behavior: "STREAM", description: "Internal Integration Secret provided by the Notion carrier circuit." },
          isDefault: { type: "boolean", io_behavior: "SCHEMA", description: "Elevates this credential to the primary dispatch circuit." }
        },
        outputs: {
          success: { type: "boolean", io_behavior: "PROBE", description: "Credential persistence confirmation status." }
        }
      }
    }
  };

  // ============================================================
  // RETORNAR INTERFAZ PÚBLICA (Object.freeze - Axioma 1 DADC)
  // ============================================================
  
  return Object.freeze({
    label: "Notion Adapter",
    description: "Technical interface for Notion database operations and block-level content management.",
    semantic_intent: "BRIDGE",
    archetype: "ADAPTER",
    schemas: schemas,
    // Methods mapped to public interface
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
    configureIdentity
  });
}


