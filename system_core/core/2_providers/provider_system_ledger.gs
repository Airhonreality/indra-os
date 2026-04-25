// =============================================================================
// ARTEFACTO: 2_providers/provider_system_ledger.gs
// CAPA: 2 — Providers (Almacenamiento)
// RESPONSABILIDAD: El único guardián de la Google Sheet Maestra (El Ledger).
//         Implementa el Axioma 1: Fallo Ruidoso ante inconsistencias.
// =============================================================================

const LEDGER_SHEET_NAME = 'ATOMS';
const RELATIONS_SHEET_NAME = 'RELATIONS';
const KEYCHAIN_SHEET_NAME = 'KEYCHAIN';
const INFRA_SHEET_NAME = 'INFRASTRUCTURE';
const PROCESS_SHEET_NAME = 'PROCESSES';
const HEALTH_SHEET_NAME = 'HEALTH';

const MASTER_LEDGER_COLUMNS = ['gid', 'drive_id', 'class', 'alias', 'label', 'owner_id', 'updated_at', 'payload_json', 'acl_json'];
const RELATION_COLUMNS = ['uid', 'source_gid', 'target_gid', 'type', 'strength', 'payload_json', 'updated_at'];
const KEYCHAIN_COLUMNS = ['token', 'name', 'status', 'class', 'parent_id', 'can_delegate', 'created_at', 'scopes_json'];
const INFRA_COLUMNS = ['key', 'drive_id', 'label', 'updated_at'];
const PROCESS_COLUMNS = ['trigger_id', 'workflow_id', 'status', 'last_pulse', 'error_log', 'config_json'];
const HEALTH_COLUMNS = ['provider_id', 'status', 'fail_count', 'last_latency_ms', 'last_error', 'updated_at'];

/**
 * Obtiene la Sheet del Ledger. Lanza error fatal si no existe o no es accesible.
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 * @private
 */
function _ledger_get_sheet_(allowMissing = false) {
  const ledgerId = readMasterLedgerId();
  if (!ledgerId) {
    if (allowMissing) return null;
    logWarn('[ledger] CRÍTICO: No hay MASTER_LEDGER_ID.');
    return SpreadsheetApp.openById(ledger_initialize_new()).getSheetByName(LEDGER_SHEET_NAME);
  }

  try {
    const ss = SpreadsheetApp.openById(ledgerId);
    let sheet = ss.getSheetByName(LEDGER_SHEET_NAME);
    if (!sheet && allowMissing) {
      sheet = ss.insertSheet(LEDGER_SHEET_NAME);
      sheet.appendRow(MASTER_LEDGER_COLUMNS);
      sheet.setFrozenRows(1);
    }
    return sheet;
  } catch (e) {
    if (allowMissing) return null;
    throw new Error(`CRITICAL_INFRA_FAILURE: ${e.message}`);
  }
}

/**
 * Interceptor Relacional Yoneda (v5.1)
 * Descubre y monta el Ledger local de una célula basándose en el UQO.
 */
function _ledger_get_target_sheet_(uqo) {
  const trx = uqo?.trace_id || 'LOCAL';
  const wsId = uqo?.workspace_id || uqo?.context_id;
  
  // AXIOMA: Si no hay contexto o es el sistema, usamos el ROOT
  if (!wsId || wsId === 'system' || wsId === 'workspaces') {
    logInfo(`[ledger] [${trx}] Resolviendo Ledger Maestro (ROOT).`);
    return _ledger_get_sheet_();
  }
  
  // 1. Verificar si ya está montado en memoria efímera
  const cached = MountManager.getMount(wsId);
  if (cached) {
    logInfo(`[ledger] [${trx}] Usando Ledger Celular en caché para: ${wsId}`);
    return SpreadsheetApp.openById(cached).getSheetByName(LEDGER_SHEET_NAME);
  }
  
  // 2. Handshake Relacional: buscar en INFRASTRUCTURE del ROOT
  const infraKey = `cell_ledger_${wsId}`;
  let cellLedgerId = ledger_infra_get(infraKey);
  
  if (!cellLedgerId) {
      logInfo(`[ledger] [${trx}] JIT: Intentando auto-adopción física para ${wsId}...`);
      try {
          // AXIOMA DE RESOLUCIÓN (v11.0): Si wsId es de un archivo (Legacy), escalar a carpeta
          let folder;
          try {
              folder = DriveApp.getFolderById(wsId);
          } catch (e) {
              const file = DriveApp.getFileById(wsId);
              folder = file.getParents().next();
              logWarn(`[ledger] [${trx}] ID LEGACY DETECTADO. Escalando ${wsId} -> ${folder.getId()}`);
          }

          // AXIOMA: manifest.json es la ÚNICA fuente de verdad celular (v5.1)
          const manifestFile = folder.getFilesByName('manifest.json');
          if (manifestFile.hasNext()) {
              const dna = JSON.parse(manifestFile.next().getBlob().getDataAsString());
              cellLedgerId = dna.membrane?.ledger_id || dna.payload?.cell_ledger_id;
              if (cellLedgerId) {
                  logSuccess(`[ledger] [${trx}] Célula adoptada con éxito: ${wsId} -> ${cellLedgerId}`);
                  ledger_infra_sync(infraKey, cellLedgerId, dna.handle?.label || wsId);
                  MountManager.mountTransient(wsId, cellLedgerId);
              }
          }
      } catch (e) {
          logWarn(`[ledger] [${trx}] Fallo en auto-adopción física de ${wsId}: ${e.message}`);
      }
  }

  if (cellLedgerId) {
    logInfo(`[ledger] [${trx}] Usando núcleo para: ${wsId} -> ${cellLedgerId}`);
    MountManager.mountTransient(wsId, cellLedgerId);
    return SpreadsheetApp.openById(cellLedgerId).getSheetByName(LEDGER_SHEET_NAME);
  }
  
  // AXIOMA: CERO FALLBACKS.
  logError(`[ledger] [${trx}] ERROR: Célula ${wsId} carece de núcleo Ledger.`);
  throw createError('CELLULAR_NUCLEUS_NOT_FOUND', `No se encontró el núcleo (Ledger) para la Célula: ${wsId}. Realiza un SYSTEM_REBUILD_LEDGER si la célula es válida.`);
}


