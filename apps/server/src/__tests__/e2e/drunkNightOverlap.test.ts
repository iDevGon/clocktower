import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  setupGameWithRoles,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

/**
 * 주정뱅이(drunkAs=X)와 실제 X가 동시에 존재할 때,
 * 밤에 두 플레이어 모두 역할을 수행할 수 있는지 검증.
 *
 * 마을주민 밤 역할 전체 대상:
 * - 능동 역할 (select_one/select_two): fortune_teller, monk
 * - 수동 역할 (passive): washerwoman, librarian, investigator, chef, empath, undertaker
 * - onlyWhenDead 역할: ravenkeeper
 */

/** 기본 5인 게임 구성: p0=Drunk(drunkAs), p1=실제역할, p2=soldier, p3=poisoner, p4=imp */
function makeRoles(drunkAs: string) {
  return [
    { roleId: 'drunk', drunkAs },
    { roleId: drunkAs },
    { roleId: 'soldier' },
    { roleId: 'poisoner' },
    { roleId: 'imp' },
  ];
}

// ─── 능동 역할: 양쪽 모두 night:action 제출 가능 ───

describe('E2E: 주정뱅이 겹침 — 점쟁이 (select_two)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('주정뱅이(점쟁이) + 진짜 점쟁이: 둘 다 밤 행동을 제출한다', async () => {
    const { playerIds } = await setupGameWithRoles(
      ctx,
      makeRoles('fortune_teller'),
    );

    // night:activeRole 리스너 등록
    const activePromise0 = waitForEvent(
      ctx.players[0] as Socket,
      'night:activeRole',
    );
    const activePromise1 = waitForEvent(
      ctx.players[1] as Socket,
      'night:activeRole',
    );

    ctx.storyteller.emit('night:setActiveRole', 'fortune_teller');

    await activePromise0;
    await activePromise1;

    // 이야기꾼에게 night:actionReceived 2건 수신 확인
    const actions: Array<{ playerId: string; roleId: string }> = [];
    const bothReceived = new Promise<void>((resolve) => {
      ctx.storyteller.on('night:actionReceived', (action) => {
        actions.push(action);
        if (actions.length >= 2) resolve();
      });
    });

    // p0(Drunk) 행동 제출 — 점쟁이는 2명 선택
    ctx.players[0].emit('night:action', {
      targets: [playerIds[2], playerIds[3]],
    });
    // p1(진짜 점쟁이) 행동 제출
    ctx.players[1].emit('night:action', {
      targets: [playerIds[3], playerIds[4]],
    });

    await bothReceived;

    expect(actions).toHaveLength(2);
    const submitterIds = actions.map((a) => a.playerId);
    expect(submitterIds).toContain(playerIds[0]);
    expect(submitterIds).toContain(playerIds[1]);
    // 둘 다 fortune_teller로 보고됨
    expect(actions.every((a) => a.roleId === 'fortune_teller')).toBe(true);
  }, 15000);
});

describe('E2E: 주정뱅이 겹침 — 수도승 (select_one)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('주정뱅이(수도승) + 진짜 수도승: 둘 다 밤 행동을 제출한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, makeRoles('monk'));

    const activePromise0 = waitForEvent(
      ctx.players[0] as Socket,
      'night:activeRole',
    );
    const activePromise1 = waitForEvent(
      ctx.players[1] as Socket,
      'night:activeRole',
    );

    ctx.storyteller.emit('night:setActiveRole', 'monk');
    await activePromise0;
    await activePromise1;

    const actions: Array<{ playerId: string; roleId: string }> = [];
    const bothReceived = new Promise<void>((resolve) => {
      ctx.storyteller.on('night:actionReceived', (action) => {
        actions.push(action);
        if (actions.length >= 2) resolve();
      });
    });

    ctx.players[0].emit('night:action', { targets: [playerIds[2]] });
    ctx.players[1].emit('night:action', { targets: [playerIds[3]] });

    await bothReceived;

    expect(actions).toHaveLength(2);
    const submitterIds = actions.map((a) => a.playerId);
    expect(submitterIds).toContain(playerIds[0]);
    expect(submitterIds).toContain(playerIds[1]);
    expect(actions.every((a) => a.roleId === 'monk')).toBe(true);
  }, 15000);
});

// ─── 수동 역할: 양쪽 모두 피드백 수신 가능 ───

const PASSIVE_ROLES = [
  { roleId: 'washerwoman', label: '세탁부' },
  { roleId: 'librarian', label: '사서' },
  { roleId: 'investigator', label: '조사관' },
  { roleId: 'chef', label: '요리사' },
  { roleId: 'empath', label: '공감술사' },
  { roleId: 'undertaker', label: '장의사' },
] as const;

describe('E2E: 주정뱅이 겹침 — 수동 역할 피드백', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  for (const { roleId, label } of PASSIVE_ROLES) {
    it(`주정뱅이(${label}) + 진짜 ${label}: 양쪽 모두 피드백을 수신한다`, async () => {
      const { playerIds } = await setupGameWithRoles(ctx, makeRoles(roleId));

      // 역할 활성화
      const activePromise0 = waitForEvent(
        ctx.players[0] as Socket,
        'night:activeRole',
      );
      ctx.storyteller.emit('night:setActiveRole', roleId);
      await activePromise0;

      // p0(Drunk)에게 피드백 전송
      const fb0Promise = waitForEvent(
        ctx.players[0] as Socket,
        'night:feedback',
      );
      ctx.storyteller.emit('night:sendFeedback', {
        playerId: playerIds[0],
        feedback: { type: 'number', value: 0 },
      });
      const fb0 = await fb0Promise;
      expect(fb0).toBeDefined();

      // p1(진짜 역할)에게 피드백 전송
      const fb1Promise = waitForEvent(
        ctx.players[1] as Socket,
        'night:feedback',
      );
      ctx.storyteller.emit('night:sendFeedback', {
        playerId: playerIds[1],
        feedback: { type: 'number', value: 1 },
      });
      const fb1 = await fb1Promise;
      expect(fb1).toBeDefined();
    }, 15000);
  }
});

