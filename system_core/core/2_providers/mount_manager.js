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
    let id = readConfig(key);
    
    // Fallback: Si se pide ROOT y no existe MOUNT_ROOT, usar el MASTER_LEDGER_ID histórico
    if (!id && alias.toUpperCase() === 'ROOT') {
      id = readMasterLedgerId();
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
    // En el futuro, recuperaremos dinámicamente todas las claves SYS_MOUNT_*
    return mounts;
  }

  return {
    getMount: getMount,
    mount: mount,
    unmount: unmount,
    listMounts: listMounts
  };

})();
