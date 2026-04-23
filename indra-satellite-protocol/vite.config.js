import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// --- ANCLAJE DETERMINISTA ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugin de Vite Crudo para el Daemon Soberano
const indraDevServerPlugin = () => {
  return {
    name: 'indra-satellite-local-fs',
    configureServer(server) {
      
      // 1. Guardar Workflows Individuales
      server.middlewares.use('/api/save-score', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const id = data.id || 'draft_workflow';
              const targetPath = path.resolve(__dirname, `src/score/workflows/${id}.json`);
              if (!fs.existsSync(path.dirname(targetPath))) fs.mkdirSync(path.dirname(targetPath), { recursive: true });
              fs.writeFileSync(targetPath, JSON.stringify(data, null, 4));
              res.statusCode = 200;
              res.end(JSON.stringify({ status: 'ok', file: `${id}.json` }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
          });
        }
      });

      // 2. Persistencia de Configuración (AGNÓSTICO JS MODULE)
      server.middlewares.use('/api/indra/metadata', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const targetPath = path.resolve(__dirname, `indra_config.js`);
              
              // Envolver en Módulo ES nativo
              const fileContent = `/** INDRA SATELLITE CONFIG (Agnostic JS Module) */\nexport const INDRA_CONFIG = ${JSON.stringify(data, null, 2)};`;
              
              fs.writeFileSync(targetPath, fileContent);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok', message: 'Configuración guardada como Módulo JS' }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
          });
        }
      });

      // 3. Sincronía Soberana (Indra Sync Protocol)
      server.middlewares.use('/indra-sync/save-file', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
            try {
              const { filePath, content } = JSON.parse(body);
              
              // RESOLUCIÓN HOMESTÁTICA: Relativo a la raíz del protocolo
              const absolutePath = path.resolve(__dirname, filePath);
              
              if (!fs.existsSync(path.dirname(absolutePath))) fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
              fs.writeFileSync(absolutePath, content, 'utf8');
              
              console.log(`[SovereignSync] ✅ Materia sellada en: ${absolutePath}`);

              // RESONANCIA VITE: Notificar al HUD vía WebSocket
              server.ws.send({
                type: 'custom',
                event: 'indra-sync-complete',
                data: { file: path.basename(filePath), timestamp: Date.now() }
              });

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok', path: absolutePath }));
            } catch (err) {
              console.error(`[SovereignSync] ❌ ERROR: ${err.message}`);
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
          });
        }
      });

      // 4. Escaneo de ADN (Cosecha Local)
      server.middlewares.use('/api/indra/scan', (req, res) => {
        if (req.method === 'POST') {
          exec('node local_scanner.js', (error, stdout) => {
            if (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ status: 'error', message: error.message }));
              return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ status: 'ok', output: stdout }));
          });
        }
      });

      // 5. Listado Determinista de Esquemas (Indra Sync Protocol)
      server.middlewares.use('/indra-sync/list-schemas', (req, res) => {
        if (req.method === 'GET') {
          try {
            const scoresDir = path.resolve(__dirname, 'scores');
            if (!fs.existsSync(scoresDir)) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify([]));
              return;
            }
            const files = fs.readdirSync(scoresDir)
              .filter(file => file.endsWith('.js'));
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(files));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: err.message }));
          }
        }
      });
    }
  };
};

export default defineConfig({
  plugins: [indraDevServerPlugin()],
  server: {
    port: 3001, // Puerto independiente para el Bridge
    watch: {
      ignored: ['**/indra_config.js', '**/scores/**']
    }
  }
});
