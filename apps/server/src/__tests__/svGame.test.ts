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

    it('취하거나 중독된 팡 구는 외지인 교환을 할 수 없다', () => {
      const { gm, players } = createSVGame(8);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'sweetheart');
      gm.assignRole(players[6].id, 'witch');
      gm.assignRole(players[7].id, 'fang_gu');
      gm.start();
      gm.setPlayerStatuses(players[7].id, ['poisoned']);

      const result = gm.handleFangGuJump(players[7].id, players[5].id);

      expect(result).toBeNull();
      expect(gm.getPlayer(players[5].id)?.role?.id).toBe('sweetheart');
      expect(gm.getPlayer(players[7].id)?.isAlive).toBe(true);
    });
  });

  describe('마귀할멈 역할 변경', () => {
    it('역할이 정상적으로 변경된다', () => {
      const { gm, players } = createStartedSVGame();
      const success = gm.changePlayerRole(players[0].id, 'artist');
      expect(success).toBe(true);
      expect(gm.getPlayer(players[0].id)?.role?.id).toBe('artist');
    });

    it('역할 변경은 플레이어의 현재 진영을 바꾸지 않는다', () => {
      const { gm, players } = createStartedSVGame();
      expect(gm.getPlayerAlignment(players[0].id)).toBe('good');

      const success = gm.changePlayerRole(players[0].id, 'vortox');

      expect(success).toBe(true);
      expect(gm.getPlayer(players[0].id)?.role?.id).toBe('vortox');
      expect(gm.getPlayerAlignment(players[0].id)).toBe('good');
    });

    it('이미 게임에 있는 역할로는 변경할 수 없다', () => {
      const { gm, players } = createStartedSVGame();
      // dreamer는 이미 players[1]에 배정됨
      const success = gm.changePlayerRole(players[0].id, 'dreamer');
      expect(success).toBe(false);
    });

    it('취하거나 중독된 마귀할멈은 역할을 변경할 수 없다', () => {
      const { gm, players } = createStartedSVGame();
      gm.changePlayerRole(players[5].id, 'pit_hag');
      gm.setPlayerStatuses(players[5].id, ['drunk']);

      const success = gm.changePlayerRole(
        players[0].id,
        'artist',
        players[5].id,
      );

      expect(success).toBe(false);
      expect(gm.getPlayer(players[0].id)?.role?.id).toBe('clockmaker');
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

    it('역할 교환은 두 플레이어의 현재 진영을 유지한다', () => {
      const { gm, players } = createStartedSVGame();
      expect(gm.getPlayerAlignment(players[0].id)).toBe('good');
      expect(gm.getPlayerAlignment(players[6].id)).toBe('evil');

      gm.swapPlayerRoles(players[0].id, players[6].id);

      expect(gm.getPlayer(players[0].id)?.role?.id).toBe('fang_gu');
      expect(gm.getPlayer(players[6].id)?.role?.id).toBe('clockmaker');
      expect(gm.getPlayerAlignment(players[0].id)).toBe('good');
      expect(gm.getPlayerAlignment(players[6].id)).toBe('evil');
    });
  });

  describe('뱀 조련사 역할 교환', () => {
    it('악마를 선택하면 직업과 진영을 교환하고 새 뱀 조련사가 중독된다', () => {
      const { gm, players } = createStartedSVGame();
      gm.changePlayerRole(players[0].id, 'snake_charmer');

      const result = gm.handleSnakeCharmerSwap(players[0].id, players[6].id);

      expect(result).not.toBeNull();
      expect(gm.getPlayer(players[0].id)?.role?.id).toBe('fang_gu');
      expect(gm.getPlayer(players[6].id)?.role?.id).toBe('snake_charmer');
      expect(gm.getPlayerAlignment(players[0].id)).toBe('evil');
      expect(gm.getPlayerAlignment(players[6].id)).toBe('good');
      expect(gm.getPlayer(players[6].id)?.statuses).toContain('poisoned');
    });

    it('악마가 아닌 플레이어를 선택하면 교환하지 않는다', () => {
      const { gm, players } = createStartedSVGame();
      gm.changePlayerRole(players[0].id, 'snake_charmer');

      const result = gm.handleSnakeCharmerSwap(players[0].id, players[1].id);

      expect(result).toBeNull();
      expect(gm.getPlayer(players[0].id)?.role?.id).toBe('snake_charmer');
      expect(gm.getPlayer(players[1].id)?.role?.id).toBe('dreamer');
    });

    it('취하거나 중독된 뱀 조련사는 악마를 선택해도 교환하지 않는다', () => {
      const { gm, players } = createStartedSVGame();
      gm.changePlayerRole(players[0].id, 'snake_charmer');
      gm.setPlayerStatuses(players[0].id, ['poisoned']);

      const result = gm.handleSnakeCharmerSwap(players[0].id, players[6].id);

      expect(result).toBeNull();
      expect(gm.getPlayer(players[0].id)?.role?.id).toBe('snake_charmer');
      expect(gm.getPlayer(players[6].id)?.role?.id).toBe('fang_gu');
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

    it('사망한 마을주민도 노 다시의 이웃 후보에 포함한다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'no_dashii');
      gm.assignRole(players[4].id, 'oracle');
      gm.assignRole(players[5].id, 'witch');
      gm.assignRole(players[6].id, 'seamstress');
      gm.start();
      gm.kill(players[4].id);

      const neighbors = gm.getNoDashiiPoisonedNeighbors(players[3].id);

      expect(neighbors).toContain(players[4].id);
      expect(neighbors).toContain(players[2].id);
    });

    it('노 다시 이웃은 지속 중독 상태를 받고 노 다시가 죽으면 해제된다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'no_dashii');
      gm.assignRole(players[4].id, 'oracle');
      gm.assignRole(players[5].id, 'witch');
      gm.assignRole(players[6].id, 'seamstress');
      gm.start();

      expect(gm.getPlayer(players[2].id)?.statuses).toContain(
        'no_dashii_poisoned',
      );
      expect(gm.getPlayer(players[4].id)?.statuses).toContain(
        'no_dashii_poisoned',
      );

      gm.kill(players[3].id);

      expect(gm.getPlayer(players[2].id)?.statuses).not.toContain(
        'no_dashii_poisoned',
      );
      expect(gm.getPlayer(players[4].id)?.statuses).not.toContain(
        'no_dashii_poisoned',
      );
    });
  });

  describe('비고르모르티스', () => {
    it('죽인 하수인은 능력을 유지하고 선택한 마을주민 이웃을 중독한다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'witch');
      gm.assignRole(players[2].id, 'dreamer');
      gm.assignRole(players[3].id, 'flowergirl');
      gm.assignRole(players[4].id, 'oracle');
      gm.assignRole(players[5].id, 'seamstress');
      gm.assignRole(players[6].id, 'vigormortis');
      gm.start();

      const result = gm.handleVigormortisMinionKill(
        players[6].id,
        players[1].id,
        players[2].id,
      );

      expect(result?.minion.id).toBe(players[1].id);
      expect(gm.getPlayer(players[1].id)?.isAlive).toBe(false);
      expect(gm.getPlayer(players[1].id)?.statuses).toContain(
        'vigormortis_retained',
      );
      expect(gm.getPlayer(players[2].id)?.statuses).toContain(
        'vigormortis_poisoned',
      );
    });

    it('비고르모르티스가 죽으면 유지 능력과 중독이 해제된다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'witch');
      gm.assignRole(players[2].id, 'dreamer');
      gm.assignRole(players[3].id, 'flowergirl');
      gm.assignRole(players[4].id, 'oracle');
      gm.assignRole(players[5].id, 'seamstress');
      gm.assignRole(players[6].id, 'vigormortis');
      gm.start();

      gm.handleVigormortisMinionKill(
        players[6].id,
        players[1].id,
        players[2].id,
      );
      gm.kill(players[6].id);

      expect(gm.getPlayer(players[1].id)?.statuses).not.toContain(
        'vigormortis_retained',
      );
      expect(gm.getPlayer(players[2].id)?.statuses).not.toContain(
        'vigormortis_poisoned',
      );
    });

    it('비고르모르티스가 일시적으로 중독되면 유지/이웃 중독만 잠시 꺼진다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'witch');
      gm.assignRole(players[2].id, 'dreamer');
      gm.assignRole(players[3].id, 'flowergirl');
      gm.assignRole(players[4].id, 'oracle');
      gm.assignRole(players[5].id, 'seamstress');
      gm.assignRole(players[6].id, 'vigormortis');
      gm.start();

      gm.handleVigormortisMinionKill(
        players[6].id,
        players[1].id,
        players[2].id,
      );
      gm.setPlayerStatuses(players[6].id, ['poisoned']);

      expect(gm.getPlayer(players[1].id)?.statuses).not.toContain(
        'vigormortis_retained',
      );
      expect(gm.getPlayer(players[2].id)?.statuses).not.toContain(
        'vigormortis_poisoned',
      );

      gm.setPlayerStatuses(players[6].id, []);

      expect(gm.getPlayer(players[1].id)?.statuses).toContain(
        'vigormortis_retained',
      );
      expect(gm.getPlayer(players[2].id)?.statuses).toContain(
        'vigormortis_poisoned',
      );
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

    it('처형 없는 날이 끝나면 악 팀 승리 결과를 만든다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'witch');
      gm.assignRole(players[6].id, 'vortox');
      gm.start();
      gm.setPhase('day');

      const result = gm.checkVortoxNoExecutionWin();

      expect(result?.winningTeam).toBe('evil');
      expect(result?.cause).toBe('vortox_no_execution');
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

  describe('create() S&V 상태 초기화', () => {
    it('create() 호출 시 S&V 전용 상태가 초기화된다', () => {
      const gm = new GameManager();
      gm.create();
      const players: Player[] = [];
      for (let i = 0; i < 7; i++) {
        const p = gm.addPlayer(`P${i}`);
        if (p) players.push(p);
      }
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'witch');
      gm.assignRole(players[6].id, 'fang_gu');
      gm.start();
      gm.detectEdition();
      gm.setWitchCursedTarget(players[0].id);
      gm.setEvilTwinPair(players[5].id, players[0].id);

      gm.create();
      expect(gm.getWitchCursedTarget()).toBeNull();
      expect(gm.isFangGuJumped()).toBe(false);
      expect(gm.getEditionId()).toBe('trouble_brewing');
    });
  });

  describe('마녀 저주 setPlayerStatuses 동기화', () => {
    it('witch_cursed 상태 추가 시 witchCursedTarget이 동기화된다', () => {
      const { gm, players } = createStartedSVGame();
      gm.setPlayerStatuses(players[0].id, ['witch_cursed']);
      expect(gm.getWitchCursedTarget()).toBe(players[0].id);
    });

    it('witch_cursed 상태 제거 시 witchCursedTarget이 null이 된다', () => {
      const { gm, players } = createStartedSVGame();
      gm.setWitchCursedTarget(players[0].id);
      expect(gm.getWitchCursedTarget()).toBe(players[0].id);
      gm.setPlayerStatuses(players[0].id, []);
      expect(gm.getWitchCursedTarget()).toBeNull();
    });
  });

  describe('endGame 메서드', () => {
    it('endGame() 호출 시 phase가 ended로 변경된다', () => {
      const { gm } = createStartedSVGame();
      gm.endGame();
      expect(gm.getState().phase).toBe('ended');
    });
  });

  describe('사악한 쌍둥이 상태', () => {
    it('사악한 쌍둥이는 선한 쌍둥이가 살아있으면 선 팀 승리를 막는다', () => {
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
      expect(evilTwin?.statuses).toContain('evil_twin');
      expect(gm.getGoodTwinId(players[5].id)).toBe(players[0].id);
      expect(gm.getPlayer(players[0].id)?.isAlive).toBe(true);
    });
  });

  describe('팡 구 사망한 외지인 대상 교환 거부', () => {
    it('사망한 외지인에 대한 팡 구 점프가 거부된다', () => {
      const { gm, players } = createSVGame(8);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'sweetheart');
      gm.assignRole(players[6].id, 'witch');
      gm.assignRole(players[7].id, 'fang_gu');
      gm.start();

      gm.kill(players[5].id);
      const result = gm.handleFangGuJump(players[7].id, players[5].id);
      expect(result).toBeNull();
    });
  });

  describe('은둔자/첩자 위장과 S&V 판정', () => {
    it('시계공은 misregistered 은둔자를 악마 후보로 계산한다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'recluse');
      gm.assignRole(players[2].id, 'witch');
      gm.assignRole(players[3].id, 'dreamer');
      gm.assignRole(players[4].id, 'flowergirl');
      gm.assignRole(players[5].id, 'oracle');
      gm.assignRole(players[6].id, 'fang_gu');
      gm.start();
      gm.setPlayerStatuses(players[1].id, ['misregistered']);

      expect(gm.getClockmakerDistance()).toBe(1);
    });

    it('팡 구는 misregistered 은둔자를 외지인이 아닌 악으로 등록해 점프하지 않는다', () => {
      const { gm, players } = createSVGame(8);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'recluse');
      gm.assignRole(players[6].id, 'witch');
      gm.assignRole(players[7].id, 'fang_gu');
      gm.start();
      gm.setPlayerStatuses(players[5].id, ['misregistered']);

      expect(gm.handleFangGuJump(players[7].id, players[5].id)).toBeNull();
    });

    it('비고르모르티스는 misregistered 은둔자를 하수인으로 등록해 죽일 수 있다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'clockmaker');
      gm.assignRole(players[1].id, 'recluse');
      gm.assignRole(players[2].id, 'dreamer');
      gm.assignRole(players[3].id, 'flowergirl');
      gm.assignRole(players[4].id, 'oracle');
      gm.assignRole(players[5].id, 'witch');
      gm.assignRole(players[6].id, 'vigormortis');
      gm.start();
      gm.setPlayerStatuses(players[1].id, ['misregistered']);

      const result = gm.handleVigormortisMinionKill(
        players[6].id,
        players[1].id,
        players[2].id,
      );

      expect(result).not.toBeNull();
      expect(gm.getPlayer(players[1].id)?.isAlive).toBe(false);
    });
  });

  describe('이발사 역할 교환 시 부가 상태 동기화', () => {
    it('점쟁이가 교환되면 Red Herring이 재배정된다', () => {
      const { gm, players } = createSVGame(7);
      gm.assignRole(players[0].id, 'fortune_teller');
      gm.assignRole(players[1].id, 'dreamer');
      gm.assignRole(players[2].id, 'flowergirl');
      gm.assignRole(players[3].id, 'oracle');
      gm.assignRole(players[4].id, 'seamstress');
      gm.assignRole(players[5].id, 'witch');
      gm.assignRole(players[6].id, 'fang_gu');
      gm.start();
      gm.assignFortuneTellerRedHerring();
      const oldRedHerring = gm.getRedHerringId();
      expect(oldRedHerring).not.toBeNull();

      gm.swapPlayerRoles(players[0].id, players[1].id);
      const newRedHerring = gm.getRedHerringId();
      expect(newRedHerring).not.toBeNull();
    });
  });
});
