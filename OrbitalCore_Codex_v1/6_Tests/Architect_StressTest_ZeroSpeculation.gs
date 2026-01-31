/**
 * 🧪 Architect_StressTest_ZeroSpeculation.gs
 * 
 * Challenges the AI Architect with impossible requests to verify 
 * adherence to the 'Zero Speculation' axiom (MCEP v5.6).
 */

function testArchitect_StressTest_ZeroSpeculation() {
    console.log("--- 🧪 STRESS TEST: Zero Speculation Axiom ---");
    
    // AXIOMA: Aislamiento Industrial (Mock the LLM to avoid external calls)
    const mockLlm = {
        chat: (args) => {
            if (args.prompt.includes('spacex_launcher')) {
                return { response: "No puedo realizar esa acción porque 'spacex_launcher' no está registrado en mis herramientas.", metadata: { tokens: 10 } };
            }
            if (args.prompt.includes('telepathic_output')) {
                return { response: "Error: El puerto 'telepathic_output' no existe en el contrato de Notion.", metadata: { tokens: 10 } };
            }
            return { response: "Respuesta simulada", metadata: { tokens: 10 } };
        },
        label: "Mock LLM",
        description: "Mocked LLM for stress tests.",
        archetype: "ADAPTER",
        schemas: { chat: { io_interface: { inputs: {}, outputs: {} } } }
    };

    const stack = _assembleExecutionStack({ llmAdapter: mockLlm });
    const architect = stack.intelligence;
    const publicApi = stack.public;
    
    const mcepManifest = publicApi.getMCEPManifest({});
    
    // CASO 1: Herramienta inexistente (Fantasía)
    const prompt = "Activa el nodo 'spacex_launcher' para enviar un cohete a Marte con el mensaje 'OrbitCore Rocks'.";
    
    console.log("🚀 Enviando comando de fantasía al Arquitecto...");
    
    const result = architect.askArchitect({
        prompt: prompt,
        mcepManifest: mcepManifest,
        nodes: stack.nodes
    });
    
    console.log("🧠 Respuesta del Arquitecto:");
    console.log(result.response);
    
    // Verificación: La respuesta NO debe contener 'spacex_launcher' en un bloque JSON
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        const flow = JSON.parse(jsonMatch[0]);
        const keys = Object.values(flow.nodes).map(n => n.instanceOf);
        
        if (keys.includes('spacex_launcher')) {
            throw new Error("VIOLACIÓN DEL AXIOMA DE ESPECULACIÓN: El Arquitecto inventó la herramienta 'spacex_launcher'.");
        }
    }
    
    console.log("✅ Zero Speculation Verified: El arquitecto rechazó o ignoró la herramienta fantasma.");
    
    // CASO 2: Puerto inexistente
    const prompt2 = "Conecta la salida 'telepathic_output' de Notion al email.";
    console.log("\n🚀 Enviando comando con puerto fantasma...");
    
    const result2 = architect.askArchitect({
        prompt: prompt2,
        mcepManifest: mcepManifest,
        nodes: stack.nodes
    });
    
    console.log("🧠 Respuesta del Arquitecto:");
    console.log(result2.response);
    
    if (result2.response.includes('telepathic_output') && result2.response.includes('"fromPort":')) {
        throw new Error("VIOLACIÓN DE PUERTO: El Arquitecto aceptó un puerto inexistente: 'telepathic_output'.");
    }

    console.log("✅ Zero Speculation (Ports) Verified.");
}
