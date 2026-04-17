/**
 * =============================================================================
 * ARTEFACTO: 2_providers/mount_manager.gs
 * RESPONSABILIDAD: Gestión de volúmenes de almacenamiento (Ledgers).
 * AXIOMA: Virtualización de la persistencia (Mount Points).
 * =============================================================================
 */

const MountManager = (function() {

  const _transientMounts = {}; // Memoria efímera v5.1

  function getMount(alias = 'ROOT') {
    const canonicalAlias = alias.toUpperCase();
    if (_transientMounts[canonicalAlias]) return _transientMounts[canonicalAlias];

    const key = `SYS_MOUNT_${canonicalAlias}_ID`;
    const id = readConfig(key);
    if (!id && canonicalAlias === 'ROOT') logWarn(`[mount_manager] ROOT MISSING.`);
    return id;
  }

  function mountTransient(alias, driveId) {
    if (!alias || !driveId) return false;
    _transientMounts[alias.toUpperCase()] = driveId;
    return true;
  }

  function registerMount(alias, driveId) {
    if (!alias || !driveId) throw new Error('Alias/ID Req.');
    const key = `SYS_MOUNT_${alias.toUpperCase()}_ID`;
    storeConfig(key, driveId);
    return true;
  }

  function unmount(alias) {
    const key = `SYS_MOUNT_${alias.toUpperCase()}_ID`;
    deleteConfig(key);
    delete _transientMounts[alias.toUpperCase()];
    return true;
  }

  return {
    getMount: getMount,
    mountTransient: mountTransient,
    registerMount: registerMount,
    mount: registerMount, 
    unmount: unmount
  };

})();