/**
 * Registra o actualiza un átomo en el Ledger.
 * @param {Object} atom - El objeto átomo según ADR-001.
 * @param {string} driveId - El ID físico en Google Drive.
 */
function ledger_sync_atom(atom, driveId, contextUqo) {
  // --- AXIOMA DE AUTO-ADOPCIÓN (v7.8) ---
  // Si el Satélite es agnóstico y no envía contexto, el Core asume la tutela
  // y resuelve el territorio basándose en la ubicación física del archivo.
  let resolvedUqo = contextUqo || {};
  if (!resolvedUqo.workspace_id && !resolvedUqo.context_id) {
    const physicalContext = _ledger_resolve_physical_context_(driveId);
    if (physicalContext) {
      logInfo(`[ledger] Auto-Adopción: Detectado territorio ${physicalContext} para el átomo ${driveId}`);
      resolvedUqo.context_id = physicalContext;
    }
  }

  const sheet = _ledger_get_target_sheet_(resolvedUqo);
  const lock = LockService.getScriptLock();
  
  try {
    if (!lock.tryLock(5000)) throw new Error('LEDGER_LOCK_TIMEOUT');

    const rowData = _ledger_build_row_(atom, driveId);
    const data = sheet.getDataRange().getValues();
    
    // Buscar si ya existe por drive_id (Columna B / Index 1)
    const index = data.findIndex(row => row[1] === driveId);

    if (index === -1) {
      logInfo(`[ledger] Insertando en Ledger Celular [${resolvedUqo.context_id || 'ROOT'}]. Clase: ${atom.class}`);
      sheet.appendRow(rowData);
    } else {
      logInfo(`[ledger] Actualizando en Ledger. ID: ${driveId}`);
      sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * RESOLUCIÓN FÍSICA DE NÚCLEO (v18.0)
 * Obtiene el ID de la Spreadsheet asociada a un Workspace.
 */
function _ledger_get_ss_id_(workspaceId) {
    if (!workspaceId || workspaceId === 'system') return readMasterLedgerId();
    
    // 1. Verificar caché
    const cached = MountManager.getMount(workspaceId);
    if (cached) return cached;
    
    // 2. Resolución vía Handshake (usando el handler existente)
    const sheet = _ledger_get_target_sheet_({ workspace_id: workspaceId });
    return sheet.getParent().getId();
}

/**
 * BÚSQUEDA PROFUNDA AXIOMÁTICA (v18.0)
 * Busca un átomo por clase y criterios de matching, con fallback a escaneo físico.
 */
function ledger_find_atom_deep(atomClass, matchObj, uqo) {
    const workspaceId = uqo.workspace_id || 'system';
    logInfo(`[ledger:deep] Iniciando búsqueda para ${atomClass} en ${workspaceId}...`);

    // 1. Intento vía Índice (Rápido)
    const indexItems = ledger_list_by_class(atomClass, uqo);
    let found = indexItems.find(item => {
        return Object.entries(matchObj).every(([key, val]) => {
            const itemVal = item.payload?.[key] || item[key];
            return String(itemVal).toLowerCase() === String(val).toLowerCase();
        });
    });

    if (found) {
        logInfo(`[ledger:deep] Hit en índice para: ${Object.values(matchObj)[0]}`);
        return found;
    }

    // 2. Fallback a Escaneo Físico Tabular (Axioma de Verdad Última)
    logWarn(`[ledger:deep] Miss en índice. Iniciando escaneo físico tabular...`);
    const ledgerId = _ledger_get_ss_id_(workspaceId);
    SpreadsheetApp.flush(); // Asegurar sincronización física antes del escaneo
    
    try {
        const physicalRes = _system_handleTabularStream({
            protocol: 'TABULAR_STREAM',
            context_id: ledgerId,
            provider: 'sheets',
            data: { sheet_name: 'Entidades' } 
        });
        
        const physicalItems = physicalRes.items || [];
        logInfo(`[ledger:deep] Escaneo Físico completado en 'Entidades'. Filas: ${physicalItems.length}`);
        
        if (physicalItems.length > 0) {
            logInfo(`[ledger:deep] Muestra de Esquema (Keys): ${Object.keys(physicalItems[0]).join(', ')}`);
        }

        let matchedAtom = null;
        
        const found = physicalItems.find((item, idx) => {
            const itemClass = item.class || item.payload?.class;
            
            if (idx === 0) {
                logInfo(`[ledger:deep] Fila 0 -> Class: ${itemClass} | Payload Crudo: ${item.payload ? 'EXISTE' : 'VACÍO'}`);
            }

            if (itemClass !== atomClass) return false;
            
            let finalData = { ...item };
            let parsedPayload = null;
            if (typeof item.payload === 'string' && item.payload.startsWith('{')) {
                try { 
                    parsedPayload = JSON.parse(item.payload); 
                    finalData = { ...finalData, ...parsedPayload };
                    if (idx === 0) logInfo(`[ledger:deep] Payload parseado con éxito. Llaves: ${Object.keys(parsedPayload).join(', ')}`);
                } catch(e) {
                    logWarn(`[ledger:deep] Fallo al parsear payload en fila ${idx}: ${e.message}`);
                }
            }
            
            const isMatch = Object.entries(matchObj).every(([key, val]) => {
                const itemVal = finalData[key];
                const match = String(itemVal).toLowerCase() === String(val).toLowerCase();
                if (!match && idx === 0) logWarn(`[ledger:deep] Fila 0 NO coincide en ${key}: ${itemVal} !== ${val}`);
                if (match) logInfo(`[ledger:deep] Match físico encontrado en fila ${idx}: ${key}=${val}`);
                return match;
            });

            if (isMatch) {
                matchedAtom = {
                    ...item,
                    payload: parsedPayload || item.payload
                };
                return true;
            }
            return false;
        });

        if (matchedAtom) {
            logInfo(`[ledger:deep] Éxito en escaneo físico. Materia recuperada.`);
            return matchedAtom;
        }
    } catch (e) {
        logError(`[ledger:deep] Fallo en escaneo físico de ${ledgerId}: ${e.message}`);
    }

    return null;
}

/**
 * REGISTRO DE IDENTIDAD SOBERANA (v18.0)
 * Mapea un átomo de identidad a la dimensión tabular del Workspace.
 */
function ledger_register_identity(uqo) {
    const data = uqo.data || {};
    const workspaceId = uqo.workspace_id || 'system';
    
    logInfo(`[ledger:identity] Registrando identidad para: ${data.payload?.email} en WS: ${workspaceId}`);
    
    const ledgerId = _ledger_get_ss_id_(workspaceId);
    
    // Axioma de Santuario: Las identidades deben vivir en su propia membrana tabular.
    const tabularRes = _system_handleTabularUpdate({
        protocol: 'TABULAR_UPDATE',
        context_id: ledgerId,
        provider: 'sheets',
        data: {
            sheet_name: 'Entidades', // Alineación con la realidad física del usuario
            actions: [{
                type: 'CREATE',
                id: data.handle?.alias || data.payload?.email,
                data: {
                    ...data.payload,
                    _indra_id: data.handle?.alias || data.payload?.email,
                    class: 'IDENTITY',
                    handle: data.handle?.label || data.payload?.name || data.payload?.email,
                    payload: JSON.stringify(data.payload) // Empaquetar en columna payload según esquema real
                }
            }]
        }
    });

    // AXIOMA DE RETORNO (v18.0): Todo registro debe devolver la materia cristalizada
    return {
        items: [{
            id: data.handle?.alias || data.payload?.email,
            class: 'IDENTITY',
            handle: data.handle || { label: data.payload?.name || data.payload?.email },
            payload: data.payload
        }],
        metadata: tabularRes.metadata
    };

}
function _ledger_resolve_physical_context_(driveId) {
  try {
    const file = DriveApp.getFileById(driveId);
    const parents = file.getParents();
    if (!parents.hasNext()) return null;

    const parent = parents.next();
    const parentId = parent.getId();

    // Si el padre tiene un manifiesto o un ledger local, es el contexto.
    const manifest = parent.getFilesByName('manifest.json');
    const legacyManifest = parent.getFilesByName('workspace.json');
    
    if (manifest.hasNext() || legacyManifest.hasNext()) {
      return parentId;
    }

    // Si no es un workspace pero tiene un padre, podríamos seguir escalando (Recursión controlada)
    // Por ahora, Indra v7.8 solo adopta en primer nivel para mantener latencia baja.
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Crea la estructura de fila canónica de Indra para el Ledger.
 * @private
 */
function _ledger_build_row_(atom, driveId) {
  const owner = atom.owner_id || readCoreOwnerEmail();
  const acl = atom.acl || { 
    admins: [owner], 
    readers: [], 
    writers: [] 
  };

  // --- AXIOMA: INDRA SIN PESO (FLECHA RELACIONAL) ---
  // Solo persistimos lo que es vital para la soberanía y el enrutamiento.
  return [
    atom.gid || `GID-${driveId.substring(0,8)}`,
    driveId,
    atom.class || 'UNKNOWN',
    atom.handle?.alias || atom.alias || '', 
    atom.handle?.label || atom.label || 'Sin título',
    owner,
    atom.updated_at || new Date().toISOString(),
    JSON.stringify(atom.payload || {}), 
    JSON.stringify(acl)
  ];
}

/**
 * Busca átomos por clase directamente en el Ledger.
 * @param {string} atomClass 
 * @returns {Array<Object>}
 */
function ledger_list_by_class(atomClass, contextUqo) {
  const sheet = _ledger_get_target_sheet_(contextUqo);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  return data
    .filter(row => row[2] === atomClass)
    .map(row => ({
      gid: row[0],
      id: row[1],
      class: row[2],
      handle: { alias: row[3], label: row[4] || '[RESONANCE_PENDING]' },
      owner_id: row[5],
      updated_at: row[6] || null,
      payload: row[7] ? JSON.parse(row[7]) : {},
      acl: row[8] ? JSON.parse(row[8]) : null
    }));
}

/**
 * Elimina un átomo del Ledger (Respetando el Contexto Micelar).
 * @param {string} driveId 
 * @param {Object} contextUqo - Contexto para determinar qué núcleo (cell) limpiar.
 */
function ledger_remove_atom(driveId, contextUqo) {
  const sheet = _ledger_get_target_sheet_(contextUqo);
  let data = sheet.getDataRange().getValues();
  
  // AXIOMA DE PURGA TOTAL: Buscamos y borramos de abajo hacia arriba para no alterar los índices
  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][1] === driveId) {
          sheet.deleteRow(i + 1);
          deletedCount++;
      }
  }

  if (deletedCount > 0) {
    logInfo(`[ledger] Purga completada: ${deletedCount} instancia(s) de ${driveId} eliminada(s).`);
  } else {
    logWarn(`[ledger] LEDGER_PURGE_MISMATCH: El átomo ${driveId} no existía en el Ledger.`);
  }
}

/**
 * Inicializa un nuevo Master Ledger desde cero.
 * @returns {string} El ID de la nueva Google Sheet.
 */
function ledger_initialize_new() {
  logInfo('[ledger_init] ⚡ INICIANDO GÉNESIS DEL MASTER LEDGER...');
  
  // 0. Asegurar Soberanía Territorial (ADR-043)
  const homeRoot = _system_ensureHomeRoot ? _system_ensureHomeRoot() : null;
  const rootFolderId = readRootFolderId();
  
  logInfo(`[ledger_init] Anclaje detectado: ${rootFolderId || 'N/A'}`);
  
  // 1. Crear el cuerpo físico
  const ss = SpreadsheetApp.create('INDRA_MASTER_LEDGER');
  const ledgerId = ss.getId();
  const file = DriveApp.getFileById(ledgerId);
  
  // 2. Traslado de Soberanía
  if (homeRoot) {
    logInfo(`[ledger_init] Moviendo Ledger a la Tierra Prometida (.core_system)...`);
    file.moveTo(homeRoot);
  } else {
    logWarn('[ledger_init] ADVERTENCIA: No se pudo localizar .core_system. El Ledger quedará huérfano en la raíz.');
  }

  logInfo(`[ledger_init] Ledger cristalizado exitosamente. ID: ${ledgerId}`);
  MountManager.mount('ROOT', ledgerId);
  
  // 1. Átomos
  const atomSheet = ss.getSheets()[0];
  atomSheet.setName(LEDGER_SHEET_NAME);
  atomSheet.appendRow(MASTER_LEDGER_COLUMNS);
  atomSheet.setFrozenRows(1);

  // 1.5 RELACIONES (Axioma v6.0)
  const relSheet = ss.insertSheet(RELATIONS_SHEET_NAME);
  relSheet.appendRow(RELATION_COLUMNS);
  relSheet.setFrozenRows(1);

  // 2. Llavero
  const keySheet = ss.insertSheet(KEYCHAIN_SHEET_NAME);
  keySheet.appendRow(KEYCHAIN_COLUMNS);
  keySheet.setFrozenRows(1);

  // 3. Infraestructura
  const infraSheet = ss.insertSheet(INFRA_SHEET_NAME);
  infraSheet.appendRow(INFRA_COLUMNS);
  infraSheet.setFrozenRows(1);

  // 4. Procesos
  const procSheet = ss.insertSheet(PROCESS_SHEET_NAME);
  procSheet.appendRow(PROCESS_COLUMNS);
  procSheet.setFrozenRows(1);

  // 5. Salud y Métricas (Circuit Breaker)
  const healthSheet = ss.insertSheet(HEALTH_SHEET_NAME);
  healthSheet.appendRow(HEALTH_COLUMNS);
  healthSheet.setFrozenRows(1);
  
  return ledgerId;
}

/**
 * Inicializa un Ledger Local para una célula (Workspace).
 * Axioma v5.1: Portabilidad y Aislamiento Micelar.
 * @param {string} folderId - ID de la carpeta del Workspace.
 * @param {string} label - Nombre del Workspace.
 * @returns {string} El ID de la nueva Spreadsheet local.
 */
function ledger_initialize_cell(folderId, label) {
  logInfo(`[ledger_cell] Forjando Núcleo Local para: ${label}...`);
  
  const folder = DriveApp.getFolderById(folderId);
  const ss = SpreadsheetApp.create(`LEDGER_${label.toUpperCase().replace(/\s+/g, '_')}`);
  const sheetId = ss.getId();
  
  // 1. Mover a la membrana de la célula
  DriveApp.getFileById(sheetId).moveTo(folder);
  
  // 2. Inicializar pestañas mínimas (ATOMS e INFRA)
  const atomSheet = ss.getSheets()[0];
  atomSheet.setName(LEDGER_SHEET_NAME);
  atomSheet.appendRow(MASTER_LEDGER_COLUMNS);
  atomSheet.setFrozenRows(1);

  const relSheet = ss.insertSheet(RELATIONS_SHEET_NAME);
  relSheet.appendRow(RELATION_COLUMNS);
  relSheet.setFrozenRows(1);

  const infraSheet = ss.insertSheet(INFRA_SHEET_NAME);
  infraSheet.appendRow(INFRA_COLUMNS);
  infraSheet.setFrozenRows(1);
  
  // 3. Crear Manifiesto Celular (Axioma de Identidad relacional v5.1)
  const cellManifest = {
    id: folderId,
    class: 'WORKSPACE',
    handle: { alias: label.toLowerCase().replace(/\s+/g, '_'), label: label },
    membrane: {
      version: 'v5.1-CELL',
      core_parent: readRootFolderId(),
      ledger_id: sheetId
    },
    capabilities: ['ATOM_READ', 'ATOM_WRITE', 'PINS_READ'],
    relations: [] // Espacio para Trazabilidad Yoneda
  };
  folder.createFile('manifest.json', JSON.stringify(cellManifest, null, 2));

  logInfo(`[ledger_cell] Núcleo y Manifiesto cristalizados: ${sheetId}`);
  return sheetId;
}

/**
 * PROTOCOLO DE RECONSTRUCCIÓN (EL BOTÓN ROJO)
 * Escanea recursivamente la carpeta de Indra en Drive y repuebla el Ledger.
 * SOPORTA CONTEXTO: Si recibe context_id, reconstruye el ledger de esa célula.
 * @returns {Object} Resumen de la reconstrucción.
 */
function SYSTEM_REBUILD_LEDGER(uqo) {
  const contextId = uqo?.workspace_id || uqo?.context_id;
  const items = [ledger_rebuild_from_drive_internal_(contextId)]; 
  return { items, metadata: { status: 'OK' } };
}

/**
 * Reconstruye el Ledger Maestro a partir de la realidad física de Drive (RESCATE).
 * @private
 */
function ledger_rebuild_from_drive_internal_(contextId = null) {
  logInfo(`☢️ INICIANDO RECONSTRUCCIÓN TOTAL DEL LEDGER (MODO BATCH) - CONTEXTO: ${contextId || 'ROOT'}...`);
  
  // Localizar el núcleo objetivo
  // Localizar el núcleo objetivo
  let targetFolder = null;
  if (contextId) {
    try {
        const physicalObject = DriveApp.getFileById(contextId);
        const mime = physicalObject.getMimeType();
        
        if (mime === "application/vnd.google-apps.folder") {
          targetFolder = DriveApp.getFolderById(contextId);
        } else {
          logInfo(`      [rebuild:scaling] ID ${contextId} es un archivo (${mime}). Escalando a carpeta padre...`);
          targetFolder = physicalObject.getParents().next();
        }
    } catch(e) {
        logWarn(`[rebuild] Contexto ${contextId} no accesible físicamente o ID inválido: ${e.message}. Usando ROOT.`);
    }
  }
  
  const homeRoot = targetFolder || _system_ensureHomeRoot();
  const rows = [];
  
  // Función recursiva para recolectar todo antes de tocar la Sheet
  function collectFiles(folder) {
    const folderName = folder.getName();
    logInfo(`      [rebuild:scan] Entrando en carpeta: ${folderName}`);
    
    const files = folder.getFiles(); 
    let filesInFolder = 0;
    while (files.hasNext()) {
      const f = files.next();
      const fileName = f.getName();
      filesInFolder++;
      
      if (fileName.toLowerCase().endsWith('.json')) {
        try {
          const content = JSON.parse(f.getBlob().getDataAsString());
          
          if (content.class) {
            if (content.class === 'WORKSPACE' && contextId) {
              logInfo(`      [rebuild:skip] Omitiendo manifiesto propio en celda: ${fileName}`);
              continue; 
            }
            
            logInfo(`      [rebuild:found] Átomo detectado: ${content.handle?.label || content.id} (${content.class})`);
            rows.push(_ledger_build_row_(content, f.getId()));
          } else {
             logWarn(`      [rebuild:ignore] Archivo sin clase válida: ${fileName}`);
          }
        } catch (e) { 
           logError(`      [rebuild:error] Error procesando ${fileName}: ${e.message}`);
        }
      } else {
        logWarn(`      [rebuild:ext-skip] Archivo ignorado por extensión: ${fileName}`);
      }
    }
    
    if (filesInFolder === 0) logWarn(`      [rebuild:empty] La carpeta ${folderName} no tiene archivos físicos.`);

    const subfolders = folder.getFolders();
    while (subfolders.hasNext()) {
      collectFiles(subfolders.next());
    }
  }

  collectFiles(homeRoot);
  logInfo(`[ledger] Datos recolectados en memoria: ${rows.length} átomos. Volcando al Ledger...`);

  if (rows.length === 0 && !contextId) return { status: 'OK', total_rebuilt: 0 };

  // OPERACIÓN PERISTÁLTICA
  const sheet = contextId ? _ledger_get_target_sheet_({ workspace_id: contextId }) : _ledger_get_sheet_(true);
  const lock = LockService.getScriptLock();
  
  try {
    if (!lock.tryLock(30000)) throw new Error('REBUILD_LOCK_TIMEOUT');
    
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, MASTER_LEDGER_COLUMNS.length).clearContent();
    
    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, MASTER_LEDGER_COLUMNS.length).setValues(rows);
    }
    
  } finally {
    lock.releaseLock();
  }

  logSuccess(`[ledger] Reconstrucción BULK completada: ${rows.length} átomos.`);
  return { status: 'OK', total_rebuilt: rows.length };
}

