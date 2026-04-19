/**
 * =============================================================================
 * ARTEFACTO: 5_diagnostics/sonde_satellite_crystallize.gs
 * RESPONSABILIDAD: Verificar la cristalización de agentes soberanos (v13.0).
 * =============================================================================
 */

function SONDE_SATELLITE_CRYSTALLIZE() {
  logInfo("🚀 Iniciando Sonda de Cristalización Satelital...");
  
  try {
    // 1. Handshake Inicial (Cristalización)
    logInfo("[1] Solicitando inicialización de nuevo Satélite...");
    const initRes = SYSTEM_SATELLITE_INITIALIZE({
      data: {
        name: "Satélite_Prueba_Sincera",
        discovery_secret: "indra_satellite_omega", // Secreto por defecto
        device_info: { OS: "Indra-Diagnostic-Probe", version: "1.0" }
      }
    });

    if (initRes.metadata.status !== 'OK') throw new Error(initRes.metadata.error);
    
    const token = initRes.items[0].token;
    const atomId = initRes.items[0].atom_id;
    logSuccess(`[sonde] Satélite cristalizado. Token: ${token} | ADN: ${atomId}`);

    // 2. Verificación de Sinceridad (Auth Check)
    logInfo("[2] Verificando reconocimiento de identidad por el Bridge...");
    const authContext = AuthService.authorize({ 
      protocol: 'HEALTH_CHECK', 
      satellite_token: token 
    }, ProtocolRegistry.resolve('HEALTH_CHECK'));

    if (!authContext || authContext.identity_type !== 'SATELLITE') {
      throw new Error("El Bridge no reconoció la identidad satelital atómica.");
    }
    
    logSuccess(`[sonde] Reconocimiento exitoso: ${authContext.label} [${authContext.class}]`);
    logInfo(`[sonde] ID Atómico Vinculado: ${authContext.atom_id}`);

    logSuccess("\n🏁 SONDA COMPLETADA: EL PUENTE ES HONESTO Y EL SATÉLITE ES SOBERANO.");

  } catch (e) {
    logError(`\n❌ FALLO EN LA CRISTALIZACIÓN: ${e.message}`);
  }
}
