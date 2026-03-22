import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  setupFullGame,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

/** 여행자를 참가시키고 역할을 배정하는 헬퍼 */
async function addTravellerWithRole(
  ctx: TestContext,
  name: string,
  roleId: string,
  alignment: 'good' | 'evil',
): Promise<{ socket: Socket; playerId: string }> {
  const travellerSocket = await ctx.connectPlayer();
  ctx.players.push(travellerSocket);

  const joinResult = await new Promise<{
    success: boolean;
    playerId?: string;
  }>((resolve) => {
    travellerSocket.emit('game:joinAsTraveller', { playerName: name }, resolve);
  });
  const playerId = joinResult.playerId ?? '';

  // 잠시 대기하여 joinAsTraveller로 인한 game:state 이벤트가 전파되도록 함
  await new Promise((r) => setTimeout(r, 100));

  // 역할 배정 - game:state를 스토리텔러가 수신할 때까지 대기
  const statePromise = waitForEvent(ctx.storyteller as Socket, 'game:state');

  const addResult = await new Promise<{
    success: boolean;
    error?: string;
  }>((resolve) => {
    ctx.storyteller.emit(
      'traveller:add',
      { playerId, roleId, alignment },
      resolve,
    );
  });
  if (!addResult.success) {
    throw new Error(`traveller:add failed: ${addResult.error}`);
  }

  await statePromise;

  return { socket: travellerSocket as Socket, playerId };
}

describe('E2E: 여행자 참가', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('여행자가 게임 진행 중에 참가할 수 있다', async () => {
    await setupFullGame(ctx);

    const travellerSocket = await ctx.connectPlayer();
    ctx.players.push(travellerSocket);

    const joinResult = await new Promise<{
      success: boolean;
      playerId?: string;
    }>((resolve) => {
      travellerSocket.emit(
        'game:joinAsTraveller',
        { playerName: 'Traveller1' },
        resolve,
      );
    });

    expect(joinResult.success).toBe(true);
    expect(joinResult.playerId).toBeDefined();

    const state = ctx.app.game.getState();
    const traveller = state.players.find((p) => p.id === joinResult.playerId);
    expect(traveller).toBeDefined();
    expect(traveller?.isTraveller).toBe(true);
    expect(traveller?.name).toBe('Traveller1');
  }, 15000);

  it('게임이 생성되지 않은 상태에서 여행자 참가 실패', async () => {
    const travellerSocket = await ctx.connectPlayer();
    ctx.players.push(travellerSocket);

    const joinResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      travellerSocket.emit(
        'game:joinAsTraveller',
        { playerName: 'Traveller1' },
        resolve,
      );
    });

    expect(joinResult.success).toBe(false);
  }, 10000);
});

