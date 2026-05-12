import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  advanceToDay,
  setupFullGame,
  setupGameWithRoles,
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

  // 역할 배정 - game:state를 이야기꾼이 수신할 때까지 대기
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
    expect(roleData.roleName).toBe('희생양');

    const joinedData = await travellerJoinedPromise;
    expect(joinedData.playerId).toBe(travellerId);
    expect(joinedData.roleId).toBe('scapegoat');
  }, 15000);

  it('악한 여행자는 악마만 알며 하수인 정보는 받지 않는다', async () => {
    await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

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
      otherMinionNames?: string[];
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
    expect(evilInfo.otherMinionNames).toBeUndefined();
  }, 15000);

  it('일반 플레이어에게 traveller:add를 호출하면 여행자로 전환된다', async () => {
    const { playerIds } = await setupFullGame(ctx);
    const targetId = playerIds[0];

    // 전환 전: 일반 플레이어이고 기존 역할이 있다
    const beforePlayer = ctx.app.game.getPlayer(targetId);
    expect(beforePlayer?.isTraveller).toBeFalsy();
    const previousRoleId = beforePlayer?.role?.id;
    expect(previousRoleId).toBeDefined();

    const addResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.storyteller.emit(
        'traveller:add',
        { playerId: targetId, roleId: 'scapegoat', alignment: 'good' },
        resolve,
      );
    });

    expect(addResult.success).toBe(true);

    // 전환 후: 여행자로 변경되고, 여행자 역할이 배정된다
    const afterPlayer = ctx.app.game.getPlayer(targetId);
    expect(afterPlayer?.isTraveller).toBe(true);
    expect(afterPlayer?.role?.id).toBe('scapegoat');
    expect(afterPlayer?.role?.team).toBe('traveller');
    expect(afterPlayer?.travellerAlignment).toBe('good');
    // 기존 일반 역할은 해제되어야 한다
    expect(afterPlayer?.role?.id).not.toBe(previousRoleId);
  }, 15000);
});

