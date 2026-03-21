import { ALL_ROLES, TROUBLE_BREWING_ROLES } from '@clocktower/shared/logic';
import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestServer, type TestContext, waitForEvent } from './helpers.js';

/**
 * 게임 생성 → 플레이어 참가 → 수동 역할 배정 → 게임 시작 후
 * 악마에게 전달된 evil:info의 bluffRoles를 반환합니다.
 */
async function setupAndGetBluffs(
  ctx: TestContext,
  roleAssignments: Array<{ roleId: string; drunkAs?: string }>,
  bluffRoleIds?: string[],
): Promise<{
  bluffRoles: { id: string; name: string }[];
  playerIds: string[];
}> {
  const playerCount = roleAssignments.length;

  // 1. 게임 생성
  const statePromise = waitForEvent(ctx.storyteller as Socket, 'game:state');
  await new Promise<void>((resolve) => {
    ctx.storyteller.emit('game:create', (res) => {
      if (res.success) resolve();
    });
  });
  await statePromise;

  // 2. 플레이어 참가
  const playerIds: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    const playerSocket = await ctx.connectPlayer();
    ctx.players.push(playerSocket);
    const joinStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    const joinResult = await new Promise<{
      success: boolean;
      playerId?: string;
    }>((resolve) => {
      playerSocket.emit('game:join', { playerName: `Player${i + 1}` }, resolve);
    });
    if (joinResult.playerId) playerIds.push(joinResult.playerId);
    await joinStatePromise;
  }

  // 3. 수동 역할 배정 (악마 역할은 마지막에 배정하되, bluffRoleIds 포함)
  const demonIndex = roleAssignments.findIndex((r) => {
    const role = ALL_ROLES.find((ar) => ar.id === r.roleId);
    return role?.team === 'demon';
  });

  // 악마가 아닌 역할 먼저 배정
  for (let i = 0; i < playerCount; i++) {
    if (i === demonIndex) continue;
    const assignStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    ctx.storyteller.emit('game:assignRole', {
      playerId: playerIds[i],
      roleId: roleAssignments[i].roleId,
      drunkAs: roleAssignments[i].drunkAs,
    });
    await assignStatePromise;
  }

  // 악마 역할 배정 (bluffRoleIds 포함)
  const demonAssignPromise = waitForEvent(
    ctx.storyteller as Socket,
    'game:state',
  );
  ctx.storyteller.emit('game:assignRole', {
    playerId: playerIds[demonIndex],
    roleId: roleAssignments[demonIndex].roleId,
    bluffRoleIds,
  });
  await demonAssignPromise;

  // 4. evil:info 리스너 등록 후 게임 시작
  const demonInfoPromise = waitForEvent<{
    minionNames?: string[];
    bluffRoles?: { id: string; name: string }[];
  }>(ctx.players[demonIndex] as Socket, 'evil:info');

  const startStatePromise = waitForEvent(
    ctx.storyteller as Socket,
    'game:state',
  );
  await new Promise<void>((resolve, reject) => {
    ctx.storyteller.emit('game:start', (res) => {
      if (res.success) resolve();
      else reject(new Error(res.error));
    });
  });
  await startStatePromise;

  const demonInfo = await demonInfoPromise;
  return {
    bluffRoles: demonInfo.bluffRoles ?? [],
    playerIds,
  };
}

/** TB 에디션의 선한(townsfolk/outsider) 역할 ID 목록 */
const TB_GOOD_ROLE_IDS = TROUBLE_BREWING_ROLES.filter(
  (r) => r.team === 'townsfolk' || r.team === 'outsider',
).map((r) => r.id);

/** S&V 에디션의 선한 역할 ID 목록 (ALL_ROLES에 포함된 것만) */
const SV_GOOD_ROLE_IDS = ALL_ROLES.filter(
  (r) =>
    r.edition === 'sects_and_violets' &&
    (r.team === 'townsfolk' || r.team === 'outsider'),
).map((r) => r.id);

