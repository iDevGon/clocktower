import { createServer, type Server as HttpServer } from 'node:http';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
} from '@clocktower/shared/logic';
import cors from 'cors';
import express from 'express';
import { type Namespace, Server } from 'socket.io';
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

  const close = () =>
    new Promise<void>((resolve) => {
      io.close(() => {
        httpServer.close(() => resolve());
      });
    });

  return { httpServer, io, game, close };
}
