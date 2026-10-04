// Servidor estático mínimo (sin dependencias) para servir el frontend en http://localhost:5500
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 5500;
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

    // Evitar salir de la carpeta del frontend
    if (!filePath.startsWith(ROOT) || path.basename(filePath) === 'server.js') {
      res.writeHead(403).end('Prohibido');
      return;
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream' });
      res.end(content);
    });
  })
  .listen(PORT, () => console.log(`Frontend disponible en http://localhost:${PORT}`));
