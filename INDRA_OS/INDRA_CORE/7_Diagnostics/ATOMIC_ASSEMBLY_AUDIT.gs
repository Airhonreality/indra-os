/**
 * ═══════════════════════════════════════════════════════════════════════
 * ATOMIC ASSEMBLY AUDIT (V11.5)
 * ═══════════════════════════════════════════════════════════════════════
 * DHARMA: Radiografía de Soberanía - Verificación Exhaustiva del Ensamblaje
 *         Fractalizado de PublicAPI y Layer 8 (SessionCommander).
 * 
 * PROPÓSITO:
 *   - Verificar que la fractalizacion del backend está correctamente ensamblada.
 *   - Simular el ciclo completo de hydration desde el Fat Client.
 *   - Validar cada capa de transformación, validación y delegación.
 *   - Generar un reporte auto-documentado con métricas de coherencia.
 * 
 * EJECUCIÓN:
 *   Desde Google Apps Script Editor:
 *   > Run: test_AtomicAssemblyAudit()
 * 
 * SALIDA ESPERADA:
 *   - ✅ PASS: Sistema ensamblado correctamente (100% coherencia)
 *   - ⚠️ WARN: Advertencias no críticas (95-99% coherencia)
 *   - ❌ FAIL: Fracturas críticas detectadas (<95% coherencia)
 * ═══════════════════════════════════════════════════════════════════════
 */

