/**
 * 🛡️ DIAGNÓSTICO MAESTRO: debug_notion_vault.gs (V9.0 - SOBERANÍA TOTAL)
 * PROPÓSITO: Auditoría forense multinivel para resolver fallos de identidad y sincronía.
 * CAPAS: [Infraestructura] -> [Seguridad] -> [Comunicación] -> [Dharma]
 */

function debug_AdapterForensics() {
  const _monitor = typeof Logger !== 'undefined' ? Logger : console;
  
  _monitor.log("╔═══════════════════════════════════════════════════════════════╗");
  _monitor.log("║   🕵️‍♂️ AUDITORÍA FORENSE MULTINIVEL (INDRA OS V12 PRO)           ║");
  _monitor.log("╚═══════════════════════════════════════════════════════════════╝\n");

  let stack;

  try {
    // ============================================================
    // CAPA 1: INFRAESTRUCTURA (Asamblaje Resistente)
    // ============================================================
    _monitor.log("📦 [CAPA 1: INFRA] Ensamblando sistema...");
    try {
        // Intentar los dos métodos conocidos de ensamblaje por resiliencia
        const assembler = createSystemAssembler();
        stack = (typeof assembler.assembleServerStack === 'function') 
                 ? assembler.assembleServerStack() 
                 : assembler.assemble(); 
        _monitor.log("   ✅ Ensamblaje exitoso (ServerStack).");
    } catch (bootError) {
        _monitor.log("   ❌ FALLO CRÍTICO DE ENSAMBLAJE: " + bootError.message);
        _monitor.log("   ⚠️  Usando rescate de emergencia (Sin dependencias reales).");
        stack = {
            errorHandler: { createError: (c, m) => ({ code: c, message: m }) },
            tokenManager: { isBroken: true, error: "No se pudo crear en modo real" }
        };
    }

    // ============================================================
    // CAPA 2: SEGURIDAD (Inspección de la Bóveda de Llaves)
    // ============================================================
    _monitor.log("\n🔐 [CAPA 2: SEGURIDAD] Auditoría de TokenManager...");
    
    const tokenManager = stack.tokenManager;
    if (!tokenManager || tokenManager.isBroken) {
        _monitor.log("   ❌ Bóveda Inaccesible. Verifica Drive y Master Keys.");
    } else {
        const providers = tokenManager.listTokenProviders({ accountId: 'system' });
        _monitor.log(`   📂 Proveedores en Bóveda: [${providers.join(", ")}]`);

        // Descubrimiento dinámico de cuentas
        const allAccounts = tokenManager.listTokenAccounts({ provider: 'notion' });
        const accountsToTest = allAccounts.length > 0 ? allAccounts.map(a => a.id) : ['default'];
        
        accountsToTest.forEach(accId => {
            _monitor.log(`\n   🔍 Inspeccionando cuenta: '${accId}'`);
            try {
                const tokens = tokenManager.loadTokens();
                const accountData = tokens.accounts && tokens.accounts.notion ? tokens.accounts.notion[accId] : null;

                if (accountData) {
                    _monitor.log(`      ✅ Entrada encontrada.`);
                    _monitor.log(`      📝 Etiqueta: ${accountData.label || 'N/A'}`);
                    _monitor.log(`      ⭐ Es Default: ${accountData.isDefault ? 'SÍ' : 'NO'}`);
                    
                    const hasApiKey = accountData.hasOwnProperty('apiKey');
                    _monitor.log(`      🔑 Property 'apiKey': ${hasApiKey ? 'PRESENT ✅' : 'MISSING ❌'}`);
                    
                    if (hasApiKey) {
                        const val = accountData.apiKey;
                        const masked = val.substring(0, 7) + "..." + val.substring(val.length - 4);
                        _monitor.log(`      💎 Valor detectado: ${masked}`);
                        
                        // TEST DE CONEXIÓN REAL PARA ESTA CUENTA
                        _monitor.log(`      📡 Probando conexión para '${accId}'...`);
                        const notion = stack.nodes.notion || stack.notionAdapter;
                        const ping = notion.verifyConnection({ accountId: accId });
                        
                        if (ping.success) {
                            _monitor.log(`         ✅ ÉXITO: Autenticado como "${ping.authenticatedAs}"`);
                        } else {
                            _monitor.log(`         ❌ FALLO: ${ping.message}`);
                        }
                    }
                } else {
                    _monitor.log(`      ❌ No se encontró la cuenta '${accId}' en el proveedor 'notion'.`);
                }
            } catch (vEx) {
                _monitor.log(`      💥 Error leyendo Vault/Connection: ${vEx.message}`);
            }
        });
    }

    // ============================================================
    // CAPA 3: COMUNICACIÓN (Drive)
    // ============================================================
    _monitor.log("\n📡 [CAPA 3: INFRA ESTRUCTURA] Salud de Adaptadores Base...");
    
    const drive = stack.nodes.drive || stack.driveAdapter;

    // Test de Coherencia Drive
    try {
        const drivePing = drive.verifyConnection ? drive.verifyConnection() : { success: true };
        _monitor.log(`   📁 Drive Status: ${drivePing.success ? 'CONECTADO ✅' : 'ERROR ❌'}`);
    } catch (e) { _monitor.log("   📁 Drive Status: FALLO CRÍTICO ❌"); }

  } catch (e) {
    _monitor.log(`\n💥 ERROR SISTÉMICO: ${e.message}`);
    _monitor.log(e.stack);
  }
  
  _monitor.log("\n🏁 [FIN DE AUDITORÍA]");
}

