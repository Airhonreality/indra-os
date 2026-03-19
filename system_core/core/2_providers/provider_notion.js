// =============================================================================
// ARTEFACTO: 2_providers/provider_notion.gs
// CAPA: 2 — Providers
// RESPONSABILIDAD: Translator from Notion to Universal Core Protocol.
//         Converts Notion page and database hierarchy into universal atoms.
//         Unique access point for the Notion REST API.
//
// DISCOVERY PROTOCOL:
//   PROVIDER_CONF_NOTION is detected by _scanProviders_().
//
// REFERENCIA API: Notion API v2022-06-28
//   POST /v1/search            → buscar páginas y databases en la raíz
//   GET  /v1/databases/{id}    → metadata de una database (schema)
//   POST /v1/databases/{id}/query → filas de una database (TABULAR_STREAM)
//   GET  /v1/blocks/{id}/children → bloques de una página (ATOM_READ)
//   POST /v1/pages             → crear página (ATOM_CREATE)
//   PATCH /v1/pages/{id}       → actualizar página (ATOM_UPDATE)
//
// AXIOMS:
//   - Classification logic resides here. Frontend receives standardized atoms.
//   - Notion database → class: TABULAR
//   - Notion page     → class: DOCUMENT
//   - _flattenProperties() maps complex Notion structures into flat objects.
//   - Pagination is translated directly to Return Law metadata.
//
// RESTRICCIONES:
//   - NO puede inferir class por nombre de página o heurísticas de contenido.
//   - NO puede persistir estado entre requests (GAS es stateless).
//   - La API Key se lee desde system_config.gs — nunca hardcodeada.
//   - La validación del token es fail-fast: si no hay API Key → ERROR inmediato.
// =============================================================================

/**
 * Configuración de auto-descubrimiento del provider notion.
 * @const {Object}
 */
/**
 * Manifestación del Silo Notion. Sigue el Protocolo ADR-002.
 * @returns {Object} Contrato de configuración.
 */
function CONF_NOTION() {
  return Object.freeze({
    id: 'notion',
    handle: {
      ns: 'com.indra.system.silo',
      alias: 'notion',
      label: 'Notion'
    },
    class: 'FOLDER',         // class del átomo-silo en el manifest
    version: '1.0',
    protocols: ['HIERARCHY_TREE', 'TABULAR_STREAM', 'ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE', 'SEARCH_DEEP', 'SYSTEM_CONNECTION_TEST', 'ACCOUNT_RESOLVE', 'SCHEMA_MUTATE'],
    implements: {
      HIERARCHY_TREE: 'handleNotion',
      TABULAR_STREAM: 'handleNotion',
      ATOM_READ: 'handleNotion',
      ATOM_CREATE: 'handleNotion',
      ATOM_UPDATE: 'handleNotion',
      ATOM_DELETE: 'handleNotion',
      SEARCH_DEEP: 'handleNotion',
      SYSTEM_CONNECTION_TEST: 'handleNotion',
      ACCOUNT_RESOLVE: 'handleNotion',
      SCHEMA_MUTATE: 'handleNotion'
    },
    config_schema: [
      { key: 'NOTION_API_KEY', type: 'password', label: 'API Key de Notion', required: true },
    ],
    capabilities: {
      ATOM_READ: { sync: 'BLOCKING', purge: 'NONE' },
      ATOM_CREATE: { sync: 'BLOCKING', purge: 'ALL' },
      ATOM_UPDATE: { sync: 'BLOCKING', purge: 'ID' },
      ATOM_DELETE: { sync: 'BLOCKING', purge: 'ALL' },
      SCHEMA_MUTATE: { sync: 'BLOCKING', purge: 'ID' },
      TABULAR_STREAM: { sync: 'BLOCKING', purge: 'NONE' },
      HIERARCHY_TREE: { sync: 'BLOCKING', purge: 'NONE' },
      SEARCH_DEEP: { sync: 'BLOCKING', purge: 'NONE' },
      SYSTEM_CONNECTION_TEST: { sync: 'BLOCKING', purge: 'NONE' }
    },
    protocol_meta: {
      HIERARCHY_TREE: { label: 'Conectando con Notion', help: 'Escaneando páginas y bases de datos en la raíz.' },
      TABULAR_STREAM: { label: 'Extrayendo Datos', help: 'Consultando filas y resolviendo relaciones en paralelo.' },
      ATOM_READ: { label: 'Abriendo Página', help: 'Recuperando bloques y contenido de Notion.' },
      ATOM_CREATE: { label: 'Creando en Notion', help: 'Esculpiendo nueva página en el workspace externo.' },
      ATOM_UPDATE: { label: 'Sincronizando Notion', help: 'Actualizando propiedades en la nube.' },
      ATOM_DELETE: { label: 'Archivando en Notion', help: 'Enviando página a la papelera (archivar).' },
      SCHEMA_MUTATE: { label: 'Mutando Estructura', help: 'Alterando columnas de la base de datos externa.' },
      SEARCH_DEEP: { label: 'Búsqueda Profunda', help: 'Consultando todo el workspace de Notion.' },
      SYSTEM_CONNECTION_TEST: { label: 'Probando Enlace', help: 'Verificando validez del Token de Integración.' }
    }
  });
}


// ─── CONSTANTES DE API ────────────────────────────────────────────────────────

const NOTION_BASE_URL_ = 'https://api.notion.com/v1';
const NOTION_API_VER_ = '2022-06-28';

// ─── MANEJADOR PRINCIPAL ──────────────────────────────────────────────────────

/**
 * Punto de entrada del provider notion. Invocado por protocol_router.gs.
 *
 * @param {Object} uqo - Universal Query Object.
 * @returns {{ items: Array, metadata: Object }}
 */
