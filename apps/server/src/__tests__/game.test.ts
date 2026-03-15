import type { Player } from '@clocktower/shared/logic';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../game.js';

let uuidCounter = 0;
vi.mock('node:crypto', () => ({
  randomUUID: () =>
    `${String(++uuidCounter).padStart(8, '0')}-0000-0000-0000-000000000000`,
}));

function createTestGame(playerCount = 5) {
  const gm = new GameManager();
  gm.create();
  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    const p = gm.addPlayer(`Player${i + 1}`);
    if (p) players.push(p);
  }
  return { gm, players };
}

function createStartedGame() {
  const { gm, players } = createTestGame(5);
  gm.assignRole(players[0].id, 'washerwoman');
  gm.assignRole(players[1].id, 'empath');
  gm.assignRole(players[2].id, 'fortune_teller');
  gm.assignRole(players[3].id, 'poisoner');
  gm.assignRole(players[4].id, 'imp');
  gm.start();
  return { gm, players };
}

describe('GameManager', () => {
  beforeEach(() => {
    uuidCounter = 0;
  });

  describe('create', () => {
    it('게임 ID를 생성한다', () => {
      const gm = new GameManager();
      const id = gm.create();
      expect(id).toBeDefined();
      expect(id.length).toBe(8);
    });
  });

  describe('플레이어 관리', () => {
    it('플레이어를 추가할 수 있다', () => {
      const gm = new GameManager();
      gm.create();
      const player = gm.addPlayer('Alice');
      expect(player).not.toBeNull();
      expect(player?.name).toBe('Alice');
      expect(player?.isAlive).toBe(true);
    });

    it('게임 시작 후에는 플레이어를 추가할 수 없다', () => {
      const { gm } = createStartedGame();
      expect(gm.addPlayer('Late')).toBeNull();
    });

    it('플레이어를 제거할 수 있다', () => {
      const gm = new GameManager();
      gm.create();
      const player = gm.addPlayer('Alice');
      expect(player).not.toBeNull();
      expect(gm.removePlayer(player?.id ?? '')).toBe(true);
      expect(gm.getPlayer(player?.id ?? '')).toBeUndefined();
    });

    it('존재하지 않는 플레이어 제거 시 false 반환', () => {
      const gm = new GameManager();
      gm.create();
      expect(gm.removePlayer('nonexistent')).toBe(false);
    });

    it('getPlayer로 플레이어를 조회할 수 있다', () => {
      const gm = new GameManager();
      gm.create();
      const player = gm.addPlayer('Alice');
      expect(player).not.toBeNull();
      expect(gm.getPlayer(player?.id ?? '')).toBeDefined();
      expect(gm.getPlayer(player?.id ?? '')?.name).toBe('Alice');
    });
  });

  describe('게임 시작', () => {
    it('5인 미만이면 시작할 수 없다', () => {
      const { gm } = createTestGame(4);
      const result = gm.start();
      expect(result.success).toBe(false);
    });

    it('역할 미배정 시 시작할 수 없다', () => {
      const { gm } = createTestGame(5);
      const result = gm.start();
      expect(result.success).toBe(false);
    });

    it('조건 충족 시 시작할 수 있다', () => {
      const { gm } = createStartedGame();
      const state = gm.getState();
      expect(state.started).toBe(true);
      expect(state.phase).toBe('night');
      expect(state.day).toBe(1);
    });

    it('이미 시작된 게임은 다시 시작할 수 없다', () => {
      const { gm } = createStartedGame();
      const result = gm.start();
      expect(result.success).toBe(false);
    });
  });

  describe('reset / restart', () => {
    it('reset은 모든 상태를 초기화한다', () => {
      const { gm } = createStartedGame();
      gm.reset();
      const state = gm.getState();
      expect(state.id).toBe('');
      expect(state.players).toHaveLength(0);
      expect(state.started).toBe(false);
    });

    it('restart는 플레이어를 유지하고 게임만 초기화한다', () => {
      const { gm } = createStartedGame();
      const newId = gm.restart();
      const state = gm.getState();
      expect(newId).toBeDefined();
      expect(state.players).toHaveLength(5);
      expect(state.started).toBe(false);
      expect(state.phase).toBe('setup');
      expect(state.players.every((p) => p.role === undefined)).toBe(true);
      expect(state.players.every((p) => p.isAlive)).toBe(true);
    });
  });

  describe('페이즈 전환', () => {
    it('night 전환 시 중독/보호 상태가 제거된다', () => {
      const { gm, players } = createStartedGame();
      gm.setPlayerStatuses(players[0].id, ['poisoned', 'protected']);
      gm.setPhase('night');
      const p = gm.getPlayer(players[0].id);
      expect(p?.statuses).not.toContain('poisoned');
      expect(p?.statuses).not.toContain('protected');
    });

    it('night 전환 시 drunk 상태는 유지된다', () => {
      const { gm, players } = createStartedGame();
      gm.setPlayerStatuses(players[0].id, ['drunk', 'poisoned']);
      gm.setPhase('night');
      const p = gm.getPlayer(players[0].id);
      expect(p?.statuses).toContain('drunk');
      expect(p?.statuses).not.toContain('poisoned');
    });

    it('day 전환 시 day 카운트가 증가한다', () => {
      const { gm } = createStartedGame();
      expect(gm.getState().day).toBe(1);
      gm.setPhase('day');
      expect(gm.getState().day).toBe(2);
      expect(gm.getState().daySubPhase).toBe('whisper');
    });

    it('daySubPhase를 설정할 수 있다', () => {
      const { gm } = createStartedGame();
      gm.setPhase('day');
      gm.setDaySubPhase('discussion');
      expect(gm.getState().daySubPhase).toBe('discussion');
    });
  });

  describe('역할 배정', () => {
    it('역할을 배정하면 플레이어에 반영된다', () => {
      const gm = new GameManager();
      gm.create();
      const player = gm.addPlayer('Alice');
      expect(player).not.toBeNull();
      gm.assignRole(player?.id ?? '', 'imp');
      expect(gm.getPlayer(player?.id ?? '')?.role?.id).toBe('imp');
    });

    it('주정뱅이 배정 시 drunk 상태가 자동 부여된다', () => {
      const gm = new GameManager();
      gm.create();
      const player = gm.addPlayer('Alice');
      expect(player).not.toBeNull();
      gm.assignRole(player?.id ?? '', 'drunk', 'washerwoman');
      expect(gm.getPlayer(player?.id ?? '')?.statuses).toContain('drunk');
      expect(gm.getPlayer(player?.id ?? '')?.drunkAs).toBe('washerwoman');
    });

    it('역할 해제 시 drunk 상태도 제거된다', () => {
      const gm = new GameManager();
      gm.create();
      const player = gm.addPlayer('Alice');
      expect(player).not.toBeNull();
      gm.assignRole(player?.id ?? '', 'drunk', 'washerwoman');
      gm.unassignRole(player?.id ?? '');
      expect(gm.getPlayer(player?.id ?? '')?.role).toBeUndefined();
      expect(gm.getPlayer(player?.id ?? '')?.statuses).not.toContain('drunk');
    });
  });

  describe('사망/부활', () => {
    it('kill로 플레이어를 사망시킬 수 있다', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[0].id);
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(false);
    });

    it('revive로 부활시킬 수 있다', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[0].id);
      gm.revive(players[0].id);
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(true);
    });

    it('pendingNightKill 추가/플러시', () => {
      const { gm, players } = createStartedGame();
      gm.addPendingNightKill(players[0].id);
      gm.addPendingNightKill(players[0].id); // 중복 무시
      gm.addPendingNightKill(players[1].id);
      const kills = gm.flushPendingNightKills();
      expect(kills).toEqual([players[0].id, players[1].id]);
      expect(gm.flushPendingNightKills()).toEqual([]);
    });
  });

  describe('점쟁이 Red Herring', () => {
    it('점쟁이가 있으면 자동 배정된다', () => {
      const { gm } = createStartedGame();
      const rhId = gm.assignFortuneTellerRedHerring();
      expect(rhId).not.toBeNull();
      const rh = gm.getPlayer(rhId ?? '');
      expect(rh?.statuses).toContain('cursed');
    });

    it('점쟁이가 없으면 null을 반환한다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'chef');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      expect(gm.assignFortuneTellerRedHerring()).toBeNull();
    });

    it('수동 배정할 수 있다', () => {
      const { gm, players } = createStartedGame();
      expect(gm.setRedHerring(players[0].id)).toBe(true);
      expect(gm.getRedHerringId()).toBe(players[0].id);
      expect(gm.getPlayer(players[0].id)?.statuses).toContain('cursed');
    });

    it('judgeFortuneTeller: 악마 포함 시 true', () => {
      const { gm, players } = createStartedGame();
      expect(gm.judgeFortuneTeller([players[0].id, players[4].id])).toBe(true);
    });

    it('judgeFortuneTeller: red herring 포함 시 true', () => {
      const { gm, players } = createStartedGame();
      gm.setRedHerring(players[0].id);
      expect(gm.judgeFortuneTeller([players[0].id, players[1].id])).toBe(true);
    });

    it('judgeFortuneTeller: 중독 시 결과 반전', () => {
      const { gm, players } = createStartedGame();
      gm.setPlayerStatuses(players[2].id, ['poisoned']); // fortune_teller
      expect(gm.judgeFortuneTeller([players[0].id, players[4].id])).toBe(false);
    });
  });

  describe('집사', () => {
    it('주인을 설정할 수 있다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'butler');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();

      gm.setButlerMaster(players[0].id, players[1].id);
      expect(gm.getButlerMaster(players[0].id)).toBe(players[1].id);
      expect(gm.getPlayer(players[1].id)?.statuses).toContain('master');
    });

    it('주인이 투표하지 않으면 집사 투표가 제한된다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'butler');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');
      gm.setButlerMaster(players[0].id, players[1].id);

      gm.nominate(players[2].id, players[3].id);

      const result = gm.castVote(players[0].id);
      expect(result.success).toBe(false);
    });

    it('중독된 집사는 제한 없이 투표할 수 있다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'butler');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');
      gm.setButlerMaster(players[0].id, players[1].id);
      gm.setPlayerStatuses(players[0].id, ['poisoned']);

      gm.nominate(players[2].id, players[3].id);

      const result = gm.castVote(players[0].id);
      expect(result.success).toBe(true);
    });
  });

  describe('초공감자', () => {
    it('양쪽 이웃의 악 진영 수를 계산한다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'empath');
      gm.assignRole(players[1].id, 'washerwoman');
      gm.assignRole(players[2].id, 'chef');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      const info = gm.getEmpathNeighborInfo(players[0].id);
      expect(info.neighbors).toHaveLength(2);
      expect(info.evilCount).toBe(1);
    });

    it('사망자를 스킵하고 다음 살아있는 이웃을 찾는다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'empath');
      gm.assignRole(players[1].id, 'washerwoman');
      gm.assignRole(players[2].id, 'chef');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();

      gm.kill(players[1].id);
      const info = gm.getEmpathNeighborInfo(players[0].id);
      expect(info.neighbors).toHaveLength(2);
      expect(info.evilCount).toBe(1);
    });
  });

  describe('지명/성결자', () => {
    it('지명이 성공한다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');
      const result = gm.nominate(players[0].id, players[1].id);
      expect(result.success).toBe(true);
    });

    it('사망한 플레이어는 지명할 수 없다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.kill(players[0].id);
      const result = gm.nominate(players[0].id, players[1].id);
      expect(result.success).toBe(false);
    });

    it('이미 지명한 플레이어는 다시 지명할 수 없다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.nominate(players[0].id, players[1].id);
      const result = gm.nominate(players[0].id, players[2].id);
      expect(result.success).toBe(false);
    });

    it('자기 자신은 지명할 수 없다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const result = gm.nominate(players[0].id, players[0].id);
      expect(result.success).toBe(false);
    });

    it('성결자: 마을주민이 지명하면 virginKill 반환', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'virgin');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      const result = gm.nominate(players[0].id, players[1].id);
      expect(result.success).toBe(true);
      expect(result.virginKill).toBe(players[0].id);
    });

    it('성결자: 하수인이 지명하면 virginKill 미발동', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'virgin');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.setPhase('day');

      const result = gm.nominate(players[3].id, players[1].id);
      expect(result.success).toBe(true);
      expect(result.virginKill).toBeUndefined();
    });

    it('성결자: 중독된 성결자는 능력 미발동', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'virgin');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.setPhase('day');
      gm.setPlayerStatuses(players[1].id, ['poisoned']);

      const result = gm.nominate(players[0].id, players[1].id);
      expect(result.success).toBe(true);
      expect(result.virginKill).toBeUndefined();
    });
  });

  describe('투표', () => {
    it('생존 플레이어가 투표할 수 있다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.nominate(players[0].id, players[1].id);
      expect(gm.castVote(players[2].id).success).toBe(true);
    });

    it('사망 플레이어는 한 번만 투표할 수 있다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.kill(players[2].id);
      gm.nominate(players[0].id, players[1].id);
      expect(gm.castVote(players[2].id).success).toBe(true);

      gm.nominate(players[3].id, players[4].id);
      expect(gm.castVote(players[2].id).success).toBe(false);
    });

    it('closeVote: 과반수 판정', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.nominate(players[0].id, players[1].id);

      gm.castVote(players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[3].id);

      const result = gm.closeVote();
      expect(result).not.toBeNull();
      expect(result?.guilty).toBe(true);
    });

    it('closeVote: 과반수 미달', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.nominate(players[0].id, players[1].id);

      gm.castVote(players[0].id);
      gm.castVote(players[2].id);

      const result = gm.closeVote();
      expect(result).not.toBeNull();
      expect(result?.guilty).toBe(false);
    });
  });

  describe('시계 방향 투표', () => {
    it('nominee부터 시계방향으로 순서를 반환한다', () => {
      const { gm, players } = createStartedGame();
      const order = gm.getClockwiseVoteOrder(players[2].id);
      expect(order[0]).toBe(players[2].id);
      expect(order[1]).toBe(players[3].id);
      expect(order[2]).toBe(players[4].id);
      expect(order[3]).toBe(players[0].id);
      expect(order[4]).toBe(players[1].id);
    });

    it('deadVoteUsed 플레이어를 제외한다', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[3].id);
      gm.setPhase('day');
      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[3].id);
      gm.closeVote();

      const order = gm.getClockwiseVoteOrder(players[2].id);
      expect(order).not.toContain(players[3].id);
    });
  });

  describe('승리 조건', () => {
    it('악마 사망 → 선 승리', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[4].id);
      const result = gm.checkWinCondition();
      expect(result).not.toBeNull();
      expect(result?.winningTeam).toBe('good');
    });

    it('탕녀 승계: 5인 이상 생존 + 탕녀 생존 시 게임 계속', () => {
      const { gm, players } = createTestGame(6);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'scarlet_woman');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.assignRole(players[5].id, 'chef');
      gm.start();

      gm.kill(players[4].id);
      const result = gm.checkWinCondition();
      expect(result).toBeNull();
      expect(gm.getPlayer(players[2].id)?.role?.id).toBe('imp');
    });

    it('생존자 2명 이하 → 악 승리', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[0].id);
      gm.kill(players[1].id);
      gm.kill(players[2].id);
      const result = gm.checkWinCondition();
      expect(result).not.toBeNull();
      expect(result?.winningTeam).toBe('evil');
    });

    it('성자 처형 → 악 승리', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'saint');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();

      const result = gm.checkWinCondition('saint');
      expect(result).not.toBeNull();
      expect(result?.winningTeam).toBe('evil');
    });

    it('중독된 성자 처형 시 악 승리 아님', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'saint');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.setPlayerStatuses(players[0].id, ['poisoned']);

      const result = gm.checkWinCondition('saint');
      expect(result).toBeNull();
    });

    it('시장: 3인 + 처형 없음 → 선 승리', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'mayor');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();

      gm.kill(players[1].id);
      gm.kill(players[2].id);
      const result = gm.checkWinCondition();
      expect(result).not.toBeNull();
      expect(result?.winningTeam).toBe('good');
    });
  });

  describe('임프 자살', () => {
    it('임프가 자기 자신을 선택하면 하수인에게 승계된다', () => {
      const { gm, players } = createStartedGame();
      gm.recordNightAction(players[4].id, [players[4].id]);
      const result = gm.handleImpSelfKill(players[4].id);
      expect(result).toBe(true);

      const promoted = gm.flushImpPromotion();
      expect(promoted).not.toBeNull();
      expect(promoted?.role?.id).toBe('imp');
      expect(promoted?.id).toBe(players[3].id);
    });
  });

  describe('처단자', () => {
    it('처단자 사용 추적', () => {
      const { gm, players } = createStartedGame();
      expect(gm.isSlayerUsed(players[0].id)).toBe(false);
      gm.markSlayerUsed(players[0].id);
      expect(gm.isSlayerUsed(players[0].id)).toBe(true);
    });
  });

  describe('설정', () => {
    it('setSettings로 부분 설정을 병합한다', () => {
      const gm = new GameManager();
      gm.create();
      gm.setSettings({ voteClockSeconds: 10 });
      const settings = gm.getSettings();
      expect(settings.voteClockSeconds).toBe(10);
      expect(settings.whisperMode).toBe('chat');
    });
  });
});
