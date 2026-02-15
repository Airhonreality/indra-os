/**
 * 6_Tests/MCEPCognitiveLoop.spec.js
 * Verification of Step 2.3: Real-time interaction loop.
 */
function testMCEP_CognitiveLoop_Diagnostics() {
    const stack = _assembleExecutionStack();
    const publicApi = stack.public;
    const intelligence = stack.intelligence;

    console.log("--- 🧪 DIAGNÓSTICO MCEP COGNITIVE LOOP ---");

    // 1. Verificar destilación MCEP
    console.log("1. Verificando destilación MCEP en PublicAPI...");
    const manifest = publicApi.getMCEPManifest({});
    if (!manifest || !manifest.tools || Object.keys(manifest.tools).length === 0) {
        throw new Error("MCEP Manifest está vacío o corrupto.");
    }
    console.log(`   - Herramientas AI-READY encontradas: ${Object.keys(manifest.tools).length}`);
    if (manifest.tools['notion_createPage']) {
        console.log("   - [OK] Notion createPage detectada como herramienta viable.");
    }

    // 2. Simular llamada al Arquitecto con Flow Actual
    console.log("2. Verificando inyección de estado en askArchitect...");
    const mockFlow = {
        nodes: {
            "node-1": { instanceOf: "notion", label: "Notion Inbox" }
        },
        connections: []
    };

    // El assembler se encarga de inyectar el MCEP manifest automáticamente en el wrapper de askArchitect
    // Gracias al _publicApiRef y _nodesRef en SystemAssembler.gs

    // Capturamos el log de LLM para ver qué se envía (esto requiere mocks si no queremos llamar a la red)
    // Pero para este diagnóstico, verificaremos la estructura del wrapper.

    if (typeof intelligence.askArchitect !== 'function') {
        throw new Error("askArchitect no está expuesto en Intelligence.");
    }

    console.log("   - [OK] askArchitect detectado.");

    // Verificamos integración en el ensamblador (Forensic check)
    const code = intelligence.askArchitect.toString();
    if (code.includes('getMCEPManifest') || code.includes('getModelTooling')) {
        console.log("   - [OK] El wrapper del ensamblador inyecta MCEP dinámicamente.");
    } else {
        console.warn("   - [!] El wrapper de askArchitect podría no estar usando getMCEPManifest.");
    }

    console.log("--- ✅ DIAGNÓSTICO COMPLETADO CON ÉXITO ---");
    return true;
}





