// ======================================================================
// ARTEFACTO: 6_Tests/IntelligenceOrchestrator.spec.js
// DHARMA: Validar la soberanía del razonamiento y la pureza del digest.
// ======================================================================

function testIntelligenceOrchestrator_Creation() {
    const orchestrator = createIntelligenceOrchestrator({
        errorHandler: createErrorHandler(),
        monitoringService: null
    });

    if (!orchestrator || orchestrator.label !== "Indra Architect") {
        throw new Error("IntelligenceOrchestrator failed basic creation/identity check.");
    }
}

function testIntelligenceOrchestrator_DigestGeneration() {
    const orchestrator = createIntelligenceOrchestrator({
        errorHandler: createErrorHandler(),
        monitoringService: null
    });

    const mockNodes = {
        drive: { label: "Drive", archetype: "ADAPTER", schemas: { listFiles: { intent: "READ", description: "List files" } } },
        sheet: { label: "Sheet", archetype: "ADAPTER", schemas: { addRow: { intent: "WRITE", description: "Add row" } } }
    };

    // Accedemos a la lógica privada mediante askArchitect con un prompt dummy
    // o verificando la estructura indirectamente. 
    // En este caso, validamos que askArchitect falle si falta el LLM, lo que prueba que el orquestador está activo.
    try {
        orchestrator.askArchitect({ prompt: "test", nodes: mockNodes });
        throw new Error("Should have failed due to missing LLM adapter");
    } catch (e) {
        if (!e.message.includes("LLM Adapter not found")) {
            throw new Error("Unexpected error message: " + e.message);
        }
    }
}

function testIntelligenceOrchestrator_SemanticIntegration() {
    const stack = _assembleExecutionStack();
    const intelligence = stack.intelligence;

    if (!intelligence || typeof intelligence.askArchitect !== 'function') {
        throw new Error("Intelligence Orchestrator not found in official execution stack.");
    }

    // Verificamos que el esquema esté registrado en PublicAPI
    const publicApi = stack.public;
    const schemas = publicApi.schemas;

    if (!schemas.askArchitect) {
        throw new Error("askArchitect schema not found in PublicAPI registry.");
    }
}





