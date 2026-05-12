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
  it('여행자 명칭과 설명은 한국어 시트 문구와 일치한다', () => {
    const expectedTravellers = {
      apprentice: {
        name: '수습생',
        ability:
          '당신의 첫 번째 밤에 선한 팀이라면 주민의 능력을, 악한 팀이라면 하수인의 능력을 얻습니다.',
      },
      barista: {
        name: '바리스타',
        ability:
          '매일 밤, 황혼이 될 때까지 플레이어 1명으로 하여금, 1) 맨정신 및 건강한 상태로 진실된 정보만 얻게 만들거나 2) 능력이 2번 작동하게 합니다. 그는 둘 중 무엇을 적용받는지 알게 됩니다.',
      },
      beggar: {
        name: '거지',
        ability:
          '투표하려면 투표 토큰이 필요합니다. 사망한 플레이어에게서 투표 토큰을 받으면, 그의 소속을 알아냅니다. 당신은 맨정신이며 건강합니다.',
      },
      bishop: {
        name: '주교',
        ability:
          '이야기꾼만이 누군가를 지목할 수 있습니다. 매일 낮, 상대 팀 플레이어 1명 이상이 지목되어야 합니다.',
      },
      bone_collector: {
        name: '뼈 수집가',
        ability:
          '게임당 1번, 밤에, 사망한 플레이어 1명을 선택합니다. 그는 황혼까지 자기 능력을 되찾습니다.',
      },
      bureaucrat: {
        name: '관료',
        ability:
          '매일 밤, (당신을 제외하고) 플레이어 1명을 선택합니다: 다음 날, 그의 투표는 3표로 계산합니다.',
      },
      butcher_traveller: {
        name: '푸주한',
        ability:
          '매일 낮, 첫 번째 처형이 끝난 후, 당신은 한 번 더 지목할 수 있습니다.',
      },
      deviant: {
        name: '이단아',
        ability: '오늘 웃음을 선사했다면, 추방으로 사망할 수 없습니다.',
      },
      gunslinger: {
        name: '총잡이',
        ability:
          '매일 낮, 첫 번째 투표를 집계한 후, 투표에 참여한 플레이어 1명을 선택할 수 있습니다. 그는 사망합니다.',
      },
      harlot: {
        name: '매춘부',
        ability:
          '매일 밤*, 생존한 플레이어 1명을 선택합니다: 그가 동의한다면, 그의 캐릭터를 알게 되지만 둘 다 사망할 수도 있습니다.',
      },
      judge: {
        name: '판사',
        ability:
          '게임당 1번, 다른 플레이어가 누군가를 지목했을 때, 이번 처형의 성패를 당신이 단독으로 선택할 수 있습니다.',
      },
      matron: {
        name: '가정교사',
        ability:
          '매일 낮, 플레이어 2명의 자리를 맞바꿀 수 있습니다(낮마다 총 3번까지 가능). 플레이어들은 자기 자리를 떠나 1:1로 대화할 수 없습니다.',
      },
      scapegoat: {
        name: '희생양',
        ability:
          '당신의 팀 소속 플레이어 1명이 처형당하면, 당신이 대신 처형당할 수도 있습니다.',
      },
      thief: {
        name: '도둑',
        ability:
          '매일 밤, (당신을 제외하고) 플레이어 1명을 선택합니다. 다음 날, 그의 투표는 음수로 계산합니다.',
      },
      voudon: {
        name: '부두술사',
        ability:
          '오직 사망한 플레이어와 당신만 투표할 수 있습니다. 투표 토큰 없이도 투표할 수 있으며, 50% 이상의 찬성표를 요구하지 않습니다.',
      },
    };

    for (const traveller of ALL_TRAVELLER_ROLES) {
      expect(traveller).toMatchObject(
        expectedTravellers[traveller.id as keyof typeof expectedTravellers],
      );
    }
  });

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
