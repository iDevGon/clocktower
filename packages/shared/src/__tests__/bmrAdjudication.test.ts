import { describe, expect, it } from 'vitest';
import {
  getBmrDeathWarnings,
  type BmrDeathWarningKind,
} from '../bmrAdjudication.js';
import {
  PLAYER_STATUS_COLORS,
  PLAYER_STATUS_DESCRIPTIONS,
  PLAYER_STATUS_LABELS,
  type Player,
  type PlayerStatus,
} from '../types.js';

const BMR_STATUSES = [
  'innkeeper_protected',
  'devils_advocate_protected',
  'tea_lady_protected',
  'sailor_drunk',
  'innkeeper_drunk',
  'courtier_drunk',
  'minstrel_drunk',
  'goon_drunk',
  'pukka_poisoned',
  'zombuul_registers_dead',
  'fool_spent',
  'assassin_spent',
  'professor_spent',
  'courtier_spent',
  'po_chose_no_one',
  'shabaloth_marked_dead',
] as const satisfies readonly PlayerStatus[];

describe('BMR 판정 상태', () => {
  it('모든 BMR 상태는 라벨, 색상, 설명을 가진다', () => {
    for (const status of BMR_STATUSES) {
      expect(PLAYER_STATUS_LABELS[status]).toBeTruthy();
      expect(PLAYER_STATUS_COLORS[status]).toMatch(/^#/);
      expect(PLAYER_STATUS_DESCRIPTIONS[status]).toBeTruthy();
    }
  });
});

function player(overrides: Partial<Player>): Player {
  return {
    id: 'p1',
    name: 'Player',
    isAlive: true,
    hasNominatedToday: false,
    hasBeenNominatedToday: false,
    deadVoteUsed: false,
    role: {
      id: 'washerwoman',
      name: '세탁부',
      team: 'townsfolk',
      ability: '',
      edition: 'trouble_brewing',
    },
    statuses: [],
    ...overrides,
  };
}

function warningKinds(
  args: Parameters<typeof getBmrDeathWarnings>[0],
): BmrDeathWarningKind[] {
  return getBmrDeathWarnings(args).map((warning) => warning.kind);
}

describe('getBmrDeathWarnings', () => {
  it('중독/취함 행동자는 사망 처리를 막는 경고를 먼저 반환한다', () => {
    const actor = player({
      id: 'assassin',
      role: {
        id: 'assassin',
        name: '암살자',
        team: 'minion',
        ability: '',
        edition: 'bad_moon_rising',
      },
      statuses: ['poisoned'],
    });
    const target = player({ id: 'target', statuses: ['tea_lady_protected'] });

    expect(
      warningKinds({
        roleId: 'assassin',
        method: 'assassin',
        timing: 'night',
        actor,
        target,
      })[0],
    ).toBe('actor_malfunctioning');
  });

  it('맑고 건강한 암살자는 보호 무시 경고를 반환한다', () => {
    const actor = player({
      id: 'assassin',
      role: {
        id: 'assassin',
        name: '암살자',
        team: 'minion',
        ability: '',
        edition: 'bad_moon_rising',
      },
    });
    const target = player({ id: 'target', statuses: ['tea_lady_protected'] });

    expect(
      warningKinds({
        roleId: 'assassin',
        method: 'assassin',
        timing: 'night',
        actor,
        target,
      }),
    ).toContain('assassin_bypasses_protection');
  });

  it('맑고 건강한 선원 대상은 사망 불가 경고를 반환한다', () => {
    const target = player({
      id: 'sailor',
      role: {
        id: 'sailor',
        name: '선원',
        team: 'townsfolk',
        ability: '',
        edition: 'bad_moon_rising',
      },
    });

    expect(
      warningKinds({
        roleId: 'po',
        method: 'po',
        timing: 'night',
        target,
      }),
    ).toContain('sailor_cannot_die');
  });

  it('취한 선원 대상은 선원 생존 경고를 반환하지 않는다', () => {
    const target = player({
      id: 'sailor',
      role: {
        id: 'sailor',
        name: '선원',
        team: 'townsfolk',
        ability: '',
        edition: 'bad_moon_rising',
      },
      statuses: ['drunk'],
    });

    expect(
      warningKinds({
        roleId: 'po',
        method: 'po',
        timing: 'night',
        target,
      }),
    ).not.toContain('sailor_cannot_die');
  });

  it('악마의 변호사 보호는 낮 처형에만 경고를 반환한다', () => {
    const target = player({
      id: 'target',
      statuses: ['devils_advocate_protected'],
    });

    expect(
      warningKinds({
        roleId: 'execution',
        method: 'execution',
        timing: 'day',
        target,
      }),
    ).toContain('devils_advocate_protected');
    expect(
      warningKinds({
        roleId: 'po',
        method: 'po',
        timing: 'night',
        target,
      }),
    ).not.toContain('devils_advocate_protected');
  });

  it('어릿광대가 능력을 쓰지 않았다면 첫 사망 선택지를 반환한다', () => {
    const target = player({
      id: 'fool',
      role: {
        id: 'fool',
        name: '어릿광대',
        team: 'townsfolk',
        ability: '',
        edition: 'bad_moon_rising',
      },
    });

    expect(
      warningKinds({
        roleId: 'po',
        method: 'po',
        timing: 'night',
        target,
      }),
    ).toContain('fool_first_death');
  });

  it('좀비얼 첫 사망은 사망 위장 선택지를 반환한다', () => {
    const target = player({
      id: 'zombuul',
      role: {
        id: 'zombuul',
        name: '좀비얼',
        team: 'demon',
        ability: '',
        edition: 'bad_moon_rising',
      },
    });

    expect(
      warningKinds({
        roleId: 'execution',
        method: 'execution',
        timing: 'day',
        target,
      }),
    ).toContain('zombuul_registers_dead');
  });
});
