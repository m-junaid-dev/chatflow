// Copies the built React app (client/dist) into server/public so ONE Node server
// can serve the API, the WebSocket and the frontend (used for Railway/Render/etc.).
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'client', 'dist');
const dest = path.join(__dirname, '..', 'server', 'public');

if (!fs.existsSync(path.join(src, 'index.html'))) {
  console.error('client/dist not found - run the client build first.');
  process.exit(1);
}
fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log('Frontend copied to server/public');
