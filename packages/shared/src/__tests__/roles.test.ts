import { describe, expect, it } from 'vitest';
import {
  ALL_ROLES,
  ALL_TRAVELLER_ROLES,
  distributeRoles,
  FIRST_NIGHT_ORDER,
  getNightOrderForEdition,
  getRoleById,
  getRolesForEdition,
  NIGHT_ACTIONS,
  NIGHT_FEEDBACK,
  OTHER_NIGHT_ORDER,
  ROLE_DISTRIBUTION,
  SECTS_AND_VIOLETS_ROLES,
  SV_FIRST_NIGHT_ORDER,
  SV_OTHER_NIGHT_ORDER,
  TROUBLE_BREWING_ROLES,
} from '../roles.js';

describe('getRolesForEdition', () => {
  it('trouble_brewing 에디션은 22개 역할을 반환한다', () => {
    const roles = getRolesForEdition('trouble_brewing');
    expect(roles).toHaveLength(22);
  });

  it('존재하지 않는 에디션은 trouble_brewing으로 폴백한다', () => {
    const roles = getRolesForEdition('nonexistent');
    expect(roles).toEqual(TROUBLE_BREWING_ROLES);
  });

  it('sects_and_violets 에디션은 25개 역할을 반환한다', () => {
    const roles = getRolesForEdition('sects_and_violets');
    expect(roles).toHaveLength(25);
    expect(roles.every((r) => r.edition === 'sects_and_violets')).toBe(true);
  });
});

describe('getRoleById', () => {
  it('존재하는 역할을 반환한다', () => {
    const imp = getRoleById('imp');
    expect(imp).toBeDefined();
    expect(imp?.name).toBe('임프');
    expect(imp?.team).toBe('demon');
  });

  it('존재하지 않는 역할은 undefined를 반환한다', () => {
    expect(getRoleById('nonexistent')).toBeUndefined();
  });
});

describe('상수 정합성', () => {
  it('ROLE_DISTRIBUTION 합계가 플레이어 수와 일치한다', () => {
    for (const [count, dist] of Object.entries(ROLE_DISTRIBUTION)) {
      const sum = dist.reduce((a, b) => a + b, 0);
      expect(sum).toBe(Number(count));
    }
  });

  it('FIRST_NIGHT_ORDER에 중복이 없다', () => {
    expect(new Set(FIRST_NIGHT_ORDER).size).toBe(FIRST_NIGHT_ORDER.length);
  });

  it('OTHER_NIGHT_ORDER에 중복이 없다', () => {
    expect(new Set(OTHER_NIGHT_ORDER).size).toBe(OTHER_NIGHT_ORDER.length);
  });

  it('NIGHT_ORDER의 모든 역할이 ALL_ROLES 또는 ALL_TRAVELLER_ROLES에 존재한다', () => {
    const allIds = new Set([
      ...ALL_ROLES.map((r) => r.id),
      ...ALL_TRAVELLER_ROLES.map((r) => r.id),
    ]);
    for (const id of [...FIRST_NIGHT_ORDER, ...OTHER_NIGHT_ORDER]) {
      expect(allIds.has(id)).toBe(true);
    }
  });

  it('NIGHT_ACTIONS의 모든 역할이 ALL_ROLES 또는 ALL_TRAVELLER_ROLES에 존재한다', () => {
    const allIds = new Set([
      ...ALL_ROLES.map((r) => r.id),
      ...ALL_TRAVELLER_ROLES.map((r) => r.id),
    ]);
    for (const id of Object.keys(NIGHT_ACTIONS)) {
      expect(allIds.has(id)).toBe(true);
    }
  });
});

