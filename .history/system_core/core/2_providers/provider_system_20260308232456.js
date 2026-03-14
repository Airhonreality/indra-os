// =============================================================================
// ARTEFACTO: 2_providers/provider_system.gs
// CAPA: 2 — Providers
// RESPONSABILIDAD: El provider interno del propio Core. Gestiona los System Documents:
//         workspaces, que se almacenan como archivos JSON en Google Drive.
//         No requiere API Key externa — opera con las credenciales del propietario
//         del script (la cuenta de Google que hizo el deploy).
//
// PROTOCOLO DE REGISTRO (auto-descubrimiento en provider_registry.gs):
//   La constante PROVIDER_CONF_SYSTEM es detectada automáticamente por
//   _scanProviders_() al arrancar. No requiere registro manual.
//
// AXIOMAS:
//   - ensureHomeRoot() es idempotente: crea .core_system/ si no existe,
//     retorna el ID existente si ya existe. Nunca crea duplicados.
//   - Los workspaces se almacenan como archivos JSON en .core_system/workspaces/.
//   - El ID del workspace es generado por el servidor (UUID). El cliente nunca inventa IDs.
//   - ATOM_READ con context_id='workspaces' retorna la lista completa.
//   - ATOM_CREATE genera el ID, crea el archivo, retorna el átomo completo.
//   - ATOM_DELETE elimina el archivo del workspace de Drive permanentemente.
//
// RESTRICCIONES:
//   - NO puede tener lógica de negocio fuera de CRUD de workspaces.
//   - NO puede invocar APIs externas.
//   - NO puede leer ni escribir en PropertiesService directamente.
//     Usa las funciones exportadas de system_config.gs.
//   - Returned Atoms ALWAYS include: id, class, handle (Return Law §1.2).
//   - Field .name is DEPRECATED: handle.label is used for projection.
// =============================================================================

/**
 * Configuración de auto-descubrimiento del provider system.
 * provider_registry.gs lee esta constante en el arranque.
 *
 * El campo `implements` es un mapa { protocol → nombre_de_función_global }.
 * protocol_router.gs usa implements[protocol] para resolver el handler.
 * Todos los protocolos del provider system están manejados por `handleSystem`.
 *
 * @const {Object}
 */
/**
 * Manifestación del Silo System (Core Internals). Sigue ADR-002.
 * @returns {Object} Contrato de configuración.
 */
function CONF_SYSTEM() {
  return Object.freeze({
    id: 'system',
    handle: {
      ns: 'com.indra.system.core',
      alias: 'system',
      label: 'Sistema'
    },
    class: 'FOLDER',
    version: '1.0',
    protocols: ['ATOM_READ', 'ATOM_CREATE', 'ATOM_DELETE', 'ATOM_UPDATE',
      'SYSTEM_PIN', 'SYSTEM_UNPIN', 'SYSTEM_PINS_READ', 'SYSTEM_WORKSPACE_REPAIR', 'TABULAR_STREAM',
      'FORMULA_EVAL', 'SCHEMA_SUBMIT', 'SCHEMA_FIELD_OPTIONS', 'ACCOUNT_RESOLVE', 'SYSTEM_AUDIT'],
    implements: {
      ATOM_READ: 'handleSystem',
      ATOM_CREATE: 'handleSystem',
      ATOM_DELETE: 'handleSystem',
      ATOM_UPDATE: 'handleSystem',
      SYSTEM_PIN: 'handleSystem',
      SYSTEM_UNPIN: 'handleSystem',
      SYSTEM_PINS_READ: 'handleSystem',
      SYSTEM_WORKSPACE_REPAIR: 'handleSystem',
      TABULAR_STREAM: 'handleSystem',
      FORMULA_EVAL: 'LogicEngine.executeLogicBridge', // O una función específica si prefieres
      SCHEMA_SUBMIT: 'handleSystem',
      SCHEMA_FIELD_OPTIONS: 'handleSystem',
      ACCOUNT_RESOLVE: 'handleSystem',
      SYSTEM_AUDIT: 'handleSystem',
    },
    config_schema: [],
    capabilities: {
      ATOM_READ: { sync: 'BLOCKING', purge: 'NONE' },
      ATOM_CREATE: { sync: 'BLOCKING', purge: 'ALL' },
      ATOM_UPDATE: { sync: 'BLOCKING', purge: 'ID' },
      ATOM_DELETE: { sync: 'BLOCKING', purge: 'ALL' },
      SYSTEM_PIN: { sync: 'BLOCKING', purge: 'ALL' },
      SYSTEM_UNPIN: { sync: 'BLOCKING', purge: 'ALL' },
      SYSTEM_PINS_READ: { sync: 'BLOCKING', purge: 'NONE' },
      SYSTEM_WORKSPACE_REPAIR: { sync: 'BLOCKING', purge: 'ALL' },
      TABULAR_STREAM: { sync: 'BLOCKING', purge: 'NONE' },
      SYSTEM_MANIFEST: { sync: 'BLOCKING', purge: 'NONE' }
    },
    protocol_meta: {
      ATOM_READ: { label: 'Read System', help: 'Accessing core infrastructure structures.' },
      ATOM_CREATE: { label: 'Create Atom', help: 'Registering new identity in persistent storage.' },
      ATOM_UPDATE: { label: 'Update Atom', help: 'Persisting changes to the underlying storage.' },
      ATOM_DELETE: { label: 'Delete Atom', help: 'Removing identity and resource.' },
      SYSTEM_PIN: { label: 'Pin Resource', help: 'Linking atom to active workspace context.' },
      SYSTEM_UNPIN: { label: 'Unpin Resource', help: 'Removing link from workspace context.' },
      SYSTEM_PINS_READ: { label: 'Read Pins', help: 'Retrieving the navigation map.' },
      TABULAR_STREAM: { label: 'Stream Collection', help: 'Listing system resources.' },
      SYSTEM_MANIFEST: { label: 'Sync Capabilities', help: 'Updating the available services map.' }
    }
  });
}