// ─── 까마귀지기 (onlyWhenDead) 특수 케이스 ───

describe('E2E: 주정뱅이 겹침 — 까마귀지기 (onlyWhenDead)', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('둘 다 이번 밤에 사망하면 양쪽 모두 night:wakeUp을 수신한다', async () => {
    const { playerIds } = await setupGameWithRoles(
      ctx,
      makeRoles('ravenkeeper'),
    );

    // 양쪽 모두 사살 (이번 밤 pendingNightKill)
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');
    ctx.storyteller.emit('game:kill', playerIds[1]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');

    // wakeUp 리스너 등록
    const wakeUp0 = waitForEvent<{ roleId: string }>(
      ctx.players[0] as Socket,
      'night:wakeUp',
    );
    const wakeUp1 = waitForEvent<{ roleId: string }>(
      ctx.players[1] as Socket,
      'night:wakeUp',
    );

    ctx.storyteller.emit('night:setActiveRole', 'ravenkeeper');

    const result0 = await wakeUp0;
    const result1 = await wakeUp1;
    expect(result0.roleId).toBe('ravenkeeper');
    expect(result1.roleId).toBe('ravenkeeper');
  }, 15000);

  it('둘 다 사망 후 양쪽 모두 밤 행동을 제출한다', async () => {
    const { playerIds } = await setupGameWithRoles(
      ctx,
      makeRoles('ravenkeeper'),
    );

    // 양쪽 사살
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');
    ctx.storyteller.emit('game:kill', playerIds[1]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');

    // 까마귀지기 활성화
    ctx.storyteller.emit('night:setActiveRole', 'ravenkeeper');
    await waitForEvent(ctx.players[0] as Socket, 'night:wakeUp');

    const actions: Array<{ playerId: string; roleId: string }> = [];
    const bothReceived = new Promise<void>((resolve) => {
      ctx.storyteller.on('night:actionReceived', (action) => {
        actions.push(action);
        if (actions.length >= 2) resolve();
      });
    });

    // 양쪽 행동 제출
    ctx.players[0].emit('night:action', { targets: [playerIds[2]] });
    ctx.players[1].emit('night:action', { targets: [playerIds[3]] });

    await bothReceived;

    expect(actions).toHaveLength(2);
    const submitterIds = actions.map((a) => a.playerId);
    expect(submitterIds).toContain(playerIds[0]);
    expect(submitterIds).toContain(playerIds[1]);
  }, 15000);

  it('주정뱅이(까마귀지기)가 이전에 이미 죽은 경우 wakeUp을 수신하지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(
      ctx,
      makeRoles('ravenkeeper'),
    );

    // p0(Drunk)를 먼저 사살 → 낮으로 전환 (pendingNightKills flush) → 다시 밤
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');

    // 낮 전환 → pendingNightKills가 flush됨
    const phasePromise = waitForEvent(ctx.players[1] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    // 다시 밤 전환
    const nightPromise = waitForEvent(ctx.players[1] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'night');
    await nightPromise;

    // 이번 밤에 p1(진짜 까마귀지기)만 사살
    ctx.storyteller.emit('game:kill', playerIds[1]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');

    // p1만 wakeUp 수신, p0은 받으면 안 됨
    let drunkReceivedWakeUp = false;
    ctx.players[0].on('night:wakeUp', () => {
      drunkReceivedWakeUp = true;
    });

    const wakeUp1 = waitForEvent<{ roleId: string }>(
      ctx.players[1] as Socket,
      'night:wakeUp',
    );

    ctx.storyteller.emit('night:setActiveRole', 'ravenkeeper');

    const result1 = await wakeUp1;
    expect(result1.roleId).toBe('ravenkeeper');

    // 잠시 대기 후 Drunk이 wakeUp을 받지 않았는지 확인
    await new Promise((r) => setTimeout(r, 300));
    expect(drunkReceivedWakeUp).toBe(false);
  }, 15000);

  it('진짜 까마귀지기만 이번 밤에 사망 시 주정뱅이에게 wakeUp을 보내지 않는다', async () => {
    const { playerIds } = await setupGameWithRoles(
      ctx,
      makeRoles('ravenkeeper'),
    );

    // p1(진짜)만 사살, p0(Drunk)는 생존
    ctx.storyteller.emit('game:kill', playerIds[1]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');

    let drunkReceivedWakeUp = false;
    ctx.players[0].on('night:wakeUp', () => {
      drunkReceivedWakeUp = true;
    });

    const wakeUp1 = waitForEvent<{ roleId: string }>(
      ctx.players[1] as Socket,
      'night:wakeUp',
    );

    ctx.storyteller.emit('night:setActiveRole', 'ravenkeeper');

    const result1 = await wakeUp1;
    expect(result1.roleId).toBe('ravenkeeper');

    await new Promise((r) => setTimeout(r, 300));
    expect(drunkReceivedWakeUp).toBe(false);
  }, 15000);
});
