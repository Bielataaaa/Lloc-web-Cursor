const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = 8080;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
};

http
  .createServer((req, res) => {
    const file = path.join(root, req.url === '/' ? 'index.html' : path.normalize(req.url).replace(/^(\.\.(\/|\\|$))+/, ''));
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('No trobat');
        return;
      }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain' });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`http://localhost:${port}`);
  });