describe('distributeRoles', () => {
  const makePlayerIds = (n: number) =>
    Array.from({ length: n }, (_, i) => `p${i + 1}`);

  it('5~15인 플레이어에 대해 올바른 팀 구성으로 배분한다', () => {
    for (let count = 5; count <= 15; count++) {
      const playerIds = makePlayerIds(count);
      const result = distributeRoles(playerIds);
      expect(result).not.toBeNull();
      if (!result) continue;

      expect(result.assignments).toHaveLength(count);

      const dist = ROLE_DISTRIBUTION[count];
      const teams: Record<string, number> = {
        townsfolk: 0,
        outsider: 0,
        minion: 0,
        demon: 0,
      };
      for (const a of result.assignments) {
        teams[a.role.team] = (teams[a.role.team] ?? 0) + 1;
      }

      // 남작이 있으면 외지인+2, 마을주민-2
      const hasBaron = result.assignments.some((a) => a.role.id === 'baron');
      if (hasBaron) {
        expect(teams.outsider).toBe(
          Math.min(
            dist[1] + 2,
            TROUBLE_BREWING_ROLES.filter((r) => r.team === 'outsider').length,
          ),
        );
      } else {
        expect(teams.townsfolk).toBe(dist[0]);
        expect(teams.outsider).toBe(dist[1]);
      }
      expect(teams.minion).toBe(dist[2]);
      expect(teams.demon).toBe(dist[3]);
    }
  });

  it('주정뱅이가 포함되면 drunkAs가 마을주민 역할로 배정된다', () => {
    // 주정뱅이를 강제로 포함시키기 위해 여러번 시도
    let found = false;
    for (let i = 0; i < 100; i++) {
      const result = distributeRoles(makePlayerIds(6));
      if (!result) continue;
      const drunkAssignment = result.assignments.find(
        (a) => a.role.id === 'drunk',
      );
      if (drunkAssignment) {
        expect(drunkAssignment.drunkAs).toBeDefined();
        const fakeRole = getRoleById(drunkAssignment.drunkAs ?? '');
        expect(fakeRole?.team).toBe('townsfolk');
        found = true;
        break;
      }
    }
    // 6인이면 외지인 1명이므로 주정뱅이가 올 확률이 있음
    expect(found).toBe(true);
  });

  it('excludedRoleIds로 역할을 제외할 수 있다', () => {
    for (let i = 0; i < 20; i++) {
      const result = distributeRoles(makePlayerIds(7), {
        excludedRoleIds: ['poisoner'],
      });
      if (!result) continue;
      expect(result.assignments.every((a) => a.role.id !== 'poisoner')).toBe(
        true,
      );
    }
  });

  it('악마를 모두 제외하면 null을 반환한다', () => {
    const result = distributeRoles(makePlayerIds(7), {
      excludedRoleIds: ['imp'],
    });
    expect(result).toBeNull();
  });

  it('additionalRoleIds로 크로스 에디션 역할을 포함할 수 있다', () => {
    let found = false;
    for (let i = 0; i < 50; i++) {
      const result = distributeRoles(makePlayerIds(6), {
        additionalRoleIds: ['sweetheart'],
      });
      if (!result) continue;
      if (result.assignments.some((a) => a.role.id === 'sweetheart')) {
        found = true;
        break;
      }
    }
    // sweetheart는 outsider이고 6인에 outsider 1명이므로 확률적으로 나올 수 있음
    expect(found).toBe(true);
  });

  it('플레이어 수가 범위 밖이면 null을 반환한다', () => {
    expect(distributeRoles(makePlayerIds(3))).toBeNull();
    expect(distributeRoles(makePlayerIds(4))).toBeNull();
    expect(distributeRoles(makePlayerIds(21))).toBeNull();
  });

  it('모든 플레이어에게 고유한 역할이 배정된다', () => {
    for (let i = 0; i < 10; i++) {
      const result = distributeRoles(makePlayerIds(10));
      if (!result) continue;
      const roleIds = result.assignments.map((a) => a.role.id);
      expect(new Set(roleIds).size).toBe(roleIds.length);
    }
  });

  it('S&V 에디션으로 배분하면 S&V 역할이 배정된다', () => {
    const result = distributeRoles(makePlayerIds(7), {
      editionId: 'sects_and_violets',
    });
    expect(result).not.toBeNull();
    if (!result) return;
    expect(
      result.assignments.every((a) => a.role.edition === 'sects_and_violets'),
    ).toBe(true);
  });

  it('팡 구가 포함되면 외지인 +1', () => {
    let found = false;
    for (let i = 0; i < 100; i++) {
      const result = distributeRoles(makePlayerIds(7), {
        editionId: 'sects_and_violets',
      });
      if (!result) continue;
      const hasFangGu = result.assignments.some((a) => a.role.id === 'fang_gu');
      if (!hasFangGu) continue;
      // 7인 기본: 외지인 0명, 팡 구 → 외지인 1명
      const outsiderCount = result.assignments.filter(
        (a) => a.role.team === 'outsider',
      ).length;
      expect(outsiderCount).toBe(1);
      found = true;
      break;
    }
    // 4개 악마 중 팡 구가 나올 확률이 있음
    expect(found).toBe(true);
  });

  it('비고르모르티스가 포함되면 외지인 -1', () => {
    let found = false;
    for (let i = 0; i < 100; i++) {
      const result = distributeRoles(makePlayerIds(9), {
        editionId: 'sects_and_violets',
      });
      if (!result) continue;
      const hasVigormortis = result.assignments.some(
        (a) => a.role.id === 'vigormortis',
      );
      if (!hasVigormortis) continue;
      // 9인 기본: 외지인 2명, 비고르모르티스 → 외지인 1명
      const outsiderCount = result.assignments.filter(
        (a) => a.role.team === 'outsider',
      ).length;
      expect(outsiderCount).toBe(1);
      found = true;
      break;
    }
    expect(found).toBe(true);
  });
});

