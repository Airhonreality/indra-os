const fs = require('fs');
const path = require('path');

/**
 * 🏥 INDRA CORE ANATOMY COMPILER
 * Este script extrae el código de las capas 0, 1, 2 y 3 del Core
 * y lo compila en un JSON único para facilitar la auditoría y depuración.
 */

const CORE_PATH = __dirname;
const DEST_PATH = path.join(CORE_PATH, '../Documentacion/CORE_ANATOMY_SNAPSHOT.json');
const TARGET_DIRS = ['0_gateway', '0_utils', '1_logic', '2_providers', '3_services'];

function compile() {
    console.log("--- 🧬 Iniciando Compilación de Anatomía del Core ---");
    const anatomy = {
        compiled_at: new Date().toISOString(),
        core_version: "v18.0 OMEGA",
        layers: {}
    };

    TARGET_DIRS.forEach(dir => {
        const dirPath = path.join(CORE_PATH, dir);
        if (fs.existsSync(dirPath)) {
            console.log(`🔍 Escaneando Capa: ${dir}...`);
            anatomy.layers[dir] = {};
            
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.gs'));
            files.forEach(file => {
                const filePath = path.join(dirPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                anatomy.layers[dir][file] = content;
            });
        }
    });

    fs.writeFileSync(DEST_PATH, JSON.stringify(anatomy, null, 2));
    console.log(`✅ Anatomía compilada con éxito en: ${DEST_PATH}`);
}

try {
    compile();
} catch (e) {
    console.error("❌ Fallo crítico en la compilación:", e.message);
    process.exit(1);
}
