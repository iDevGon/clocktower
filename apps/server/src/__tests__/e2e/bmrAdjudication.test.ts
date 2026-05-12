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
});
