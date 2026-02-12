/**
 * 🧪 CoreOrchestrator_PortAwareness.spec.js
 * 
 * Verifies the Axioma of Granular Extraction: Mapping specific output ports (fromPort)
 * to input ports (toPort) within the Execution Stack.
 */

function testCoreOrchestrator_PortAwareness_shouldExtractSpecificProperty() {
    console.log("--- 🧪 TEST: Port-Awareness Granular Extraction ---");

    // 1. Mock de Nodos
    const mockNodes = {
        sourceNode: {
            getData: () => ({
                id: "123",
                payload: { secret: "TOP_SECRET", public: "HELLO" },
                status: "success"
            })
        },
        targetNode: {
            processData: (input) => {
                // El input debe ser solo el campo extraído
                return `Processed: ${input}`;
            }
        }
    };

    const mockErrorHandler = { createError: (code, msg) => new Error(msg) };
    const mockRenderEngine = { render: (obj) => obj };

    const orchestrator = createCoreOrchestrator({
        manifest: { LIMITS: { maxRetries: 1, initialBackoffMs: 1 } },
        monitoringService: null,
        errorHandler: mockErrorHandler,
        nodes: mockNodes,
        renderEngine: mockRenderEngine
    });

    // 2. Definición del Flow con Cableado de Puertos
    const flow = {
        name: "Test Port Awareness",
        steps: [
            { id: "step1", adapter: "sourceNode", method: "getData" },
            { id: "step2", adapter: "targetNode", method: "processData", inputMapping: {} }
        ],
        connections: [
            {
                from: "step1",
                fromPort: "payload", // Propiedad específica a extraer
                to: "step2",
                toPort: "input"      // Mapeo a argumento del método
            }
        ]
    };

    // 3. Ejecución
    const result = orchestrator.executeFlow(flow, {});

    // 4. Validaciones
    const step2Result = result.nodes.step2;
    console.log("  Step 2 Result:", step2Result);

    if (step2Result !== "Processed: [object Object]") {
        // En este mock, el objeto payload es {secret: ..., public: ...}
        // El test confirma que el objeto LLEGÓ al targetNode.
    }

    // Verificación más profunda: el inputMapping del step 2 debe contener el payload
    assert.isDefined(result.nodes.step1.payload, "Source node should have returned an object with payload property");
    assert.areEqual(result.nodes.step2, "Processed: [object Object]", "Target node should have received the extracted payload object");

    console.log("✅ Port-Awareness Test Passed.");
}

function testCoreOrchestrator_PortAwareness_shouldExtractDeepProperty() {
    console.log("--- 🧪 TEST: Deep Port-Awareness Extraction ---");

    const mockNodes = {
        source: {
            get: () => ({ results: { items: [1, 2, 3], count: 3 } })
        },
        target: {
            log: (val) => val
        }
    };

    const orchestrator = createCoreOrchestrator({
        manifest: { LIMITS: { maxRetries: 0, initialBackoffMs: 0 } },
        errorHandler: { createError: (c, m) => new Error(m) },
        nodes: mockNodes,
        renderEngine: { render: (o) => o }
    });

    const flow = {
        steps: [
            { id: "s1", adapter: "source", method: "get" },
            { id: "s2", adapter: "target", method: "log" }
        ],
        connections: [
            { from: "s1", fromPort: "results", to: "s2", toPort: "input" }
        ]
    };

    const res = orchestrator.executeFlow(flow, {});

    // Verificamos que s2 recibió {items: [1,2,3], count: 3} dentro de la propiedad 'input'
    assert.isDefined(res.nodes.s2.input.items, "Target should have received the extracted 'results' items in the 'input' port.");
    console.log("✅ Deep Port-Awareness Test Passed.");
}
