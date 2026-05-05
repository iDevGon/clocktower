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

    ctx.storyteller.emit('klutz:choose', {
      klutzId: playerIds[0],
      chosenPlayerId: playerIds[3],
    });

    const result = await endPromise;
    expect(result.winningTeam).toBe('evil');
    expect(result.cause).toBe('klutz');
  }, 15000);
});
