import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  advanceToDay,
  setupGameWithRoles,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

describe('E2E: 악 진영 정보', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('게임 시작 시 악마에게 하수인 이름 + 블러프 역할을 전달한다', async () => {
    // p0=imp, p1=poisoner, p2~p4=마을
    const roles = [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
    ];

    // evil:info 리스너를 참가 전에는 등록 불가 → setupGameWithRoles 내부에서 start 시 emit됨
    // 그래서 플레이어 소켓 연결 후, start 전에 리스너를 등록해야 함
    // setupGameWithRoles를 직접 풀어서 구현

    const statePromise = waitForEvent(ctx.storyteller as Socket, 'game:state');
    await new Promise<void>((resolve) => {
      ctx.storyteller.emit('game:create', (res) => {
        if (res.success) resolve();
      });
    });
    await statePromise;

    const playerIds: string[] = [];
    for (let i = 0; i < 5; i++) {
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

    // 역할 배정 (마지막 배정 시 evil:info 자동 전송됨)
    for (let i = 0; i < 4; i++) {
      const sp = waitForEvent(ctx.storyteller as Socket, 'game:state');
      ctx.storyteller.emit('game:assignRole', {
        playerId: playerIds[i],
        roleId: roles[i].roleId,
      });
      await sp;
    }

    // evil:info 리스너를 마지막 역할 배정 전에 등록
    const demonInfoPromise = waitForEvent<{
      minionNames?: string[];
      bluffRoles?: { id: string; name: string }[];
    }>(ctx.players[0] as Socket, 'evil:info');

    const minionInfoPromise = waitForEvent<{
      demonName?: string;
      otherMinionNames?: string[];
    }>(ctx.players[1] as Socket, 'evil:info');

    // 마지막 역할 배정 → evil:info 전송 트리거
    const lastSp = waitForEvent(ctx.storyteller as Socket, 'game:state');
    ctx.storyteller.emit('game:assignRole', {
      playerId: playerIds[4],
      roleId: roles[4].roleId,
    });
    await lastSp;

    const demonInfo = await demonInfoPromise;
    expect(demonInfo.minionNames).toContain('Player2');
    expect(demonInfo.bluffRoles).toHaveLength(3);

    const minionInfo = await minionInfoPromise;
    expect(minionInfo.demonName).toBe('Player1');
  }, 15000);
});

describe('E2E: 처단자', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('처단자가 악마를 선택하면 즉사 + 선 진영 승리', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'slayer' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    await advanceToDay(ctx);

    // game:end 리스너 등록
    const endPromise = waitForEvent<{
      winningTeam: string;
      cause?: string;
    }>(ctx.players[0] as Socket, 'game:end');

    // 처단자(p0)가 임프(p4) 대상으로 사용
    const slayerRes = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[0].emit('slayer:use', { targetId: playerIds[4] }, resolve);
    });
    expect(slayerRes.success).toBe(true);

    const endResult = await endPromise;
    expect(endResult.winningTeam).toBe('good');
    expect(endResult.cause).toBe('slayer');
  }, 15000);

  it('처단자가 마을 주민을 선택하면 효과 없음', async () => {
    await setupGameWithRoles(ctx, [
      { roleId: 'slayer' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    await advanceToDay(ctx);

    const noEffectPromise = waitForEvent<{
      slayerName: string;
      targetName: string;
    }>(ctx.players[0] as Socket, 'slayer:noEffect');

    const { playerIds } = {
      playerIds: ctx.app.game.getState().players.map((p) => p.id),
    };
    await new Promise<void>((resolve) => {
      ctx.players[0].emit('slayer:use', { targetId: playerIds[1] }, (res) => {
        expect(res.success).toBe(true);
        resolve();
      });
    });

    const noEffect = await noEffectPromise;
    expect(noEffect.slayerName).toBe('Player1');
    expect(noEffect.targetName).toBe('Player2');
  }, 15000);
});

describe('E2E: 성결자', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('마을주민이 성결자를 지명하면 지명자가 처형된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' }, // p0: 마을주민 (지명자)
      { roleId: 'virgin' }, // p1: 성결자 (지명 대상)
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    await advanceToDay(ctx);

    // virgin:triggered 리스너 등록
    const virginPromise = waitForEvent<{
      virginName: string;
      nominatorName: string;
      nominatorId: string;
    }>(ctx.players[0] as Socket, 'virgin:triggered');

    // 이야기꾼이 지명
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[0],
      nomineeId: playerIds[1],
    });

    const virginResult = await virginPromise;
    expect(virginResult.nominatorId).toBe(playerIds[0]);
    expect(virginResult.nominatorName).toBe('Player1');

    // 지명자가 사망했는지 확인
    const nominator = ctx.app.game.getPlayer(playerIds[0]);
    expect(nominator?.isAlive).toBe(false);
  }, 15000);
});

