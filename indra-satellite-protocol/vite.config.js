import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

// Plugin de Vite Crudo para guardar Workflows
const indraDevServerPlugin = () => {
  return {
    name: 'indra-satellite-local-fs',
    configureServer(server) {
      // Usamos el middleware del servidor Vite
      server.middlewares.use('/api/save-score', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString(); // convert Buffer to string
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const id = data.id || 'draft_workflow';
              const targetPath = path.resolve(__dirname, `src/score/workflows/${id}.json`);
              
              // Asegurar que exista la carpeta
              const dir = path.dirname(targetPath);
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

              fs.writeFileSync(targetPath, JSON.stringify(data, null, 4));
              
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok', file: `${id}.json` }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'error', message: err.message }));
            }
          });
        } else {
          res.statusCode = 405; // Method Not Allowed
          res.end();
        }
      });
      // Middleware para guardar Metadata Satelital
      server.middlewares.use('/api/indra/metadata', (req, res, next) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk.toString());
          req.on('end', () => {
             try {
                const data = JSON.parse(body);
                const targetPath = path.resolve(__dirname, `_INDRA_PROTOCOL_/indra_satellite.meta.json`);
                const dir = path.dirname(targetPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                
                fs.writeFileSync(targetPath, JSON.stringify(data, null, 4));
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'ok' }));
             } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'error', message: err.message }));
             }
          });
        } else {
             next();
        }
      // Middleware para disparar SINCRONIZACIÓN (Local Compiler)
      server.middlewares.use('/api/indra/sync', (req, res, next) => {
        if (req.method === 'POST') {
            const { exec } = req.protocol === 'https' ? require('child_process') : require('child_process'); // Node standard
            exec('node sync_core.js', (error, stdout, stderr) => {
                if (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ status: 'error', message: error.message }));
                    return;
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ status: 'ok', output: stdout }));
            });
        } else {
            next();
        }
      });

    }
  };
};

export default defineConfig({
  plugins: [indraDevServerPlugin()],
  server: {
    port: 3000,
    open: true
  }
});
