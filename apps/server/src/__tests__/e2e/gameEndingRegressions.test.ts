import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  setupGameWithRoles,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

let ctx: TestContext;
beforeEach(async () => {
  ctx = await setupTestServer();
});
afterEach(async () => {
  await ctx.cleanup();
});

async function advanceToNomination() {
  let state = waitForEvent(ctx.storyteller, 'game:state');
  ctx.storyteller.emit('game:setPhase', 'day');
  await state;
  state = waitForEvent(ctx.storyteller, 'game:state');
  ctx.storyteller.emit('day:setSubPhase', 'nomination');
  await state;
}

async function setupFinalThreeMayor() {
  const { playerIds } = await setupGameWithRoles(ctx, [
    { roleId: 'mayor' },
    { roleId: 'empath' },
    { roleId: 'chef' },
    { roleId: 'poisoner' },
    { roleId: 'imp' },
  ]);
  ctx.app.game.kill(playerIds[2]);
  ctx.app.game.kill(playerIds[3]);
  return playerIds;
}

describe('승리 및 전환 회귀 E2E', () => {
  it('마지막 3인 시장 사망은 대체 처리 후 악마 사망으로 선 승리할 수 있다', async () => {
    const ids = await setupFinalThreeMayor();
    const ended = vi.fn();
    ctx.players[0].on('game:end', ended);
    const pending = waitForEvent(ctx.storyteller, 'mayor:nightDeath');
    ctx.storyteller.emit('game:kill', ids[0]);
    await pending;
    expect(ctx.app.game.getState().phase).toBe('night');
    expect(ended).not.toHaveBeenCalled();

    const end = waitForEvent<{ winningTeam: string }>(
      ctx.players[0],
      'game:end',
    );
    ctx.storyteller.emit('game:mayorRedirect', {
      mayorId: ids[0],
      redirectTargetId: ids[4],
    });
    expect((await end).winningTeam).toBe('good');
    expect(ctx.app.game.getPlayer(ids[0])?.isAlive).toBe(true);
  });

  it('마지막 3인 시장 사망 대체를 생략하면 악 승리를 알린다', async () => {
    const ids = await setupFinalThreeMayor();
    const pending = waitForEvent(ctx.storyteller, 'mayor:nightDeath');
    ctx.storyteller.emit('game:kill', ids[0]);
    await pending;
    expect(ctx.app.game.getState().phase).toBe('night');
    const end = waitForEvent<{ winningTeam: string }>(
      ctx.players[0],
      'game:end',
    );
    ctx.storyteller.emit('game:mayorSkipRedirect', { mayorId: ids[0] });
    expect((await end).winningTeam).toBe('evil');
  });

  it.each([
    'poisoned',
    'drunk',
  ] as const)('%s 얼뜨기가 악한 대상을 선택해도 게임은 계속된다', async (status) => {
    const { playerIds: ids } = await setupGameWithRoles(ctx, [
      { roleId: 'klutz' },
      { roleId: 'dreamer' },
      { roleId: 'oracle' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToNomination();
    ctx.app.game.setPlayerStatuses(ids[0], [status]);
    ctx.app.game.kill(ids[0]);
    const result = await new Promise<{ success: boolean }>((resolve) =>
      ctx.storyteller.emit(
        'klutz:choose',
        { klutzId: ids[0], chosenPlayerId: ids[3] },
        resolve,
      ),
    );
    expect(result.success).toBe(true);
    expect(ctx.app.game.getState().phase).toBe('day');
  });

  it('밤 전환을 반복해도 보르톡스가 승리하거나 밤 상태를 초기화하지 않는다', async () => {
    await setupGameWithRoles(ctx, [
      { roleId: 'clockmaker' },
      { roleId: 'dreamer' },
      { roleId: 'oracle' },
      { roleId: 'witch' },
      { roleId: 'vortox' },
    ]);
    await advanceToNomination();
    ctx.app.game.markExecution();
    let state = waitForEvent(ctx.storyteller, 'game:state');
    ctx.storyteller.emit('game:setPhase', 'night');
    await state;
    expect(ctx.app.game.getState().phase).toBe('night');
    state = waitForEvent(ctx.storyteller, 'game:state');
    ctx.storyteller.emit('game:setPhase', 'night');
    await state;
    expect(ctx.app.game.getState().phase).toBe('night');
  });

  it('낮 전환을 반복해도 날짜와 지명 기록이 유지된다', async () => {
    const { playerIds: ids } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'chef' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);
    await advanceToNomination();
    const day = ctx.app.game.getState().day;
    expect(ctx.app.game.nominate(ids[0], ids[1]).success).toBe(true);
    const state = waitForEvent(ctx.storyteller, 'game:state');
    ctx.storyteller.emit('game:setPhase', 'day');
    await state;
    expect(ctx.app.game.getState().day).toBe(day);
    expect(ctx.app.game.getPlayer(ids[0])?.hasNominatedToday).toBe(true);
    expect(ctx.app.game.getState().daySubPhase).toBe('nomination');
  });
});
