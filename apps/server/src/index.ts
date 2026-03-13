import { createServer } from 'node:http';
import os from 'node:os';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
} from '@clocktower/shared/logic';
import cors from 'cors';
import express from 'express';
// @ts-expect-error no types
import qrcode from 'qrcode-terminal';
import { type Namespace, Server } from 'socket.io';
import { GameManager } from './game.js';
import { registerPlayerHandlers } from './handlers/player.js';
import { registerStorytellerHandlers } from './handlers/storyteller.js';
import { WhisperTracker } from './whisper.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const game = new GameManager();
const storytellerIo = io.of('/storyteller') as unknown as Namespace<
  StorytellerToServerEvents,
  ServerToStorytellerEvents
>;
const playerIo = io.of('/player') as unknown as Namespace<
  ClientToServerEvents,
  ServerToClientEvents
>;
const whisperTracker = new WhisperTracker(storytellerIo, playerIo);

// Register socket handlers
registerStorytellerHandlers(storytellerIo, playerIo, game, whisperTracker);
registerPlayerHandlers(storytellerIo, playerIo, game, whisperTracker);

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', game: game.getState() });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  const localIP = getLocalIP();
  const serverUrl = `http://${localIP}:${PORT}`;
  console.log(`\nServer running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: ${serverUrl}`);
  console.log(`\nStoryteller 앱에서 아래 QR을 스캔하세요:\n`);
  qrcode.generate(serverUrl, { small: true });
});

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