/**
 * Obtiene un metadato rápido del Ledger sin abrir el JSON.
 */
function ledger_get_by_drive_id(driveId) {
  const sheet = _ledger_get_sheet_();
  const data = sheet.getDataRange().getValues();
  const index = data.findIndex(row => row[1] === driveId);
  if (index === -1) return null;
  
  const row = data[index];
  return {
    gid: row[0],
    id: row[1],
    class: row[2],
    updated_at: row[6]
  };
}

/**
 * Obtiene metadatos de múltiples IDs de un solo golpe (v4.39).
 * @param {string[]} ids
 * @param {Object} [contextUqo] - Contexto micelar (opcional).
 * @returns {Object} Mapa de { id: { label, class, updated_at } }
 */
function _ledger_get_bulk_metadata_(ids, contextUqo) {
  SpreadsheetApp.flush(); 
  const sheet = _ledger_get_target_sheet_(contextUqo || {});
  const data = sheet.getDataRange().getValues();
  const results = {};
  
  if (!ids || ids.length === 0) return results;

  logInfo(`[ledger:bulk] Buscando ${ids.length} IDs en Ledger [${sheet.getName()}]. Filas totales: ${data.length}`);

  data.forEach((row, i) => {
    const driveId = String(row[1] || '').trim(); // Forzamos limpieza de ID
    if (ids.indexOf(driveId) !== -1) {
      logInfo(`[ledger:bulk] ¡ENCONTRADO! ID: ${driveId} en fila ${i+1}`);
      results[driveId] = {
        gid: row[0],
        id: driveId,
        class: row[2],
        alias: row[3],
        label: row[4],
        updated_at: row[6]
      };
    }
  });

  return results;
}

