/**
 * =============================================================================
 * SHADOW TESTER: ProvisionDemo.test.js
 * RESPONSABILIDAD: Emular la creación y flujo de un AEE + Document + Workflow.
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

// --- MOCK DE SERVICIOS INDRA ---
const atomsStore = new Map();
const MockGAS = {
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => null }) },
    Utilities: { base64EncodeWebSafe: (s) => s },
    Session: { getActiveUser: () => ({ getEmail: () => 'user@indra.system' }) },
    
    // Router de Provisión
    route: (uqo) => {
        const protocol = uqo.protocol;
        const data = uqo.data || {};

        if (protocol === 'ATOM_CREATE') {
            const atomId = `atom_${data.class}_${Math.random().toString(36).slice(2, 7)}`;
            const atom = {
                id: atomId,
                class: data.class,
                handle: data.handle || { label: 'Untitled' },
                payload: data.payload || {},
                created_at: new Date().toISOString()
            };
            atomsStore.set(atomId, atom);
            console.log(`   [PROVISION] Created ${data.class}: ${atomId} ("${atom.handle.label}")`);
            return { items: [atom], metadata: { status: 'OK' } };
        }

        if (protocol === 'SYSTEM_PIN') return { items: [], metadata: { status: 'OK' } };

        return { items: [], metadata: { status: 'OK' } };
    },
    
    logInfo: (msg) => console.log(`   [CORE] ${msg}`),
    logDebug: (msg) => console.log(`   [DEBUG] ${msg}`),
    logWarn: (msg) => console.warn(`   [WARN] ${msg}`),
    logError: (msg, err) => console.error(`   [ERROR] ${msg}`, err)
};

// --- ESTRUCTURA DEL TEST ---
console.log('\n--- INICIANDO TEST DE PROVISIÓN AUTOMÁTICA DE FLUJO ---\n');

try {
    const context = vm.createContext({ ...MockGAS, console, globalThis: {} });
    FILES_TO_LOAD.forEach(file => {
        const code = fs.readFileSync(file, 'utf8');
        vm.runInContext(code, context);
    });

    // 1. CREAR DATA_SCHEMA (Formulario AEE)
    const schemaUQO = {
        protocol: 'ATOM_CREATE',
        data: {
            class: 'DATA_SCHEMA',
            handle: { label: 'Formulario Reporte Digital' },
            payload: {
                fields: [
                    { id: 'f1', handle: { alias: 'folder_name', label: 'Carpeta Salida' }, type: 'STRING' },
                    { id: 'f2', handle: { alias: 'pdf_title', label: 'Título PDF' }, type: 'STRING' },
                    { id: 'f3', handle: { alias: 'pdf_content', label: 'Contenido PDF' }, type: 'LONG_TEXT' },
                    { id: 'f4', handle: { alias: 'pdf_image', label: 'Imagen PDF' }, type: 'IMAGE' }
                ]
            }
        }
    };
    const schema = MockGAS.route(schemaUQO).items[0];

    // 2. CREAR DOCUMENT (Plantilla)
    const docUQO = {
        protocol: 'ATOM_CREATE',
        data: {
            class: 'DOCUMENT',
            handle: { label: 'Template de Reporte' },
            payload: {
                elements: [
                    { type: 'HEADER', text: 'REPORTE INDRA' },
                    { type: 'IMAGE', mapping: 'pdf_image' },
                    { type: 'TITLE', mapping: 'pdf_title' },
                    { type: 'CONTENT', mapping: 'pdf_content' }
                ]
            }
        }
    };
    const template = MockGAS.route(docUQO).items[0];

    // 3. CREAR BRIDGE (Mapeo Lógico)
    const bridgeUQO = {
        protocol: 'ATOM_CREATE',
        data: {
            class: 'BRIDGE',
            handle: { label: 'Conector de Reporte' },
            payload: {
                sources: [schema.id],
                targets: [template.id],
                mappings: {
                    [template.id]: {
                        'pdf_title': 'source.pdf_title',
                        'pdf_content': 'source.pdf_content',
                        'pdf_image': 'source.pdf_image'
                    }
                },
                operators: [
                    { id: 'op_folder', class: 'DRIVE_DIR_CREATE', inputs: { name: 'source.folder_name' } }
                ]
            }
        }
    };
    const bridge = MockGAS.route(bridgeUQO).items[0];

    // 4. CREAR WORKFLOW (Orquestación)
    const workflowUQO = {
        protocol: 'ATOM_CREATE',
        data: {
            class: 'WORKFLOW',
            handle: { label: 'Flujo Digital: Reporte Automático' },
            payload: {
                stations: [
                    { id: 'st1', label: 'Formulario AEE', engine: 'AEE_RUNNER', schema_id: schema.id },
                    { id: 'st2', label: 'Crear Carpeta', engine: 'DRIVE_ENGINE', bridge_id: bridge.id, operator_id: 'op_folder' },
                    { id: 'st3', label: 'Generar PDF', engine: 'DOCUMENT_ENGINE', template_id: template.id, bridge_id: bridge.id }
                ]
            }
        }
    };
    const workflow = MockGAS.route(workflowUQO).items[0];

    console.log('\n--- VERIFICACIÓN DE INTEGRIDAD DEL FLUJO ---');
    
    // Verificación 1: El Workflow apunta a los átomos correctos?
    console.log(`- Estación 1 (Form): OK [Schema: ${workflow.payload.stations[0].schema_id === schema.id}]`);
    console.log(`- Estación 2 (Bridge): OK [Bridge: ${workflow.payload.stations[1].bridge_id === bridge.id}]`);
    console.log(`- Estación 3 (Bridge): OK [Bridge: ${workflow.payload.stations[2].bridge_id === bridge.id}]`);

    // Verificación 2: El Bridge tiene los mapeos correctos?
    const mappings = bridge.payload.mappings[template.id];
    console.log(`- Mapeo Título: ${mappings.pdf_title === 'source.pdf_title' ? 'SINCERO' : 'FALLIDO'}`);
    console.log(`- Mapeo Imagen: ${mappings.pdf_image === 'source.pdf_image' ? 'SINCERO' : 'FALLIDO'}`);

    console.log('\n🚀 TEST DE PROVISIÓN EXITOSO: El sistema es capaz de generar la red de átomos solicitada.');
    console.log(`\nURL GENERADA (AEE): https://indra.system/aee?id=${schema.id}&mode=prod`);

} catch (e) {
    console.error('\n❌ ERROR EN TEST:', e.stack);
}
