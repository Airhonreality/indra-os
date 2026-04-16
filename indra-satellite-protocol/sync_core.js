import fs from 'fs';
import path from 'path';

/**
 * =============================================================================
 * INDRA CORE SYNC (The Contract Weaver v2.5)
 * =============================================================================
 * Responsabilidad: Sincronizar el Core y Consolidar la Espina Dorsal Local.
 * Objetivo: Crear un único indra_contract.json que fusione la Realidad del Core
 *           con la Intención Soberana del Satélite (Modularidad).
 * =============================================================================
 */

const CONFIG = {
    coreUrl: 'https://script.google.com/macros/s/AKfycbyhEucpkr6GtpMqQ0LnenhP4SIUXOUJ2M4ycFIVGLBmUuxWYL6hXRTUOBESiC6LlpfA/exec',
    satelliteToken: 'indra_satellite_omega', 
    outputFile: './_INDRA_PROTOCOL_/indra_contract.json',
    scorePath: './src/score'
};

/**
 * Escanea una carpeta y devuelve un array con el contenido de los JSONs.
 */
function harvestJsonFolder(folderName) {
    const fullPath = path.join(CONFIG.scorePath, folderName);
    if (!fs.existsSync(fullPath)) return [];
    
    return fs.readdirSync(fullPath)
        .filter(file => file.endsWith('.json'))
        .map(file => {
            const content = fs.readFileSync(path.join(fullPath, file), 'utf8');
            try {
                return JSON.parse(content);
            } catch (e) {
                console.warn(`⚠️ Error parseando local asset: ${file}`);
                return null;
            }
        })
        .filter(Boolean);
}

async function sync() {
    console.log("🚀 Iniciando Tejido de Contrato...");
    console.log(`🔗 Core: ${CONFIG.coreUrl}`);

    try {
        // 1. Cosecha Local (Espina Dorsal)
        console.log("🧬 Cosechando Espina Dorsal Local...");
        const localSchemas = harvestJsonFolder('schemas');
        const localWorkflows = harvestJsonFolder('workflows');

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
        if (manifestData.metadata?.status !== 'OK' && manifestData.metadata?.status !== 'NEEDS_SETUP') {
            throw new Error(`Error del Core: ${manifestData.metadata?.error || 'Desconocido'}`);
        }

        // 3. Obtener Esquemas de configuración globales
        const schemaRes = await fetch(CONFIG.coreUrl, {
            method: 'POST',
            body: JSON.stringify({
                protocol: 'SYSTEM_CONFIG_SCHEMA',
                provider: 'system',
                satellite_token: CONFIG.satelliteToken
            })
        });
        const schemaData = await schemaRes.json();
        
        // 3.5. Leer Metadata Soberana Local (Si existe)
        let localMeta = {};
        const metaPath = path.join(path.dirname(CONFIG.outputFile), 'indra_satellite.meta.json');
        if (fs.existsSync(metaPath)) {
            try {
                localMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                console.log(`👤 Identidad Sólida detectada: ${localMeta.satellite_name}`);
            } catch(e) {
                console.warn("⚠️ Advertencia: No se pudo leer indra_satellite.meta.json.");
            }
        }

        // 4. Consolidación Final (Axioma de la Realidad Única)
        const contract = {
            synced_at: new Date().toISOString(),
            core_id: localMeta.core_id || manifestData.metadata?.core_id || 'unknown',
            satellite_name: localMeta.satellite_name || 'Nuevo Satélite',
            core_version: manifestData.metadata?.core_version || 'unknown',
            capabilities: {
                protocols: [...new Set((manifestData.items || []).flatMap(i => i.protocols || []))],
                providers: (manifestData.items || []).filter(i => i.class === 'SILO').map(s => s.id),
                workspaces: (manifestData.items || []).filter(i => i.class === 'WORKSPACE').map(w => ({ id: w.id, label: w.handle?.label }))
            },
            // Fusión de Esquemas Globales + Locales
            schemas: [...(schemaData.items || []), ...localSchemas],
            // Inyección de Automatizaciones locales
            workflows: localWorkflows
        };

        // 5. Persistencia
        const dir = path.dirname(CONFIG.outputFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        fs.writeFileSync(CONFIG.outputFile, JSON.stringify(contract, null, 2));

        console.log("✅ ¡Tejido de Contrato completado con éxito!");
        console.log(`📄 Archivo consolidado: ${CONFIG.outputFile}`);
        console.log(`💎 Esquemas: ${contract.schemas.length} (Globales + Locales)`);
        console.log(`⚡ Workflows: ${contract.workflows.length} detectados`);
        
    } catch (error) {
        console.error("❌ Fallo en el tejido de contrato:");
        console.error(error.message);
    }
}

sync();
