/**
 * =============================================================================
 * SHADOW TESTER: InductionEngine.test.js
 * RESPONSABILIDAD: Emular el entorno de GAS para verificar el InductionOrchestrator.
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- CARGA DE ARTEFACTOS DEL CORE ---
const CORE_PATH = path.join(__dirname, 'core');
const FILES_TO_LOAD = [
    path.join(CORE_PATH, '0_utils', 'indra_utils.js'),
    path.join(CORE_PATH, '4_support', 'error_handler.js'),
    path.join(CORE_PATH, '1_logic', 'induction_orchestrator.js')
];

// --- MOCK DE SERVICIOS DE GOOGLE APPS SCRIPT ---
const cacheStore = new Map();
const MockGAS = {
    CacheService: {
        getScriptCache: () => ({
            get: (key) => cacheStore.get(key),
            put: (key, val, ttl) => cacheStore.set(key, val)
        })
    },
    Utilities: {
        base64EncodeWebSafe: (str) => Buffer.from(str).toString('base64')
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    },
    Session: {
        getActiveUser: () => ({ getEmail: () => 'tester@indra.system' })
    },
    // Mock del Router de Protocolos
    route: (uqo) => {
        console.log(`[Mock Router] Route Request: ${uqo.protocol} -> ${uqo.provider}`);
        
        // Simular TABULAR_STREAM positivo
        if (uqo.protocol === 'TABULAR_STREAM') {
            return {
                items: [{ id: 'row1', class: 'TABULAR', payload: { fields: [] } }],
                metadata: {
                    status: 'OK',
                    schema: {
                        fields: [
                            { id: '1', handle: { label: 'Nombre' }, type: 'STRING' },
                            { id: '2', handle: { label: 'Precio' }, type: 'NUMBER' }
                        ]
                    }
                }
            };
        }

        // Simular ATOM_CREATE (DATA_SCHEMA / BRIDGE)
        if (uqo.protocol === 'ATOM_CREATE') {
            return {
                items: [{ id: `atom_${Math.random()}`, handle: uqo.data.handle, class: uqo.data.class, payload: uqo.data.payload }],
                metadata: { status: 'OK' }
            };
        }

        if (uqo.protocol === 'ATOM_UPDATE' || uqo.protocol === 'SYSTEM_PIN') {
            return { items: [], metadata: { status: 'OK' } };
        }

        return { items: [], metadata: { status: 'OK' } };
    },
    logInfo: (msg) => console.log(`[INFO] ${msg}`),
    logDebug: (msg) => console.log(`[DEBUG] ${msg}`),
    logWarn: (msg) => console.warn(`[WARN] ${msg}`),
    logError: (msg, err) => console.error(`[ERROR] ${msg}`, err)
};

// --- CREACIÓN DEL CONTEXTO DE EJECUCIÓN ---
const context = vm.createContext({
    ...MockGAS,
    console,
    globalThis: {} // Mock de GAS global
});

// Inyectar funciones de los archivos
FILES_TO_LOAD.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    vm.runInContext(code, context);
});

// --- TEST SUITE ---
console.log('\n--- INICIANDO TEST DE INDUCCIÓN INDUSTRIAL ---\n');

try {
    // 1. Simular inicio de inducción
    const uqo = {
        provider: 'system',
        protocol: 'INDUCTION_START',
        data: {
            source_artifact: { id: 'db_notion_123', provider: 'notion:HG', handle: { label: 'Ventas 2024' }, class: 'DATABASE' },
            publish_immediately: true
        }
    };

    console.log('1. Ejecutando _system_induction_start...');
    const result = vm.runInContext(`_system_induction_start(${JSON.stringify(uqo)})`, context);

    console.log('\n2. Validando Resultado del Inicio:');
    console.log(`- Status: ${result.metadata.status}`);
    console.log(`- Ticket ID: ${result.metadata.ticket_id}`);
    console.log(`- Step Final: ${result.metadata.step}`);

    if (result.metadata.status === 'OK' && result.metadata.step === 'COMPLETED') {
        console.log('\n✅ TEST EXITOSO: El motor indujo el Schema y el Bridge correctamente (Mocked).');
    } else {
        console.error('\n❌ TEST FALLIDO: Estado inesperado.');
        console.log(JSON.stringify(result, null, 2));
    }

    // 3. Verificar persistencia de los alias namespaced
    const schemaFields = result.metadata.schema_atom.payload.fields;
    console.log('\n3. Validando Anticolisión de Aliases (Namespace Scoping):');
    schemaFields.forEach(f => {
        console.log(`- Campo: ${f.handle.label} -> Alias: ${f.handle.alias}`);
        if (!f.handle.alias.startsWith('db_notion_123_')) {
            throw new Error(`Colisión detectada: El alias ${f.handle.alias} no tiene namespace.`);
        }
    });
    console.log('✅ Aliases correctamente enmascarados.');

} catch (e) {
    console.error('\n💥 ERROR DURANTE EL TEST:');
    console.error(e.stack);
    process.exit(1);
}
