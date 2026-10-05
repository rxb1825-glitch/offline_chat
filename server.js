const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

function networkAddresses() {
  return Object.entries(os.networkInterfaces()).flatMap(([adapter, addresses]) =>
    (addresses || []).filter(address => address.family === 'IPv4' && !address.internal)
      .map(address => ({ adapter, url: `http://${address.address}:3000` }))
  );
}

const page = fs.readFileSync(path.join(__dirname, 'index.html'));
const server = http.createServer(async (req, res) => {
  if (req.url === '/network') {
    try {
      const addresses = await Promise.all(networkAddresses().map(async address => ({
        ...address,
        qr: await QRCode.toDataURL(address.url, { width: 240, margin: 4 })
      })));
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify(addresses));
    } catch (error) {
      res.writeHead(500);
      return res.end('Could not create connection codes. Try again.');
    }
  }
  if (req.url !== '/') {
    res.writeHead(404);
    return res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(page);
});
const io = new Server(server);

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    if (!data || typeof data.name !== 'string' || typeof data.text !== 'string') return;
    const name = data.name.trim().slice(0, 30);
    const text = data.text.trim().slice(0, 500);
    // The server supplies the connection ID so the sender can recognize its own message.
    if (name && text) io.emit('chat message', { name, text, senderId: socket.id });
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('On this laptop: http://localhost:3000');
  console.log('On your phone (same local network), try:');
  const addresses = networkAddresses();
  for (const { adapter, url } of addresses) console.log(`  ${url} (${adapter})`);
  if (!addresses.length) console.log('  No local IPv4 address found. Connect to Wi-Fi or Ethernet and restart.');
  console.log('Choose the active Wi-Fi/Ethernet adapter if several URLs appear.');
  console.log('Keep this terminal open. Ctrl+C stops the chat.');
});