/**
 * Retorna TODOS los registros del Ledger totalmente hidratados.
 * AXIOMA: Úselo solo para operaciones de impacto/auditoría masiva.
 * @returns {Array<Object>}
 */
function ledger_list_all_records() {
  const sheet = _ledger_get_sheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  return data.slice(1).map(row => ({
    gid: row[0],
    id: row[1],
    class: row[2],
    handle: { alias: row[3], label: row[4] },
    owner_id: row[5],
    updated_at: row[6],
    payload: row[7] ? JSON.parse(row[7]) : {}
  }));
}
/**
 * Lee todo el llavero desde el Ledger.
 * @returns {Object} Mapa de tokens { [token]: entry }
 */
function ledger_keychain_read_all() {
  const ssId = MountManager.getMount('ROOT');
  if (!ssId) return {};
  
  const ss = SpreadsheetApp.openById(ssId);
  let sheet = ss.getSheetByName(KEYCHAIN_SHEET_NAME);
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {};

  const ledger = {};
  data.slice(1).forEach(row => {
    ledger[row[0]] = {
      name: row[1],
      status: row[2],
      class: row[3],
      parent_id: row[4],
      can_delegate: row[5] === true || row[5] === 'TRUE',
      created_at: row[6],
      scopes: row[7] ? JSON.parse(row[7]) : []
    };
  });
  return ledger;
}

