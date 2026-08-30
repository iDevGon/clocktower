import { ALL_ROLES, getActiveRoles } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import { filterDictionaryRoles } from '../utils/dictionaryFilters';
import {
  buildDictionarySetup,
  getDictionaryComposition,
  getDictionaryNightRoles,
} from '../utils/dictionaryPresentation';

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

describe('dictionary presentation', () => {
  it('configured setup uses active roles and excludes travellers from the regular count', () => {
    const setup = buildDictionarySetup({
      settings: {
        setupEditionId: 'trouble_brewing',
        excludedRoleIds: ['librarian'],
        additionalRoleIds: ['sweetheart'],
      },
      players: [{ isTraveller: false }, { isTraveller: true }],
      fallbackEditionId: 'sects_and_violets',
    });

    expect(setup).toEqual({
      editionId: 'trouble_brewing',
      roleIds: getActiveRoles({
        editionId: 'trouble_brewing',
        excludedRoleIds: ['librarian'],
        additionalRoleIds: ['sweetheart'],
      }).map((role) => role.id),
      regularPlayerCount: 1,
    });
    expect(setup.roleIds).not.toContain('librarian');
    expect(setup.roleIds).toContain('sweetheart');
  });

  it('uses the fallback edition and leaves the count unknown until player data is available', () => {
    expect(
      buildDictionarySetup({
        players: [],
        fallbackEditionId: 'sects_and_violets',
      }),
    ).toEqual({
      editionId: 'sects_and_violets',
      roleIds: getActiveRoles({ editionId: 'sects_and_violets' }).map(
        (role) => role.id,
      ),
      regularPlayerCount: undefined,
    });
  });

  it('includes cross-edition night roles while filtering excluded active roles', () => {
    const roleIds = getActiveRoles({
      editionId: 'trouble_brewing',
      excludedRoleIds: ['librarian'],
      additionalRoleIds: ['courtier'],
    }).map((role) => role.id);

    const roleIdsInOrder = getDictionaryNightRoles(
      'trouble_brewing',
      roleIds,
      1,
    ).map((role) => role.id);

    expect(roleIdsInOrder).toContain('courtier');
    expect(roleIdsInOrder).not.toContain('librarian');
  });

  it('presents supported, unsupported, and unknown base compositions', () => {
    expect(getDictionaryComposition(10)).toEqual({
      status: 'supported',
      title: '일반 참가자 10명 기본 구성',
      description:
        '역할 능력으로 인한 인원 변동은 반영하지 않은 기본 구성입니다.',
      teamCounts: [
        { team: 'townsfolk', label: '마을주민', count: 7 },
        { team: 'outsider', label: '외지인', count: 0 },
        { team: 'minion', label: '하수인', count: 2 },
        { team: 'demon', label: '악마', count: 1 },
      ],
    });
    expect(getDictionaryComposition(4)).toEqual({
      status: 'unsupported',
      title: '이 일반 참가자 수의 기본 인원 구성은 지원하지 않습니다.',
      description:
        '기본 인원 구성은 일반 참가자 5명부터 20명까지 확인할 수 있습니다.',
    });
    expect(getDictionaryComposition(undefined)).toEqual({
      status: 'unknown',
      title: '일반 참가자 수를 확인할 수 없습니다.',
      description:
        '여행자를 제외한 현재 참가자 수가 확인되면 기본 인원 구성을 표시합니다.',
    });
  });
});
