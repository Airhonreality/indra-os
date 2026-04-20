import fs from 'fs';
import path from 'path';

/**
 * =============================================================================
 * INDRA CORE SYNC (The Production Packager v3.3)
 * =============================================================================
 * Responsibilidad: Consolidar el ADN local y la verdad del Core en un Snapshot
 * para despliegues estáticos o entornos de producción sin Live Resonance.
 * =============================================================================
 */

const CONFIG = {
    coreUrl: 'https://script.google.com/macros/s/AKfycbyhEucpkr6GtpMqQ0LnenhP4SIUXOUJ2M4ycFIVGLBmUuxWYL6hXRTUOBESiC6LlpfA/exec',
    satelliteToken: 'indra_satellite_omega', 
    outputFile: './_INDRA_PROTOCOL_/indra_contract.js',
    scorePath: './src/score'
};

/**
 * Escanea la carpeta 'score' para cosechar módulos JS de ADN.
 */
async function harvestAssets(folderName) {
    const fullPath = path.join(CONFIG.scorePath, folderName);
    if (!fs.existsSync(fullPath)) return [];
    
    const files = fs.readdirSync(fullPath);
    const assets = [];

    for (const file of files) {
        const filePath = path.join(fullPath, file);
        if (file.endsWith('.js')) {
            try {
                const module = await import('file://' + path.resolve(filePath));
                assets.push(module.default || module.schema || module.workflow || module);
            } catch (e) {
                console.warn(`⚠️ Error importando ADN: ${file}`, e.message);
            }
        }
    }
    return assets.filter(Boolean);
}

async function consolidateSnapshot() {
    console.log("📦 [Packager] Iniciando empaquetado de Snapshot...");

    try {
        const localSchemas = await harvestAssets('schemas');
        const localWorkflows = await harvestAssets('workflows');

        console.log("🛰️ Consultando Manifiesto Global...");
        const response = await fetch(CONFIG.coreUrl, {
            method: 'POST',
            body: JSON.stringify({
                protocol: 'SYSTEM_MANIFEST',
                provider: 'system',
                satellite_token: CONFIG.satelliteToken
            })
        });
        const manifest = await response.json();

        const contract = {
            synced_at: new Date().toISOString(),
            core_id: manifest.metadata?.core_id || 'unknown',
            core_version: manifest.metadata?.core_version || 'unknown',
            capabilities: {
                protocols: [...new Set((manifest.items || []).flatMap(i => i.protocols || []))],
                providers: (manifest.items || []).filter(i => i.class === 'SILO').map(s => s.id),
                workspaces: (manifest.items || []).filter(i => i.class === 'WORKSPACE').map(w => ({ id: w.id, label: w.handle?.label }))
            },
            schemas: localSchemas,
            workflows: localWorkflows
        };

        const dir = path.dirname(CONFIG.outputFile);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        
        const fileContent = `/** INDRA GENERATED SNAPSHOT (v5.0) */\nexport const INDRA_CONTRACT = ${JSON.stringify(contract, null, 2)};`;
        fs.writeFileSync(CONFIG.outputFile, fileContent);

        console.log("✅ Snapshot generado con éxito en _INDRA_PROTOCOL_/indra_contract.js");
        
    } catch (error) {
        console.error("❌ Fallo en el empaquetado:", error);
    }
}

consolidateSnapshot();

