import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  setupGameWithRoles,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

describe('E2E: spy grimoire feedback', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('healthy spy receives the true grimoire automatically and storyteller sees the delivered record', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'spy' },
      { roleId: 'washerwoman' },
      { roleId: 'soldier' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    const playerFeedbackPromise = waitForEvent<{
      feedback: {
        type: string;
        entries: Array<{ name: string; roleName: string }>;
      };
    }>(ctx.players[0] as Socket, 'night:feedback');
    const storytellerFeedbackPromise = waitForEvent<{
      playerId: string;
      playerName: string;
      roleId: string;
      roleName: string;
      feedback: {
        type: string;
        entries: Array<{ name: string; roleName: string }>;
      };
      source: string;
    }>(ctx.storyteller as Socket, 'night:feedbackSent');

    ctx.storyteller.emit('night:setActiveRole', 'spy');

    const playerFeedback = await playerFeedbackPromise;
    const storytellerFeedback = await storytellerFeedbackPromise;

    expect(playerFeedback.feedback.type).toBe('grimoire');
    expect(playerFeedback.feedback.entries[0]).toMatchObject({
      name: 'Player1',
      roleName: '첩자',
    });
    expect(storytellerFeedback).toMatchObject({
      playerId: playerIds[0],
      playerName: 'Player1',
      roleId: 'spy',
      roleName: '첩자',
      source: 'auto',
    });
  }, 15000);

  it('poisoned spy does not receive the true grimoire automatically', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'spy' },
      { roleId: 'washerwoman' },
      { roleId: 'soldier' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    ctx.storyteller.emit('player:setStatuses', {
      playerId: playerIds[0],
      statuses: ['poisoned'],
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    const receivedFeedback: unknown[] = [];
    ctx.players[0].on('night:feedback', (data) => {
      receivedFeedback.push(data);
    });

    const wakeTargetsPromise = waitForEvent(
      ctx.storyteller as Socket,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'spy');
    await wakeTargetsPromise;
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(receivedFeedback).toHaveLength(0);
  }, 15000);
});
