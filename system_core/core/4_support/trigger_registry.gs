/**
 * =============================================================================
 * ARTEFACTO: 4_support/trigger_registry.gs
 * RESPONSABILIDAD: Persistencia del mapeo de disparadores externos (Soberanía).
 * AXIOMA: Sinceridad de Enlace. El mundo exterior no conoce el ID interno.
 * =============================================================================
 */

const TRIGGER_REGISTRY_FILE_ = 'TriggerRegistry';

/**
 * Registra un nuevo mapeo de Webhook.
 * @param {string} workflowId - ID del workflow interno.
 * @param {string} ownerId - Email del dueño.
 * @returns {string} El webhook_id generado (UUID).
 */
function trigger_registry_register(workflowId, ownerId) {
  const webhookId = Utilities.getUuid();
  const ss = _trigger_registry_getSS();
  const sheet = ss.getSheets()[0];
  
  sheet.appendRow([
    webhookId,
    workflowId,
    ownerId,
    new Date().toISOString(),
    'ACTIVE'
  ]);
  
  return webhookId;
}

/**
 * Busca un mapeo por webhookId.
 * @returns {Object|null}
 */
function trigger_registry_resolve(webhookId) {
  const ss = _trigger_registry_getSS();
  const data = ss.getSheets()[0].getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === webhookId && data[i][4] === 'ACTIVE') {
      return {
        webhook_id: data[i][0],
        workflow_id: data[i][1],
        owner_id: data[i][2]
      };
    }
  }
  return null;
}

/**
 * Obtiene o crea la hoja de registro en .core_system.
 * @private
 */
function _trigger_registry_getSS() {
  const root = _system_ensureHomeRoot();
  const files = root.getFilesByName(TRIGGER_REGISTRY_FILE_);
  
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    const ss = SpreadsheetApp.create(TRIGGER_REGISTRY_FILE_);
    const file = DriveApp.getFileById(ss.getId());
    root.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    
    const sheet = ss.getSheets()[0];
    sheet.appendRow(['webhook_id', 'workflow_id', 'owner_id', 'created_at', 'status']);
    sheet.setFrozenRows(1);
    return ss;
  }
}