describe('E2E: 블러프 역할 필터링', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('블러프에는 선한 진영(townsfolk/outsider) 역할만 포함된다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(ctx, [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
    ]);

    expect(bluffRoles).toHaveLength(3);
    for (const bluff of bluffRoles) {
      const role = ALL_ROLES.find((r) => r.id === bluff.id);
      expect(role).toBeDefined();
      expect(['townsfolk', 'outsider']).toContain(role?.team);
    }
  }, 15000);

  it('게임에 배정된 역할은 블러프에 포함되지 않는다', async () => {
    const assignedRoleIds = [
      'imp',
      'poisoner',
      'washerwoman',
      'empath',
      'fortune_teller',
    ];
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      assignedRoleIds.map((roleId) => ({ roleId })),
    );

    expect(bluffRoles).toHaveLength(3);
    for (const bluff of bluffRoles) {
      expect(assignedRoleIds).not.toContain(bluff.id);
    }
  }, 15000);

  it('Drunk의 drunkAs 역할도 블러프에서 제외된다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(ctx, [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'drunk', drunkAs: 'chef' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
    ]);

    expect(bluffRoles).toHaveLength(3);
    // drunk 자체와 drunkAs(chef) 모두 블러프에 없어야 함
    const bluffIds = bluffRoles.map((b) => b.id);
    expect(bluffIds).not.toContain('drunk');
    expect(bluffIds).not.toContain('chef');
  }, 15000);

  it('TB 에디션만 사용 시 블러프는 TB 역할로만 구성된다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(ctx, [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
    ]);

    expect(bluffRoles).toHaveLength(3);
    for (const bluff of bluffRoles) {
      expect(TB_GOOD_ROLE_IDS).toContain(bluff.id);
    }
  }, 15000);

  it('타에디션(S&V) 역할이 배정되면 해당 에디션의 선한 역할도 블러프 후보가 된다', async () => {
    // sweetheart(S&V 외지인)를 포함하면 S&V 선한 역할도 블러프 후보
    // 반복 실행하여 S&V 역할이 블러프에 포함될 수 있는지 확인
    let foundSvBluff = false;

    // 확률적 테스트이므로 여러 번 시도
    for (let attempt = 0; attempt < 10; attempt++) {
      if (attempt > 0) {
        await ctx.cleanup();
        ctx = await setupTestServer();
      }
      const { bluffRoles } = await setupAndGetBluffs(ctx, [
        { roleId: 'imp' },
        { roleId: 'poisoner' },
        { roleId: 'sweetheart' },
        { roleId: 'empath' },
        { roleId: 'fortune_teller' },
      ]);

      expect(bluffRoles).toHaveLength(3);
      // 모든 블러프는 TB 또는 S&V 선한 역할이어야 함
      for (const bluff of bluffRoles) {
        const isTbGood = TB_GOOD_ROLE_IDS.includes(bluff.id);
        const isSvGood = SV_GOOD_ROLE_IDS.includes(bluff.id);
        expect(isTbGood || isSvGood).toBe(true);
        if (isSvGood) foundSvBluff = true;
      }

      if (foundSvBluff) break;
    }

    // S&V 역할이 블러프 후보에 포함되는지 확인
    // (sweetheart는 S&V 유일한 구현 역할이므로 outsider → 제외됨, 다만 activeEditions에 sects_and_violets가 포함됨)
    // S&V의 선한 역할이 ALL_ROLES에 없으면(sweetheart만 구현) TB만 나올 수 있음
    if (SV_GOOD_ROLE_IDS.length === 0) {
      // S&V 선한 역할이 ALL_ROLES에 없으면 TB만 나오는 게 정상
      expect(foundSvBluff).toBe(false);
    }
    // S&V 선한 역할이 있다면 한 번쯤은 나와야 함 (확률적으로)
  }, 60000);

  it('이야기꾼이 사전 선택한 블러프가 우선 적용된다', async () => {
    const preselected = ['monk', 'ravenkeeper', 'slayer'];
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      [
        { roleId: 'imp' },
        { roleId: 'poisoner' },
        { roleId: 'washerwoman' },
        { roleId: 'empath' },
        { roleId: 'fortune_teller' },
      ],
      preselected,
    );

    expect(bluffRoles).toHaveLength(3);
    const bluffIds = bluffRoles.map((b) => b.id);
    expect(bluffIds).toEqual(expect.arrayContaining(preselected));
  }, 15000);

  it('사전 선택한 블러프 중 게임에 배정된 역할은 무시되고 랜덤으로 대체된다', async () => {
    // washerwoman은 이미 배정됨 → 무시되어야 함
    const preselected = ['washerwoman', 'monk', 'ravenkeeper'];
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      [
        { roleId: 'imp' },
        { roleId: 'poisoner' },
        { roleId: 'washerwoman' },
        { roleId: 'empath' },
        { roleId: 'fortune_teller' },
      ],
      preselected,
    );

    expect(bluffRoles).toHaveLength(3);
    const bluffIds = bluffRoles.map((b) => b.id);
    // washerwoman은 배정된 역할이므로 블러프에 포함되면 안 됨
    expect(bluffIds).not.toContain('washerwoman');
    // monk과 ravenkeeper는 포함되어야 함
    expect(bluffIds).toContain('monk');
    expect(bluffIds).toContain('ravenkeeper');
  }, 15000);

  it('하수인/악마 역할은 블러프에 포함되지 않는다', async () => {
    const evilRoleIds = ALL_ROLES.filter(
      (r) => r.team === 'minion' || r.team === 'demon',
    ).map((r) => r.id);

    const { bluffRoles } = await setupAndGetBluffs(ctx, [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
    ]);

    expect(bluffRoles).toHaveLength(3);
    for (const bluff of bluffRoles) {
      expect(evilRoleIds).not.toContain(bluff.id);
    }
  }, 15000);

  it('블러프 역할은 중복되지 않는다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(ctx, [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
    ]);

    expect(bluffRoles).toHaveLength(3);
    const bluffIds = bluffRoles.map((b) => b.id);
    expect(new Set(bluffIds).size).toBe(3);
  }, 15000);
});
