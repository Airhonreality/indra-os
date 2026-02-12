/**
 * RealityValidator.gs
 * DHARMA: Juez Implacable de Integridad y Protocolo (L8)
 */
function createRealityValidator({ monitoringService, errorHandler }) {

  const VERSION = '2.2.0';

  /**
   * Normalización de Estado de Realidad (Reality Envelope)
   * Extrae el payload y el sobre, resolviendo recursividad estructural.
   */
  function normalize(raw) {
    if (!raw) return { payload: null, envelope: null };
    
    let data = (typeof raw === 'string') ? JSON.parse(raw) : raw;
    
    if (data && data.envelope_version && data.payload) {
        // Resolución recursiva para evitar anidamiento de sobres
        if (data.payload.envelope_version && data.payload.payload) {
            return normalize(data.payload);
        }
        return { payload: data.payload, envelope: data };
    }
    
    return { payload: data, envelope: null }; // Materia Legacy
  }

  /**
   * Verificación de Bloqueo Atómico (Optimistic Locking)
   * AXIOMA V12: Relajación de Conflictos (ADR 003 - Snapshot Sovereignty)
   * 
   * En el modelo de Snapshots, la realidad local ES la verdad.
   * Los conflictos se LOGGEAN pero NO bloquean, excepto si se fuerza modo strict.
   */
  function verifyAtomicLock(physicalContent, clientHash) {
    if (!clientHash || clientHash === 'force') return true;
    if (!physicalContent) return true; // Create nuevo

    const { envelope } = normalize(physicalContent);
    
    if (envelope && envelope.revision_hash) {
      if (envelope.revision_hash !== clientHash) {
        // AXIOMA V12: LOGGER MODE (no blocker)
        // Solo logueamos el drift, NO lanzamos error
        const driftMessage = `[RealityValidator] ⚠️ Revision Drift Detected: Server [${envelope.revision_hash.substr(0,8)}] != Client [${clientHash.substr(0,8)}]. Allowing overwrite (Snapshot Sovereignty).`;
        
        if (monitoringService && monitoringService.logWarn) {
          monitoringService.logWarn(driftMessage);
        } else {
          console.warn(driftMessage);
        }
        
        // Si el cliente explícitamente quiere modo STRICT, lo respetamos
        if (clientHash === 'strict') {
          throw errorHandler.createError('STATE_CONFLICT', 
            `Conflicto de Edición (STRICT MODE): Servidor [${envelope.revision_hash.substr(0,8)}] != Cliente [${clientHash.substr(0,8)}]`
          );
        }
        
        // Por defecto: PERMITIR la sobrescritura (Soberanía de Snapshot)
        return true;
      }
    }
    return true;
  }

  /**
   * Validación Estructural de Artefactos (Legacy Logic)
   */
  function validate(artifact) {
    const { payload } = normalize(artifact);
    if (!payload || typeof payload !== 'object') return { valid: false, verdict: 'VERDICT_NULL_MATTER' };

    // Heurística de Coherencia mínima
    const hasIdentity = payload.identity && payload.identity.label;
    const hasSchema = !!payload.indx_schema;

    if (!hasIdentity && !hasSchema) {
       return { valid: false, verdict: 'VERDICT_INCOHERENT' };
    }

    return { valid: true, verdict: 'VERDICT_COHERENT' };
  }

  return Object.freeze({
    id: 'validator',
    normalize,
    verifyAtomicLock,
    validate,
    VERSION
  });
}
