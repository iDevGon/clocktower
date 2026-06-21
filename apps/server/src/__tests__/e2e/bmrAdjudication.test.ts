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

  it('미치광이는 플레이어 앱에서 악마로 보이고 해당 악마 밤 차례에 행동한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'lunatic', lunaticAs: 'po' },
      { roleId: 'sailor' },
      { roleId: 'grandmother' },
      { roleId: 'godfather' },
      { roleId: 'zombuul' },
    ]);

    const rejoinResult = await new Promise<{
      success: boolean;
      roleId?: string;
      lunaticAs?: string;
    }>((resolve) => {
      ctx.players[0].emit('game:rejoin', { playerId: playerIds[0] }, resolve);
    });

    expect(rejoinResult.success).toBe(true);
    expect(rejoinResult.roleId).toBe('po');
    expect(rejoinResult.lunaticAs).toBe('po');

    const wakePromise = waitForEvent<{ roleId: string }>(
      ctx.players[0],
      'night:wakeUp',
    );
    ctx.storyteller.emit('night:setActiveRole', 'po');
    const wake = await wakePromise;
    expect(wake.roleId).toBe('po');

    const actionPromise = waitForEvent<{ playerId: string; roleId: string }>(
      ctx.storyteller,
      'night:actionReceived',
    );
    ctx.players[0].emit('night:action', { targets: [playerIds[1]] });
    const action = await actionPromise;

    expect(action.playerId).toBe(playerIds[0]);
    expect(action.roleId).toBe('po');
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
    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(true);
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
    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(true);
    expect(ctx.app.game.getPlayer(playerIds[2])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[4])?.statuses).not.toContain(
      'po_chose_no_one',
    );
  });

  it('엑소시스트가 선택한 악마는 그 밤 깨어나지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'exorcist' },
      { roleId: 'godfather' },
      { roleId: 'pukka' },
    ]);

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[2].emit('night:action', { targets: [playerIds[4]] });
    await statePromise;

    const wakeTargetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'pukka');
    const wakeTargets = await wakeTargetsPromise;

    expect(wakeTargets.candidateIds).not.toContain(playerIds[4]);
  });

  it('할머니가 알게 된 손주가 사망하면 할머니도 사망한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'exorcist' },
      { roleId: 'godfather' },
      { roleId: 'pukka' },
    ]);

    ctx.storyteller.emit('night:setActiveRole', 'grandmother');
    const feedbackPromise = waitForEvent(ctx.players[0], 'night:feedback');
    ctx.storyteller.emit('night:sendFeedback', {
      playerId: playerIds[0],
      feedback: {
        type: 'player_and_role',
        playerId: playerIds[1],
        playerName: 'Player2',
        roleName: '선원',
      },
    });
    await feedbackPromise;

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.storyteller.emit('game:kill', playerIds[1]);
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
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
    expect(
      [playerIds[1], playerIds[2]].filter((playerId) =>
        ctx.app.game.getPlayer(playerId)?.statuses.includes('innkeeper_drunk'),
      ),
    ).toHaveLength(1);
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

  it('이야기꾼이 궁정대신 역할 선택을 앱에서 처리할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'courtier' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    let playerStateReceived = false;
    ctx.players[1].once('game:state', () => {
      playerStateReceived = true;
    });

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.storyteller.emit('courtier:chooseRole', {
      courtierId: playerIds[0],
      roleId: 'sailor',
    });
    await statePromise;
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).toContain(
      'courtier_spent',
    );
    expect(ctx.app.game.getPlayer(playerIds[2])?.statuses).toContain(
      'courtier_drunk',
    );
    expect(playerStateReceived).toBe(false);
  });

  it('이야기꾼이 도박사 추측을 앱에서 처리할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.storyteller.emit('gambler:guess', {
      gamblerId: playerIds[0],
      targetPlayerId: playerIds[1],
      guessedRoleId: 'sailor',
    });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(ctx.app.game.hasPendingNightKill(playerIds[0])).toBe(true);
  });

  it('도박사 밤 사망은 낮 전환 전까지 플레이어 상태에 공개되지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    let playerStateReceived = false;
    ctx.players[1].once('game:state', () => {
      playerStateReceived = true;
    });

    const storytellerStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.storyteller.emit('gambler:guess', {
      gamblerId: playerIds[0],
      targetPlayerId: playerIds[1],
      guessedRoleId: 'sailor',
    });
    await storytellerStatePromise;
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(playerStateReceived).toBe(false);
  });

  it('플레이어가 제출한 BMR 밤 사망도 낮 전환 전까지 플레이어 상태에 공개되지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'assassin' },
      { roleId: 'po' },
    ]);

    let playerStateReceived = false;
    ctx.players[1].once('game:state', () => {
      playerStateReceived = true;
    });

    const storytellerStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[3].emit('night:action', { targets: [playerIds[1]] });
    await storytellerStatePromise;
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(false);
    expect(ctx.app.game.hasPendingNightKill(playerIds[1])).toBe(true);
    expect(playerStateReceived).toBe(false);
  });
});
