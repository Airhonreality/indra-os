/**
 * 🧪 Integration_CoreSpatial.spec.js
 * 
 * E2E test to guarantee core health and spatial persistence.
 */

function testIntegration_CoreSpatial_FullCycle() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Integration Test: Discovery & Spatial Persistence         ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    const setup = _setupE2ETest();

    try {
        // ============================================================
        // PART 1: CORE DISCOVERY (Layer 1)
        // ============================================================
        console.log('📡 PART 1: Testing Core Discovery...');

        const publicApi = setup.publicApi;
        const health = publicApi.getSystemStatus();

        // Validate health response structure
        assert.isDefined(health, 'getSystemStatus must return an object');
        assert.areEqual('healthy', health.status, 'Status must be healthy');
        assert.isDefined(health.deploymentUrl, 'Must include deploymentUrl');
        assert.isDefined(health.rootFolderId, 'Must include rootFolderId');
        assert.isDefined(health.capabilities, 'Must include capabilities');

        console.log('  ✅ Core Discovery: Health endpoint functional');
        console.log(`  📍 Deployment URL: ${health.deploymentUrl}`);
        console.log(`  📁 Root Folder ID: ${health.rootFolderId}`);
        console.log(`  🎯 Capabilities: ${Object.keys(health.capabilities).filter(k => health.capabilities[k]).join(', ')}`);

        // ============================================================
        // PART 2: SPATIAL PERSISTENCE (Layer 2)
        // ============================================================
        console.log('\n🗺️  PART 2: Testing Spatial Persistence...');

        const spatialAdapter = setup.spatialAdapter;
        const testFolderId = health.rootFolderId;

        // 2.1: Get initial scene (no saved positions)
        const initialScene = spatialAdapter.getProjectedScene({
            context_id: testFolderId,
            dimension_mode: '2D'
        });

        assert.isTrue(initialScene.nodes.length > 0, 'Scene must have nodes');
        assert.isFalse(initialScene.spatialStateLoaded, 'Initially, no spatial state should be loaded');
        assert.isDefined(initialScene.physics, 'Scene must include physics laws for ISK');
        assert.isDefined(initialScene.physics.cable_physics, 'Physics must include cable_physics');

        console.log(`  ✅ Initial Scene: ${initialScene.nodes.length} nodes with calculated positions`);
        console.log(`  ✅ Physics Laws: Injected (${Object.keys(initialScene.physics).length} modules)`);

        // 2.2: Simulate user moving nodes
        const movedNodes = initialScene.nodes.map(node => ({
            id: node.id,
            x: node.position.x + 150,
            y: node.position.y + 75
        }));

        // 2.3: Save positions via reconcileSpatialState
        const syncResult = spatialAdapter.reconcileSpatialState({
            context_id: testFolderId,
            move_events: movedNodes
        });

        assert.isTrue(syncResult.success, 'Spatial sync must succeed');
        console.log(`  ✅ Spatial Sync: Saved ${movedNodes.length} node positions`);

        // 2.4: Get scene again (should load saved positions)
        const persistedScene = spatialAdapter.getProjectedScene({
            context_id: testFolderId,
            dimension_mode: '2D'
        });

        assert.isTrue(persistedScene.spatialStateLoaded, 'Spatial state must be loaded');
        assert.isTrue(persistedScene.nodes[0].isPersisted, 'Nodes must be marked as persisted');

        // Validate positions match saved ones
        persistedScene.nodes.forEach((node, index) => {
            const expectedX = movedNodes[index].x;
            const expectedY = movedNodes[index].y;

            assert.areEqual(node.position.x, expectedX, `Node ${node.id}: X must match saved position`);
            assert.areEqual(node.position.y, expectedY, `Node ${node.id}: Y must match saved position`);
        });

        console.log(`  ✅ Persistence Verified: All ${persistedScene.nodes.length} nodes restored to saved positions`);

        // ============================================================
        // PART 3: INTEGRATION VALIDATION
        // ============================================================
        console.log('\n🔗 PART 3: Validating Integration...');

        // Validate that capabilities reported in health match actual functionality
        assert.isTrue(health.capabilities.spatialPersistence, 'Health must report spatial persistence capability');
        assert.isTrue(health.capabilities.flowExecution, 'Health must report flow execution capability');

        // Validate that the system is self-consistent
        const healthAfterPersistence = publicApi.getSystemStatus();
        assert.areEqual(health.deploymentUrl, healthAfterPersistence.deploymentUrl, 'Deployment URL must remain stable');
        assert.areEqual(health.rootFolderId, healthAfterPersistence.rootFolderId, 'Root folder ID must remain stable');

        console.log('  ✅ Integration: System is self-consistent');
        console.log('  ✅ Integration: Capabilities match actual functionality');

        // ============================================================
        // FINAL REPORT
        // ============================================================
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║                  ✅ ALL TESTS PASSED                          ║');
        console.log('║     Core Discovery & Spatial Persistence VALIDATED            ║');
        console.log('╚════════════════════════════════════════════════════════════════╝');
        console.log('\n📊 Summary:');
        console.log(`  • Core Discovery: ✅ Functional (${health.version})`);
        console.log(`  • Spatial Persistence: ✅ Functional (${persistedScene.nodes.length} nodes)`);
        console.log(`  • Integration: ✅ Self-consistent`);
        console.log('\n🚀 Next Steps:');
        console.log('  1. Implement Skin-side VaultManager (Layer 1)');
        console.log('  2. Implement Skin-side Spatial Sync (Layer 2)');
        console.log('  3. Create full Skin-to-Core E2E test');

        return true;

    } finally {
        _teardownE2ETest(setup.originals);
    }
}