function handleNotion(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();
  const parts = uqo.provider.split(':');
  const provider = parts[0];
  const accountId = parts[1] || 'default';

  if (provider !== 'notion') {
    const err = createError('SYSTEM_FAILURE', `El handler de Notion recibió un provider inesperado: ${provider}`);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
  }

  logInfo(`[provider_notion] Dispatching: ${protocol} for account: ${accountId}`, { context_id: uqo.context_id });

  // Validación fail-fast: sin API Key → error visible inmediato.
  const apiKey = _notion_getNotionApiKey(accountId);
  if (!apiKey) {
    const err = createError('CONFIGURATION_ERROR',
      `Notion [${accountId}] no está configurado. Ve a Servicios y añade tu API Key.`
    );
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
  }

  if (protocol === 'HIERARCHY_TREE') return _notion_handleHierarchyTree(uqo, apiKey);
  if (protocol === 'TABULAR_STREAM') return _notion_handleTabularStream(uqo, apiKey);
  if (protocol === 'ATOM_READ') return _notion_handleAtomRead(uqo, apiKey);
  if (protocol === 'ATOM_CREATE') return _notion_handleAtomCreate(uqo, apiKey);
  if (protocol === 'ATOM_UPDATE') return _notion_handleAtomUpdate(uqo, apiKey);
  if (protocol === 'ATOM_DELETE') return _notion_handleAtomDelete(uqo, apiKey);
  if (protocol === 'SEARCH_DEEP') return _notion_handleSearchDeep(uqo, apiKey);
  if (protocol === 'ACCOUNT_RESOLVE') return _notion_handleAccountResolve(uqo, apiKey);
  if (protocol === 'SCHEMA_MUTATE') return _notion_handleSchemaMutate(uqo, apiKey);

  const err = createError('PROTOCOL_NOT_FOUND',
    `Provider "notion" no soporta el protocolo: "${protocol}".`
  );
  return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
}

/**
 * SYSTEM_CONNECTION_TEST: Verifica si un token es válido.
 * Puede recibir el `api_key` en `uqo.data` para probar antes de guardar,
 * o usar la ya guardada si no se provee.
 *
 * @private
 */
function _notion_handleConnectionTest(uqo) {
  const testApiKey = (uqo.data && uqo.data.api_key) || _notion_getNotionApiKey(uqo.provider.split(':')[1]);
  if (!testApiKey) {
    return { items: [], metadata: { status: 'ERROR', error: 'No se proveyó API Key para la prueba.' } };
  }
  try {
    _notion_notionRequest('/search', { method: 'POST', payload: { page_size: 1 }, apiKey: testApiKey });
    return { items: [], metadata: { status: 'OK' } };
  } catch (e) {
    return { items: [], metadata: { status: 'ERROR', error: 'Token inválido o sin permisos.' } };
  }
}

/**
 * ACCOUNT_RESOLVE: Descubre la identidad real del workspace de Notion.
 * AXIOMA §1.4: La identidad es un Hecho Verificable.
 * @private
 */
function _notion_handleAccountResolve(uqo, passedApiKey) {
  const apiKey = passedApiKey || (uqo.data && uqo.data.api_key);
  if (!apiKey) return { items: [], metadata: { status: 'ERROR', error: 'API Key requerida para resolución.' } };

  try {
    // En Notion, /v/users/me devuelve el bot y el workspace relacionado
    const identity = _notion_notionRequest('/users/me', { method: 'GET', apiKey });

    // El workspace name viene en bot.owner.workspace_name (Integraciones Internas)
    const label = identity.bot?.owner?.workspace_name
      || identity.name
      || identity.bot?.owner?.user?.name
      || 'Notion Workspace';

    logInfo(`[provider_notion] Identidad resuelta: ${label}`);

    return {
      items: [{
        id: uqo.account_id || 'new',
        handle: {
          ns: 'com.indra.system.account',
          alias: _system_slugify_(label),
          label: label
        },
        class: 'ACCOUNT_IDENTITY',
        protocols: ['ATOM_READ']
      }],
      metadata: { status: 'OK' }
    };

  } catch (e) {
    logError(`[provider_notion] Fallo en ACCOUNT_RESOLVE: ${e.message}`);
    return { items: [], metadata: { status: 'ERROR', error: e.message } };
  }
}

// ─── HANDLERS POR PROTOCOLO ───────────────────────────────────────────────────

/**
 * HIERARCHY_TREE: Lista las páginas y databases en la raíz de Notion.
 * context_id = "ROOT"   → búsqueda global en el workspace de Notion.
 * context_id = pageId   → hijos directos de una página.
 *
 * @private
 */