// ─── CONSTANTES INTERNAS ──────────────────────────────────────────────────────

/** Nombre de la carpeta raíz del sistema en Drive. */
const HOME_ROOT_FOLDER_NAME_ = '.core_system';

/** Nombre de la subcarpeta donde se almacenan los workspaces. */
const WORKSPACES_FOLDER_NAME_ = 'workspaces';

/** Nombre de la subcarpeta donde se almacenan los workflows. */
const WORKFLOWS_FOLDER_NAME_ = 'workflows';

/** Nombre de la subcarpeta donde se almacenan los esquemas de datos (schemas). */
const SCHEMAS_FOLDER_NAME_ = 'schemas';

/** Nombre de la subcarpeta donde se almacenan las fórmulas (reglas de negocio). */
const FORMULAS_FOLDER_NAME_ = 'formulas';

/** Class canónica de los átomos de workspace (DATA_CONTRACTS §2.3). */
const WORKSPACE_CLASS_ = 'WORKSPACE';

/** Class canónica de los átomos de workflow. */
const WORKFLOW_CLASS_ = 'WORKFLOW';

/** Class canónica de los átomos de esquema de datos (DATA_SCHEMA). */
const DATA_SCHEMA_CLASS_ = 'DATA_SCHEMA';

/** Class canónica de los átomos de fórmula. */
const FORMULA_CLASS_ = 'FORMULA';

/** Class canónica de los átomos de documento/plantilla. */
const DOCUMENT_CLASS_ = 'DOCUMENT';

/** Nombre de la carpeta donde se almacenan los documentos. */
const DOCUMENTS_FOLDER_NAME_ = 'documents';

// ─── MANEJADOR PRINCIPAL ──────────────────────────────────────────────────────

/**
 * Punto de entrada del provider system. Invocado por protocol_router.gs.
 * Despacha el UQO al sub-handler correcto según el protocolo.
 *
 * @param {Object} uqo - Universal Query Object validado por protocol_router.
 * @returns {{ items: Array, metadata: Object }} Siempre The Return Law.
 */
function handleSystem(uqo) {
  const protocol = (uqo.protocol || '').toUpperCase();

  const baseId = uqo.provider.split(':')[0];
  if (baseId !== 'system') {
    const err = createError('SYSTEM_FAILURE', `El handler del Sistema recibió un provider inesperado: ${uqo.provider}`);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
  }

  logInfo(`[provider_system] Received: ${protocol}`, { context_id: uqo.context_id });

  if (protocol === 'ATOM_READ') return _system_handleRead(uqo);
  if (protocol === 'ATOM_CREATE') return _system_handleCreate(uqo);
  if (protocol === 'ATOM_DELETE') return _system_handleDelete(uqo);
  if (protocol === 'ATOM_UPDATE') return _system_handleUpdate(uqo);
  if (protocol === 'SYSTEM_PIN') return _system_handlePin(uqo);
  if (protocol === 'SYSTEM_UNPIN') return _system_handleUnpin(uqo);
  if (protocol === 'SYSTEM_PINS_READ') return _system_handlePinsRead(uqo);
  if (protocol === 'SYSTEM_WORKSPACE_REPAIR') return _system_handleWorkspaceRepair(uqo);
  if (protocol === 'TABULAR_STREAM') return _system_handleTabularStream(uqo);
  if (protocol === 'SCHEMA_SUBMIT') return _system_handleSchemaSubmit(uqo);
  if (protocol === 'SCHEMA_FIELD_OPTIONS') return _system_handleSchemaFieldOptions(uqo);
  if (protocol === 'ACCOUNT_RESOLVE') return _system_handleAccountResolve(uqo);
  if (protocol === 'SYSTEM_AUDIT') return AuditEngine.runFullAudit();

  // Protocolo no soportado por este provider
  const err = createError('PROTOCOL_NOT_FOUND',
    `Provider "system" no soporta el protocolo: "${protocol}".`
  );
  logWarn(`[provider_system] ${err.message}`);
  return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code } };
}
/**
 * ACCOUNT_RESOLVE: Identidad del Core (Indra Cloud).
 * @private
 */
function _system_handleAccountResolve(uqo) {
  const user = Session.getActiveUser().getEmail();
  const label = `Indra Cloud (${user.split('@')[0]})`;

  return {
    items: [{
      id: 'internal',
      handle: {
        ns: 'com.indra.system.core',
        alias: 'indra_cloud',
        label: label
      },
      class: 'ACCOUNT_IDENTITY',
      protocols: ['ATOM_READ']
    }],
    metadata: { status: 'OK' }
  };
}

// ─── HANDLERS POR PROTOCOLO ───────────────────────────────────────────────────

/**
 * ATOM_READ: Lista todos los workspaces o lee uno específico.
 * context_id = 'workspaces' → lista completa.
 * context_id = 'ws_xxxxx'  → un workspace específico.
 *
 * @private
 */
function _system_handleRead(uqo) {
  let contextId = uqo.context_id;
  // Normalización Axiomática: si el context_id es la identidad del silo, mapear a ROOT (workspaces)
  if (contextId === uqo.provider || contextId === 'system') contextId = 'workspaces';

  // Si context_id es una de las colecciones raíz, listamos.
  let targetClass = null;
  if (contextId === 'workspaces') targetClass = WORKSPACE_CLASS_;
  if (contextId === 'workflows') targetClass = WORKFLOW_CLASS_;
  if (contextId === 'schemas') targetClass = DATA_SCHEMA_CLASS_;
  if (contextId === 'formulas') targetClass = FORMULA_CLASS_;

  if (targetClass) {
    return _system_listAtomsByClass(targetClass, uqo.provider);
  }

  // Si no, asumimos que es un ID de átomo específico
  return _system_readAtom(contextId, uqo.provider);
}

