const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * INDRA SYSTEM HEALTH SYNC - v1.1 (AUDIT MPC UPGRADE)
 * Genera un mapa estructural (MPC) con integridad criptográfica y detección de anomalías.
 */

const CONFIG = {
    targetDir: __dirname,
    outputFile: path.join(__dirname, 'Schema_Root.json'),
    exclude: [
        'node_modules',
        '.git',
        '.agent',
        '.claspignore',
        '.gitignore',
        '.gdriveignore',
        'package-lock.json',
        'desktop.ini',
        'Schema_Root.json'
    ],
    // Patrones que indican "ruido de contexto" o desorganización
    entropyPatterns: [
        /\(\d+\)/,          // Archivos duplicados tipo "file (1).js"
        /copia|copy/i,      // Copias manuales
        /temp|tmp|provisional/i,
        /test_old|v\d+_old/i,
        /debug_/i           // A veces son útiles, pero a menudo son ruido
    ]
};

function getFileHash(filePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha256');
        hashSum.update(fileBuffer);
        return hashSum.digest('hex');
    } catch (e) {
        return 'hash_failed';
    }
}

function detectAnomaly(name) {
    const flags = [];
    CONFIG.entropyPatterns.forEach(pattern => {
        if (pattern.test(name)) {
            flags.push(`ENTROPY_DETECTED: ${pattern.toString()}`);
        }
    });
    return flags;
}

function getFileTree(dir, relativePath = "") {
    const items = fs.readdirSync(dir);
    let tree = {};
    let dirStats = {
        totalFiles: 0,
        totalSize: 0,
        anomalies: 0
    };

    items.forEach(item => {
        if (CONFIG.exclude.includes(item)) return;

        const fullPath = path.join(dir, item);
        const relPath = path.join(relativePath, item);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            const subtree = getFileTree(fullPath, relPath);
            tree[item] = {
                type: 'directory',
                path: relPath.replace(/\\/g, '/'),
                stats: subtree.stats,
                content: subtree.tree
            };
            dirStats.totalFiles += subtree.stats.totalFiles;
            dirStats.totalSize += subtree.stats.totalSize;
            dirStats.anomalies += subtree.stats.anomalies;
        } else {
            const anomalies = detectAnomaly(item);
            const hash = getFileHash(fullPath);

            tree[item] = {
                type: 'file',
                path: relPath.replace(/\\/g, '/'),
                size: stats.size,
                lastModified: stats.mtime,
                integrity_hash: hash,
                audit_flags: anomalies.length > 0 ? anomalies : undefined
            };

            dirStats.totalFiles += 1;
            dirStats.totalSize += stats.size;
            if (anomalies.length > 0) dirStats.anomalies += 1;
        }
    });

    return { tree, stats: dirStats };
}

function calculateHealthScore(stats) {
    if (stats.totalFiles === 0) return 100;
    // La salud baja proporcionalmente a las anomalías detectadas
    const score = 100 - (stats.anomalies / stats.totalFiles * 100);
    return Math.max(0, Math.round(score * 100) / 100);
}

function sync() {
    console.log('\n--- INDRA AUDIT MPC SCANNER (v1.1) ---');
    console.log(`Analyzing: ${CONFIG.targetDir}`);

    try {
        const result = getFileTree(CONFIG.targetDir);
        const healthScore = calculateHealthScore(result.stats);

        const auditMPC = {
            system: "INDRA_OS",
            timestamp: new Date().toISOString(),
            version: "1.1.0",
            health_score: `${healthScore}%`,
            stats: result.stats,
            nodes: result.tree
        };

        fs.writeFileSync(CONFIG.outputFile, JSON.stringify(auditMPC, null, 4));

        console.log(`\nSUCCESS: Audit MPC generated at Schema_Root.json`);
        console.log(`System Health Score: ${healthScore}%`);
        console.log(`Total Files: ${result.stats.totalFiles}`);
        console.log(`Anomalies Detected: ${result.stats.anomalies}`);

        if (healthScore < 95) {
            console.warn(`WARNING: High entropy detected. Review "audit_flags" in the JSON.`);
        }
    } catch (error) {
        console.error('CRITICAL FAILURE during audit scan:', error);
    }
}

sync();



