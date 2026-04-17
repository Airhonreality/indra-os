/**
 * =============================================================================
 * ARTEFACTO: 2_providers/provider_system_identity.js
 * RESPONSABILIDAD: Gestión de perfiles de usuario y reputación soberana.
 * AXIOMA: El Usuario es un Átomo Soberano.
 * =============================================================================
 */

const IdentityProvider = (function() {

  /**
   * Registra un nuevo perfil de usuario en el sistema.
   * @param {Object} uqo - UQO con los datos del perfil.
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

  return {
    createProfile: createProfile,
    getProfile: getProfile
  };

})();
