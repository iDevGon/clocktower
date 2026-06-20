import { ALL_ROLES } from '@clocktower/shared';
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
