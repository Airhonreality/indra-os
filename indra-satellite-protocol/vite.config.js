import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

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
              const targetPath = path.resolve(__dirname, `_INDRA_PROTOCOL_/indra_config.js`);
              
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

      // 3. Escaneo de ADN (Cosecha Local)
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
    }
  };
};

export default defineConfig({
  plugins: [indraDevServerPlugin()],
  server: {
    port: 3000,
    open: true,
    watch: {
        // ARIES: Ignoramos la carpeta de protocolos para evitar el bucle de recarga infinita
        ignored: ['**/_INDRA_PROTOCOL_/**']
    }
  }
});
