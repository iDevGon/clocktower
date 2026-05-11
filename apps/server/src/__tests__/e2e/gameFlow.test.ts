import type { Socket } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  advanceToDay,
  setupFullGame,
  setupGameWithRoles,
  setupTestServer,
  type TestContext,
  waitForEvent,
} from './helpers.js';

describe('E2E: 게임 라이프사이클', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('게임 생성 → 플레이어 참가 → 역할 배분 → 시작', async () => {
    const { playerIds } = await setupFullGame(ctx);

    expect(playerIds).toHaveLength(5);

    const serverState = ctx.app.game.getState();
    expect(serverState.started).toBe(true);
    expect(serverState.phase).toBe('night');
    expect(serverState.day).toBe(1);
    expect(serverState.players.every((p) => p.role !== undefined)).toBe(true);
  }, 15000);

  it('플레이어가 role:assign 이벤트를 수신한다', async () => {
    // 게임 생성 — 리스너 먼저 등록
    const statePromise = waitForEvent(ctx.storyteller as Socket, 'game:state');
    ctx.storyteller.emit('game:create', (res) => {
      expect(res.success).toBe(true);
    });
    await statePromise;

    // 플레이어 참가 — 리스너 먼저 등록
    const playerSocket = await ctx.connectPlayer();
    ctx.players.push(playerSocket);
    const joinStatePromise = waitForEvent(
      ctx.storyteller as Socket,
      'game:state',
    );
    const joinRes = await new Promise<{
      success: boolean;
      playerId?: string;
    }>((resolve) => {
      playerSocket.emit('game:join', { playerName: 'TestPlayer' }, resolve);
    });
    await joinStatePromise;

    const playerId = joinRes.playerId;
    expect(playerId).toBeDefined();

    // role:assign 리스너를 먼저 등록
    const rolePromise = waitForEvent<{
      roleId: string;
      roleName: string;
    }>(playerSocket as Socket, 'role:assign');

    ctx.storyteller.emit('game:assignRole', {
      playerId: playerId ?? '',
      roleId: 'imp',
    });

    const roleData = await rolePromise;
    expect(roleData.roleId).toBe('imp');
    expect(roleData.roleName).toBe('임프');
  }, 10000);

  it('게임 재시작 시 플레이어가 유지된다', async () => {
    await setupFullGame(ctx);

    const restartRes = await new Promise<{
      success: boolean;
      gameId?: string;
    }>((resolve) => {
      ctx.storyteller.emit('game:restart', resolve);
    });

    expect(restartRes.success).toBe(true);
    expect(restartRes.gameId).toBeDefined();

    const state = ctx.app.game.getState();
    expect(state.players).toHaveLength(5);
    expect(state.started).toBe(false);
    expect(state.players.every((p) => p.role === undefined)).toBe(true);
  }, 15000);
});

describe('E2E: 페이즈 전환', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('밤 → 낮 → 서브페이즈 전환', async () => {
    await setupFullGame(ctx);

    // 밤 → 낮
    const dayPhasePromise = waitForEvent<string>(
      ctx.players[0] as Socket,
      'game:phase',
    );
    ctx.storyteller.emit('game:setPhase', 'day');
    const dayPhase = await dayPhasePromise;
    expect(dayPhase).toBe('day');

    const state = ctx.app.game.getState();
    expect(state.daySubPhase).toBe('whisper');
    expect(state.day).toBe(2);

    // 서브페이즈 전환
    const subPhasePromise = waitForEvent<string>(
      ctx.players[0] as Socket,
      'day:subPhase',
    );
    ctx.storyteller.emit('day:setSubPhase', 'discussion');
    const subPhase = await subPhasePromise;
    expect(subPhase).toBe('discussion');
  }, 15000);
});

