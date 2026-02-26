const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT) || 4173;
const root = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const sendFile = (res, filePath) => {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream'
    });
    res.end(data);
  });
};

http.createServer((req, res) => {
  const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
  const targetPath = path.normalize(path.join(root, reqPath === '/' ? 'index.html' : reqPath));

  if (!targetPath.startsWith(root)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(targetPath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      sendFile(res, path.join(targetPath, 'index.html'));
      return;
    }

    if (!err && stats.isFile()) {
      sendFile(res, targetPath);
      return;
    }

    sendFile(res, path.join(root, 'index.html'));
  });
}).listen(port, () => {
  console.log(`Static server running on port ${port}`);
});
