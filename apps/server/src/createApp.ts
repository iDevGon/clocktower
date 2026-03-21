import { createServer, type Server as HttpServer } from 'node:http';
import os from 'node:os';
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

function qrImgUrl(data: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

function getDashboardHtml(
  serverUrl: string,
  playerUrl: string,
  storytellerUrl: string,
  playerExpUrl: string,
  storytellerExpUrl: string,
): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>시계탑 개발 대시보드</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0e0e12;color:#e0ddd8;min-height:100vh;padding:32px}
h1{text-align:center;font-size:24px;margin-bottom:8px}
.sub{text-align:center;color:#5c5a58;font-size:13px;margin-bottom:32px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:960px;margin:0 auto}
@media(max-width:768px){.grid{grid-template-columns:1fr}}
.card{background:#1a1a1e;border:1px solid #2e2e34;border-radius:12px;padding:24px;text-align:center}
.t{font-size:18px;font-weight:700;margin-bottom:4px}
.p{font-size:12px;color:#5c5a58;margin-bottom:16px}
.qr{background:#fff;border-radius:8px;padding:8px;display:inline-block;margin-bottom:12px}
.qr img{display:block;width:180px;height:180px}
.u{font-size:12px;color:#908e8a;word-break:break-all;margin-bottom:8px}
.u a{color:#5dade2;text-decoration:none}
.u a:hover{text-decoration:underline}
.s .t{color:#c4a050} .pl .t{color:#7090c4} .st .t{color:#b85c5c}
.b{display:inline-block;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;margin-top:4px}
.bw{background:#1e3a4a;color:#5dade2} .be{background:#2a1e2e;color:#c4a0d0}
.ql{font-size:11px;color:#5c5a58;margin-top:8px;margin-bottom:4px}
</style>
</head>
<body>
<h1>시계탑 개발 대시보드</h1>
<p class="sub">Expo Go 앱에서 QR 코드를 스캔하세요</p>
<div class="grid">
  <div class="card s">
    <div class="t">서버</div>
    <div class="p">포트 :3000</div>
    <div class="qr"><img src="${qrImgUrl(serverUrl)}" alt="서버 QR"></div>
    <div class="u"><a href="${serverUrl}" target="_blank">${serverUrl}</a></div>
    <span class="b bw">이야기꾼 앱에서 입력</span>
  </div>
  <div class="card pl">
    <div class="t">플레이어 앱</div>
    <div class="p">포트 :8081</div>
    <div class="qr"><img src="${qrImgUrl(playerExpUrl)}" alt="플레이어 QR"></div>
    <div class="u">${playerExpUrl}</div>
    <span class="b be">Expo Go</span>
    <div class="ql">웹 브라우저</div>
    <div class="u"><a href="${playerUrl}" target="_blank">${playerUrl}</a></div>
  </div>
  <div class="card st">
    <div class="t">이야기꾼 앱</div>
    <div class="p">포트 :8082</div>
    <div class="qr"><img src="${qrImgUrl(storytellerExpUrl)}" alt="이야기꾼 QR"></div>
    <div class="u">${storytellerExpUrl}</div>
    <span class="b be">Expo Go</span>
    <div class="ql">웹 브라우저</div>
    <div class="u"><a href="${storytellerUrl}" target="_blank">${storytellerUrl}</a></div>
  </div>
</div>
</body>
</html>`;
}
