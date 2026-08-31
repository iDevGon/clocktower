import type { GameState } from '@clocktower/shared';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  setupGameWithRoles,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

type GamblerSubmitResult =
  | { success: true; requestId: string }
  | { success: false; error: string };

type GamblerReviewResult =
  | { success: true }
  | { success: false; error: string };

function withTimeout<T>(promise: Promise<T>, timeoutMs = 1000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Timed out waiting for socket callback')),
      timeoutMs,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function activateGambler(
  ctx: TestContext,
  playerIndex = 0,
): Promise<void> {
  const wakePromise = waitForEvent<{ roleId: string }>(
    ctx.players[playerIndex],
    'night:wakeUp',
  );
  ctx.storyteller.emit('night:setActiveRole', 'gambler');
  await expect(wakePromise).resolves.toEqual({ roleId: 'gambler' });
}

function submitGamblerGuess(
  ctx: TestContext,
  playerIndex: number,
  targetPlayerId: string,
  guessedRoleId: string,
): Promise<GamblerSubmitResult> {
  return withTimeout(
    new Promise((resolve) => {
      ctx.players[playerIndex].emit(
        'gambler:submitGuess',
        { targetPlayerId, guessedRoleId },
        resolve,
      );
    }),
  );
}

function reviewGamblerGuess(
  ctx: TestContext,
  data:
    | { requestId: string; decision: 'reject' }
    | {
        requestId: string;
        decision: 'approve';
        targetPlayerId: string;
        guessedRoleId: string;
      },
): Promise<GamblerReviewResult> {
  return withTimeout(
    new Promise((resolve) => {
      ctx.storyteller.emit('gambler:reviewGuess', data, resolve);
    }),
  );
}

function expectNoGamblerGuessSecrets(data: Record<string, unknown>): void {
  expect(data).not.toHaveProperty('targetPlayerId');
  expect(data).not.toHaveProperty('guessedRoleId');
  expect(data).not.toHaveProperty('correct');
  expect(data).not.toHaveProperty('editedTargetPlayerId');
  expect(data).not.toHaveProperty('editedGuessedRoleId');
  expect(data).not.toHaveProperty('killedTargetId');
}

describe('E2E: 피로물든달 판정 보조', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('험담꾼은 낮에 공개발언을 선언하고 모두에게 알릴 수 있다', async () => {
    await setupGameWithRoles(ctx, [
      { roleId: 'gossip' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'assassin' },
      { roleId: 'po' },
    ]);
    ctx.app.game.setPhase('day');

    const playerAnnouncementPromise = waitForEvent<{
      gossipId: string;
      gossipName: string;
      statement: string;
    }>(ctx.players[1], 'gossip:announced');
    const storytellerAnnouncementPromise = waitForEvent<{
      gossipId: string;
      gossipName: string;
      statement: string;
    }>(ctx.storyteller, 'gossip:announced');

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[0].emit(
          'gossip:declare',
          { statement: '오늘 살아있는 악 팀은 2명입니다' },
          resolve,
        );
      },
    );

    const playerAnnouncement = await playerAnnouncementPromise;
    const storytellerAnnouncement = await storytellerAnnouncementPromise;

    expect(result.success).toBe(true);
    expect(playerAnnouncement).toMatchObject({
      gossipName: 'Player1',
      statement: '오늘 살아있는 악 팀은 2명입니다',
    });
    expect(storytellerAnnouncement).toEqual(playerAnnouncement);
  }, 15000);

  it('험담꾼이 아닌 플레이어도 험담 공개발언을 사칭할 수 있다', async () => {
    await setupGameWithRoles(ctx, [
      { roleId: 'gossip' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'assassin' },
      { roleId: 'po' },
    ]);
    ctx.app.game.setPhase('day');

    const playerAnnouncementPromise = waitForEvent<{
      gossipId: string;
      gossipName: string;
      statement: string;
    }>(ctx.players[0], 'gossip:announced');

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[1].emit(
          'gossip:declare',
          { statement: '나는 험담꾼입니다' },
          resolve,
        );
      },
    );

    const playerAnnouncement = await playerAnnouncementPromise;

    expect(result.success).toBe(true);
    expect(playerAnnouncement).toMatchObject({
      gossipName: 'Player2',
      statement: '나는 험담꾼입니다',
    });

    const secondResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[1].emit(
        'gossip:declare',
        { statement: '다시 험담합니다' },
        resolve,
      );
    });

    expect(secondResult).toEqual({
      success: false,
      error: '오늘 이미 험담했습니다',
    });
  }, 15000);

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

  it('주모자 추가 낮에는 보호로 생존해도 처형된 플레이어의 팀이 패배한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'mastermind' },
      { roleId: 'po' },
    ]);

    ctx.app.game.setPhase('day');
    expect(ctx.app.game.nominate(playerIds[0], playerIds[4]).success).toBe(
      true,
    );
    for (const voterId of playerIds.slice(0, 3)) {
      expect(ctx.app.game.castVote(voterId).success).toBe(true);
    }
    expect(ctx.app.game.closeVote()?.executionCandidate?.playerId).toBe(
      playerIds[4],
    );

    const nightPromise = waitForEvent(ctx.players[0], 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'night');
    await nightPromise;
    expect(ctx.app.game.getState().phase).toBe('night');

    ctx.app.game.setPhase('day');
    ctx.app.game.setPlayerStatuses(playerIds[0], ['devils_advocate_protected']);
    expect(ctx.app.game.nominate(playerIds[1], playerIds[0]).success).toBe(
      true,
    );
    for (const voterId of playerIds.slice(0, 3)) {
      expect(ctx.app.game.castVote(voterId).success).toBe(true);
    }
    expect(ctx.app.game.closeVote()?.executionCandidate?.playerId).toBe(
      playerIds[0],
    );

    const endPromise = waitForEvent<{ winningTeam: string }>(
      ctx.players[0],
      'game:end',
    );
    ctx.storyteller.emit('game:setPhase', 'night');
    const result = await endPromise;

    expect(result.winningTeam).toBe('evil');
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
  }, 15000);

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

  it('낮에 사망이 있었으면 좀버얼 플레이어 앱을 깨우지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'chef' },
      { roleId: 'poisoner' },
      { roleId: 'zombuul' },
    ]);

    ctx.app.game.setPhase('day');
    ctx.app.game.kill(playerIds[0]);
    ctx.app.game.setPhase('night');

    const wakeTargetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'zombuul');
    const wakeTargets = await wakeTargetsPromise;

    expect(wakeTargets.candidateIds).toEqual([]);
  });

  it('미치광이는 플레이어 앱에서 악마로 보이고 해당 악마 밤 차례에 행동한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'lunatic', lunaticAs: 'po' },
      { roleId: 'sailor' },
      { roleId: 'grandmother' },
      { roleId: 'godfather' },
      { roleId: 'zombuul' },
    ]);

    const rejoinResult = await new Promise<
      {
        success: boolean;
        roleId?: string;
        evilInfo?: {
          minionNames?: string[];
          bluffRoles?: Array<{ id: string; name: string }>;
        } | null;
      } & Record<string, unknown>
    >((resolve) => {
      ctx.players[0].emit('game:rejoin', { playerId: playerIds[0] }, resolve);
    });

    expect(rejoinResult.success).toBe(true);
    expect(rejoinResult.roleId).toBe('po');
    expect(rejoinResult).not.toHaveProperty('lunaticAs');
    expect(rejoinResult.evilInfo?.minionNames).toHaveLength(1);
    expect(rejoinResult.evilInfo?.bluffRoles).toHaveLength(3);

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
    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(true);
    expect(ctx.app.game.hasPendingNightKill(playerIds[1])).toBe(false);
  });

  it('대부는 낮에 외지인이 사망한 밤에만 플레이어 앱에서 깨어난다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'moonchild' },
      { roleId: 'godfather' },
      { roleId: 'sailor' },
      { roleId: 'grandmother' },
      { roleId: 'po' },
    ]);

    const noTriggerTargetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'godfather');
    const noTriggerTargets = await noTriggerTargetsPromise;

    expect(noTriggerTargets.candidateIds).not.toContain(playerIds[1]);

    ctx.app.game.setPhase('day');
    ctx.app.game.kill(playerIds[0]);
    ctx.app.game.setPhase('night');

    const triggeredTargetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'godfather');
    const triggeredTargets = await triggeredTargetsPromise;

    expect(triggeredTargets.candidateIds).toContain(playerIds[1]);
  });

  it('대부는 시작 정보로 게임에 있는 외지인 역할을 알 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'moonchild' },
      { roleId: 'godfather' },
      { roleId: 'sailor' },
      { roleId: 'grandmother' },
      { roleId: 'po' },
    ]);

    const newSocket = await ctx.connectPlayer();
    const rejoinRes = await new Promise<{
      success: boolean;
      evilInfo?: {
        outsiderRoles?: Array<{ id: string; name: string }>;
      } | null;
    }>((resolve) => {
      newSocket.emit('game:rejoin', { playerId: playerIds[1] }, resolve);
    });

    expect(rejoinRes.success).toBe(true);
    expect(rejoinRes.evilInfo?.outsiderRoles).toEqual([
      { id: 'moonchild', name: '달의 자손' },
    ]);
  });

  it('선원 밤 행동은 취할 플레이어를 자동 결정하지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'sailor' },
      { roleId: 'grandmother' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[0].emit('night:action', { targets: [playerIds[1]] });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).not.toContain(
      'sailor_drunk',
    );
    expect(ctx.app.game.getPlayer(playerIds[1])?.statuses).not.toContain(
      'sailor_drunk',
    );
  });

  it('게임당 1번 BMR 역할은 능력 소모 후 다시 플레이어 앱에서 깨어나지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'professor' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'assassin' },
      { roleId: 'po' },
      { roleId: 'courtier' },
    ]);

    ctx.app.game.kill(playerIds[1]);

    const professorActionPromise = waitForEvent(
      ctx.storyteller,
      'night:actionReceived',
    );
    ctx.players[0].emit('night:action', { targets: [playerIds[1]] });
    await professorActionPromise;

    const assassinActionPromise = waitForEvent(
      ctx.storyteller,
      'night:actionReceived',
    );
    ctx.players[3].emit('night:action', { targets: [playerIds[2]] });
    await assassinActionPromise;

    const courtierResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.storyteller.emit(
        'courtier:chooseRole',
        { courtierId: playerIds[5], roleId: 'po' },
        resolve,
      );
    });
    expect(courtierResult).toEqual({ success: true });

    for (const [roleId, playerId] of [
      ['professor', playerIds[0]],
      ['assassin', playerIds[3]],
      ['courtier', playerIds[5]],
    ] as const) {
      const targetsPromise = waitForEvent<{ candidateIds: string[] }>(
        ctx.storyteller,
        'night:wakeUpTargets',
      );
      ctx.storyteller.emit('night:setActiveRole', roleId);
      const targets = await targetsPromise;

      expect(targets.candidateIds).not.toContain(playerId);
    }
  }, 15000);

  it('교수가 시작 정보 역할을 부활시키면 즉시 다시 깨우고 같은 밤 중복 기상시키지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'professor' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    ctx.app.game.kill(playerIds[1]);

    const grandmotherWakePromise = waitForEvent<{ roleId: string }>(
      ctx.players[1],
      'night:wakeUp',
    );
    const professorActionPromise = waitForEvent(
      ctx.storyteller,
      'night:actionReceived',
    );

    ctx.players[0].emit('night:action', { targets: [playerIds[1]] });

    await professorActionPromise;
    await expect(grandmotherWakePromise).resolves.toEqual({
      roleId: 'grandmother',
    });

    const targetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'grandmother');
    const targets = await targetsPromise;

    expect(targets.candidateIds).not.toContain(playerIds[1]);
  }, 15000);

  it('유효하지 않은 BMR 밤 행동은 실패 응답을 보내고 행동 로그에 기록하지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'devils_advocate' },
      { roleId: 'po' },
    ]);

    const firstActionPromise = waitForEvent(
      ctx.storyteller,
      'night:actionReceived',
    );
    const firstResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[3].emit('night:action', { targets: [playerIds[0]] }, resolve);
    });
    await firstActionPromise;
    expect(firstResult).toEqual({ success: true });

    ctx.app.game.setPhase('day');
    ctx.app.game.setPhase('night');

    let actionReceived = false;
    ctx.storyteller.once('night:actionReceived', () => {
      actionReceived = true;
    });
    const repeatedResult = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[3].emit('night:action', { targets: [playerIds[0]] }, resolve);
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(repeatedResult).toEqual({
      success: false,
      error: '악마의 변호사는 지난밤 선택한 대상을 다시 선택할 수 없습니다',
    });
    expect(actionReceived).toBe(false);
  }, 15000);

  it('객실 청소부는 선택한 2명 중 이번 밤 깨어난 플레이어 수를 자동으로 받는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'sailor' },
      { roleId: 'chambermaid' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    const sailorWakePromise = waitForEvent<{ roleId: string }>(
      ctx.players[0],
      'night:wakeUp',
    );
    ctx.storyteller.emit('night:setActiveRole', 'sailor');
    await sailorWakePromise;

    const chambermaidWakePromise = waitForEvent<{ roleId: string }>(
      ctx.players[1],
      'night:wakeUp',
    );
    ctx.storyteller.emit('night:setActiveRole', 'chambermaid');
    await chambermaidWakePromise;

    const feedbackPromise = waitForEvent<{
      feedback: { type: 'number'; value: number };
    }>(ctx.players[1], 'night:feedback');
    ctx.players[1].emit('night:action', {
      targets: [playerIds[0], playerIds[2]],
    });
    const feedback = await feedbackPromise;

    expect(feedback.feedback).toEqual({ type: 'number', value: 1 });
  }, 15000);

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

  it('사발로스 밤 행동은 죽은 선택 대상에게만 표식을 남긴다', async () => {
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
    expect(ctx.app.game.getPlayer(playerIds[1])?.statuses).not.toContain(
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

  it('중독된 포의 충전 3명 선택은 사망 없이 충전 표식만 소모한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    ctx.app.game.setPlayerStatuses(playerIds[4], [
      'po_chose_no_one',
      'poisoned',
    ]);

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', {
      targets: [playerIds[0], playerIds[1], playerIds[2]],
    });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(true);
    expect(ctx.app.game.getPlayer(playerIds[2])?.isAlive).toBe(true);
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

  it('엑소시스트가 푸카를 막아도 이전 푸카 중독 대상은 사망한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'exorcist' },
      { roleId: 'godfather' },
      { roleId: 'pukka' },
    ]);
    ctx.app.game.setPlayerStatuses(playerIds[0], ['pukka_poisoned']);

    const exorcistStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[2].emit('night:action', { targets: [playerIds[4]] });
    await exorcistStatePromise;

    const pukkaStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    const wakeTargetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'pukka');
    const wakeTargets = await wakeTargetsPromise;
    await pukkaStatePromise;

    expect(wakeTargets.candidateIds).toEqual([]);
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).not.toContain(
      'pukka_poisoned',
    );
  });

  it('푸카 중독으로 죽은 달의 자손도 공개 선택 자체는 성공 방송된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'moonchild' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'pukka' },
    ]);

    let statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', { targets: [playerIds[0]] });
    await statePromise;

    statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', { targets: [playerIds[2]] });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);

    ctx.app.game.setPhase('day');
    const announcementPromise = waitForEvent<{
      moonchildId: string;
      targetId: string;
    }>(ctx.players[1], 'moonchild:announced');
    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[0].emit(
          'moonchild:choose',
          { targetPlayerId: playerIds[1] },
          resolve,
        );
      },
    );

    const announcement = await announcementPromise;

    expect(result).toEqual({ success: true });
    expect(announcement).toMatchObject({
      moonchildId: playerIds[0],
      targetId: playerIds[1],
    });

    ctx.app.game.setPhase('night');
    expect(ctx.app.game.resolvePendingMoonchildKills()).toEqual([]);
    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(true);
  }, 15000);

  it('공개상 사망한 좀버얼도 달의 자손 공개 선택을 사칭할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'zombuul' },
    ]);
    ctx.app.game.setPlayerStatuses(playerIds[4], ['zombuul_registers_dead']);
    ctx.app.game.setPhase('day');

    const announcementPromise = waitForEvent<{
      moonchildId: string;
      targetId: string;
    }>(ctx.players[0], 'moonchild:announced');
    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[4].emit(
          'moonchild:choose',
          { targetPlayerId: playerIds[0] },
          resolve,
        );
      },
    );

    const announcement = await announcementPromise;

    expect(result).toEqual({ success: true });
    expect(announcement).toMatchObject({
      moonchildId: playerIds[4],
      targetId: playerIds[0],
    });
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
  });

  it('공개상 사망한 좀버얼은 재접속 응답에서도 사망 상태로 복원된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'zombuul' },
    ]);
    ctx.app.game.setPlayerStatuses(playerIds[4], ['zombuul_registers_dead']);

    const result = await new Promise<{ success: boolean; isAlive?: boolean }>(
      (resolve) => {
        ctx.players[4].emit('game:rejoin', { playerId: playerIds[4] }, resolve);
      },
    );

    expect(result.success).toBe(true);
    expect(result.isAlive).toBe(false);
  });

  it('공개상 사망한 좀버얼은 투표 순서 상태에서도 사망자로 표시된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'zombuul' },
    ]);
    ctx.app.game.setPlayerStatuses(playerIds[4], ['zombuul_registers_dead']);
    ctx.app.game.setPhase('day');
    ctx.app.game.setDaySubPhase('nomination');

    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[0],
      nomineeId: playerIds[1],
    });
    const voteOrderPromise = waitForEvent<{
      fullOrder: Array<{ id: string; isAlive: boolean }>;
    }>(ctx.players[0], 'vote:order', 7000);
    ctx.storyteller.emit('vote:proceedToVote');
    const voteOrder = await voteOrderPromise;

    expect(
      voteOrder.fullOrder.find((player) => player.id === playerIds[4])?.isAlive,
    ).toBe(false);
  });

  it('필수 대상 수가 부족한 밤 행동은 완료 처리하지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'pukka' },
    ]);

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[4].emit('night:action', { targets: [] }, resolve);
      },
    );

    expect(result).toEqual({
      success: false,
      error: '대상 1명을 선택해야 합니다',
    });
    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).not.toContain(
      'pukka_poisoned',
    );
  });

  it('엑소시스트가 사발로스를 막아도 사발로스 토해내기는 처리할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'exorcist' },
      { roleId: 'godfather' },
      { roleId: 'shabaloth' },
    ]);
    ctx.app.game.kill(playerIds[0]);
    ctx.app.game.setPlayerStatuses(playerIds[0], ['shabaloth_marked_dead']);

    const exorcistStatePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[2].emit('night:action', { targets: [playerIds[4]] });
    await exorcistStatePromise;

    const wakeTargetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', 'shabaloth');
    const wakeTargets = await wakeTargetsPromise;

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.storyteller.emit(
          'shabaloth:regurgitate',
          { shabalothId: playerIds[4], targetPlayerId: playerIds[0] },
          resolve,
        );
      },
    );

    expect(wakeTargets.candidateIds).toEqual([]);
    expect(result).toEqual({ success: true });
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
    expect(ctx.app.game.getPlayer(playerIds[0])?.statuses).not.toContain(
      'shabaloth_marked_dead',
    );
  });

  it('엑소시스트가 악마를 선택하면 악마는 엑소시스트가 누구인지 알 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'exorcist' },
      { roleId: 'godfather' },
      { roleId: 'pukka' },
    ]);

    const feedbackPromise = waitForEvent<{
      feedback: {
        type: 'player_and_role';
        playerName: string;
        roleName: string;
        playerId?: string;
      };
    }>(ctx.players[4], 'night:feedback');

    ctx.players[2].emit('night:action', { targets: [playerIds[4]] });
    const feedback = await feedbackPromise;

    expect(feedback.feedback).toEqual({
      type: 'player_and_role',
      playerId: playerIds[2],
      playerName: 'Player3',
      roleName: '엑소시스트',
    });
  });

  it('할머니가 알게 된 손주가 악마에게 사망하면 할머니도 사망한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'exorcist' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'shabaloth' },
    ]);

    ctx.storyteller.emit('night:setActiveRole', 'grandmother');
    const feedbackPromise = waitForEvent(ctx.players[0], 'night:feedback');
    ctx.storyteller.emit('night:sendFeedback', {
      playerId: playerIds[0],
      feedback: {
        type: 'player_and_role',
        playerId: playerIds[1],
        playerName: 'Player2',
        roleName: '구마사제',
      },
    });
    await feedbackPromise;

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[4].emit('night:action', {
      targets: [playerIds[1], playerIds[2]],
    });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
  });

  it('할머니가 알게 된 손주가 비악마 원인으로 사망하면 할머니는 생존한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'exorcist' },
      { roleId: 'godfather' },
      { roleId: 'assassin' },
      { roleId: 'shabaloth' },
    ]);

    ctx.storyteller.emit('night:setActiveRole', 'grandmother');
    const feedbackPromise = waitForEvent(ctx.players[0], 'night:feedback');
    ctx.storyteller.emit('night:sendFeedback', {
      playerId: playerIds[0],
      feedback: {
        type: 'player_and_role',
        playerId: playerIds[1],
        playerName: 'Player2',
        roleName: '구마사제',
      },
    });
    await feedbackPromise;

    const statePromise = waitForEvent(ctx.storyteller, 'game:state');
    ctx.players[3].emit('night:action', { targets: [playerIds[1]] });
    await statePromise;

    expect(ctx.app.game.getPlayer(playerIds[1])?.isAlive).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
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

  it('여관 주인 밤 행동은 보호만 적용하고 취한 플레이어를 자동 결정하지 않는다', async () => {
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
    ).toHaveLength(0);
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

  it.each([
    ['courtier', 'courtier_spent'],
    ['professor', 'professor_spent'],
    ['assassin', 'assassin_spent'],
  ] as const)('%s는 능력을 소모한 뒤 밤 차례에 다시 깨어나지 않는다', async (roleId, spentStatus) => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    ctx.app.game.setPlayerStatuses(playerIds[0], [spentStatus]);

    const wakeTargetsPromise = waitForEvent<{ candidateIds: string[] }>(
      ctx.storyteller,
      'night:wakeUpTargets',
    );
    ctx.storyteller.emit('night:setActiveRole', roleId);
    const wakeTargets = await wakeTargetsPromise;

    expect(wakeTargets.candidateIds).not.toContain(playerIds[0]);
  });

  it('도박사 제출은 승인 전에 판정하지 않고 수정된 값으로 승인한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);

    await activateGambler(ctx);
    const acceptedRequestPromise = waitForEvent<Record<string, unknown>>(
      ctx.players[0],
      'gambler:guessSubmitted',
      500,
    );
    const pendingStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const submitted = await submitGamblerGuess(ctx, 0, playerIds[1], 'sailor');
    const acceptedRequest = await acceptedRequestPromise;
    const pendingState = await pendingStatePromise;

    expect(submitted.success).toBe(true);
    if (!submitted.success) return;
    expect(acceptedRequest).toEqual({ requestId: submitted.requestId });
    expectNoGamblerGuessSecrets(acceptedRequest);
    expect(pendingState.pendingGamblerGuess).toEqual({
      requestId: submitted.requestId,
      gamblerId: playerIds[0],
      targetPlayerId: playerIds[1],
      guessedRoleId: 'sailor',
    });
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
    expect(ctx.app.game.hasPendingNightKill(playerIds[0])).toBe(false);

    let otherPlayerReviewed = false;
    ctx.players[1].once('gambler:guessReviewed', () => {
      otherPlayerReviewed = true;
    });
    const reviewedPromise = waitForEvent<Record<string, unknown>>(
      ctx.players[0],
      'gambler:guessReviewed',
    );
    const reviewedStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const approved = await reviewGamblerGuess(ctx, {
      requestId: submitted.requestId,
      decision: 'approve',
      targetPlayerId: playerIds[1],
      guessedRoleId: 'grandmother',
    });
    const reviewed = await reviewedPromise;
    const reviewedState = await reviewedStatePromise;

    expect(approved).toEqual({ success: true });
    expect(reviewed).toEqual({
      requestId: submitted.requestId,
      status: 'approved',
    });
    expectNoGamblerGuessSecrets(reviewed);
    expect(reviewedState.pendingGamblerGuess).toBeUndefined();
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
    expect(ctx.app.game.hasPendingNightKill(playerIds[0])).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(otherPlayerReviewed).toBe(false);
  }, 15000);

  it('도박사 제출 반려는 다음 플레이어를 깨우지 않고 새 ID로 재제출한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    ctx.app.game.setPlayerStatuses(playerIds[0], ['barista_acts_twice']);
    await activateGambler(ctx);

    const firstStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const first = await submitGamblerGuess(ctx, 0, playerIds[1], 'grandmother');
    await firstStatePromise;
    expect(first.success).toBe(true);
    if (!first.success) return;

    let secondWakeReceived = false;
    ctx.players[0].once('night:wakeUp', () => {
      secondWakeReceived = true;
    });
    const reviewedPromise = waitForEvent<Record<string, unknown>>(
      ctx.players[0],
      'gambler:guessReviewed',
    );
    const rejected = await reviewGamblerGuess(ctx, {
      requestId: first.requestId,
      decision: 'reject',
    });
    const reviewed = await reviewedPromise;
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(rejected).toEqual({ success: true });
    expect(reviewed).toEqual({
      requestId: first.requestId,
      status: 'rejected',
    });
    expect(secondWakeReceived).toBe(false);
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);

    const secondStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const second = await submitGamblerGuess(
      ctx,
      0,
      playerIds[1],
      'grandmother',
    );
    await secondStatePromise;

    expect(second.success).toBe(true);
    if (second.success) expect(second.requestId).not.toBe(first.requestId);
  }, 15000);

  it('틀린 도박사 승인은 밤 사망만 예약하고 낮 전까지 공개하지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    await activateGambler(ctx);

    const pendingStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const submitted = await submitGamblerGuess(ctx, 0, playerIds[1], 'sailor');
    await pendingStatePromise;
    expect(submitted.success).toBe(true);
    if (!submitted.success) return;

    let publicStateReceived = false;
    let playerUpdateReceived = false;
    let nightDeathsReceived = false;
    ctx.players[1].once('game:state', () => {
      publicStateReceived = true;
    });
    ctx.players[1].once('game:playerUpdate', () => {
      playerUpdateReceived = true;
    });
    ctx.players[1].once('night:deaths', () => {
      nightDeathsReceived = true;
    });

    const reviewedStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const approved = await reviewGamblerGuess(ctx, {
      requestId: submitted.requestId,
      decision: 'approve',
      targetPlayerId: playerIds[1],
      guessedRoleId: 'sailor',
    });
    await reviewedStatePromise;
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(approved).toEqual({ success: true });
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(ctx.app.game.hasPendingNightKill(playerIds[0])).toBe(true);
    expect(publicStateReceived).toBe(false);
    expect(playerUpdateReceived).toBe(false);
    expect(nightDeathsReceived).toBe(false);
  }, 15000);

  it('밤 사망 대기 중 재접속한 플레이어는 낮 전까지 살아있는 상태로 보인다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    await activateGambler(ctx);

    const pendingStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const submitted = await submitGamblerGuess(ctx, 0, playerIds[1], 'sailor');
    await pendingStatePromise;
    expect(submitted.success).toBe(true);
    if (!submitted.success) return;

    const reviewedStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    expect(
      await reviewGamblerGuess(ctx, {
        requestId: submitted.requestId,
        decision: 'approve',
        targetPlayerId: playerIds[1],
        guessedRoleId: 'sailor',
      }),
    ).toEqual({ success: true });
    await reviewedStatePromise;
    expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(false);
    expect(ctx.app.game.hasPendingNightKill(playerIds[0])).toBe(true);

    ctx.players[0].disconnect();
    const reconnectedPlayer = await ctx.connectPlayer();
    const publicStatePromise = waitForEvent<GameState>(
      reconnectedPlayer,
      'game:state',
    );
    const rejoin = await withTimeout(
      new Promise<Record<string, unknown>>((resolve) => {
        reconnectedPlayer.emit(
          'game:rejoin',
          { playerId: playerIds[0] },
          resolve,
        );
      }),
    );
    const publicState = await publicStatePromise;
    const gamePlayers = rejoin.gamePlayers as Array<{
      id: string;
      isAlive: boolean;
    }>;

    expect(rejoin.isAlive).toBe(true);
    expect(
      gamePlayers.find((player) => player.id === playerIds[0])?.isAlive,
    ).toBe(true);
    expect(
      publicState.players.find((player) => player.id === playerIds[0])?.isAlive,
    ).toBe(true);
    expectNoGamblerGuessSecrets(rejoin);
  }, 15000);

  it.each([
    ['poisoned', { roleId: 'gambler' }, true],
    ['drunk-as', { roleId: 'drunk', drunkAs: 'gambler' }, false],
  ] as const)(
    '%s 도박사의 승인된 틀린 추측은 사망 없이 완료된다',
    async (_caseName, gamblerRole, poisonPlayer) => {
      const { playerIds } = await setupGameWithRoles(ctx, [
        gamblerRole,
        { roleId: 'grandmother' },
        { roleId: 'sailor' },
        { roleId: 'godfather' },
        { roleId: 'po' },
      ]);
      ctx.app.game.setRoleSetup('bad_moon_rising');
      if (poisonPlayer) {
        ctx.app.game.setPlayerStatuses(playerIds[0], ['poisoned']);
      }
      await activateGambler(ctx);

      const pendingStatePromise = waitForEvent<GameState>(
        ctx.storyteller,
        'game:state',
      );
      const submitted = await submitGamblerGuess(
        ctx,
        0,
        playerIds[1],
        'sailor',
      );
      await pendingStatePromise;
      expect(submitted.success).toBe(true);
      if (!submitted.success) return;

      const reviewedStatePromise = waitForEvent<GameState>(
        ctx.storyteller,
        'game:state',
      );
      const approved = await reviewGamblerGuess(ctx, {
        requestId: submitted.requestId,
        decision: 'approve',
        targetPlayerId: playerIds[1],
        guessedRoleId: 'sailor',
      });
      await reviewedStatePromise;

      expect(approved).toEqual({ success: true });
      expect(ctx.app.game.getPlayer(playerIds[0])?.isAlive).toBe(true);
      expect(ctx.app.game.hasPendingNightKill(playerIds[0])).toBe(false);
    },
    15000,
  );

  it('오래된 도박사 검토는 실패하고 현재 요청을 유지한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    await activateGambler(ctx);

    const pendingStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const submitted = await submitGamblerGuess(
      ctx,
      0,
      playerIds[1],
      'grandmother',
    );
    await pendingStatePromise;
    expect(submitted.success).toBe(true);
    if (!submitted.success) return;

    const stale = await reviewGamblerGuess(ctx, {
      requestId: 'stale-request',
      decision: 'reject',
    });

    expect(stale.success).toBe(false);
    expect(ctx.app.game.getPendingGamblerGuess()?.requestId).toBe(
      submitted.requestId,
    );
  }, 15000);

  it('바리스타 2회 기상은 두 요청만 순차적으로 승인한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    ctx.app.game.setPlayerStatuses(playerIds[0], ['barista_acts_twice']);
    await activateGambler(ctx);

    const firstStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const first = await submitGamblerGuess(ctx, 0, playerIds[1], 'grandmother');
    await firstStatePromise;
    expect(first.success).toBe(true);
    if (!first.success) return;

    const secondWakePromise = waitForEvent<{ roleId: string }>(
      ctx.players[0],
      'night:wakeUp',
    );
    const firstReviewedStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    expect(
      await reviewGamblerGuess(ctx, {
        requestId: first.requestId,
        decision: 'approve',
        targetPlayerId: playerIds[1],
        guessedRoleId: 'grandmother',
      }),
    ).toEqual({ success: true });
    await firstReviewedStatePromise;
    await expect(secondWakePromise).resolves.toEqual({ roleId: 'gambler' });

    const secondStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const second = await submitGamblerGuess(
      ctx,
      0,
      playerIds[1],
      'grandmother',
    );
    await secondStatePromise;
    expect(second.success).toBe(true);
    if (!second.success) return;
    expect(second.requestId).not.toBe(first.requestId);

    const secondReviewedStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    expect(
      await reviewGamblerGuess(ctx, {
        requestId: second.requestId,
        decision: 'approve',
        targetPlayerId: playerIds[1],
        guessedRoleId: 'grandmother',
      }),
    ).toEqual({ success: true });
    await secondReviewedStatePromise;

    expect(
      await submitGamblerGuess(ctx, 0, playerIds[1], 'grandmother'),
    ).toMatchObject({ success: false });
  }, 15000);

  it('도박사 승인으로 게임이 종료되면 다음 밤 플레이어를 깨우지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    ctx.app.game.kill(playerIds[1]);
    ctx.app.game.kill(playerIds[2]);
    ctx.app.game.setPlayerStatuses(playerIds[0], ['barista_acts_twice']);
    await activateGambler(ctx);

    const pendingStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const submitted = await submitGamblerGuess(ctx, 0, playerIds[1], 'sailor');
    await pendingStatePromise;
    expect(submitted.success).toBe(true);
    if (!submitted.success) return;

    let secondWakeReceived = false;
    ctx.players[0].once('night:wakeUp', () => {
      secondWakeReceived = true;
    });
    const gameEndPromise = waitForEvent<{ winningTeam: 'good' | 'evil' }>(
      ctx.players[0],
      'game:end',
    );
    const endedPhasePromise = waitForEvent<string>(
      ctx.players[0],
      'game:phase',
    );

    expect(
      await reviewGamblerGuess(ctx, {
        requestId: submitted.requestId,
        decision: 'approve',
        targetPlayerId: playerIds[1],
        guessedRoleId: 'sailor',
      }),
    ).toEqual({ success: true });
    expect(await gameEndPromise).toMatchObject({ winningTeam: 'evil' });
    expect(await endedPhasePromise).toBe('ended');
    expect(ctx.app.game.getState().phase).toBe('ended');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(secondWakeReceived).toBe(false);
  }, 15000);

  it('도박사와 이야기꾼 재접속은 비밀 누출 없이 대기·반려 상태를 복원한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'gambler' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'godfather' },
      { roleId: 'po' },
    ]);
    await activateGambler(ctx);

    const pendingStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    const submitted = await submitGamblerGuess(
      ctx,
      0,
      playerIds[1],
      'grandmother',
    );
    await pendingStatePromise;
    expect(submitted.success).toBe(true);
    if (!submitted.success) return;

    const rejoinedPlayer = await ctx.connectPlayer();
    const publicStatePromise = waitForEvent<GameState>(
      rejoinedPlayer,
      'game:state',
    );
    const pendingRejoin = await withTimeout(
      new Promise<Record<string, unknown>>((resolve) => {
        rejoinedPlayer.emit('game:rejoin', { playerId: playerIds[0] }, resolve);
      }),
    );
    const publicState = await publicStatePromise;

    expect(pendingRejoin).toMatchObject({
      success: true,
      gamblerGuessStatus: 'pending',
      gamblerGuessRequestId: submitted.requestId,
    });
    expectNoGamblerGuessSecrets(pendingRejoin);
    expect(publicState.pendingGamblerGuess).toBeUndefined();

    const otherPlayerRejoin = await withTimeout(
      new Promise<Record<string, unknown>>((resolve) => {
        ctx.players[1].emit('game:rejoin', { playerId: playerIds[1] }, resolve);
      }),
    );
    expect(otherPlayerRejoin.gamblerGuessStatus).toBe('idle');
    expect(otherPlayerRejoin.gamblerGuessRequestId).toBeUndefined();

    ctx.storyteller.disconnect();
    const reconnectStatePromise = waitForEvent<GameState>(
      ctx.storyteller,
      'game:state',
    );
    ctx.storyteller.connect();
    const reconnectState = await reconnectStatePromise;
    expect(reconnectState.pendingGamblerGuess).toEqual({
      requestId: submitted.requestId,
      gamblerId: playerIds[0],
      targetPlayerId: playerIds[1],
      guessedRoleId: 'grandmother',
    });

    expect(
      await reviewGamblerGuess(ctx, {
        requestId: submitted.requestId,
        decision: 'reject',
      }),
    ).toEqual({ success: true });

    const rejectedRejoin = await withTimeout(
      new Promise<Record<string, unknown>>((resolve) => {
        rejoinedPlayer.emit('game:rejoin', { playerId: playerIds[0] }, resolve);
      }),
    );
    expect(rejectedRejoin).toMatchObject({
      success: true,
      gamblerGuessStatus: 'rejected',
      gamblerGuessRequestId: submitted.requestId,
    });
    expectNoGamblerGuessSecrets(rejectedRejoin);
  }, 15000);

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

  it('선택형 1회성 밤 행동은 대상 없이 스킵할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'godfather' },
      { roleId: 'assassin' },
    ]);

    const actionPromise = waitForEvent<{
      playerId: string;
      roleId: string;
      targets: string[];
    }>(ctx.storyteller, 'night:actionReceived');

    const result = await new Promise<{ success: boolean; error?: string }>(
      (resolve) => {
        ctx.players[4].emit('night:action', { targets: [] }, resolve);
      },
    );
    const action = await actionPromise;

    expect(result).toEqual({ success: true });
    expect(action).toMatchObject({
      playerId: playerIds[4],
      roleId: 'assassin',
      targets: [],
    });
  });

  it('플레이어 암살자 밤 행동으로 악마가 사망하면 즉시 선 팀 승리로 종료한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'gambler' },
      { roleId: 'assassin' },
      { roleId: 'po' },
    ]);

    const endPromise = waitForEvent<{ winningTeam: 'good' | 'evil' }>(
      ctx.players[0],
      'game:end',
      500,
    );
    ctx.players[3].emit('night:action', { targets: [playerIds[4]] });
    const result = await endPromise;

    expect(result.winningTeam).toBe('good');
    expect(ctx.app.game.getPlayer(playerIds[4])?.isAlive).toBe(false);
  });
});
