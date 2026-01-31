/**
 * 3_Adapters/ISK_ProjectionAdapter.spec.js (UPDATED v2.0.0)
 * 
 * Suite de Verificación Axiomática para el Gestor de Realidad Espacial ISK.
 * Incluye tests para Snapshot Management y USSP Protocol.
 */

function _setupISKProjectionTests() {
    // Mock file system para simular Drive
    const mockFileSystem = {};

    // Shared artifact list
    let mockArtifacts = [
        { id: "node1", name: "Artifact A", indraCategory: "flow", metadata: {}, mimeType: "application/json" },
        { id: "node2", name: "Artifact B", indraCategory: "project", metadata: {}, mimeType: "application/vnd.google-apps.folder" }
    ];

    const mocks = {
        errorHandler: {
            createError: (code, msg) => {
                const e = new Error(msg);
                e.code = code;
                return e;
            }
        },
        renderEngine: {
            render: (template, ctx1, ctx2) => template.replace(/\{\{([^}]+)\}\}/g, (m, k) => (ctx1[k] || ctx2[k] || m))
        },
        sensingAdapter: {
            find: ({ query }) => {
                // Simulate Drive search
                if (query && query.includes('system_layout.json')) {
                    const layoutFile = Object.values(mockFileSystem).find(f =>
                        f && f.name === 'system_layout.json'
                    );
                    if (layoutFile) {
                        return { foundItems: [{ id: layoutFile.id, name: layoutFile.name, createdTime: new Date().toISOString(), size: 1024 }] };
                    }
                    return { foundItems: [] };
                }
                // Search for snapshots
                if (query && query.includes('in parents and title contains')) {
                    const match = query.match(/title contains '([^']+)'/);
                    const term = match ? match[1] : '';
                    const snapshots = Object.values(mockFileSystem).filter(f =>
                        f && f.name && f.name.includes(term)
                    );
                    return { foundItems: snapshots.map(s => ({ id: s.id, name: s.name, createdTime: s.createdTime || new Date().toISOString(), size: s.size || 1024 })) };
                }
                // Search for specific layout
                if (query && query.includes("title = 'system_layout.json'")) {
                    const file = Object.values(mockFileSystem).find(f => f.name === 'system_layout.json');
                    return { foundItems: file ? [file] : [] };
                }
                // Return mock artifacts for general queries
                return {
                    foundItems: mockArtifacts.map(art => ({
                        id: art.id,
                        name: art.name,
                        mimeType: art.mimeType || 'application/json'
                    }))
                };
            },
            retrieve: ({ fileId }) => {
                const file = mockFileSystem[fileId];
                if (file) {
                    return { id: file.id, name: file.name, content: file.content };
                }
                throw new Error("File not found in mock system: " + fileId);
            },
            store: ({ fileName, folderId, content, mimeType, fileId }) => {
                const parsedContent = typeof content === 'string' ? content : JSON.stringify(content);
                const id = fileId || `file_${fileName}_${Math.random()}`;

                mockFileSystem[id] = {
                    id,
                    name: fileName,
                    content: parsedContent,
                    mimeType: mimeType || 'application/json',
                    createdTime: new Date().toISOString(),
                    size: parsedContent.length
                };

                return {
                    success: true,
                    fileId: id,
                    fileName: fileName
                };
            }
        }
    };

    // Mock LockService
    globalThis.LockService = {
        getScriptLock: () => ({
            tryLock: () => true,
            releaseLock: () => { }
        })
    };

    return { mocks, mockFileSystem, mockArtifacts };
}

// ============================================================
// SECTION 1: IDENTITY & CONTRACT VALIDATION
// ============================================================

function testISKProjection_IdentityPassport() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    assert.areEqual(adapter.label, "Spatial Projection Manager", "Label incorrecto.");
    assert.areEqual(adapter.archetype, "SYSTEM_INFRA", "Arquetipo incorrecto.");
    assert.areEqual(adapter.semantic_intent, "SENSOR", "Semantic intent incorrecto.");
    assert.areEqual(adapter.resource_weight, "medium", "Resource weight debe ser medium.");
    assert.isDefined(adapter.schemas, "Debe exponer esquemas.");

    // Verify all required methods exist
    assert.isDefined(adapter.getProjectedScene, "Debe tener getProjectedScene");
    assert.isDefined(adapter.commitSpatialChanges, "Debe tener commitSpatialChanges");
    assert.isDefined(adapter.reconcileSpatialState, "Debe tener reconcileSpatialState");
    assert.isDefined(adapter.createSnapshot, "Debe tener createSnapshot");
    assert.isDefined(adapter.restoreSnapshot, "Debe tener restoreSnapshot");
    assert.isDefined(adapter.listSnapshots, "Debe tener listSnapshots");
}

