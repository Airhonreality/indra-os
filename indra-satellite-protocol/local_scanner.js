import fs from 'fs';
import path from 'path';

/**
 * =============================================================================
 * INDRA LOCAL SCANNER (v2.0 - DYNAMIC ENGINE)
 * =============================================================================
 * Responsibilidad: Escanear el ADN local desde el directorio de ejecución real.
 * =============================================================================
 */

const PROJECT_ROOT = process.cwd();
const CONFIG = {
    outputFile: path.resolve(PROJECT_ROOT, '_INDRA_PROTOCOL_/indra_contract.js'),
    scorePath: path.resolve(PROJECT_ROOT, 'src/score')
};

async function harvestAssets(folderName) {
    const fullPath = path.join(CONFIG.scorePath, folderName);
    if (!fs.existsSync(fullPath)) {
        console.warn(`[Scanner] Directorio no encontrado: ${fullPath}`);
        return [];
    }
    
    const files = fs.readdirSync(fullPath);
    const assets = [];

    for (const file of files) {
        if (!file.endsWith('.js')) continue;
        const filePath = path.join(fullPath, file);
        try {
            // AXIOMA: Importación dinámica con busteo de caché
            const modulePath = 'file://' + path.resolve(filePath).replace(/\\/g, '/');
            const module = await import(`${modulePath}?t=${Date.now()}`);
            
            // Detección de exportación (schema, default o puras)
            const data = module.default || module.schema || module.workflow || module;
            
            if (data && (data.id || data.handle?.alias)) {
                assets.push({
                    ...data,
                    _source: {
                        file: file,
                        path: filePath,
                        scanned_at: new Date().toISOString()
                    }
                });
            }
        } catch (e) {
            console.error(`❌ [Scanner] Error en archivo: ${file}`, e.message);
        }
    }
    return assets;
}

async function runLocalScan() {
    console.log(`🔍 [Scanner] Escaneando Proyecto en: ${PROJECT_ROOT}`);

    try {
        const localSchemas = await harvestAssets('schemas');
        const localWorkflows = await harvestAssets('workflows');

        const contract = {
            synced_at: new Date().toISOString(),
            project_root: PROJECT_ROOT,
            core_id: "dev_hybrid",
            core_version: "6.0.0",
            capabilities: {
                protocols: ["ATOM_READ", "ATOM_PATCH", "SYSTEM_MANIFEST"],
                providers: ["system", "drive"]
            },
            schemas: localSchemas,
            workflows: localWorkflows
        };

        const dir = path.dirname(CONFIG.outputFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const fileContent = `/** INDRA GENERATED CONTRACT - DO NOT EDIT MANUALLY */\nexport const INDRA_CONTRACT = ${JSON.stringify(contract, null, 2)};`;
        fs.writeFileSync(CONFIG.outputFile, fileContent);

        console.log(`✅ [Scanner] Escaneo exitoso: ${localSchemas.length} esquemas detectados.`);
    } catch (error) {
        console.error("❌ [Scanner] Error crítico:", error);
        process.exit(1);
    }
}

runLocalScan();