describe('E2E: 성자', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('성자가 처형되면 악 진영이 승리한다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'saint' }, // p0
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    await advanceToDay(ctx);

    // 지명 + 투표 → 과반수 유죄
    const voteStartPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[1],
      nomineeId: playerIds[0], // 성자를 지명
    });
    await voteStartPromise;

    // 3명 투표 (과반수)
    for (let i = 1; i <= 3; i++) {
      await new Promise<void>((resolve) => {
        ctx.players[i].emit('vote:cast', () => resolve());
      });
    }

    ctx.storyteller.emit('vote:close');
    await waitForEvent(ctx.players[0] as Socket, 'vote:result');

    // 밤 전환 시 처형 → 성자 처형 → 악 승리
    const endPromise = waitForEvent<{
      winningTeam: string;
    }>(ctx.players[1] as Socket, 'game:end');
    ctx.storyteller.emit('game:setPhase', 'night');

    const endResult = await endPromise;
    expect(endResult.winningTeam).toBe('evil');
  }, 15000);
});

describe('E2E: 임프 자살 → 하수인 승계', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('밤에 임프 사망 시 탕녀가 있으면 탕녀가 악마로 승계된다', async () => {
    // 6인: 탕녀 포함. kill 후 5인 생존 → 탕녀 승계 조건 충족
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'scarlet_woman' }, // p2: 탕녀
      { roleId: 'poisoner' },
      { roleId: 'imp' }, // p4: 임프
      { roleId: 'chef' },
    ]);

    // game:end가 나오지 않는 것을 확인 (탕녀 승계)
    let gameEnded = false;
    ctx.players[0].on('game:end', () => {
      gameEnded = true;
    });

    // 밤에 임프 사살
    ctx.storyteller.emit('game:kill', playerIds[4]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');
    await new Promise((r) => setTimeout(r, 200));

    expect(gameEnded).toBe(false);

    // 탕녀가 임프로 승계됨 (checkWinCondition 내부에서 처리)
    const scarletWoman = ctx.app.game.getPlayer(playerIds[2]);
    expect(scarletWoman?.role?.id).toBe('imp');
  }, 15000);
});

describe('E2E: 탕녀 승계', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('악마 사망 + 5인 이상 생존 → 탕녀가 악마가 되어 게임 계속', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'scarlet_woman' }, // p2: 탕녀
      { roleId: 'poisoner' },
      { roleId: 'imp' }, // p4: 임프
      { roleId: 'chef' },
    ]);

    // 악마 사살 — game:end가 나오지 않아야 함 (탕녀 승계)
    let gameEnded = false;
    ctx.players[0].on('game:end', () => {
      gameEnded = true;
    });

    ctx.storyteller.emit('game:kill', playerIds[4]);
    // 약간 대기하여 이벤트 처리 시간 제공
    await new Promise((r) => setTimeout(r, 200));

    expect(gameEnded).toBe(false);

    // 탕녀가 임프로 승계됨
    const scarletWoman = ctx.app.game.getPlayer(playerIds[2]);
    expect(scarletWoman?.role?.id).toBe('imp');
  }, 15000);
});

describe('E2E: 집사 투표 제한', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('집사는 주인이 투표하지 않으면 투표할 수 없다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'butler' }, // p0: 집사
      { roleId: 'empath' }, // p1: 주인으로 지정할 플레이어
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    // 집사의 주인 설정
    ctx.app.game.setButlerMaster(playerIds[0], playerIds[1]);

    await advanceToDay(ctx);

    // 지명
    const voteStartPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[2],
      nomineeId: playerIds[3],
    });
    await voteStartPromise;

    // 집사(p0)가 투표 시도 → 실패
    const voteRes = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[0].emit('vote:cast', resolve);
    });
    expect(voteRes.success).toBe(false);
  }, 15000);

  it('주인이 투표한 후 집사도 투표할 수 있다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'butler' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    ctx.app.game.setButlerMaster(playerIds[0], playerIds[1]);

    await advanceToDay(ctx);

    const voteStartPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[2],
      nomineeId: playerIds[3],
    });
    await voteStartPromise;

    // 주인(p1) 먼저 투표
    await new Promise<void>((resolve) => {
      ctx.players[1].emit('vote:cast', () => resolve());
    });

    // 집사(p0) 투표 → 성공
    const voteRes = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[0].emit('vote:cast', resolve);
    });
    expect(voteRes.success).toBe(true);
  }, 15000);
});

describe('E2E: 시장 특수 승리', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('3인 생존 + 처형 없음 → 선 진영 승리', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'mayor' }, // p0
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    // 2명 사살 → 3명 생존
    ctx.storyteller.emit('game:kill', playerIds[1]);
    ctx.storyteller.emit('game:kill', playerIds[2]);

    // game:end 리스너 등록
    const endPromise = waitForEvent<{
      winningTeam: string;
    }>(ctx.players[0] as Socket, 'game:end');

    // 승리 조건은 checkWinCondition에서 체크됨
    // game:kill 후 자동으로 체크되므로 이벤트 대기
    const endResult = await endPromise;
    expect(endResult.winningTeam).toBe('good');
  }, 15000);
});
