import type { Player } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import {
  getAbilityMalfunctionWarning,
  getActionTargetKey,
  getChefHint,
  getEmpathHint,
  getKillActionBlockReason,
  isAbilityMalfunctioning,
  isDetectedAsEvil,
} from '../nightRoleLogic';

function player(overrides: Partial<Player> & { id: string }): Player {
  return {
    ...overrides,
    id: overrides.id,
    name: overrides.name ?? overrides.id,
    isAlive: overrides.isAlive ?? true,
    hasNominatedToday: false,
    hasBeenNominatedToday: false,
    deadVoteUsed: false,
    statuses: overrides.statuses ?? [],
  };
}

describe('nightRoleLogic', () => {
  describe('isDetectedAsEvil', () => {
    it('은둔자/첩자 위장과 여행자 진영을 정보 판정에 반영한다', () => {
      expect(
        isDetectedAsEvil(
          player({
            id: 'recluse',
            role: {
              id: 'recluse',
              name: '은둔자',
              team: 'outsider',
              ability: '',
              edition: 'trouble_brewing',
            },
            statuses: ['misregistered'],
          }),
        ),
      ).toBe(true);

      expect(
        isDetectedAsEvil(
          player({
            id: 'spy',
            role: {
              id: 'spy',
              name: '첩자',
              team: 'minion',
              ability: '',
              edition: 'trouble_brewing',
            },
            statuses: ['misregistered'],
          }),
        ),
      ).toBe(false);

      expect(
        isDetectedAsEvil(
          player({
            id: 'traveller',
            isTraveller: true,
            travellerAlignment: 'evil',
            role: {
              id: 'harlot',
              name: '매춘부',
              team: 'traveller',
              ability: '',
              edition: 'sects_and_violets',
            },
          }),
        ),
      ).toBe(true);
    });
  });

  it('초공감자 힌트는 위장 판정을 사용한다', () => {
    const players = [
      player({
        id: 'empath',
        role: {
          id: 'empath',
          name: '초공감자',
          team: 'townsfolk',
          ability: '',
          edition: 'trouble_brewing',
        },
      }),
      player({
        id: 'recluse',
        role: {
          id: 'recluse',
          name: '은둔자',
          team: 'outsider',
          ability: '',
          edition: 'trouble_brewing',
        },
        statuses: ['misregistered'],
      }),
      player({
        id: 'washerwoman',
        role: {
          id: 'washerwoman',
          name: '세탁부',
          team: 'townsfolk',
          ability: '',
          edition: 'trouble_brewing',
        },
      }),
    ];

    const hint = getEmpathHint(players, ['empath', 'recluse', 'washerwoman']);

    expect(hint.evilCount).toBe(1);
    expect(hint.neighbors.find((n) => n.id === 'recluse')?.isEvil).toBe(true);
  });

  it('요리사 힌트는 위장된 첩자를 악한 쌍에서 제외한다', () => {
    const players = [
      player({
        id: 'chef',
        role: {
          id: 'chef',
          name: '요리사',
          team: 'townsfolk',
          ability: '',
          edition: 'trouble_brewing',
        },
      }),
      player({
        id: 'spy',
        role: {
          id: 'spy',
          name: '첩자',
          team: 'minion',
          ability: '',
          edition: 'trouble_brewing',
        },
        statuses: ['misregistered'],
      }),
      player({
        id: 'imp',
        role: {
          id: 'imp',
          name: '임프',
          team: 'demon',
          ability: '',
          edition: 'trouble_brewing',
        },
      }),
    ];

    const hint = getChefHint(players, ['chef', 'spy', 'imp']);

    expect(hint.evilPairCount).toBe(0);
    expect(hint.evilPairIds.size).toBe(0);
  });

  it('중독/취함 능력 무효와 바리스타 맑음/건강 예외를 구분한다', () => {
    expect(
      isAbilityMalfunctioning(player({ id: 'p1', statuses: ['poisoned'] })),
    ).toBe(true);
    expect(
      isAbilityMalfunctioning(
        player({ id: 'p2', statuses: ['poisoned', 'barista_sober_healthy'] }),
      ),
    ).toBe(false);
  });

  it('중독/취함 정보 역할에 호스트 경고 문구를 제공한다', () => {
    expect(
      getAbilityMalfunctionWarning(
        player({ id: 'savant', statuses: ['poisoned'] }),
      ),
    ).toBe(
      '주의: 이 플레이어는 중독/취함 상태입니다. 규칙에 맞게 잘못된 정보를 제공하세요.',
    );
    expect(
      getAbilityMalfunctionWarning(
        player({
          id: 'drunk-artist',
          role: {
            id: 'drunk',
            name: '주정뱅이',
            team: 'outsider',
            ability: '',
            edition: 'trouble_brewing',
          },
          drunkAs: 'artist',
        }),
      ),
    ).toBe(
      '주의: 이 플레이어는 중독/취함 상태입니다. 규칙에 맞게 잘못된 정보를 제공하세요.',
    );
    expect(
      getAbilityMalfunctionWarning(
        player({
          id: 'barista',
          statuses: ['poisoned', 'barista_sober_healthy'],
        }),
      ),
    ).toBeNull();
  });

  it('악마 사망 처리 버튼은 행동자 무효와 군인 무효 상태를 반영한다', () => {
    const demon = player({
      id: 'demon',
      statuses: ['poisoned'],
      role: {
        id: 'imp',
        name: '임프',
        team: 'demon',
        ability: '',
        edition: 'trouble_brewing',
      },
    });
    const soldier = player({
      id: 'soldier',
      statuses: ['drunk'],
      role: {
        id: 'soldier',
        name: '군인',
        team: 'townsfolk',
        ability: '',
        edition: 'trouble_brewing',
      },
    });

    expect(getKillActionBlockReason('imp', demon, soldier)).toBe(
      'actor_malfunctioning',
    );
    expect(
      getKillActionBlockReason('imp', { ...demon, statuses: [] }, soldier),
    ).toBeNull();
  });

  it.each([
    'poisoned',
    'drunk',
  ] as const)('%s 상태의 군인은 임프 처치 면역을 제공하지 않는다', (status) => {
    const demon = player({
      id: 'demon',
      role: {
        id: 'imp',
        name: '임프',
        team: 'demon',
        ability: '',
        edition: 'trouble_brewing',
      },
    });
    const malfunctioningSoldier = player({
      id: 'soldier',
      statuses: [status],
      role: {
        id: 'soldier',
        name: '군인',
        team: 'townsfolk',
        ability: '',
        edition: 'trouble_brewing',
      },
    });

    expect(
      getKillActionBlockReason('imp', demon, malfunctioningSoldier),
    ).toBeNull();
  });

  it.each([
    'poisoned',
    'drunk',
  ] as const)('%s 상태의 수도사는 보호 처리 능력이 무효다', (status) => {
    const malfunctioningMonk = player({
      id: 'monk',
      statuses: [status],
      role: {
        id: 'monk',
        name: '수도승',
        team: 'townsfolk',
        ability: '',
        edition: 'trouble_brewing',
      },
    });

    expect(isAbilityMalfunctioning(malfunctioningMonk)).toBe(true);
  });

  it('같은 대상도 밤 행동 항목별 처리 상태를 따로 가진다', () => {
    const firstAction = {
      playerId: 'poisoner',
      playerName: 'Poisoner',
      roleId: 'poisoner',
      targets: ['target'],
    };
    const secondAction = {
      playerId: 'imp',
      playerName: 'Imp',
      roleId: 'imp',
      targets: ['target'],
    };

    expect(getActionTargetKey(firstAction, 0, 'target')).not.toBe(
      getActionTargetKey(secondAction, 1, 'target'),
    );
  });
});