describe('Sects & Violets 역할 정의', () => {
  it('S&V 역할은 마을주민 13, 외지인 4, 하수인 4, 악마 4로 구성된다', () => {
    const townsfolk = SECTS_AND_VIOLETS_ROLES.filter(
      (r) => r.team === 'townsfolk',
    );
    const outsiders = SECTS_AND_VIOLETS_ROLES.filter(
      (r) => r.team === 'outsider',
    );
    const minions = SECTS_AND_VIOLETS_ROLES.filter((r) => r.team === 'minion');
    const demons = SECTS_AND_VIOLETS_ROLES.filter((r) => r.team === 'demon');
    expect(townsfolk).toHaveLength(13);
    expect(outsiders).toHaveLength(4);
    expect(minions).toHaveLength(4);
    expect(demons).toHaveLength(4);
  });

  it('모든 S&V 역할이 한국어 이름과 능력을 가진다', () => {
    for (const role of SECTS_AND_VIOLETS_ROLES) {
      expect(role.name.length).toBeGreaterThan(0);
      expect(role.ability.length).toBeGreaterThan(0);
      // 한국어 포함 확인 (한글 유니코드 범위)
      expect(/[\uac00-\ud7af]/.test(role.name)).toBe(true);
      expect(/[\uac00-\ud7af]/.test(role.ability)).toBe(true);
    }
  });

  it('S&V 역할 ID에 중복이 없다', () => {
    const ids = SECTS_AND_VIOLETS_ROLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('ALL_ROLES에 TB + S&V 역할이 모두 포함된다', () => {
    expect(ALL_ROLES.length).toBe(
      TROUBLE_BREWING_ROLES.length + SECTS_AND_VIOLETS_ROLES.length,
    );
  });

  it('S&V 밤 행동 역할이 NIGHT_ACTIONS에 정의되어 있다', () => {
    const svRolesWithActions = [
      'clockmaker',
      'dreamer',
      'snake_charmer',
      'mathematician',
      'flowergirl',
      'town_crier',
      'oracle',
      'seamstress',
      'philosopher',
      'juggler',
      'sage',
      'witch',
      'cerenovus',
      'pit_hag',
      'fang_gu',
      'vigormortis',
      'no_dashii',
      'vortox',
      'evil_twin',
    ];
    for (const id of svRolesWithActions) {
      expect(NIGHT_ACTIONS[id]).toBeDefined();
    }
  });

  it('S&V 정보 역할이 NIGHT_FEEDBACK에 정의되어 있다', () => {
    const svFeedbackRoles = [
      'clockmaker',
      'dreamer',
      'mathematician',
      'flowergirl',
      'town_crier',
      'oracle',
      'seamstress',
      'juggler',
      'sage',
    ];
    for (const id of svFeedbackRoles) {
      expect(NIGHT_FEEDBACK[id]).toBeDefined();
    }
  });
});

describe('S&V 밤 진행 순서', () => {
  it('SV_FIRST_NIGHT_ORDER에 중복이 없다', () => {
    expect(new Set(SV_FIRST_NIGHT_ORDER).size).toBe(
      SV_FIRST_NIGHT_ORDER.length,
    );
  });

  it('SV_OTHER_NIGHT_ORDER에 중복이 없다', () => {
    expect(new Set(SV_OTHER_NIGHT_ORDER).size).toBe(
      SV_OTHER_NIGHT_ORDER.length,
    );
  });

  it('S&V 밤 순서의 모든 역할이 ALL_ROLES 또는 ALL_TRAVELLER_ROLES에 존재한다', () => {
    const allIds = new Set([
      ...ALL_ROLES.map((r) => r.id),
      ...ALL_TRAVELLER_ROLES.map((r) => r.id),
    ]);
    for (const id of [...SV_FIRST_NIGHT_ORDER, ...SV_OTHER_NIGHT_ORDER]) {
      expect(allIds.has(id)).toBe(true);
    }
  });

  it('getNightOrderForEdition이 에디션에 맞는 순서를 반환한다', () => {
    expect(getNightOrderForEdition('trouble_brewing', 1)).toEqual(
      FIRST_NIGHT_ORDER,
    );
    expect(getNightOrderForEdition('trouble_brewing', 2)).toEqual(
      OTHER_NIGHT_ORDER,
    );
    expect(getNightOrderForEdition('sects_and_violets', 1)).toEqual(
      SV_FIRST_NIGHT_ORDER,
    );
    expect(getNightOrderForEdition('sects_and_violets', 2)).toEqual(
      SV_OTHER_NIGHT_ORDER,
    );
  });
});
