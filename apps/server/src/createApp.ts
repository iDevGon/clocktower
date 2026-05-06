import { createServer, type Server as HttpServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
} from '@clocktower/shared/logic';
import cors from 'cors';
import express from 'express';
import { type Namespace, Server } from 'socket.io';
import { getDashboardHtml } from './dashboard.js';
import { GameManager } from './game.js';
import { registerPlayerHandlers } from './handlers/player.js';
import { registerStorytellerHandlers } from './handlers/storyteller.js';
import { WhisperTracker } from './whisper.js';

export interface AppInstance {
  httpServer: HttpServer;
  io: Server;
  game: GameManager;
  close: () => Promise<void>;
}

export function createApp(): AppInstance {
  const app = express();
  app.use(cors());
  app.use(
    '/dashboard-fonts',
    express.static(
      path.resolve(process.cwd(), 'apps/storyteller/assets/fonts'),
    ),
  );
  app.use(
    '/dashboard-fonts',
    express.static(path.resolve(process.cwd(), '../storyteller/assets/fonts')),
  );

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

  registerStorytellerHandlers(storytellerIo, playerIo, game, whisperTracker);
  registerPlayerHandlers(storytellerIo, playerIo, game, whisperTracker);

  app.get('/', (_req, res) => {
    res.json({ status: 'ok', game: game.getState() });
  });

  app.get('/dashboard', (_req, res) => {
    const host = getLocalIP();
    // 로컬 IP 기반 URL 생성
    const baseUrl = `http://${host}`;
    const serverUrl = `${baseUrl}:3000`;
    const playerUrl = `${baseUrl}:8081`;
    const storytellerUrl = `${baseUrl}:8082`;
    const playerExpUrl = `exp://${host}:8081`;
    const storytellerExpUrl = `exp://${host}:8082`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(
      getDashboardHtml(
        serverUrl,
        playerUrl,
        storytellerUrl,
        playerExpUrl,
        storytellerExpUrl,
      ),
    );
  });

  const close = () =>
    new Promise<void>((resolve) => {
      io.close(() => {
        httpServer.close(() => resolve());
      });
    });

  return { httpServer, io, game, close };
}

function getLocalIP(): string {
  const match = Object.values(os.networkInterfaces())
    .flat()
    .find((iface) => iface?.family === 'IPv4' && !iface.internal);
  return match?.address ?? 'localhost';
}
