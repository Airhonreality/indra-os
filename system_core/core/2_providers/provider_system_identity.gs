/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system_identity.js
 * RESPONSABILIDAD: Gestión de perfiles de usuario y reputación soberana.
 * AXIOMA: El Usuario es un Átomo Soberano.
 * =============================================================================
 */

const IdentityProvider = (function() {

  /**
   * CREA UN PERFIL SOBERANO (Axioma de Identidad Micelar).
   * El usuario se define como un conjunto de metadata protegida por una membrana lógica.
   * 
   * @axiom SHARDING: Los perfiles se guardan en el volumen 'SOCIAL' para no contaminar el ROOT.
   * @param {Object} uqo - Payload con handle.alias y public_key.
   */
  function createProfile(uqo) {
    const data = uqo.data;
    if (!data.payload?.email) throw new Error('identity_provider: Se requiere email para crear identidad.');

    logInfo(`[TRACE:identity] createProfile -> Email: ${data.payload.email} | WS: ${uqo.workspace_id}`);

    // 1. Resolver el Ledger destino (Workspace actual)
    const workspaceId = uqo.workspace_id || 'system';
    
    // 2. Definir Átomo de Identidad (Axioma de Identidad Micelar)
    const profileAtom = {
      handle: { 
        ns: 'com.indra.user', 
        alias: data.handle?.alias || data.payload.email.split('@')[0], 
        label: data.handle?.label || data.payload.name || data.payload.email 
      },
      class: 'IDENTITY',
      payload: {
        email: data.payload.email,
        name: data.payload.name || '',
        role: data.payload.role || 'GUEST',
        bio: data.payload.bio || '',
        avatar_url: data.payload.avatar_url || '',
        created_at: new Date().toISOString()
      }
    };

    // 3. Persistencia Delegada (Axioma de Mediación v18.0)
    // El Proveedor de Identidad ya no sabe nada de Sheets ni de Filas.
    // Simplemente le entrega el Átomo al Ledger para que lo registre.
    return ledger_register_identity({
        ...uqo,
        data: profileAtom
    });
  }

  /**
   * Obtiene un perfil por alias o ID.
   */
  function getProfile(identifier) {
    // Buscar en el Ledger (Filtrando por clase IDENTITY)
    const atoms = _ledger_get_bulk_metadata_(['IDENTITY']);
    const profile = atoms.find(a => a.alias === identifier || a.id === identifier);
    
    if (!profile) return { metadata: { status: 'NOT_FOUND' }, items: [] };

    return {
      items: [profile],
      metadata: { status: 'OK' }
    };
  }

  /**
   * VERIFICACIÓN CORPORATIVA (Axioma de Identidad Delegada).
   * Permite que un satélite externo (ERP) valide a un empleado vía email.
   * 
   * @axiom PROXY_AUTH: El empleado no sabe que Indra existe; el ERP actúa como delegado.
   * @param {string} email - Email de Google del empleado.
   * @returns {Object} Átomo de identidad con roles y permisos corporativos.
   */
  function verifyCorporateIdentity(email) {
    if (!email) throw new Error('identity_provider: Se requiere email para verificación.');

    // Buscar en el volumen CORPORATE (Fallback a SOCIAL si no existe el mount)
    const ssId = MountManager.getMount('CORPORATE') || MountManager.getMount('SOCIAL') || MountManager.getMount('ROOT');
    
    // Aquí implementamos una búsqueda rápida por payload.email
    const atoms = _ledger_get_bulk_metadata_(['IDENTITY']);
    const employee = atoms.find(a => a.payload && a.payload.email === email);

    if (!employee) {
      return { 
        metadata: { status: 'NOT_AUTHORIZED', error: 'Empleado no registrado en el directorio corporativo.' },
        items: []
      };
    }

    return {
      items: [employee],
      metadata: { status: 'OK', claims: employee.payload.roles || ['GUEST'] }
    };
  }

  /**
   * RESOLUCIÓN FÍSICA DE SATÉLITE (v13.1)
   * Carga las capacidades y el estado real de un agente desde su ADN.
   * @param {string} atomId - Drive ID del átomo SATELLITE.
   */
  function getSatelliteResolution(atomId) {
    if (!atomId) return null;
    try {
      const dna = infra_persistence_read(atomId);
      return {
        class: dna.class,
        scopes: dna.payload?.scopes || [],
        device_info: dna.payload?.device_info || {},
        last_sync: dna.updated_at
      };
    } catch (e) {
      logError(`[identity] Error resolviendo satélite ${atomId}: ${e.message}`);
      return null;
    }
  }

  return {
    createProfile: createProfile,
    getProfile: getProfile,
    verifyCorporateIdentity: verifyCorporateIdentity,
    getSatelliteResolution: getSatelliteResolution
  };

})();