/**
 * Sincroniza una entrada individual en el Llavero del Ledger.
 */
function ledger_keychain_sync(token, entry) {
  const ssId = MountManager.getMount('ROOT') || ledger_initialize_new();
  
  const ss = SpreadsheetApp.openById(MountManager.getMount('ROOT'));
  let sheet = ss.getSheetByName(KEYCHAIN_SHEET_NAME) || ss.insertSheet(KEYCHAIN_SHEET_NAME);
  
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) throw new Error('KEYCHAIN_LOCK_TIMEOUT');

    const data = sheet.getDataRange().getValues();
    const rowData = [
      token,
      entry.name,
      entry.status,
      entry.class,
      entry.parent_id || '',
      entry.can_delegate,
      entry.created_at || new Date().toISOString(),
      JSON.stringify(entry.scopes || [])
    ];

    const index = data.findIndex(row => row[0] === token);
    if (index === -1) {
      sheet.appendRow(rowData);
    } else {
      sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Elimina físicamente una identidad del Llavero.
 */
function ledger_keychain_delete(token) {
  const ssId = MountManager.getMount('ROOT');
  if (!ssId) return;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(KEYCHAIN_SHEET_NAME);
  if (!sheet) return;

  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(5000)) return;
    const data = sheet.getDataRange().getValues();
    const index = data.findIndex(row => row[0] === token);
    if (index !== -1) {
       sheet.deleteRow(index + 1);
       logInfo(`[ledger] Identidad eliminada físicamente: ${token}`);
    }
  } finally {
    lock.releaseLock();
  }
}

