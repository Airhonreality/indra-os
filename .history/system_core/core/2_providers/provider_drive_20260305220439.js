// =============================================================================
// ARTEFACTO: 2_providers/provider_drive.gs
// CAPA: 2 — Providers
// RESPONSABILIDAD: Traductor del sistema de archivos de Google Drive al protocolo
//         universal del Core. Opera con las credenciales del propietario del
//         script (executeAs: USER_DEPLOYING) — no requiere API Key externa.
//         Es el único artefacto del sistema que invoca DriveApp para exploración.
//
// PROTOCOLO DE REGISTRO (auto-descubrimiento):
//   PROVIDER_CONF_DRIVE es detectado por _scanProviders_() en provider_registry.gs.
//
// AXIOMS:
//   - Classification logic resides here. Frontend receives standardized atoms.
//   - `class` determines the projected view (DATA_CONTRACTS §2.3).
//   - Google Sheets → class: TABULAR. Todo lo demás → class: DOCUMENT | FOLDER.
//   - `raw` contiene el dato crudo de Drive para depuración. Solo para eso.
//   - La paginación es real: `has_more` y `next_cursor` viajan en metadata.
//
// RESTRICCIONES:
//   - NO puede hardcodear nombres de archivos ni IDs de carpetas del usuario.
//   - NO puede leer ni escribir PropertiesService.
//   - NO puede invocar UrlFetchApp (Drive es nativo, no una REST API externa).
//   - NO puede inferir `class` por regex o heurísticas de nombre de archivo.
//     La clasificación es por mimeType — determinista y sin adivinar.
// =============================================================================

/**
 * Configuración de auto-descubrimiento del provider drive.
 * Los campos `implements` mapean protocolo → nombre de función global.
 * @const {Object}
 */
/**
 * Manifestación del Silo Drive. Sigue el Protocolo ADR-002.
 * Esta función es detectada automáticamente por el ProviderRegistry.
 * @returns {Object} Contrato de configuración.
 */
function CONF_DRIVE() {
  return Object.freeze({
    id:        'drive',
    handle: {
      ns: 'com.indra.system.silo',
      alias: 'drive',
      label: 'Google Drive'
    },
    class:     'FOLDER',         // class del átomo-silo en el manifest
    version:   '1.0',
    protocols: ['HIERARCHY_TREE', 'ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE', 'SEARCH_DEEP'],
    implements: {
      HIERARCHY_TREE: 'handleDrive',
      ATOM_READ:      'handleDrive',
      ATOM_CREATE:    'handleDrive',
      ATOM_UPDATE:    'handleDrive',
      ATOM_DELETE:    'handleDrive',
      SEARCH_DEEP:    'handleDrive',
    },
    config_schema: [],
    capabilities: {
      ATOM_CREATE:  { sync: 'BLOCKING', purge: 'ALL' },
      ATOM_UPDATE:  { sync: 'BLOCKING', purge: 'ID' },
      ATOM_DELETE:  { sync: 'BLOCKING', purge: 'ALL' },
      HIERARCHY_TREE: { sync: 'BLOCKING', purge: 'NONE' }
    }
  });
}

// ─── MAPA DE MIME TYPES → CLASS CANÓNICO ─────────────────────────────────────

/**
 * Mapa determinista: mimeType de Google Drive → class canónico del átomo universal.
 * Decisión: El backend clasifica. El front no pregunta qué es el ítem, solo qué vista usar.
 * Cualquier mimeType ausente en el mapa → class: DOCUMENT (safe default).
 * @const {Object}
 */
const MIME_TO_CLASS_ = Object.freeze({
  'application/vnd.google-apps.folder':       'FOLDER',
  'application/vnd.google-apps.spreadsheet':  'TABULAR',
  'application/vnd.google-apps.document':     'DOCUMENT',
  'application/vnd.google-apps.presentation': 'DOCUMENT',
  'application/vnd.google-apps.form':         'DOCUMENT',
  'application/vnd.google-apps.drawing':      'DOCUMENT',
  'application/pdf':                          'DOCUMENT',
  'image/jpeg':                               'DOCUMENT',
  'image/png':                                'DOCUMENT',
  'text/plain':                               'DOCUMENT',
  'application/json':                         'DOCUMENT',
});

/**
 * Mapa determinista: mimeType → protocolos que soporta ese ítem específico.
 * Decisión: Los protocolos del átomo reflejan lo que ESE ítem puede hacer,
 * no lo que el provider soporta globalmente (DATA_CONTRACTS §2.3).
 * @const {Object}
 */
const MIME_TO_PROTOCOLS_ = Object.freeze({
  'application/vnd.google-apps.folder':      ['HIERARCHY_TREE', 'ATOM_CREATE'],
  'application/vnd.google-apps.spreadsheet': ['TABULAR_STREAM', 'ATOM_READ'],
  'application/vnd.google-apps.document':    ['ATOM_READ'],
});

