/**
 * 🛰️ DIAGNÓSTICO: debug_cosmos_binding.gs (V9.0)
 * PROPÓSITO: Verificar el ciclo de vida de un artefacto desde su selección hasta su persistencia en el Snapshot del Cosmos.
 * ESCENARIO: El usuario selecciona una DB de Notion y la vincula al Cosmos.
 */

function debug_BindingAndPersistenceCycle() {
  const _monitor = typeof Logger !== 'undefined' ? Logger : console;
  _monitor.log("╔═══════════════════════════════════════════════════════════════╗");
  _monitor.log("║   🌀 PRUEBA DE CICLO DE PERSISTENCIA (INDRA OS V12)           ║");
  _monitor.log("╚═══════════════════════════════════════════════════════════════╝\n");

  try {
    const assembler = createSystemAssembler();
    const stack = assembler.assembleServerStack ? assembler.assembleServerStack() : assembler.assemble();
    const { public, nodes, configurator } = stack;

    // 1. OBTENER UN COSMOS PARA PRUEBAS
    _monitor.log("🌌 [PASO 1] Localizando Cosmos del Sistema...");
    const rootId = configurator.retrieveParameter({ key: 'ORBITAL_CORE_ROOT_ID' });
    _monitor.log(`   📂 Root ID Identificado: ${rootId}`);
    
    const sensing = nodes.sensing;
    const scanResult = sensing.scanArtifacts({ folderId: rootId, accountId: 'system' });
    _monitor.log(`   🔍 Artefactos encontrados en Root: ${Array.isArray(scanResult) ? scanResult.length : 'ERROR'} items.`);
    
    // AXIOMA: Búsqueda Profunda si el Root está vacío de Cosmos
    let cosmosFiles = (Array.isArray(scanResult) ? scanResult : []).filter(a => 
      a.canonicalType === 'cosmos' || 
      a.ARCHETYPE === 'COSMOS' || 
      a.type === 'cosmos' ||
      (a.name && a.name.toLowerCase().includes('.cosmos'))
    );

    if (cosmosFiles.length === 0) {
      _monitor.log("   🔎 Root vacío de Cosmos. Iniciando búsqueda profunda en Drive...");
      const deepResult = nodes.drive.find({ 
        query: `name contains '.cosmos.json' and trashed = false` 
      });
      cosmosFiles = deepResult.foundItems || [];
    }
    
    if (cosmosFiles.length === 0) {
      _monitor.log("   ❌ Error: No se encontraron archivos de Cosmos en el Root.");
      return;
    }
    const targetCosmos = cosmosFiles[0];
    const cosmosLabel = targetCosmos.LABEL || targetCosmos.name || "Unnamed Cosmos";
    _monitor.log(`   ✅ Cosmos detectado: ${cosmosLabel} (${targetCosmos.id})`);

    // 2. SIMULAR BÚSQUEDA EN NOTION
    _monitor.log("\n📡 [PASO 2] Simulando búsqueda de base de datos en Notion...");
    const notion = nodes.notion;
    const searchRes = notion.listContents({ accountId: 'default', folderId: 'ROOT' });
    const databases = searchRes.items.filter(i => i.ARCHETYPE === 'DATABASE');

    if (databases.length === 0) {
      _monitor.log("   ⚠️ No se encontraron bases de datos en Notion. Usando item dummy para test.");
    }
    const artifactToBind = databases[0] || { id: 'test_db_id', name: 'Test Database', ARCHETYPE: 'DATABASE', type: 'DATABASE' };
    _monitor.log(`   ✅ Artefacto a vincular: ${artifactToBind.name || artifactToBind.LABEL}`);

    // 3. EJECUTAR VÍNCULO SOBERANO
    _monitor.log("\n🔗 [PASO 3] Ejecutando bindArtifactToCosmos...");
    const bindRes = public.executeAction({
      action: 'system:bindArtifactToCosmos',
      payload: {
        cosmosId: targetCosmos.id,
        artifactId: artifactToBind.id,
        metadata: {
          name: artifactToBind.name || artifactToBind.LABEL,
          type: artifactToBind.type || 'DATABASE',
          origin: 'notion',
          accountId: 'default'
        }
      }
    });

    if (bindRes.success) {
      _monitor.log("   ✅ Vínculo exitoso en base de datos de relaciones.");
    } else {
      _monitor.log(`   ❌ Error en Vínculo: ${bindRes.error}`);
    }

    // 4. SIMULAR ESTABILIZACIÓN DE REALIDAD (SNAPSHOT)
    _monitor.log("\n💾 [PASO 4] Simulando estabilización de realidad (Snapshot Persistence)...");
    
    // Obtenemos el snapshot actual del cosmos
    const mountRes = public.executeAction({
      action: 'cosmos:mountCosmos',
      payload: { cosmosId: targetCosmos.id }
    });
    
    if (!mountRes.success) {
       _monitor.log(`   ❌ Error al montar cosmos para snapshot: ${mountRes.error}`);
       return;
    }
    
    const cosmosEnvelope = mountRes;
    const currentCosmos = cosmosEnvelope.payload || cosmosEnvelope;
    
    _monitor.log(`   📦 Snapshot base cargado. Revision: ${cosmosEnvelope.revision_hash || 'N/A'}`);

    // Añadimos el artefacto "manifiestamente" como lo haría el front
    const artifacts = currentCosmos.artifacts || [];
    const updatedArtifacts = [...artifacts, {
      ...artifactToBind,
      x: 100,
      y: 100,
      LABEL: artifactToBind.name || artifactToBind.LABEL || 'New Artifact'
    }];
    
    _monitor.log(`   🧬 Reificando realidad local: ${artifacts.length} -> ${updatedArtifacts.length} artefactos.`);

    const stabilizationRes = public.executeAction({
      action: 'sensing:stabilizeAxiomaticReality',
      payload: {
        snapshot: {
          cosmosId: targetCosmos.id,
          ...currentCosmos,
          artifacts: updatedArtifacts,
          _revisionHash: "TEST_HASH_" + Date.now()
        }
      }
    });

    if (stabilizationRes.success) {
      _monitor.log(`   ✅ Sincronía Completa: Snapshot actualizado en Drive (FileID: ${stabilizationRes.fileId})`);
    } else {
      _monitor.log(`   ❌ Error de Sincronía: ${stabilizationRes.error}`);
    }

  } catch (e) {
    _monitor.log(`\n💥 ERROR CRÍTICO: ${e.message}`);
    _monitor.log(e.stack);
  }
  
  _monitor.log("\n🏁 [FIN DEL TEST]");
}
