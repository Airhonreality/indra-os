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
   * @param {string} alias - El nombre de la montura (ej: 'ROOT', 'VAULT', 'SOCIAL').
   * @returns {string|null} El ID de la Spreadsheet.
   */
  function getMount(alias = 'ROOT') {
    const key = `SYS_MOUNT_${alias.toUpperCase()}_ID`;
    const id = readConfig(key);
    
    // AXIOMA DE FALLO RUIDOSO: Si el sistema está despertando y falta el ROOT, error crítico.
    if (!id && alias.toUpperCase() === 'ROOT') {
      logWarn(`[mount_manager] MOUNT_POINT_MISSING: El volumen ROOT no está configurado.`);
    }

    return id;
  }

  /**
   * Registra una nueva montura en el sistema.
   * @param {string} alias - Nombre único del volumen (ROOT, SOCIAL, DATA).
   * @param {string} driveId - ID de la Google Spreadsheet.
   */
  function registerMount(alias, driveId) {
    if (!alias || !driveId) throw new Error('mount_manager: Alias y DriveId requeridos.');
    const key = `SYS_MOUNT_${alias.toUpperCase()}_ID`;
    storeConfig(key, driveId);
    logInfo(`[mount_manager] Volumen montado permanentemente: ${alias} -> ${driveId}`);
    return true;
  }

  /**
   * Elimina un punto de montaje.
   */
  function unmount(alias) {
    const key = `SYS_MOUNT_${alias.toUpperCase()}_ID`;
    deleteConfig(key);
    logInfo(`[mount_manager] Volumen desmontado: ${alias}`);
    return true;
  }

  return {
    getMount: getMount,
    registerMount: registerMount,
    unmount: unmount
  };

})();
