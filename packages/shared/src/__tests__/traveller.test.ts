import { describe, expect, it } from 'vitest';
import {
  ALL_TRAVELLER_ROLES,
  BAD_MOON_RISING_TRAVELLERS,
  EDITION_TRAVELLERS,
  getTravellerById,
  getTravellersForEdition,
  SECTS_AND_VIOLETS_TRAVELLERS,
  TROUBLE_BREWING_TRAVELLERS,
} from '../roles.js';

describe('여행자 역할 정의', () => {
  it('ALL_TRAVELLER_ROLES에 모든 에디션 여행자가 포함된다', () => {
    const expectedCount =
      TROUBLE_BREWING_TRAVELLERS.length +
      SECTS_AND_VIOLETS_TRAVELLERS.length +
      BAD_MOON_RISING_TRAVELLERS.length;
    expect(ALL_TRAVELLER_ROLES).toHaveLength(expectedCount);
  });

  it('모든 여행자 역할의 team은 traveller이다', () => {
    expect(ALL_TRAVELLER_ROLES.every((r) => r.team === 'traveller')).toBe(true);
  });

  it('모든 여행자 역할은 고유한 ID를 갖는다', () => {
    const ids = ALL_TRAVELLER_ROLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 여행자 역할은 에디션 정보를 갖는다', () => {
    expect(ALL_TRAVELLER_ROLES.every((r) => r.edition !== '')).toBe(true);
  });

  it('Trouble Brewing 여행자는 5개이다', () => {
    expect(TROUBLE_BREWING_TRAVELLERS).toHaveLength(5);
  });

  it('Sects & Violets 여행자는 5개이다', () => {
    expect(SECTS_AND_VIOLETS_TRAVELLERS).toHaveLength(5);
  });

  it('Bad Moon Rising 여행자는 5개이다', () => {
    expect(BAD_MOON_RISING_TRAVELLERS).toHaveLength(5);
  });
});

describe('getTravellerById', () => {
  it('존재하는 여행자 역할을 반환한다', () => {
    const scapegoat = getTravellerById('scapegoat');
    expect(scapegoat).toBeDefined();
    expect(scapegoat?.name).toBe('희생양');
    expect(scapegoat?.team).toBe('traveller');
  });

  it('다른 에디션의 여행자도 조회할 수 있다', () => {
    const apprentice = getTravellerById('apprentice');
    expect(apprentice).toBeDefined();
    expect(apprentice?.edition).toBe('bad_moon_rising');
  });

  it('존재하지 않는 여행자는 undefined를 반환한다', () => {
    expect(getTravellerById('nonexistent')).toBeUndefined();
  });

  it('일반 역할 ID로는 여행자를 조회할 수 없다', () => {
    expect(getTravellerById('imp')).toBeUndefined();
  });
});

describe('getTravellersForEdition', () => {
  it('trouble_brewing 에디션의 여행자를 반환한다', () => {
    const travellers = getTravellersForEdition('trouble_brewing');
    expect(travellers).toHaveLength(5);
    expect(travellers.every((r) => r.edition === 'trouble_brewing')).toBe(true);
  });

  it('sects_and_violets 에디션의 여행자를 반환한다', () => {
    const travellers = getTravellersForEdition('sects_and_violets');
    expect(travellers).toHaveLength(5);
    expect(travellers.every((r) => r.edition === 'sects_and_violets')).toBe(
      true,
    );
  });

  it('bad_moon_rising 에디션의 여행자를 반환한다', () => {
    const travellers = getTravellersForEdition('bad_moon_rising');
    expect(travellers).toHaveLength(5);
  });

  it('존재하지 않는 에디션은 빈 배열을 반환한다', () => {
    expect(getTravellersForEdition('nonexistent')).toEqual([]);
  });
});

describe('EDITION_TRAVELLERS', () => {
  it('trouble_brewing 키가 존재한다', () => {
    expect(EDITION_TRAVELLERS.trouble_brewing).toBeDefined();
  });

  it('sects_and_violets 키가 존재한다', () => {
    expect(EDITION_TRAVELLERS.sects_and_violets).toBeDefined();
  });

  it('bad_moon_rising 키가 존재한다', () => {
    expect(EDITION_TRAVELLERS.bad_moon_rising).toBeDefined();
  });
});

describe('getRoleById로 여행자 조회', () => {
  // getRoleById는 ROLES_BY_ID에서 못 찾으면 TRAVELLER_ROLES_BY_ID에서 폴백 조회
  it('getRoleById로 여행자 역할을 조회할 수 있다', async () => {
    const { getRoleById } = await import('../roles.js');
    const scapegoat = getRoleById('scapegoat');
    expect(scapegoat).toBeDefined();
    expect(scapegoat?.team).toBe('traveller');
  });

  it('getRoleById로 일반 역할도 여전히 조회할 수 있다', async () => {
    const { getRoleById } = await import('../roles.js');
    const imp = getRoleById('imp');
    expect(imp).toBeDefined();
    expect(imp?.team).toBe('demon');
  });
});