function _system_handleCreate(uqo) {
  const data = uqo.data || {};
  const label = data.handle?.label || data.label || 'Sin título';
  const atomClass = data.class || WORKSPACE_CLASS_;

  return _system_createAtom(atomClass, label.trim(), data, uqo.provider);
}

function _system_handleDelete(uqo) {
  if (!uqo.context_id) {
    const err = createError('INVALID_INPUT', 'atom_delete requiere context_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  return _system_deleteWorkspace(uqo.context_id);
}

function _system_handleUpdate(uqo) {
  if (!uqo.context_id || !uqo.data) {
    const err = createError('INVALID_INPUT', 'atom_update requiere context_id y data.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  return _system_updateAtom(uqo.context_id, uqo.data, uqo.provider);
}

// ─── HANDLERS DE PINS ─────────────────────────────────────────────────────────

/**
 * SYSTEM_PIN: Ancla un átomo al workspace activo.
 * El átomo completo viaja en `data.atom`. Solo se guarda el puntero mínimo.
 * Idempotente: si el átomo ya está anclado, actualiza pinned_at.
 *
 * UQO requerido:
 *   { protocol: 'SYSTEM_PIN', workspace_id: 'ws_...', data: { atom: Atom } }
 *
 * @private
 */
function _system_handlePin(uqo) {
  const workspaceId = uqo.workspace_id;
  const atom = uqo.data && uqo.data.atom;

  if (!workspaceId) {
    const err = createError('INVALID_INPUT', 'SYSTEM_PIN requiere workspace_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
  if (!atom || !atom.id || !atom.class || !atom.handle) {
    const err = createError('INVALID_INPUT', 'SYSTEM_PIN requiere data.atom con id, class y handle canónico.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    const file = _system_findAtomFile(workspaceId); // throws IDENTITY_VIOLATION | NOT_FOUND
    const doc = JSON.parse(file.getBlob().getDataAsString());
    const pins = Array.isArray(doc.pins) ? doc.pins : [];

    const pinPointer = {
      id: atom.id,
      handle: atom.handle, // PERSISTENCIA IUH (Hito 4.0)
      name: atom.handle.label, // Legacy fallback
      class: atom.class,
      provider: atom.provider,
      protocols: atom.protocols || [],
      pinned_at: new Date().toISOString(),
    };

    const existingIdx = pins.findIndex(p => p.id === atom.id && p.provider === atom.provider);
    if (existingIdx >= 0) {
      pins[existingIdx] = pinPointer;
    } else {
      pins.push(pinPointer);
    }

    doc.pins = pins;
    doc.updated_at = new Date().toISOString();
    file.setContent(JSON.stringify(doc, null, 2));

    logInfo(`[provider_system] Pin guardado: ${atom.handle.label} (${atom.provider}::${atom.id}) en workspace ${workspaceId}`);
    return { items: [pinPointer], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_system] Error en system_pin.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
  }
}

/**
 * SYSTEM_UNPIN: Desancla un átomo del workspace activo.
 *
 * UQO requerido:
 *   { protocol: 'SYSTEM_UNPIN', workspace_id: 'ws_...', data: { atom_id: '...', provider: '...' } }
 *
 * @private
 */
function _system_handleUnpin(uqo) {
  const workspaceId = uqo.workspace_id;
  const data = uqo.data || {};

  if (!workspaceId || !data.atom_id || !data.provider) {
    const err = createError('INVALID_INPUT', 'SYSTEM_UNPIN requiere workspace_id, data.atom_id y data.provider.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    const file = _system_findAtomFile(workspaceId); // throws IDENTITY_VIOLATION | NOT_FOUND
    const doc = JSON.parse(file.getBlob().getDataAsString());
    const before = (doc.pins || []).length;
    doc.pins = (doc.pins || []).filter(p => !(p.id === data.atom_id && p.provider === data.provider));
    doc.updated_at = new Date().toISOString();
    file.setContent(JSON.stringify(doc, null, 2));

    const removed = before - doc.pins.length;
    logInfo(`[provider_system] Pin removido: ${data.provider}::${data.atom_id} (${removed} eliminados)`);
    return { items: [], metadata: { status: 'OK' } };

  } catch (err) {
    logError('[provider_system] Error en system_unpin.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
  }
}

function _system_handlePinsRead(uqo) {
  const workspaceId = uqo.workspace_id;

  if (!workspaceId) {
    const err = createError('INVALID_INPUT', 'SYSTEM_PINS_READ requiere workspace_id.');
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }

  try {
    const file = _system_findAtomFile(workspaceId); // throws IDENTITY_VIOLATION | NOT_FOUND
    const doc = JSON.parse(file.getBlob().getDataAsString());
    const pins = Array.isArray(doc.pins) ? doc.pins : [];
    const bridges = Array.isArray(doc.bridges) ? doc.bridges : [];

    logInfo(`[provider_system] SYSTEM_PINS_READ: ${pins.length} pins y ${bridges.length} bridges en workspace ${workspaceId}`);
    return {
      items: pins,
      metadata: {
        status: 'OK',
        count: pins.length,
        bridges: bridges
      }
    };
  } catch (err) {
    logError('[provider_system] Error en SYSTEM_PINS_READ.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
  }
}

/**
 * SYSTEM_WORKSPACE_REPAIR: El Cirujano de Workspaces.
 * Escanea todos los pins del workspace activo, verifica su existencia física
 * en el provider correspondiente y elimina los que han muerto (Ghost Pins).
 */
function _system_handleWorkspaceRepair(uqo) {
  const workspaceId = uqo.workspace_id;
  if (!workspaceId) return { items: [], metadata: { status: 'ERROR', error: 'Se requiere workspace_id.' } };

  try {
    const file = _system_findAtomFile(workspaceId);
    const doc = JSON.parse(file.getBlob().getDataAsString());
    const pins = Array.isArray(doc.pins) ? doc.pins : [];

    const validPins = [];
    const removedNames = [];

    pins.forEach(pin => {
      let exists = true;
      try {
        if (pin.provider === 'system' || pin.provider.startsWith('drive')) {
          // Verificación de integridad en Drive
          const atomFile = DriveApp.getFileById(pin.id);
          if (atomFile.isTrashed()) exists = false;
        }
        // Nota: Para Notion/Pipeline, el chequeo es más caro (API calls). 
        // Por ahora curamos la infraestructura interna (System/Drive).
      } catch (e) {
        exists = false;
      }

      if (exists) {
        validPins.push(pin);
      } else {
        removedNames.push(pin.handle?.label || pin.name || pin.id);
      }
    });

    if (removedNames.length > 0) {
      doc.pins = validPins;
      doc.updated_at = new Date().toISOString();
      file.setContent(JSON.stringify(doc, null, 2));
      logInfo(`[system_repair] Purga de ${removedNames.length} pins fantasma en ${doc.handle?.label || doc.name}.`);
    }

    return {
      items: validPins,
      metadata: {
        status: 'OK',
        message: removedNames.length > 0
          ? `Saneamiento completado: Se eliminaron ${removedNames.length} anclajes rotos (${removedNames.join(', ')}).`
          : 'Workspace íntegro. No se detectaron anclajes rotos.',
        intent_type: removedNames.length > 0 ? 'SUCCESS' : 'NEUTRAL',
        removed_count: removedNames.length
      }
    };

  } catch (err) {
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

// ─── OPERACIONES DE ÁTOMOS EN DRIVE ───────────────────────────────────────────

/**
 * Lista todos los átomos de una clase específica.
 * @param {string} atomClass - Clase del átomo.
 * @param {string} providerId - ID del provider.
 * @returns {{ items: Array, metadata: Object }}
 */
function _system_listAtomsByClass(atomClass, providerId) {
  try {
    const folderName = _system_getFolderForClass(atomClass);
    const folder = _system_getOrCreateSubfolder_(folderName);
    const files = folder.getFiles();
    const items = [];

    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() !== 'application/json') continue;

      try {
        const content = JSON.parse(file.getBlob().getDataAsString());
        // AXIOMA DE SINCERIDAD DE CLASE: Solo incluimos si coincide la clase pedida.
        if (content.class !== atomClass) continue;

        items.push(_system_toAtom(content, file.getId(), providerId));
      } catch (parseError) {
        logWarn(`[provider_system] Archivo JSON inválido ignorado: ${file.getName()}`);
      }
    }

    logInfo(`[provider_system] Lista de ${atomClass} recuperada: ${items.length} ítems.`);
    return { items, metadata: { status: 'OK' } };
  } catch (err) {
    logError(`[provider_system] Error al listar clase ${atomClass}.`, err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * Lee un átomo específico por su Drive ID.
 */
function _system_readAtom(atomId, providerId) {
  try {
    const file = _system_findAtomFile(atomId); // throws IDENTITY_VIOLATION | NOT_FOUND
    const content = JSON.parse(file.getBlob().getDataAsString());
    return { items: [_system_toAtom(content, file.getId(), providerId)], metadata: { status: 'OK' } };
  } catch (err) {
    logError(`[provider_system] Error al leer átomo ${atomId}.`, err);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
  }
}

/**
 * Crea un nuevo átomo en Drive.
 */
function _system_createAtom(atomClass, label, extraData, providerId) {
  try {
    if (!atomClass || !label) {
      throw createError('CONTRACT_VIOLATION', '[system] ATOM_CREATE: se requiere class y handle.label.');
    }

    const folderName = _system_getFolderForClass(atomClass);
    const now = new Date().toISOString();
    const subfolder = _system_getOrCreateSubfolder_(folderName);
    const alias = _system_slugify_(label);
    const fileName = `${alias}_${Date.now()}.json`;

    const atomDoc = {
      handle: {
        ns: extraData.handle?.ns || `com.indra.system.${atomClass.toLowerCase()}`,
        alias: alias,
        label: label
      },
      class: atomClass,
      provider: providerId,
      created_at: now,
      updated_at: now,
      payload: extraData.payload || {},
      protocols: ['ATOM_READ', 'ATOM_CREATE', 'ATOM_UPDATE', 'ATOM_DELETE'],
      raw: extraData.raw || {},
    };
    const file = subfolder.createFile(fileName, JSON.stringify(atomDoc, null, 2));
    const driveId = file.getId();

    // El ID del átomo ES el Drive ID. Drive lo asigna. Nosotros lo leemos.
    // DATA_CONTRACTS §2.3 — Sinceridad de Identidad.
    atomDoc.id = driveId;
    file.setContent(JSON.stringify(atomDoc, null, 2));

    logInfo(`[provider_system] Átomo creado con Drive ID nativo: ${driveId}`);
    return { items: [_system_toAtom(atomDoc, driveId, providerId)], metadata: { status: 'OK' } };

  } catch (err) {
    logError(`[provider_system] Error al crear átomo de clase ${atomClass}.`, err);
    return { items: [], metadata: { status: 'ERROR', error: err.message } };
  }
}

/**
 * Elimina un átomo de Drive de forma permanente.
 * AXIOMA: No tiene borrado lógico silencioso. Si el ID es inválido o corrupto,
 * el error sube hasta el cliente para forzar su limpieza.
 */
function _system_deleteWorkspace(atomId) {
  try {
    const file = _system_findAtomFile(atomId); // throws IDENTITY_VIOLATION | NOT_FOUND
    file.setTrashed(true);
    logInfo(`[provider_system] Átomo eliminado: ${atomId}`);
    return { items: [], metadata: { status: 'OK' } };
  } catch (err) {
    logError('[provider_system] Error al eliminar átomo.', err);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
  }
}

/**
 * Actualiza los metadatos de un átomo existente.
 */
function _system_updateAtom(atomId, updates, providerId) {
  try {
    const file = _system_findAtomFile(atomId); // throws IDENTITY_VIOLATION | NOT_FOUND
    const current = JSON.parse(file.getBlob().getDataAsString());

    // AXIOMA DE LIMPIEZA: No guardamos el 'raw' del átomo de vuelta al archivo
    // para evitar el bug de anidamiento ("Nested Raw").
    const { raw, ...pureUpdates } = updates;

    const updated = {
      ...current,
      ...pureUpdates,
      id: current.id,       // Inmutable
      class: current.class,    // Inmutable
      provider: current.provider, // Inmutable
      updated_at: new Date().toISOString(),
    };

    // Si el cliente envió un 'raw' explícito, lo manejamos pero SIN anidarlo
    if (raw && typeof raw === 'object') {
      const { _file_id, ...cleanRaw } = raw;
      Object.keys(cleanRaw).forEach(k => {
        if (updated[k] === undefined) updated[k] = cleanRaw[k];
      });
    }

    // Sincronizar nombre del archivo físico con el label del átomo si cambió
    const newLabel = updates.handle?.label || pureUpdates.name;
    if (newLabel && newLabel !== (current.handle?.label || current.name)) {
      const cleanName = newLabel.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
      file.setName(`${cleanName}.json`);
    }

    file.setContent(JSON.stringify(updated, null, 2));
    logInfo(`[provider_system] Átomo actualizado exitosamente: ${atomId}`);

    // PROPAGACIÓN DE IDENTIDAD (v3.0 IUH)
    if (newLabel && newLabel !== (current.handle?.label || current.name)) {
      _system_propagateNameChange(atomId, newLabel, providerId);
    }

    // Propagar cambio de Alias si existe el objeto handle
    if (updates.handle && updates.handle.alias !== current.handle?.alias) {
      _system_propagateAliasChange(atomId, updates.handle, providerId);
    }

    return { items: [_system_toAtom(updated, file.getId(), providerId)], metadata: { status: 'OK' } };

  } catch (err) {
    logError(`[provider_system] Error al actualizar átomo ${atomId}.`, err);
    return { items: [], metadata: { status: 'ERROR', error: err.message, code: err.code || 'NOT_FOUND' } };
  }
}

/**
 * Propaga el cambio de Alias (Identidad Funcional) a todos los pins.
 * AXIOMA A5: La estabilidad agentiva requiere sincronía total.
 * @private
 */
function _system_propagateAliasChange(atomId, newHandle, providerId) {
  try {
    const wsFolder = _system_getOrCreateSubfolder_(WORKSPACES_FOLDER_NAME_);
    const files = wsFolder.getFiles();
    let updatedCount = 0;

    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() !== 'application/json') continue;

      try {
        const content = JSON.parse(file.getBlob().getDataAsString());
        if (!content.pins || !Array.isArray(content.pins)) continue;

        let changed = false;
        content.pins.forEach(pin => {
          if (pin.id === atomId && (pin.provider === providerId || pin.provider.startsWith(providerId + ':'))) {
            pin.handle = newHandle;
            pin.name = newHandle.label; // Sincronía legacy
            changed = true;
          }
        });

        if (changed) {
          file.setContent(JSON.stringify(content, null, 2));
          updatedCount++;
        }
      } catch (e) {
        logWarn(`[_system_propagateAliasChange] Error en workspace ${file.getId()}: ${e.message}`);
      }
    }
    logInfo(`[provider_system] Propagación de Alias completa: ${updatedCount} workspaces.`);
  } catch (err) {
    logError('[provider_system] Fallo en _system_propagateAliasChange.', err);
  }
}

/**
 * Propaga el cambio de nombre de un átomo a todos los pins en todos los workspaces.
 * AXIOMA XIV.1: La integridad referencial es responsabilidad del servidor.
 * 
 * @param {string} atomId - ID del átomo que cambió.
 * @param {string} newName - Nuevo nombre.
 * @param {string} providerId - ID del provider del átomo (base).
 * @private
 */
function _system_propagateNameChange(atomId, newName, providerId) {
  try {
    const wsFolder = _system_getOrCreateSubfolder_(WORKSPACES_FOLDER_NAME_);
    const files = wsFolder.getFiles();
    let updatedCount = 0;

    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() !== 'application/json') continue;

      try {
        const content = JSON.parse(file.getBlob().getDataAsString());
        if (!content.pins || !Array.isArray(content.pins)) continue;

        let changed = false;
        content.pins.forEach(pin => {
          // El providerId ya viene normalizado (ej: 'notion', 'drive')
          if (pin.id === atomId && (pin.provider === providerId || pin.provider.startsWith(providerId + ':'))) {
            if ((pin.handle?.label || pin.name) !== newName) {
              if (pin.handle) pin.handle.label = newName;
              pin.name = newName;
              changed = true;
            }
          }
        });

        if (changed) {
          file.setContent(JSON.stringify(content, null, 2));
          updatedCount++;
        }
      } catch (e) {
        logWarn(`[_system_propagateNameChange] Error procesando workspace ${file.getId()}: ${e.message}`);
      }
    }

    logInfo(`[provider_system] Propagación completa. ${updatedCount} workspaces actualizados.`);
  } catch (err) {
    logError('[provider_system] Error fatal en propagación de nombres.', err);
  }
}

// ─── INFRAESTRUCTURA DE DRIVE ─────────────────────────────────────────────────

/**
 * Obtiene (o crea si no existe) la carpeta raíz del sistema en Drive.
 * Esta función implementa el patrón descrito en STARTUP_PLAN §0.3:
 * "ensureHomeRoot() → crea .core_system/ si no existe, retorna el ID si ya existe."
 *
 * Decisión: Es IDEMPOTENTE. Puede llamarse en cada request sin crear duplicados.
 * Decisión: Guarda el ID en PropertiesService para no buscar la carpeta en cada llamada.
 *
 * @returns {DriveApp.Folder} La carpeta raíz del sistema.
 * @private
 */
function _system_ensureHomeRoot() {
  // Intentar leer el ID cacheado en PropertiesService
  const cachedId = readRootFolderId(); // → system_config.gs
  if (cachedId) {
    try {
      return DriveApp.getFolderById(cachedId);
    } catch (e) {
      // El folder fue eliminado o el ID es inválido → recrear
      logWarn('[provider_system] Home root no encontrado en Drive por ID. Recreando...');
    }
  }

  // Buscar si ya existe en el root de Drive (para no duplicar)
  const existingFolders = DriveApp.getRootFolder().getFoldersByName(HOME_ROOT_FOLDER_NAME_);

  if (existingFolders.hasNext()) {
    const folder = existingFolders.next();
    // Verificamos que no esté en la papelera
    if (!folder.isTrashed()) {
      storeRootFolderId(folder.getId());
      logInfo(`[provider_system] Home root encontrado en Drive Root (verificado): ${folder.getId()}`);
      return folder;
    }
  }

  // No existe → crear
  const newFolder = DriveApp.createFolder(HOME_ROOT_FOLDER_NAME_);
  storeRootFolderId(newFolder.getId());
  logInfo(`[provider_system] Home root creado en Drive: ${newFolder.getId()}`);
  return newFolder;
}

function _system_getFolderForClass(atomClass) {
  if (atomClass === WORKFLOW_CLASS_) return WORKFLOWS_FOLDER_NAME_;
  if (atomClass === DATA_SCHEMA_CLASS_) return SCHEMAS_FOLDER_NAME_;
  if (atomClass === DOCUMENT_CLASS_) return DOCUMENTS_FOLDER_NAME_;
  if (atomClass === FORMULA_CLASS_) return FORMULAS_FOLDER_NAME_;
  return WORKSPACES_FOLDER_NAME_;
}

/**
 * Obtiene (o crea) una subcarpeta dentro del home root.
 * @private
 */
function _system_getOrCreateSubfolder_(folderName) {
  const homeRoot = _system_ensureHomeRoot();
  const subFolders = homeRoot.getFoldersByName(folderName);

  if (subFolders.hasNext()) {
    return subFolders.next();
  }

  const folder = homeRoot.createFolder(folderName);
  logInfo(`[provider_system] Subcarpeta ${folderName} creada.`);
  return folder;
}

/**
 * Busca un archivo de átomo por su Drive ID nativo.
 *
 * AXIOMA DE IDENTIDAD (DATA_CONTRACTS §2.3 — Sinceridad de Identidad):
 * El único ID válido para buscar un átomo es el ID nativo de Google Drive.
 * Cualquier ID con formato 'prefix_slug_random' (ej: 'frm_…', 'ws_…', 'wf_…')
 * es un ID INVENTADO de una versión legacy. El sistema NO tiene fallbacks.
 * Si un ID de este tipo llega aquí, significa que hay datos corruptos en el
 * cliente (cache, pin, store). El fallo es RUIDOSO para forzar limpieza.
 *
 * @param {string} contextId - El Drive ID del átomo. NUNCA un ID generado por código.
 * @returns {DriveApp.File} El archivo de Drive.
 * @throws {Error} IDENTITY_VIOLATION si el ID tiene formato legacy o no existe.
 * @private
 */
function _system_findAtomFile(contextId) {
  if (!contextId) {
    throw createError('IDENTITY_VIOLATION',
      '[provider_system] _system_findAtomFile llamado sin context_id. ' +
      'DATA_CONTRACTS §2.3: el cliente debe siempre proveer el Drive ID real.');
  }

  // Extraer ID si viene con prefijo de provider ('system:1BxiMVs…')
  const atomId = contextId.includes(':') ? contextId.split(':').pop() : contextId;

  // GUARDIA LEGACY: Detectar IDs inventados con el patrón 'prefix_slug_random'.
  // Este patrón es exclusivo de _system_generateId() (ahora exterminado).
  // Si un ID así llega: dato corrupto en cliente. Fallo ruidoso.
  const LEGACY_ID_PATTERN = /^[a-z]+_[a-z0-9_]+$/;
  if (LEGACY_ID_PATTERN.test(atomId)) {
    const err = createError('IDENTITY_VIOLATION',
      `[provider_system] ID "${atomId}" tiene formato legacy (prefix_slug). ` +
      'No es un Drive ID. El cliente tiene datos corruptos en su cache o pins. ' +
      'Acción requerida: limpiar localStorage y re-sincronizar desde el servidor. ' +
      'DATA_CONTRACTS §2.3 — Sinceridad de Identidad.');
    logError(err.message);
    throw err;
  }

  // Acceso directo por Drive ID nativo — el único camino válido.
  try {
    const file = DriveApp.getFileById(atomId);
    if (!file || file.isTrashed()) {
      const err = createError('NOT_FOUND',
        `[provider_system] Átomo con Drive ID "${atomId}" no existe o está en papelera.`);
      logError(err.message);
      throw err;
    }
    return file;
  } catch (e) {
    // Re-lanzar si ya es un error estructurado nuestro
    if (e.code) throw e;
    // Si DriveApp lanza, el ID no pertenece a ningún archivo accesible
    const err = createError('NOT_FOUND',
      `[provider_system] Drive ID "${atomId}" no encontrado o sin permisos de acceso. ` +
      `Error de Drive: ${e.message}`);
    logError(err.message);
    throw err;
  }
}

// ─── CONVERSIÓN A ÁTOMO UNIVERSAL ─────────────────────────────────────────────

/**
 * Convierte un documento de workspace al formato de Átomo Universal.
 * El Átomo Universal requiere mínimo: id, handle, class, provider (DATA_CONTRACTS §1.2).
 *
 * @param {Object} doc      - El JSON del workspace leído de Drive.
 * @param {string|null} fileId - El ID de Drive del archivo (puede ser null en ATOM_CREATE).
 * @returns {Object} Átomo Universal canónico.
 * @private
 */
function _system_toAtom(doc, fileId, providerId) {
  // ADR-008: Sinceridad Radical. No adivinamos la clase ni el nombre.
  if (!doc.class || !doc.handle?.label) {
    logWarn(`[provider_system] Átomo ${fileId} ignorado por falta de Sinceridad (class/label faltantes).`);
    // En lugar de inventar, devolvemos un átomo roto para que la aduana lo bloquee
    return {
      id: fileId,
      class: doc.class || 'BROKEN_ATOM',
      handle: doc.handle || {
        ns: 'com.indra.system.broken',
        alias: 'broken_atom',
        label: 'INCOMPLETE_IDENTITY'
      },
      protocols: [],
      payload: doc.payload || {}
    };
  }

  return {
    id: fileId || doc.id,
    handle: doc.handle,
    class: doc.class,
    protocols: Array.isArray(doc.protocols) ? doc.protocols : [],
    provider: providerId || 'system',
    created_at: doc.created_at,
    updated_at: doc.updated_at,
    payload: doc.payload || {}, // No inventamos campos desde el root
    raw: { ...doc, _file_id: fileId },
  };
}

// ─── GENERADOR DE IDs — EXTERMINADO ──────────────────────────────────────────
//
// LÁPIDA: _system_generateId() fue eliminado en cumplimiento de
// DATA_CONTRACTS.md §2.3 — Sinceridad de Identidad.
//
// AXIOMA: "El sistema prohíbe inventar IDs virtuales.
// El ID real de infraestructura (Drive File ID) es la única identidad válida."
//
// CUALQUIER LLAMADA A ESTA FUNCIÓN ES UN BUG.
// Reemplazar con: file.getId() tras DriveApp.createFile().
//
// Si lees esto y necesitas un ID → usa `file.getId()` tras crear el archivo en Drive.
// Si el archivo aún no existe → créalo primero. Drive asigna el ID. Tú lo lees.
//
/**
 * @deprecated EXTERMINADO. Viola DATA_CONTRACTS §2.3.
 * No existe un reemplazo: la identidad la asigna Drive, no el código.
 */
function _system_generateId(_prefix, _name) {
  const err = createError('IDENTITY_VIOLATION',
    '[provider_system] _system_generateId() fue llamado. Esta función está EXTERMINADA. ' +
    'DATA_CONTRACTS §2.3 — Sinceridad de Identidad prohíbe generar IDs en código. ' +
    'El ID de un átomo es siempre el Drive File ID, obtenido con file.getId() ' +
    'después de crear el archivo. Revisa el stack trace para encontrar el llamador.');
  logError(err.message);
  throw err;
}
/**
 * FORMULA_EVAL: El Motor de Fórmulas del Core.
 * Evalúa expresiones matemáticas o lógicas usando variables dinámicas.
 *
 * UQO.query:
 *   formula (string): Ej. "x * 1.21"
 *   variables (Object): Ej. { x: 100 }
 *
 * @param {Object} uqo
 * @returns {{ items: Array, metadata: Object }}
 */
function system_evaluateFormula(uqo) {
  const query = uqo.query || {};
  let formula = query.formula;
  const variables = query.variables || {};
  const contextId = uqo.context_id;

  try {
    // Si no viene la fórmula en el query, intentamos cargarla del átomo (context_id)
    if (!formula && contextId && contextId !== 'formulas') {
      const file = _system_findAtomFile(contextId);
      const atom = JSON.parse(file.getBlob().getDataAsString());
      if (atom.class === FORMULA_CLASS_ && atom.raw && atom.raw.script) {
        formula = atom.raw.script;
        logInfo(`[system] Fórmula cargada desde átomo: ${contextId}`);
      }
    }

    if (!formula || typeof formula !== 'string') {
      return {
        items: [],
        metadata: { status: 'ERROR', error: 'Falta campo "formula" o context_id válido.' }
      };
    }

    // ── ESTRATEGIA DE EVALUACIÓN (AXIOMÁTICA)
    const keys = Object.keys(variables);
    const values = Object.values(variables);

    // El cuerpo de la función es simplemente el retorno de la fórmula.
    const evaluator = new Function(...keys, `return (${formula});`);
    const result = evaluator(...values);

    logDebug(`[system] Fórmula evaluada: "${formula}" con ${JSON.stringify(variables)} → ${result}`);

    return {
      items: [{
        id: 'calculation_result',
        handle: {
          ns: 'com.indra.system.logic',
          alias: 'result',
          label: String(result)
        },
        class: 'DATA',
        protocols: ['ATOM_READ'],
        value: result,
        formula: formula,
        timestamp: new Date().toISOString()
      }],
      metadata: { status: 'OK' }
    };
  } catch (e) {
    logError(`[system] Error al evaluar fórmula: "${formula}"`, e);
    return {
      items: [],
      metadata: {
        status: 'ERROR',
        error: `Evaluación fallida: ${e.message}`
      }
    };
  }
}
/**
 * SCHEMA_SUBMIT: Invoca un workflow pasando los datos del esquema como trigger_data.
 * context_id = ID del DATA_SCHEMA.
 * data.trigger_data = El objeto con los valores del esquema.
 * 
 * @private
 */
function _system_handleSchemaSubmit(uqo) {
  const schemaId = uqo.context_id;
  const triggerData = (uqo.data && uqo.data.trigger_data) || {};

  // 1. Leer el átomo del esquema
  const schemaFile = _system_findSchemaFile_(schemaId);
  if (!schemaFile) {
    return { items: [], metadata: { status: 'ERROR', error: `Esquema "${schemaId}" no encontrado.` } };
  }
  const schemaAtom = JSON.parse(schemaFile.getBlob().getDataAsString());
  const workflowId = schemaAtom.raw && schemaAtom.raw.on_submit && schemaAtom.raw.on_submit.workflow_id;

  if (!workflowId) {
    return { items: [], metadata: { status: 'ERROR', error: 'El formulario no tiene un workflow asociado.' } };
  }

  // 2. Cargar el workflow (que se asume vive en /workflows/ o similar)
  // Para Hito 2: usamos la utilidad de _system_findWorkflowFile si existe, sino lo buscamos en el root
  // Por simplicidad, buscamos en .core_system/workflows/
  const wfFile = _system_findWorkflowFile_(workflowId);
  if (!wfFile) {
    return { items: [], metadata: { status: 'ERROR', error: `Workflow "${workflowId}" no encontrado.` } };
  }
  const workflowObj = JSON.parse(wfFile.getBlob().getDataAsString());

  // 3. Ejecutar el workflow inyectando el trigger_data
  // Creamos un UQO sintético de ejecución
  const workflowUqo = {
    protocol: 'WORKFLOW_EXECUTE',
    data: {
      workflow: workflowObj,
      trigger_data: triggerData
    },
    workspace_id: uqo.workspace_id
  };

  logInfo(`[provider_system] Ejecutando workflow por esquema: ${workflowId}`);
  return handleWorkflowExecute(workflowUqo);
}

/**
 * SCHEMA_FIELD_OPTIONS: Resuelve las opciones de un campo de relación.
 * query.field_key = Llave del campo en el esquema.
 * 
 * @private
 */
function _system_handleSchemaFieldOptions(uqo) {
  const schemaId = uqo.context_id;
  const fieldKey = uqo.query && uqo.query.field_key;

  if (!fieldKey) {
    return { items: [], metadata: { status: 'ERROR', error: 'Se requiere field_key para cargar opciones.' } };
  }

  // 1. Leer el esquema
  const schemaFile = _system_findSchemaFile_(schemaId);
  if (!schemaFile) return { items: [], metadata: { status: 'ERROR', error: 'Esquema no encontrado.' } };
  const schemaAtom = JSON.parse(schemaFile.getBlob().getDataAsString());

  // 2. Buscar el campo
  const fields = (schemaAtom.raw && schemaAtom.raw.fields) || [];
  const field = fields.find(f => f.key === fieldKey);

  if (!field || field.type !== 'relation_select' || !field.source) {
    return { items: [], metadata: { status: 'ERROR', error: 'Campo no es de tipo relación o le falta "source".' } };
  }

  // 3. Llamada al provider origen via TABULAR_STREAM
  // Usamos route() internamente (recursivo seguro)
  const streamUqo = {
    provider: field.source.provider,
    protocol: 'TABULAR_STREAM',
    context_id: field.source.context_id,
    query: { limit: 100 } // Limitar para evitar spam
  };

  try {
    const result = route(streamUqo);
    // Mapear a contrato simple de opciones [{ value, label }]
    const options = (result.items || []).map(item => ({
      id: 'opt_' + (item.id || Math.random()),
      value: item.id,
      handle: {
        ns: 'com.indra.system.option',
        alias: item.handle?.alias || _system_slugify_(item.handle?.label || item.id),
        label: item.handle?.label || item.name || String(item.id)
      },
      class: 'OPTION',
      protocols: []
    }));

    return { items: options, metadata: { status: 'OK' } };
  } catch (e) {
    return { items: [], metadata: { status: 'ERROR', error: `Error al cargar opciones de ${field.source.provider}: ${e.message}` } };
  }
}

/**
 * TABULAR_STREAM para Sistema: Permite que los formularios actúen como fuentes de schema.
 */
function _system_handleTabularStream(uqo) {
  const atomId = uqo.context_id;
  const file = _system_findAtomFile(atomId);
  if (!file) {
    return { items: [], metadata: { status: 'ERROR', error: 'Átomo no encontrado.' } };
  }

  const doc = JSON.parse(file.getBlob().getDataAsString());

  // Si es un esquema de datos, su schema son sus campos configurados en raw.fields
  if (doc.class === DATA_SCHEMA_CLASS_) {
    const rawFields = (doc.raw && doc.raw.fields) || [];
    const fields = rawFields.map(f => ({
      id: f.key,
      label: f.label,
      type: f.type
    }));

    return {
      id: atomId,
      handle: doc.handle,
      class: doc.class,
      items: [], // Un Stream con limit 0 o sin filas físicas por ahora
      metadata: {
        status: 'OK',
        schema: { fields: fields }
      }
    };
  }

  return {
    id: atomId,
    handle: doc.handle,
    class: doc.class,
    items: [],
    metadata: { status: 'OK', schema: { fields: [] } }
  };
}

// ─── UTILIDADES DE ACCESO A ARCHIVOS ──────────────────────────────────────────

function _system_findSchemaFile_(schemaId) {
  return _system_findAtomFile(schemaId);
}

function _system_findWorkflowFile_(workflowId) {
  return _system_findAtomFile(workflowId);
}

function _system_getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}
