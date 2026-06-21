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

  it('선원 밤 행동은 선택 대상에게 선원 취함 상태를 적용한다', async () => {
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

    expect(ctx.app.game.getPlayer(playerIds[1])?.statuses).toContain(
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
