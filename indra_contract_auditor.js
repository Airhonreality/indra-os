const fs = require('fs');
const path = require('path');

/**
 * =============================================================================
 * INDRA CONTRACTUAL AUDITOR (v1.0)
 * =============================================================================
 * Auditoría de Cumplimiento Estático de la Ley de Retorno y Contratos de UQO.
 */

const CORE_DIR = path.join(__dirname, 'system_core/core');
const PROVIDERS_DIR = path.join(CORE_DIR, '2_providers');

const files = fs.readdirSync(PROVIDERS_DIR).filter(f => f.startsWith('infra_'));

console.log("🧐 INDRA CONTRACT AUDITOR: Verificando Leyes de Retorno...");

let totalViolations = 0;

files.forEach(file => {
    const content = fs.readFileSync(path.join(PROVIDERS_DIR, file), 'utf8');
    
    // Extraer bloques de funciones
    const funcBlocks = content.split('\nfunction ').slice(1);

    funcBlocks.forEach(block => {
        const lines = block.split('\n');
        const funcName = lines[0].split('(')[0].trim();
        if (!funcName.startsWith('_system_handle')) return;

        console.log(`\n🩺 Auditando: ${funcName} [${file}]`);
        
        let localViolations = 0;

        // 1. Verificación de Contrato de Entrada
        const hasInputValidation = block.includes('throw createError(') || block.includes('if (!uqo') || block.includes('uqo.context_id');
        if (!hasInputValidation) {
            console.log(`  [!] RIESGO: El handler no parece validar el contrato de entrada (UQO).`);
            localViolations++;
        }

        // 2. Verificación de Ley de Retorno (Estructura)
        const hasReturnItems = block.includes('items:') || block.includes('return route(') || block.includes('return {');
        const hasReturnMetadata = block.includes('metadata:') || block.includes('return route(');
        
        if (!hasReturnItems || !hasReturnMetadata) {
            console.log(`  [!] VIOLACIÓN: No se detecta una estructura de retorno fija {items, metadata}.`);
            localViolations++;
        }

        // 3. Verificación de Escudo de Resonancia (Try/Catch)
        const hasTryCatch = block.includes('try {') && block.includes('catch');
        if (!hasTryCatch) {
            console.log(`  [?] AVISO: Función sin try/catch local (Confía plenamente en el Router).`);
        }

        if (localViolations === 0) {
            console.log(`  ✅ CONTRATO CUMPLIDO.`);
        }
        totalViolations += localViolations;
    });
});

console.log(`\n📊 RESULTADO FINAL: ${totalViolations} violaciones de contrato detectadas.`);
if (totalViolations === 0) {
    console.log("🏆 EXCELENCIA CONTRACTUAL: Todos los handlers son ciudadanos ejemplares de Indra.");
}
