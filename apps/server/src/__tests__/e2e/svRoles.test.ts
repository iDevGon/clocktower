import type { GameState } from '@clocktower/shared/logic';
import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  advanceToDay,
  setupGameWithRoles,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

describe('E2E: S&V 낮 능력 검증', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('백치천재가 아닌 플레이어는 백치천재 요청을 보낼 수 없다', async () => {
    await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'savant' },
      { roleId: 'artist' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[0].emit('savant:use', resolve);
      },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('백치천재');
  }, 15000);

  it('백치천재는 하루에 한 번만 정보를 요청할 수 있다', async () => {
    await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'savant' },
      { roleId: 'artist' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const requestPromise = waitForEvent(
      ctx.storyteller as Socket,
      'savant:requested',
    );
    const first = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[1].emit('savant:use', resolve);
      },
    );
    await requestPromise;

    const second = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[1].emit('savant:use', resolve);
      },
    );

    expect(first.success).toBe(true);
    expect(second.success).toBe(false);
    expect(second.error).toContain('오늘 이미');
  }, 15000);

  it('화가가 아닌 플레이어는 화가 요청을 보낼 수 없다', async () => {
    await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'savant' },
      { roleId: 'artist' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[0].emit('artist:use', resolve);
      },
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('화가');
  }, 15000);

  it('곡예사는 첫 낮에 공개 추측을 선언할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'juggler' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[0].emit(
          'juggler:declare',
          { guesses: [{ playerId: playerIds[1], roleId: 'dreamer' }] },
          resolve,
        );
      },
    );

    expect(result.success).toBe(true);
  }, 15000);

  it('사악한 쌍둥이도 처형 후보가 되면 실제로 처형된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'oracle' },
      { roleId: 'seamstress' },
      { roleId: 'evil_twin' },
      { roleId: 'fang_gu' },
    ]);

    const twinStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    ctx.storyteller.emit('evilTwin:assignGoodTwin', {
      evilTwinPlayerId: playerIds[5],
      goodTwinPlayerId: playerIds[0],
    });
    await twinStatePromise;
    await advanceToDay(ctx);

    const voteStartPromise = waitForEvent(
      ctx.players[5] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[0],
      nomineeId: playerIds[5],
    });
    await voteStartPromise;

    for (let i = 0; i < 4; i++) {
      await new Promise<void>((resolve) => {
        ctx.players[i].emit('vote:cast', () => resolve());
      });
    }

    const voteResultPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:result',
    );
    ctx.storyteller.emit('vote:close');
    await voteResultPromise;

    const executionPromise = waitForEvent<{ executedId: string }>(
      ctx.players[0] as Socket,
      'execution:announced',
    );
    ctx.storyteller.emit('game:setPhase', 'night');

    const execution = await executionPromise;
    expect(execution.executedId).toBe(playerIds[5]);
  }, 15000);

  it('마녀 저주 사망은 처형으로 기록하지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);
    ctx.app.game.setWitchCursedTarget(playerIds[0]);

    const nominateResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[0].emit(
        'nominate:request',
        { nomineeId: playerIds[1] },
        resolve,
      );
    });
    expect(nominateResult.success).toBe(true);

    const deathPromise = waitForEvent(
      ctx.players[0] as Socket,
      'witch:curseDeath',
    );
    ctx.storyteller.emit('witch:confirmCurseDeath', {
      nominatorId: playerIds[0],
      kill: true,
    });
    await deathPromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(ctx.app.game.hadExecutionToday()).toBe(false);
  }, 15000);

  it('이야기꾼이 지명을 입력해도 마녀 저주 확인 요청을 보낸다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);
    ctx.app.game.setWitchCursedTarget(playerIds[0]);

    const cursePromise = waitForEvent<{ nominatorId: string }>(
      ctx.storyteller as Socket,
      'witch:curseDeath',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[0],
      nomineeId: playerIds[1],
    });

    const curse = await cursePromise;
    expect(curse.nominatorId).toBe(playerIds[0]);
  }, 15000);

  it('마녀 저주 확인은 현재 유효한 저주 대상만 사망시킨다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.storyteller.emit(
          'witch:confirmCurseDeath',
          { nominatorId: playerIds[0], kill: true },
          resolve,
        );
      },
    );

    expect(result.success).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
  }, 15000);

  it('마녀 저주로 악마가 죽고 탕녀 조건이면 탕녀에게 악마 역할을 알린다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'seamstress' },
      { roleId: 'witch' },
      { roleId: 'scarlet_woman' },
      { roleId: 'imp' },
    ]);
    await advanceToDay(ctx);
    ctx.app.game.setWitchCursedTarget(playerIds[6]);

    const roleAssignPromise = waitForEvent<{ roleId: string }>(
      ctx.players[5] as Socket,
      'role:assign',
      500,
    );
    ctx.storyteller.emit('witch:confirmCurseDeath', {
      nominatorId: playerIds[6],
      kill: true,
    });
    const roleAssign = await roleAssignPromise;

    expect(roleAssign.roleId).toBe('imp');
    expect(ctx.app.game.getPlayer(playerIds[6])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[5])?.role?.id).toBe('imp');
    expect(ctx.app.game.getState().phase).not.toBe('ended');
  }, 15000);
});

