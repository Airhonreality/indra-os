/**
 * ⚛️ AtomicCableAudit.js
 * 
 * DHARMA: Auditoría de Fidelidad Física (L3).
 *         Verifica que los componentes React estén "cableados" a los 
 *         tokens atómicos y no contengan deuda visual hardcoded.
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
    targetDir: path.join(__dirname, '../../presentation'), // Carpeta de componentes
    tokensFile: path.join(__dirname, '../../styles/tokens.css'),
    forbiddenPatterns: [
        /color:\s*['"]#(?:[0-9a-fA-F]{3}){1,2}['"]/g,
        /background:\s*['"]#(?:[0-9a-fA-F]{3}){1,2}['"]/g,
        /backgroundColor:\s*['"]#(?:[0-9a-fA-F]{3}){1,2}['"]/g
    ],
    requiredKeywords: ['UIMasterLaw', 'MasterLaw', 'tokens']
};

function runAudit() {
    console.log("--- ⚛️ INDRA ATOMIC CABLE AUDIT (L3) ---");
    let totalFiles = 0;
    let visualDebtDetected = 0;
    const report = [];

    function scanDir(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                scanDir(fullPath);
            } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
                totalFiles++;
                auditFile(fullPath);
            }
        });
    }

    function auditFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);
        let fileDebt = 0;

        // 1. Detección de Colores Hardcoded
        CONFIG.forbiddenPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                fileDebt += matches.length;
            }
        });

        // 2. Verificación de Cableado Axiomático
        const isCabled = CONFIG.requiredKeywords.some(kw => content.includes(kw));

        if (fileDebt > 0 || !isCabled) {
            visualDebtDetected++;
            report.push({
                file: fileName,
                path: filePath,
                debtCount: fileDebt,
                isCabled: isCabled
            });
        }
    }

    scanDir(CONFIG.targetDir);

    // LOGS
    console.log(`Audited Files: ${totalFiles}`);
    console.log(`Files with Visual Debt/Weak Cabling: ${visualDebtDetected}`);

    if (report.length > 0) {
        console.log("\n🚨 DETAILED AUDIT REPORT:");
        report.forEach(item => {
            const status = item.isCabled ? "✅ CABLED" : "❌ LOOSE";
            console.log(`- ${item.file.padEnd(25)} | Debt: ${item.debtCount} | Status: ${status}`);
        });
    } else {
        console.log("\n✅ PERFECCIÓN ATÓMICA: No se detectó deuda visual hardcoded.");
    }

    console.log("---------------------------------------\n");
}

try {
    runAudit();
} catch (e) {
    console.error("Audit failed:", e.message);
}
