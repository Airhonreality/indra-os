/**
 * 🕵️‍♂️ IDENTITY_FORENSIC_AUDIT (V1.0)
 * Dharma: Detectar llaves huérfanas, nodos fantasma y residuos de identidad hardcodeada.
 */
function runIdentityForensicAudit() {
  const assembler = createSystemAssembler();
  const stack = assembler.assembleServerStack();
  const tokenManager = stack.tokenManager;
  const nodes = stack.nodes;

  Logger.log("🚀 INICIANDO AUDITORÍA FORENSE DE IDENTIDAD");
  Logger.log("==========================================");

  const results = {
    hardcodedResidues: [],
    orphanKeys: [],
    ghostNodes: [],
    validationFailures: []
  };

  // 1. CARGAR BÓVEDA
  const tokens = tokenManager.loadTokens();
  const vaultProviders = Object.keys(tokens.accounts || {});

  // 2. ESCANEO DE RESIDUOS HARDCODEADOS (PUNTO CRÍTICO)
  Logger.log("\n🔍 Escaneando residuos de 'INDRA_USER'...");
  vaultProviders.forEach(provider => {
    if (tokens.accounts[provider]['INDRA_USER']) {
      results.hardcodedResidues.push(`${provider}/INDRA_USER`);
      Logger.log(`⚠️ ALERTA: Residuo detectado en ${provider}: INDRA_USER`);
    }
  });

  // 3. DETECCIÓN DE LLAVES HUÉRFANAS (Orphan Keys)
  Logger.log("\n🔍 Buscando llaves huérfanas (Credenciales sin Adaptador)...");
  vaultProviders.forEach(provider => {
    if (!nodes[provider]) {
      results.orphanKeys.push(provider);
      Logger.log(`❓ HUÉRFANA: Proveedor '${provider}' tiene llaves pero no existe en el NodeRegistry.`);
    }
  });

  // 4. DETECCIÓN DE NODOS FANTASMA (Ghost Nodes)
  Logger.log("\n🔍 Buscando nodos fantasma (Adaptadores sin Credenciales)...");
  Object.keys(nodes).forEach(key => {
    const node = nodes[key];
    if (node && (node.archetype === 'ADAPTER' || node.archetypes?.includes('ADAPTER'))) {
      if (!tokens.accounts[key] || Object.keys(tokens.accounts[key]).length === 0) {
        // Excepción: Google Drive suele usar el token del Script, no necesariamente el Vault
        if (key !== 'drive' && key !== 'sheet') {
          results.ghostNodes.push(key);
          Logger.log(`👻 FANTASMA: El adaptador '${key}' está activo pero no tiene cuentas en el Vault.`);
        }
      }
    }
  });

  // 5. VALIDACIÓN DE INTEGRIDAD DE LLAVES
  Logger.log("\n🔍 Validando integridad de llaves existentes...");
  vaultProviders.forEach(provider => {
    Object.keys(tokens.accounts[provider]).forEach(accId => {
      const acc = tokens.accounts[provider][accId];
      if (!acc.apiKey) {
        results.validationFailures.push(`${provider}/${accId}`);
        Logger.log(`🚨 CORRUPCIÓN: La cuenta ${provider}/${accId} carece de 'apiKey'.`);
      }
    });
  });

  Logger.log("\n==========================================");
  Logger.log("📊 RESUMEN DE AUDITORÍA");
  Logger.log(`✅ Proveedores en Vault: ${vaultProviders.length}`);
  Logger.log(`⚠️ Residuos Hardcodeados: ${results.hardcodedResidues.length}`);
  Logger.log(`❓ Llaves Huérfanas: ${results.orphanKeys.length}`);
  Logger.log(`👻 Nodos Fantasma: ${results.ghostNodes.length}`);
  Logger.log(`🚨 Fallos de Integridad: ${results.validationFailures.length}`);
  Logger.log("==========================================");

  return results;
}
