import { describe, expect, it } from 'vitest';
import {
  ALL_ROLES,
  distributeRoles,
  FIRST_NIGHT_ORDER,
  getRoleById,
  getRolesForEdition,
  NIGHT_ACTIONS,
  OTHER_NIGHT_ORDER,
  ROLE_DISTRIBUTION,
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

  it('sects_and_violets 에디션은 구현된 역할만 반환한다', () => {
    const roles = getRolesForEdition('sects_and_violets');
    expect(roles.length).toBeGreaterThan(0);
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

  it('NIGHT_ORDER의 모든 역할이 ALL_ROLES에 존재한다', () => {
    const allIds = new Set(ALL_ROLES.map((r) => r.id));
    for (const id of [...FIRST_NIGHT_ORDER, ...OTHER_NIGHT_ORDER]) {
      expect(allIds.has(id)).toBe(true);
    }
  });

  it('NIGHT_ACTIONS의 모든 역할이 ALL_ROLES에 존재한다', () => {
    const allIds = new Set(ALL_ROLES.map((r) => r.id));
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
});
