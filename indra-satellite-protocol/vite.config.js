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