/** Máximo de ítems por página para evitar timeouts en GAS (límite: 6 min). */
const DRIVE_PAGE_SIZE_ = 50;

// ─── MANEJADOR PRINCIPAL ──────────────────────────────────────────────────────

/**
 * Punto de entrada del provider drive. Invocado por protocol_router.gs.
 * Despacha el UQO al sub-handler correcto según el protocolo.
 *
 * @param {Object} uqo - Universal Query Object validado por protocol_router.
 * @returns {{ items: Array, metadata: Object }}
 */
function handleDrive(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();

  const providerStr = uqo.provider || 'drive'; 
  const baseId = providerStr.split(':')[0];
  if (baseId !== 'drive') {
    const err = createError('SYSTEM_FAILURE', `El handler de Drive recibió un provider inesperado: ${uqo.provider}`);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
  }

  logInfo(`[provider_drive] Dispatching: ${protocol}`, { context_id: uqo.context_id });

  if (protocol === 'HIERARCHY_TREE') return _drive_handleHierarchyTree(uqo);
  if (protocol === 'ATOM_READ')      return _drive_handleAtomRead(uqo);
  if (protocol === 'ATOM_CREATE')    return _drive_handleAtomCreate(uqo);
  if (protocol === 'ATOM_UPDATE')    return _drive_handleAtomUpdate(uqo);
  if (protocol === 'ATOM_DELETE')    return _drive_handleAtomDelete(uqo);
  if (protocol === 'SEARCH_DEEP')    return _drive_handleSearchDeep(uqo);

  const err = createError('PROTOCOL_NOT_FOUND',
    `El Silo "Drive" no soporta el protocolo: "${protocol}".`
  );
  return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
}

// ─── HANDLERS POR PROTOCOLO ───────────────────────────────────────────────────

/**
 * HIERARCHY_TREE: Lista los contenidos de una carpeta de Drive.
 * context_id = "ROOT"   → carpeta raíz del usuario.
 * context_id = folderId → subcarpeta específica.
 *
 * @private
 */
