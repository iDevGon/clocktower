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

    it('밤 사망 대기 중인 플레이어를 부활시키면 사망 알림 대기에서도 제거한다', () => {
      const { gm, players } = createStartedGame();
      gm.addPendingNightKill(players[0].id);

      gm.revive(players[0].id);

      expect(gm.hasPendingNightKill(players[0].id)).toBe(false);
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

    it('좀버얼 사망 위장 상태는 공개 상태만 사망으로 표시한다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'zombuul');
      gm.start();

      gm.setPlayerStatuses(players[4].id, ['zombuul_registers_dead']);

      expect(gm.getPlayer(players[4].id)?.isAlive).toBe(true);
      expect(
        gm.getState().players.find((p) => p.id === players[4].id)?.isAlive,
      ).toBe(false);
      expect(gm.checkWinCondition()).toBeNull();
    });

    it('사망 위장 중인 좀버얼은 유령 투표권으로만 투표한다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'zombuul');
      gm.start();
      gm.setPhase('day');
      gm.setPlayerStatuses(players[4].id, ['zombuul_registers_dead']);

      expect(gm.castVote(players[4].id).success).toBe(true);
      expect(gm.getPlayer(players[4].id)?.deadVoteUsed).toBe(true);
      expect(gm.castVote(players[4].id).success).toBe(false);
      expect(gm.getClockwiseVoteOrder(players[0].id)).not.toContain(
        players[4].id,
      );
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

    it('성결자: 외지인이 먼저 지명해도 능력은 소모된다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'virgin');
      gm.assignRole(players[2].id, 'recluse');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.setPhase('day');

      const outsiderResult = gm.nominate(players[2].id, players[1].id);
      expect(outsiderResult.success).toBe(true);
      expect(outsiderResult.virginKill).toBeUndefined();

      gm.setPhase('night');
      gm.setPhase('day');

      const townsfolkResult = gm.nominate(players[0].id, players[1].id);
      expect(townsfolkResult.success).toBe(true);
      expect(townsfolkResult.virginKill).toBeUndefined();
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

    it('성결자: 중독 중 첫 지명도 능력을 소모한다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'virgin');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.setPhase('day');
      gm.setPlayerStatuses(players[1].id, ['poisoned']);

      const poisonedResult = gm.nominate(players[0].id, players[1].id);
      expect(poisonedResult.success).toBe(true);
      expect(poisonedResult.virginKill).toBeUndefined();

      gm.setPhase('night');
      gm.setPhase('day');

      const soberResult = gm.nominate(players[2].id, players[1].id);
      expect(soberResult.success).toBe(true);
      expect(soberResult.virginKill).toBeUndefined();
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

  describe('푸카', () => {
    function createPukkaGame() {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'grandmother');
      gm.assignRole(players[1].id, 'sailor');
      gm.assignRole(players[2].id, 'gambler');
      gm.assignRole(players[3].id, 'godfather');
      gm.assignRole(players[4].id, 'pukka');
      gm.start();
      return { gm, players };
    }

    it('첫 선택 대상에게 푸카 중독을 부여한다', () => {
      const { gm, players } = createPukkaGame();

      const result = gm.resolvePukkaSelection(players[4].id, players[0].id);

      expect(result).toEqual({
        success: true,
        blocked: false,
        poisonedTargetId: players[0].id,
      });
      expect(gm.getPlayer(players[0].id)?.statuses).toContain('pukka_poisoned');
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(true);
    });

    it('다음 선택 시 이전 푸카 중독 대상은 사망하고 건강해진다', () => {
      const { gm, players } = createPukkaGame();
      gm.resolvePukkaSelection(players[4].id, players[0].id);

      const result = gm.resolvePukkaSelection(players[4].id, players[1].id);

      expect(result).toEqual({
        success: true,
        blocked: false,
        killedTargetId: players[0].id,
        poisonedTargetId: players[1].id,
      });
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(false);
      expect(gm.hasPendingNightKill(players[0].id)).toBe(true);
      expect(gm.getPlayer(players[0].id)?.statuses).not.toContain(
        'pukka_poisoned',
      );
      expect(gm.getPlayer(players[1].id)?.statuses).toContain('pukka_poisoned');
    });

    it('푸카가 취함/중독이면 이전 대상 사망과 새 중독을 자동 적용하지 않는다', () => {
      const { gm, players } = createPukkaGame();
      gm.resolvePukkaSelection(players[4].id, players[0].id);
      gm.setPlayerStatuses(players[4].id, ['drunk']);

      const result = gm.resolvePukkaSelection(players[4].id, players[1].id);

      expect(result).toEqual({
        success: false,
        blocked: true,
        previousTargetId: players[0].id,
        reason: '푸카가 중독/취함 상태입니다',
      });
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(true);
      expect(gm.getPlayer(players[0].id)?.statuses).toContain('pukka_poisoned');
      expect(gm.getPlayer(players[1].id)?.statuses).not.toContain(
        'pukka_poisoned',
      );
    });
  });

  describe('사발로스', () => {
    function createShabalothGame() {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'grandmother');
      gm.assignRole(players[1].id, 'sailor');
      gm.assignRole(players[2].id, 'gambler');
      gm.assignRole(players[3].id, 'godfather');
      gm.assignRole(players[4].id, 'shabaloth');
      gm.start();
      return { gm, players };
    }

    it('선택한 대상들을 사망시키고 사발로스 사망 표식을 남긴다', () => {
      const { gm, players } = createShabalothGame();

      const result = gm.resolveShabalothSelection(players[4].id, [
        players[0].id,
        players[1].id,
      ]);

      expect(result).toEqual({
        success: true,
        blocked: false,
        killedTargetIds: [players[0].id, players[1].id],
      });
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(false);
      expect(gm.getPlayer(players[1].id)?.isAlive).toBe(false);
      expect(gm.getPlayer(players[0].id)?.statuses).toContain(
        'shabaloth_marked_dead',
      );
      expect(gm.getPlayer(players[1].id)?.statuses).toContain(
        'shabaloth_marked_dead',
      );
      expect(gm.hasPendingNightKill(players[0].id)).toBe(true);
      expect(gm.hasPendingNightKill(players[1].id)).toBe(true);
    });

    it('사발로스가 취함/중독이면 대상 사망과 표식을 자동 적용하지 않는다', () => {
      const { gm, players } = createShabalothGame();
      gm.setPlayerStatuses(players[4].id, ['poisoned']);

      const result = gm.resolveShabalothSelection(players[4].id, [
        players[0].id,
        players[1].id,
      ]);

      expect(result).toEqual({
        success: false,
        blocked: true,
        reason: '사발로스가 중독/취함 상태입니다',
      });
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(true);
      expect(gm.getPlayer(players[1].id)?.isAlive).toBe(true);
      expect(gm.getPlayer(players[0].id)?.statuses).not.toContain(
        'shabaloth_marked_dead',
      );
      expect(gm.getPlayer(players[1].id)?.statuses).not.toContain(
        'shabaloth_marked_dead',
      );
    });
  });

  describe('포', () => {
    function createPoGame() {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'grandmother');
      gm.assignRole(players[1].id, 'sailor');
      gm.assignRole(players[2].id, 'gambler');
      gm.assignRole(players[3].id, 'godfather');
      gm.assignRole(players[4].id, 'po');
      gm.start();
      return { gm, players };
    }

    it('아무도 선택하지 않으면 다음 행동 3명 선택 상태를 남긴다', () => {
      const { gm, players } = createPoGame();

      const result = gm.resolvePoSelection(players[4].id, []);

      expect(result).toEqual({
        success: true,
        blocked: false,
        rested: true,
        killedTargetIds: [],
      });
      expect(gm.getPlayer(players[4].id)?.statuses).toContain(
        'po_chose_no_one',
      );
    });

    it('대상을 선택하면 대상들을 사망시키고 휴식 상태를 제거한다', () => {
      const { gm, players } = createPoGame();
      gm.setPlayerStatuses(players[4].id, ['po_chose_no_one']);

      const result = gm.resolvePoSelection(players[4].id, [
        players[0].id,
        players[1].id,
        players[2].id,
      ]);

      expect(result).toEqual({
        success: true,
        blocked: false,
        rested: false,
        killedTargetIds: [players[0].id, players[1].id, players[2].id],
      });
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(false);
      expect(gm.getPlayer(players[1].id)?.isAlive).toBe(false);
      expect(gm.getPlayer(players[2].id)?.isAlive).toBe(false);
      expect(gm.getPlayer(players[4].id)?.statuses).not.toContain(
        'po_chose_no_one',
      );
      expect(gm.hasPendingNightKill(players[0].id)).toBe(true);
      expect(gm.hasPendingNightKill(players[1].id)).toBe(true);
      expect(gm.hasPendingNightKill(players[2].id)).toBe(true);
    });

    it('0명, 1명, 3명 외 선택 수는 자동 적용하지 않는다', () => {
      const { gm, players } = createPoGame();

      const result = gm.resolvePoSelection(players[4].id, [
        players[0].id,
        players[1].id,
      ]);

      expect(result).toEqual({
        success: false,
        blocked: false,
        reason: '포는 0명, 1명 또는 3명을 선택해야 합니다',
      });
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(true);
      expect(gm.getPlayer(players[1].id)?.isAlive).toBe(true);
    });

    it('포가 취함/중독이면 휴식과 사망을 자동 적용하지 않는다', () => {
      const { gm, players } = createPoGame();
      gm.setPlayerStatuses(players[4].id, ['drunk']);

      const result = gm.resolvePoSelection(players[4].id, [players[0].id]);

      expect(result).toEqual({
        success: false,
        blocked: true,
        reason: '포가 중독/취함 상태입니다',
      });
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(true);
      expect(gm.getPlayer(players[4].id)?.statuses).not.toContain(
        'po_chose_no_one',
      );
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

  describe('투표 동률 threshold', () => {
    it('동률 발생 시 executionCandidate가 null이 된다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      // 첫 번째 투표: Player1 지명, 3표 → 처형 대상
      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[3].id);
      const result1 = gm.closeVote();
      expect(result1?.guilty).toBe(true);
      expect(result1?.executionStatus).toBe('new_candidate');
      expect(gm.getExecutionCandidate()?.playerId).toBe(players[1].id);

      // 두 번째 투표: Player3 지명, 동일 3표 → 동률 → 처형 대상 제거
      gm.nominate(players[2].id, players[3].id);
      gm.castVote(players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[4].id);
      const result2 = gm.closeVote();
      expect(result2?.guilty).toBe(false);
      expect(result2?.executionStatus).toBe('candidate_cleared');
      expect(gm.getExecutionCandidate()).toBeNull();
    });

    it('동률 후 같은 표수로는 새 처형 대상이 되지 않는다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      // 첫 번째 투표: 3표 → 처형 대상
      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[3].id);
      gm.closeVote();

      // 두 번째 투표: 동일 3표 → 동률 → 처형 대상 제거
      gm.nominate(players[2].id, players[3].id);
      gm.castVote(players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[4].id);
      gm.closeVote();

      // 세 번째 투표: 같은 3표 → threshold 초과 못함 → no_change
      gm.nominate(players[4].id, players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[3].id);
      gm.castVote(players[4].id);
      const result3 = gm.closeVote();
      expect(result3?.executionStatus).toBe('no_change');
      expect(gm.getExecutionCandidate()).toBeNull();
    });

    it('동률 후 threshold를 초과하면 새 처형 대상이 된다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      // 첫 번째 투표: 3표 → 처형 대상
      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[3].id);
      gm.closeVote();

      // 두 번째 투표: 동일 3표 → 동률
      gm.nominate(players[2].id, players[3].id);
      gm.castVote(players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[4].id);
      gm.closeVote();

      // 세 번째 투표: 4표 → threshold(3) 초과 → 새 처형 대상
      gm.nominate(players[4].id, players[0].id);
      gm.castVote(players[1].id);
      gm.castVote(players[2].id);
      gm.castVote(players[3].id);
      gm.castVote(players[4].id);
      const result3 = gm.closeVote();
      expect(result3?.guilty).toBe(true);
      expect(result3?.executionStatus).toBe('new_candidate');
      expect(gm.getExecutionCandidate()?.playerId).toBe(players[0].id);
    });

    it('closeVote() 결과의 executionStatus가 올바르게 반환된다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      // new_candidate
      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[0].id);
      gm.castVote(players[2].id);
      gm.castVote(players[3].id);
      const r1 = gm.closeVote();
      expect(r1?.executionStatus).toBe('new_candidate');

      // candidate_changed: 더 많은 표로 다른 플레이어가 처형 대상
      gm.nominate(players[2].id, players[3].id);
      gm.castVote(players[0].id);
      gm.castVote(players[1].id);
      gm.castVote(players[2].id);
      gm.castVote(players[4].id);
      const r2 = gm.closeVote();
      expect(r2?.executionStatus).toBe('candidate_changed');

      // no_change: 과반수 미달
      gm.nominate(players[4].id, players[0].id);
      gm.castVote(players[4].id);
      const r3 = gm.closeVote();
      expect(r3?.executionStatus).toBe('no_change');
    });
  });

  describe('유령 투표 제한', () => {
    it('살아있는 플레이어는 여러 투표에서 투표 가능하다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      gm.nominate(players[0].id, players[1].id);
      expect(gm.castVote(players[2].id).success).toBe(true);
      gm.closeVote();

      gm.nominate(players[3].id, players[4].id);
      expect(gm.castVote(players[2].id).success).toBe(true);
    });

    it('사망한 플레이어의 첫 투표는 성공한다', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[2].id);
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      gm.nominate(players[0].id, players[1].id);
      expect(gm.castVote(players[2].id).success).toBe(true);
    });

    it('사망한 플레이어의 두 번째 투표는 실패한다', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[2].id);
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[2].id);
      gm.closeVote();

      gm.nominate(players[3].id, players[4].id);
      const result = gm.castVote(players[2].id);
      expect(result.success).toBe(false);
    });

    it('isGhostVoteUsed()가 올바르게 동작한다', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[2].id);
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      // 사망 직후에는 아직 미사용
      expect(gm.isGhostVoteUsed(players[2].id)).toBe(false);

      // 살아있는 플레이어는 항상 false
      expect(gm.isGhostVoteUsed(players[0].id)).toBe(false);

      // 투표 후 사용됨
      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[2].id);
      expect(gm.isGhostVoteUsed(players[2].id)).toBe(true);
    });

    it('게임 초기화 시 ghostVotesUsed도 초기화된다', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[2].id);
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[2].id);
      expect(gm.isGhostVoteUsed(players[2].id)).toBe(true);

      gm.restart();
      // restart 후 모든 플레이어가 살아있으므로 isGhostVoteUsed는 false
      const state = gm.getState();
      const player2 = state.players.find((p) => p.name === 'Player3');
      expect(player2).toBeDefined();
      expect(player2?.isAlive).toBe(true);
      expect(gm.isGhostVoteUsed(player2?.id ?? '')).toBe(false);
    });
  });

  describe('블러프 역할 관리', () => {
    it('setBluffRoles()로 설정한 블러프가 getBluffRoles()로 조회된다', () => {
      const { gm } = createStartedGame();
      const bluffs = [
        { id: 'chef', name: '요리사' },
        { id: 'monk', name: '수도승' },
        { id: 'ravenkeeper', name: '묘지기' },
      ];
      gm.setBluffRoles(bluffs);
      expect(gm.getBluffRoles()).toEqual(bluffs);
    });

    it('getStorytellerState()에 bluffRoles가 포함된다', () => {
      const { gm } = createStartedGame();
      const bluffs = [{ id: 'chef', name: '요리사' }];
      gm.setBluffRoles(bluffs);
      const state = gm.getStorytellerState();
      expect(state.bluffRoles).toEqual(bluffs);
    });

    it('getState()에는 bluffRoles가 포함되지 않는다', () => {
      const { gm } = createStartedGame();
      const bluffs = [{ id: 'chef', name: '요리사' }];
      gm.setBluffRoles(bluffs);
      const state = gm.getState();
      expect(state.bluffRoles).toBeUndefined();
    });

    it('게임 초기화 시 블러프도 초기화된다', () => {
      const { gm } = createStartedGame();
      gm.setBluffRoles([{ id: 'chef', name: '요리사' }]);
      gm.restart();
      expect(gm.getBluffRoles()).toEqual([]);
    });
  });

  describe('지목 타이머', () => {
    it('startNominationTimer()로 시작한다', () => {
      const { gm } = createStartedGame();
      gm.startNominationTimer(30000);
      expect(gm.getNominationRemainingMs()).toBe(30000);
    });

    it('pauseNominationTimer()로 일시정지하면 남은 시간이 계산된다', () => {
      const { gm } = createStartedGame();
      const now = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 10000);

      gm.startNominationTimer(30000);
      gm.pauseNominationTimer();

      expect(gm.getNominationRemainingMs()).toBe(20000);
      vi.restoreAllMocks();
    });

    it('resumeNominationTimer()로 재개하면 남은 시간을 반환한다', () => {
      const { gm } = createStartedGame();
      const now = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 10000)
        .mockReturnValueOnce(now + 10000);

      gm.startNominationTimer(30000);
      gm.pauseNominationTimer();

      const remaining = gm.resumeNominationTimer();
      expect(remaining).toBe(20000);
      vi.restoreAllMocks();
    });

    it('clearNominationTimer()로 초기화한다', () => {
      const { gm } = createStartedGame();
      gm.startNominationTimer(30000);
      gm.clearNominationTimer();
      expect(gm.getNominationRemainingMs()).toBeNull();
    });

    it('타이머 미시작 시 resumeNominationTimer()는 null을 반환한다', () => {
      const { gm } = createStartedGame();
      expect(gm.resumeNominationTimer()).toBeNull();
    });
  });

  describe('게임 재시작', () => {
    it('restart() 후 플레이어 목록이 유지된다', () => {
      const { gm } = createStartedGame();
      gm.restart();
      const state = gm.getState();
      expect(state.players).toHaveLength(5);
      expect(state.players.map((p) => p.name)).toEqual([
        'Player1',
        'Player2',
        'Player3',
        'Player4',
        'Player5',
      ]);
    });

    it('restart() 후 역할/상태가 초기화된다', () => {
      const { gm, players } = createStartedGame();
      gm.setPlayerStatuses(players[0].id, ['poisoned']);
      gm.restart();
      const state = gm.getState();
      expect(state.players.every((p) => p.role === undefined)).toBe(true);
      expect(state.players.every((p) => p.statuses.length === 0)).toBe(true);
      expect(state.players.every((p) => p.isAlive)).toBe(true);
    });

    it('restart() 후 phase가 setup으로 변경된다', () => {
      const { gm } = createStartedGame();
      gm.setPhase('day');
      gm.restart();
      const state = gm.getState();
      expect(state.phase).toBe('setup');
      expect(state.started).toBe(false);
      expect(state.day).toBe(0);
    });

    it('restart() 후 settings가 유지된다', () => {
      const { gm } = createStartedGame();
      gm.setSettings({ voteClockSeconds: 15, whisperMode: 'offline' });
      gm.restart();
      const settings = gm.getSettings();
      expect(settings.voteClockSeconds).toBe(15);
      expect(settings.whisperMode).toBe('offline');
    });

    it('restart() 후 ghostVotesUsed가 초기화된다', () => {
      const { gm, players } = createStartedGame();
      gm.kill(players[2].id);
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');
      gm.nominate(players[0].id, players[1].id);
      gm.castVote(players[2].id);

      gm.restart();
      // restart 후 모든 플레이어는 살아있고 ghostVotesUsed 초기화됨
      const state = gm.getState();
      const player = state.players.find((p) => p.name === 'Player3');
      expect(player?.isAlive).toBe(true);
      expect(player?.deadVoteUsed).toBe(false);
      expect(gm.isGhostVoteUsed(player?.id ?? '')).toBe(false);
    });
  });

  describe('은둔자/첩자 위장 (misregistered)', () => {
    function createMisregisterGame() {
      const { gm, players } = createTestGame(7);
      // 0: empath, 1: recluse, 2: fortune_teller, 3: chef, 4: spy, 5: poisoner, 6: imp
      gm.assignRole(players[0].id, 'empath');
      gm.assignRole(players[1].id, 'recluse');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'chef');
      gm.assignRole(players[4].id, 'spy');
      gm.assignRole(players[5].id, 'poisoner');
      gm.assignRole(players[6].id, 'imp');
      gm.start();
      return { gm, players };
    }

    describe('공감자 + 은둔자', () => {
      it('위장 없는 은둔자는 선으로 감지된다', () => {
        const { gm, players } = createMisregisterGame();
        // playerOrder: [0, 1, 2, 3, 4, 5, 6]
        // empath(0)의 이웃: 왼쪽=imp(6), 오른쪽=recluse(1)
        const info = gm.getEmpathNeighborInfo(players[0].id);
        const recluseNeighbor = info.neighbors.find(
          (n) => n.id === players[1].id,
        );
        expect(recluseNeighbor?.isEvil).toBe(false);
      });

      it('misregistered 은둔자는 악으로 감지된다', () => {
        const { gm, players } = createMisregisterGame();
        gm.setPlayerStatuses(players[1].id, ['misregistered']);
        const info = gm.getEmpathNeighborInfo(players[0].id);
        const recluseNeighbor = info.neighbors.find(
          (n) => n.id === players[1].id,
        );
        expect(recluseNeighbor?.isEvil).toBe(true);
      });
    });

    describe('공감자 + 첩자', () => {
      it('위장 없는 첩자는 악으로 감지된다', () => {
        createMisregisterGame();
        // chef(3)을 empath로 교체해서 spy(4)가 이웃이 되도록 구성
        // 대신 직접 spy를 이웃에 두는 게임 생성
        const { gm: gm2, players: p } = createTestGame(5);
        gm2.assignRole(p[0].id, 'empath');
        gm2.assignRole(p[1].id, 'spy');
        gm2.assignRole(p[2].id, 'chef');
        gm2.assignRole(p[3].id, 'poisoner');
        gm2.assignRole(p[4].id, 'imp');
        gm2.start();

        const info = gm2.getEmpathNeighborInfo(p[0].id);
        const spyNeighbor = info.neighbors.find((n) => n.id === p[1].id);
        expect(spyNeighbor?.isEvil).toBe(true);
      });

      it('misregistered 첩자는 선으로 감지된다', () => {
        const { gm, players: p } = createTestGame(5);
        gm.assignRole(p[0].id, 'empath');
        gm.assignRole(p[1].id, 'spy');
        gm.assignRole(p[2].id, 'chef');
        gm.assignRole(p[3].id, 'poisoner');
        gm.assignRole(p[4].id, 'imp');
        gm.start();
        gm.setPlayerStatuses(p[1].id, ['misregistered']);

        const info = gm.getEmpathNeighborInfo(p[0].id);
        const spyNeighbor = info.neighbors.find((n) => n.id === p[1].id);
        expect(spyNeighbor?.isEvil).toBe(false);
      });
    });

    describe('점쟁이 + 은둔자', () => {
      it('위장 없는 은둔자는 악마로 감지되지 않는다', () => {
        const { gm, players } = createMisregisterGame();
        const result = gm.judgeFortuneTeller([players[1].id, players[3].id]);
        expect(result).toBe(false);
      });

      it('misregistered 은둔자는 악마로 감지된다', () => {
        const { gm, players } = createMisregisterGame();
        gm.setPlayerStatuses(players[1].id, ['misregistered']);
        const result = gm.judgeFortuneTeller([players[1].id, players[3].id]);
        expect(result).toBe(true);
      });
    });

    describe('점쟁이 + 첩자', () => {
      it('위장 없는 첩자는 악으로 감지되지 않는다 (하수인은 원래 감지 안됨)', () => {
        const { gm, players } = createMisregisterGame();
        const result = gm.judgeFortuneTeller([players[4].id, players[3].id]);
        expect(result).toBe(false);
      });

      it('misregistered 첩자도 선으로 감지된다 (변화 없음)', () => {
        const { gm, players } = createMisregisterGame();
        gm.setPlayerStatuses(players[4].id, ['misregistered']);
        const result = gm.judgeFortuneTeller([players[4].id, players[3].id]);
        expect(result).toBe(false);
      });
    });

    describe('점쟁이 + 악마 + 첩자 위장', () => {
      it('악마와 misregistered 첩자를 함께 선택하면 악마로 인해 true', () => {
        const { gm, players } = createMisregisterGame();
        gm.setPlayerStatuses(players[4].id, ['misregistered']);
        const result = gm.judgeFortuneTeller([players[4].id, players[6].id]);
        expect(result).toBe(true);
      });
    });

    describe('위장 상태가 다른 역할에는 영향 없음', () => {
      it('misregistered가 일반 마을주민에게는 효과 없다', () => {
        const { gm, players } = createMisregisterGame();
        gm.setPlayerStatuses(players[3].id, ['misregistered']); // chef
        const info = gm.getEmpathNeighborInfo(players[0].id);
        // chef는 은둔자도 첩자도 아니므로 실제 진영(선) 유지
        const _chefNeighbor = info.neighbors.find(
          (n) => n.id === players[3].id,
        );
        // chef가 이웃이 아닐 수 있으므로 직접 테스트
        const { gm: gm2, players: p } = createTestGame(5);
        gm2.assignRole(p[0].id, 'empath');
        gm2.assignRole(p[1].id, 'chef');
        gm2.assignRole(p[2].id, 'washerwoman');
        gm2.assignRole(p[3].id, 'poisoner');
        gm2.assignRole(p[4].id, 'imp');
        gm2.start();
        gm2.setPlayerStatuses(p[1].id, ['misregistered']);

        const info2 = gm2.getEmpathNeighborInfo(p[0].id);
        const neighbor = info2.neighbors.find((n) => n.id === p[1].id);
        expect(neighbor?.isEvil).toBe(false);
      });

      it('misregistered가 일반 하수인에게는 효과 없다', () => {
        const { gm, players: p } = createTestGame(5);
        gm.assignRole(p[0].id, 'empath');
        gm.assignRole(p[1].id, 'poisoner');
        gm.assignRole(p[2].id, 'washerwoman');
        gm.assignRole(p[3].id, 'chef');
        gm.assignRole(p[4].id, 'imp');
        gm.start();
        gm.setPlayerStatuses(p[1].id, ['misregistered']);

        const info = gm.getEmpathNeighborInfo(p[0].id);
        const neighbor = info.neighbors.find((n) => n.id === p[1].id);
        expect(neighbor?.isEvil).toBe(true);
      });
    });

    describe('중독 + 위장 조합', () => {
      it('점쟁이 중독 + misregistered 은둔자 → 결과 반전 (false)', () => {
        const { gm, players } = createMisregisterGame();
        gm.setPlayerStatuses(players[1].id, ['misregistered']); // recluse
        gm.setPlayerStatuses(players[2].id, ['poisoned']); // fortune_teller
        const result = gm.judgeFortuneTeller([players[1].id, players[3].id]);
        // misregistered 은둔자는 true지만, 점쟁이 중독으로 반전 → false
        expect(result).toBe(false);
      });
    });
  });
});
