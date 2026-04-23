import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { INDRA_VERSION_CORE, INDRA_STATUS, INDRA_DHARMA } from './src/version.js';

// --- ANCLAJE DETERMINISTA (INVESTIGACIÓN INVS-01) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname);

console.log(`💎 [IndraVite] PROJECT_ROOT: ${PROJECT_ROOT}`);

const indraSyncServer = () => ({
    name: 'indra-sync-server',
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
            if (req.url === '/indra-sync/save-file') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    try {
                        const { filePath, content } = JSON.parse(body);
                        const fileName = path.basename(filePath);
                        
                        // RUTA ABSOLUTA FORZADA (Evita recursividad en Windows)
                        const absolutePath = 'c:/Users/javir/Documents/DEVs/INDRA FRONT END/system_core/client/public/indra-satellite-protocol/indra_config.js';
                        
                        console.log(`🚀 [IndraVite] Petición de sellado recibida.`);
                        console.log(`📡 [IndraVite] IMPACTANDO EN: ${absolutePath}`);

                        fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
                        fs.writeFileSync(absolutePath, content, 'utf8');
                        
                        server.ws.send({
                          type: 'custom',
                          event: 'indra-sync-complete',
                          data: { file: fileName, timestamp: Date.now() }
                        });

                        res.statusCode = 200;
                        res.end(JSON.stringify({ status: 'OK', path: absolutePath }));
                    } catch (e) {
                        console.error(`❌ [IndraVite] ERROR DE PERSISTENCIA: ${e.message}`);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: e.message }));
                    }
                });
            } else {
                next();
            }
        });
    }
});

export default defineConfig({
    plugins: [react(), indraSyncServer()],
    base: '/indra-os/',
    define: {
        __INDRA_VERSION__: JSON.stringify(INDRA_VERSION_CORE),
        __INDRA_STATUS__: JSON.stringify(INDRA_STATUS),
        __INDRA_DHARMA__: JSON.stringify(INDRA_DHARMA)
    },
    server: {
        port: 3000,
        open: true,
        watch: {
            ignored: ['**/indra_config.js'],
            usePolling: true
        }
    }
});
