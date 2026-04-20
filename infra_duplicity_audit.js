const fs = require('fs');
const path = require('path');

/**
 * =============================================================================
 * INDRA DUPLICITY AUDITOR (v1.0)
 * =============================================================================
 */

const PROVIDERS_DIR = path.join(__dirname, 'system_core/core/2_providers');
const files = fs.readdirSync(PROVIDERS_DIR).filter(f => f.endsWith('.gs'));

const functionRegistry = {};
let duplicatesFound = 0;

console.log("🕵️ Iniciando Auditoría de Duplicidad en Capa 2 (Providers)...");

files.forEach(file => {
    const content = fs.readFileSync(path.join(PROVIDERS_DIR, file), 'utf8');
    const regex = /function\s+(\w+)\s*\(/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const funcName = match[1];
        if (functionRegistry[funcName]) {
            console.log(`[!] DUPLICIDAD DETECTADA: '${funcName}'`);
            console.log(`    - Primero visto en: ${functionRegistry[funcName]}`);
            console.log(`    - Colisión en: ${file}`);
            duplicatesFound++;
        } else {
            functionRegistry[funcName] = file;
        }
    }
});

if (duplicatesFound === 0) {
    console.log("\n✅ SINCERIDAD TOTAL: No se encontraron colisiones de nombres de funciones.");
} else {
    console.log(`\n❌ ERROR CRÍTICO: Se encontraron ${duplicatesFound} funciones duplicadas.`);
}
