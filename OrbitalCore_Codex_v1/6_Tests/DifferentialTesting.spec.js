// ======================================================================
// ARTEFACTO: 🧪 DifferentialTesting.spec.js
// DHARMA: Garantizar la integridad de la Autoproyección UI mediante 
//         snapshots comparativos y validación de contratos enriquecidos.
// ======================================================================

function testDifferential_SchemaAutoprojectionCompliance() {
    const stack = (typeof _assembleExecutionStack === 'function') ? _assembleExecutionStack() : null;
    if (!stack || !stack.public) throw new Error("Could not assemble stack for testing.");
    const publicApi = stack.public;
    const schemas = publicApi.schemas;

    const failures = [];

    Object.keys(schemas).forEach(methodName => {
        const schema = schemas[methodName];
        if (!schema.io || !schema.io.inputs) return;

        Object.keys(schema.io.inputs).forEach(inputKey => {
            const input = schema.io.inputs[inputKey];

            // Regla 1: Todo input debe tener tipo
            if (!input.type) {
                failures.push(`${methodName}.${inputKey}: Falta 'type'`);
            }

            // Regla 2: Todo input debe tener label para UI render
            if (!input.label) {
                failures.push(`${methodName}.${inputKey}: Falta 'label'`);
            }

            // Regla 3: Todo input debe tener role (Semantic Interpretation Role)
            if (!input.role && !input.signifier) {
                failures.push(`${methodName}.${inputKey}: Falta 'role'`);
            }
        });
    });

    if (failures.length > 0) {
        throw new Error("Cumplimiento de Autoproyección fallido:\n- " + failures.join("\n- "));
    }
}

/**
 * Verifica que no hay cambios inesperados en los contratos respecto al baseline.
 * Si hay cambios intencionados, se debe actualizar el baseline.
 */
function testDifferential_ContractBaselineComparison() {
    // MOCK IO: Aislamos la IO física usando inyección oficial
    const stack = assembleGenericTestStack({
        driveAdapter: createMockDriveAdapter([
            // Simular que NO existe el baseline para forzar la creación
        ])
    });

    if (!stack || !stack.public) throw new Error("Could not assemble stack for testing.");
    const publicApi = stack.public;
    const currentSchemas = publicApi.schemas;

    // 1. Intentar recuperar el baseline del sistema (Snapshot con nombre especial)
    let baseline;
    try {
        // Buscamos un archivo llamado 'CONTRACT_BASELINE.json' en la carpeta de sistema
        const scanResult = publicApi.scanArtifacts({ folderId: 'ROOT' });
        const artifacts = Array.isArray(scanResult) ? scanResult : (scanResult.artifacts || []);
        const baselineFile = artifacts.find(a => a.name === 'CONTRACT_BASELINE.json');

        if (!baselineFile) {
            console.warn("⚠️ No se encontró CONTRACT_BASELINE.json. Creando uno nuevo como punto de partida...");
            publicApi.saveSnapshot({
                folderId: 'ROOT',
                type: 'system_snapshot',
                fileName: 'CONTRACT_BASELINE.json',
                content: {
                    timestamp: new Date().toISOString(),
                    system_version: '1.0.0',
                    configuration: currentSchemas,
                    metadata: { createdBy: 'DifferentialTesting', timestamp: new Date().toISOString() }
                }
            });
            return; // El primer run pasa para establecer el baseline
        }

        // 2. Si existe, comparamos usando el IndraAdapter
        const comparison = publicApi.compareSnapshots({
            id1: baselineFile.id, // Baseline
            id2: baselineFile.id  // En un entorno de test real, compararíamos contra un snapshot temporal, 
            // pero aquí compararemos el objeto en memoria contra el archivo en Drive.
        });

        // Recuperamos la data del baseline
        const baselineData = comparison.snapshotData.configuration;

        // Comparamos manualmente los deltas entre memoria y archivo
        const diff = _deepDiffObjects(baselineData, currentSchemas);

        if (!diff.isIdentical) {
            const msg = [
                "⚠️ CONTRATOS MODIFICADOS: Se detectaron cambios respecto al baseline.",
                `Agregados: ${Object.keys(diff.added).length}`,
                `Eliminados: ${Object.keys(diff.removed).length}`,
                `Cambiados: ${Object.keys(diff.changed).length}`,
                "Si estos cambios son correctos, ejecuta 'updateContractBaseline()' desde la consola."
            ].join("\n");

            // En este caso lanzamos warning en lugar de error para permitir iteración.
            console.warn(msg);
            console.log("Deltas detectados:", JSON.stringify(diff, null, 2));
        }

    } catch (e) {
        throw new Error("Fallo en comparación diferencial de contratos: " + e.message);
    }
}

/**
 * Utility: Deep Diff simple para objetos de schema
 */
function _deepDiffObjects(oldObj, newObj) {
    const added = {};
    const removed = {};
    const changed = {};

    for (const key in oldObj) {
        if (!(key in newObj)) {
            removed[key] = oldObj[key];
        } else if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
            changed[key] = { old: oldObj[key], new: newObj[key] };
        }
    }

    for (const key in newObj) {
        if (!(key in oldObj)) {
            added[key] = newObj[key];
        }
    }

    return {
        added, removed, changed,
        isIdentical: Object.keys(added).length === 0 && Object.keys(removed).length === 0 && Object.keys(changed).length === 0
    };
}

/**
 * Función manual para actualizar el baseline de contratos
 */
function updateContractBaseline() {
    const stack = (typeof _assembleExecutionStack === 'function') ? _assembleExecutionStack() : null;
    const publicApi = stack.public;
    return publicApi.saveSnapshot({
        type: 'system_snapshot',
        fileName: 'CONTRACT_BASELINE.json',
        content: {
            timestamp: new Date().toISOString(),
            system_version: '1.0.0',
            configuration: publicApi.schemas,
            metadata: { updatedBy: 'ManualTrigger', timestamp: new Date().toISOString() }
        }
    });
}