function _notion_handleHierarchyTree(uqo, apiKey) {
  try {
    let contextId = uqo.context_id || 'ROOT';
    // Normalización Axiomática: si el context_id es la propia identidad del silo, es el ROOT.
    if (contextId === uqo.provider) contextId = 'ROOT';
    const cursor = uqo.query && uqo.query.cursor ? uqo.query.cursor : undefined;
    const providerId = uqo.provider;

    let results, hasMore, nextCursor;

    if (contextId === 'ROOT' && !cursor) {
      // STRATEGY: STRUCTURE_FIRST
      // 1. Discover Databases
      const dbResponse = _notion_notionRequest('/search', {
        method: 'POST',
        payload: { filter: { value: 'database', property: 'object' }, page_size: 20 },
        apiKey,
      });

      // 2. Buscar Todo (para el resto)
      const allResponse = _notion_notionRequest('/search', {
        method: 'POST',
        payload: { page_size: 40 },
        apiKey,
      });

      // 3. Mezclar deduplicando (Databases primero)
      const seenIds = new Set();
      const combinedResults = [];

      [...(dbResponse.results || []), ...(allResponse.results || [])].forEach(item => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          combinedResults.push(item);
        }
      });

      results = combinedResults;
      hasMore = allResponse.has_more || false;
      nextCursor = allResponse.next_cursor || null;

    } else if (contextId === 'ROOT' && cursor) {
      // Paginación normal para profundidad
      const response = _notion_notionRequest('/search', {
        method: 'POST',
        payload: { page_size: 50, start_cursor: cursor },
        apiKey,
      });
      results = response.results || [];
      hasMore = response.has_more || false;
      nextCursor = response.next_cursor || null;

    } else {
      // Hijos directos de un bloque
      const blocksResponse = _notion_notionRequest(
        `/blocks/${contextId}/children?page_size=50${cursor ? '&start_cursor=' + cursor : ''}`,
        { method: 'GET', apiKey }
      );

      results = (blocksResponse.results || []).filter(b =>
        b.type === 'child_page' || b.type === 'child_database'
      );
      hasMore = blocksResponse.has_more || false;
      nextCursor = blocksResponse.next_cursor || null;
    }

    const items = results
      .map(item => _notion_notionObjectToAtom(item, providerId))
      .filter(atom => atom !== null);

    // 4. Calculate Hood Categorization
    const hoodCounts = {
      STRUCTURE: items.filter(i => i.system_hood === 'STRUCTURE').length,
      PHENOTYPE: items.filter(i => i.system_hood === 'PHENOTYPE').length,
      ROUTES: 0
    };

    logInfo(`[provider_notion] hierarchy_tree: ${items.length} ítems. context: ${contextId}`);

    return {
      items,
      metadata: {
        status: 'OK',
        has_more: hasMore,
        next_cursor: nextCursor,
        total_objects: (contextId === 'ROOT' && !hasMore) ? items.length : undefined, // Solo si es completo
        sync_status: hasMore ? 'RESONATING' : 'COMPLETE',
        hood_counts: hoodCounts
      },
    };

  } catch (err) {
    logError('[provider_notion] Error en hierarchy_tree.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * TABULAR_STREAM: Lista las filas de una Notion Database.
 * context_id = databaseId de Notion.
 * query.filter, query.sorts → pasados directamente a la API de Notion (opacos).
 *
 * @private
 */
function _notion_handleTabularStream(uqo, apiKey) {
  if (!uqo.context_id) {
    const err = createError('INVALID_INPUT', 'TABULAR_STREAM requiere context_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    const dbId = uqo.context_id;
    const query = uqo.query || {};
    const cursor = query.cursor;
    const providerId = uqo.provider;

    const dbMeta = _notion_notionRequest(`/databases/${dbId}`, { method: 'GET', apiKey });
    const schema = dbMeta.properties || {};
    const dbName = _notion_extractNotionTitle(dbMeta.title);

    const queryPayload = { page_size: 50 };
    if (cursor) queryPayload.start_cursor = cursor;
    if (query.filter) queryPayload.filter = query.filter;
    // Traducir sorts del formato UQO canónico (ASC/DESC) al formato nativo de Notion
    if (query.sorts && query.sorts.length > 0) {
      queryPayload.sorts = _notion_translateSorts(query.sorts);
    }

    const pagePayload = { page_size: 50 };
    if (cursor) pagePayload.start_cursor = cursor;
    if (query.filter) pagePayload.filter = query.filter;
    if (query.sorts && query.sorts.length > 0) {
      pagePayload.sorts = _notion_translateSorts(query.sorts);
    }

    logInfo(`[provider_notion] TABULAR_STREAM: Query Payload: ${JSON.stringify(pagePayload)}`);

    const response = _notion_notionRequest(`/databases/${dbId}/query`, {
      method: 'POST',
      payload: pagePayload,
      apiKey,
    });

    const rows = response.results || [];
    const hasMore = response.has_more || false;
    const nextCursor = response.next_cursor || null;

    const rawItems = rows.map(page => _notion_rowToAtom(page, dbId, dbName, providerId));
    const fields = _notion_schemaToFields(schema);

    logInfo(`[provider_notion] TABULAR_STREAM: DB Metadata Schema Properties: ${Object.keys(schema).join(', ')}`);
    logInfo(`[provider_notion] TABULAR_STREAM: Fields Resultantes: ${fields.length}`);

    // ── RESOLUCIÓN DE RELACIONES ──────────────────────────────────────────────
    // Usa UrlFetchApp.fetchAll() — todos los requests van en paralelo.
    // Costo de tiempo: ~latencia de 1 request, sin importar cuántos IDs haya.
    // El límite protege solo contra bases de datos con miles de relaciones únicas
    // (caso extremo). Para uso normal (50-100 filas) cubre el 100% de los IDs.
    const RELATION_RESOLVE_LIMIT = 100;
    const relationFields = fields.filter(function (c) { return c.type === 'RELATION'; });
    const items = _notion_resolveRelationNames(rawItems, relationFields, apiKey, RELATION_RESOLVE_LIMIT);

    logInfo(`[provider_notion] tabular_stream: ${items.length} filas de "${dbName}"`);

    return {
      items,
      metadata: {
        status: 'OK',
        has_more: hasMore,
        next_cursor: nextCursor,
        schema: { fields },     // DATA_CONTRACTS: schema en metadata
        context: { db_id: dbId, db_name: dbName },
      },
    };

  } catch (err) {
    logError('[provider_notion] Error en tabular_stream.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_READ: Obtiene el contenido de un bloque/página o database de Notion.
 * context_id = ID de Notion (página o database).
 *
 * @private
 */
function _notion_handleAtomRead(uqo, apiKey) {
  if (!uqo.context_id) {
    const err = createError('INVALID_INPUT', 'ATOM_READ requiere context_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  const id = uqo.context_id;
  logInfo(`[provider_notion] ATOM_READ: Intentando resolución agnóstica para ${id}`);

  try {
    let rawObj = null;
    let typeFound = null;

    // 1. Intentar como PÁGINA
    try {
      rawObj = _notion_notionRequest(`/pages/${id}`, { method: 'GET', apiKey });
      typeFound = 'page';
    } catch (e1) {
      // 2. Si falla, intentar como DATABASE
      logInfo(`[provider_notion] ATOM_READ: ${id} no es página, probando database...`);
      try {
        rawObj = _notion_notionRequest(`/databases/${id}`, { method: 'GET', apiKey });
        typeFound = 'database';
      } catch (e2) {
        throw createError('NOT_FOUND', `No se encontró el objeto Notion ${id} como página ni como database.`);
      }
    }

    const atom = _notion_notionObjectToAtom(rawObj, uqo.provider);

    // 3. Si es página, enriquecer con bloques (contenido)
    if (typeFound === 'page' && atom) {
      const blocks = _notion_notionRequest(`/blocks/${id}/children?page_size=100`, { method: 'GET', apiKey });
      atom.raw.blocks = blocks.results || [];
    }

    logInfo(`[provider_notion] ATOM_READ: Resuelto como ${typeFound}`);

    return {
      items: atom ? [atom] : [],
      metadata: { status: 'OK', notion_type: typeFound },
    };

  } catch (err) {
    logError(`[provider_notion] Error en ATOM_READ para ${uqo.context_id}: ${err.message}`);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_CREATE: Crea una nueva página en Notion.
 * context_id = ID de la página padre (o database ID para crear una fila).
 * data.name  = título de la página (requerido).
 *
 * @private
 */
function _notion_handleAtomCreate(uqo, apiKey) {
  const data = uqo.data || {};
  const label = data.handle?.label || data.name;
  if (!label) {
    const err = createError('INVALID_INPUT', 'ATOM_CREATE requiere data.handle.label o data.name.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
  if (!uqo.context_id) {
    const err = createError('INVALID_INPUT', 'ATOM_CREATE requiere context_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    const pagePayload = {
      parent: { page_id: uqo.context_id },
      properties: {
        title: { title: [{ text: { content: label } }] },
      },
    };

    const created = _notion_notionRequest('/pages', { method: 'POST', payload: pagePayload, apiKey });
    const atom = _notion_notionObjectToAtom(created, uqo.provider);

    logInfo(`[provider_notion] ATOM_CREATE: Created resource: "${label}" under ${uqo.context_id}`);
    return { items: atom ? [atom] : [], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_notion] Error en atom_create.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_UPDATE: Actualiza el título u otras propiedades de una página.
 * context_id = pageId de Notion.
 * data = objeto con los campos a actualizar (flat, el adapter enriquece).
 *
 * @private
 */
function _notion_handleAtomUpdate(uqo, apiKey) {
  if (!uqo.context_id || !uqo.data) {
    const err = createError('INVALID_INPUT', 'ATOM_UPDATE requiere context_id y data.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    const properties = {};
    const label = uqo.data.handle?.label || uqo.data.name;
    if (label) {
      properties.title = { title: [{ text: { content: label } }] };
    }

    const updated = _notion_notionRequest(`/pages/${uqo.context_id}`, {
      method: 'PATCH',
      payload: { properties },
      apiKey,
    });

    const atom = _notion_notionObjectToAtom(updated, uqo.provider);
    return { items: atom ? [atom] : [], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_notion] Error en atom_update.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_DELETE: Archiva (soft-delete) una página en Notion.
 * Notion no permite borrado permanente via API — solo archivado.
 *
 * @private
 */
function _notion_handleAtomDelete(uqo, apiKey) {
  if (!uqo.context_id) {
    const err = createError('INVALID_INPUT', 'ATOM_DELETE requiere context_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    _notion_notionRequest(`/pages/${uqo.context_id}`, {
      method: 'PATCH',
      payload: { archived: true },
      apiKey,
    });

    logInfo(`[provider_notion] Página archivada: ${uqo.context_id}`);
    return { items: [], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_notion] Error en atom_delete.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

// ─── CONVERSIÓN A ÁTOMO UNIVERSAL ────────────────────────────────────────────

/**
 * Convierte un objeto de Notion (page o database) a Átomo Universal canónico.
 * Decisión de clasificación:
 *   object === 'database'   → class: TABULAR  (tiene estructura de filas)
 *   object === 'page'       → class: DOCUMENT (contenido narrativo)
 *   block.type === 'child_page'     → class: DOCUMENT
 *   block.type === 'child_database' → class: TABULAR
 *
 * @param {Object} notionObj - Objeto de la API de Notion.
 * @returns {Object|null} Átomo Universal o null si el objeto no es proyectable.
 * @private
 */
function _notion_notionObjectToAtom(notionObj, providerId) {
  if (!notionObj) return null;

  const objectType = notionObj.object; // 'page', 'database', 'block'
  const blockType = notionObj.type;   // 'child_page', 'child_database' (si es bloque)

  let id, name, atomClass;

  if (objectType === 'database') {
    id = notionObj.id;
    name = _notion_extractNotionTitle(notionObj.title) || 'Sin título';
    atomClass = 'TABULAR';

  } else if (objectType === 'page') {
    id = notionObj.id;
    name = _notion_extractPageTitle(notionObj) || 'Sin título';
    atomClass = 'DOCUMENT';

  } else if (objectType === 'block') {
    id = notionObj.id;
    if (blockType === 'child_database') {
      name = notionObj.child_database?.title || 'Database sin título';
      atomClass = 'TABULAR';
    } else if (blockType === 'child_page') {
      name = notionObj.child_page?.title || 'Página sin título';
      atomClass = 'DOCUMENT';
    } else {
      return null; // Bloques que no son páginas/databases no son proyectables en el silo
    }

  } else {
    return null;
  }

  const protocols = atomClass === 'TABULAR'
    ? ['TABULAR_STREAM', 'ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE']
    : ['ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE'];

  const payload = {};
  if (objectType === 'database' && notionObj.properties) {
    payload.fields = _notion_schemaToFields(notionObj.properties);
  }

  return {
    id,
    handle: {
      ns: `com.notion.${atomClass.toLowerCase()}`,
      alias: _system_slugify_(name) || 'notion_unnamed',
      label: name
    },
    class: atomClass,
    provider: providerId,
    protocols,
    system_hood: atomClass === 'TABULAR' ? 'STRUCTURE' : 'PHENOTYPE',
    payload: payload, 
    raw: {
      notion_type: objectType,
      notion_url: notionObj.url || null,
      created_at: notionObj.created_time || null,
      modified_at: notionObj.last_edited_time || null,
    },
  };
}

/**
 * Convierte una fila (page) de una Notion Database a Átomo Universal.
 * Las propiedades son aplanadas por _flattenProperties_ para que el tabular_view
 * solo vea valores simples, nunca la estructura anidada de Notion.
 *
 * @param {Object} page       - Página de Notion que representa una fila.
 * @param {string} dbId       - ID de la database contenedora.
 * @param {string} dbName     - Nombre de la database para trazabilidad.
 * @returns {Object} Átomo Universal con campos planos.
 * @private
 */
function _notion_rowToAtom(page, dbId, dbName, providerId) {
  const flatProps = _notion_flattenProperties(page.properties || {});
  const title = _notion_extractPageTitle(page) || page.id;

  return {
    ...flatProps,
    id: page.id,
    handle: {
      ns: `com.notion.row.${dbId}`,
      alias: (title || '').toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '_'),
      label: title
    },
    class: 'TABULAR',
    provider: providerId,
    protocols: ['ATOM_READ', 'ATOM_UPDATE', 'ATOM_DELETE'],
    raw: {
      db_id: dbId,
      db_name: dbName,
      notion_url: page.url || null,
      modified_at: page.last_edited_time || null,
    },
  };
}

// ─── APLANADOR DE PROPIEDADES DE NOTION ──────────────────────────────────────

/**
 * Aplana las complejas estructuras de propiedades de Notion a objetos simples.
 * { campo: { type: 'rich_text', rich_text: [{ plain_text: 'valor' }] } }
 * → { campo: 'valor' }
 *
 * Copiado y adaptado del NotionAdapter clásico (INDRA_OS/INDRA_CORE)
 * que funcionó correctamente. Solo se adapta el estilo a las restricciones del nuevo modelo.
 *
 * @param {Object} properties - Propiedades de página de Notion (sin aplanar).
 * @returns {Object} Propiedades aplanadas { nombre: valor }.
 * @private
 */
function _notion_flattenProperties(properties) {
  const flat = {};

  for (const key in properties) {
    const prop = properties[key];
    if (!prop || typeof prop !== 'object') {
      flat[key] = prop != null ? String(prop) : null;
      continue;
    }
    const type = prop.type;

    switch (type) {
      case 'title':
        flat[key] = (prop.title && prop.title[0]) ? prop.title[0].plain_text : '';
        break;
      case 'rich_text':
        flat[key] = (prop.rich_text && prop.rich_text[0]) ? prop.rich_text[0].plain_text : '';
        break;
      case 'number':
        // number puede ser null en Notion (celda vacía)
        flat[key] = (prop.number !== null && prop.number !== undefined) ? prop.number : null;
        break;
      case 'select':
        flat[key] = prop.select ? prop.select.name : null;
        break;
      case 'multi_select':
        flat[key] = prop.multi_select ? prop.multi_select.map(function (o) { return o.name; }) : [];
        break;
      case 'date':
        // CORRECCIÓN: retornar solo el string ISO de inicio, no el objeto {start, end}.
        // El frontend espera un string para el renderer 'date'.
        flat[key] = prop.date ? (prop.date.start || null) : null;
        break;
      case 'checkbox':
        flat[key] = Boolean(prop.checkbox);
        break;
      case 'url':
        flat[key] = prop.url || null;
        break;
      case 'email':
        flat[key] = prop.email || null;
        break;
      case 'phone_number':
        flat[key] = prop.phone_number || null;
        break;
      case 'status':
        flat[key] = (prop.status && prop.status.name) ? prop.status.name : null;
        break;
      case 'relation':
        // Array de objetos {id} → array de IDs string
        flat[key] = prop.relation ? prop.relation.map(function (r) { return r.id; }) : [];
        break;
      case 'people':
        // Array de objetos de usuario → array de IDs
        flat[key] = prop.people ? prop.people.map(function (p) { return p.name || p.id; }) : [];
        break;
      case 'files':
        // ADR-023: Canonicalizar archivos/imágenes como INDRA_MEDIA.
        // Las URLs de Notion son temporales (~1 hora). Se incluye expires_at para que el
        // Bridge o Workflow pueda detectarlo y refrescar si es necesario.
        flat[key] = prop.files ? prop.files.map(function (f) {
          const rawUrl = f.file ? f.file.url : (f.external ? f.external.url : null);
          if (!rawUrl) return null;

          const isImage = f.name && /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(f.name);
          const mimeGuess = isImage
            ? ('image/' + (f.name.split('.').pop().toLowerCase().replace('jpg', 'jpeg')))
            : null;

          return {
            type: 'INDRA_MEDIA',
            storage: f.file ? 'notion' : 'url',
            canonical_url: rawUrl,
            file_id: null,          // Notion no tiene File IDs directos para refrescar
            mime_type: mimeGuess,
            expires_at: f.file      // Las URLs internas de Notion expiran
              ? new Date(Date.now() + 55 * 60 * 1000).toISOString()  // ~55 min de margen
              : null,
            alt: f.name || null
          };
        }).filter(Boolean) : [];
        break;
      case 'created_time':
        flat[key] = prop.created_time || null;
        break;
      case 'last_edited_time':
        flat[key] = prop.last_edited_time || null;
        break;
      case 'created_by':
        flat[key] = prop.created_by ? (prop.created_by.name || prop.created_by.id) : null;
        break;
      case 'last_edited_by':
        flat[key] = prop.last_edited_by ? (prop.last_edited_by.name || prop.last_edited_by.id) : null;
        break;
      case 'formula': {
        // CORRECCIÓN: extraer el valor primitivo del subtipo de la formula.
        const f = prop.formula;
        if (!f) { flat[key] = null; break; }
        // f.type puede ser 'string', 'number', 'boolean', 'date'
        const fVal = f[f.type];
        if (f.type === 'date') {
          flat[key] = fVal ? (fVal.start || null) : null;
        } else {
          flat[key] = (fVal !== undefined && fVal !== null) ? fVal : null;
        }
        break;
      }
      case 'rollup': {
        // CORRECCIÓN: extraer el valor primitivo del subtipo del rollup.
        const r = prop.rollup;
        if (!r) { flat[key] = null; break; }
        if (r.type === 'number') {
          flat[key] = (r.number !== null && r.number !== undefined) ? r.number : null;
        } else if (r.type === 'date') {
          flat[key] = r.date ? (r.date.start || null) : null;
        } else if (r.type === 'array') {
          // Rollup array: tomar el primer valor plano si existe
          flat[key] = r.array ? r.array.length : 0;
        } else {
          flat[key] = null;
        }
        break;
      }
      case 'unique_id':
        // ID único de Notion (número autoincremental con prefijo opcional)
        flat[key] = prop.unique_id
          ? (prop.unique_id.prefix ? prop.unique_id.prefix + '-' + prop.unique_id.number : prop.unique_id.number)
          : null;
        break;
      case 'verification':
        // Tipo de verificación de Notion (estado de verificación)
        flat[key] = prop.verification ? (prop.verification.state || null) : null;
        break;
      case 'button':
        // Tipo UI-only de Notion — no tiene valor de dato, es solo un botón de acción.
        // Se omite silenciosamente (sin logWarn — no es un bug, es una propiedad válida sin dato).
        flat[key] = null;
        break;
      default:
        // SEGURIDAD: cualquier tipo desconocido → null explícito.
        // NUNCA retornamos el objeto prop crudo — eso rompe React.
        logWarn('[provider_notion] flattenProperties: tipo no reconocido "' + type + '" en clave "' + key + '". Usando null.');
        flat[key] = null;
    }
  }

  return flat;
}

/**
 * Convierte el schema de propiedades de Notion al formato de campos canónico (ADR-008).
 * Este formato viaja en metadata.schema.fields y es consumido por el Bridge.
 *
 * @param {Object} notionSchema - Objeto properties de una Notion Database.
 * @returns {Array<{ id, label, type }>} Array de campos canónicos.
 * @private
 */
function _notion_schemaToFields(notionSchema) {
  if (!notionSchema) return [];

  return Object.entries(notionSchema).map(function (entry) {
    const key = entry[0];
    const prop = entry[1];
    const t = prop.type;

    // Mapa de tipos Notion → tipos canónicos del sistema (DATA_CONTRACTS §5.x)
    let canonicalType = 'STRING';
    if (t === 'number') canonicalType = 'NUMBER';
    else if (t === 'date' || t === 'created_time' || t === 'last_edited_time') canonicalType = 'DATE';
    else if (t === 'checkbox') canonicalType = 'BOOLEAN';
    else if (t === 'select' || t === 'status') canonicalType = 'SELECT';
    else if (t === 'multi_select') canonicalType = 'MULTI_SELECT';
    else if (t === 'email') canonicalType = 'EMAIL';
    else if (t === 'url') canonicalType = 'URL';
    else if (t === 'files') canonicalType = 'FILE';
    else if (t === 'relation') canonicalType = 'RELATION';
    else if (t === 'formula' || t === 'rollup') canonicalType = 'COMPUTED';
    else if (t === 'people') canonicalType = 'PEOPLE';

    return {
      id: key,
      handle: {
        ns: 'com.notion.schema.field',
        alias: _system_slugify_(key) || 'notion_field',
        label: key
      },
      type: canonicalType,
      // Inducción de Lógica: extraemos la expresión original para el LogicEngine
      formula_expression: t === 'formula' ? (prop.formula?.expression || null) : null,
      options: (prop.select && prop.select.options ? prop.select.options.map(function (o) { return o.name; }) :
        (prop.multi_select && prop.multi_select.options ? prop.multi_select.options.map(function (o) { return o.name; }) : [])),
    };
  });
}

// ─── RESOLUCIÓN DE RELACIONES ─────────────────────────────────────────────────

/**
 * Resuelve los IDs de páginas en columnas de tipo RELATION a nombres legibles.
 * Hace batch-fetch de páginas únicas con un mapa de caché local.
 * Principio Glandular: la inteligencia de enriquecimiento vive en el backend.
 *
 * @param {Array}  items          - Átomos de fila ya aplanados.
 * @param {Array}  relationCols   - Columnas de tipo RELATION del schema.
 * @param {string} apiKey        - API Key de Notion.
 * @param {number} limit         - Máximo de IDs únicos a resolver (rate limit).
 * @returns {Array} Items con IDs de relación reemplazados por nombres.
 * @private
 */
function _notion_resolveRelationNames(items, relationCols, apiKey, limit) {
  if (!relationCols || relationCols.length === 0 || !items || items.length === 0) {
    return items;
  }

  // 1. Recopilar todos los IDs de relación únicos en todos los ítems
  const allRelationIds = {};
  items.forEach(function (item) {
    relationCols.forEach(function (col) {
      const cellValue = item[col.id];
      if (Array.isArray(cellValue)) {
        cellValue.forEach(function (id) {
          if (typeof id === 'string' && id) allRelationIds[id] = true;
        });
      }
    });
  });

  const uniqueIds = Object.keys(allRelationIds);
  if (uniqueIds.length === 0) return items;

  // 2. Limitar para no superar el máximo de UrlFetchApp.fetchAll()
  const idsToResolve = uniqueIds.slice(0, limit);
  if (uniqueIds.length > limit) {
    logWarn('[provider_notion] resolveRelationNames: ' + uniqueIds.length +
      ' IDs de relación. Resolviendo en paralelo los primeros ' + limit + '.');
  }

  // ── BATCH PARALELO CON UrlFetchApp.fetchAll() ──────────────────────────────
  // GAS V8: fetchAll lanza todos los requests simultáneamente.
  // Resultado: ~tiempo del request más lento en lugar de suma de todos.
  // Con 20 relaciones: ~1s paralelo vs ~20s en serie.
  const headers = {
    'Authorization': 'Bearer ' + apiKey,
    'Notion-Version': NOTION_API_VER_,
    'Content-Type': 'application/json',
  };

  const fetchRequests = idsToResolve.map(function (pageId) {
    return {
      url: NOTION_BASE_URL_ + '/pages/' + pageId,
      method: 'GET',
      headers: headers,
      muteHttpExceptions: true,
    };
  });

  logInfo('[provider_notion] resolveRelationNames: lanzando ' + fetchRequests.length + ' requests en paralelo via fetchAll().');

  let responses;
  try {
    responses = UrlFetchApp.fetchAll(fetchRequests);
  } catch (networkError) {
    // Si fetchAll falla en bloque (error de red general), devolver sin enriquecer
    logError('[provider_notion] resolveRelationNames: fetchAll falló — ' + networkError.message);
    return items;
  }

  // 3. Construir caché de nombres desde las respuestas paralelas
  const nameCache = {};
  responses.forEach(function (response, i) {
    const pageId = idsToResolve[i];
    try {
      const statusCode = response.getResponseCode();
      if (statusCode >= 200 && statusCode < 300) {
        const page = JSON.parse(response.getContentText());
        nameCache[pageId] = _notion_extractPageTitle(page) || pageId;
      } else {
        // API devolvió error para este ID específico → usar ID como fallback
        nameCache[pageId] = pageId;
        logWarn('[provider_notion] resolveRelationNames: HTTP ' + statusCode + ' para ID "' + pageId + '".');
      }
    } catch (parseError) {
      nameCache[pageId] = pageId; // fallback seguro
      logWarn('[provider_notion] resolveRelationNames: parse error para ID "' + pageId + '".');
    }
  });

  // 4. Reemplazar IDs por nombres en cada ítem
  return items.map(function (item) {
    const enriched = Object.assign({}, item);
    relationCols.forEach(function (col) {
      const cellValue = enriched[col.id];
      if (Array.isArray(cellValue)) {
        enriched[col.id] = cellValue.map(function (id) {
          return nameCache[id] || id; // Si no se resolvió, mantener el ID
        });
      }
    });
    return enriched;
  });
}

// ─── TRADUCCIÓN DE SORTS UQO → NOTION ────────────────────────────────────────

/**
 * Traduce el array de sorts del formato canónico UQO al formato nativo de Notion.
 * DATA_CONTRACTS §3.1: direction = "ASC" | "DESC"
 * Notion API:          direction = "ascending" | "descending"
 *
 * @param {Array<{field: string, direction: string}>} sorts - Sorts UQO canónicos.
 * @returns {Array<{property: string, direction: string}>} Sorts en formato Notion.
 * @private
 */
function _notion_translateSorts(sorts) {
  if (!Array.isArray(sorts)) return [];
  return sorts.map(function (s) {
    return {
      property: s.field,
      direction: (s.direction === 'ASC') ? 'ascending' : 'descending',
    };
  });
}

// ─── EXTRACCIÓN DE TÍTULOS ────────────────────────────────────────────────────

/**
 * Extrae el título legible de una página de Notion.
 * Las páginas pueden tener el título en diferentes propiedades según
 * si son páginas simples o filas de base de datos.
 *
 * @param {Object} page - Objeto página de Notion.
 * @returns {string} Título extraído o cadena vacía.
 * @private
 */
function _notion_extractPageTitle(page) {
  if (!page || !page.properties) return '';
  // Buscar la propiedad de tipo 'title' (siempre hay exactamente una en Notion)
  for (const key in page.properties) {
    const prop = page.properties[key];
    if (prop.type === 'title' && prop.title && prop.title.length > 0) {
      return prop.title[0].plain_text || '';
    }
  }
  return '';
}

/**
 * Extrae el título de un array de rich_text (usado en databases).
 * @param {Array} titleArray - Array de objetos rich_text de Notion.
 * @returns {string}
 * @private
 */
function _notion_extractNotionTitle(titleArray) {
  if (!titleArray || !titleArray.length) return '';
  return titleArray.map(function (t) { return t.plain_text || ''; }).join('');
}

// ─── CLIENTE HTTP PARA LA API DE NOTION ──────────────────────────────────────

/**
 * Cliente HTTP unificado para toda comunicación con la API de Notion.
 * Centraliza: autenticación, serialización, manejo de errores HTTP,
 * y logging de cada request para diagnóstico en GAS.
 *
 * @param {string} endpoint - Ruta relativa. Ej: '/search', '/databases/abc123/query'.
 * @param {{ method: string, payload?: Object, apiKey: string }} options
 * @returns {Object} Respuesta JSON parseada de la API de Notion.
 * @throws Lanza error estructurado si la API retorna error HTTP o red.
 * @private
 */
function _notion_notionRequest(endpoint, options) {
  const url = NOTION_BASE_URL_ + endpoint;
  const method = (options.method || 'GET').toUpperCase();

  logInfo(`[provider_notion] HTTP ${method} ${endpoint}`);

  const fetchOptions = {
    method: method,
    muteHttpExceptions: true,
    headers: {
      'Authorization': 'Bearer ' + options.apiKey,
      'Notion-Version': NOTION_API_VER_,
      'Content-Type': 'application/json',
    },
  };

  if (options.payload) {
    fetchOptions.payload = JSON.stringify(options.payload);
  }

  let response;
  try {
    response = UrlFetchApp.fetch(url, fetchOptions);
  } catch (networkError) {
    throw createError('NETWORK_ERROR',
      `[provider_notion] Error de red al llamar a Notion: ${networkError.message}`,
      { endpoint }
    );
  }

  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    let errorMessage = `Notion API error HTTP ${statusCode}`;
    let errorCode = 'NOTION_API_ERROR';
    try {
      const errorBody = JSON.parse(responseText);
      errorMessage = errorBody.message || errorMessage;
      errorCode = errorBody.code || errorCode;
    } catch (e) { /* body no es JSON — usar mensaje genérico */ }

    logError(`[provider_notion] Error ${statusCode} en ${endpoint}: ${errorMessage}`);
    throw createError(errorCode, errorMessage, { statusCode, endpoint });
  }

  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    throw createError('PARSE_ERROR',
      `[provider_notion] Respuesta no JSON de Notion en ${endpoint}.`,
      { endpoint, raw: responseText.substring(0, 200) }
    );
  }
}

// ─── GESTIÓN DE CREDENCIALES ──────────────────────────────────────────────────

/**
 * Lee la Notion API Key desde PropertiesService via system_config.gs.
 * La clave se almacena como 'ACCOUNT_notion_{accountId}_KEY' in PropertiesService.
 *
 * @param {string} accountId - El ID de la cuenta.
 * @returns {string|null} La API Key o null si no está configurada.
 * @private
 */
function _notion_getNotionApiKey(accountId) {
  return readProviderApiKey('notion', accountId || 'default'); // → system_config.gs
}

/**
 * SCHEMA_MUTATE: Sincroniza cambios estructurales (columnas) con la base de datos de Notion.
 * AXIOMA DE RESONANCIA: El provider traduce la libertad de INDRA a la restricción del silo.
 *
 * @param {Object} uqo - Universal Query Object.
 * @param {string} apiKey - Integración Token de Notion.
 * @private
 */
function _notion_handleSchemaMutate(uqo, apiKey) {
  const dbId = uqo.context_id;
  const payload = uqo.data?.payload;
  const fields = payload?.fields;

  if (!dbId || !fields) {
    throw createError('INVALID_INPUT', 'SCHEMA_MUTATE requiere context_id (dbId) y payload.fields.');
  }

  try {
    // 1. Obtener estado actual para detectar qué es nuevo o qué ha cambiado
    const currentDb = _notion_notionRequest(`/databases/${dbId}`, { method: 'GET', apiKey });
    const currentProps = currentDb.properties || {};

    // 2. Traducir INDRA fields a Notion Properties
    const notionProperties = {};

    fields.forEach(field => {
       // El label de INDRA es el nombre de la columna en Notion
       const propertyName = field.label; 
       
       // Si la propiedad no existe en Notion, la preparamos para creación
       if (!currentProps[propertyName]) {
         notionProperties[propertyName] = _notion_translateTypeToNotion(field.type);
       }
       // En esta fase, no renombramos ni borramos para evitar pérdida de datos accidental.
    });

    if (Object.keys(notionProperties).length === 0) {
      return { 
        items: [], 
        metadata: { 
          status: 'OK', 
          message: 'No se detectaron nuevas columnas para resonar en Notion.' 
        } 
      };
    }

    // 3. Ejecutar Mutación en Notion
    const updated = _notion_notionRequest(`/databases/${dbId}`, {
      method: 'PATCH',
      payload: { properties: notionProperties },
      apiKey
    });

    logInfo(`[provider_notion] SCHEMA_MUTATE exitoso en ${dbId}. Creadas: ${Object.keys(notionProperties).join(', ')}`);

    const atom = _notion_notionObjectToAtom(updated, uqo.provider);
    return { 
      items: atom ? [atom] : [], 
      metadata: { 
        status: 'OK', 
        mutated_properties: Object.keys(notionProperties) 
      } 
    };

  } catch (err) {
    logError(`[provider_notion] Fallo en SCHEMA_MUTATE para ${dbId}: ${err.message}`);
    const msg = err.message || 'Error desconocido en mutación';
    return { items: [], metadata: { status: 'ERROR', error: msg } };
  }
}

/**
 * Traduce tipos canónicos de INDRA a especificaciones de propiedad de Notion API.
 * @param {string} indraType
 * @returns {Object} Configuración del tipo para Notion
 * @private
 */
function _notion_translateTypeToNotion(indraType) {
  switch (indraType) {
    case 'NUMBER': return { number: { format: 'number' } };
    case 'BOOLEAN': return { checkbox: {} };
    case 'DATE': return { date: {} };
    case 'ENUM': return { select: {} };
    case 'ARRAY': return { multi_select: {} };
    case 'TEXT':
    default:
      return { rich_text: {} };
  }
}
