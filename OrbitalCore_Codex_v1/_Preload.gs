// ======================================================================
// 🛡️ SATTVA PRELOAD (Sustrato Axiomático)
// DHARMA: Capturar los métodos nativos de GAS antes de que cualquier
//         test o mock los altere. Este archivo DEBE estar en la raíz
//         para cargarse lo más temprano posible.
// 
// AXIOMAS:
// - Captura Temprana: Se ejecuta antes que cualquier test
// - Inmutabilidad: Object.freeze previene modificaciones
// - Disponibilidad Global: Asignación explícita a globalThis
// - Idempotencia: Re-ejecuciones no corrompen el registro
// - Trazabilidad: Logs claros de éxito/fallo
// ======================================================================

(function() {
  'use strict';
  
  // Prevenir re-inicialización
  if (globalThis._SATTVA_NATIVE) {
    console.warn('⚠️ [SATTVA] Registry ya existe. Saltando re-inicialización.');
    return;
  }
  
  const u = globalThis.Utilities;
  
  if (!u) {
    console.error('❌ [SATTVA] CRITICAL: globalThis.Utilities is UNDEFINED at preload time!');
    globalThis._SATTVA_NATIVE = Object.freeze({ Utilities: Object.freeze({}) });
    return;
  }
  
  const backup = {};
  const methods = [
    'newBlob', 'computeDigest', 
    'base64Encode', 'base64Decode', 'getUuid', 'getRandomBytes', 'sleep'
  ];
  
  let capturedCount = 0;
  methods.forEach(m => {
    if (typeof u[m] === 'function') {
      backup[m] = u[m].bind(u);
      capturedCount++;
    } else {
      console.warn(`⚠️ [SATTVA] Method '${m}' not found in Utilities`);
    }
  });
  
  // Preservar enumeraciones (Imprescindible para criptografía)
  if (u.CryptoAlgorithm) {
    backup.CryptoAlgorithm = u.CryptoAlgorithm;
  } else {
    console.warn('⚠️ [SATTVA] CryptoAlgorithm enum not found');
  }
  
  if (u.DigestAlgorithm) {
    backup.DigestAlgorithm = u.DigestAlgorithm;
  } else {
    console.warn('⚠️ [SATTVA] DigestAlgorithm enum not found');
  }
  
  // Asignación EXPLÍCITA a globalThis con inmutabilidad
  globalThis._SATTVA_NATIVE = Object.freeze({
    Utilities: Object.freeze(backup)
  });
  
  console.log(`✅ [SATTVA] Sustrato capturado: ${capturedCount}/${methods.length} métodos`);
})();
