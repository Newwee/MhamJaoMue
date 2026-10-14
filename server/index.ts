import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { RoomManager } from './roomManager';
import { setupSocketHandlers } from './socketHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();
setupSocketHandlers(io, roomManager);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    rooms: roomManager.getRoomSummaryList().length,
  });
});

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Royal Club Gaming Platform API Server Running.');
    }
  });
});

const PORT = process.env.PORT || 3001;

function getNetworkAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

server.listen(PORT, () => {
  const nets = getNetworkAddresses();
  console.log(`\n======================================================`);
  console.log(` ROYAL CLUB CASINO SERVER ONLINE`);
  console.log(` Local:            http://localhost:${PORT}`);
  nets.forEach((ip) => {
    console.log(` Network / Mobile: http://${ip}:${PORT}`);
  });
  console.log(`======================================================\n`);
});