describe('E2E: S&V 사망 트리거', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('이발사가 정상 처형으로 사망해도 이야기꾼에게 역할 교환 요청을 보낸다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'barber' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const voteStartPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[1],
      nomineeId: playerIds[0],
    });
    await voteStartPromise;

    for (let i = 1; i <= 3; i++) {
      await new Promise<void>((resolve) => {
        ctx.players[i].emit('vote:cast', () => resolve());
      });
    }

    const voteResultPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:result',
    );
    ctx.storyteller.emit('vote:close');
    await voteResultPromise;

    const barberPromise = waitForEvent<{ barberName: string }>(
      ctx.storyteller as Socket,
      'barber:died',
    );
    ctx.storyteller.emit('game:setPhase', 'night');

    const event = await barberPromise;
    expect(event.barberName).toBe('Player1');
  }, 15000);

  it('이발사 역할 교환은 이발사 사망 후 한 번만 적용된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'barber' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const beforeDeath = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.storyteller.emit(
        'barber:swapRoles',
        { playerId1: playerIds[1], playerId2: playerIds[2] },
        resolve,
      );
    });

    expect(beforeDeath.success).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[1])?.role?.id).toBe('dreamer');
    expect(ctx.app.game.getPlayer(playerIds[2])?.role?.id).toBe('flowergirl');

    const barberPromise = waitForEvent<{ barberName: string }>(
      ctx.storyteller as Socket,
      'barber:died',
    );
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await barberPromise;

    const afterDeath = await new Promise<{ success: boolean }>((resolve) => {
      ctx.storyteller.emit(
        'barber:swapRoles',
        { playerId1: playerIds[1], playerId2: playerIds[2] },
        resolve,
      );
    });

    expect(afterDeath.success).toBe(true);
    expect(ctx.app.game.getPlayer(playerIds[1])?.role?.id).toBe('flowergirl');
    expect(ctx.app.game.getPlayer(playerIds[2])?.role?.id).toBe('dreamer');

    const secondAttempt = await new Promise<{ success: boolean }>((resolve) => {
      ctx.storyteller.emit(
        'barber:swapRoles',
        { playerId1: playerIds[1], playerId2: playerIds[2] },
        resolve,
      );
    });

    expect(secondAttempt.success).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[1])?.role?.id).toBe('flowergirl');
    expect(ctx.app.game.getPlayer(playerIds[2])?.role?.id).toBe('dreamer');
  }, 15000);

  it('이발사 역할 교환을 스킵하면 이후 교환 요청은 실패한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'barber' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const barberPromise = waitForEvent<{ barberName: string }>(
      ctx.storyteller as Socket,
      'barber:died',
    );
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await barberPromise;

    const skip = await new Promise<{ success: boolean }>((resolve) => {
      ctx.storyteller.emit('barber:skipSwap', resolve);
    });
    expect(skip.success).toBe(true);

    const swap = await new Promise<{ success: boolean }>((resolve) => {
      ctx.storyteller.emit(
        'barber:swapRoles',
        { playerId1: playerIds[1], playerId2: playerIds[2] },
        resolve,
      );
    });

    expect(swap.success).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[1])?.role?.id).toBe('dreamer');
    expect(ctx.app.game.getPlayer(playerIds[2])?.role?.id).toBe('flowergirl');
  }, 15000);

  it('이미 죽은 이발사를 다시 처치해도 역할 교환 요청을 다시 보내지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'barber' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToDay(ctx);

    const barberPromise = waitForEvent<{ barberName: string }>(
      ctx.storyteller as Socket,
      'barber:died',
    );
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await barberPromise;

    const skip = await new Promise<{ success: boolean }>((resolve) => {
      ctx.storyteller.emit('barber:skipSwap', resolve);
    });
    expect(skip.success).toBe(true);

    let repeatedDeathEventReceived = false;
    ctx.storyteller.once('barber:died', () => {
      repeatedDeathEventReceived = true;
    });
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(repeatedDeathEventReceived).toBe(false);
  }, 15000);
});

