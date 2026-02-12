/**
 * DIAGNÓSTICO FORENSE DE CANON (AUDITORÍA DE IDENTIDAD) - V2 ATÓMICA
 * PROPÓSITO: Disección profunda de la identidad de nodos y accesibilidad vía API.
 */

function auditSystemCanons() {
  console.log("🔥 [AUDIT v2] INICIANDO SISMOGRAFÍA DE IDENTIDAD...");

  // 1. Instanciación
  console.log("   > Ensamblando Execution Stack...");
  const stack = _assembleExecutionStack();
  const nodes = stack.nodesRegistry || stack.nodes;
  // CORRECCIÓN: El SystemAssembler exporta 'public', no 'publicApi'
  const publicApi = stack.public || stack.publicApi;

  console.log(`   > Stack Nodes Keys: ${Object.keys(nodes).length}`);
  console.log(`   > PublicAPI Available? ${!!publicApi}`);

  if (publicApi) {
      console.log(`   > PublicAPI Keys: ${Object.keys(publicApi).join(', ')}`);
      console.log(`   > Has getNodeContract? ${typeof publicApi.getNodeContract}`);
  }

  // 2. Sujetos
  const subjects = ['drive', 'notion', 'sheet', 'math', 'cosmos'];

  subjects.forEach(key => {
    const node = nodes[key];
    console.log(`\n🔹 === ANATOMÍA DE: ${key.toUpperCase()} ===`);

    if (!node) {
      console.error(`   ❌ NODO NO ENCONTRADO EN REGISTRY`);
      return;
    }

    // A. Inspección Directa (Memory)
    console.log(`   1. [MEMORIA] Inspección Directa:`);
    console.log(`      - ID: ${node.id}`);
    console.log(`      - Label: ${node.label}`);
    console.log(`      - Archetypes: ${JSON.stringify(node.archetypes)}`);
    
    // Inspección de Canon
    const canon = node.canon || node.CANON;
    if (canon) {
        console.log(`      - CANON Detected:`);
        console.log(`        * Archetype: ${canon.ARCHETYPE}`);
        console.log(`        * Capabilities: ${Object.keys(canon.CAPABILITIES || {}).length}`);
    } else {
        console.error(`      ❌ CANON MISSING in Node Object`);
    }

    // B. Inspección API (Public Interface)
    console.log(`   2. [API] Contrato Público:`);
    if (publicApi && typeof publicApi.getNodeContract === 'function') {
        try {
            console.log(`      -> Invocando getNodeContract('${key}')...`);
            const contract = publicApi.getNodeContract({ nodeId: key });
            
            if (contract) {
                console.log(`      ✅ CONTRATO RECIBIDO:`);
                console.log(`         - Archetype: ${contract.archetype}`);
                console.log(`         - Domain: ${contract.domain}`);
                console.log(`         - Capabilities Keys: ${Object.keys(contract.capabilities || {}).join(', ')}`);
            } else {
                console.error(`      ❌ CONTRATO RETURNÓ NULL/UNDEFINED`);
            }
        } catch (e) {
            console.error(`      💥 EXCEPCIÓN AL INVOCAR API: ${e.message}`);
            // console.error(e.stack); // Stacktrace si lo permite GAS
        }
    } else {
        console.warn(`      ⚠️ Salto: API no disponible o método missing.`);
    }
  });

  console.log(`\n✅ SISMOGRAFÍA COMPLETADA.`);
}
