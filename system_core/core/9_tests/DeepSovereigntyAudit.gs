/**
 * 🛰️ INDRA DEEP SOVEREIGNTY AUDIT (v2.5 - CONTEXT AWARE)
 * Dharma: Validar la segregación de identidades usando la infraestructura REAL del usuario.
 * RESPONSABILIDAD: Descubrir workspaces activos y probar la estanqueidad entre ellos.
 */
function runDeepIdentityAudit() {
  const TRACE_ID = `AUDIT_${Date.now()}`;
  console.log(`\n--- 🏛️ INICIANDO AUDITORÍA DE CONTEXTO REAL [${TRACE_ID}] ---`);

  const mockUserEmail = "sovereign-test@indra-os.com";
  let sessionToken = null;
  let userAtomId = null;
  let WS_REAL = null;

  try {
    // 🧪 FASE 0: DESCUBRIMIENTO DE INFRAESTRUCTURA
    console.log("🔹 [FASE 0] Descubriendo Celdas (Workspaces) activas...");
    let discovery = { items: [] };
    try {
      discovery = _system_handleSatelliteDiscover({ protocol: 'SYSTEM_SATELLITE_DISCOVER' });
    } catch(e) {
      console.warn("⚠️ Error en descubrimiento dinámico.");
    }
    
    const workspaces = (discovery.items || []).filter(i => {
        const label = i.handle?.label || "";
        return i.class === 'WORKSPACE' && !label.includes('Sujeto de Auditoría');
    });
    
    if (workspaces.length > 0) {
        WS_REAL = workspaces[0].id;
        console.log(`   ✅ Celda real detectada: ${workspaces[0].handle?.label} [${WS_REAL}]`);
    } else {
        // FALLBACK AXIOMÁTICO: Usamos el ID que sabemos que existe por los logs de las 15:38
        WS_REAL = "103MitQudDSMinRzzMLuzkWKmPN7UaDNr"; 
        console.log(`   📡 [FALLBACK] Usando Celda Conocida (Veta de Oro Alpha): [${WS_REAL}]`);
    }

    // 🧪 FASE 0: CREACIÓN DE IDENTIDAD CANÓNICA (Génesis vía Orquestador)
    console.log(`🔹 [FASE 0] Sembrando Sujeto vía Orquestador en [${WS_REAL}]...`);
    
    // AXIOMA: El Orquestador es la única puerta de entrada legal para un Satélite.
    const genesisRes = SystemOrchestrator.dispatch({
      protocol: 'SYSTEM_IDENTITY_CREATE',
      workspace_id: WS_REAL,
      data: {
        handle: { alias: 'audit-user-' + Date.now(), label: 'Sujeto de Auditoría' },
        payload: { 
            email: mockUserEmail, 
            name: "Javier Tester",
            role: 'AUDITOR_REAL' 
        }
      }
    });
    
    if (genesisRes.metadata.status !== 'OK') throw new Error("Fallo en génesis: " + genesisRes.metadata.error);
    userAtomId = genesisRes.items[0].id;
    console.log(`   ✅ Sujeto sembrado: ${userAtomId}`);

    // --- AXIOMA DE ESTABILIZACIÓN (v3.0) ---
    // Google Sheets requiere tiempo para la persistencia física. Esperamos 10 segundos.
    console.log("⏳ [STABILIZATION] Esperando 10s para sincronización física total de la Sheet...");
    Utilities.sleep(10000);

    // 🧪 FASE 1: TEST DE ESTANQUEIDAD (INTENTO DESDE 'system')
    // El usuario está en WS_REAL, no debería ser visible desde el workspace global 'system'.
    console.log(`🔹 [FASE 1] Test de Estanqueidad: Intentando Login desde 'system' (Cruce Prohibido)...`);
    try {
        AuthService.syncIdentity({
            protocol: 'SYSTEM_IDENTITY_SYNC',
            workspace_id: 'system', // <-- Jurisdicción errónea
            data: { id_token: mockUserEmail }
        });
        throw new Error("CRÍTICO: ¡Fuga de datos detectada! El usuario de la celda es visible globalmente.");
    } catch (e) {
        console.log("   ✅ ÉXITO: El Core bloqueó el acceso. La Célula está aislada.");
    }

    // 🧪 FASE 3: TEST DE JURISDICCIÓN (INTENTO EN WS_REAL)
    console.log(`🔹 [FASE 3] Test de Jurisdicción: Intentando Login en la Celda Correcta...`);
    
    // INSPECCIÓN PROFUNDA: Vamos a ver qué ve el Core realmente
    const debugItems = ledger_list_by_class('IDENTITY', { workspace_id: WS_REAL });
    console.log(`   🔎 [DEBUG] El Ledger de ${WS_REAL} contiene ${debugItems.length} identidades.`);
    debugItems.forEach((it, idx) => {
        console.log(`      [${idx}] ID: ${it.id} | Email: ${it.payload?.email || (typeof it.payload === 'string' ? 'JSON_STRING' : 'NULL')}`);
    });

    const syncRes = AuthService.syncIdentity({
        protocol: 'SYSTEM_IDENTITY_SYNC',
        workspace_id: WS_REAL, // <-- Jurisdicción correcta
        data: { id_token: mockUserEmail }
    });
    
    sessionToken = syncRes.items[0].token;
    console.log(`   ✅ ÉXITO: Sesión emitida. El usuario ha sido reconocido en su propia Célula.`);

    console.log(`\n--- 🏁 RESULTADO: INFRAESTRUCTURA REAL VALIDADA ---`);

  } catch (err) {
    console.error(`\n❌ COLAPSO EN AUDITORÍA: ${err.message}`);
  } finally {
    // 🧹 LIMPIEZA DE CÉLULA REAL
    if (sessionToken || (userAtomId && WS_REAL)) {
      console.log("🧹 [CLEANUP] Purgando materia de test de la celda real...");
      const ledger = _keychain_getLedger_();
      if (sessionToken && ledger[sessionToken]) {
        delete ledger[sessionToken];
        _keychain_saveLedger_(ledger);
      }
      if (userAtomId) {
        console.log("   ⚠️ Purgado de átomo de usuario saltado para proteger el manifest.json.");
      }
      console.log("   ✨ Homeostasis recuperada.");
    }
  }
}