describe('E2E: 투표 흐름', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('지명 → 투표 → 과반수 유죄', async () => {
    const { playerIds } = await setupFullGame(ctx);

    // 낮 전환
    const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    // 지명 서브페이즈
    const subPromise = waitForEvent(ctx.players[0] as Socket, 'day:subPhase');
    ctx.storyteller.emit('day:setSubPhase', 'nomination');
    await subPromise;

    // 지명
    const voteStartPromise = waitForEvent<{
      nominatorId: string;
      nomineeId: string;
    }>(ctx.players[0] as Socket, 'vote:start');
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[0],
      nomineeId: playerIds[1],
    });
    const voteStart = await voteStartPromise;
    expect(voteStart.nominatorId).toBe(playerIds[0]);
    expect(voteStart.nomineeId).toBe(playerIds[1]);

    // 3명 투표
    for (let i = 0; i < 3; i++) {
      await new Promise<void>((resolve) => {
        ctx.players[i].emit('vote:cast', (res) => {
          expect(res?.success).toBe(true);
          resolve();
        });
      });
    }

    // 투표 종료
    const resultPromise = waitForEvent<{
      guilty: boolean;
      nomineeId: string;
    }>(ctx.players[0] as Socket, 'vote:result');
    ctx.storyteller.emit('vote:close');
    const result = await resultPromise;
    expect(result.guilty).toBe(true);
    expect(result.nomineeId).toBe(playerIds[1]);
  }, 15000);

  it('플레이어가 직접 지명', async () => {
    const { playerIds } = await setupFullGame(ctx);

    const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    const subPromise = waitForEvent(ctx.players[0] as Socket, 'day:subPhase');
    ctx.storyteller.emit('day:setSubPhase', 'nomination');
    await subPromise;

    const voteStartPromise = waitForEvent<{
      nominatorId: string;
      nomineeId: string;
    }>(ctx.players[2] as Socket, 'vote:start');

    const nominateRes = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[0].emit(
        'nominate:request',
        { nomineeId: playerIds[1] },
        resolve,
      );
    });
    expect(nominateRes.success).toBe(true);

    const voteStart = await voteStartPromise;
    expect(voteStart.nominatorId).toBe(playerIds[0]);
  }, 15000);
});

describe('E2E: 밤 행동', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('밤 행동 → 이야기꾼 수신', async () => {
    const { playerIds } = await setupFullGame(ctx);

    const state = ctx.app.game.getState();
    const poisoner = state.players.find((p) => p.role?.id === 'poisoner');
    if (!poisoner) return;

    const poisonerIdx = playerIds.indexOf(poisoner.id);
    if (poisonerIdx === -1) return;

    // game:start 시 이미 night:activeRole(null)이 나갔으므로,
    // 기존 이벤트를 소비하기 위해 짧은 대기 후 리스너 등록
    await new Promise((r) => setTimeout(r, 50));

    // roleId가 'poisoner'인 이벤트만 기다림
    const activeRolePromise = new Promise<{ roleId: string | null }>(
      (resolve) => {
        const handler = (data: { roleId: string | null }) => {
          if (data.roleId === 'poisoner') {
            ctx.players[poisonerIdx].off('night:activeRole', handler);
            resolve(data);
          }
        };
        ctx.players[poisonerIdx].on('night:activeRole', handler);
      },
    );
    ctx.storyteller.emit('night:setActiveRole', 'poisoner');
    const activeRole = await activeRolePromise;
    expect(activeRole.roleId).toBe('poisoner');

    // 이야기꾼 수신 대기
    const actionPromise = waitForEvent<{
      playerId: string;
      roleId: string;
      targets: string[];
    }>(ctx.storyteller as Socket, 'night:actionReceived');

    const targetId = playerIds.find((id) => id !== poisoner.id);
    ctx.players[poisonerIdx].emit('night:action', {
      targets: [targetId ?? ''],
    });

    const action = await actionPromise;
    expect(action.playerId).toBe(poisoner.id);
    expect(action.roleId).toBe('poisoner');
  }, 15000);
});

describe('E2E: 밀담', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('플레이어 간 밀담 송수신', async () => {
    const { playerIds } = await setupFullGame(ctx);

    // 낮 전환
    const phasePromise = waitForEvent(ctx.players[0] as Socket, 'game:phase');
    ctx.storyteller.emit('game:setPhase', 'day');
    await phasePromise;

    // 리스너 먼저 등록
    const receivePromise = waitForEvent<{
      fromId: string;
      message: string;
    }>(ctx.players[1] as Socket, 'whisper:receive');

    ctx.players[0].emit('whisper:send', {
      participantIds: [playerIds[0], playerIds[1]],
      message: '안녕하세요',
    });

    const received = await receivePromise;
    expect(received.fromId).toBe(playerIds[0]);
    expect(received.message).toBe('안녕하세요');
  }, 15000);
});