/**
 * Obtiene el ID de Drive de un componente de infraestructura (v4.40).
 * @param {string} key - La clave del componente (ej: 'workspaces', 'schemas').
 * @returns {string|null} El ID de Drive o null si no está mapeado.
 */
function ledger_infra_get(key) {
  const ssId = MountManager.getMount('ROOT');
  if (!ssId) return null;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(INFRA_SHEET_NAME);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const index = data.findIndex(row => row[0] === key);
  return index === -1 ? null : data[index][1];
}

/**
 * Registra o actualiza el mapeo de una carpeta de infraestructura (v4.40).
 */
function ledger_infra_sync(key, driveId, label) {
  const ssId = MountManager.getMount('ROOT') || ledger_initialize_new();
  const ss = SpreadsheetApp.openById(MountManager.getMount('ROOT'));
  const sheet = ss.getSheetByName(INFRA_SHEET_NAME) || ss.insertSheet(INFRA_SHEET_NAME);
  
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(5000)) return;
    const data = sheet.getDataRange().getValues();
    const rowData = [key, driveId, label || key, new Date().toISOString()];
    const index = data.findIndex(row => row[0] === key);
    if (index === -1) sheet.appendRow(rowData);
    else sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Registra o actualiza un proceso (Trigger/Tarea) en el Ledger (v4.42).
 */