function testISKProjection_SchemasCompliance() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    // Verify all methods have schemas
    const requiredSchemas = ['getProjectedScene', 'commitSpatialChanges', 'reconcileSpatialState', 'createSnapshot', 'restoreSnapshot', 'listSnapshots'];

    requiredSchemas.forEach(methodName => {
        assert.isDefined(adapter.schemas[methodName], `Schema para ${methodName} debe existir`);
        assert.isDefined(adapter.schemas[methodName].description, `${methodName} debe tener description`);
        assert.isDefined(adapter.schemas[methodName].semantic_intent, `${methodName} debe tener semantic_intent`);
        assert.isDefined(adapter.schemas[methodName].io_interface, `${methodName} debe tener io_interface`);
    });
}

// ============================================================
// SECTION 2: SPATIAL PROJECTION TESTS
// ============================================================

function testISKProjection_GetProjectedScene_StructureValid() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    const scene = adapter.getProjectedScene({
        context_id: "root_context",
        dimension_mode: "2D"
    });

    assert.areEqual(scene.dimension, "2D", "Modo dimensional incorrecto.");
    assert.isTrue(Array.isArray(scene.nodes), "Debe retornar un array de nodos.");
    assert.isTrue(scene.nodes.length > 0, "Debe haber nodos proyectados.");

    // Verificar campos en los nodos
    const firstNode = scene.nodes[0];
    assert.isDefined(firstNode.position.x, "Nodo debe tener coordenada X.");
    assert.isDefined(firstNode.position.y, "Nodo debe tener coordenada Y.");
    assert.isDefined(firstNode.visual_modeling.semantic_gravity, "Debe tener gravedad semántica.");
    assert.isDefined(firstNode.anchors, "Debe tener anchors para puertos.");
}

function testISKProjection_GetProjectedScene_3D_IncludesZ() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    const scene = adapter.getProjectedScene({
        context_id: "root_context",
        dimension_mode: "3D"
    });

    assert.isDefined(scene.nodes[0].position.z, "En modo 3D los nodos deben tener coordenada Z.");
}

// ============================================================
// SECTION 3: USSP PROTOCOL TESTS
// ============================================================

function testISKProjection_CommitSpatialChanges_AtomicMerge() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    // 1. Create initial layout
    setup.mocks.sensingAdapter.store({
        fileName: 'system_layout.json',
        folderId: 'test-context',
        content: JSON.stringify({ nodes: { node1: { x: 100, y: 200 } } })
    });

    // 2. Commit changes via USSP
    const result = adapter.commitSpatialChanges({
        context_id: 'test-context',
        changes: [
            { target_id: 'node1', property: 'u_pos', value: [150, 250] },
            { target_id: 'node1', property: 'u_radius', value: 50 },
            { target_id: 'node2', property: 'u_pos', value: [300, 400] }
        ]
    });

    assert.areEqual(result.status, 'success', 'Commit debe ser exitoso');
    assert.isTrue(result.summary.includes('3 properties'), 'Debe reportar 3 propiedades sincronizadas');

    // 3. Verify atomic merge (node1 updated, node2 created)
    const layoutFile = Object.values(setup.mockFileSystem).find(f => f.name === 'system_layout.json');
    const layout = JSON.parse(layoutFile.content);

    assert.areEqual(layout.nodes.node1.x, 150, 'Node1 X debe actualizarse');
    assert.areEqual(layout.nodes.node1.y, 250, 'Node1 Y debe actualizarse');
    assert.areEqual(layout.nodes.node1.radius, 50, 'Node1 radius debe añadirse');
    assert.isDefined(layout.nodes.node2, 'Node2 debe crearse');
}

function testISKProjection_CommitSpatialChanges_PropertyMapping() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    adapter.commitSpatialChanges({
        context_id: 'test-context',
        changes: [
            { target_id: 'node1', property: 'u_visibility', value: 0.5 },
            { target_id: 'node1', property: 'u_custom_prop', value: 'test_value' }
        ]
    });

    const layoutFile = Object.values(setup.mockFileSystem).find(f => f.name === 'system_layout.json');
    const layout = JSON.parse(layoutFile.content);

    assert.areEqual(layout.nodes.node1.visibility, 0.5, 'u_visibility debe mapearse a visibility');
    assert.areEqual(layout.nodes.node1.custom_prop, 'test_value', 'u_custom_prop debe mapearse a custom_prop');
}

// ============================================================
// SECTION 4: SNAPSHOT MANAGEMENT TESTS
// ============================================================

function testISKProjection_CreateSnapshot_Success() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    // Create initial layout
    setup.mocks.sensingAdapter.store({
        fileName: 'system_layout.json',
        folderId: 'test-context',
        content: JSON.stringify({ nodes: { node1: { x: 100, y: 200 } } })
    });

    const result = adapter.createSnapshot({
        context_id: 'test-context',
        snapshot_label: 'before_experiment'
    });

    assert.isDefined(result.snapshot_id, 'Debe retornar snapshot_id');
    assert.isTrue(result.snapshot_name.includes('.snapshot_'), 'Nombre debe incluir prefijo .snapshot_');
    assert.isTrue(result.snapshot_name.includes('before_experiment'), 'Nombre debe incluir label');
    assert.isDefined(result.created_at, 'Debe incluir timestamp de creación');

    // Verify snapshot file was created
    const snapshotFile = Object.values(setup.mockFileSystem).find(f => f.name === result.snapshot_name);
    assert.isDefined(snapshotFile, 'Archivo de snapshot debe existir');
}