describe('E2E: S&V 여행자 진행 이벤트', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('익살꾼 추방 투표 통과 시 자동 추방 대신 이야기꾼 판정을 요청한다', async () => {
    const { playerIds } = await setupFullGame(ctx);
    await advanceToDay(ctx, 'nomination');
    const deviant = await addTravellerWithRole(
      ctx,
      'Deviant',
      'deviant',
      'good',
    );

    const judgementPromise = waitForEvent<{
      targetId: string;
      targetName: string;
      guiltyCount: number;
      totalPlayers: number;
    }>(ctx.storyteller as Socket, 'deviant:exileJudgement');

    const proposeResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[0].emit(
        'exile:propose',
        { targetId: deviant.playerId },
        resolve,
      );
    });
    expect(proposeResult.success).toBe(true);

    for (const socket of [...ctx.players]) {
      await new Promise<void>((resolve) => {
        socket.emit('exile:vote', { guilty: true }, () => resolve());
      });
    }

    const judgement = await judgementPromise;
    expect(judgement.targetId).toBe(deviant.playerId);
    expect(judgement.guiltyCount).toBe(playerIds.length + 1);
    expect(ctx.app.game.getPlayer(deviant.playerId)?.isAlive).toBe(true);

    const exileResultPromise = waitForEvent<{
      targetId: string;
      exiled: boolean;
    }>(ctx.players[0] as Socket, 'exile:result');
    ctx.storyteller.emit('exile:forceClose', { exiled: true });
    const exileResult = await exileResultPromise;
    expect(exileResult.targetId).toBe(deviant.playerId);
    expect(exileResult.exiled).toBe(true);
    expect(ctx.app.game.getPlayer(deviant.playerId)?.isAlive).toBe(false);
  }, 20000);

  it('탕녀는 방문 대상에게 동의를 요청하고 이야기꾼에게 결과를 보낸다', async () => {
    const { playerIds } = await setupFullGame(ctx);
    const harlot = await addTravellerWithRole(ctx, 'Harlot', 'harlot', 'good');

    const targetSocket = ctx.players[0] as Socket;
    const requestPromise = waitForEvent<{
      harlotId: string;
      harlotName: string;
    }>(targetSocket, 'harlot:consentRequested');
    const resultPromise = waitForEvent<{
      harlotId: string;
      targetId: string;
      accepted: boolean;
      targetRoleName?: string;
    }>(ctx.storyteller as Socket, 'harlot:consentResult');

    harlot.socket.emit('night:action', { targets: [playerIds[0]] });
    const request = await requestPromise;
    expect(request.harlotId).toBe(harlot.playerId);

    targetSocket.emit('harlot:respond', {
      harlotId: harlot.playerId,
      accepted: true,
    });

    const result = await resultPromise;
    expect(result.harlotId).toBe(harlot.playerId);
    expect(result.targetId).toBe(playerIds[0]);
    expect(result.accepted).toBe(true);
    expect(result.targetRoleName).toBeDefined();
  }, 20000);

  it('취한 매춘부는 방문 동의를 받아도 실제 역할명을 받지 않는다', async () => {
    const { playerIds } = await setupFullGame(ctx);
    const harlot = await addTravellerWithRole(ctx, 'Harlot', 'harlot', 'good');
    ctx.app.game.setPlayerStatuses(harlot.playerId, ['drunk']);

    const targetSocket = ctx.players[0] as Socket;
    const requestPromise = waitForEvent<{
      harlotId: string;
      harlotName: string;
    }>(targetSocket, 'harlot:consentRequested');
    const resultPromise = waitForEvent<{
      harlotId: string;
      targetId: string;
      accepted: boolean;
      targetRoleName?: string;
      needsFalseInfo?: boolean;
    }>(ctx.storyteller as Socket, 'harlot:consentResult');

    harlot.socket.emit('night:action', { targets: [playerIds[0]] });
    await requestPromise;

    targetSocket.emit('harlot:respond', {
      harlotId: harlot.playerId,
      accepted: true,
    });

    const result = await resultPromise;
    expect(result.accepted).toBe(true);
    expect(result.targetRoleName).toBeUndefined();
    expect(result.needsFalseInfo).toBe(true);
  }, 20000);

  it('취한 총잡이는 발사해도 대상을 죽이지 않는다', async () => {
    const { playerIds } = await setupFullGame(ctx);
    const gunslinger = await addTravellerWithRole(
      ctx,
      'Gunslinger',
      'gunslinger',
      'good',
    );
    await advanceToDay(ctx, 'nomination');

    const voteStartPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[0],
      nomineeId: playerIds[1],
    });
    await voteStartPromise;

    await new Promise<void>((resolve) => {
      ctx.players[2].emit('vote:cast', () => resolve());
    });
    ctx.storyteller.emit('vote:close');
    await waitForEvent(ctx.players[0] as Socket, 'vote:result');

    ctx.app.game.setPlayerStatuses(gunslinger.playerId, ['poisoned']);
    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        gunslinger.socket.emit(
          'gunslinger:use',
          { targetId: playerIds[2] },
          resolve,
        );
      },
    );

    expect(result.success).toBe(true);
    expect(ctx.app.game.getPlayer(playerIds[2])?.isAlive).toBe(true);
  }, 20000);

  it('재접속 응답은 첫 낮 진행과 여행자 대상 정보를 복원한다', async () => {
    const { playerIds } = await setupFullGame(ctx);
    await addTravellerWithRole(ctx, 'Traveller', 'scapegoat', 'good');
    await advanceToDay(ctx, 'nomination');

    const rejoin = await new Promise<{
      success: boolean;
      nightCount?: number;
      gamePlayers?: Array<{ id: string; isTraveller?: boolean }>;
    }>((resolve) => {
      ctx.players[0].emit('game:rejoin', { playerId: playerIds[0] }, resolve);
    });

    expect(rejoin.success).toBe(true);
    expect(rejoin.nightCount).toBe(1);
    expect(rejoin.gamePlayers?.some((p) => p.isTraveller)).toBe(true);
  }, 20000);
});

