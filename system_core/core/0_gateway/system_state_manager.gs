/**
 * =============================================================================
 * ARTEFACTO: 0_gateway/system_state_manager.gs
 * CAPA: 0 — Gateway Layer (Cerebro de Estado)
 * RESPONSABILIDAD: Cálculo determinista del nivel de consciencia/madurez del Core.
 * AXIOMA AX-052-4: El estado es monótonico (solo avanza). 
 * AXIOMA AX-052-5: Función pura — cálculo sin efectos secundarios.
 * =============================================================================
 */

const SYSTEM_STATE = Object.freeze({
  UNINITIALIZED: 0, // El Core no ha detectado a su dueño (Soberanía latente)
  PROVISIONING:  1, // Dueño identificado pero sin infraestructura Ledger
  ACTIVE:        2, // Sistema operativo pleno (Ledger montado)
  FEDERATED:     3  // (Futuro) Multi-core activo con malla relacional
});

const SystemStateManager = (function() {

  /**
   * Determina el estado actual consultando la persistencia de forma aislada.
   * @returns {number} Una de las constantes SYSTEM_STATE.*
   */
  function getState() {
    const store = PropertiesService.getScriptProperties();

    // ── NIVEL 0: SOBERANÍA LATENTE ──
    const ownerUid = store.getProperty('SYS_CORE_OWNER_UID');
    if (!ownerUid) {
      console.warn('[state_manager] Estado SISTÉMICO: 0 (UNINITIALIZED). El Core es huérfano.');
      return SYSTEM_STATE.UNINITIALIZED;
    }

    // ── NIVEL 1: PROVISIÓN PENDIENTE ──
    // El dueño existe pero no ha "firmado el pacto" o el Ledger no ha cristalizado.
    const isBootstrapped = store.getProperty('SYS_IS_BOOTSTRAPPED') === 'true';
    const rootMountId = store.getProperty('SYS_MOUNT_ROOT_ID');
    
    if (!isBootstrapped || !rootMountId) {
      console.warn('[state_manager] Estado SISTÉMICO: 1 (PROVISIONING). Dueño detectado pero núcleo inactivo.');
      return SYSTEM_STATE.PROVISIONING;
    }

    // ── NIVEL 2: CONSCIENCIA ACTIVA ──
    return SYSTEM_STATE.ACTIVE;
  }

  /**
   * Traduce el código de estado a un string legible para respuestas.
   * @param {number} stateCode 
   * @returns {string}
   */
  function getLabel(stateCode) {
    const labels = {
      0: 'UNINITIALIZED_IDENTITY',
      1: 'PROVISIONING_REQUIRED',
      2: 'CORE_ACTIVE',
      3: 'FEDERATED_MESH'
    };
    return labels[stateCode] || 'UNKNOWN_STATE';
  }

  return {
    getState,
    getLabel,
    STATES: SYSTEM_STATE
  };

})();
