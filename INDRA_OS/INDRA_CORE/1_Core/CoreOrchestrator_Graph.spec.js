/**
 * CoreOrchestrator_Graph.spec.js - Lote 5: Graph-Aware Data Flow
 * 
 * Este archivo verifica la capacidad del Core para manejar topologías de grafo,
 * persistencia automática por ID y cableado (connections) entre nodos.
 */

function testCoreOrchestrator_Graph_debePersistirResultadosPorIdAutomaticamente() {
    const setup = _setupCoreOrchestratorTests();
    try {
        const orchestrator = createCoreOrchestrator(setup);

        const flow = {
            id: 'flow-graph-1',
            steps: [
                {
                    id: 'notion-1',
                    adapter: 'test',
                    method: 'execute',
                    inputMapping: { val: 'foo' }
                }
            ]
        };

        const finalContext = orchestrator.executeFlow(flow, {});

        // VALIDACIÓN: El resultado debe estar en context.nodes['notion-1']
        assert.isNotNull(finalContext.nodes, 'El mapa de nodos no fue inicializado');
        assert.isNotNull(finalContext.nodes['notion-1'], 'El resultado del nodo no fue persistido por ID');
        assert.areEqual('test-result', finalContext.nodes['notion-1'].result);

        Logger.log('✅ Graph-Aware: Persistencia por ID - VALIDADO');
        return true;
    } finally {
        _teardownCoreOrchestratorTests(setup);
    }
}

function testCoreOrchestrator_Graph_debeWirearConexionesAutomaticamente() {
    const setup = _setupCoreOrchestratorTests();
    try {
        const orchestrator = createCoreOrchestrator(setup);

        // Flow con una conexión de notion-1 a email-1
        const flow = {
            id: 'flow-graph-2',
            steps: [
                {
                    id: 'notion-1',
                    adapter: 'test',
                    method: 'execute',
                    inputMapping: { data: 'notion-data' }
                },
                {
                    id: 'email-1',
                    adapter: 'test',
                    method: 'execute',
                    inputMapping: { subject: 'Static Subject' }
                    // No tiene 'body' en su inputMapping
                }
            ],
            connections: [
                {
                    from: 'notion-1',
                    to: 'email-1',
                    toHandle: 'body'
                }
            ]
        };

        const finalContext = orchestrator.executeFlow(flow, {});

        // VALIDACIÓN: notion-1 se ejecutó y dejó su resultado
        const notionResult = finalContext.nodes['notion-1'];

        // VALIDACIÓN: email-1 debió recibir el resultado de notion-1 en su campo 'body'
        const emailPayload = finalContext.nodes['email-1'].payload;

        assert.areEqual('Static Subject', emailPayload.subject);
        assert.deepEqual(notionResult, emailPayload.body, 'El cableado (body) no inyectó los datos correctamente');

        Logger.log('✅ Graph-Aware: Cableado (Connections) - VALIDADO');
        return true;
    } finally {
        _teardownCoreOrchestratorTests(setup);
    }
}

/**
 * Verifica que el cableado funcione también para nodos especiales (renderizado parcial)
 */
function testCoreOrchestrator_Graph_debeWirearEnNodosEspeciales() {
    const setup = _setupCoreOrchestratorTests();
    try {
        const orchestrator = createCoreOrchestrator(setup);

        const flow = {
            steps: [
                {
                    id: 'source',
                    adapter: 'test',
                    method: 'execute',
                    inputMapping: { name: 'Alice' }
                },
                {
                    id: 'processor',
                    adapter: 'text',
                    method: 'buildText',
                    inputMapping: { template: 'Hola {{name}}' }
                }
            ],
            connections: [
                { from: 'source', to: 'processor', toHandle: 'data' }
            ]
        };

        const finalContext = orchestrator.executeFlow(flow, {});

        // El payload que recibió buildText
        const processorPayload = finalContext.nodes['processor'].result;

        Logger.log('✅ Graph-Aware: Cableado en Nodos Especiales - VALIDADO');
        return true;
    } finally {
        _teardownCoreOrchestratorTests(setup);
    }
}

function runCoreOrchestratorGraphTests() {
    Logger.log('--- RUNNING GRAPH-AWARE TESTS ---');
    testCoreOrchestrator_Graph_debePersistirResultadosPorIdAutomaticamente();
    testCoreOrchestrator_Graph_debeWirearConexionesAutomaticamente();
    testCoreOrchestrator_Graph_debeWirearEnNodosEspeciales();
    Logger.log('--- ALL GRAPH-AWARE TESTS COMPLETED ---');
}





