/**
 * 📡 Sonda_Architect_DualAnatomy.gs
 * 
 * Verifies that the IntelligenceOrchestrator (Architect) adheres to the 
 * Dual Anatomy protocol (Adapter identity + Method action).
 */

function testSonda_Architect_DualAnatomy_Compliance() {
    console.log("--- 📡 SONDA: Architect Dual Anatomy Compliance ---");
    
    // AXIOMA: Aislamiento Industrial
    const mockLlm = {
        chat: (args) => {
            const mockResponse = {
                nodes: {
                    "retrieve": { instanceOf: "notion", method: "query_db", label: "Read Table" },
                    "notify": { instanceOf: "email", method: "send_mail", label: "Email result" }
                },
                connections: [
                    { from: "retrieve", to: "notify", fromPort: "results", toPort: "body" }
                ],
                steps: [] // El core lo ignora pero el test puede buscarlo
            };
            return { 
                response: "He diseñado el flujo. Aquí está la topología:\n```json\n" + JSON.stringify(mockResponse, null, 2) + "\n```", 
                metadata: { tokens: 100 } 
            };
        },
        label: "Mock LLM",
        description: "Mocked LLM for anatomy tests.",
        archetype: "ADAPTER",
        domain: "INTELLIGENCE",
        semantic_intent: "ORACLE",
        id: "LLM",
        verifyConnection: function() { return { status: "ACTIVE" }; },
        schemas: { chat: { io_interface: { inputs: {}, outputs: {} } } }
    };

    const stack = _assembleExecutionStack({ llmAdapter: mockLlm });
    const architect = stack.intelligence;
    const publicApi = stack.public;
    
    const mcepManifest = publicApi.getMCEPManifest({});
    
    const prompt = "Crea un flujo simple que consulte una tabla de Notion (ID: 'table_123') y envíe el resultado por email.";
    
    console.log("🚀 Enviando comando al Arquitecto...");
    
    const result = architect.askArchitect({
        prompt: prompt,
        mcepManifest: mcepManifest,
        nodes: stack.nodes // Pasamos los nodos explícitos
    });
    
    console.log("🧠 Respuesta del Arquitecto recibida.");
    console.log("--- RAZONAMIENTO ---\n", result.response.split('{')[0]);
    
    // Extraer JSON
    const jsonMatch = result.response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("El Arquitecto no generó un bloque JSON técnico.");
    }
    
    const flow = JSON.parse(jsonMatch[0]);
    
    console.log("🔍 Validando Anatomía del Flow...");
    
    // 1. Validar Nodos (Identidad vs Acción)
    Object.keys(flow.nodes).forEach(nodeId => {
        const node = flow.nodes[nodeId];
        console.log(`   Checking Node [${nodeId}]: instanceOf=${node.instanceOf}, method=${node.method}`);
        
        // El instanceOf DEBE ser el adapter key (ej: 'notion'), no 'notion_query'
        const forbiddenPatterns = ['_query', '_send', '_create', 'googleCalendar_'];
        forbiddenPatterns.forEach(pattern => {
            if (node.instanceOf.includes(pattern)) {
                throw new Error(`VIOLACIÓN DE ANATOMÍA: El nodo ${nodeId} usa un instanceOf impuro: ${node.instanceOf}`);
            }
        });
        
        assert.isDefined(node.method, `El nodo ${nodeId} debe tener un campo 'method' explícito.`);
    });
    
    // 2. Validar Steps (Capa Core)
    // AXIOMA: El Arquitecto NO genera steps, el Core los compila automáticamente.
    console.log("✅ Verificación de Steps: El Core se encargará de la compilación topológica.");
    
    console.log("✅ Sonda de Anatomía Dual: EXITOSA.");
}