describe('E2E: 여행자 역할 배정 및 알림', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('이야기꾼이 traveller:add로 여행자에게 역할을 배정한다', async () => {
    await setupFullGame(ctx);

    const travellerSocket = await ctx.connectPlayer();
    ctx.players.push(travellerSocket);

    const joinResult = await new Promise<{
      success: boolean;
      playerId?: string;
    }>((resolve) => {
      travellerSocket.emit(
        'game:joinAsTraveller',
        { playerName: 'Traveller1' },
        resolve,
      );
    });
    const travellerId = joinResult.playerId ?? '';

    // joinAsTraveller 이벤트가 전파되도록 대기
    await new Promise((r) => setTimeout(r, 100));

    // role:assign 및 traveller:joined 리스너 등록
    const rolePromise = waitForEvent<{
      roleId: string;
      roleName: string;
    }>(travellerSocket as Socket, 'role:assign');

    const travellerJoinedPromise = waitForEvent<{
      playerId: string;
      playerName: string;
      roleId: string;
      roleName: string;
    }>(ctx.players[0] as Socket, 'traveller:joined');

    const addResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.storyteller.emit(
        'traveller:add',
        { playerId: travellerId, roleId: 'scapegoat', alignment: 'good' },
        resolve,
      );
    });

    expect(addResult.success).toBe(true);

    const roleData = await rolePromise;
    expect(roleData.roleId).toBe('scapegoat');
    expect(roleData.roleName).toBe('속죄양');

    const joinedData = await travellerJoinedPromise;
    expect(joinedData.playerId).toBe(travellerId);
    expect(joinedData.roleId).toBe('scapegoat');
  }, 15000);

  it('악한 여행자에게 evil:info가 전송된다', async () => {
    await setupFullGame(ctx);

    const travellerSocket = await ctx.connectPlayer();
    ctx.players.push(travellerSocket);

    const joinResult = await new Promise<{
      success: boolean;
      playerId?: string;
    }>((resolve) => {
      travellerSocket.emit(
        'game:joinAsTraveller',
        { playerName: 'EvilTraveller' },
        resolve,
      );
    });
    const travellerId = joinResult.playerId ?? '';

    await new Promise((r) => setTimeout(r, 100));

    // evil:info 리스너를 먼저 등록
    const evilInfoPromise = waitForEvent<{
      demonName?: string;
    }>(travellerSocket as Socket, 'evil:info');

    await new Promise<void>((resolve) => {
      ctx.storyteller.emit(
        'traveller:add',
        { playerId: travellerId, roleId: 'gunslinger', alignment: 'evil' },
        () => resolve(),
      );
    });

    const evilInfo = await evilInfoPromise;
    expect(evilInfo.demonName).toBeDefined();
  }, 15000);

  it('일반 플레이어에게 traveller:add를 호출하면 실패한다', async () => {
    const { playerIds } = await setupFullGame(ctx);

    const addResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.storyteller.emit(
        'traveller:add',
        { playerId: playerIds[0], roleId: 'scapegoat', alignment: 'good' },
        resolve,
      );
    });

    expect(addResult.success).toBe(false);
  }, 15000);
});

describe('E2E: 여행자 추방', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('이야기꾼이 traveller:exile로 여행자를 추방한다', async () => {
    await setupFullGame(ctx);

    const { playerId: travellerId } = await addTravellerWithRole(
      ctx,
      'Traveller1',
      'scapegoat',
      'good',
    );

    // 추방 이벤트 리스너 먼저 등록
    const exilePromise = waitForEvent<{
      playerId: string;
      playerName: string;
      roleName: string;
    }>(ctx.players[0] as Socket, 'traveller:exiled');

    const exileResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.storyteller.emit('traveller:exile', travellerId, resolve);
    });

    expect(exileResult.success).toBe(true);

    const exileData = await exilePromise;
    expect(exileData.playerId).toBe(travellerId);
    expect(exileData.playerName).toBe('Traveller1');
    expect(exileData.roleName).toBe('속죄양');

    const player = ctx.app.game.getPlayer(travellerId);
    expect(player?.isAlive).toBe(false);
  }, 15000);

  it('일반 플레이어는 추방할 수 없다', async () => {
    const { playerIds } = await setupFullGame(ctx);

    const exileResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.storyteller.emit('traveller:exile', playerIds[0], resolve);
    });

    expect(exileResult.success).toBe(false);
  }, 15000);

  it('이미 사망한 여행자는 추방할 수 없다', async () => {
    await setupFullGame(ctx);

    const { playerId: travellerId } = await addTravellerWithRole(
      ctx,
      'Traveller1',
      'scapegoat',
      'good',
    );

    // 첫 번째 추방
    await new Promise<void>((resolve) => {
      ctx.storyteller.emit('traveller:exile', travellerId, () => resolve());
    });

    // 두 번째 추방 시도
    const exileResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.storyteller.emit('traveller:exile', travellerId, resolve);
    });

    expect(exileResult.success).toBe(false);
  }, 15000);

  it('추방은 승리 조건을 발동시키지 않는다', async () => {
    await setupFullGame(ctx);

    const { playerId: travellerId } = await addTravellerWithRole(
      ctx,
      'Traveller1',
      'scapegoat',
      'good',
    );

    // 추방
    await new Promise<void>((resolve) => {
      ctx.storyteller.emit('traveller:exile', travellerId, () => resolve());
    });

    // 게임이 끝나지 않았어야 함
    const state = ctx.app.game.getState();
    expect(state.phase).not.toBe('ended');
  }, 15000);
});
