import type { Player } from '@clocktower/shared/logic';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../game.js';

let uuidCounter = 0;
vi.mock('node:crypto', () => ({
  randomUUID: () =>
    `${String(++uuidCounter).padStart(8, '0')}-0000-0000-0000-000000000000`,
}));

function createSVGame(playerCount = 7) {
  const gm = new GameManager();
  gm.create();
  const players: Player[] = [];
  for (let i = 0; i < playerCount; i++) {
    const p = gm.addPlayer(`Player${i + 1}`);
    if (p) players.push(p);
  }
  return { gm, players };
}

function createStartedSVGame() {
  const { gm, players } = createSVGame(7);
  gm.assignRole(players[0].id, 'clockmaker');
  gm.assignRole(players[1].id, 'dreamer');
  gm.assignRole(players[2].id, 'flowergirl');
  gm.assignRole(players[3].id, 'oracle');
  gm.assignRole(players[4].id, 'seamstress');
  gm.assignRole(players[5].id, 'witch');
  gm.assignRole(players[6].id, 'fang_gu');
  gm.start();
  gm.detectEdition();
  return { gm, players };
}

describe('S&V GameManager', () => {
  beforeEach(() => {
    uuidCounter = 0;
  });

  describe('에디션 감지', () => {
    it('S&V 역할이 있으면 sects_and_violets로 감지된다', () => {
      const { gm } = createStartedSVGame();
      expect(gm.getEditionId()).toBe('sects_and_violets');
    });

    it('TB 역할만 있으면 trouble_brewing으로 감지된다', () => {
      const { gm, players } = createSVGame(5);
      gm.assignRole(players[0].id, 'washerwoman');
      gm.assignRole(players[1].id, 'empath');
      gm.assignRole(players[2].id, 'fortune_teller');
      gm.assignRole(players[3].id, 'poisoner');
      gm.assignRole(players[4].id, 'imp');
      gm.start();
      gm.detectEdition();
      expect(gm.getEditionId()).toBe('trouble_brewing');
    });
  });

  describe('마녀 저주', () => {
    it('마녀 저주 대상을 설정하면 witch_cursed 상태가 부여된다', () => {
      const { gm, players } = createStartedSVGame();
      gm.setWitchCursedTarget(players[0].id);
      const player = gm.getPlayer(players[0].id);
      expect(player?.statuses).toContain('witch_cursed');
      expect(gm.getWitchCursedTarget()).toBe(players[0].id);
    });

    it('저주 대상이 지명하면 checkWitchCurse가 true를 반환한다', () => {
      const { gm, players } = createStartedSVGame();
      gm.setPhase('day');
      gm.setWitchCursedTarget(players[0].id);
      expect(gm.checkWitchCurse(players[0].id)).toBe(true);
    });

    it('저주 대상이 아닌 플레이어가 지명하면 false를 반환한다', () => {
      const { gm, players } = createStartedSVGame();
      gm.setPhase('day');
      gm.setWitchCursedTarget(players[0].id);
      expect(gm.checkWitchCurse(players[1].id)).toBe(false);
    });

    it('생존자 3명 이하이면 저주가 무효화된다', () => {
      const { gm, players } = createStartedSVGame();
      gm.setPhase('day');
      gm.setWitchCursedTarget(players[0].id);
      // 4명 죽이기 → 3명 남음
      gm.kill(players[1].id);
      gm.kill(players[2].id);
      gm.kill(players[3].id);
      gm.kill(players[4].id);
      expect(gm.checkWitchCurse(players[0].id)).toBe(false);
    });

    it('마녀가 중독 상태면 저주가 무효화된다', () => {
      const { gm, players } = createStartedSVGame();
      gm.setPhase('day');
      gm.setWitchCursedTarget(players[0].id);
      // 마녀(players[5])를 중독
      gm.setPlayerStatuses(players[5].id, ['poisoned']);
      expect(gm.checkWitchCurse(players[0].id)).toBe(false);
    });

    it('밤 전환 시 저주가 초기화된다', () => {
      const { gm, players } = createStartedSVGame();
      gm.setWitchCursedTarget(players[0].id);
      gm.setPhase('night');
      expect(gm.getWitchCursedTarget()).toBeNull();
      const player = gm.getPlayer(players[0].id);
      expect(player?.statuses).not.toContain('witch_cursed');
    });
  });

  describe('사악한 쌍둥이', () => {
    it('쌍둥이 페어를 설정하면 양쪽에 상태가 부여된다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'evil_twin');
      gm.assignRole(players[6].id, 'fang_gu');
      gm.start();

      gm.setEvilTwinPair(players[5].id, players[0].id);
      const evilTwin = gm.getPlayer(players[5].id);
      const goodTwin = gm.getPlayer(players[0].id);
      expect(evilTwin?.statuses).toContain('evil_twin');
      expect(goodTwin?.statuses).toContain('good_twin');
    });

    it('선한 쌍둥이 처형 시 isGoodTwinExecution이 true', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'evil_twin');
      gm.assignRole(players[6].id, 'fang_gu');
      gm.start();
      gm.setEvilTwinPair(players[5].id, players[0].id);

      expect(gm.isGoodTwinExecution(players[0].id)).toBe(true);
      expect(gm.isGoodTwinExecution(players[1].id)).toBe(false);
    });

    it('악마 사망 시 쌍둥이 둘 다 살아있으면 게임 계속', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'evil_twin');
      gm.assignRole(players[6].id, 'fang_gu');
      gm.start();
      gm.setEvilTwinPair(players[5].id, players[0].id);

      // 악마 사망
      gm.kill(players[6].id);
      const result = gm.checkWinCondition();
      // 쌍둥이 둘 다 살아있으므로 게임 계속
      expect(result).toBeNull();
    });
  });

  describe('팡 구', () => {
    it('외지인 대상 첫 교환이 성공한다', () => {
      const { gm, players } = createSVGame(8);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'sweetheart'); // outsider
      gm.assignRole(players[6].id, 'witch');
      gm.assignRole(players[7].id, 'fang_gu');
      gm.start();

      const result = gm.handleFangGuJump(players[7].id, players[5].id);
      expect(result).not.toBeNull();
      expect(result?.newDemon.id).toBe(players[5].id);
      expect(gm.getPlayer(players[5].id)?.role?.id).toBe('fang_gu');
      expect(gm.getPlayer(players[7].id)?.isAlive).toBe(false);
      expect(gm.isFangGuJumped()).toBe(true);
    });

    it('두 번째 교환은 실패한다', () => {
      const { gm, players } = createSVGame(9);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'sweetheart');
      gm.assignRole(players[6].id, 'mutant');
      gm.assignRole(players[7].id, 'witch');
      gm.assignRole(players[8].id, 'fang_gu');
      gm.start();

      gm.handleFangGuJump(players[8].id, players[5].id);
      const second = gm.handleFangGuJump(players[5].id, players[6].id);
      expect(second).toBeNull();
    });

    it('마을주민 대상 교환은 실패한다', () => {
      const { gm, players } = createStartedSVGame();
      const result = gm.handleFangGuJump(players[6].id, players[0].id);
      expect(result).toBeNull();
    });
  });

  describe('마귀할멈 역할 변경', () => {
    it('역할이 정상적으로 변경된다', () => {
      const { gm, players } = createStartedSVGame();
      const success = gm.changePlayerRole(players[0].id, 'artist');
      expect(success).toBe(true);
      expect(gm.getPlayer(players[0].id)?.role?.id).toBe('artist');
    });

    it('이미 게임에 있는 역할로는 변경할 수 없다', () => {
      const { gm, players } = createStartedSVGame();
      // dreamer는 이미 players[1]에 배정됨
      const success = gm.changePlayerRole(players[0].id, 'dreamer');
      expect(success).toBe(false);
    });
  });

  describe('이발사 역할 교환', () => {
    it('두 플레이어의 역할이 교환된다', () => {
      const { gm, players } = createStartedSVGame();
      const role0 = gm.getPlayer(players[0].id)?.role?.id;
      const role1 = gm.getPlayer(players[1].id)?.role?.id;

      gm.swapPlayerRoles(players[0].id, players[1].id);

      expect(gm.getPlayer(players[0].id)?.role?.id).toBe(role1);
      expect(gm.getPlayer(players[1].id)?.role?.id).toBe(role0);
    });
  });

  describe('시계공 거리 계산', () => {
    it('악마와 가장 가까운 하수인 사이의 거리를 계산한다', () => {
      const { gm } = createStartedSVGame();
      // playerOrder: [p0, p1, p2, p3, p4, p5(witch), p6(fang_gu)]
      // witch(5)와 fang_gu(6) 거리 = 1
      const distance = gm.getClockmakerDistance();
      expect(distance).toBe(1);
    });
  });

  describe('노 다시 인접 마을주민 중독', () => {
    it('양쪽 가장 가까운 마을주민을 찾는다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'no_dashii');
      gm.assignRole(players[4].id, 'oracle');
      gm.assignRole(players[5].id, 'witch');
      gm.assignRole(players[6].id, 'seamstress');
      gm.start();

      const neighbors = gm.getNoDashiiPoisonedNeighbors(players[3].id);
      // 시계방향: players[4] (oracle, townsfolk)
      // 반시계방향: players[2] (flowergirl, townsfolk)
      expect(neighbors).toHaveLength(2);
      expect(neighbors).toContain(players[4].id);
      expect(neighbors).toContain(players[2].id);
    });
  });

  describe('보르톡스', () => {
    it('보르톡스가 게임에 있으면 hasVortox가 true', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'witch');
      gm.assignRole(players[6].id, 'vortox');
      gm.start();
      expect(gm.hasVortox()).toBe(true);
    });

    it('보르톡스가 없으면 hasVortox가 false', () => {
      const { gm } = createStartedSVGame();
      expect(gm.hasVortox()).toBe(false);
    });
  });

  describe('승리 조건', () => {
    it('선한 쌍둥이 처형 → 악 팀 승리', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'evil_twin');
      gm.assignRole(players[6].id, 'fang_gu');
      gm.start();
      gm.setEvilTwinPair(players[5].id, players[0].id);

      gm.kill(players[0].id);
      const result = gm.checkWinCondition('clockmaker', players[0].id);
      expect(result).not.toBeNull();
      expect(result?.winningTeam).toBe('evil');
      expect(result?.reason).toContain('쌍둥이');
    });
  });
});