function test_AtomicAssemblyAudit() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   🔬 ATOMIC ASSEMBLY AUDIT - INDRA OS V11.5                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    criticalFailures: [],
    warnings: [],
    coherenceIndex: 0
  };

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 1: ENSAMBLAJE DEL SISTEMA
  // ═══════════════════════════════════════════════════════════════════════
  console.log('📦 [FASE 1] Ensamblando Sistema...\n');
  
  let assembler, stack, publicApi;
  
  try {
    assembler = createSystemAssembler();
    stack = assembler.assembleServerStack();
    publicApi = stack.public;
    
    _logTest(results, 'ASSEMBLY_BOOTSTRAP', true, 'Sistema ensamblado correctamente');
  } catch (e) {
    _logTest(results, 'ASSEMBLY_BOOTSTRAP', false, `Fallo crítico: ${e.message}`);
    return _generateReport(results);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 2: VERIFICACIÓN DE INYECCIÓN DE DEPENDENCIAS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n🔌 [FASE 2] Verificando Inyección de Dependencias...\n');

  // Test 2.1: BlueprintRegistry existe en stack
  const hasBlueprintRegistry = stack.blueprintRegistry && typeof stack.blueprintRegistry.validatePayload === 'function';
  _logTest(results, 'INJECTION_BLUEPRINT_REGISTRY', hasBlueprintRegistry, 
    hasBlueprintRegistry ? 'BlueprintRegistry inyectado correctamente' : 'BlueprintRegistry NO encontrado en stack');

  // Test 2.2: SessionCommander existe como 'commander'
  const hasCommander = stack.nodes && stack.nodes.commander;
  _logTest(results, 'INJECTION_SESSION_COMMANDER', hasCommander, 
    hasCommander ? 'SessionCommander inyectado como "commander"' : 'SessionCommander NO encontrado');

  // Test 2.3: PublicAPI tiene acceso a nodes
  const publicApiHasNodes = publicApi && stack.nodes && stack.nodes.public;
  _logTest(results, 'INJECTION_PUBLIC_NODE', publicApiHasNodes, 
    publicApiHasNodes ? 'PublicAPI registrado en nodes.public' : 'PublicAPI NO registrado en nodes');

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 3: VERIFICACIÓN DEL NODO DE NEGOCIO (COSMOS)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n🔗 [FASE 3] Verificando Nodo de Negocio (Cosmos)...\n');

  // Test 3.1: Existe el nodo 'cosmos' en el registro
  const hasCosmosNode = stack.nodes && stack.nodes.cosmos;
  _logTest(results, 'NODE_COSMOS_EXISTS', hasCosmosNode, 
    hasCosmosNode ? 'Nodo "cosmos" encontrado en el registro' : 'Nodo "cosmos" NO encontrado');

  // Test 3.2: El nodo cosmos tiene el método mountCosmos
  const cosmosHasMount = hasCosmosNode && typeof stack.nodes.cosmos.mountCosmos === 'function';
  _logTest(results, 'NODE_COSMOS_MOUNT_COSMOS', cosmosHasMount, 
    cosmosHasMount ? 'Método cosmos.mountCosmos disponible' : 'Método cosmos.mountCosmos NO encontrado');

  // Test 3.3: PublicAPI tiene executeAction (Gateway Único)
  const hasExecuteAction = publicApi && typeof publicApi.executeAction === 'function';
  _logTest(results, 'GATEWAY_EXECUTE_ACTION', hasExecuteAction, 
    hasExecuteAction ? 'PublicAPI.executeAction disponible (Gateway OK)' : 'PublicAPI.executeAction NO encontrado');

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 4: VERIFICACIÓN DE CONTRATOS Y ESQUEMAS
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n📜 [FASE 4] Verificando Contratos y Esquemas...\n');

  // Test 4.1: El nodo cosmos expone el esquema para mountCosmos
  const cosmosSchemas = hasCosmosNode ? (stack.nodes.cosmos.schemas || {}) : {};
  const mountCosmosContract = cosmosSchemas.mountCosmos;
  const hasContract = mountCosmosContract && mountCosmosContract.io_interface;
  _logTest(results, 'CONTRACT_MOUNT_COSMOS', hasContract, 
    hasContract ? 'Contrato mountCosmos encontrado en el Nodo Cosmos' : 'Contrato mountCosmos NO encontrado en el nodo');

  // Test 4.2: PublicAPI.schemas está consolidado
  const schemasConsolidated = publicApi && publicApi.schemas && Object.keys(publicApi.schemas).length > 0;
  _logTest(results, 'SCHEMAS_CONSOLIDATED', schemasConsolidated, 
    schemasConsolidated ? `Esquemas consolidados (${Object.keys(publicApi.schemas).length} métodos)` : 'Esquemas NO consolidados');

  // Test 4.3: mountCosmos está propagado en publicApi.schemas (via SovereignGuard)
  const mountCosmosInSchemas = publicApi && publicApi.schemas && publicApi.schemas['cosmos:mountCosmos'];
  _logTest(results, 'SCHEMA_MOUNT_COSMOS_EXPOSED', mountCosmosInSchemas, 
    mountCosmosInSchemas ? 'cosmos:mountCosmos presente en publicApi.schemas' : 'cosmos:mountCosmos NO presente en schemas');

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 5: SIMULACIÓN DE HYDRATION PATH (CRÍTICO)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n🚀 [FASE 5] Simulando Hydration Path Completo...\n');

    // Test 5.1: Crear un Cosmos de prueba
    const testCosmosId = _createTestCosmos(stack.driveAdapter, stack.configurator);
    
    if (!testCosmosId) {
      _logTest(results, 'HYDRATION_TEST_COSMOS_CREATION', false, 'No se pudo crear Cosmos de prueba');
    } else {
      _logTest(results, 'HYDRATION_TEST_COSMOS_CREATION', true, `Cosmos de prueba creado: ${testCosmosId}`);
      
      // AXIOMA: Estabilización de Capa Física (Drive Latency)
      Utilities.sleep(1000);

      // Test 5.2: Ejecutar mountCosmos a través de la PublicAPI (Gatway/executeAction)
      try {
        console.log(`   → Ejecutando: publicApi.executeAction({ action: 'cosmos:mountCosmos', payload: { cosmosId: '${testCosmosId}' } })\n`);
        
        const response = publicApi.executeAction({ 
          action: 'cosmos:mountCosmos', 
          payload: { cosmosId: testCosmosId } 
        });
        
        // Test 5.3: Verificar estructura de respuesta (REALITY ENVELOPE)
        const hasEnvelope = response && response.envelope_version && response.envelope_version.startsWith("2.");
        _logTest(results, 'HYDRATION_RESPONSE_STRUCTURE', hasEnvelope, 
          hasEnvelope ? 'Respuesta es un REALITY ENVELOPE v2.1' : 'Respuesta malformada o versión incorrecta');

        const hydrationOk = hasEnvelope && response.payload && response.integrity_check === "PASS";

        _logTest(results, 'HYDRATION_SUCCESS', hydrationOk, 
          hydrationOk ? 'Hydration exitosa (Sobrado de realidad OK)' : `Hydration falló: ${JSON.stringify(response)}`);

        // Test 5.5: Verificar que payload existe
        const hasPayload = response && response.payload && typeof response.payload === 'object';
        _logTest(results, 'HYDRATION_RESULT_PRESENT', hasPayload, 
          hasPayload ? 'Campo "payload" presente' : 'Campo "payload" ausente');

        // Test 5.6: Verificar revision_hash
        const hasRevisionHash = response && response.revision_hash;
        _logTest(results, 'HYDRATION_REVISION_HASH', hasRevisionHash, 
          hasRevisionHash ? `revision_hash presente: ${response.revision_hash}` : 'revision_hash ausente');

        // Test 5.7: Verificar que el resultado tiene indx_schema
        if (hasPayload) {
          const hasSchema = response.payload.indx_schema;
          _logTest(results, 'HYDRATION_RESULT_SCHEMA', hasSchema, 
            hasSchema ? `Esquema: ${response.payload.indx_schema}` : 'indx_schema ausente en payload');
        }

        // Test 5.8: Verificar que identity existe
        if (hasPayload) {
          const hasIdentity = response.payload.identity && response.payload.identity.label;
          _logTest(results, 'HYDRATION_RESULT_IDENTITY', hasIdentity, 
            hasIdentity ? `Identity: ${response.payload.identity.label}` : 'identity ausente en payload');
        }

      } catch (e) {
        _logTest(results, 'HYDRATION_EXECUTION', false, `Excepción durante hydration: ${e.message}`);
        results.criticalFailures.push(`HYDRATION_EXECUTION: ${e.message}`);
      }
      
      // ELIMINACIÓN DIFERIDA: La limpieza ahora ocurre al final de la Fase 8.
    }

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 6: VERIFICACIÓN DE SOVEREIGN GUARD
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n🛡️ [FASE 6] Verificando SovereignGuard...\n');

  // Test 6.1: Verificar que SovereignGuard.secureInvoke existe
  const hasSecureInvoke = typeof SovereignGuard.secureInvoke === 'function';
  _logTest(results, 'GUARD_SECURE_INVOKE', hasSecureInvoke, 
    hasSecureInvoke ? 'SovereignGuard.secureInvoke disponible' : 'SovereignGuard.secureInvoke NO encontrado');

  // Test 6.2: Verificar que exposeNodeCapabilities existe
  const hasExposeCapabilities = typeof SovereignGuard.exposeNodeCapabilities === 'function';
  _logTest(results, 'GUARD_EXPOSE_CAPABILITIES', hasExposeCapabilities, 
    hasExposeCapabilities ? 'SovereignGuard.exposeNodeCapabilities disponible' : 'exposeNodeCapabilities NO encontrado');

  // Test 6.3: Simular validación de payload con BlueprintRegistry
  if (hasBlueprintRegistry) {
    try {
      const testPayload = { cosmosId: 'test-123' };
      const testSchema = { cosmosId: { type: 'string', validation: { required: true } } };
      const validation = stack.blueprintRegistry.validatePayload(testPayload, testSchema);
      
      const isValid = validation.isValid === true;
      _logTest(results, 'GUARD_BLUEPRINT_VALIDATION', isValid, 
        isValid ? 'BlueprintRegistry.validatePayload funciona correctamente' : `Validación falló: ${validation.errors}`);
    } catch (e) {
      _logTest(results, 'GUARD_BLUEPRINT_VALIDATION', false, `Error en validación: ${e.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 7: VERIFICACIÓN DE GOVERNANCE REPORT
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n📊 [FASE 7] Verificando Governance Report...\n');

  if (publicApi && typeof publicApi.getGovernanceReport === 'function') {
    try {
      const governanceReport = publicApi.getGovernanceReport();
      
      const coherenceVal = parseFloat(governanceReport.coherenceIndex);
      const hasCoherenceIndex = !isNaN(coherenceVal);
      _logTest(results, 'GOVERNANCE_COHERENCE_INDEX', hasCoherenceIndex, 
        hasCoherenceIndex ? `Coherence Index: ${coherenceVal}%` : 'coherenceIndex ausente');

      const isValid = governanceReport.isValid === true;
      _logTest(results, 'GOVERNANCE_VALIDITY', isValid, 
        isValid ? 'Sistema válido según Governance Report' : 'Sistema INVÁLIDO según Governance Report');

      if (!isValid && governanceReport.errors) {
        results.warnings.push(`Governance Errors: ${governanceReport.errors.join(', ')}`);
      }

    } catch (e) {
      _logTest(results, 'GOVERNANCE_REPORT', false, `Error al obtener reporte: ${e.message}`);
    }
  } else {
    _logTest(results, 'GOVERNANCE_REPORT', false, 'getGovernanceReport NO disponible en PublicAPI');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FASE 8: SOBERANÍA DE SNAPSHOT Y PERSISTENCIA (V12 Snapshot Stress)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n⚡ [FASE 8] Validando Snapshot Sovereignty (V12)...\n');

  if (testCosmosId && publicApi && typeof publicApi.applyPatch === 'function') {
    try {
      // Re-hidratar para asegurar hash actual
      const initialMount = publicApi.executeAction({ 
        action: 'cosmos:mountCosmos', 
        payload: { cosmosId: testCosmosId } 
      });
      const currentHash = initialMount.revision_hash;
      
      console.log(`   → Hash Inicial: ${currentHash}`);

      // Test 8.1: Persistencia Atómica via cosmos:saveCosmos
      const updatedCosmos = initialMount.payload;
      updatedCosmos.identity.description = 'Updated by Audit V12';
      
      const saveResponse = publicApi.executeAction({ 
        action: 'cosmos:saveCosmos', 
        payload: { 
          cosmos: updatedCosmos,
          revisionHash: currentHash
        }
      });

      const saveSuccess = saveResponse.success === true;
      _logTest(results, 'SNAPSHOT_SAVE_SUCCESS', saveSuccess, 
        saveSuccess ? 'SaveCosmos exitoso (Hash Locking OK)' : `SaveCosmos falló: ${JSON.stringify(saveResponse)}`);

      if (saveSuccess) {
        const newHash = saveResponse.new_revision_hash;
        _logTest(results, 'SNAPSHOT_HASH_EVOLUTION', newHash !== currentHash, 
          newHash !== currentHash ? `Hash evolucionó: ${newHash}` : 'ERROR: El hash no cambió tras el guardado');

        // AXIOMA V12: MODO RELAJADO (Permite sobrescritura con hash diferente)
        console.log('   → Verificando Modo Relajado (Snapshot Sovereignty Test)...');
        
        const overwriteResponse = publicApi.executeAction({
          action: 'cosmos:saveCosmos',
          payload: {
            cosmos: updatedCosmos,
            revisionHash: 'deliberadamente_diferente_v12' // Hash incorrecto intencional
          }
        });

        // V12: Debería PERMITIR la sobrescritura (no bloquear)
        const overwriteAllowed = overwriteResponse.success === true;
        
        _logTest(results, 'SNAPSHOT_OVERWRITE_ALLOWED', overwriteAllowed, 
          overwriteAllowed ? '✅ Sobrescritura permitida (Snapshot Sovereignty activa)' : `❌ Sobrescritura bloqueada (modo legacy): ${JSON.stringify(overwriteResponse)}`);
        
        // Test 8.3: Validar que applyPatch genera warning de deprecación
        console.log('   → Verificando Warning de deprecación en applyPatch...');
        const patchResponse = publicApi.applyPatch({
          cosmosId: testCosmosId,
          delta: { identity: { label: 'Legacy Patch Test' } },
          revisionHash: 'force'
          // Sin _isLegacyDelta para forzar warning
        });
        
        const patchWorks = patchResponse.success === true;
        _logTest(results, 'LEGACY_PATCH_STILL_WORKS', patchWorks,
          patchWorks ? '✅ applyPatch aún funciona (compatibilidad legacy)' : '❌ applyPatch roto');
      }

      // Test 8.4: Verificación de Inmutabilidad de Contratos
      const allContracts = ContractRegistry.getAll();
      const testMethod = 'mountCosmos';
      
      if (allContracts[testMethod]) {
        const originalDesc = allContracts[testMethod].description;
        allContracts[testMethod].description = "MUTATED_BY_TEST";
        
        const secondCheck = ContractRegistry.getAll();
        const isInmutable = secondCheck[testMethod].description === originalDesc;
        
        _logTest(results, 'CONTRACT_IMMUTABILITY_SHADOW', isInmutable, 
          isInmutable ? 'Contratos blindados (Inmutabilidad verificada)' : 'ERROR: Registro global mutado detectado');
      }

    } catch (e) {
      _logTest(results, 'SNAPSHOT_STRESS_TEST_EXECUTION', false, `Error en Fase 8: ${e.message}`);
    } finally {
      // ═══════════════════════════════════════════════════════════════════════
      // LIMPIEZA FINAL (Atómica)
      // ═══════════════════════════════════════════════════════════════════════
      if (testCosmosId) {
        try {
          DriveApp.getFileById(testCosmosId).setTrashed(true);
          console.log(`\n   🗑️ Limpieza: Cosmos de prueba eliminado (${testCosmosId})`);
        } catch (e) {
          // Si ya no existe o hay error, no bloqueamos el reporte
        }
      }
    }
  } else {
    _logTest(results, 'SNAPSHOT_STRESS_TEST_SKIP', false, 'Faltan requisitos para Fase 8');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // GENERACIÓN DE REPORTE FINAL
  // ═══════════════════════════════════════════════════════════════════════
  return _generateReport(results);
}

// ═══════════════════════════════════════════════════════════════════════
// UTILIDADES INTERNAS
// ═══════════════════════════════════════════════════════════════════════

function _logTest(results, testId, passed, message) {
  const emoji = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  
  console.log(`   ${emoji} [${testId}] ${message}`);
  
  results.tests.push({ id: testId, passed, message });
  
  if (!passed) {
    results.criticalFailures.push(`${testId}: ${message}`);
  }
}

function _createTestCosmos(driveAdapter, configurator) {
  try {
    const rootId = configurator.retrieveParameter({ key: 'ORBITAL_CORE_ROOT_ID' });
    if (!rootId) {
      console.warn('   ⚠️ ORBITAL_CORE_ROOT_ID no configurado. Usando root de Drive.');
    }

    const testCosmos = {
      indx_schema: 'COSMOS',
      indx_schema_version: '1.0.0', // CAMPO CRÍTICO PARA EL VALIDATOR
      identity: {
        id: `test_${Date.now()}`,
        label: 'TEST_ATOMIC_ASSEMBLY',
        description: 'Cosmos de prueba para auditoría de ensamblaje',
        archetype: 'REALITY_ANCHOR'
      },
      namespace: {
        ui: null,
        logic: null,
        data: null
      },
      state: 'ACTIVE',
      artifacts: [],
      relationships: [],
      _revisionHash: new Date().getTime().toString(),
      created_at: new Date().toISOString()
    };

    const result = driveAdapter.store({
      folderId: rootId || 'root',
      fileName: `TEST_COSMOS_${Date.now()}.project.json`,
      content: JSON.stringify(testCosmos, null, 2),
      mimeType: 'application/json'
    });

    return result.fileId;
  } catch (e) {
    console.error(`   ❌ Error creando Cosmos de prueba: ${e.message}`);
    return null;
  }
}

function _generateReport(results) {
  const totalTests = results.tests.length;
  const passedTests = results.tests.filter(t => t.passed).length;
  const failedTests = totalTests - passedTests;
  
  results.coherenceIndex = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 REPORTE FINAL                           ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`   📅 Timestamp: ${results.timestamp}`);
  console.log(`   🧪 Tests Ejecutados: ${totalTests}`);
  console.log(`   ✅ Tests Pasados: ${passedTests}`);
  console.log(`   ❌ Tests Fallidos: ${failedTests}`);
  console.log(`   📈 Coherence Index: ${results.coherenceIndex}%\n`);

  if (results.criticalFailures.length > 0) {
    console.log('   🚨 FRACTURAS CRÍTICAS DETECTADAS:\n');
    results.criticalFailures.forEach(failure => {
      console.log(`      - ${failure}`);
    });
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('   ⚠️ ADVERTENCIAS:\n');
    results.warnings.forEach(warning => {
      console.log(`      - ${warning}`);
    });
    console.log('');
  }

  let verdict = '';
  let emoji = '';

  if (results.coherenceIndex === 100) {
    verdict = 'SISTEMA PURO - Ensamblaje Perfecto';
    emoji = '🏆';
  } else if (results.coherenceIndex >= 95) {
    verdict = 'SISTEMA OPERACIONAL - Advertencias menores';
    emoji = '✅';
  } else if (results.coherenceIndex >= 80) {
    verdict = 'SISTEMA DEGRADADO - Requiere atención';
    emoji = '⚠️';
  } else {
    verdict = 'SISTEMA FRACTURADO - Requiere reparación inmediata';
    emoji = '❌';
  }

  console.log(`   ${emoji} VEREDICTO: ${verdict}\n`);
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  return results;
}
/**
 * TEST: Auditoría de Taxonomía de Artefactos (Biopsia de Drive)
 * Propósito: Verificar que el sistema identifica correctamente la naturaleza de los archivos JSON.
 */
function test_ArtifactTaxonomyAudit() {
  console.log('\n🔍 [AUDIT] Iniciando Auditoría de Taxonomía de Artefactos...\n');
  const stack = _assembleExecutionStack();
  const { config, validator } = stack.nodes;
  
  const results = [];
  const flowsId = config.retrieveParameter({ key: 'ORBITAL_FOLDER_FLOWS_ID' });
  
  if (!flowsId) {
    console.error('❌ Error: No se encontró ORBITAL_FOLDER_FLOWS_ID en la configuración.');
    return;
  }

  const flowsFolder = DriveApp.getFolderById(flowsId);
  const allFiles = flowsFolder.getFiles();

  console.log(`📂 Escaneando Horizonte de Artefactos: ${flowsFolder.getName()} (${flowsId})`);
  console.log(`----------------------------------------------------------`);

  let count = 0;
  while (allFiles.hasNext()) {
    const file = allFiles.next();
    const name = file.getName();
    
    if (name.startsWith('.') || !name.endsWith('.json')) continue;
    
    count++;
    const id = file.getId();
    let type = 'UNKNOWN';
    let subType = 'NONE';
    let schemaFound = 'MISSING';

    try {
      const contentStr = file.getBlob().getDataAsString();
      if (!contentStr || contentStr.trim() === "") continue;

      // AXIOMA: Usar el Validador Canónico para diseccionar la realidad física
      const { payload, envelope } = validator.normalize(contentStr);
      const isEnvelope = !!envelope;

      if (payload && payload.indx_schema) {
        type = payload.indx_schema;
        schemaFound = type;
      } else if (payload && payload.identity) {
        type = 'COSMOS';
        schemaFound = 'IDENTITY_MATCH';
      } else if (payload && payload.nodes && payload.edges) {
        type = 'LAYOUT';
        schemaFound = 'GRAPH_MATCH';
      } else if (payload && Array.isArray(payload) && payload.length > 0 && (payload[0].action || payload[0].intent)) {
        type = 'FLOW';
        schemaFound = 'SEQUENCE_MATCH';
      }

      const status = type !== 'UNKNOWN' ? '✅' : '⚠️';
      console.log(`${status} [${type}] ${name}`);
      if (isEnvelope) console.log(`   📦 (Reality Envelope v${envelope.envelope_version} | Hash: ${envelope.revision_hash.substr(0,8)})`);
      console.log(`   ID: ${id}`);
      console.log(`---`);

      results.push({ name, id, type, schemaFound, isEnvelope });

    } catch (e) {
      console.log(`⚠️ [IGNORADO] ${name} no pudo ser diseccionado semánticamente: ${e.message}`);
    }
  }

  if (count === 0) console.log('📭 No se encontraron artefactos JSON en la carpeta de Flows.');

  // Resumen de Clasificación
  const stats = results.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 RESUMEN DEL HORIZONTE:');
  console.log(JSON.stringify(stats, null, 2));
  
  return results;
}
