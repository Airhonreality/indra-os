/**
 * ProtocolTransmitter.gs
 * DHARMA: Embajador de Capa Física (L8)
 * 
 * @param {Object} deps - Dependencias inyectadas.
 * @param {Object} deps.driveAdapter - Adaptador de Drive.
 * @param {Object} deps.monitoringService - Servicio de monitoreo.
 */
function createProtocolTransmitter({ driveAdapter, monitoringService }) {
  
  const IMMUTABLE_MODE = false;
  const PAGE_SIZE_LIMIT = 20;

  function read(fileId, options = {}) {
    try {
      const data = driveAdapter.retrieve({ fileId: fileId });
      if (!data || !data.content) {
        throw new Error("EMPTY_SIGNAL: El transmisor recibió una señal vacía.");
      }
      return typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
    } catch (e) {
      if (monitoringService) monitoringService.logError('ProtocolTransmitter', `❌ Error de Lectura: ${e.message}`);
      throw e;
    }
  }

  function write(fileId, content) {
    if (IMMUTABLE_MODE) {
      throw new Error("INTERDICTION: Transmisor en modo Inmutable. Escritura bloqueada.");
    }
    try {
      const payload = typeof content !== 'string' ? JSON.stringify(content, null, 2) : content;
      // USAMOS 'upload' que es el alias canónico de 'store' en DriveAdapter
      return driveAdapter.upload({ fileId: fileId, content: payload });
    } catch (e) {
      const errorMsg = `❌ Error de Escritura en [${fileId}]: ${e.message}`;
      if (monitoringService) monitoringService.logError('ProtocolTransmitter', errorMsg);
      throw new Error(errorMsg);
    }
  }

  function lockCheck(fileId) {
    try {
      if (!fileId) return { exists: false, error: "Missing fileId" };
      
      // AXIOMA: Los IDs temporales no existen en la capa física.
      if (fileId.toString().startsWith('temp_')) {
        return { exists: false, status: 'VIRTUAL', reason: 'TEMPORARY_ID' };
      }

      const file = DriveApp.getFileById(fileId);
      if (!file) return { exists: false, error: "File reference null" };

      const result = {
        exists: true,
        trashed: false,
        updatedAt: new Date().getTime().toString()
      };

      try { result.trashed = file.isTrashed(); } catch(e) {}
      try { result.updatedAt = file.getLastUpdated().getTime().toString(); } catch(e) {}
      
      try {
        const user = Session.getActiveUser();
        if (user) result.access = file.getAccess(user);
      } catch(e) {
        result.access = 'UNKNOWN';
      }

      return result;
    } catch (e) {
      if (monitoringService) monitoringService.logWarn('ProtocolTransmitter', `📴 lockCheck no encontró ID [${fileId}]: ${e.message}`);
      return { exists: false, error: e.message };
    }
  }

  return Object.freeze({
    id: 'protocol_transmitter',
    read,
    write,
    lockCheck,
    isImmutable: () => IMMUTABLE_MODE
  });
}





