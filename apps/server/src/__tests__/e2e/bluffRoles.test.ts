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
  setupOptions?: {
    setupEditionId: string;
    additionalRoleIds: string[];
    excludedRoleIds: string[];
    settingsBeforeStart?: {
      setupEditionId: string;
      additionalRoleIds: string[];
      excludedRoleIds: string[];
    };
    lateAssignmentIndexes?: number[];
  },
): Promise<{
  bluffRoles: { id: string; name: string }[];
  playerIds: string[];
}> {
  const playerCount = roleAssignments.length;
  const initialSetupOptions = setupOptions && {
    setupEditionId: setupOptions.setupEditionId,
    additionalRoleIds: setupOptions.additionalRoleIds,
    excludedRoleIds: setupOptions.excludedRoleIds,
  };

  // 1. 게임 생성
  const statePromise = waitForEvent(ctx.storyteller as Socket, 'game:state');
  await new Promise<void>((resolve) => {
    ctx.storyteller.emit('game:create', (res) => {
      if (res.success) resolve();
    });
  });
  await statePromise;

  if (initialSetupOptions) {
    const settingsStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    ctx.storyteller.emit('game:setSettings', initialSetupOptions);
    await settingsStatePromise;
  }

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
    if (i === demonIndex || setupOptions?.lateAssignmentIndexes?.includes(i)) {
      continue;
    }
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

  for (const index of setupOptions?.lateAssignmentIndexes ?? []) {
    const assignStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    ctx.storyteller.emit('game:assignRole', {
      playerId: playerIds[index],
      roleId: roleAssignments[index].roleId,
      drunkAs: roleAssignments[index].drunkAs,
    });
    await assignStatePromise;
  }

  if (setupOptions?.settingsBeforeStart) {
    const settingsStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    ctx.storyteller.emit('game:setSettings', setupOptions.settingsBeforeStart);
    await settingsStatePromise;
  }

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

  it('타에디션 역할 배정만으로는 블러프 후보에 추가되지 않는다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(ctx, [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'sweetheart' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
    ]);

    expect(bluffRoles).toHaveLength(3);
    for (const bluff of bluffRoles) {
      expect(TB_GOOD_ROLE_IDS).toContain(bluff.id);
    }
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

  it('활성 설정에서 제외된 역할은 사전 선택한 블러프여도 랜덤 역할로 대체된다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      [
        { roleId: 'imp' },
        { roleId: 'poisoner' },
        { roleId: 'washerwoman' },
        { roleId: 'empath' },
        { roleId: 'fortune_teller' },
      ],
      ['librarian', 'monk', 'ravenkeeper'],
      {
        setupEditionId: 'trouble_brewing',
        additionalRoleIds: ['sweetheart'],
        excludedRoleIds: ['librarian'],
      },
    );

    const bluffIds = bluffRoles.map((role) => role.id);
    expect(bluffIds).toHaveLength(3);
    expect(bluffIds).not.toContain('librarian');
    expect(bluffIds).toEqual(expect.arrayContaining(['monk', 'ravenkeeper']));
    for (const bluffId of bluffIds) {
      expect([...TB_GOOD_ROLE_IDS, 'sweetheart']).toContain(bluffId);
    }
  }, 15000);

  it('활성 설정에 추가된 미배정 역할은 사전 선택한 블러프에 포함된다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      [
        { roleId: 'imp' },
        { roleId: 'poisoner' },
        { roleId: 'washerwoman' },
        { roleId: 'empath' },
        { roleId: 'fortune_teller' },
      ],
      ['sweetheart', 'monk', 'ravenkeeper'],
      {
        setupEditionId: 'trouble_brewing',
        additionalRoleIds: ['sweetheart'],
        excludedRoleIds: ['librarian'],
      },
    );

    expect(bluffRoles.map((role) => role.id)).toEqual(
      expect.arrayContaining(['sweetheart', 'monk', 'ravenkeeper']),
    );
  }, 15000);

  it('사전 선택한 주정뱅이는 블러프에서 제외된다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      [
        { roleId: 'imp' },
        { roleId: 'poisoner' },
        { roleId: 'washerwoman' },
        { roleId: 'empath' },
        { roleId: 'fortune_teller' },
      ],
      ['drunk', 'monk', 'ravenkeeper'],
    );

    expect(bluffRoles.map((role) => role.id)).not.toContain('drunk');
  }, 15000);

  it('사전 선택한 미치광이는 블러프에서 제외된다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      [
        { roleId: 'zombuul' },
        { roleId: 'godfather' },
        { roleId: 'grandmother' },
        { roleId: 'sailor' },
        { roleId: 'chambermaid' },
      ],
      ['lunatic', 'innkeeper', 'gambler'],
      {
        setupEditionId: 'bad_moon_rising',
        additionalRoleIds: [],
        excludedRoleIds: [],
      },
    );

    expect(bluffRoles.map((role) => role.id)).not.toContain('lunatic');
  }, 15000);

  it('게임 시작 시 설정 변경으로 제외된 캐시 블러프를 대체한다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      [
        { roleId: 'imp' },
        { roleId: 'poisoner' },
        { roleId: 'washerwoman' },
        { roleId: 'empath' },
        { roleId: 'fortune_teller' },
      ],
      ['librarian', 'monk', 'ravenkeeper'],
      {
        setupEditionId: 'trouble_brewing',
        additionalRoleIds: [],
        excludedRoleIds: [],
        settingsBeforeStart: {
          setupEditionId: 'trouble_brewing',
          additionalRoleIds: [],
          excludedRoleIds: ['librarian'],
        },
      },
    );

    expect(bluffRoles.map((role) => role.id)).not.toContain('librarian');
  }, 15000);

  it('게임 시작 시 나중에 배정된 캐시 블러프를 대체한다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(
      ctx,
      [
        { roleId: 'imp' },
        { roleId: 'poisoner' },
        { roleId: 'monk' },
        { roleId: 'empath' },
        { roleId: 'fortune_teller' },
      ],
      ['monk', 'ravenkeeper', 'slayer'],
      {
        setupEditionId: 'trouble_brewing',
        additionalRoleIds: [],
        excludedRoleIds: [],
        lateAssignmentIndexes: [2],
      },
    );

    expect(bluffRoles.map((role) => role.id)).not.toContain('monk');
  }, 15000);

  it('게임 시작 전에 이야기꾼 상태에 보인 블러프와 악마에게 전달된 블러프가 동일하다', async () => {
    const preselected = ['monk', 'ravenkeeper', 'slayer'];
    const playerCount = 5;

    const createStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    await new Promise<void>((resolve) => {
      ctx.storyteller.emit('game:create', (res) => {
        if (res.success) resolve();
      });
    });
    await createStatePromise;

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
        playerSocket.emit(
          'game:join',
          { playerName: `Player${i + 1}` },
          resolve,
        );
      });
      if (joinResult.playerId) playerIds.push(joinResult.playerId);
      await joinStatePromise;
    }

    const assignments = [
      'imp',
      'poisoner',
      'washerwoman',
      'empath',
      'fortune_teller',
    ];
    for (let i = 1; i < playerCount; i++) {
      const assignStatePromise = waitForEvent(
        ctx.storyteller as Socket,
        'game:state',
      );
      ctx.storyteller.emit('game:assignRole', {
        playerId: playerIds[i],
        roleId: assignments[i],
      });
      await assignStatePromise;
    }

    const demonAssignStatePromise = waitForEvent<{
      bluffRoles?: { id: string; name: string }[];
    }>(ctx.storyteller as Socket, 'game:state');
    ctx.storyteller.emit('game:assignRole', {
      playerId: playerIds[0],
      roleId: assignments[0],
      bluffRoleIds: preselected,
    });
    const beforeStartState = await demonAssignStatePromise;
    const storytellerBluffIds =
      beforeStartState.bluffRoles?.map((role) => role.id) ?? [];

    const demonInfoPromise = waitForEvent<{
      bluffRoles?: { id: string; name: string }[];
    }>(ctx.players[0] as Socket, 'evil:info');
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
    expect(storytellerBluffIds).toHaveLength(3);
    expect(demonInfo.bluffRoles?.map((role) => role.id)).toEqual(
      storytellerBluffIds,
    );
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

  it('랜덤 블러프에는 주정뱅이가 포함되지 않는다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(ctx, [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'washerwoman' },
      { roleId: 'librarian' },
      { roleId: 'investigator' },
      { roleId: 'chef' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'undertaker' },
      { roleId: 'monk' },
      { roleId: 'ravenkeeper' },
      { roleId: 'virgin' },
      { roleId: 'slayer' },
      { roleId: 'soldier' },
      { roleId: 'mayor' },
      { roleId: 'saint' },
    ]);

    expect(bluffRoles.map((b) => b.id)).not.toContain('drunk');
  }, 15000);

  it('랜덤 블러프에는 미치광이가 포함되지 않는다', async () => {
    const { bluffRoles } = await setupAndGetBluffs(ctx, [
      { roleId: 'zombuul' },
      { roleId: 'godfather' },
      { roleId: 'grandmother' },
      { roleId: 'sailor' },
      { roleId: 'chambermaid' },
      { roleId: 'exorcist' },
      { roleId: 'innkeeper' },
      { roleId: 'gambler' },
      { roleId: 'gossip' },
      { roleId: 'courtier' },
      { roleId: 'professor' },
      { roleId: 'minstrel' },
      { roleId: 'tea_lady' },
      { roleId: 'pacifist' },
      { roleId: 'fool' },
      { roleId: 'moonchild' },
    ]);

    expect(bluffRoles.map((b) => b.id)).not.toContain('lunatic');
  }, 15000);

  it('플레이어가 발생시킨 상태 갱신 후에도 이야기꾼 상태에는 블러프가 유지된다', async () => {
    const preselected = ['monk', 'ravenkeeper', 'slayer'];
    const { playerIds } = await setupAndGetBluffs(
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

    ctx.app.game.setPhase('day');
    ctx.app.game.setDaySubPhase('nomination');

    const statePromise = waitForEvent<{ bluffRoles?: { id: string }[] }>(
      ctx.storyteller as Socket,
      'game:state',
    );
    ctx.players[2].emit('nominate:request', { nomineeId: playerIds[3] }, () => {
      // callback intentionally ignored; this event still triggers storyteller state.
    });

    const state = await statePromise;
    expect(state.bluffRoles?.map((r) => r.id)).toEqual(
      expect.arrayContaining(preselected),
    );
  }, 15000);
});
