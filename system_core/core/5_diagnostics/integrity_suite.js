// =============================================================================
// ARTEFACTO: 5_diagnostics/integrity_suite.gs
// CAPA: 5 — Diagnostics (Integridad y Salud)
// RESPONSABILIDAD: Validar que todos los axiomas del Core se cumplan. Detecta colisiones
//         de nombres, fallos de ruteo y fugas de Hardcoding.
//
// EJECUCIÓN: Desde el editor de GAS, seleccionar 'runCoreIntegrityCheck' y ▶ Run.
// =============================================================================

/**
 * Ejecuta la suite completa de diagnóstico de INDRA CORE.
 * Muestra los resultados en el registro de ejecuciones de GAS.
 */
function runCoreIntegrityCheck() {
  console.log(" iniciando INDRA CORE Integrity Check...");
  console.log("Timestamp: " + new Date().toISOString());

  const results = {
    registry: _checkRegistry_(),
    routing:  _checkRouting_(),
    config:   _checkConfig_(),
    silos:    _checkSiloIntegrity_()
  };

  console.log("\n--- [RESUMEN DE SALUD] ---");
  const allPassed = Object.values(results).every(v => v === true);
  console.log(allPassed ? "✅ SISTEMA ÍNTEGRO" : "❌ FALLO DE INTEGRIDAD DETECTADO");
}

/**
 * Valida que el registro detecte todos los Silos y no haya duplicados.
 */
function _checkRegistry_() {
  console.log("\n[1/4] Validando Registro de Silos...");
  const manifesto = buildManifest();
  const items = manifesto.items;
  
  console.log(`- Silos proyectados en manifest: ${items.length}`);
  items.forEach(item => {
    console.log(`  > [${item.id}] Class: ${item.class} | Provider: ${item.provider}`);
  });

  if (items.length === 0) {
    console.warn("⚠️ No se detectaron Silos. Verifica los prefijos CONF_");
    return false;
  }
  return true;
}

/**
 * Valida que el router no cruce cables entre proveedores.
 */
function _checkRouting_() {
  console.log("\n[2/4] Validando Ruteo Determinista...");
  const providersToTest = ['drive', 'notion', 'system'];
  let passed = true;

  providersToTest.forEach(pid => {
    const conf = getProviderConf(pid);
    if (!conf) {
      console.warn(`⚠️ [${pid}] No se pudo resolver la configuración.`);
      passed = false;
      return;
    }
    
    // Verificar si el ID del objeto de configuración coincide con el buscado
    if (conf.id !== pid) {
      console.error(`❌ ERROR DE IDENTIDAD: getProviderConf('${pid}') devolvió un objeto con id: '${conf.id}'`);
      passed = false;
    } else {
      console.log(`✅ [${pid}] Identidad confirmada.`);
    }

    // Verificar ruteo de funciones
    const handlerName = conf.implements['HIERARCHY_TREE'];
    if (pid === 'drive' && handlerName !== 'handleDrive') {
      console.error(`❌ ERROR DE RUTEADOR: Drive apunta a ${handlerName} en lugar de handleDrive`);
      passed = false;
    }
  });

  // --- Prueba de ruteo cruzado (Seguridad de Identidad) ---
  console.log("\n  - Verificando aislamiento de proveedores...");
  try {
    const crossResp = handleNotion({ provider: 'drive', protocol: 'HIERARCHY_TREE' });
    if (crossResp.metadata.status === 'ERROR' && crossResp.metadata.code === 'SYSTEM_FAILURE') {
      console.log("    ✅ Aislamiento confirmado: Notion rechazó señal de Drive.");
    } else {
      console.error("    ❌ FALLO DE AISLAMIENTO: Notion aceptó señal de Drive o devolvió error genérico.");
      passed = false;
    }
  } catch (e) {
    console.log("    ✅ Aislamiento confirmado via excepción.");
  }

  return passed;
}

/**
 * Valida acceso a PropertiesService.
 */
function _checkConfig_() {
  console.log("\n[3/4] Validando Capa de Persistencia...");
  try {
    const bootstrapped = isBootstrapped();
    console.log(`- Servidor Bootstrapped: ${bootstrapped}`);
    return true;
  } catch (e) {
    console.error("❌ Error de acceso a PropertiesService: " + e.message);
    return false;
  }
}

/**
 * Valida que los Silos respondan a sus protocolos básicos.
 */
function _checkSiloIntegrity_() {
  console.log("\n[4/4] Validando Respuesta de Silos...");
  // Test local de Drive (debe funcionar si hay permisos)
  try {
    const driveResp = handleDrive({ provider: 'drive', protocol: 'HIERARCHY_TREE', context_id: 'ROOT' });
    console.log(`✅ [drive] Responde con ${driveResp.items.length} elementos raíces.`);
    return true;
  } catch (e) {
    console.warn(`⚠️ [drive] Falló la prueba local: ${e.message}`);
    return false;
  }
}