function ledger_process_sync(triggerId, workflowId, status, error = '') {
  const ssId = MountManager.getMount('ROOT');
  if (!ssId) return;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(PROCESS_SHEET_NAME) || ss.insertSheet(PROCESS_SHEET_NAME);
  
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(5000)) return;
    const data = sheet.getDataRange().getValues();
    const rowData = [triggerId, workflowId, status, new Date().toISOString(), error, '{}'];
    const index = data.findIndex(row => row[0] === triggerId);
    if (index === -1) sheet.appendRow(rowData);
    else sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Busca un proceso por su ID de Trigger.
 */
function ledger_process_get(triggerId) {
  const ssId = readMasterLedgerId();
  if (!ssId) return null;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(PROCESS_SHEET_NAME);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  const index = data.findIndex(row => row[0] === triggerId);
  return index === -1 ? null : { 
    trigger_id: data[index][0], 
    workflow_id: data[index][1], 
    status: data[index][2] 
  };
}

/**
 * Elimina un proceso del Ledger por ID de Workflow.
 */
function ledger_process_delete_by_workflow(workflowId) {
  const ssId = readMasterLedgerId();
  if (!ssId) return;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(PROCESS_SHEET_NAME);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === workflowId) {
      sheet.deleteRow(i + 1);
    }
  }
}

