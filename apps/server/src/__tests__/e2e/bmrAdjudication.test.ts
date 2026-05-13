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

  it('사발로스 밤 행동은 선택한 대상들을 사망시키고 표식을 남긴다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'shabaloth' },
    ]);

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', {
      targets: [playerIds[0], playerIds[1]],
    });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).toContain(
      'shabaloth_marked_dead',
    );
    expect(ctx.app.game.getPlayer(playerIds[1])?.statuses).toContain(
      'shabaloth_marked_dead',
    );
  });

  it('포 밤 행동은 휴식 선택과 다음 3명 처치를 게임 상태에 반영한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    const restStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', { targets: [] });
    await restStatePromise;

    expect(ctx.app.game.getPlayer(playerIds[4])?.statuses).toContain(
      'po_chose_no_one',
    );

    const killStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', {
      targets: [playerIds[0], playerIds[1], playerIds[2]],
    });
    await killStatePromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[2])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[4])?.statuses).not.toContain(
      'po_chose_no_one',
    );
  });

  it('교수 밤 행동은 사망한 마을주민을 부활시키고 능력을 소모한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'professor' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    ctx.app.game.kill(playerIds[1]);

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[0].emit('night:action', { targets: [playerIds[1]] });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(true);
    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).toContain(
      'professor_spent',
    );
  });

  it('여관 주인 밤 행동은 선택한 두 대상에게 밤 보호를 부여한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'innkeeper' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[0].emit('night:action', {
      targets: [playerIds[1], playerIds[2]],
    });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[1])?.statuses).toContain(
      'innkeeper_protected',
    );
    expect(ctx.app.game.getPlayer(playerIds[2])?.statuses).toContain(
      'innkeeper_protected',
    );
  });

  it('암살자 밤 행동은 대상을 사망시키고 능력을 소모한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'assassin' },
      { roleId: 'po' },
    ]);

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[3].emit('night:action', { targets: [playerIds[1]] });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[3])?.statuses).toContain(
      'assassin_spent',
    );
  });
});
