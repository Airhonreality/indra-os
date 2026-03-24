/**
 * =============================================================================
 * ARTEFACTO: 4_support/system_physical_anchor.gs
 * RESPONSABILIDAD: Gestión soberana de la "física" del Core (ADR-019 Extra).
 * AXIOMA: El motor (GAS) debe residir dentro de su propio sistema (.core_system).
 * =============================================================================
 */

/**
 * Orquestador de la cristalización física del motor durante el Bootstrap.
 * Identifica si es Standalone o Bound y lo mueve a .core_system.
 */
function _system_anchorEngineToHome() {
  const homeRoot = _system_ensureHomeRoot(); // provider_system_infrastructure.gs
  const engineFileId = ScriptApp.getScriptId();
  const engineFile = DriveApp.getFileById(engineFileId);
  
  // 1. Detección Determinista del Tipo de Vida
  let physicalBody = engineFile;
  let lifeType = 'STANDALONE_GAS';
  
  try {
    const boundSheet = SpreadsheetApp.getActiveSpreadsheet();
    if (boundSheet) {
      physicalBody = DriveApp.getFileById(boundSheet.getId());
      lifeType = 'BOUND_SHEET';
      logInfo('[physical_anchor] Detectado: Container-bound (Google Sheet).');
    } else {
      logInfo('[physical_anchor] Detectado: Standalone GAS script.');
    }
  } catch (e) {
    logWarn('[physical_anchor] Fallo en detección bound. Asumiendo standalone.');
  }

  // 2. Traslado Físico al "Motor" (.core_system)
  const currentParentId = physicalBody.getParents().hasNext() ? physicalBody.getParents().next().getId() : null;
  const targetParentId = homeRoot.getId();

  if (currentParentId !== targetParentId) {
    logInfo(`[physical_anchor] Moviendo motor de "${currentParentId}" a "${targetParentId}"`);
    
    // El proceso de mover (reemplazar parents) garantiza soberanía física
    physicalBody.moveTo(homeRoot);
    
    // Guardar rastro de identidad física en persistencia de sistema
    storeConfig('SYS_PHYSICAL_LIFE_TYPE', lifeType);
    storeConfig('SYS_PHYSICAL_BODY_ID', physicalBody.getId());
    
    logInfo(`[physical_anchor] Motor blindado exitosamente en: ${HOME_ROOT_FOLDER_NAME_}`);
  } else {
    logInfo('[physical_anchor] El motor ya reside en .core_system. Omitiendo traslado.');
  }
  
  return { id: physicalBody.getId(), type: lifeType };
}