describe('E2E: 승리 조건', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('악마 사망 → 선 진영 승리', async () => {
    await setupFullGame(ctx);

    const state = ctx.app.game.getState();
    const demon = state.players.find((p) => p.role?.team === 'demon');
    expect(demon).toBeDefined();

    // 리스너 먼저 등록
    const endPromise = waitForEvent<{
      winningTeam: string;
      reason: string;
    }>(ctx.players[0] as Socket, 'game:end');

    ctx.storyteller.emit('game:kill', demon?.id ?? '');

    const result = await endPromise;
    expect(result.winningTeam).toBe('good');
  }, 15000);
});

describe('E2E: 재접속', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('재접속 시 상태 복원', async () => {
    const { playerIds } = await setupFullGame(ctx);

    const state = ctx.app.game.getState();
    const player = state.players[0];

    const newSocket = await ctx.connectPlayer();
    const rejoinRes = await new Promise<{
      success: boolean;
      playerName?: string;
      roleId?: string;
      phase?: string;
    }>((resolve) => {
      newSocket.emit('game:rejoin', { playerId: playerIds[0] }, resolve);
    });

    expect(rejoinRes.success).toBe(true);
    expect(rejoinRes.playerName).toBe(player.name);
    expect(rejoinRes.roleId).toBeDefined();
    expect(rejoinRes.phase).toBe('night');
  }, 15000);
});

describe('E2E: rejoin 상태 복원', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('rejoin 시 현재 지목/투표 정보가 포함된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    await advanceToDay(ctx, 'nomination');

    // 지명
    const voteStartPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[0],
      nomineeId: playerIds[1],
    });
    await voteStartPromise;

    // 플레이어 소켓 연결을 끊고 새로 연결
    const newSocket = await ctx.connectPlayer();
    const rejoinRes = await new Promise<{
      success: boolean;
      nomination?: {
        nominatorId: string;
        nomineeId: string;
        nominatorName: string;
        nomineeName: string;
      };
    }>((resolve) => {
      newSocket.emit('game:rejoin', { playerId: playerIds[0] }, resolve);
    });

    expect(rejoinRes.success).toBe(true);
    expect(rejoinRes.nomination).toBeDefined();
    expect(rejoinRes.nomination?.nominatorId).toBe(playerIds[0]);
    expect(rejoinRes.nomination?.nomineeId).toBe(playerIds[1]);
    expect(rejoinRes.nomination?.nominatorName).toBe('Player1');
    expect(rejoinRes.nomination?.nomineeName).toBe('Player2');
  }, 15000);

  it('rejoin 시 executionCandidate 정보가 포함된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    await advanceToDay(ctx, 'nomination');

    // 지명
    const voteStartPromise = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[0],
      nomineeId: playerIds[1],
    });
    await voteStartPromise;

    // 투표 진행으로 전환
    ctx.storyteller.emit('vote:proceedToVote');
    await waitForEvent(ctx.players[0] as Socket, 'vote:proceedToVote');

    // 3명 투표 (과반수)
    for (let i = 0; i < 3; i++) {
      await new Promise<void>((resolve) => {
        ctx.players[i].emit('vote:cast', () => resolve());
      });
    }

    // 투표 종료 → 처형 대상 생성
    const resultPromise = waitForEvent(ctx.players[0] as Socket, 'vote:result');
    ctx.storyteller.emit('vote:close');
    await resultPromise;

    // 플레이어 재연결
    const newSocket = await ctx.connectPlayer();
    const rejoinRes = await new Promise<{
      success: boolean;
      executionCandidate?: {
        playerId: string;
        playerName: string;
        guiltyVotes: number;
      };
    }>((resolve) => {
      newSocket.emit('game:rejoin', { playerId: playerIds[2] }, resolve);
    });

    expect(rejoinRes.success).toBe(true);
    expect(rejoinRes.executionCandidate).toBeDefined();
    expect(rejoinRes.executionCandidate?.playerId).toBe(playerIds[1]);
    expect(rejoinRes.executionCandidate?.playerName).toBe('Player2');
    expect(rejoinRes.executionCandidate?.guiltyVotes).toBeGreaterThanOrEqual(3);
  }, 15000);

  it('rejoin 시 하수인의 악마와 다른 하수인 정보가 포함된다', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'imp' },
      { roleId: 'poisoner' },
      { roleId: 'spy' },
      { roleId: 'washerwoman' },
      { roleId: 'librarian' },
      { roleId: 'investigator' },
      { roleId: 'chef' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'undertaker' },
    ]);

    const newSocket = await ctx.connectPlayer();
    const rejoinRes = await new Promise<{
      success: boolean;
      evilInfo?: {
        demonName?: string;
        otherMinionNames?: string[];
      } | null;
    }>((resolve) => {
      newSocket.emit('game:rejoin', { playerId: playerIds[1] }, resolve);
    });

    expect(rejoinRes.success).toBe(true);
    expect(rejoinRes.evilInfo?.demonName).toBe('Player1');
    expect(rejoinRes.evilInfo?.otherMinionNames).toContain('Player3');
  }, 15000);
});

