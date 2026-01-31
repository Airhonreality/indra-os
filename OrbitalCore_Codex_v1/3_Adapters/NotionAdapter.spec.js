// ======================================================================
// ARTEFACTO: 3_Adapters/NotionAdapter.spec.js
// DHARMA: Suite de Verificación Nativa GAS para NotionAdapter
// PROPÓSITO: Validar contrato H7, métodos públicos, y manejo de errores
//            usando arquitectura de verificación nativa de Google Apps Script
// ======================================================================
// CONFORMIDAD DADC:
// ✓ ADR-001: Sin frameworks externos (describe/it/expect prohibidos)
// ✓ Axioma 3: Funciones globales testNotionAdapter_[Descripcion]()
// ✓ Axioma 6.1: globalThis (NO global ni window)
// ✓ Axioma 6.2: _teardownNotionAdapterTests() restaura estado
// ✓ Sección 3.16: Setup/Teardown con try/finally
// ======================================================================

// ======================================================================
// HELPERS PRIVADOS: SETUP Y TEARDOWN
// ======================================================================

/**
 * Crea un mock de UrlFetchApp para interceptar llamadas HTTP.
 * @returns {object} Mock con métodos fetch() y setMockResponse()
 */
function _createMockUrlFetchApp() {
  const mockResponses = {};

  return {
    responses: mockResponses,

    setMockResponse: function (url, responseBody, statusCode) {
      mockResponses[url] = {
        body: responseBody,
        statusCode: statusCode || 200
      };
    },

    fetch: function (url, options) {
      const key = url;
      const mockData = mockResponses[key];

      this.lastOptions = options;
      this.lastUrl = url;

      if (!mockData) {
        throw new Error('Mock no configurado para URL: ' + url);
      }

      return {
        getResponseCode: function () {
          return mockData.statusCode;
        },
        getContentText: function () {
          if (typeof mockData.body === 'string') {
            return mockData.body;
          }
          return JSON.stringify(mockData.body);
        }
      };
    },
    lastOptions: null,
    lastUrl: null
  };
}

/**
 * Crea un mock de errorHandler con interfaz estándar.
 * @returns {object} Mock con método createError()
 */
function _createMockErrorHandler() {
  return {
    createError: function (code, message, context) {
      const error = new Error(message);
      error.code = code;
      error.context = context || {};
      return error;
    }
  };
}

/**
 * Crea un mock de tokenManager con interfaz estándar.
 * @returns {object} Mock con método getToken()
 */
function _createMockTokenManager(tokenValue) {
  const tokens = {
    'notion': {
      'default': { apiKey: tokenValue || 'test-token-12345' },
      'account-2': { apiKey: 'token-account-2' }
    }
  };

  return {
    getToken: function (payload) {
      const { provider, accountId } = payload || {};
      const accId = accountId || 'default';
      const providerTokens = tokens[provider];
      if (!providerTokens || !providerTokens[accId]) {
        throw new Error(`Provider/Account not found: ${provider}/${accId}`);
      }
      return providerTokens[accId];
    },
    setToken: function (p) { /* mock */ }
  };
}

/**
 * Setup centralizado: Configura mocks y dependencias para cada test.
 * @returns {object} { mockUrlFetch, mockErrorHandler, mockConfigurator, originalUrlFetchApp, adapter }
 */
function _setupNotionAdapterTests() {
  const mockUrlFetch = _createMockUrlFetchApp();
  const mockErrorHandler = _createMockErrorHandler();
  const mockTokenManager = _createMockTokenManager('test-notion-token');

  const originalUrlFetchApp = globalThis.UrlFetchApp;

  globalThis.UrlFetchApp = mockUrlFetch;

  const adapter = createNotionAdapter({
    errorHandler: mockErrorHandler,
    tokenManager: mockTokenManager
  });

  return {
    mockUrlFetch: mockUrlFetch,
    mockErrorHandler: mockErrorHandler,
    mockTokenManager: mockTokenManager,
    originalUrlFetchApp: originalUrlFetchApp,
    adapter: adapter
  };
}

