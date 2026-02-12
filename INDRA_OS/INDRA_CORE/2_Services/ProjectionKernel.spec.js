/**
 * 🧪 PRUEBAS AXIOMÁTICAS: ProjectionKernel
 */

function testProjectionKernel_Dharma() {
    console.log('Test: Verifica que el Kernel proyecta solo lo que tiene contrato.');

    const mockStack = {
        adapterA: {
            label: "Adapter A",
            description: "Test Adapter",
            schemas: {
                method1: { description: "Method 1" }
            },
            method1: function () { }, // Implementación necesaria para proyección
            internalMethod: function () { } // Sin esquema
        },
        serviceB: {
            label: "Service B",
            schemas: {} // Vacío
        }
    };

    const kernel = createProjectionKernel({
        errorHandler: createErrorHandler(),
        configurator: { getAllParameters: () => ({}) }
    });

    const projection = kernel.getProjection(mockStack);

    // Verificaciones
    if (!projection.contracts.adapterA) throw new Error('AdapterA debería estar proyectado');
    if (projection.contracts.adapterA.methods.includes('internalMethod')) throw new Error('internalMethod no debería estar proyectado (Sin esquema)');
    if (projection.contracts.serviceB) throw new Error('ServiceB no debería estar proyectado (Sin métodos en el esquema)');
}

function testProjectionKernel_SentinelMasking() {
    console.log('Test: Verifica que el Kernel enmascara secretos en el contexto.');

    const mockParams = {
        'sys:root_id': 'folder_123',
        'core:NOTION_API_KEY': 'secret_notion_key',
        'adapter:GPT_TOKEN': 'secret_gpt_token',
        'app:ADMIN_PASSWORD': 'mypassword'
    };

    const kernel = createProjectionKernel({
        errorHandler: createErrorHandler(),
        configurator: {
            getAllParameters: () => mockParams
        }
    });

    const context = kernel.getFilteredContext();

    if (context.configuration['sys:root_id'] !== 'folder_123') throw new Error('Parámetros públicos deben mantenerse');

    // Verificación de enmascaramiento (Omitidos o Redactados)
    const secrets = ['core:NOTION_API_KEY', 'adapter:GPT_TOKEN', 'app:ADMIN_PASSWORD'];
    secrets.forEach(key => {
        const val = context.configuration[key];
        if (val && val !== '********') {
            throw new Error(`Fuga de seguridad en la llave: ${key}. Valor recibido: ${val}`);
        }
    });
}

function testProjectionKernel_Immutability() {
    console.log('Test: Verifica que el Kernel no muta la pila de ejecución original.');

    const originalStack = {
        adapter: { label: "A", schemas: { m: {} } }
    };

    const kernel = createProjectionKernel({
        errorHandler: createErrorHandler(),
        configurator: { getAllParameters: () => ({}) }
    });

    kernel.getProjection(originalStack);

    if (!originalStack.adapter.schemas) throw new Error('La pila original fue dañada');
}

function testProjectionKernel_StarkReadyAutodescription() {
    console.log('Test: Verifica que el Kernel proyecta roles y metadatos Stark.');

    const mockStack = {
        dra: {
            label: "Dra",
            archetype: "SYSTEM_INFRA",
            schemas: {
                scan: {
                    description: "Scanning...",
                    io: {
                        inputs: {
                            folder: { role: "id", label: "Folder" }
                        }
                    }
                }
            },
            scan: function () { } // Implementación necesaria
        }
    };

    const kernel = createProjectionKernel({
        errorHandler: createErrorHandler(),
        configurator: { getAllParameters: () => ({}) }
    });

    const projection = kernel.getProjection(mockStack);
    const scanMethod = projection.contracts.dra.schemas.scan;

    if (scanMethod.io.inputs.folder.role !== "id") throw new Error('Falla en la proyección de roles semánticos');
}

function testProjectionKernel_isMethodExposed() {
    console.log('Test: Verifica la lógica de exposición de métodos.');

    const mockStack = {
        adapterA: {
            schemas: {
                publicMethod: { exposure: 'public' },
                internalMethod: { exposure: 'internal' },
                noExposureMethod: { description: 'test' }
            },
            publicMethod: function () { },
            internalMethod: function () { },
            noExposureMethod: function () { },
            _privateMethod: function () { },
            ghostMethod: function () { } // Sin esquema
        }
    };

    const kernel = createProjectionKernel({
        errorHandler: createErrorHandler(),
        configurator: { getAllParameters: () => ({}) }
    });

    // Casos Positivos
    assert.isTrue(kernel.isMethodExposed(mockStack, 'adapterA', 'publicMethod'), 'publicMethod debería estar expuesto');
    assert.isTrue(kernel.isMethodExposed(mockStack, 'adapterA', 'noExposureMethod'), 'Método sin exposure explícito debería estar expuesto por defecto (si tiene esquema)');

    // Casos Negativos
    assert.isFalse(kernel.isMethodExposed(mockStack, 'adapterA', 'internalMethod'), 'internalMethod NO debería estar expuesto');
    assert.isFalse(kernel.isMethodExposed(mockStack, 'adapterA', '_privateMethod'), 'Método iniciado con _ NO debería estar expuesto');
    assert.isFalse(kernel.isMethodExposed(mockStack, 'adapterA', 'ghostMethod'), 'Método sin esquema NO debería estar expuesto');
    assert.isFalse(kernel.isMethodExposed(mockStack, 'invalid', 'publicMethod'), 'Ejecutor inexistente debería retornar false');
}

function testProjectionKernel_SystemHierarchyProjection() {
    console.log('Test: Verificando getSystemHierarchyProjection con nomenclatura estándar.');

    // 1. Mocks de Dependencias
    const mockDriveContent = [
        { id: 'f1', name: 'Folder A', type: 'folder', mimeType: 'application/vnd.google-apps.folder' },
        { id: 'f2', name: 'File B', type: 'file', mimeType: 'text/plain' }
    ];

    const mockDriveAdapter = {
        listContents: function (payload) {
            return mockDriveContent;
        }
    };

    const mockHierarchy = {
        TYPES: { ROOT: 'ROOT', DIRECTORY: 'DIRECTORY', FILE: 'FILE' },
        classifyEntity: function (mime, depth) {
            if (depth === 0) return 'ROOT';
            if (depth === 1 && mime.includes('folder')) return 'DIRECTORY';
            return 'FILE';
        },
        validateLink: function (parent, child) {
            return true; // Permitimos todo para el test
        }
    };

    // 2. Factory
    const kernel = createProjectionKernel({
        errorHandler: createErrorHandler(),
        configurator: { getAllParameters: () => ({}) },
        driveAdapter: mockDriveAdapter,
        laws: { hierarchy: mockHierarchy }
    });

    // 3. Ejecución
    const projection = kernel.getSystemHierarchyProjection('root_123');

    // 4. Aserciones
    if (projection.rootId !== 'root_123') throw new Error('ID Raíz incorrecto');
    if (projection.structure.type !== 'ROOT') throw new Error('Tipo Raíz incorrecto');
    if (projection.structure.children.length !== 2) throw new Error('Debería tener 2 hijos');

    const folderA = projection.structure.children.find(c => c.name === 'Folder A');
    if (!folderA || folderA.type !== 'DIRECTORY') throw new Error('Falla en clasificación de Directorio');

    console.log('  ✅ PASSED: testProjectionKernel_SystemHierarchyProjection');
}
