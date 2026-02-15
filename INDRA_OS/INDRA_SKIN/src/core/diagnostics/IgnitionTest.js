/**
 * src/core/diagnostics/IgnitionTest.js
 * 🔬 TEST DE IGNICIÓN (Layer 0 Diagnostic)
 * Este script simula la compilación de un módulo JSON y su preparación para el renderizado.
 */

import compiler from '../laws/Law_Compiler';
import assembler from '../System_Assembler';
import probeJSON from '../laws/OMD-00_TestProbe.json';

async function runDiagnostic() {
    console.log("🚀 [Diagnostic] Iniciando Test de Ignición...");

    // 1. Registro manual del módulo de prueba en el compilador
    const probeLaw = probeJSON.omd_00;

    // 2. Ejecutar Ensamblaje
    const result = await assembler.assemble();

    if (result.success) {
        console.log("✅ Ensamblaje Exitoso.");
    }

    // 3. Simular Compilación del Módulo de Prueba
    const compiledProbe = {
        ...probeLaw,
        visual_rules: compiler.resolveArchetype(probeLaw.config.archetype),
        intent_rules: (compiler.registry.INTENTS && probeLaw.config.intent) ? compiler.registry.INTENTS[probeLaw.config.intent] : null
    };

    console.log("📊 [Law Results] Módulo Traducido para UI:");
    console.log(JSON.stringify(compiledProbe, null, 2));

    // 4. Validación de Integridad
    const integrity = compiler.validateIntegrity('OMD-00', { slot: 'overlay-corner-br' });
    console.log(`🛡️ Integridad de Slot: ${integrity.valid ? "PASSED" : "FAILED"}`);

    // 5. Destilado IA (MCP Check)
    const mcpMap = compiler.distillForAI();
    console.log("🧠 Destilado MCP (Cognitive Map) listo para la IA.");

    return compiledProbe;
}

export default runDiagnostic;



