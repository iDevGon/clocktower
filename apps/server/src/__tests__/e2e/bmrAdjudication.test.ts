import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  setupGameWithRoles,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

describe('E2E: 피로물든달 판정 보조', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('호스트가 처형 사망을 건너뛰고 밤으로 전환할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'fool' },
      { roleId: 'chef' },
      { roleId: 'baron' },
      { roleId: 'imp' },
    ]);

    ctx.app.game.setPhase('day');
    expect(ctx.app.game.nominate(playerIds[0], playerIds[1]).success).toBe(
      true,
    );
    for (const voterId of playerIds.slice(0, 3)) {
      expect(ctx.app.game.castVote(voterId).success).toBe(true);
    }
    expect(ctx.app.game.closeVote()?.executionCandidate?.playerId).toBe(
      playerIds[1],
    );

    const phasePromise = waitForEvent(ctx.players[0], 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'night', {
      skipExecution: true,
    });
    await phasePromise;

    expect(ctx.app.game.getState().phase).toBe('night');
    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(true);
  });

  it('사망 위장 중인 좀버얼은 공개 상태가 사망이어도 밤에 행동할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'chef' },
      { roleId: 'poisoner' },
      { roleId: 'zombuul' },
    ]);

    ctx.app.game.setPlayerStatuses(playerIds[4], ['zombuul_registers_dead']);

    expect(ctx.app.game.getPlayer(playerIds[4])?.isAlive).toBe(true);
    expect(
      ctx.app.game.getState().players.find((p) => p.id === playerIds[4])
        ?.isAlive,
    ).toBe(false);

    const wakeTargetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'zombuul');
    const wakeTargets = await wakeTargetsPromise;

    expect(wakeTargets.candidateIds).toContain(playerIds[4]);
  });

  it('푸카 밤 행동은 이전 중독 대상을 사망시키고 새 대상을 중독시킨다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'pukka' },
    ]);

    const firstStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', { targets: [playerIds[0]] });
    await firstStatePromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).toContain(
      'pukka_poisoned',
    );
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);

    const secondStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', { targets: [playerIds[1]] });
    await secondStatePromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).not.toContain(
      'pukka_poisoned',
    );
    expect(ctx.app.game.getPlayer(playerIds[1])?.statuses).toContain(
      'pukka_poisoned',
    );
  });
});