function _drive_handleHierarchyTree(uqo) {
  try {
    const contextId = uqo.context_id || 'ROOT';
    const folder    = _drive_resolveFolder(contextId);

    if (!folder) {
      const err = createError('NOT_FOUND', `Carpeta "${contextId}" no encontrada.`);
      return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }

    const items   = [];
    const cursor  = uqo.query && uqo.query.cursor ? uqo.query.cursor : null;
    const providerId = uqo.provider;

    // ── Listar subcarpetas primero (convención de explorador de archivos)
    const foldersIter = folder.getFolders();
    if (cursor) {
      // Si hay cursor, usar continuación de paginación
      try { foldersIter.setPageToken(cursor); } catch (e) { /* GAS no siempre soporta esto */ }
    }

    let count = 0;
    while (foldersIter.hasNext() && count < DRIVE_PAGE_SIZE_) {
      const subFolder = foldersIter.next();
      items.push(_drive_folderToAtom(subFolder, providerId));
      count++;
    }

    // ── Listar archivos
    const filesIter = folder.getFiles();
    while (filesIter.hasNext() && count < DRIVE_PAGE_SIZE_) {
      const file = filesIter.next();
      const atom = _drive_fileToAtom(file, providerId);
      if (atom) {
        items.push(atom);
        count++;
      }
    }

    const hasMore    = foldersIter.hasNext() || filesIter.hasNext();
    const nextCursor = hasMore ? _drive_extractCursor(foldersIter, filesIter) : null;

    // ── Calculate Hood Categorization
    const hoodCounts = {
      ROUTES:    items.filter(i => i.system_hood === 'ROUTES').length,
      STRUCTURE: items.filter(i => i.system_hood === 'STRUCTURE').length,
      PHENOTYPE: items.filter(i => i.system_hood === 'PHENOTYPE').length
    };

    return {
      items,
      metadata: {
        status:      'OK',
        has_more:    hasMore,
        next_cursor: nextCursor,
        sync_status: hasMore ? 'RESONATING' : 'COMPLETE',
        hood_counts: hoodCounts,
        context:     { folder_id: contextId, folder_name: folder.getName() },
      },
    };

  } catch (err) {
    logError('[provider_drive] Error en hierarchy_tree.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_READ: Lee metadatos de un archivo específico de Drive.
 * context_id = fileId de Drive.
 *
 * @private
 */
function _drive_handleAtomRead(uqo) {
  if (!uqo.context_id) {
    const err = createError('INVALID_INPUT', 'ATOM_READ requiere context_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    // Intentar como archivo primero, luego como carpeta
    let atom = null;
    try {
      const file = DriveApp.getFileById(uqo.context_id);
      atom = _drive_fileToAtom(file, uqo.provider);
    } catch (e) {
      // No es un archivo — intentar como carpeta
      try {
        const folder = DriveApp.getFolderById(uqo.context_id);
        atom = _drive_folderToAtom(folder, uqo.provider);
      } catch (e2) {
        const err = createError('NOT_FOUND', `Elemento "${uqo.context_id}" no encontrado.`);
        return { items: [], metadata: { status: 'ERROR', error: err.message } };
      }
    }

    return { items: atom ? [atom] : [], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_drive] Error en atom_read.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_CREATE: Crea una carpeta en Drive.
 * data.name     → nombre de la carpeta (requerido).
 * context_id    → ID de la carpeta padre (opcional, default: ROOT).
 *
 * @private
 */
function _drive_handleAtomCreate(uqo) {
  const data = uqo.data || {};
  const label = data.handle?.label || data.name || '';
  if (!label || typeof label !== 'string' || label.trim() === '') {
    const err = createError('INVALID_INPUT', 'ATOM_CREATE requiere data.handle.label o data.name.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    const parentFolder = _drive_resolveFolder(uqo.context_id || 'ROOT');
    if (!parentFolder) {
      const err = createError('NOT_FOUND', `Carpeta padre "${uqo.context_id}" no encontrada.`);
      return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }

    const newFolder = parentFolder.createFolder(label.trim());
    const atom      = _drive_folderToAtom(newFolder, uqo.provider);

    logInfo(`[provider_drive] Carpeta creada: "${label}" en "${parentFolder.getName()}"`);
    return { items: [atom], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_drive] Error en atom_create.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_UPDATE: Actualiza metadatos de un archivo o carpeta en Drive.
 * context_id → ID del elemento (file o folder).
 * data.name  → Nuevo nombre (opcional).
 * data.description → Nueva descripción (opcional).
 *
 * @private
 */
function _drive_handleAtomUpdate(uqo) {
  if (!uqo.context_id) {
    const err = createError('INVALID_INPUT', 'ATOM_UPDATE requiere context_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  const data = uqo.data || {};
  
  try {
    let element = null;
    try {
      element = DriveApp.getFileById(uqo.context_id);
    } catch (e) {
      element = DriveApp.getFolderById(uqo.context_id);
    }

    const label = data.handle?.label || data.name;
    if (label) {
      logInfo(`[provider_drive] Renombrando ${uqo.context_id} a "${label}"`);
      element.setName(label);
    }
    
    if (data.description !== undefined) {
      element.setDescription(data.description);
    }

    // Retornar el átomo actualizado
    const updatedAtom = (element.getMimeType && element.getMimeType() === 'application/vnd.google-apps.folder')
      ? _drive_folderToAtom(element, uqo.provider)
      : _drive_fileToAtom(element, uqo.provider);

    return { items: [updatedAtom], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_drive] Error en ATOM_UPDATE.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_DELETE: Mueve un archivo/carpeta a la papelera.
 * context_id → fileId o folderId de Drive.
 *
 * @private
 */
function _drive_handleAtomDelete(uqo) {
  if (!uqo.context_id) {
    const err = createError('INVALID_INPUT', 'ATOM_DELETE requiere context_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    try {
      DriveApp.getFileById(uqo.context_id).setTrashed(true);
    } catch (e) {
      DriveApp.getFolderById(uqo.context_id).setTrashed(true);
    }
    logInfo(`[provider_drive] Elemento movido a papelera: ${uqo.context_id}`);
    return { items: [], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_drive] Error en ATOM_DELETE.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * SEARCH_DEEP: Búsqueda global en todo el Drive del usuario.
 * Usa DriveApp.searchFiles con el término de búsqueda.
 *
 * @private
 */
function _drive_handleSearchDeep(uqo) {
  try {
    const searchTerm = uqo.query && uqo.query.search_term;
    const providerId = uqo.provider;

    if (!searchTerm) {
      return { items: [], metadata: { status: 'ERROR', error: 'SEARCH_DEEP requiere uqo.query.search_term.' } };
    }

    // Google Drive search query syntax: title contains 'term'
    const driveQuery = `title contains '${searchTerm.replace(/'/g, "\\'")}' and trashed = false`;
    const filesIter  = DriveApp.searchFiles(driveQuery);
    
    const items = [];
    let count = 0;
    while (filesIter.hasNext() && count < 50) {
      const file = filesIter.next();
      const atom = _drive_fileToAtom(file, providerId);
      if (atom) {
        items.push(atom);
        count++;
      }
    }

    return {
      items,
      metadata: {
        status:      'OK',
        has_more:    filesIter.hasNext(),
        sync_status: filesIter.hasNext() ? 'RESONATING' : 'COMPLETE',
        total_objects: items.length // DriveApp no da total count fácilmente sin iterar todo
      },
    };

  } catch (err) {
    logError('[provider_drive] Error en SEARCH_DEEP.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

// ─── CONVERSIÓN A ÁTOMO UNIVERSAL ────────────────────────────────────────────

/**
 * Convierte una carpeta de Drive a Átomo Universal canónico.
 * Las carpetas siempre tienen class: FOLDER y permiten drill-down.
 *
 * @param {DriveApp.Folder} folder
 * @returns {Object} Átomo Universal.
 * @private
 */
function _drive_folderToAtom(folder, providerId) {
  const name = folder.getName();
  return {
    id:           folder.getId(),
    handle: {
      ns: 'com.drive.folder',
      alias: _system_slugify_(name) || 'folder_unnamed',
      label: name
    },
    class:        'FOLDER',
    provider:     providerId,
    protocols:    ['HIERARCHY_TREE', 'ATOM_CREATE'],
    system_hood:  'ROUTES',
    modified_at:  folder.getLastUpdated().toISOString(),
    description:  folder.getDescription() || '',
    mime_type:    'application/vnd.google-apps.folder',
    raw: {
      folder_id:    folder.getId(),
    },
  };
}

/**
 * Convierte un archivo de Drive a Átomo Universal canónico.
 * La clasificación por class es determinista: viene del MIME_TO_CLASS_ map.
 *
 * Decisión: Los archivos de Google Apps Script (.gs) y otros tipos de sistema
 * son excluidos silenciosamente (retornan null). El iterator los filtra.
 *
 * @param {DriveApp.File} file
 * @returns {Object|null} Átomo Universal o null si el archivo debe ignorarse.
 * @private
 */
function _drive_fileToAtom(file, providerId) {
  const mimeType = file.getMimeType();

  // Excluir archivos de sistema que no son útiles para el usuario
  const EXCLUDED_MIMES = [
    'application/vnd.google-apps.script',     // Apps Script
    'application/vnd.google-apps.site',       // Sites
    'application/vnd.google-apps.fusiontable',// Fusion Tables (deprecado)
    'application/vnd.google-apps.map',        // Maps
  ];
  if (EXCLUDED_MIMES.includes(mimeType)) return null;

  // class determinista. Si el mimeType no está en el mapa → DOCUMENT (safe default).
  const atomClass      = MIME_TO_CLASS_[mimeType] || 'DOCUMENT';
  const atomProtos     = MIME_TO_PROTOCOLS_[mimeType] || ['ATOM_READ'];
  const name           = file.getName();

  return {
    id:           file.getId(),
    handle: {
      ns: `com.drive.${atomClass.toLowerCase()}`,
      alias: _system_slugify_(name) || 'file_unnamed',
      label: name
    },
    class:        atomClass,
    provider:     providerId,
    protocols:    atomProtos,
    system_hood:  mimeType === 'application/vnd.google-apps.spreadsheet' ? 'STRUCTURE' : 'PHENOTYPE',
    modified_at:  file.getLastUpdated().toISOString(),
    size:         mimeType.startsWith('application/vnd.google-apps') ? 0 : file.getSize(),
    mime_type:    mimeType,
    description:  file.getDescription() || '',
    raw: {
      url:          file.getUrl(),
    },
  };
}

// ─── UTILIDADES INTERNAS ──────────────────────────────────────────────────────

/**
 * Resuelve un contextId a una carpeta de Drive.
 * "ROOT" → carpeta raíz del usuario.
 * Cualquier otro string → intenta como folderId.
 *
 * @param {string} contextId
 * @returns {DriveApp.Folder|null}
 * @private
 */
function _drive_resolveFolder(contextId) {
  try {
    if (!contextId || contextId === 'ROOT') {
      return DriveApp.getRootFolder();
    }
    return DriveApp.getFolderById(contextId);
  } catch (err) {
    logWarn(`[provider_drive] Carpeta no encontrada: ${contextId}. Error: ${err.message}`);
    return null;
  }
}

/**
 * Intenta extraer un cursor de paginación de los iteradores de Drive.
 * GAS no expone el cursor directamente — este es un placeholder para
 * cuando GAS mejore su API de paginación.
 *
 * @param {FolderIterator} foldersIter
 * @param {FileIterator}   filesIter
 * @returns {null} Siempre null en GAS (paginación manual no soportada nativamente)
 * @private
 */
function _drive_extractCursor(foldersIter, filesIter) {
  // GAS no soporta cursores nombrados en DriveApp.
  // La paginación en HIERARCHY_TREE está limitada a DRIVE_PAGE_SIZE_ por request.
  // Implementar paginación manual requeriría almacenar offset en UQO.query.
  return null;
}
