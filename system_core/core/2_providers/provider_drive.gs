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
    id: 'drive',
    handle: {
      ns: 'com.indra.system.silo',
      alias: 'drive',
      label: 'Google Drive',
      icon: 'FOLDER'
    },
    class: 'FOLDER',
    version: '1.2 (Sovereign Synthesis)',
    capabilities: {
      ATOM_READ: { sync: 'BLOCKING', purge: 'NONE' },
      ATOM_CREATE: { sync: 'BLOCKING', purge: 'ALL' },
      ATOM_UPDATE: { sync: 'BLOCKING', purge: 'ID' },
      ATOM_DELETE: { sync: 'BLOCKING', purge: 'ALL' },
      BATCH_UPDATE: { sync: 'BLOCKING', purge: 'ALL' },
      HIERARCHY_TREE: { sync: 'BLOCKING', purge: 'NONE' },
      SEARCH_DEEP: { sync: 'BLOCKING', purge: 'NONE' },
      TABULAR_STREAM: { sync: 'BLOCKING', purge: 'NONE' },
      MEDIA_RESOLVE: { sync: 'BLOCKING', purge: 'NONE' },
      TRANSFER_HANDSHAKE: { sync: 'BLOCKING', purge: 'NONE' }
    },
    protocol_meta: {
      TRANSFER_HANDSHAKE: {
        desc: "Inicia una sesión de transferencia resumible para archivos grandes.",
        inputs: { 
          filename: { type: 'string', required: true },
          mimeType: { type: 'string', required: true },
          parent_id: { type: 'string', required: false }
        }
      },
      ATOM_CREATE: {
        desc: "Crea una nueva FOLDER o un DOCUMENT (vía handshake si es pesado).",
        inputs: {
          name: { type: 'string', required: true },
          class: { type: 'string', required: true },
          context_id: { type: 'string', required: false },
          intent: { type: 'string', required: false, desc: 'TRANSFER | DIRECT' }
        }
      }
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
  'application/vnd.google-apps.folder': 'FOLDER',
  'application/vnd.google-apps.spreadsheet': 'TABULAR',
  'application/vnd.google-apps.document': 'DOCUMENT',
  'application/vnd.google-apps.presentation': 'DOCUMENT',
  'application/vnd.google-apps.form': 'DOCUMENT',
  'application/vnd.google-apps.drawing': 'DOCUMENT',
  'application/pdf': 'DOCUMENT',
  'image/jpeg': 'DOCUMENT',
  'image/png': 'DOCUMENT',
  'text/plain': 'DOCUMENT',
  'application/json': 'DOCUMENT',
});

/**
 * Mapa determinista: mimeType → protocolos que soporta ese ítem específico.
 * Decisión: Los protocolos del átomo reflejan lo que ESE ítem puede hacer,
 * no lo que el provider soporta globalmente (DATA_CONTRACTS §2.3).
 * @const {Object}
 */
