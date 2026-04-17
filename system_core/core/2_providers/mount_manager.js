/**
 * =============================================================================
 * ARTEFACTO: 2_providers/mount_manager.gs
 * RESPONSABILIDAD: Gestión de volúmenes de almacenamiento (Ledgers).
 * AXIOMA: Virtualización de la persistencia (Mount Points).
 * =============================================================================
 */

const MountManager = (function() {

  /**
   * Resuelve el ID de Drive para un alias de montura específico.
   * @param {string} alias - El nombre de la montura (ej: 'ROOT', 'VAULT', 'DATA').
   * @returns {string|null} El ID de la Spreadsheet.
   */
  function getMount(alias = 'ROOT') {
    const key = `SYS_MOUNT_${alias.toUpperCase()}_ID`;
    const id = readConfig(key);
    
    if (!id && isBootstrapped()) {
      throw new Error(`[CRITICAL] MOUNT_POINT_MISSING: No se encontró el volumen de almacenamiento "${alias.toUpperCase()}".`);
    }

    return id;
  }

  /**
   * Registra una nueva montura en el sistema.
   * @param {string} alias - Nombre único.
   * @param {string} driveId - ID de la Spreadsheet.
   */
  function mount(alias, driveId) {
    if (!alias || !driveId) throw new Error('mount_manager: Alias y DriveId requeridos.');
    const key = `SYS_MOUNT_${alias.toUpperCase()}_ID`;
    storeConfig(key, driveId);
    logInfo(`[mount_manager] Volumen montado: ${alias} -> ${driveId}`);
  }

  /**
   * Desmonta un volumen.
   */
  function unmount(alias) {
    const key = `SYS_MOUNT_${alias.toUpperCase()}_ID`;
    deleteConfig(key);
    logInfo(`[mount_manager] Volumen desmontado: ${alias}`);
  }

  /**
   * Diagnóstico de todos los puntos de montaje activos.
   */
  function listMounts() {
    const mounts = { 'ROOT': getMount('ROOT') };
    return mounts;
  }

  /**
   * Desmonta un volumen.
   */
  function isBootstrapped() {
  const store = _getStore_();
  const rootMountId = store.getProperty('SYS_MOUNT_ROOT_ID');
  const isCerebroActive = store.getProperty('SYS_IS_BOOTSTRAPPED') === 'true';
  
  // AXIOMA DE SOBERANÍA (v4.61): Sin Mount ROOT no hay consciencia.
  if (!rootMountId && isCerebroActive) {
     console.error('[CRITICAL] El sistema está marcado como ACTIVO pero falta el MOUNT_ROOT.');
     return false;
  }

  return isCerebroActive && !!rootMountId;
}

  return {
    getMount: getMount,
    mount: mount,
    unmount: unmount,
    listMounts: listMounts
  };

})();