describe('E2E: S&V 밤 역할 처리', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('뱀 조련사가 악마를 선택하면 양쪽에 새 역할을 알린다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'snake_charmer' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'fang_gu' },
    ]);

    const swappedPromise = waitForEvent<{
      snakeCharmerId: string;
      demonId: string;
    }>(ctx.storyteller as Socket, 'snakeCharmer:swapped');
    const snakeRolePromise = waitForEvent<{ roleId: string }>(
      ctx.players[0] as Socket,
      'role:assign',
    );
    const demonRolePromise = waitForEvent<{ roleId: string }>(
      ctx.players[4] as Socket,
      'role:assign',
    );

    ctx.storyteller.emit('snakeCharmer:swap', {
      snakeCharmerId: playerIds[0],
      demonId: playerIds[4],
    });

    const swapped = await swappedPromise;
    const snakeRole = await snakeRolePromise;
    const demonRole = await demonRolePromise;

    expect(swapped.snakeCharmerId).toBe(playerIds[0]);
    expect(swapped.demonId).toBe(playerIds[4]);
    expect(snakeRole.roleId).toBe('fang_gu');
    expect(demonRole.roleId).toBe('snake_charmer');
  }, 15000);

  it('비고르모르티스가 하수인을 죽이면 유지/이웃 중독 상태를 반영한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'witch' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'vigormortis' },
    ]);

    const statePromise = waitForEvent<GameState>(
      ctx.storyteller as Socket,
      'game:state',
    );
    ctx.storyteller.emit('vigormortis:killMinion', {
      vigormortisId: playerIds[4],
      minionId: playerIds[1],
      poisonedNeighborId: playerIds[2],
    });

    const state = await statePromise;
    const minion = state.players.find((p) => p.id === playerIds[1]);
    const poisoned = state.players.find((p) => p.id === playerIds[2]);

    expect(minion?.isAlive).toBe(false);
    expect(minion?.statuses).toContain('vigormortis_retained');
    expect(poisoned?.statuses).toContain('vigormortis_poisoned');
  }, 15000);

  it('얼뜨기가 악한 진영 플레이어를 선택하면 악 팀 승리로 끝난다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'klutz' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'fang_gu' },
    ]);

    const endPromise = waitForEvent<{
      winningTeam: 'good' | 'evil';
      cause?: string;
    }>(ctx.players[0] as Socket, 'game:end');
    ctx.app.game.kill(playerIds[0]);

    ctx.storyteller.emit('klutz:choose', {
      klutzId: playerIds[0],
      chosenPlayerId: playerIds[3],
    });

    const result = await endPromise;
    expect(result.winningTeam).toBe('evil');
    expect(result.cause).toBe('klutz');
  }, 15000);

  it('죽지 않은 얼뜨기 선택 이벤트는 게임을 끝내지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'klutz' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'fang_gu' },
    ]);

    const result = await new Promise<
      { success: boolean; error?: string } | undefined
    >((resolve) => {
      ctx.storyteller.emit(
        'klutz:choose',
        {
          klutzId: playerIds[0],
          chosenPlayerId: playerIds[3],
        },
        resolve,
      );
      setTimeout(() => resolve(undefined), 300);
    });

    expect(result?.success).toBe(false);
    expect(ctx.app.game.getState().phase).not.toBe('ended');
  }, 15000);

  it('사악한 쌍둥이는 선한 생존 플레이어에게만 지정할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'dreamer' },
      { roleId: 'flowergirl' },
      { roleId: 'witch' },
      { roleId: 'evil_twin' },
      { roleId: 'fang_gu' },
    ]);

    const result = await new Promise<
      { success: boolean; error?: string } | undefined
    >((resolve) => {
      ctx.storyteller.emit(
        'evilTwin:assignGoodTwin',
        {
          evilTwinPlayerId: playerIds[4],
          goodTwinPlayerId: playerIds[5],
        },
        resolve,
      );
      setTimeout(() => resolve(undefined), 300);
    });

    expect(result?.success).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[5])?.statuses).not.toContain(
      'good_twin',
    );
  }, 15000);
});