describe('E2E: 추방 투표', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('플레이어가 추방을 제안하면 전체에게 exile:start가 전송된다', async () => {
    await setupFullGame(ctx);

    // 낮으로 전환
    const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    // 여행자 추가
    const { playerId: travellerId } = await addTravellerWithRole(
      ctx,
      'T1',
      'scapegoat',
      'good',
    );

    // exile:start 리스너
    const startPromise = waitForEvent<{
      proposerId: string;
      targetId: string;
      targetName: string;
      totalPlayers: number;
    }>(ctx.players[0] as Socket, 'exile:start');

    const stStartPromise = waitForEvent<{
      targetId: string;
    }>(ctx.storyteller as Socket, 'exile:start');

    // 플레이어가 추방 제안
    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[0].emit(
          'exile:propose',
          { targetId: travellerId },
          resolve,
        );
      },
    );
    expect(result.success).toBe(true);

    const startData = await startPromise;
    expect(startData.targetId).toBe(travellerId);
    expect(startData.targetName).toBe('T1');
    expect(startData.totalPlayers).toBe(6); // 5 + 1

    const stData = await stStartPromise;
    expect(stData.targetId).toBe(travellerId);
  }, 15000);

  it('전원 투표 시 자동으로 결과가 전송된다', async () => {
    await setupFullGame(ctx);

    const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    const { playerId: travellerId, socket: travellerSocket } =
      await addTravellerWithRole(ctx, 'T1', 'scapegoat', 'good');

    // 추방 제안
    await new Promise<void>((resolve) => {
      ctx.players[0].emit('exile:propose', { targetId: travellerId }, () =>
        resolve(),
      );
    });

    // exile:result 리스너
    const resultPromise = waitForEvent<{
      targetId: string;
      exiled: boolean;
      guiltyCount: number;
      totalPlayers: number;
    }>(ctx.players[0] as Socket, 'exile:result');

    // 전원 투표 (5명 찬성, 여행자 반대)
    for (const playerSocket of ctx.players.slice(0, 5)) {
      playerSocket.emit('exile:vote', { guilty: true });
    }
    travellerSocket.emit('exile:vote', { guilty: false });

    const resultData = await resultPromise;
    expect(resultData.targetId).toBe(travellerId);
    expect(resultData.exiled).toBe(true); // 5/6 > 3
    expect(resultData.guiltyCount).toBe(5);
  }, 15000);

  it('과반수 미달 시 추방되지 않는다', async () => {
    await setupFullGame(ctx);

    const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    const { playerId: travellerId, socket: travellerSocket } =
      await addTravellerWithRole(ctx, 'T1', 'scapegoat', 'good');

    await new Promise<void>((resolve) => {
      ctx.players[0].emit('exile:propose', { targetId: travellerId }, () =>
        resolve(),
      );
    });

    const resultPromise = waitForEvent<{
      exiled: boolean;
      guiltyCount: number;
    }>(ctx.players[0] as Socket, 'exile:result');

    // 2명만 찬성
    ctx.players[0].emit('exile:vote', { guilty: true });
    ctx.players[1].emit('exile:vote', { guilty: true });
    ctx.players[2].emit('exile:vote', { guilty: false });
    ctx.players[3].emit('exile:vote', { guilty: false });
    ctx.players[4].emit('exile:vote', { guilty: false });
    travellerSocket.emit('exile:vote', { guilty: false });

    const resultData = await resultPromise;
    expect(resultData.exiled).toBe(false);
    expect(resultData.guiltyCount).toBe(2);
    expect(ctx.app.game.getPlayer(travellerId)?.isAlive).toBe(true);
  }, 15000);

  it('이야기꾼이 exile:forceClose로 투표를 강제 종료할 수 있다', async () => {
    await setupFullGame(ctx);

    const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    const { playerId: travellerId } = await addTravellerWithRole(
      ctx,
      'T1',
      'scapegoat',
      'good',
    );

    await new Promise<void>((resolve) => {
      ctx.players[0].emit('exile:propose', { targetId: travellerId }, () =>
        resolve(),
      );
    });

    const resultPromise = waitForEvent<{
      exiled: boolean;
    }>(ctx.players[0] as Socket, 'exile:result');

    // 투표 없이 이야기꾼이 강제 추방
    ctx.storyteller.emit('exile:forceClose', { exiled: true });

    const resultData = await resultPromise;
    expect(resultData.exiled).toBe(true);
    expect(ctx.app.game.getPlayer(travellerId)?.isAlive).toBe(false);
  }, 15000);

  it('일반 플레이어에 대한 추방 제안은 실패한다', async () => {
    const { playerIds } = await setupFullGame(ctx);

    const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[0].emit(
          'exile:propose',
          { targetId: playerIds[1] },
          resolve,
        );
      },
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain('여행자');
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
    expect(exileData.roleName).toBe('희생양');

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
