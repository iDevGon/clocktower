import type { AddressInfo } from 'node:net';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
} from '@clocktower/shared/logic';
import { io, type Socket } from 'socket.io-client';
import type { AppInstance } from '../../createApp.js';
import { createApp } from '../../createApp.js';

type StorytellerSocket = Socket<
  ServerToStorytellerEvents,
  StorytellerToServerEvents
>;
type PlayerSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface TestContext {
  app: AppInstance;
  baseUrl: string;
  storyteller: StorytellerSocket;
  players: PlayerSocket[];
  connectStoryteller: () => Promise<StorytellerSocket>;
  connectPlayer: () => Promise<PlayerSocket>;
  cleanup: () => Promise<void>;
}

export async function setupTestServer(): Promise<TestContext> {
  const app = createApp();

  await new Promise<void>((resolve) => {
    app.httpServer.listen(0, () => resolve());
  });

  const port = (app.httpServer.address() as AddressInfo).port;
  const baseUrl = `http://localhost:${port}`;
  const sockets: Socket[] = [];

  const connectStoryteller = (): Promise<StorytellerSocket> =>
    new Promise((resolve) => {
      const socket = io(`${baseUrl}/storyteller`, {
        transports: ['websocket'],
      }) as StorytellerSocket;
      sockets.push(socket as Socket);
      socket.on('connect', () => resolve(socket));
    });

  const connectPlayer = (): Promise<PlayerSocket> =>
    new Promise((resolve) => {
      const socket = io(`${baseUrl}/player`, {
        transports: ['websocket'],
      }) as PlayerSocket;
      sockets.push(socket as Socket);
      socket.on('connect', () => resolve(socket));
    });

  const storyteller = await connectStoryteller();

  const cleanup = async () => {
    for (const s of sockets) {
      s.disconnect();
    }
    await app.close();
  };

  return {
    app,
    baseUrl,
    storyteller,
    players: [],
    connectStoryteller,
    connectPlayer,
    cleanup,
  };
}

/** 이벤트 1회 수신을 Promise로 래핑 */
export function waitForEvent<T>(
  socket: Socket,
  event: string,
  timeoutMs = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for event: ${event}`)),
      timeoutMs,
    );
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/** 게임 생성 → 플레이어 참가 → 역할 배분 → 게임 시작까지 */
export async function setupFullGame(
  ctx: TestContext,
  playerCount = 5,
): Promise<{
  playerIds: string[];
}> {
  // 1. game:state 리스너를 먼저 등록한 뒤 생성
  const statePromise = waitForEvent(ctx.storyteller as Socket, 'game:state');
  await new Promise<void>((resolve) => {
    ctx.storyteller.emit('game:create', (res) => {
      if (res.success) resolve();
    });
  });
  await statePromise;

  // 2. 플레이어 참가
  const playerIds: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    const playerSocket = await ctx.connectPlayer();
    ctx.players.push(playerSocket);

    // 리스너를 먼저 등록한 뒤 join
    const joinStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    const joinResult = await new Promise<{
      success: boolean;
      playerId?: string;
    }>((resolve) => {
      playerSocket.emit('game:join', { playerName: `Player${i + 1}` }, resolve);
    });
    if (joinResult.playerId) {
      playerIds.push(joinResult.playerId);
    }
    await joinStatePromise;
  }

  // 3. 역할 자동 배분 — 리스너 먼저 등록
  const distStatePromise = waitForEvent(
    ctx.storyteller as Socket,
    'game:state',
  );
  await new Promise<void>((resolve, reject) => {
    ctx.storyteller.emit('game:distributeRoles', {}, (res) => {
      if (res.success) resolve();
      else reject(new Error(res.error));
    });
  });
  await distStatePromise;

  // 4. 게임 시작 — 리스너 먼저 등록
  const startStatePromise = waitForEvent(
    ctx.storyteller as Socket,
    'game:state',
  );
  await new Promise<void>((resolve, reject) => {
    ctx.storyteller.emit('game:start', (res) => {
      if (res.success) resolve();
      else reject(new Error(res.error));
    });
  });
  await startStatePromise;

  return { playerIds };
}

/**
 * 게임 생성 → 플레이어 참가 → 수동 역할 배정 → 게임 시작.
 * roleAssignments: [{ roleId, drunkAs?, lunaticAs? }] — playerIds 순서대로 매핑
 */
export async function setupGameWithRoles(
  ctx: TestContext,
  roleAssignments: Array<{
    roleId: string;
    drunkAs?: string;
    lunaticAs?: string;
  }>,
): Promise<{ playerIds: string[] }> {
  const playerCount = roleAssignments.length;

  // 1. 게임 생성
  const statePromise = waitForEvent(ctx.storyteller as Socket, 'game:state');
  await new Promise<void>((resolve) => {
    ctx.storyteller.emit('game:create', (res) => {
      if (res.success) resolve();
    });
  });
  await statePromise;

  // 2. 플레이어 참가
  const playerIds: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    const playerSocket = await ctx.connectPlayer();
    ctx.players.push(playerSocket);
    const joinStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    const joinResult = await new Promise<{
      success: boolean;
      playerId?: string;
    }>((resolve) => {
      playerSocket.emit('game:join', { playerName: `Player${i + 1}` }, resolve);
    });
    if (joinResult.playerId) {
      playerIds.push(joinResult.playerId);
    }
    await joinStatePromise;
  }

  // 3. 수동 역할 배정
  for (let i = 0; i < playerCount; i++) {
    const assignStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    ctx.storyteller.emit('game:assignRole', {
      playerId: playerIds[i],
      roleId: roleAssignments[i].roleId,
      drunkAs: roleAssignments[i].drunkAs,
      lunaticAs: roleAssignments[i].lunaticAs,
    });
    await assignStatePromise;
  }

  // 4. 게임 시작
  const startStatePromise = waitForEvent(
    ctx.storyteller as Socket,
    'game:state',
  );
  await new Promise<void>((resolve, reject) => {
    ctx.storyteller.emit('game:start', (res) => {
      if (res.success) resolve();
      else reject(new Error(res.error));
    });
  });
  await startStatePromise;

  return { playerIds };
}

/** 낮 페이즈로 전환하고 지정된 서브페이즈까지 진행 */
export async function advanceToDay(
  ctx: TestContext,
  subPhase: 'whisper' | 'discussion' | 'nomination' | 'defense' = 'nomination',
): Promise<void> {
  const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
  ctx.storyteller.emit('game:setPhase', 'day');
  await phasePromise;

  if (subPhase !== 'whisper') {
    const subPromise = waitForEvent(ctx.players[0] as Socket, 'day:subPhase');
    ctx.storyteller.emit('day:setSubPhase', subPhase);
    await subPromise;
  }
}