function testISKProjection_RestoreSnapshot_Success() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    // 1. Create initial layout
    const layoutId = setup.mocks.sensingAdapter.store({
        fileName: 'system_layout.json',
        folderId: 'test-context',
        content: JSON.stringify({ nodes: { node1: { x: 100, y: 200 } } })
    }).fileId;

    // 2. Create snapshot
    const snapshot = adapter.createSnapshot({
        context_id: 'test-context',
        snapshot_label: 'backup'
    });

    // 3. Modify layout
    setup.mockFileSystem[layoutId].content = JSON.stringify({ nodes: { node1: { x: 999, y: 999 } } });

    // 4. Restore snapshot
    const restoreResult = adapter.restoreSnapshot({
        context_id: 'test-context',
        snapshot_id: snapshot.snapshot_id
    });

    assert.areEqual(restoreResult.status, 'success', 'Restore debe ser exitoso');
    assert.areEqual(restoreResult.restored_from, snapshot.snapshot_id, 'Debe reportar snapshot_id restaurado');

    // 5. Verify layout was restored
    const restoredLayout = JSON.parse(setup.mockFileSystem[layoutId].content);
    assert.areEqual(restoredLayout.nodes.node1.x, 100, 'X debe restaurarse al valor original');
    assert.areEqual(restoredLayout.nodes.node1.y, 200, 'Y debe restaurarse al valor original');
}

function testISKProjection_ListSnapshots_ReturnsAll() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    // Create layout
    setup.mocks.sensingAdapter.store({
        fileName: 'system_layout.json',
        folderId: 'test-context',
        content: JSON.stringify({ nodes: {} })
    });

    // Create multiple snapshots
    adapter.createSnapshot({ context_id: 'test-context', snapshot_label: 'v1' });
    adapter.createSnapshot({ context_id: 'test-context', snapshot_label: 'v2' });
    adapter.createSnapshot({ context_id: 'test-context', snapshot_label: 'v3' });

    const result = adapter.listSnapshots({ context_id: 'test-context' });

    assert.areEqual(result.total, 3, 'Debe listar 3 snapshots');
    assert.isTrue(Array.isArray(result.snapshots), 'Debe retornar array de snapshots');
    assert.isDefined(result.snapshots[0].id, 'Cada snapshot debe tener id');
    assert.isDefined(result.snapshots[0].name, 'Cada snapshot debe tener name');
}

// ============================================================
// SECTION 5: PERSISTENCE LOOP INTEGRATION
// ============================================================

function testISKProjection_PersistenceLoop_SaveAndRetrieve() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    // 1. Primera proyección: Posiciones calculadas
    const initialScene = adapter.getProjectedScene({ context_id: 'test-folder', dimension_mode: '2D' });

    assert.isTrue(initialScene.nodes.length > 0, 'Debe haber nodos en la escena inicial');
    assert.isFalse(initialScene.spatialStateLoaded, 'No debe haber estado espacial guardado inicialmente');

    // 2. Simular movimiento de nodos
    const movedNodes = initialScene.nodes.map(node => ({
        id: node.id,
        x: node.position.x + 100,
        y: node.position.y + 50
    }));

    // 3. Guardar posiciones vía reconcileSpatialState
    const syncResult = adapter.reconcileSpatialState({
        context_id: 'test-folder',
        move_events: movedNodes
    });

    assert.isTrue(syncResult.success, 'La sincronización debe ser exitosa');

    // 4. Segunda proyección: Debe recuperar posiciones guardadas
    const persistedScene = adapter.getProjectedScene({ context_id: 'test-folder', dimension_mode: '2D' });

    assert.isTrue(persistedScene.spatialStateLoaded, 'Debe haber cargado el estado espacial guardado');
    assert.isTrue(persistedScene.nodes[0].isPersisted, 'Los nodos deben estar marcados como persistidos');
}

// ============================================================
// SECTION 6: ERROR HANDLING & VALIDATION
// ============================================================

function testISKProjection_ValidationErrors() {
    const setup = _setupISKProjectionTests();
    const adapter = createSpatialProjectionAdapter(setup.mocks);

    // Test missing context_id
    try {
        adapter.commitSpatialChanges({ changes: [] });
        assert.fail("Debería lanzar error por falta de context_id");
    } catch (e) {
        assert.areEqual(e.code, "VALIDATION_ERROR");
    }

    // Test invalid changes type
    try {
        adapter.commitSpatialChanges({ context_id: 'test', changes: "not_an_array" });
        assert.fail("Debería lanzar error por changes inválido");
    } catch (e) {
        assert.areEqual(e.code, "VALIDATION_ERROR");
    }

    // Test snapshot without layout
    try {
        adapter.createSnapshot({ context_id: 'nonexistent' });
        assert.fail("Debería lanzar error si no hay layout");
    } catch (e) {
        assert.isTrue(e.message.includes("No layout file found"));
    }
}
