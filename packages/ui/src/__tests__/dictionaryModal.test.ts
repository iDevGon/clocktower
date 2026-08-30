import { ALL_ROLES, getBaseRoleCounts } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import { filterDictionaryRoles } from '../utils/dictionaryFilters';

describe('filterDictionaryRoles', () => {
  it('allowed roleIds에 포함된 역할만 반환한다', () => {
    const roles = filterDictionaryRoles(ALL_ROLES, {
      roleIds: ['imp', 'washerwoman'],
    });

    expect(roles.map((role) => role.id).sort()).toEqual(['imp', 'washerwoman']);
  });

  it('역할명과 능력 텍스트로 검색한다', () => {
    const roles = filterDictionaryRoles(ALL_ROLES, {
      roleIds: ['imp', 'washerwoman', 'empath'],
      query: '이웃',
    });

    expect(roles.map((role) => role.id)).toEqual(['empath']);
  });
});

describe('기본 인원 구성', () => {
  it('10명의 일반 참가자 기본 역할 수를 반환한다', () => {
    expect(getBaseRoleCounts(10)).toEqual({
      townsfolk: 7,
      outsider: 0,
      minion: 2,
      demon: 1,
    });
  });

  it('지원하지 않는 일반 참가자 수는 기본 역할 수를 반환하지 않는다', () => {
    expect(getBaseRoleCounts(4)).toBeNull();
  });
});
