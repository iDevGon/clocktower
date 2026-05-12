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

  describe('추방 투표', () => {
    it('낮에 추방 투표를 시작할 수 있다', () => {
      const { gm } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      const result = gm.startExileVote('proposer', traveller?.id ?? '');
      expect(result.success).toBe(true);
      expect(result.totalPlayers).toBe(6); // 5 + 1 traveller
      expect(gm.isExileVoteInProgress()).toBe(true);
    });

    it('밤에는 추방 투표를 시작할 수 없다', () => {
      const { gm } = createStartedGame();
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      const result = gm.startExileVote('proposer', traveller?.id ?? '');
      expect(result.success).toBe(false);
    });

    it('일반 플레이어는 추방 투표 대상이 될 수 없다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');

      const result = gm.startExileVote('proposer', players[0].id);
      expect(result.success).toBe(false);
      expect(result.error).toContain('여행자');
    });

    it('이미 사망한 여행자는 추방 투표 대상이 될 수 없다', () => {
      const { gm } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');
      gm.exileTraveller(traveller?.id ?? '');

      const result = gm.startExileVote('proposer', traveller?.id ?? '');
      expect(result.success).toBe(false);
    });

    it('중복 추방 투표를 시작할 수 없다', () => {
      const { gm } = createStartedGame();
      gm.setPhase('day');
      const t1 = gm.addTraveller('T1');
      gm.assignTravellerRole(t1?.id ?? '', 'scapegoat', 'good');
      const t2 = gm.addTraveller('T2');
      gm.assignTravellerRole(t2?.id ?? '', 'gunslinger', 'good');

      gm.startExileVote('proposer', t1?.id ?? '');
      const result = gm.startExileVote('proposer', t2?.id ?? '');
      expect(result.success).toBe(false);
      expect(result.error).toContain('이미');
    });

    it('추방 투표에 모든 플레이어가 투표할 수 있다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[0].id, traveller?.id ?? '');

      // 모든 플레이어(죽은 플레이어 포함)가 투표
      for (const p of players) {
        const result = gm.castExileVote(p.id, true);
        expect(result.success).toBe(true);
      }
      // 여행자 본인도 투표
      const tResult = gm.castExileVote(traveller?.id ?? '', false);
      expect(tResult.success).toBe(true);
      expect(tResult.allVoted).toBe(true);
      expect(tResult.guiltyCount).toBe(5);
      expect(tResult.innocentCount).toBe(1);
    });

    it('중복 투표는 할 수 없다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[0].id, traveller?.id ?? '');
      gm.castExileVote(players[0].id, true);

      const result = gm.castExileVote(players[0].id, false);
      expect(result.success).toBe(false);
    });

    it('과반수 찬성 시 추방된다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[0].id, traveller?.id ?? '');
      // 6명 중 4명 찬성 (> 3)
      gm.castExileVote(players[0].id, true);
      gm.castExileVote(players[1].id, true);
      gm.castExileVote(players[2].id, true);
      gm.castExileVote(players[3].id, true);
      gm.castExileVote(players[4].id, false);
      gm.castExileVote(traveller?.id ?? '', false);

      const result = gm.closeExileVote();
      expect(result).not.toBeNull();
      expect(result?.exiled).toBe(true);
      expect(result?.guiltyCount).toBe(4);
      expect(gm.getPlayer(traveller?.id ?? '')?.isAlive).toBe(false);
    });

    it('과반수 미달 시 추방되지 않는다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[0].id, traveller?.id ?? '');
      // 6명 중 3명 찬성 (= 3, not > 3)
      gm.castExileVote(players[0].id, true);
      gm.castExileVote(players[1].id, true);
      gm.castExileVote(players[2].id, true);
      gm.castExileVote(players[3].id, false);
      gm.castExileVote(players[4].id, false);
      gm.castExileVote(traveller?.id ?? '', false);

      const result = gm.closeExileVote();
      expect(result).not.toBeNull();
      expect(result?.exiled).toBe(false);
      expect(gm.getPlayer(traveller?.id ?? '')?.isAlive).toBe(true);
    });

    it('이야기꾼이 강제로 추방할 수 있다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[0].id, traveller?.id ?? '');
      // 투표 완료 전이라도 강제 종료
      const result = gm.closeExileVote(true);
      expect(result).not.toBeNull();
      expect(result?.exiled).toBe(true);
      expect(gm.getPlayer(traveller?.id ?? '')?.isAlive).toBe(false);
    });

    it('이야기꾼이 강제 부결할 수 있다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[0].id, traveller?.id ?? '');
      // 전원 찬성해도 강제 부결
      for (const p of players) gm.castExileVote(p.id, true);
      gm.castExileVote(traveller?.id ?? '', true);

      const result = gm.closeExileVote(false);
      expect(result).not.toBeNull();
      expect(result?.exiled).toBe(false);
      expect(gm.getPlayer(traveller?.id ?? '')?.isAlive).toBe(true);
    });

    it('추방 투표 종료 후 새 추방 투표가 가능하다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const t1 = gm.addTraveller('T1');
      gm.assignTravellerRole(t1?.id ?? '', 'scapegoat', 'good');
      const t2 = gm.addTraveller('T2');
      gm.assignTravellerRole(t2?.id ?? '', 'gunslinger', 'good');

      gm.startExileVote(players[0].id, t1?.id ?? '');
      gm.closeExileVote(false);

      const result = gm.startExileVote(players[0].id, t2?.id ?? '');
      expect(result.success).toBe(true);
    });

    it('밤 전환 시 진행 중인 추방 투표가 정리된다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[0].id, traveller?.id ?? '');
      expect(gm.isExileVoteInProgress()).toBe(true);

      gm.setPhase('night');
      expect(gm.isExileVoteInProgress()).toBe(false);
    });

    it('getExileVote가 올바른 투표 현황을 반환한다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[0].id, traveller?.id ?? '');
      gm.castExileVote(players[0].id, true);
      gm.castExileVote(players[1].id, false);

      const vote = gm.getExileVote();
      expect(vote).not.toBeNull();
      expect(vote?.proposerId).toBe(players[0].id);
      expect(vote?.targetId).toBe(traveller?.id);
      expect(vote?.guiltyCount).toBe(1);
      expect(vote?.innocentCount).toBe(1);
      expect(vote?.votes[players[0].id]).toBe(true);
      expect(vote?.votes[players[1].id]).toBe(false);
    });

    it('추방 투표가 없으면 getExileVote는 null을 반환한다', () => {
      const { gm } = createStartedGame();
      expect(gm.getExileVote()).toBeNull();
    });

    it('사망한 플레이어도 추방 투표에 참여할 수 있다', () => {
      const { gm, players } = createStartedGame();
      gm.setPhase('day');
      gm.kill(players[0].id); // 사망 처리

      const traveller = gm.addTraveller('T1');
      gm.assignTravellerRole(traveller?.id ?? '', 'scapegoat', 'good');

      gm.startExileVote(players[1].id, traveller?.id ?? '');
      const result = gm.castExileVote(players[0].id, true); // 사망 플레이어도 투표
      expect(result.success).toBe(true);
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

  describe('여행자 밤 행동 정의', () => {
    it('bureaucrat의 NIGHT_ACTIONS가 정의되어 있다', async () => {
      const { NIGHT_ACTIONS } = await import('@clocktower/shared/logic');
      expect(NIGHT_ACTIONS.bureaucrat).toBeDefined();
      expect(NIGHT_ACTIONS.bureaucrat.type).toBe('select_one');
      expect(NIGHT_ACTIONS.bureaucrat.excludeSelf).toBe(true);
      expect(NIGHT_ACTIONS.bureaucrat.includeDeadTargets).toBe(true);
    });

    it('thief의 NIGHT_ACTIONS가 정의되어 있다', async () => {
      const { NIGHT_ACTIONS } = await import('@clocktower/shared/logic');
      expect(NIGHT_ACTIONS.thief).toBeDefined();
      expect(NIGHT_ACTIONS.thief.type).toBe('select_one');
      expect(NIGHT_ACTIONS.thief.excludeSelf).toBe(true);
      expect(NIGHT_ACTIONS.thief.includeDeadTargets).toBe(true);
    });

    it('apprentice의 NIGHT_ACTIONS가 정의되어 있다', async () => {
      const { NIGHT_ACTIONS } = await import('@clocktower/shared/logic');
      expect(NIGHT_ACTIONS.apprentice).toBeDefined();
      expect(NIGHT_ACTIONS.apprentice.type).toBe('passive');
    });

    it('bone_collector의 NIGHT_ACTIONS가 정의되어 있다', async () => {
      const { NIGHT_ACTIONS } = await import('@clocktower/shared/logic');
      expect(NIGHT_ACTIONS.bone_collector).toBeDefined();
      expect(NIGHT_ACTIONS.bone_collector.type).toBe('select_one');
      expect(NIGHT_ACTIONS.bone_collector.includeDeadTargets).toBe(true);
    });

    it('harlot의 NIGHT_ACTIONS가 정의되어 있다', async () => {
      const { NIGHT_ACTIONS } = await import('@clocktower/shared/logic');
      expect(NIGHT_ACTIONS.harlot).toBeDefined();
      expect(NIGHT_ACTIONS.harlot.type).toBe('select_one');
    });

    it('barista는 NIGHT_ACTIONS가 정의되어 있다 (passive)', async () => {
      // 바리스타는 이야기꾼이 직접 결정하므로 passive
      const { NIGHT_ACTIONS } = await import('@clocktower/shared/logic');
      expect(NIGHT_ACTIONS.barista).toBeDefined();
      expect(NIGHT_ACTIONS.barista.type).toBe('passive');
    });

    it('apprentice의 NIGHT_FEEDBACK가 role 타입이다', async () => {
      const { NIGHT_FEEDBACK } = await import('@clocktower/shared/logic');
      expect(NIGHT_FEEDBACK.apprentice).toBeDefined();
      expect(NIGHT_FEEDBACK.apprentice.type).toBe('role');
    });

    it('harlot의 NIGHT_FEEDBACK가 role 타입이다', async () => {
      const { NIGHT_FEEDBACK } = await import('@clocktower/shared/logic');
      expect(NIGHT_FEEDBACK.harlot).toBeDefined();
      expect(NIGHT_FEEDBACK.harlot.type).toBe('role');
    });

    it('밤 행동이 없는 여행자는 NIGHT_ACTIONS에 정의되지 않는다', async () => {
      const { NIGHT_ACTIONS } = await import('@clocktower/shared/logic');
      expect(NIGHT_ACTIONS.scapegoat).toBeUndefined();
      expect(NIGHT_ACTIONS.gunslinger).toBeUndefined();
      expect(NIGHT_ACTIONS.beggar).toBeUndefined();
      expect(NIGHT_ACTIONS.butcher_traveller).toBeUndefined();
      expect(NIGHT_ACTIONS.deviant).toBeUndefined();
      expect(NIGHT_ACTIONS.matron).toBeUndefined();
      expect(NIGHT_ACTIONS.voudon).toBeUndefined();
      expect(NIGHT_ACTIONS.judge).toBeUndefined();
      expect(NIGHT_ACTIONS.bishop).toBeUndefined();
    });
  });

  describe('여행자 밤 순서', () => {
    it('bureaucrat과 thief가 TB 첫째 밤 순서에 포함된다', async () => {
      const { FIRST_NIGHT_ORDER } = await import('@clocktower/shared/logic');
      expect(FIRST_NIGHT_ORDER).toContain('bureaucrat');
      expect(FIRST_NIGHT_ORDER).toContain('thief');
    });

    it('bureaucrat과 thief가 TB 이후 밤 순서에 포함된다', async () => {
      const { OTHER_NIGHT_ORDER } = await import('@clocktower/shared/logic');
      expect(OTHER_NIGHT_ORDER).toContain('bureaucrat');
      expect(OTHER_NIGHT_ORDER).toContain('thief');
    });

    it('barista가 SV 첫째 밤 순서에 포함된다', async () => {
      const { SV_FIRST_NIGHT_ORDER } = await import('@clocktower/shared/logic');
      expect(SV_FIRST_NIGHT_ORDER).toContain('barista');
    });

    it('bone_collector와 harlot이 SV 이후 밤 순서에 포함된다', async () => {
      const { SV_OTHER_NIGHT_ORDER } = await import('@clocktower/shared/logic');
      expect(SV_OTHER_NIGHT_ORDER).toContain('bone_collector');
      expect(SV_OTHER_NIGHT_ORDER).toContain('harlot');
    });

    it('barista가 SV 이후 밤 순서에 포함된다', async () => {
      const { SV_OTHER_NIGHT_ORDER } = await import('@clocktower/shared/logic');
      expect(SV_OTHER_NIGHT_ORDER).toContain('barista');
    });
  });

  describe('여행자 역할 규칙 구현', () => {
    it('거지는 항상 맑은 정신/건강 상태이며 사망하면 토큰을 잃는다', () => {
      const { gm } = createStartedGame();
      const beggar = gm.addTraveller('Beggar');
      expect(beggar).not.toBeNull();
      gm.assignTravellerRole(beggar?.id ?? '', 'beggar', 'good');

      gm.setPlayerStatuses(beggar?.id ?? '', ['poisoned', 'drunk']);
      expect(gm.getPlayer(beggar?.id ?? '')?.statuses).not.toContain(
        'poisoned',
      );
      expect(gm.getPlayer(beggar?.id ?? '')?.statuses).not.toContain('drunk');

      gm.addBeggarToken(beggar?.id ?? '');
      expect(gm.getBeggarTokens(beggar?.id ?? '')).toBe(1);

      gm.kill(beggar?.id ?? '');
      expect(gm.getBeggarTokens(beggar?.id ?? '')).toBe(0);
    });

    it('도살자는 첫 처형 후 살아있는 도살자가 추가 지명을 한 번 할 수 있다', () => {
      const { gm, players } = createStartedGame();
      const butcher = gm.addTraveller('Butcher');
      expect(butcher).not.toBeNull();
      gm.assignTravellerRole(butcher?.id ?? '', 'butcher_traveller', 'good');
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      const first = gm.nominate(players[0].id, players[1].id);
      expect(first.success).toBe(true);
      gm.markExecution();

      expect(gm.isButcherExtraNominationAvailable()).toBe(true);
      const extra = gm.nominate(butcher?.id ?? '', players[2].id);
      expect(extra.success).toBe(true);
      expect(gm.isButcherExtraNominationAvailable()).toBe(false);

      const blocked = gm.nominate(players[3].id, players[4].id);
      expect(blocked.success).toBe(false);
    });

    it('뼈 수집가는 죽은 플레이어 1명에게 오늘 능력을 되돌려준다', () => {
      const { gm, players } = createStartedGame();
      const collector = gm.addTraveller('Bone Collector');
      expect(collector).not.toBeNull();
      gm.assignTravellerRole(collector?.id ?? '', 'bone_collector', 'good');
      gm.kill(players[0].id);

      const restored = gm.restoreBoneCollectorAbility(
        collector?.id ?? '',
        players[0].id,
      );
      expect(restored).toBe(true);
      expect(gm.getPlayer(players[0].id)?.statuses).toContain(
        'bone_collector_ability',
      );
      expect(gm.getPlayer(collector?.id ?? '')?.statuses).toContain(
        'no_ability',
      );

      const second = gm.restoreBoneCollectorAbility(
        collector?.id ?? '',
        players[1].id,
      );
      expect(second).toBe(false);

      gm.setPhase('night');
      expect(gm.getPlayer(players[0].id)?.statuses).not.toContain(
        'bone_collector_ability',
      );
      expect(gm.getPlayer(collector?.id ?? '')?.statuses).toContain(
        'no_ability',
      );
    });

    it('바리스타는 대상에게 맑은 정신/건강 또는 능력 2회 발동 상태를 부여한다', () => {
      const { gm, players } = createStartedGame();
      const barista = gm.addTraveller('Barista');
      expect(barista).not.toBeNull();
      gm.assignTravellerRole(barista?.id ?? '', 'barista', 'good');
      const targetId = players[0].id;

      gm.setPlayerStatuses(targetId, ['poisoned', 'drunk']);
      expect(gm.getPlayer(targetId)?.statuses).toEqual(['poisoned', 'drunk']);

      expect(gm.applyBaristaEffect(targetId, 'sober_healthy')).toBe(true);
      expect(gm.getPlayer(targetId)?.statuses).toContain(
        'barista_sober_healthy',
      );
      expect(gm.getPlayer(targetId)?.statuses).not.toContain('poisoned');
      expect(gm.getPlayer(targetId)?.statuses).not.toContain('drunk');

      gm.setPlayerStatuses(targetId, [
        ...(gm.getPlayer(targetId)?.statuses ?? []),
        'poisoned',
      ]);
      expect(gm.getPlayer(targetId)?.statuses).not.toContain('poisoned');

      gm.setPhase('day');
      expect(gm.getPlayer(targetId)?.statuses).toContain(
        'barista_sober_healthy',
      );
      gm.setPhase('night');
      expect(gm.getPlayer(targetId)?.statuses).not.toContain(
        'barista_sober_healthy',
      );

      expect(gm.applyBaristaEffect(targetId, 'acts_twice')).toBe(true);
      expect(gm.getPlayer(targetId)?.statuses).toContain('barista_acts_twice');
    });

    it('취하거나 중독된 바리스타는 효과를 부여하지 못한다', () => {
      const { gm, players } = createStartedGame();
      const barista = gm.addTraveller('Barista');
      expect(barista).not.toBeNull();
      gm.assignTravellerRole(barista?.id ?? '', 'barista', 'good');
      gm.setPlayerStatuses(barista?.id ?? '', ['drunk']);

      const targetId = players[0].id;
      expect(gm.applyBaristaEffect(targetId, 'acts_twice')).toBe(false);
      expect(gm.getPlayer(targetId)?.statuses).not.toContain(
        'barista_acts_twice',
      );
    });

    it('취하거나 중독된 희생양은 처형 후보 교체 대상이 되지 않는다', () => {
      const { gm, players } = createStartedGame();
      const scapegoat = gm.addTraveller('Scapegoat');
      expect(scapegoat).not.toBeNull();
      gm.assignTravellerRole(scapegoat?.id ?? '', 'scapegoat', 'good');
      gm.setPhase('day');
      gm.setDaySubPhase('nomination');

      const nomination = gm.nominate(players[0].id, players[1].id);
      expect(nomination.success).toBe(true);
      for (const voter of players.slice(0, 3)) {
        expect(gm.castVote(voter.id).success).toBe(true);
      }
      expect(gm.closeVote()?.executionCandidate?.playerId).toBe(players[1].id);

      gm.setPlayerStatuses(scapegoat?.id ?? '', ['drunk']);
      expect(gm.findScapegoatForCandidate(players[1].id)).toBeNull();
    });

    it('익살꾼 추방 투표가 통과하면 이야기꾼 판정이 필요하다', () => {
      const { gm, players } = createStartedGame();
      const deviant = gm.addTraveller('Deviant');
      expect(deviant).not.toBeNull();
      gm.assignTravellerRole(deviant?.id ?? '', 'deviant', 'good');
      gm.setPhase('day');

      const started = gm.startExileVote(players[0].id, deviant?.id ?? '');
      expect(started.success).toBe(true);
      for (const player of gm.getState().players) {
        const result = gm.castExileVote(player.id, true);
        expect(result.success).toBe(true);
      }

      expect(gm.shouldRequestDeviantExileJudgement()).toBe(true);
      expect(gm.getPlayer(deviant?.id ?? '')?.isAlive).toBe(true);

      const closeResult = gm.closeExileVote(true);
      expect(closeResult?.exiled).toBe(true);
      expect(gm.getPlayer(deviant?.id ?? '')?.isAlive).toBe(false);
    });

    it('취하거나 중독된 익살꾼은 추방 판정 요청을 만들지 않는다', () => {
      const { gm, players } = createStartedGame();
      const deviant = gm.addTraveller('Deviant');
      expect(deviant).not.toBeNull();
      gm.assignTravellerRole(deviant?.id ?? '', 'deviant', 'good');
      gm.setPlayerStatuses(deviant?.id ?? '', ['poisoned']);
      gm.setPhase('day');

      const started = gm.startExileVote(players[0].id, deviant?.id ?? '');
      expect(started.success).toBe(true);
      for (const player of gm.getState().players) {
        const result = gm.castExileVote(player.id, true);
        expect(result.success).toBe(true);
      }

      expect(gm.shouldRequestDeviantExileJudgement()).toBe(false);
    });

    it('취하거나 중독된 매춘부는 동의를 받아도 실제 역할명을 받지 않는다', () => {
      const { gm, players } = createStartedGame();
      const harlot = gm.addTraveller('Harlot');
      expect(harlot).not.toBeNull();
      gm.assignTravellerRole(harlot?.id ?? '', 'harlot', 'good');
      gm.setPlayerStatuses(harlot?.id ?? '', ['drunk']);

      const request = gm.requestHarlotConsent(harlot?.id ?? '', players[0].id);
      expect(request).not.toBeNull();

      const result = gm.resolveHarlotConsent(
        players[0].id,
        harlot?.id ?? '',
        true,
      );
      expect(result?.accepted).toBe(true);
      expect(result?.targetRoleName).toBeUndefined();
      expect(result?.needsFalseInfo).toBe(true);
    });
  });

  describe('여행자 CHARACTER_TIPS', () => {
    it('모든 여행자 역할에 팁이 정의되어 있다', async () => {
      const { getCharacterTips } = await import('@clocktower/shared/logic');
      const travellerRoleIds = [
        'scapegoat',
        'gunslinger',
        'beggar',
        'bureaucrat',
        'thief',
        'butcher_traveller',
        'bone_collector',
        'harlot',
        'barista',
        'deviant',
        'apprentice',
        'matron',
        'voudon',
        'judge',
        'bishop',
      ];

      for (const roleId of travellerRoleIds) {
        const tips = getCharacterTips(roleId);
        expect(tips, `${roleId}의 팁이 없습니다`).not.toBeNull();
        expect(
          tips?.playTips.length,
          `${roleId}의 playTips가 비어있습니다`,
        ).toBeGreaterThan(0);
        expect(
          tips?.counterTips.length,
          `${roleId}의 counterTips가 비어있습니다`,
        ).toBeGreaterThan(0);
      }
    });
  });
});