/**
 * Reporta la salud y latencia de un proveedor al Ledger (v4.55).
 */
function ledger_health_report(providerId, latencyMs, error = null) {
  const ssId = MountManager.getMount('ROOT');
  if (!ssId) return;
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(HEALTH_SHEET_NAME) || ss.insertSheet(HEALTH_SHEET_NAME);
  
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(5000)) return;
    const data = sheet.getDataRange().getValues();
    const index = data.findIndex(row => row[0] === providerId);
    
    let currentFails = 0;
    if (index !== -1) {
      currentFails = Number(data[index][2] || 0);
    }

    if (error) currentFails++;
    else currentFails = 0; // Reset si la llamada es exitosa

    const status = currentFails >= 3 ? 'DEGRADED' : 'HEALTHY';
    const rowData = [providerId, status, currentFails, latencyMs, error || '', new Date().toISOString()];

    if (index === -1) sheet.appendRow(rowData);
    else sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Obtiene el estado de salud de un proveedor.
 */
function ledger_health_get(providerId) {
  const ssId = MountManager.getMount('ROOT');
  if (!ssId) return { status: 'UNKNOWN' };
  const ss = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(HEALTH_SHEET_NAME);
  if (!sheet) return { status: 'UNKNOWN' };

  const data = sheet.getDataRange().getValues();
  const index = data.findIndex(row => row[0] === providerId);
  if (index === -1) return { status: 'HEALTHY' };

  return {
    status: data[index][1],
    fail_count: data[index][2],
    last_latency: data[index][3]
  };
}

// ─── MOTOR DE GRAFOS RELACIONALES (v6.0) ──────────────────────────────────────

/**
 * Sincroniza un vínculo relacional en el Ledger correspondiente.
 * @param {string} sourceGid 
 * @param {string} targetGid 
 * @param {string} type - Tipo de vínculo (PARENT_OF, REFERENCES, etc).
 * @param {number} strength - Fuerza del vínculo (0.0 a 1.0).
 * @param {Object} contextUqo - Contexto para decidir en qué núcleo guardar.
 */
function ledger_sync_relation(sourceGid, targetGid, type, strength, contextUqo) {
  const targetSheet = _ledger_get_target_sheet_(contextUqo);
  const ss = targetSheet.getParent();
  const sheet = ss.getSheetByName(RELATIONS_SHEET_NAME) || ss.insertSheet(RELATIONS_SHEET_NAME);
  
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(5000)) throw new Error('RELATION_LOCK_TIMEOUT');

    const uid = `${sourceGid}_${targetGid}_${type}`;
    const rowData = [
      uid,
      sourceGid,
      targetGid,
      type,
      strength || 1.0,
      JSON.stringify({}),
      new Date().toISOString()
    ];

    const data = sheet.getDataRange().getValues();
    const index = data.findIndex(row => row[0] === uid);

    if (index === -1) {
      sheet.appendRow(rowData);
    } else {
      sheet.getRange(index + 1, 1, 1, rowData.length).setValues([rowData]);
    }
    logInfo(`[ledger] Vínculo registrado: ${type} (${sourceGid} -> ${targetGid})`);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Lista todas las relaciones que tienen como origen un átomo específico.
 */
function ledger_list_relations(sourceGid, contextUqo) {
  const targetSheet = _ledger_get_target_sheet_(contextUqo);
  const ss = targetSheet.getParent();
  const sheet = ss.getSheetByName(RELATIONS_SHEET_NAME);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  return data
    .filter(row => row[1] === sourceGid)
    .map(row => ({
      uid: row[0],
      source_gid: row[1],
      target_gid: row[2],
      type: row[3],
      strength: row[4],
      payload: row[5] ? JSON.parse(row[5]) : {},
      updated_at: row[6]
    }));
}
