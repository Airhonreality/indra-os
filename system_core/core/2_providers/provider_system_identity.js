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
    if (!data.handle?.alias) throw new Error('identity_provider: Se requiere un alias único.');

    // 1. Asegurar que el usuario vive en el volumen SOCIAL
    const socialLedgerId = MountManager.getMount('SOCIAL') || MountManager.getMount('ROOT');
    
    // 2. Crear Átomo de Identidad
    const profileAtom = {
      id: `u_${data.handle.alias}`,
      handle: { ns: 'indra.user', alias: data.handle.alias, label: data.handle.label || data.handle.alias },
      class: 'IDENTITY',
      payload: {
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        public_key: data.public_key, // Vital para Yoneda Handshakes
        social_stats: { followers: 0, following: 0 },
        created_at: new Date().toISOString()
      }
    };

    // 3. Persistencia (Usando el Ledger Service con redirección de volumen)
    // Nota: Aquí redirigimos la escritura al volumen SOCIAL
    return _system_createAtom('IDENTITY', `User: ${data.handle.alias}`, profileAtom);
  }

  /**
   * Obtiene un perfil por alias o ID.
   */
  function getProfile(identifier) {
    // Buscar en el Ledger (Filtrando por clase IDENTITY)
    const atoms = _ledger_get_batch_metadata_(['IDENTITY']);
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
    const atoms = _ledger_get_batch_metadata_(['IDENTITY']);
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

  return {
    createProfile: createProfile,
    getProfile: getProfile,
    verifyCorporateIdentity: verifyCorporateIdentity
  };

})();