const MIME_TO_PROTOCOLS_ = Object.freeze({
  'application/vnd.google-apps.folder': ['HIERARCHY_TREE', 'ATOM_CREATE'],
  'application/vnd.google-apps.spreadsheet': ['TABULAR_STREAM', 'ATOM_READ', 'ATOM_CREATE'],
  'application/vnd.google-apps.document': ['ATOM_READ'],
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
  if (protocol === 'BATCH_UPDATE')   return _drive_handleBatchUpdate(uqo);
  if (protocol === 'SEARCH_DEEP')    return _drive_handleSearchDeep(uqo);
  if (protocol === 'TRANSFER_HANDSHAKE') return _drive_handleTransferHandshake(uqo);
  if (protocol === 'MEDIA_RESOLVE')   return _drive_handleMediaResolve(uqo);

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
    const folder = _drive_resolveFolder(contextId);

    if (!folder) {
      const err = createError('NOT_FOUND', `Carpeta "${contextId}" no encontrada.`);
      return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }

    const items = [];
    const cursor = uqo.query && uqo.query.cursor ? uqo.query.cursor : null;
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
      const atom = _drive_fileToAtom(file, providerId, false);
      if (atom) {
        items.push(atom);
        count++;
      }
    }

    const hasMore = foldersIter.hasNext() || filesIter.hasNext();
    const nextCursor = hasMore ? _drive_extractCursor(foldersIter, filesIter) : null;

    // ── Calculate Hood Categorization
    const hoodCounts = {
      ROUTES: items.filter(i => i.system_hood === 'ROUTES').length,
      STRUCTURE: items.filter(i => i.system_hood === 'STRUCTURE').length,
      PHENOTYPE: items.filter(i => i.system_hood === 'PHENOTYPE').length
    };

    return {
      items,
      metadata: {
        status: 'OK',
        has_more: hasMore,
        next_cursor: nextCursor,
        sync_status: hasMore ? 'RESONATING' : 'COMPLETE',
        hood_counts: hoodCounts,
        context: { folder_id: contextId, folder_name: folder.getName() },
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
  const contextId = uqo.context_id;
  const query = uqo.query || {};

  // AXIOMA DE RESOLUCIÓN SOBERANA: Si no tenemos ID, intentamos resolver por nombre y padre (Navegación Relativa)
  if (!contextId) {
    if (query.name && query.parentId) {
      logInfo(`[provider_drive] Resolviendo átomo por nombre: "${query.name}" en padre: ${query.parentId}`);
      try {
        const parent = _drive_resolveFolder(query.parentId);
        if (!parent) throw new Error("Carpeta padre no existe.");
        
        const files = parent.getFilesByName(query.name);
        if (files.hasNext()) {
          const file = files.next();
          return { items: [_drive_fileToAtom(file, uqo.provider, true)], metadata: { status: 'OK', resolution: 'BY_NAME' } };
        }
        
        const folders = parent.getFoldersByName(query.name);
        if (folders.hasNext()) {
          const folder = folders.next();
          return { items: [_drive_folderToAtom(folder, uqo.provider)], metadata: { status: 'OK', resolution: 'BY_NAME' } };
        }

        return { items: [], metadata: { status: 'OK', message: 'No se encontró el elemento por nombre.', items: [] } };
      } catch (e) {
        logWarn(`[provider_drive] Fallo en resolución relativa: ${e.message}`);
      }
    }
    
    const err = createError('INVALID_INPUT', 'ATOM_READ requiere context_id o (query.name + query.parentId).');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
  try {
    // Intentar como archivo primero, luego como carpeta
    let atom = null;
    try {
      const file = DriveApp.getFileById(contextId);
      if (file.isTrashed()) throw new Error("TRASHED"); 

      // AXIOMA DE SINCERIDAD (v10.9): Si es un manifiesto de Indra, escalar a la carpeta padre
      const fileName = file.getName();
      if (fileName === 'manifest.json' || fileName === 'manifest.indra') {
        logInfo(`[IDENTITY_SOVEREIGNTY] Manifest detectado. Escalando a carpeta padre.`);
        const parent = file.getParents().next();
        return { items: [_drive_folderToAtom(parent, uqo.provider)], metadata: { status: 'OK', role: 'WORKSPACE_FOLDER' } };
      }

      atom = _drive_fileToAtom(file, uqo.provider, true);
    } catch (e) {
      // No es un archivo o está en papelera — intentar como carpeta
      try {
        const folder = DriveApp.getFolderById(contextId);
        if (folder.isTrashed()) throw new Error("TRASHED");
        atom = _drive_folderToAtom(folder, uqo.provider);
      } catch (e2) {
        const err = createError('NOT_FOUND', `Elemento "${contextId}" no encontrado.`);
        return { items: [], metadata: { status: 'ERROR', error: err.message, code: 'NOT_FOUND' } };
      }
    }

    return { items: atom ? [atom] : [], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_drive] Error en atom_read.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * ATOM_CREATE: Crea una carpeta o un archivo en Drive.
 * data.name           → nombre del elemento (requerido).
 * context_id          → ID de la carpeta padre (opcional, default: ROOT).
 * data.file_base64    → contenido del archivo en base64 (opcional, si existe crea archivo, si no carpeta)
 * data.mime_type      → tipo mime (opcional, requerido si hay file_base64)
 *
 * @private
 */
function _drive_handleAtomCreate(uqo) {
  const data = uqo.data || {};
  
  // AXIOMA DE FLUJO: Si venimos de un paso anterior en el workflow, resolvemos del array de items.
  const source = (data.items && data.items.length > 0) ? data.items[0] : data;

  const label = source.handle?.label || source.name || source.file_name || '';
  if (!label || typeof label !== 'string' || label.trim() === '') {
    const err = createError('INVALID_INPUT', 'ATOM_CREATE requiere data.name o datos del paso anterior.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    const parentFolder = _drive_resolveFolder(uqo.context_id || 'ROOT');
    if (!parentFolder) {
      const err = createError('NOT_FOUND', `Carpeta padre "${uqo.context_id}" no encontrada.`);
      return { items: [], metadata: { status: 'ERROR', error: err.message } };
    }

    let atom;
    if (source.file_base64) {
      // ── MODO ARCHIVO: Crear archivo a partir de Base64 (Axioma de Transporte)
      const mimeType = source.mime_type || 'application/octet-stream';
      const decoded = Utilities.base64Decode(source.file_base64);
      const blob = Utilities.newBlob(decoded, mimeType, label.trim());
      const newFile = parentFolder.createFile(blob);
      atom = _drive_fileToAtom(newFile, uqo.provider, false);
      logInfo(`[provider_drive] Archivo generado: "${label}" (${mimeType}) en "${parentFolder.getName()}"`);
    } else if (source.class === 'TABULAR') {
      // ── DELEGACIÓN: El motor de Sheets ahora es el responsable de esto.
      throw createError('SOVEREIGN_VIOLATION', 'Para crear tablas use el provider "sheets". Drive ya no gestiona materia prima tabular nativa.');
    } else if (source.class === 'DATA_SCHEMA') {
      // ── MODO SEMILLA: Crear archivo JSON de esquema puro (Axioma de Sinceridad)
      const fileName = `${label.trim()}.json`;
      const content = JSON.stringify(source, null, 2);
      const newFile = parentFolder.createFile(fileName, content, 'application/json');
      atom = _drive_fileToAtom(newFile, uqo.provider, false);
      logInfo(`[provider_drive] Semilla de ADN materializada: "${fileName}" en artifacts.`);
    } else if (source.class === 'DOCUMENT' && source.intent === 'TRANSFER') {
      // ── MODO TRANSFERENCIA: Emitir Handshake para el Cliente
      return _drive_handleTransferHandshake({ 
        ...uqo, 
        data: { 
          filename: label, 
          mimeType: source.mime_type || 'application/octet-stream',
          parent_id: uqo.context_id 
        } 
      });
    } else {
      // ── MODO CARPETA: Comportamiento original
      const newFolder = parentFolder.createFolder(label.trim());
      atom = _drive_folderToAtom(newFolder, uqo.provider);
      logInfo(`[provider_drive] Carpeta creada: "${label}" en "${parentFolder.getName()}"`);
    }

    return { 
      items: [atom], 
      metadata: { 
        status: 'OK',
        silo_url: atom.raw?.url || file.getUrl(),
        physical_id: file.getId()
      } 
    };

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
    const filesIter = DriveApp.searchFiles(driveQuery);

    const items = [];
    let count = 0;
    while (filesIter.hasNext() && count < 50) {
      const file = filesIter.next();
      const atom = _drive_fileToAtom(file, providerId, false);
      if (atom) {
        items.push(atom);
        count++;
      }
    }

    return {
      items,
      metadata: {
        status: 'OK',
        has_more: filesIter.hasNext(),
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
    id: folder.getId(),
    handle: {
      ns: 'com.drive.folder',
      alias: _system_slugify_(name) || 'folder_unnamed',
      label: name
    },
    class: 'FOLDER',
    provider: providerId,
    protocols: ['HIERARCHY_TREE', 'ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE'],
    system_hood: 'ROUTES',
    modified_at: folder.getLastUpdated().toISOString(),
    description: folder.getDescription() || '',
    mime_type: 'application/vnd.google-apps.folder',
    payload: {},
    raw: {
      folder_id: folder.getId(),
    },
  };
}

/**
 * Convierte un archivo de Drive a Átomo Universal canónico.
 * @param {DriveApp.File} file
 * @param {string} providerId
 * @param {boolean} [includeFields=false] - Si es true, abre el archivo para extraer esquema (Lento).
 * @returns {Object|null}
 * @private
 */
function _drive_fileToAtom(file, providerId, includeFields) {
  const mimeType = file.getMimeType();

  // Excluir archivos de sistema que no son útiles para el usuario
  const EXCLUDED_MIMES = [
    'application/vnd.google-apps.script',     
    'application/vnd.google-apps.site',       
    'application/vnd.google-apps.fusiontable',
    'application/vnd.google-apps.map',        
  ];
  if (EXCLUDED_MIMES.includes(mimeType)) return null;

  const atomClass = MIME_TO_CLASS_[mimeType] || 'DOCUMENT';
  const atomProtos = MIME_TO_PROTOCOLS_[mimeType] || ['ATOM_READ'];
  const name = file.getName();

  const payload = {};
  // ADR-008: Solo extraemos esquema si se solicita (ATOM_READ) para evitar lentitud en listados.
  if (includeFields && atomClass === 'TABULAR' && mimeType === 'application/vnd.google-apps.spreadsheet') {
    try {
      payload.fields = _drive_spreadsheetToFields(file);
    } catch (e) {
      logWarn(`[provider_drive] Error extrayendo esquema de Sheet ${file.getId()}: ${e.message}`);
      payload.fields = [];
    }
  }
  
  // ADR-0XX: Extracción de ADN Puro para Esquemas JSON
  if (includeFields && mimeType === 'application/json') {
      try {
          payload.content = file.getBlob().getDataAsString();
      } catch (e) {
          logWarn(`[provider_drive] Error leyendo contenido JSON: ${e.message}`);
      }
  }

  // ADR-023: Si el archivo es una imagen, construir el tipo INDRA_MEDIA canónico.
  if (mimeType && mimeType.startsWith('image/')) {
    const fileId = file.getId();
    payload.media = {
      type: 'INDRA_MEDIA',
      storage: 'drive',
      // URL de thumbnail/visualización: funciona para archivos compartidos (ver ADR-023 §Riesgos)
      canonical_url: `https://lh3.googleusercontent.com/d/${fileId}`,
      file_id: fileId,
      mime_type: mimeType,
      expires_at: null // Drive no tiene URLs temporales — es permanente si el archivo está compartido
    };
  }

  return {
    id: file.getId(),
    handle: {
      ns: `com.drive.${atomClass.toLowerCase()}`,
      alias: _system_slugify_(name) || 'file_unnamed',
      label: name
    },
    class: atomClass,
    provider: providerId,
    protocols: atomProtos,
    system_hood: mimeType === 'application/vnd.google-apps.spreadsheet' ? 'STRUCTURE' : 'PHENOTYPE',
    modified_at: file.getLastUpdated().toISOString(),
    size: mimeType.startsWith('application/vnd.google-apps') ? 0 : file.getSize(),
    mime_type: mimeType,
    description: file.getDescription() || '',
    payload: payload,
    raw: {
      url: file.getUrl(),
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

/**
 * TABULAR_STREAM: [ELIMINADO] Delegado al motor de Sheets soberano.
 */

// =============================================================================
// ADR-024: UNIVERSAL MEDIA RESOLVER
// =============================================================================

/**
 * MEDIA_RESOLVE: Handler universal agnóstico a provider.
 * Soporta tres estrategias: BY_ID, BY_NAME_IN_CONTAINER, DIRECT_URL.
 * Retorna siempre INDRA_MEDIA canónico.
 *
 * @private
 */
function _drive_handleMediaResolve(uqo) {
  const strategy = uqo.data?.strategy || 'BY_ID';
  const data = uqo.data || {};

  try {
    switch (strategy) {
      case 'BY_ID':
        return _drive_mediaResolveByID(data.asset_id, uqo.provider);
      
      case 'BY_NAME_IN_CONTAINER':
        return _drive_mediaResolveByNameInContainer(data.container_ref, data.asset_name, uqo.provider);
      
      case 'DIRECT_URL':
        return _drive_mediaResolveDirectUrl(data.asset_id, uqo.provider);
      
      default:
        return {
          items: [],
          metadata: { status: 'ERROR', error: `Estrategia desconocida: ${strategy}`, code: 'INVALID_STRATEGY' }
        };
    }
  } catch (err) {
    logError('[provider_drive] Error en MEDIA_RESOLVE.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: 'MEDIA_RESOLVE_ERROR' } };
  }
}

/**
 * MEDIA_RESOLVE - BY_ID: Resuelve un archivo por su File ID.
 * @private
 */
function _drive_mediaResolveByID(fileId, providerId) {
  if (!fileId) {
    return {
      items: [],
      metadata: { status: 'ERROR', error: 'BY_ID requiere asset_id', code: 'MISSING_ASSET_ID' }
    };
  }

  try {
    const file = DriveApp.getFileById(fileId);
    const mimeType = file.getMimeType();
    const atom = _drive_buildMediaAtom(file, providerId);
    return { items: [atom], metadata: { status: 'OK', strategy_used: 'BY_ID' } };
  } catch (err) {
    return {
      items: [],
      metadata: { status: 'ERROR', error: `Archivo no encontrado: ${fileId}`, code: 'NOT_FOUND' }
    };
  }
}

/**
 * MEDIA_RESOLVE - BY_NAME_IN_CONTAINER: Resuelve archivo por nombre en una carpeta.
 * Política de Determinismo: último modificado (modified_at DESC).
 * Falla Transparente: si cero matches, retorna error claro sin fallback.
 *
 * @private
 */
function _drive_mediaResolveByNameInContainer(folderId, fileName, providerId) {
  if (!folderId || !fileName) {
    return {
      items: [],
      metadata: { status: 'ERROR', error: 'BY_NAME_IN_CONTAINER requiere container_ref y asset_name', code: 'MISSING_PARAMS' }
    };
  }

  try {
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFilesByName(fileName);
    const candidates = [];

    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      // Solo filtrar imágenes (o dejar pasar cualquier mime_type si el cliente especificó hint)
      if (mimeType.startsWith('image/')) {
        candidates.push(file);
      }
    }

    if (candidates.length === 0) {
      return {
        items: [],
        metadata: { status: 'ERROR', error: `No se encontró imagen con nombre: ${fileName}`, code: 'NO_MATCH', strategy: 'BY_NAME_IN_CONTAINER' }
      };
    }

    // Determinar el "último modificado" 
    candidates.sort((a, b) => b.getLastUpdated().getTime() - a.getLastUpdated().getTime());
    const selected = candidates[0];

    const atom = _drive_buildMediaAtom(selected, providerId);
    logInfo(`[provider_drive] MEDIA_RESOLVE BY_NAME: "${fileName}" en folder "${folder.getName()}" → ${selected.getId()}`);

    return { items: [atom], metadata: { status: 'OK', strategy_used: 'BY_NAME_IN_CONTAINER' } };

  } catch (err) {
    return {
      items: [],
      metadata: { status: 'ERROR', error: `Error resolviendo en carpeta: ${err.message}`, code: 'CONTAINER_ERROR' }
    };
  }
}

/**
 * MEDIA_RESOLVE - DIRECT_URL: Valida que asset_id sea una URL válida.
 * Retorna como INDRA_MEDIA con storage="url".
 *
 * @private
 */
function _drive_mediaResolveDirectUrl(url, providerId) {
  if (!url) {
    return {
      items: [],
      metadata: { status: 'ERROR', error: 'DIRECT_URL requiere asset_id (HTTP URL)', code: 'MISSING_URL' }
    };
  }

  // Validar formato URL básico
  if (!/^https?:\/\/.+/i.test(url.trim())) {
    return {
      items: [],
      metadata: { status: 'ERROR', error: `URL inválida: ${url}`, code: 'INVALID_URL_FORMAT' }
    };
  }

  // Construir átomo para URL externa
  const mediaAtom = {
    id: url,  // Usar URL como ID único
    handle: {
      ns: 'com.indra.media',
      alias: _system_slugify_('external_url') || 'external_media',
      label: 'External URL'
    },
    class: 'MEDIA',
    provider: providerId || 'system',
    protocols: ['ATOM_READ'],
    payload: {
      media: {
        type: 'INDRA_MEDIA',
        storage: 'url',
        canonical_url: url,
        file_id: null,
        mime_type: 'image/*',  // Sin verificación MIME para URLs externas
        expires_at: null  // URLs externas asumidas permanentes
      }
    }
  };

  logInfo(`[provider_drive] MEDIA_RESOLVE DIRECT_URL: ${url}`);
  return { items: [mediaAtom], metadata: { status: 'OK', strategy_used: 'DIRECT_URL' } };
}

/**
 * Helper privado: Construir INDRA_MEDIA atom a partir de un Google Drive File object.
 * @private
 */
function _drive_buildMediaAtom(file, providerId) {
  const fileId = file.getId();
  const mimeType = file.getMimeType();
  const name = file.getName();

  // Construir URL canónica según mime type
  let canonicalUrl;
  if (mimeType.startsWith('image/')) {
    canonicalUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  } else if (mimeType === 'application/pdf') {
    canonicalUrl = `https://drive.google.com/file/d/${fileId}/view`;
  } else {
    canonicalUrl = file.getDownloadUrl();
  }

  const mediaAtom = {
    id: fileId,
    handle: {
      ns: 'com.indra.media',
      alias: _system_slugify_(name) || 'drive_media_file',
      label: name
    },
    class: 'MEDIA',
    provider: providerId || 'drive',
    protocols: ['ATOM_READ'],
    mime_type: mimeType,
    payload: {
      media: {
        type: 'INDRA_MEDIA',
        storage: 'drive',
        canonical_url: canonicalUrl,
        file_id: fileId,
        mime_type: mimeType,
        expires_at: null  // Drive URLs son permanentes si archivo compartido
      }
    }
  };

  return mediaAtom;
}

/**
 * TRANSFER_HANDSHAKE: Genera una sesión de subida resumible en Google Drive.
 * ADR-025: Inteligencia Multimodal Adaptativa.
 * @private
 */
function _drive_handleTransferHandshake(uqo) {
  const data = uqo.data || {};
  const filename = data.filename || data.name || 'Untitled';
  const mimeType = data.mimeType || 'application/octet-stream';
  
  // AXIOMA DE UBICACIÓN: Prioridad al context_id del UQO (Aduana) sobre el campo de datos.
  let parentId = uqo.context_id || data.parent_id || 'root';
  if (parentId === 'ROOT') parentId = 'root'; // Normalización para API v3

  logInfo(`[provider_drive] Negociando Handshake para: ${filename} en padre: ${parentId}`);

  try {
    const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable";
    const options = {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
      payload: JSON.stringify({
        name: filename,
        parents: [parentId],
        mimeType: mimeType
      }),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const uploadUrl = response.getHeaders()["Location"];

    if (!uploadUrl) throw new Error("Google Drive denegó la creación de sesión resumible.");

    return { 
      metadata: { 
        status: 'HANDSHAKE_READY', 
        transfer_protocol: 'GOOGLE_RESUMABLE',
        upload_url: uploadUrl,
        intent: 'TRANSFER'
      } 
    };
  } catch (err) {
    logError('[provider_drive] Fallo en Transfer Handshake.', err);
    return { metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * BATCH_UPDATE: Procesa múltiples acciones de escritura en una única transacción de silo.
 * @private
 */
function _drive_handleBatchUpdate(uqo) {
  const { silo_id, actions } = uqo.data || {};
  if (!silo_id || !Array.isArray(actions)) {
    throw createError('INVALID_INPUT', 'BATCH_UPDATE requiere silo_id y un array de acciones.');
  }

  logInfo(`[provider_drive] Iniciando BATCH_UPDATE en Silo: ${silo_id}. Acciones: ${actions.length}`);

  try {
    const ss = SpreadsheetApp.openById(silo_id);
    const sheet = ss.getSheets()[0]; 
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const results = [];

    actions.forEach(action => {
      if (action.type === 'CREATE' || action.type === 'UPDATE') {
        const rowData = headers.map(h => action.data[h] !== undefined ? action.data[h] : '');

        if (action.type === 'CREATE') {
          sheet.appendRow(rowData);
          results.push({ id: action.id, status: 'CREATED' });
        } else {
          const ids = sheet.getRange(1, 1, Math.max(1, sheet.getLastRow()), 1).getValues();
          let rowIndex = -1;
          for(let i=0; i<ids.length; i++) {
            if (String(ids[i][0]) === String(action.id)) { rowIndex = i + 1; break; }
          }
          
          if (rowIndex > 0) {
            sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
            results.push({ id: action.id, status: 'UPDATED' });
          } else {
            sheet.appendRow(rowData);
            results.push({ id: action.id, status: 'CREATED_ON_UPDATE' });
          }
        }
      }
    });

    return {
      items: results,
      metadata: {
        status: 'OK',
        silo_id: silo_id,
        actions_executed: actions.length,
        trace: uqo.trace_id
      }
    };
  } catch (err) {
    logError('[provider_drive] Fallo en BATCH_UPDATE.', err);
    return { metadata: { status: 'ERROR', error: err.message, code: 'BATCH_EXECUTION_FAILED' } };
  }
}