// ============================================================
// SETUP & TEARDOWN
// ============================================================

function _setupE2ETest() {
    const originals = {
        DriveApp: globalThis.DriveApp
    };

    // Mock DriveApp for file system operations
    const mockFileSystem = {};

    globalThis.DriveApp = {
        getFolderById: (id) => ({
            getFiles: () => {
                const files = Object.values(mockFileSystem).filter(f => f.folderId === id);
                let index = 0;
                return {
                    hasNext: () => index < files.length,
                    next: () => {
                        const file = files[index++];
                        return {
                            getId: () => file.id,
                            getName: () => file.name,
                            getLastUpdated: () => new Date(),
                            getMimeType: () => file.mimeType || 'application/json',
                            getBlob: () => ({ getDataAsString: () => file.content })
                        };
                    }
                };
            },
            createFile: (name, content, mimeType) => {
                const fileId = `file_${name}_${Math.random()}`;
                mockFileSystem[fileId] = { id: fileId, name, content, mimeType, folderId: id };
                return {
                    getId: () => fileId,
                    getName: () => name,
                    getBlob: () => ({ getDataAsString: () => content })
                };
            },
            getFilesByName: (name) => {
                const files = Object.values(mockFileSystem).filter(f => f.name === name && f.folderId === id);
                let index = 0;
                return {
                    hasNext: () => index < files.length,
                    next: () => {
                        const file = files[index++];
                        return {
                            getId: () => file.id,
                            getName: () => file.name,
                            getBlob: () => ({ getDataAsString: () => file.content }),
                            setContent: (newContent) => { file.content = newContent; }
                        };
                    }
                };
            }
        })
    };

    // Create mock artifacts for spatial projection
    const mockArtifacts = [
        { id: 'flow-1', name: 'Main Flow', indraCategory: 'flow', indraType: 'json', metadata: {} },
        { id: 'flow-2', name: 'Helper Flow', indraCategory: 'flow', indraType: 'json', metadata: {} }
    ];

    // Assemble minimal execution stack
    const mockErrorHandler = {
        createError: (code, msg, details) => {
            const e = new Error(msg);
            e.code = code;
            e.details = details;
            return e;
        }
    };

    const mockConfigurator = {
        retrieveParameter: (p) => {
            if (p.key === 'DEPLOYMENT_URL') return 'https://script.google.com/macros/s/e2e-test/exec';
            if (p.key === 'ORBITAL_CORE_ROOT_ID') return 'e2e-test-root-folder';
            return 'mock-value';
        },
        isInSafeMode: () => false
    };

    const mockDriveAdapter = {
        store: ({ folderId, fileName, content }) => {
            const fileId = `file_${fileName}_${Math.random()}`;
            mockFileSystem[fileId] = { id: fileId, name: fileName, content, folderId };
            return { fileId };
        },
        retrieve: ({ folderId, fileName, type }) => {
            const file = Object.values(mockFileSystem).find(f => f.name === fileName && f.folderId === folderId);
            if (!file) throw new Error('File not found');

            const content = type === 'json' ? JSON.parse(file.content) : file.content;
            return { content };
        }
    };

    const mockSensingAdapter = {
        scanArtifacts: () => mockArtifacts,
        find: ({ query }) => {
            // Simulate Drive search
            if (query && query.includes('system_layout.json')) {
                // Check if layout file exists in mockFileSystem
                const layoutFile = Object.values(mockFileSystem).find(f => f.name === 'system_layout.json');
                if (layoutFile) {
                    return { foundItems: [{ id: layoutFile.id, name: 'system_layout.json' }] };
                }
                return { foundItems: [] };
            }
            // Return mock artifacts with proper structure for spatial projection
            return {
                foundItems: mockArtifacts.map(art => ({
                    id: art.id,
                    name: art.name,
                    mimeType: art.indraType || 'application/json'
                }))
            };
        },
        retrieve: ({ fileId }) => {
            // Delegate to mockDriveAdapter by finding the file first
            const file = mockFileSystem[fileId];
            if (!file) throw new Error('File not found');
            const content = typeof file.content === 'string' ? JSON.parse(file.content) : file.content;
            return { content };
        },
        reconcileSpatialState: ({ folderId, nodes }) => {
            const content = JSON.stringify({
                version: '1.0',
                timestamp: new Date().toISOString(),
                nodes: nodes
            }, null, 2);

            const result = mockDriveAdapter.store({
                folderId,
                fileName: 'system_layout.json',
                content
            });

            return { fileId: result.fileId };
        },
        getSpatialState: ({ folderId }) => {
            try {
                const result = mockDriveAdapter.retrieve({
                    folderId,
                    fileName: '.spatial_shadow.json',
                    type: 'json'
                });
                return result.content;
            } catch (e) {
                return { nodes: [] };
            }
        },
        store: ({ fileName, folderId, content, mimeType, fileId }) => {
            // Delegate to mockDriveAdapter
            return mockDriveAdapter.store({
                fileName,
                folderId,
                content,
                mimeType,
                fileId
            });
        }
    };

    const mockRenderEngine = {
        render: (template, context) => template
    };

    // Create adapters
    const spatialAdapter = createSpatialProjectionAdapter({
        errorHandler: mockErrorHandler,
        renderEngine: mockRenderEngine,
        sensingAdapter: mockSensingAdapter
    });

    const publicApi = createPublicAPI({
        coreOrchestrator: { executeFlow: () => ({}), label: "Mock Core", description: "Test", archetype: "SYSTEM_INFRA", schemas: {} },
        flowRegistry: { getFlow: () => ({}), label: "Mock Registry", description: "Test", archetype: "SYSTEM_INFRA", schemas: {} },
        jobQueueService: { claimNextJob: () => null, updateJobStatus: () => { }, label: "Mock Queue", description: "Test", archetype: "SYSTEM_INFRA", schemas: {} },
        monitoringService: { logDebug: () => { }, logInfo: () => { }, logWarn: () => { }, logError: () => { }, logEvent: () => { }, sendCriticalAlert: () => { }, label: "Mock Monitor", description: "Test", archetype: "SYSTEM_INFRA", schemas: {} },
        errorHandler: mockErrorHandler,
        manifest: { anchorPropertyKey: 'ROOT_ID', driveSchema: {}, version: '1.0.0' },
        driveAdapter: mockDriveAdapter,
        configurator: mockConfigurator,
        nodes: {
            sensing: mockSensingAdapter,
            tokenManager: { getToken: () => ({}), listTokenProviders: () => [], label: "Mock Token", description: "Test", archetype: "SYSTEM_INFRA", schemas: {} },
            config: mockConfigurator
        },
        gatekeeper: { validateAllContracts: () => ({ isValid: true, criticalErrors: [], warnings: [], auditedModules: 1 }), label: "Mock Gatekeeper", description: "Test", archetype: "SYSTEM_INFRA", schemas: {} },
        schemaRegistry: { validatePayload: () => ({ isValid: true, errors: [] }), label: "Mock Registry", description: "Test", archetype: "SYSTEM_INFRA", schemas: {} },
        semanticBridge: { getAffinity: () => ({ affinityScore: 1.0 }), label: "Mock Bridge", description: "Test", archetype: "SYSTEM_INFRA", schemas: {} }
    });

    return {
        publicApi,
        spatialAdapter,
        mockFileSystem,
        originals
    };
}

function _teardownE2ETest(originals) {
    globalThis.DriveApp = originals.DriveApp;
}