/**
 * Teardown centralizado: Restaura estado global después de cada test.
 * @param {object} setup - Objeto retornado por _setupNotionAdapterTests()
 */
function _teardownNotionAdapterTests(setup) {
  if (setup.originalUrlFetchApp) {
    globalThis.UrlFetchApp = setup.originalUrlFetchApp;
  } else {
    delete globalThis.UrlFetchApp;
  }
}

// ======================================================================
// SUITE 1: CONTRATO H7 (Validación de Interfaz Genérica)
// ======================================================================

/**
 * Test 1.1: Factory valida errorHandler (contrato obligatorio)
 */
function testNotionAdapter_FactoryValidaErrorHandler() {
  let setup = null;
  try {
    try {
      createNotionAdapter({
        errorHandler: null,
        tokenManager: _createMockTokenManager()
      });
      throw new Error('FALLO: Debería haber lanzado TypeError');
    } catch (e) {
      if (e.message.indexOf('errorHandler contract not fulfilled') === -1) {
        throw new Error('FALLO: Mensaje de error incorrecto: ' + e.message);
      }
    }

  } finally {
    if (setup) _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 1.2: Factory valida tokenManager (contrato obligatorio)
 */
function testNotionAdapter_FactoryValidaTokenManager() {
  let setup = null;
  try {
    try {
      createNotionAdapter({
        errorHandler: _createMockErrorHandler(),
        tokenManager: null
      });
      throw new Error('FALLO: Debería haber lanzado error');
    } catch (e) {
      if (e.code !== 'CONFIGURATION_ERROR') {
        throw new Error('FALLO: Código de error incorrecto: ' + e.code);
      }
    }

  } finally {
    if (setup) _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 1.3: Retorna interfaz congelada (Object.freeze)
 */
function testNotionAdapter_InterfazCongelada() {
  const setup = _setupNotionAdapterTests();
  try {
    const adapter = setup.adapter;

    if (typeof Object.freeze !== 'function') {
      throw new Error('FALLO: Object.freeze no disponible');
    }

    const isFrozen = Object.isFrozen(adapter);
    if (!isFrozen) {
      throw new Error('FALLO: Interfaz no está congelada');
    }

    // FIX CRÍTICO E: Verificar que la asignación no tiene efecto (strict mode puede lanzar error)
    try {
      adapter.nuevoMetodo = function () { };
    } catch (e) {
      // En strict mode, se lanza TypeError - esto es correcto
    }

    // Verificar que la propiedad NO fue añadida
    if (adapter.nuevoMetodo !== undefined) {
      throw new Error('FALLO: Se permitió añadir propiedad a interfaz congelada');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 1.4: Lazy loading de token (no falla en factory)
 */
function testNotionAdapter_LazyLoadingNoFallaEnFactory() {
  const setup = _setupNotionAdapterTests();
  try {
    const mockTokenManager = _createMockTokenManager(null);

    try {
      const adapterSinToken = createNotionAdapter({
        errorHandler: setup.mockErrorHandler,
        tokenManager: mockTokenManager
      });

    } catch (e) {
      throw new Error('FALLO: Factory no debería fallar si token es null');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 1.5: Token no configurado falla en método (lazy loading)
 */
function testNotionAdapter_TokenNoConfiguradoFallaEnMetodo() {
  const setup = _setupNotionAdapterTests();
  try {
    const mockTokenManager = {
      getToken: function () { throw new Error('Not configured'); }
    };

    const adapter = createNotionAdapter({
      errorHandler: setup.mockErrorHandler,
      tokenManager: mockTokenManager
    });

    try {
      adapter.search({ query: 'test' });
      throw new Error('FALLO: Debería haber lanzado error por token ausente');
    } catch (e) {
      if (e.code !== 'CONFIGURATION_ERROR') {
        throw new Error('FALLO: Código de error incorrecto: ' + e.code);
      }
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

// ======================================================================
// SUITE 2: MÉTODOS BÁSICOS (Páginas y Bases de Datos)
// ======================================================================

/**
 * Test 2.1: search() retorna resultados
 */
function testNotionAdapter_SearchRetornaResultados() {
  const setup = _setupNotionAdapterTests();
  try {
    const searchUrl = 'https://api.notion.com/v1/search';
    const mockResponse = {
      results: [
        { id: 'page-1', title: 'Página 1', object: 'page' },
        { id: 'db-1', title: 'BD 1', object: 'database' }
      ]
    };

    setup.mockUrlFetch.setMockResponse(searchUrl, mockResponse, 200);

    const result = setup.adapter.search({ query: 'test' });

    if (!result.results || result.results.length !== 2) {
      throw new Error('FALLO: No se retornaron resultados de búsqueda');
    }

    if (result.results[0].id !== 'page-1') {
      throw new Error('FALLO: ID de resultado incorrecto');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 2.2: search() valida query (parámetro obligatorio)
 */
function testNotionAdapter_SearchValidaQuery() {
  const setup = _setupNotionAdapterTests();
  try {
    try {
      setup.adapter.search({ query: null });
      throw new Error('FALLO: Debería haber validado query');
    } catch (e) {
      if (e.code !== 'INVALID_INPUT') {
        throw new Error('FALLO: Código de error incorrecto: ' + e.code);
      }
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 2.3: retrieveDatabase() obtiene metadatos
 */
function testNotionAdapter_RetrieveDatabaseObtieneDatos() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const dbUrl = 'https://api.notion.com/v1/databases/' + dbId;
    const mockResponse = {
      id: dbId,
      title: [{ text: { content: 'Mi BD' } }],
      properties: {
        'Name': { type: 'title', title: {} },
        'Status': { type: 'select', select: {} }
      }
    };

    setup.mockUrlFetch.setMockResponse(dbUrl, mockResponse, 200);

    const result = setup.adapter.retrieveDatabase({ databaseId: dbId });

    if (result.id !== dbId) {
      throw new Error('FALLO: ID de BD no coincide');
    }

    if (!result.properties || !result.properties['Name']) {
      throw new Error('FALLO: Propiedades no retornadas');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 2.4: queryDatabase() filtra y aplanifica propiedades
 */
function testNotionAdapter_QueryDatabaseAplanificaPropiedades() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const queryUrl = 'https://api.notion.com/v1/databases/' + dbId + '/query';
    const mockResponse = {
      results: [
        {
          id: 'page-1',
          properties: {
            'Name': { id: 'name', type: 'title', title: [{ plain_text: 'Tarea 1' }] },
            'Status': { id: 'status', type: 'select', select: { name: 'Pendiente' } }
          },
          created_time: '2025-01-01T00:00:00Z',
          last_edited_time: '2025-01-02T00:00:00Z'
        }
      ]
    };

    setup.mockUrlFetch.setMockResponse(queryUrl, mockResponse, 200);

    const result = setup.adapter.queryDatabase({ databaseId: dbId });

    if (!result.results || result.results.length !== 1) {
      throw new Error('FALLO: No se retornaron resultados');
    }

    const page = result.results[0];
    if (page.properties['Name'] !== 'Tarea 1') {
      throw new Error('FALLO: Propiedad no aplanificada correctamente');
    }

    if (page.properties['Status'] !== 'Pendiente') {
      throw new Error('FALLO: Select no aplanificado correctamente');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 2.5: retrievePage() aplanifica propiedades
 */
function testNotionAdapter_RetrievePageAplanificaPropiedades() {
  const setup = _setupNotionAdapterTests();
  try {
    const pageId = 'page-12345';
    const pageUrl = 'https://api.notion.com/v1/pages/' + pageId;
    const mockResponse = {
      id: pageId,
      properties: {
        'Title': { id: 'title', type: 'title', title: [{ plain_text: 'Mi Página' }] },
        'Email': { id: 'email', type: 'email', email: 'test@example.com' }
      },
      created_time: '2025-01-01T00:00:00Z',
      last_edited_time: '2025-01-02T00:00:00Z',
      parent: { type: 'database_id', database_id: 'db-123' }
    };

    setup.mockUrlFetch.setMockResponse(pageUrl, mockResponse, 200);

    const result = setup.adapter.retrievePage({ pageId: pageId });

    if (result.properties['Title'] !== 'Mi Página') {
      throw new Error('FALLO: Title no aplanificado');
    }

    if (result.properties['Email'] !== 'test@example.com') {
      throw new Error('FALLO: Email no aplanificado');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 2.6: createPage() enriquece propiedades según esquema
 */
function testNotionAdapter_CreatePageEnriquecePropiedades() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const dbUrl = 'https://api.notion.com/v1/databases/' + dbId;
    const pageUrl = 'https://api.notion.com/v1/pages';

    const dbResponse = {
      id: dbId,
      properties: {
        'Name': { type: 'title', title: {} },
        'Status': { type: 'select', select: {} }
      }
    };

    const pageResponse = {
      id: 'page-new',
      properties: {
        'Name': { id: 'name', type: 'title', title: [{ plain_text: 'Nueva Página' }] },
        'Status': { id: 'status', type: 'select', select: { name: 'Pendiente' } }
      },
      created_time: '2025-01-03T00:00:00Z'
    };

    setup.mockUrlFetch.setMockResponse(dbUrl, dbResponse, 200);
    setup.mockUrlFetch.setMockResponse(pageUrl, pageResponse, 200);

    const result = setup.adapter.createPage({
      parent: { database_id: dbId },
      properties: {
        'Name': 'Nueva Página',
        'Status': 'Pendiente'
      }
    });

    if (result.id !== 'page-new') {
      throw new Error('FALLO: ID de página no coincide');
    }

    if (result.properties['Name'] !== 'Nueva Página') {
      throw new Error('FALLO: Propiedad Name no aplanificada');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 2.7: updatePageProperties() enriquece según esquema
 */
function testNotionAdapter_UpdatePagePropertiesEnriquece() {
  const setup = _setupNotionAdapterTests();
  try {
    const pageId = 'page-12345';
    const dbId = 'db-12345';

    const getPageUrl = 'https://api.notion.com/v1/pages/' + pageId;
    const dbUrl = 'https://api.notion.com/v1/databases/' + dbId;
    const updatePageUrl = 'https://api.notion.com/v1/pages/' + pageId;

    const getPageResponse = {
      id: pageId,
      properties: { 'Name': { type: 'title', title: [{ plain_text: 'Antiguo' }] } },
      parent: { type: 'database_id', database_id: dbId }
    };

    const dbResponse = {
      id: dbId,
      properties: {
        'Name': { type: 'title', title: {} },
        'Status': { type: 'select', select: {} }
      }
    };

    const updatePageResponse = {
      id: pageId,
      properties: {
        'Name': { type: 'title', title: [{ plain_text: 'Nuevo' }] },
        'Status': { type: 'select', select: { name: 'Completado' } }
      },
      last_edited_time: '2025-01-04T00:00:00Z'
    };

    setup.mockUrlFetch.setMockResponse(getPageUrl, getPageResponse, 200);
    setup.mockUrlFetch.setMockResponse(dbUrl, dbResponse, 200);
    setup.mockUrlFetch.setMockResponse(updatePageUrl, updatePageResponse, 200);

    const result = setup.adapter.updatePageProperties({
      pageId: pageId,
      properties: {
        'Name': 'Nuevo',
        'Status': 'Completado'
      }
    });

    if (result.properties['Name'] !== 'Nuevo') {
      throw new Error('FALLO: Name no actualizado');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

// ======================================================================
// SUITE 3: MÉTODOS DE BLOQUES (Contenido de Página)
// ======================================================================

/**
 * Test 3.1: retrieveBlockChildren() obtiene bloques anidados
 */
function testNotionAdapter_RetrieveBlockChildrenObtieneBloques() {
  const setup = _setupNotionAdapterTests();
  try {
    const pageId = 'page-12345';
    const blocksUrl = 'https://api.notion.com/v1/blocks/' + pageId + '/children';

    const mockResponse = {
      results: [
        {
          id: 'block-1',
          type: 'paragraph',
          paragraph: { rich_text: [{ plain_text: 'Párrafo 1' }] },
          has_children: false
        },
        {
          id: 'block-2',
          type: 'heading_1',
          heading_1: { rich_text: [{ plain_text: 'Encabezado' }] },
          has_children: false
        }
      ],
      has_more: false
    };

    setup.mockUrlFetch.setMockResponse(blocksUrl, mockResponse, 200);

    const result = setup.adapter.retrieveBlockChildren({ blockId: pageId });

    if (!result.results || result.results.length !== 2) {
      throw new Error('FALLO: No se retornaron bloques');
    }

    if (result.results[0].id !== 'block-1') {
      throw new Error('FALLO: ID de bloque incorrecto');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 3.2: appendBlockChildren() añade bloques a contenedor
 */
function testNotionAdapter_AppendBlockChildrenAgregaBloques() {
  const setup = _setupNotionAdapterTests();
  try {
    const pageId = 'page-12345';
    const appendUrl = 'https://api.notion.com/v1/blocks/' + pageId + '/children';

    const mockResponse = {
      results: [
        {
          id: 'block-new-1',
          type: 'paragraph',
          paragraph: { rich_text: [{ plain_text: 'Nuevo párrafo' }] }
        }
      ]
    };

    setup.mockUrlFetch.setMockResponse(appendUrl, mockResponse, 200);

    const result = setup.adapter.appendBlockChildren({
      blockId: pageId,
      blocks: [
        {
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: 'Nuevo párrafo' } }] }
        }
      ]
    });

    if (!result.results || result.results.length !== 1) {
      throw new Error('FALLO: No se adjuntaron bloques');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

// ======================================================================
// SUITE 4: EXTENSIONES AVANZADAS (H7 - Métodos Nuevos)
// ======================================================================

/**
 * Test 4.1: createDatabase() crea nueva BD
 */
function testNotionAdapter_CreateDatabaseCreaBD() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbUrl = 'https://api.notion.com/v1/databases';

    const mockResponse = {
      id: 'db-new-12345',
      title: [{ text: { content: 'Nueva BD' } }],
      properties: {
        'Name': { type: 'title', title: {} }
      }
    };

    setup.mockUrlFetch.setMockResponse(dbUrl, mockResponse, 200);

    const result = setup.adapter.createDatabase({
      parentPageId: 'page-parent',
      title: 'Nueva BD',
      properties: {
        'Name': { title: {} }
      }
    });

    if (result.id !== 'db-new-12345') {
      throw new Error('FALLO: ID de BD no coincide');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 4.2: createRelationProperty() crea relación bidireccional
 */
function testNotionAdapter_CreateRelationPropertyCreaBidireccional() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const dbUrl = 'https://api.notion.com/v1/databases/' + dbId;

    const mockResponse = {
      id: dbId,
      properties: {
        'RelatedPages': {
          type: 'relation',
          relation: { database_id: 'db-target' }
        }
      }
    };

    setup.mockUrlFetch.setMockResponse(dbUrl, mockResponse, 200);

    const result = setup.adapter.createRelationProperty({
      databaseId: dbId,
      propertyName: 'RelatedPages',
      targetDatabaseId: 'db-target',
      dualPropertyName: 'BackRelation'
    });

    if (!result.properties['RelatedPages']) {
      throw new Error('FALLO: Propiedad de relación no creada');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 4.3: createRollupProperty() crea agregación
 */
function testNotionAdapter_CreateRollupPropertyCreaRollup() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const dbUrl = 'https://api.notion.com/v1/databases/' + dbId;

    const mockResponse = {
      id: dbId,
      properties: {
        'Total': {
          type: 'rollup',
          rollup: {
            relation_property_name: 'Items',
            rollup_property_name: 'Amount',
            function: 'sum'
          }
        }
      }
    };

    setup.mockUrlFetch.setMockResponse(dbUrl, mockResponse, 200);

    const result = setup.adapter.createRollupProperty({
      databaseId: dbId,
      propertyName: 'Total',
      relationPropertyName: 'Items',
      targetPropertyName: 'Amount',
      aggregationFunction: 'sum'
    });

    if (!result.properties['Total']) {
      throw new Error('FALLO: Propiedad de rollup no creada');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 4.4: deleteProperty() elimina propiedad
 */
function testNotionAdapter_DeletePropertyEliminaPropiedad() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const propId = 'prop-12345';
    const deleteUrl = 'https://api.notion.com/v1/databases/' + dbId + '/properties/' + propId;

    const mockResponse = {
      id: propId,
      archived: true
    };

    setup.mockUrlFetch.setMockResponse(deleteUrl, mockResponse, 200);

    const result = setup.adapter.deleteProperty({
      databaseId: dbId,
      propertyId: propId
    });

    if (!result.archived) {
      throw new Error('FALLO: Propiedad no eliminada');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 4.5: updateProperty() actualiza configuración
 */
function testNotionAdapter_UpdatePropertyActualizaConfig() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const propId = 'prop-12345';
    const updateUrl = 'https://api.notion.com/v1/databases/' + dbId + '/properties/' + propId;

    const mockResponse = {
      id: propId,
      name: 'UpdatedName',
      type: 'select',
      select: { options: [{ name: 'Opción 1' }] }
    };

    setup.mockUrlFetch.setMockResponse(updateUrl, mockResponse, 200);

    const result = setup.adapter.updateProperty({
      databaseId: dbId,
      propertyId: propId,
      newConfig: { name: 'UpdatedName' }
    });

    if (result.name !== 'UpdatedName') {
      throw new Error('FALLO: Propiedad no actualizada');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

// ======================================================================
// SUITE 5: MANEJO DE ERRORES (HTTP y Validación)
// ======================================================================

/**
 * Test 5.1: Error HTTP 401 (Unauthorized)
 */
function testNotionAdapter_ErrorHTTP401Unauthorized() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const dbUrl = 'https://api.notion.com/v1/databases/' + dbId;

    setup.mockUrlFetch.setMockResponse(dbUrl, { message: 'Unauthorized' }, 401);

    try {
      setup.adapter.retrieveDatabase({ databaseId: dbId });
      throw new Error('FALLO: Debería haber lanzado error HTTP 401');
    } catch (e) {
      if (e.code !== 'NOTION_API_ERROR') {
        throw new Error('FALLO: Código de error incorrecto: ' + e.code);
      }
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 5.2: Error HTTP 404 (Not Found)
 */
function testNotionAdapter_ErrorHTTP404NotFound() {
  const setup = _setupNotionAdapterTests();
  try {
    const pageId = 'page-noexiste';
    const pageUrl = 'https://api.notion.com/v1/pages/' + pageId;

    setup.mockUrlFetch.setMockResponse(pageUrl, { message: 'Not found' }, 404);

    try {
      setup.adapter.retrievePage({ pageId: pageId });
      throw new Error('FALLO: Debería haber lanzado error HTTP 404');
    } catch (e) {
      if (e.code !== 'NOTION_API_ERROR') {
        throw new Error('FALLO: Código de error incorrecto: ' + e.code);
      }
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 5.3: Validación de parámetros obligatorios
 */
function testNotionAdapter_ValidaParametrosObligatorios() {
  const setup = _setupNotionAdapterTests();
  try {
    try {
      setup.adapter.retrieveDatabase({ databaseId: null });
      throw new Error('FALLO: Debería haber validado databaseId');
    } catch (e) {
      if (e.code !== 'INVALID_INPUT') {
        throw new Error('FALLO: Código de error incorrecto: ' + e.code);
      }
    }

    try {
      setup.adapter.createPage({ parent: null, properties: {} });
      throw new Error('FALLO: Debería haber validado parent');
    } catch (e) {
      if (e.code !== 'INVALID_INPUT') {
        throw new Error('FALLO: Código de error incorrecto: ' + e.code);
      }
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

/**
 * Test 5.4: Determinismo (mismo input → mismo output)
 */
function testNotionAdapter_DeterminismoMismoInputOutput() {
  const setup = _setupNotionAdapterTests();
  try {
    const dbId = 'db-12345';
    const dbUrl = 'https://api.notion.com/v1/databases/' + dbId;

    const mockResponse = {
      id: dbId,
      properties: {
        'Name': { type: 'title', title: {} }
      }
    };

    setup.mockUrlFetch.setMockResponse(dbUrl, mockResponse, 200);

    const result1 = setup.adapter.retrieveDatabase({ databaseId: dbId });
    const result2 = setup.adapter.retrieveDatabase({ databaseId: dbId });

    if (JSON.stringify(result1) !== JSON.stringify(result2)) {
      throw new Error('FALLO: Resultados no son deterministas');
    }

  } finally {
    _teardownNotionAdapterTests(setup);
  }
}

// ======================================================================
// FUNCIÓN PRINCIPAL: EJECUTOR DE TESTS
// ======================================================================

/**
 * Ejecuta todos los tests del NotionAdapter.
 * Llamar desde RunAllTests.gs
 */
function testNotionAdapter_RunAll() {
  const tests = [
    testNotionAdapter_FactoryValidaErrorHandler,
    testNotionAdapter_FactoryValidaTokenManager,
    testNotionAdapter_InterfazCongelada,
    testNotionAdapter_LazyLoadingNoFallaEnFactory,
    testNotionAdapter_TokenNoConfiguradoFallaEnMetodo,
    testNotionAdapter_SearchRetornaResultados,
    testNotionAdapter_SearchValidaQuery,
    testNotionAdapter_RetrieveDatabaseObtieneDatos,
    testNotionAdapter_QueryDatabaseAplanificaPropiedades,
    testNotionAdapter_RetrievePageAplanificaPropiedades,
    testNotionAdapter_CreatePageEnriquecePropiedades,
    testNotionAdapter_UpdatePagePropertiesEnriquece,
    testNotionAdapter_RetrieveBlockChildrenObtieneBloques,
    testNotionAdapter_AppendBlockChildrenAgregaBloques,
    testNotionAdapter_CreateDatabaseCreaBD,
    testNotionAdapter_CreateRelationPropertyCreaBidireccional,
    testNotionAdapter_CreateRollupPropertyCreaRollup,
    testNotionAdapter_DeletePropertyEliminaPropiedad,
    testNotionAdapter_UpdatePropertyActualizaConfig,
    testNotionAdapter_ErrorHTTP401Unauthorized,
    testNotionAdapter_ErrorHTTP404NotFound,
    testNotionAdapter_ValidaParametrosObligatorios,
    testNotionAdapter_DeterminismoMismoInputOutput,
    testNotionAdapter_MultiAccountSupport
  ];

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < tests.length; i++) {
    const testFn = tests[i];
    try {
      testFn();
      passed++;
    } catch (e) {
      failed++;
      failures.push({
        name: testFn.name,
        error: e.message
      });
    }
  }

  return {
    module: 'NotionAdapter',
    total: tests.length,
    passed: passed,
    failed: failed,
    failures: failures
  };
}

/**
 * Test 1.6: Multi-account - debe usar el token de la cuenta especificada
 */
function testNotionAdapter_MultiAccountSupport() {
  const setup = _setupNotionAdapterTests();
  try {
    const searchUrl = 'https://api.notion.com/v1/search';
    setup.mockUrlFetch.setMockResponse(searchUrl, { results: [] }, 200);

    // CASO 1: Sin accountId -> Usa default
    setup.adapter.search({ query: 'test' });
    let lastAuth = setup.mockUrlFetch.lastOptions.headers['Authorization'];
    if (lastAuth !== 'Bearer test-notion-token') {
      throw new Error('FALLO: No usó el token por defecto. Recibido: ' + lastAuth);
    }

    // CASO 2: Con accountId 'account-2'
    setup.adapter.search({ query: 'test', accountId: 'account-2' });
    lastAuth = setup.mockUrlFetch.lastOptions.headers['Authorization'];
    if (lastAuth !== 'Bearer token-account-2') {
      throw new Error('FALLO: No usó el token de account-2. Recibido: ' + lastAuth);
    }

    return true;
  } finally {
    _teardownNotionAdapterTests(setup);
  }
}