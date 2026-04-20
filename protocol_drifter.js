const fs = require('fs');
const path = require('path');

/**
 * =============================================================================
 * INDRA PROTOCOL DRIFTER (Symmetry Validator v1.0)
 * =============================================================================
 * Este script audita la consistencia entre el Cliente (JS) y el Core (GAS).
 * =============================================================================
 */

const CORE_REGISTRY_PATH = path.join(__dirname, 'system_core/core/0_gateway/protocol_registry.gs');
const CLIENT_SRC_PATH = path.join(__dirname, 'system_core/client/src');
const SATELLITE_SRC_PATH = path.join(__dirname, 'system_core/client/public/indra-satellite-protocol');

// 1. EXTRAER PROTOCOLOS DEL CORE
function getCoreProtocols() {
    const content = fs.readFileSync(CORE_REGISTRY_PATH, 'utf8');
    const regex = /'([A-Z0-9_]+)':\s*{/g;
    const protocols = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        protocols.push(match[1]);
    }
    return protocols;
}

// 2. ESCANEAR CLIENTE/SATÉLITE BUSCANDO LLAMADAS A PROTOCOLOS
function scanClientFiles(dir, protocolList) {
    const results = {
        valid: [],
        drifted: new Set(),
        filesScanned: 0
    };

    function walk(currentDir) {
        const files = fs.readdirSync(currentDir);
        files.forEach(file => {
            const fullPath = path.join(currentDir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (!file.includes('node_modules')) walk(fullPath);
            } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.filesScanned++;
                const content = fs.readFileSync(fullPath, 'utf8');
                // Buscamos: protocol: 'NOM_PROT' o protocol: "NOM_PROT"
                const protocolRegex = /protocol:\s*['"]([A-Z0-9_]+)['"]/g;
                let match;
                while ((match = protocolRegex.exec(content)) !== null) {
                    const pName = match[1];
                    if (!protocolList.includes(pName)) {
                        results.drifted.add(`${pName} (en ${path.relative(__dirname, fullPath)})`);
                    } else {
                        results.valid.push(pName);
                    }
                }
            }
        });
    }

    walk(dir);
    return results;
}

// EXECUTION
console.log("🔍 Iniciando Escaneo de Deriva de Protocolos (Drift Audit)...");

try {
    const coreProtocols = getCoreProtocols();
    console.log(`✅ Core Registry detectado: ${coreProtocols.length} protocolos legales.`);

    const clientScan = scanClientFiles(CLIENT_SRC_PATH, coreProtocols);
    const satelliteScan = scanClientFiles(SATELLITE_SRC_PATH, coreProtocols);

    const totalDrifted = [...clientScan.drifted, ...satelliteScan.drifted];

    console.log("\n--- [ REPORTE DE SALUD SIMÉTRICA ] ---");
    console.log(`Archivos escaneados: ${clientScan.filesScanned + satelliteScan.filesScanned}`);
    console.log(`Llamadas válidas:    ${clientScan.valid.length + satelliteScan.valid.length}`);
    
    if (totalDrifted.length === 0) {
        console.log("🏆 EXCELENTE: El Cliente y el Core están en resonancia perfecta.");
    } else {
        console.log("🚨 ALERTA: Se detectaron llamadas a protocolos NO REGISTRADOS en el Core:");
        totalDrifted.forEach(d => console.log(`   - ${d}`));
        console.log("\nAcción recomendada: Registra estos protocolos en protocol_registry.gs o corrige los typos en el cliente.");
    }

} catch (err) {
    console.error("❌ Fallo crítico en el auditor:", err.message);
}
