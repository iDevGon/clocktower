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

  it('주정뱅이(점쟁이) + 진짜 점쟁이: 순차적으로 밤 행동을 제출한다', async () => {
    const { playerIds } = await setupGameWithRoles(
      ctx,
      makeRoles('fortune_teller'),
    );

    // 첫 번째 wakeUp 수신 (랜덤 순서)
    const firstWakeUp = new Promise<number>((resolve) => {
      ctx.players[0].once('night:wakeUp', () => resolve(0));
      ctx.players[1].once('night:wakeUp', () => resolve(1));
    });

    ctx.storyteller.emit('night:setActiveRole', 'fortune_teller');
    const firstIdx = await firstWakeUp;
    const secondIdx = firstIdx === 0 ? 1 : 0;

    // 첫 번째 플레이어 행동 제출
    const action1Promise = waitForEvent<{ playerId: string; roleId: string }>(
      ctx.storyteller as Socket,
      'night:actionReceived',
    );
    ctx.players[firstIdx].emit('night:action', {
      targets: [playerIds[2], playerIds[3]],
    });
    const action1 = await action1Promise;
    expect(action1.roleId).toBe('fortune_teller');

    // 피드백 전송 → 두 번째 wakeUp 트리거
    const secondWakeUp = waitForEvent(
      ctx.players[secondIdx] as Socket,
      'night:wakeUp',
    );
    ctx.storyteller.emit('night:sendFeedback', {
      playerId: playerIds[firstIdx],
      feedback: { type: 'yes_no', value: true },
    });
    await secondWakeUp;

    // 두 번째 플레이어 행동 제출
    const action2Promise = waitForEvent<{ playerId: string; roleId: string }>(
      ctx.storyteller as Socket,
      'night:actionReceived',
    );
    ctx.players[secondIdx].emit('night:action', {
      targets: [playerIds[3], playerIds[4]],
    });
    const action2 = await action2Promise;
    expect(action2.roleId).toBe('fortune_teller');
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

  it('주정뱅이(수도승) + 진짜 수도승: 순차적으로 밤 행동을 제출한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, makeRoles('monk'));

    // 첫 번째 wakeUp
    const firstWakeUp = new Promise<number>((resolve) => {
      ctx.players[0].once('night:wakeUp', () => resolve(0));
      ctx.players[1].once('night:wakeUp', () => resolve(1));
    });

    ctx.storyteller.emit('night:setActiveRole', 'monk');
    const firstIdx = await firstWakeUp;
    const secondIdx = firstIdx === 0 ? 1 : 0;

    // 첫 번째 행동 제출
    const action1Promise = waitForEvent<{ playerId: string; roleId: string }>(
      ctx.storyteller as Socket,
      'night:actionReceived',
    );
    ctx.players[firstIdx].emit('night:action', { targets: [playerIds[2]] });
    const action1 = await action1Promise;
    expect(action1.roleId).toBe('monk');

    // 피드백 → 두 번째 wakeUp
    const secondWakeUp = waitForEvent(
      ctx.players[secondIdx] as Socket,
      'night:wakeUp',
    );
    ctx.storyteller.emit('night:sendFeedback', {
      playerId: playerIds[firstIdx],
      feedback: { type: 'number', value: 0 },
    });
    await secondWakeUp;

    // 두 번째 행동 제출
    const action2Promise = waitForEvent<{ playerId: string; roleId: string }>(
      ctx.storyteller as Socket,
      'night:actionReceived',
    );
    ctx.players[secondIdx].emit('night:action', { targets: [playerIds[3]] });
    const action2 = await action2Promise;
    expect(action2.roleId).toBe('monk');
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
    it(`주정뱅이(${label}) + 진짜 ${label}: 순차 wakeUp 후 양쪽 피드백 수신`, async () => {
      const { playerIds } = await setupGameWithRoles(ctx, makeRoles(roleId));

      // 첫 번째 wakeUp (랜덤 순서)
      const firstWakeUp = new Promise<number>((resolve) => {
        ctx.players[0].once('night:wakeUp', () => resolve(0));
        ctx.players[1].once('night:wakeUp', () => resolve(1));
      });

      ctx.storyteller.emit('night:setActiveRole', roleId);
      const firstIdx = await firstWakeUp;
      const secondIdx = firstIdx === 0 ? 1 : 0;

      // 첫 번째에게 피드백 전송 → 두 번째 wakeUp 트리거
      const secondWakeUp = waitForEvent(
        ctx.players[secondIdx] as Socket,
        'night:wakeUp',
      );
      const fb0Promise = waitForEvent(
        ctx.players[firstIdx] as Socket,
        'night:feedback',
      );
      ctx.storyteller.emit('night:sendFeedback', {
        playerId: playerIds[firstIdx],
        feedback: { type: 'number', value: 0 },
      });
      const fb0 = await fb0Promise;
      expect(fb0).toBeDefined();
      await secondWakeUp;

      // 두 번째에게 피드백 전송
      const fb1Promise = waitForEvent(
        ctx.players[secondIdx] as Socket,
        'night:feedback',
      );
      ctx.storyteller.emit('night:sendFeedback', {
        playerId: playerIds[secondIdx],
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

  it('둘 다 이번 밤에 사망하면 순차적으로 night:wakeUp을 수신한다', async () => {
    const { playerIds } = await setupGameWithRoles(
      ctx,
      makeRoles('ravenkeeper'),
    );

    // 양쪽 모두 사살 (이번 밤 pendingNightKill)
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');
    ctx.storyteller.emit('game:kill', playerIds[1]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');

    // 첫 번째 wakeUp 수신 대기 (랜덤이므로 어느 쪽이든)
    const wakeUps: string[] = [];
    const firstWakeUp = new Promise<{ roleId: string; socket: number }>(
      (resolve) => {
        ctx.players[0].once('night:wakeUp', (data: { roleId: string }) => {
          wakeUps.push(playerIds[0]);
          resolve({ ...data, socket: 0 });
        });
        ctx.players[1].once('night:wakeUp', (data: { roleId: string }) => {
          wakeUps.push(playerIds[1]);
          resolve({ ...data, socket: 1 });
        });
      },
    );

    ctx.storyteller.emit('night:setActiveRole', 'ravenkeeper');

    const first = await firstWakeUp;
    expect(first.roleId).toBe('ravenkeeper');
    expect(wakeUps).toHaveLength(1);

    // 두 번째 플레이어는 아직 wakeUp을 받지 않음
    // 첫 번째 플레이어에게 피드백 전송 → 두 번째 wakeUp 트리거
    const secondIdx = first.socket === 0 ? 1 : 0;
    const secondWakeUp = waitForEvent<{ roleId: string }>(
      ctx.players[secondIdx] as Socket,
      'night:wakeUp',
    );

    ctx.storyteller.emit('night:sendFeedback', {
      playerId: wakeUps[0],
      feedback: { type: 'role', roleId: 'imp' },
    });

    const second = await secondWakeUp;
    expect(second.roleId).toBe('ravenkeeper');
  }, 15000);

  it('둘 다 사망 후 순차적으로 밤 행동을 제출한다', async () => {
    const { playerIds } = await setupGameWithRoles(
      ctx,
      makeRoles('ravenkeeper'),
    );

    // 양쪽 사살
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');
    ctx.storyteller.emit('game:kill', playerIds[1]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');

    // 까마귀지기 활성화 → 첫 번째 wakeUp
    const firstWakeUp = new Promise<number>((resolve) => {
      ctx.players[0].once('night:wakeUp', () => resolve(0));
      ctx.players[1].once('night:wakeUp', () => resolve(1));
    });

    ctx.storyteller.emit('night:setActiveRole', 'ravenkeeper');
    const firstIdx = await firstWakeUp;
    const secondIdx = firstIdx === 0 ? 1 : 0;

    // 첫 번째 행동 제출
    const action1Promise = waitForEvent<{ playerId: string }>(
      ctx.storyteller as Socket,
      'night:actionReceived',
    );
    ctx.players[firstIdx].emit('night:action', { targets: [playerIds[2]] });
    const action1 = await action1Promise;
    expect(action1.playerId).toBe(playerIds[firstIdx]);

    // 피드백 전송 → 두 번째 wakeUp 트리거
    const secondWakeUp = waitForEvent(
      ctx.players[secondIdx] as Socket,
      'night:wakeUp',
    );
    ctx.storyteller.emit('night:sendFeedback', {
      playerId: playerIds[firstIdx],
      feedback: { type: 'role', roleId: 'imp' },
    });
    await secondWakeUp;

    // 두 번째 행동 제출
    const action2Promise = waitForEvent<{ playerId: string }>(
      ctx.storyteller as Socket,
      'night:actionReceived',
    );
    ctx.players[secondIdx].emit('night:action', { targets: [playerIds[3]] });
    const action2 = await action2Promise;
    expect(action2.playerId).toBe(playerIds[secondIdx]);
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
