import fs from 'fs';
import path from 'path';

/**
 * =============================================================================
 * INDRA CORE SYNC (The Contract Weaver v3.2 - JS Native)
 * =============================================================================
 * Responsibilidad: Consolidar la realidad del Core y el ADN local en módulos JS.
 * =============================================================================
 */

const CONFIG = {
    coreUrl: 'https://script.google.com/macros/s/AKfycbyhEucpkr6GtpMqQ0LnenhP4SIUXOUJ2M4ycFIVGLBmUuxWYL6hXRTUOBESiC6LlpfA/exec',
    satelliteToken: 'indra_satellite_omega', 
    outputFile: './_INDRA_PROTOCOL_/indra_contract.js',
    scorePath: './src/score'
};

/**
 * Escanea una carpeta y devuelve un array con el contenido de los JSONs y JS modules.
 */
async function harvestAssets(folderName) {
    const fullPath = path.join(CONFIG.scorePath, folderName);
    if (!fs.existsSync(fullPath)) return [];
    
    const files = fs.readdirSync(fullPath);
    const assets = [];

    for (const file of files) {
        const filePath = path.join(fullPath, file);
        
        // --- CASO JSON (Legacy) ---
        if (file.endsWith('.json')) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                assets.push(JSON.parse(content));
            } catch (e) {
                console.warn(`⚠️ Error parseando JSON: ${file}`);
            }
        } 
        // --- CASO JS (Agnostic ADN) ---
        else if (file.endsWith('.js')) {
            try {
                // Importación dinámica para extraer el export default o named export
                // Usamos absolute path para evitar líos de módulos
                const module = await import('file://' + path.resolve(filePath));
                assets.push(module.default || module.schema || module.workflow || module);
            } catch (e) {
                console.warn(`⚠️ Error importando asset JS: ${file}`, e.message);
            }
        }
    }
    return assets.filter(Boolean);
}

async function sync() {
    console.log("🚀 Iniciando Tejido de Contrato (JS-ADN Mode)...");

    try {
        // 1. Cosecha Local (Espina Dorsal)
        console.log("🧬 Cosechando ADN Local (JS/JSON)...");
        const localSchemas = await harvestAssets('schemas');
        const localWorkflows = await harvestAssets('workflows');

        // 2. Handshake con el Core
        console.log("🛰️ Sincronizando Capacidades del Core...");
        const manifestRes = await fetch(CONFIG.coreUrl, {
            method: 'POST',
            body: JSON.stringify({
                protocol: 'SYSTEM_MANIFEST',
                provider: 'system',
                satellite_token: CONFIG.satelliteToken
            })
        });
        
        const manifestData = await manifestRes.json();
        
        // 3. Obtener Esquemas Globales
        const schemaRes = await fetch(CONFIG.coreUrl, {
            method: 'POST',
            body: JSON.stringify({
                protocol: 'SYSTEM_CONFIG_SCHEMA',
                provider: 'system',
                satellite_token: CONFIG.satelliteToken
            })
        });
        const schemaData = await schemaRes.json();
        
        // 4. Leer Configuración Local (indra_config.js)
        let localConfig = {};
        const configPath = path.resolve('./_INDRA_PROTOCOL_/indra_config.js');
        if (fs.existsSync(configPath)) {
            try {
                const configModule = await import('file://' + configPath);
                localConfig = configModule.INDRA_CONFIG || {};
                console.log(`👤 Identidad Sólida (JS): ${localConfig.satellite_name}`);
            } catch(e) {
                console.warn("⚠️ Advertencia: No se pudo leer indra_config.js.");
            }
        }

        // 5. Consolidación Final
        const contract = {
            synced_at: new Date().toISOString(),
            core_id: localConfig.core_id || manifestData.metadata?.core_id || 'unknown',
            satellite_name: localConfig.satellite_name || 'Nuevo Satélite',
            core_version: manifestData.metadata?.core_version || 'unknown',
            capabilities: {
                protocols: [...new Set((manifestData.items || []).flatMap(i => i.protocols || []))],
                providers: (manifestData.items || []).filter(i => i.class === 'SILO').map(s => s.id),
                workspaces: (manifestData.items || []).filter(i => i.class === 'WORKSPACE').map(w => ({ id: w.id, label: w.handle?.label }))
            },
            schemas: [...(schemaData.items || []), ...localSchemas],
            workflows: localWorkflows
        };

        // 6. Persistencia (Como Módulo JS)
        const dir = path.dirname(CONFIG.outputFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const fileContent = `/** INDRA GENERATED CONTRACT (Agnostic JS Module) */\nexport const INDRA_CONTRACT = ${JSON.stringify(contract, null, 2)};`;
        fs.writeFileSync(CONFIG.outputFile, fileContent);

        console.log("✅ ¡Tejido de Contrato completado!");
        console.log(`📄 Módulo JS generado: ${CONFIG.outputFile}`);
        console.log(`💎 Esquemas: ${contract.schemas.length}`);
        console.log(`⚡ Workflows: ${contract.workflows.length}`);
        
    } catch (error) {
        console.error("❌ Fallo en el tejido de contrato:", error);
    }
}

sync();
