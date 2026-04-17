const fs = require('fs');
const path = require('path');

const CORE_PATH = path.join(__dirname, '../system_core/core');
const MANIFEST_PATH = path.join(CORE_PATH, 'files_manifest.json');

// Extensiones que Indra reconoce como código de servidor
const VALID_EXTENSIONS = ['.js', '.gs'];
// Archivos que deben ser ignorados por seguridad o redundancia
const IGNORE_FILES = ['files_manifest.json', 'manifest.json', 'version.json', 'appsscript.json'];

function scanDirectory(dir, baseDir = '') {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const relativePath = path.join(baseDir, file).replace(/\\/g, '/');
        const stat = fs.statSync(fullPath);

        if (stat && stat.isDirectory()) {
            // No escaneamos carpetas ocultas o de respaldo
            if (!file.startsWith('.')) {
                results = results.concat(scanDirectory(fullPath, relativePath));
            }
        } else {
            const ext = path.extname(file);
            if (VALID_EXTENSIONS.includes(ext) && !IGNORE_FILES.includes(file)) {
                // Generamos la entrada del manifiesto
                const name = path.basename(file, ext);
                results.push({
                    path: relativePath,
                    name: name,
                    // Si es appsscript.json le damos trato especial (aunque está ignorado arriba, por si acaso)
                    type: file === 'appsscript.json' ? 'JSON' : 'SERVER_JS'
                });
            }
        }
    });

    return results;
}

console.log('🏗️ [Indra Loom] Iniciando escaneo de ADN del Core...');
try {
    const files = scanDirectory(CORE_PATH);
    
    // El manifiesto siempre debe empezar con los archivos críticos para el orden de carga si fuera necesario
    // Aunque GAS es multipropósito, mantenemos appsscript.json fuera por ahora ya que el orquestador lo maneja aparte
    
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(files, null, 2));
    
    console.log(`✅ [Indra Loom] Manifiesto actualizado con éxito. ${files.length} átomos detectados.`);
    console.table(files.map(f => ({ Átomo: f.name, Ruta: f.path })));

} catch (err) {
    console.error('❌ [Indra Loom] Error fatal al generar el manifiesto:', err);
    process.exit(1);
}
