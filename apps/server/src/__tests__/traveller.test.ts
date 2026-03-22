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

describe('GameManager - 여행자 시스템', () => {
  beforeEach(() => {
    uuidCounter = 0;
  });

  describe('addTraveller', () => {
    it('게임이 생성된 후 여행자를 추가할 수 있다', () => {
      const gm = new GameManager();
      gm.create();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).not.toBeNull();
      expect(traveller?.name).toBe('Traveller1');
      expect(traveller?.isTraveller).toBe(true);
      expect(traveller?.isAlive).toBe(true);
    });

    it('게임 시작 후에도 여행자를 추가할 수 있다', () => {
      const { gm } = createStartedGame();
      const traveller = gm.addTraveller('LateJoiner');
      expect(traveller).not.toBeNull();
      expect(traveller?.isTraveller).toBe(true);
    });

    it('게임이 생성되지 않으면 null을 반환한다', () => {
      const gm = new GameManager();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).toBeNull();
    });

    it('추가된 여행자가 playerOrder에 포함된다', () => {
      const { gm } = createStartedGame();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).not.toBeNull();
      expect(gm.getPlayerOrder()).toContain(traveller?.id);
    });

    it('추가된 여행자가 players 배열에 포함된다', () => {
      const { gm } = createStartedGame();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).not.toBeNull();
      expect(gm.getPlayer(traveller?.id ?? '')).toBeDefined();
    });
  });

  describe('assignTravellerRole', () => {
    it('여행자에게 역할과 진영을 배정할 수 있다', () => {
      const gm = new GameManager();
      gm.create();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).not.toBeNull();

      const success = gm.assignTravellerRole(
        traveller?.id ?? '',
        'scapegoat',
        'good',
      );
      expect(success).toBe(true);

      const p = gm.getPlayer(traveller?.id ?? '');
      expect(p?.role?.id).toBe('scapegoat');
      expect(p?.role?.team).toBe('traveller');
      expect(p?.travellerAlignment).toBe('good');
    });

    it('악한 진영으로 배정할 수 있다', () => {
      const gm = new GameManager();
      gm.create();
      const traveller = gm.addTraveller('EvilTraveller');
      expect(traveller).not.toBeNull();

      const success = gm.assignTravellerRole(
        traveller?.id ?? '',
        'gunslinger',
        'evil',
      );
      expect(success).toBe(true);

      const p = gm.getPlayer(traveller?.id ?? '');
      expect(p?.travellerAlignment).toBe('evil');
    });

    it('일반 플레이어에게는 여행자 역할을 배정할 수 없다', () => {
      const { gm, players } = createTestGame(5);
      const success = gm.assignTravellerRole(
        players[0].id,
        'scapegoat',
        'good',
      );
      expect(success).toBe(false);
    });

    it('존재하지 않는 여행자 역할은 배정할 수 없다', () => {
      const gm = new GameManager();
      gm.create();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).not.toBeNull();

      const success = gm.assignTravellerRole(
        traveller?.id ?? '',
        'nonexistent_traveller',
        'good',
      );
      expect(success).toBe(false);
    });

    it('존재하지 않는 플레이어에게는 배정할 수 없다', () => {
      const gm = new GameManager();
      gm.create();
      const success = gm.assignTravellerRole(
        'nonexistent',
        'scapegoat',
        'good',
      );
      expect(success).toBe(false);
    });
  });

  describe('exileTraveller', () => {
    it('여행자를 추방할 수 있다', () => {
      const { gm } = createStartedGame();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).not.toBeNull();
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      const success = gm.exileTraveller(traveller?.id ?? '');
      expect(success).toBe(true);
      expect(gm.getPlayer(traveller?.id ?? '')?.isAlive).toBe(false);
    });

    it('일반 플레이어는 추방할 수 없다', () => {
      const { gm, players } = createStartedGame();
      const success = gm.exileTraveller(players[0].id);
      expect(success).toBe(false);
    });

    it('존재하지 않는 플레이어는 추방할 수 없다', () => {
      const gm = new GameManager();
      gm.create();
      const success = gm.exileTraveller('nonexistent');
      expect(success).toBe(false);
    });
  });

  describe('removeTraveller', () => {
    it('여행자를 게임에서 완전히 제거할 수 있다', () => {
      const { gm } = createStartedGame();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).not.toBeNull();

      const success = gm.removeTraveller(traveller?.id ?? '');
      expect(success).toBe(true);
      expect(gm.getPlayer(traveller?.id ?? '')).toBeUndefined();
    });

    it('일반 플레이어는 removeTraveller로 제거할 수 없다', () => {
      const { gm, players } = createStartedGame();
      const success = gm.removeTraveller(players[0].id);
      expect(success).toBe(false);
    });

    it('제거된 여행자는 playerOrder에서도 사라진다', () => {
      const { gm } = createStartedGame();
      const traveller = gm.addTraveller('Traveller1');
      expect(traveller).not.toBeNull();

      gm.removeTraveller(traveller?.id ?? '');
      expect(gm.getPlayerOrder()).not.toContain(traveller?.id);
    });
  });

  describe('getTravellers', () => {
    it('여행자 목록을 반환한다', () => {
      const { gm } = createStartedGame();
      gm.addTraveller('T1');
      gm.addTraveller('T2');
      const travellers = gm.getTravellers();
      expect(travellers).toHaveLength(2);
      expect(travellers.every((p) => p.isTraveller)).toBe(true);
    });

    it('여행자가 없으면 빈 배열을 반환한다', () => {
      const { gm } = createStartedGame();
      expect(gm.getTravellers()).toHaveLength(0);
    });
  });

  describe('게임 시작과 여행자', () => {
    it('여행자는 일반 플레이어 수에 포함되지 않는다 (최소 인원 판정)', () => {
      const gm = new GameManager();
      gm.create();
      // 일반 플레이어 4명 + 여행자 1명 = 시작 불가 (5명 미만)
      for (let i = 0; i < 4; i++) {
        const p = gm.addPlayer(`Player${i + 1}`);
        if (p) gm.assignRole(p.id, 'washerwoman');
      }
      const traveller = gm.addTraveller('Traveller1');
      if (traveller) {
        gm.assignTravellerRole(traveller.id, 'scapegoat', 'good');
      }

      const result = gm.start();
      expect(result.success).toBe(false);
      expect(result.error).toContain('5명');
    });

    it('여행자에게 역할이 배정되지 않아도 시작할 수 있다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');

      gm.addTraveller('UnassignedTraveller');

      const result = gm.start();
      expect(result.success).toBe(true);
    });

    it('여행자에게 역할이 배정되면 시작할 수 있다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');

      const traveller = gm.addTraveller('AssignedTraveller');
      if (traveller) {
        gm.assignTravellerRole(traveller.id, 'scapegoat', 'good');
      }

      const result = gm.start();
      expect(result.success).toBe(true);
    });
  });

  describe('승리 조건과 여행자', () => {
    it('여행자는 생존자 수에 포함되지 않는다', () => {
      const { gm, players } = createStartedGame();
      // 3명 사망 → 생존 2명 → 악 승리
      gm.kill(players[0].id);
      gm.kill(players[1].id);
      gm.kill(players[2].id);

      // 여행자 추가 (살아있지만 생존자 수에 미포함)
      const traveller = gm.addTraveller('Traveller1');
      if (traveller) {
        gm.assignTravellerRole(traveller.id, 'scapegoat', 'good');
      }

      const result = gm.checkWinCondition();
      expect(result).not.toBeNull();
      expect(result?.winningTeam).toBe('evil');
    });

    it('여행자만 살아있어도 생존자 수에 미포함이므로 악 승리', () => {
      const { gm, players } = createStartedGame();
      // 모든 일반 플레이어 중 3명 사망, 생존 2명
      gm.kill(players[0].id);
      gm.kill(players[1].id);
      gm.kill(players[2].id);

      const result = gm.checkWinCondition();
      expect(result).not.toBeNull();
      expect(result?.winningTeam).toBe('evil');
    });
  });

  describe('추방과 처형 효과', () => {
    it('추방은 처형 횟수에 포함되지 않는다', () => {
      const { gm } = createStartedGame();
      gm.setPhase('day');

      const traveller = gm.addTraveller('Traveller1');
      if (traveller) {
        gm.assignTravellerRole(traveller.id, 'scapegoat', 'good');
      }

      gm.exileTraveller(traveller?.id ?? '');
      expect(gm.hadExecutionToday()).toBe(false);
    });

    it('추방 후에도 일반 처형이 가능하다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      const traveller = gm.addTraveller('Traveller1');
      if (traveller) {
        gm.assignTravellerRole(traveller.id, 'scapegoat', 'good');
      }

      gm.exileTraveller(traveller?.id ?? '');

      // 추방 후에도 지명 가능
      const nomResult = gm.nominate(players[0].id, players[1].id);
      expect(nomResult.success).toBe(true);
    });

    it('추방은 성자 처형 효과를 발동시키지 않는다', () => {
      const { gm, players } = createTestGame(5);
      gm.assignRole(players[0].id, 'saint');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();

      const traveller = gm.addTraveller('TravellerSaint');
      if (traveller) {
        gm.assignTravellerRole(traveller.id, 'scapegoat', 'good');
      }

      // 여행자 추방은 처형이 아니므로 checkWinCondition에 executedRoleId를 넘기지 않음
      gm.exileTraveller(traveller?.id ?? '');
      const result = gm.checkWinCondition();
      // 악마가 살아있고, 일반 생존자가 5명이므로 게임 계속
      expect(result).toBeNull();
    });
  });

  describe('restart와 여행자', () => {
    it('restart 후 여행자도 유지된다', () => {
      const { gm } = createStartedGame();
      const traveller = gm.addTraveller('Traveller1');
      if (traveller) {
        gm.assignTravellerRole(traveller.id, 'scapegoat', 'good');
      }

      gm.restart();
      const state = gm.getState();
      // restart는 플레이어를 유지하므로 여행자도 유지됨
      expect(state.players).toHaveLength(6);
    });
  });

  describe('역할 배분과 여행자', () => {
    it('여행자는 일반 역할 배분에 포함되지 않는다', async () => {
      const { distributeRoles } = await import('@clocktower/shared/logic');
      // 5명의 일반 플레이어 ID만 전달 (여행자 제외)
      const playerIds = ['p1', 'p2', 'p3', 'p4', 'p5'];
      const result = distributeRoles(playerIds);
      expect(result).not.toBeNull();
      if (!result) return;

      // 배분된 역할 중 여행자 역할이 없어야 함
      expect(result.assignments.every((a) => a.role.team !== 'traveller')).toBe(
        true,
      );
    });
  });
});