describe('E2E: 유령 투표 제한', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('사망한 플레이어는 한 게임에서 한 번만 투표 가능', async () => {
    const { playerIds } = await setupGameWithRoles(ctx, [
      { roleId: 'washerwoman' },
      { roleId: 'empath' },
      { roleId: 'fortune_teller' },
      { roleId: 'poisoner' },
      { roleId: 'imp' },
    ]);

    // 플레이어 0 사망 처리
    ctx.storyteller.emit('game:kill', playerIds[0]);
    await waitForEvent(ctx.storyteller as Socket, 'game:state');

    await advanceToDay(ctx, 'nomination');

    // 첫 번째 지목 + 투표
    const voteStartPromise1 = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[1],
      nomineeId: playerIds[2],
    });
    await voteStartPromise1;

    // 사망 플레이어(p0) 투표 → 성공
    const voteRes1 = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[0].emit('vote:cast', resolve);
    });
    expect(voteRes1.success).toBe(true);

    // 투표 종료
    const resultPromise1 = waitForEvent(
      ctx.players[1] as Socket,
      'vote:result',
    );
    ctx.storyteller.emit('vote:close');
    await resultPromise1;

    // 두 번째 지목 + 투표
    const voteStartPromise2 = waitForEvent(
      ctx.players[0] as Socket,
      'vote:start',
    );
    ctx.storyteller.emit('vote:nominate', {
      nominatorId: playerIds[3],
      nomineeId: playerIds[4],
    });
    await voteStartPromise2;

    // 사망 플레이어(p0) 두 번째 투표 → 실패
    const voteRes2 = await new Promise<{
      success: boolean;
      error?: string;
    }>((resolve) => {
      ctx.players[0].emit('vote:cast', resolve);
    });
    expect(voteRes2.success).toBe(false);
  }, 15000);
});

describe('E2E: 블러프 직업 선택', () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await setupTestServer();
  }, 10000);

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('이야기꾼이 블러프를 사전 선택할 수 있다', async () => {
    // 게임 생성
    const statePromise = waitForEvent(ctx.storyteller as Socket, 'game:state');
    await new Promise<void>((resolve) => {
      ctx.storyteller.emit('game:create', (res) => {
        if (res.success) resolve();
      });
    });
    await statePromise;

    // 플레이어 5명 참가
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

    // 블러프 역할 사전 선택 (5인 게임에 포함되지 않을 역할 선택)
    const bluffRoleIds = ['monk', 'ravenkeeper', 'mayor'];

    // game:state 리스너를 먼저 등록
    const storyStatePromise = waitForEvent<{
      bluffRoles?: { id: string; name: string }[];
    }>(ctx.storyteller as Socket, 'game:state');

    await new Promise<void>((resolve, reject) => {
      ctx.storyteller.emit('game:distributeRoles', { bluffRoleIds }, (res) => {
        if (res.success) resolve();
        else reject(new Error(res.error));
      });
    });

    const storyState = await storyStatePromise;

    // 이야기꾼에게 전달된 bluffRoles 확인
    expect(storyState.bluffRoles).toBeDefined();
    expect(storyState.bluffRoles).toHaveLength(3);

    const bluffIds = storyState.bluffRoles?.map((r) => r.id) ?? [];
    expect(bluffIds).toContain('monk');
    expect(bluffIds).toContain('ravenkeeper');
    expect(bluffIds).toContain('mayor');
  }, 15000);
});
