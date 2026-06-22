import { describe, expect, it } from 'vitest';
import {
  ALL_ROLES,
  ALL_TRAVELLER_ROLES,
  BAD_MOON_RISING_ROLES,
  BMR_FIRST_NIGHT_ORDER,
  BMR_OTHER_NIGHT_ORDER,
  distributeRoles,
  EDITIONS,
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

describe('한국어 시트 문구', () => {
  it('일반 역할 명칭과 설명은 한국어 시트 문구와 일치한다', () => {
    const expectedRoles = {
      artist: {
        name: '화가',
        ability:
          '게임당 1번, 낮에, 이야기꾼에게 예/아니오로 답할 수 있는 질문을 합니다.',
      },
      barber: {
        name: '이발사',
        ability:
          '오늘 또는 오늘 밤에 사망했다면, 악마는 플레이어 2명을 선택합니다(다른 악마는 제외): 그 두 명의 캐릭터를 맞바꿀 수 있습니다.',
      },
      baron: {
        name: '남작',
        ability: '외지인이 추가로 게임에 참여합니다. [외지인 +2명]',
      },
      butler: {
        name: '집사',
        ability:
          '매일 밤, (당신을 제외하고) 플레이어 1명을 선택합니다: 다음 낮에 그가 투표에 참여하는 경우에만, 당신도 투표에 참여할 수 있습니다.',
      },
      cerenovus: {
        name: '세레노버스',
        ability:
          '매일 밤, 플레이어 1명과 선한 캐릭터 1개를 선택합니다: 내일 낮, 그 플레이어가 그 캐릭터라고 주장하지 않으면 처형될 수도 있습니다.',
      },
      chef: {
        name: '요리사',
        ability:
          '게임 시작 시, 서로 이웃하게 앉은 악한 플레이어가 몇 쌍 있는지 알게 됩니다.',
      },
      clockmaker: {
        name: '시계공',
        ability:
          '게임 시작 시, 악마와 가장 가까운 하수인 사이의 거리를 알게 됩니다.',
      },
      dreamer: {
        name: '꿈꾸는 자',
        ability:
          '매일 밤, 당신과 여행자를 제외하고 플레이어 1명을 선택합니다: 선한 캐릭터 1개와 악한 캐릭터 1개를 알게 됩니다. 둘 중 하나가 그의 정체입니다.',
      },
      drunk: {
        name: '주정뱅이',
        ability:
          '당신은 자신이 주정뱅이라는 사실을 모릅니다. 대신, 주민 캐릭터라고 착각하지만, 실제로는 주정뱅이입니다.',
      },
      empath: {
        name: '초공감자',
        ability: '매일 밤, 이웃 생존자 2명 중 몇 명이나 악한지를 알게 됩니다.',
      },
      evil_twin: {
        name: '사악한 쌍둥이',
        ability:
          '당신과 선한 쌍둥이는 서로를 알아봅니다. 선한 쌍둥이가 처형당하면, 악한 팀이 승리합니다. 선/악 쌍둥이가 둘 다 살아있는 한, 선한 팀은 승리할 수 없습니다.',
      },
      fang_gu: {
        name: '팡 구',
        ability:
          '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 이 방법으로 첫 번째 외지인이 사망하면, 그가 팡 구가 되고 당신이 사망합니다. [외지인 +1명]',
      },
      flowergirl: {
        name: '꽃팔이 소녀',
        ability: '매일 밤*, 오늘 낮에 악마가 투표했는지를 알게 됩니다.',
      },
      fortune_teller: {
        name: '점쟁이',
        ability:
          '매일 밤, 플레이어 2명을 선택합니다: 그중 악마가 있는지를 알게 됩니다. 단, 선한 플레이어 중 1명이 당신에게는 악마로 감지되어 보입니다.',
      },
      imp: {
        name: '임프',
        ability:
          '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 이 방법으로 자결하면, 하수인 1명이 임프가 됩니다.',
      },
      investigator: {
        name: '수사관',
        ability:
          '게임 시작 시, 플레이어 2명 중 1명이 특정 하수인임을 알게 됩니다.',
      },
      juggler: {
        name: '곡예사',
        ability:
          '첫 번째 낮에, 공개적으로 플레이어/역할 조합을 5개까지 추측할 수 있습니다. 그날 밤, 그중 몇 개나 맞혔는지를 알게 됩니다.',
      },
      klutz: {
        name: '얼뜨기',
        ability:
          '당신이 사망하면, 생존한 플레이어 1명을 공개적으로 선택합니다: 그가 악한 플레이어라면, 당신의 팀이 패배합니다.',
      },
      librarian: {
        name: '사서',
        ability:
          '게임 시작 시, 플레이어 2명 중 1명이 특정 외지인임을 알게 됩니다. 또는, 게임에 참여하는 외지인이 없음을 알게 됩니다.',
      },
      mathematician: {
        name: '수학자',
        ability:
          '매일 밤, 새벽부터 지금까지 다른 플레이어의 능력 때문에 능력이 이상하게 작동한 플레이어가 몇 명인지 알게 됩니다.',
      },
      mayor: {
        name: '시장',
        ability:
          '3명만 생존한 상황에서 처형이 일어나지 않았다면, 당신의 팀이 승리합니다. 만약 밤에 사망한다면, 그 대신 다른 플레이어 1명이 사망할 수 있습니다.',
      },
      monk: {
        name: '수도사',
        ability:
          '매일 밤*, (당신을 제외하고) 플레이어 1명을 선택합니다: 그는 오늘 밤 악마로부터 안전합니다.',
      },
      mutant: {
        name: '변종',
        ability:
          '당신이 외지인이라는 사실에 미쳐 있다면, 처형당할 수도 있습니다.',
      },
      no_dashii: {
        name: '노 다시',
        ability:
          '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신의 이웃 주민 2명은 중독됩니다.',
      },
      oracle: {
        name: '예언자',
        ability:
          '매일 밤*, 사망한 플레이어 가운데 몇 명이나 악한 팀인지 알게 됩니다.',
      },
      philosopher: {
        name: '철학자',
        ability:
          '게임당 1번, 밤에, 선한 캐릭터 1개를 선택합니다: 그의 능력을 얻습니다. 그 캐릭터가 이미 게임에 참여하고 있다면, 그는 취합니다.',
      },
      pit_hag: {
        name: '마귀할멈',
        ability:
          '매일 밤*, 플레이어 1명과 현재 게임에 참여하지 않은 캐릭터 1개를 선택합니다: 그 플레이어가 그 캐릭터로 바뀝니다. 이 능력으로 악마를 만들었다면, 오늘 밤 예측불허의 죽음이 찾아옵니다.',
      },
      poisoner: {
        name: '독살범',
        ability:
          '매일 밤, 플레이어 1명을 선택합니다: 그는 오늘 밤과 내일 낮 동안 중독됩니다.',
      },
      ravenkeeper: {
        name: '까마귀지기',
        ability:
          '밤에 사망하면, 깨어나서 플레이어 1명을 선택합니다: 그의 캐릭터를 알게 됩니다.',
      },
      recluse: {
        name: '은둔자',
        ability:
          '당신은 악한 팀 소속의 특정 하수인 또는 악마로 위장될 수도 있습니다(사망한 상태에서도).',
      },
      sage: {
        name: '현자',
        ability:
          '악마가 당신을 죽이면, 플레이어 2명을 알게 됩니다. 그중 1명이 악마입니다.',
      },
      saint: {
        name: '성자',
        ability: '당신이 처형으로 사망하면, 당신의 선한 팀이 패배합니다.',
      },
      savant: {
        name: '백치천재',
        ability:
          '매일 낮, 이야기꾼으로부터 이야기에 도움되는 정보 2가지를 얻습니다: 그중 하나는 진실이고 다른 하나는 거짓입니다.',
      },
      scarlet_woman: {
        name: '탕녀',
        ability:
          '플레이어가 5명 이상 생존해있는 사이(여행자는 제외) 악마가 사망하면, 당신이 악마가 됩니다.',
      },
      seamstress: {
        name: '재봉사',
        ability:
          '게임당 1번, 밤에, (당신을 제외하고) 플레이어 2명을 선택합니다: 그들이 같은 소속인지 아닌지를 알게 됩니다.',
      },
      slayer: {
        name: '처단자',
        ability:
          '게임당 1번, 낮에, 공개적으로 플레이어 1명을 선택합니다: 그가 악마면 그는 사망합니다.',
      },
      snake_charmer: {
        name: '뱀 조련사',
        ability:
          '매일 밤, 생존한 플레이어 1명을 선택합니다: 악마를 선택했다면, 악마는 당신과 소속 및 캐릭터를 맞바꾼 다음 중독됩니다.',
      },
      soldier: {
        name: '군인',
        ability: '악마로부터 안전합니다.',
      },
      spy: {
        name: '첩자',
        ability:
          '매일 밤, 마도서를 확인합니다. 당신은 선한 팀 소속의 특정 주민 또는 외지인으로 감지될 수도 있습니다(사망한 상태에서도).',
      },
      sweetheart: {
        name: '사랑꾼',
        ability: '당신이 사망하면, 그때부터 플레이어 1명이 취한 상태가 됩니다.',
      },
      town_crier: {
        name: '포고꾼',
        ability: '매일 밤*, 오늘 낮에 하수인이 지명에 나섰는지를 알게 됩니다.',
      },
      undertaker: {
        name: '장의사',
        ability:
          '매일 밤*, 오늘 낮에 처형으로 사망한 플레이어의 캐릭터를 알게 됩니다.',
      },
      vigormortis: {
        name: '비고르모르티스',
        ability:
          '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 죽은 하수인은 능력을 유지하며, 그의 양쪽 주민 이웃은 중독됩니다. [외지인 -1명]',
      },
      virgin: {
        name: '성결자',
        ability:
          '처음으로 지목당했을 때, 당신을 지목한 플레이어가 주민이라면, 그는 즉시 처형됩니다.',
      },
      vortox: {
        name: '보르톡스',
        ability:
          '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 주민의 능력은 거짓 정보만 제공합니다. 매일 낮, 누구도 처형되지 않으면 악한 팀이 승리합니다.',
      },
      washerwoman: {
        name: '세탁부',
        ability:
          '게임 시작 시, 플레이어 2명 중 1명이 특정 주민임을 알게 됩니다.',
      },
      grandmother: {
        name: '할머니',
        ability:
          '게임 시작 시, 선한 플레이어 1명과 그의 캐릭터를 알게 됩니다. 악마가 그 플레이어를 죽이면 당신도 사망합니다.',
      },
      sailor: {
        name: '선원',
        ability:
          '매일 밤, 생존한 플레이어 1명을 선택합니다: 당신과 그중 1명은 황혼까지 취합니다. 당신은 사망할 수 없습니다.',
      },
      chambermaid: {
        name: '객실 청소부',
        ability:
          '매일 밤, (당신을 제외하고) 생존한 플레이어 2명을 선택합니다: 그중 몇 명이 오늘 밤 자기 능력으로 인해 자신이 깨어났는지 알게 됩니다.',
      },
      exorcist: {
        name: '구마사제',
        ability:
          '매일 밤*, (지난밤에 선택하지 않은) 플레이어 1명을 선택합니다: 악마를 선택한다면 그 악마는 당신의 정체를 알게 되지만 오늘 밤 깨어나지 않습니다.',
      },
      innkeeper: {
        name: '여관 주인',
        ability:
          '매일 밤*, 플레이어 2명을 선택합니다: 이들은 오늘 밤 사망할 수 없으나, 그중 1명은 황혼까지 취합니다.',
      },
      gambler: {
        name: '도박사',
        ability:
          '매일 밤*, 플레이어 1명을 선택하고 그의 캐릭터를 추측합니다: 추측이 틀리면, 당신은 사망합니다.',
      },
      gossip: {
        name: '험담꾼',
        ability:
          '매일 낮, 당신은 공개 발언을 할 수 있습니다. 오늘 밤, 그 발언이 사실이었다면 플레이어 1명이 사망합니다.',
      },
      courtier: {
        name: '궁정대신',
        ability:
          '게임당 1번, 밤에 캐릭터 1명을 선택합니다: 그 플레이어는 3일 밤낮 동안 취합니다.',
      },
      professor: {
        name: '교수',
        ability:
          '게임당 1번, 밤*에, 사망한 플레이어 1명을 선택합니다: 그 플레이어가 주민이라면, 그 플레이어는 부활합니다.',
      },
      minstrel: {
        name: '음유시인',
        ability:
          '하수인 1명이 처형으로 사망하면, (여행자를 제외하고) 다른 모든 플레이어는 다음 날 황혼까지 취합니다.',
      },
      tea_lady: {
        name: '찻집 여인',
        ability:
          '이웃 생존자 2명이 모두 선한 플레이어라면, 이들은 사망할 수 없습니다.',
      },
      pacifist: {
        name: '평화주의자',
        ability:
          '선한 플레이어가 처형당하면, 그는 사망하지 않을 수도 있습니다.',
      },
      fool: {
        name: '어릿광대',
        ability: '당신이 처음으로 사망할 때, 사망하지 않습니다.',
      },
      goon: {
        name: '건달',
        ability:
          '매일 밤, 자기 능력으로 당신을 선택하는 첫 플레이어는 황혼까지 취합니다. 당신은 그 플레이어가 소속한 팀이 됩니다.',
      },
      lunatic: {
        name: '미치광이',
        ability:
          '당신은 악마가 아니지만, 악마라고 착각합니다. 악마는 당신이 누구인지 알고, 밤에 당신이 누구를 선택하는지 알게 됩니다.',
      },
      tinker: {
        name: '땜장이',
        ability: '당신은 언제든지 돌연 사망할 수도 있습니다.',
      },
      moonchild: {
        name: '달의 자손',
        ability:
          '당신이 사망했음을 알게 될 때, 생존한 플레이어 1명을 공개적으로 선택합니다. 그가 선한 플레이어라면, 오늘 밤 그는 사망합니다.',
      },
      godfather: {
        name: '대부',
        ability:
          '게임 시작 시, 어느 외지인이 게임에 참여하는지 알게 됩니다. 낮에 외지인 1명이 사망하면, 그날 밤 플레이어 1명을 선택합니다: 그는 사망합니다. [외지인 -1명 또는 +1명]',
      },
      devils_advocate: {
        name: '악마의 변호사',
        ability:
          '매일 밤, (지난밤에 선택하지 않은) 생존한 플레이어 1명을 선택합니다: 그 플레이어가 내일 처형당하면, 그는 사망하지 않습니다.',
      },
      assassin: {
        name: '암살자',
        ability:
          '게임당 1번, 밤*에, 플레이어 1명을 선택합니다: 그 플레이어는 이유불문 사망합니다.',
      },
      mastermind: {
        name: '주모자',
        ability:
          '악마가 처형으로 사망하면(게임 종료 조건), 하루 더 게임을 진행합니다. 그런 다음, 플레이어 1명이 처형당하면, 그 플레이어가 소속된 팀이 패배합니다.',
      },
      zombuul: {
        name: '좀버얼',
        ability:
          '매일 밤*, 오늘 낮에 누구도 사망하지 않았다면, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신이 처음으로 사망할 때, 실제로는 생존해 있지만 사망한 상태로 위장합니다.',
      },
      pukka: {
        name: '푸카',
        ability:
          '매일 밤, 플레이어 1명을 선택합니다: 그는 중독됩니다. 이전에 당신이 중독시켰던 플레이어는 사망하고, 건강한 상태가 됩니다.',
      },
      shabaloth: {
        name: '사발로스',
        ability:
          '매일 밤*, 플레이어 2명을 선택합니다: 그들은 사망합니다. 지난밤에 당신이 선택했던 사망한 플레이어를 다시 토해낼 수도 있습니다(살아납니다).',
      },
      po: {
        name: '포',
        ability:
          '매일 밤*, 플레이어 1명을 선택할 수 있습니다. 그는 사망합니다. 이전에 누구도 선택하지 않았다면, 오늘 밤에는 사망할 플레이어 3명을 선택합니다.',
      },
      witch: {
        name: '마녀',
        ability:
          '매일 밤, 플레이어 1명을 선택합니다: 그가 다음 낮에 누군가를 지목한다면, 그는 사망합니다. 플레이어가 3명만 남았다면, 이 능력은 무효입니다.',
      },
    };

    for (const role of ALL_ROLES) {
      expect(role).toMatchObject(
        expectedRoles[role.id as keyof typeof expectedRoles],
      );
    }
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

  it('ALL_ROLES에 TB + S&V + BMR 역할이 모두 포함된다', () => {
    expect(ALL_ROLES.length).toBe(
      TROUBLE_BREWING_ROLES.length +
        SECTS_AND_VIOLETS_ROLES.length +
        BAD_MOON_RISING_ROLES.length,
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

  it('꿈꾸는 자와 현자는 전용 피드백 타입을 사용한다', () => {
    expect(NIGHT_FEEDBACK.dreamer?.type).toBe('dreamer_info');
    expect(NIGHT_FEEDBACK.sage?.type).toBe('players');
  });

  it('보르톡스 설명은 처형 없는 날 악 팀 승리로 안내한다', () => {
    const vortox = SECTS_AND_VIOLETS_ROLES.find((r) => r.id === 'vortox');
    expect(vortox?.ability).toContain('악한 팀이 승리합니다');
  });

  it('마귀할멈 설명은 현재 없는 역할만 만들 수 있음을 안내한다', () => {
    const pitHag = SECTS_AND_VIOLETS_ROLES.find((r) => r.id === 'pit_hag');
    expect(pitHag?.ability).toContain('현재 게임에 참여하지 않은 캐릭터');
    expect(pitHag?.ability).not.toContain('둘 중 하나가 사망');
  });

  it('노 다시 설명은 생존 여부와 무관한 마을주민 이웃 중독으로 안내한다', () => {
    const noDashii = SECTS_AND_VIOLETS_ROLES.find((r) => r.id === 'no_dashii');
    expect(noDashii?.ability).toContain('이웃 주민 2명');
    expect(noDashii?.ability).not.toContain('살아있는');
  });

  it('세레노버스와 마귀할멈은 죽은 플레이어도 대상으로 선택할 수 있다', () => {
    expect(NIGHT_ACTIONS.cerenovus?.includeDeadTargets).toBe(true);
    expect(NIGHT_ACTIONS.pit_hag?.includeDeadTargets).toBe(true);
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

describe('Bad Moon Rising 역할 정의', () => {
  const bmrRoleIds = [
    'grandmother',
    'sailor',
    'chambermaid',
    'exorcist',
    'innkeeper',
    'gambler',
    'gossip',
    'courtier',
    'professor',
    'minstrel',
    'tea_lady',
    'pacifist',
    'fool',
    'goon',
    'lunatic',
    'tinker',
    'moonchild',
    'godfather',
    'devils_advocate',
    'assassin',
    'mastermind',
    'zombuul',
    'pukka',
    'shabaloth',
    'po',
  ];

  it('BMR 에디션은 25개 역할을 반환한다', () => {
    const roles = getRolesForEdition('bad_moon_rising');
    expect(roles).toHaveLength(25);
    expect(roles.map((r) => r.id)).toEqual(bmrRoleIds);
    expect(roles.every((r) => r.edition === 'bad_moon_rising')).toBe(true);
  });

  it('BMR 역할은 마을주민 13, 외지인 4, 하수인 4, 악마 4로 구성된다', () => {
    expect(
      BAD_MOON_RISING_ROLES.filter((r) => r.team === 'townsfolk'),
    ).toHaveLength(13);
    expect(
      BAD_MOON_RISING_ROLES.filter((r) => r.team === 'outsider'),
    ).toHaveLength(4);
    expect(
      BAD_MOON_RISING_ROLES.filter((r) => r.team === 'minion'),
    ).toHaveLength(4);
    expect(
      BAD_MOON_RISING_ROLES.filter((r) => r.team === 'demon'),
    ).toHaveLength(4);
  });

  it('BMR 에디션 메타데이터가 등록되어 있다', () => {
    expect(EDITIONS.some((edition) => edition.id === 'bad_moon_rising')).toBe(
      true,
    );
  });

  it('BMR 역할은 한국어 명칭과 설명을 가진다', () => {
    for (const role of BAD_MOON_RISING_ROLES) {
      expect(/[\uac00-\ud7af]/.test(role.name)).toBe(true);
      expect(/[\uac00-\ud7af]/.test(role.ability)).toBe(true);
    }
  });

  it('BMR 에디션으로 배분하면 BMR 역할만 배정된다', () => {
    const playerIds = Array.from({ length: 10 }, (_, i) => `bmr-p${i + 1}`);
    const result = distributeRoles(playerIds, {
      editionId: 'bad_moon_rising',
    });
    expect(result).not.toBeNull();
    if (!result) return;
    expect(
      result.assignments.every((a) => a.role.edition === 'bad_moon_rising'),
    ).toBe(true);
  });

  it('갓파더가 포함되면 BMR 자동 배분에서 외지인 수를 조정한다', () => {
    const playerIds = Array.from({ length: 7 }, (_, i) => `bmr-p${i + 1}`);
    const result = distributeRoles(playerIds, {
      editionId: 'bad_moon_rising',
      excludedRoleIds: ['devils_advocate', 'assassin', 'mastermind'],
    });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.assignments.some((a) => a.role.id === 'godfather')).toBe(
      true,
    );
    expect(
      result.assignments.filter((a) => a.role.team === 'outsider'),
    ).toHaveLength(1);
  });

  it('갓파더 외지인 조정은 이야기꾼 선택에 따라 +1 또는 -1을 적용한다', () => {
    const playerIds = Array.from({ length: 8 }, (_, i) => `bmr-p${i + 1}`);
    const excludedRoleIds = ['devils_advocate', 'assassin', 'mastermind'];

    const plusResult = distributeRoles(playerIds, {
      editionId: 'bad_moon_rising',
      excludedRoleIds,
      godfatherOutsiderModifier: 1,
    });
    const minusResult = distributeRoles(playerIds, {
      editionId: 'bad_moon_rising',
      excludedRoleIds,
      godfatherOutsiderModifier: -1,
    });

    expect(plusResult).not.toBeNull();
    expect(minusResult).not.toBeNull();
    if (!plusResult || !minusResult) return;

    expect(
      plusResult.assignments.filter((a) => a.role.team === 'outsider'),
    ).toHaveLength(2);
    expect(
      minusResult.assignments.filter((a) => a.role.team === 'outsider'),
    ).toHaveLength(0);
  });
});

describe('BMR 밤 진행 순서', () => {
  it('BMR_FIRST_NIGHT_ORDER에 중복이 없다', () => {
    expect(new Set(BMR_FIRST_NIGHT_ORDER).size).toBe(
      BMR_FIRST_NIGHT_ORDER.length,
    );
  });

  it('BMR_OTHER_NIGHT_ORDER에 중복이 없다', () => {
    expect(new Set(BMR_OTHER_NIGHT_ORDER).size).toBe(
      BMR_OTHER_NIGHT_ORDER.length,
    );
  });

  it('BMR 밤 순서의 모든 역할이 조회 가능하다', () => {
    for (const id of [...BMR_FIRST_NIGHT_ORDER, ...BMR_OTHER_NIGHT_ORDER]) {
      expect(getRoleById(id)).toBeDefined();
    }
  });

  it('getNightOrderForEdition이 BMR 순서를 반환한다', () => {
    expect(getNightOrderForEdition('bad_moon_rising', 1)).toEqual(
      BMR_FIRST_NIGHT_ORDER,
    );
    expect(getNightOrderForEdition('bad_moon_rising', 2)).toEqual(
      BMR_OTHER_NIGHT_ORDER,
    );
  });
});

describe('BMR 밤 행동 정의', () => {
  it('BMR 밤 행동 역할이 NIGHT_ACTIONS에 정의되어 있다', () => {
    const bmrActionRoles = [
      'sailor',
      'chambermaid',
      'exorcist',
      'innkeeper',
      'professor',
      'godfather',
      'devils_advocate',
      'assassin',
      'zombuul',
      'pukka',
      'shabaloth',
      'po',
      'grandmother',
      'courtier',
      'gambler',
      'gossip',
      'lunatic',
      'tinker',
      'moonchild',
      'apprentice',
    ];
    for (const id of bmrActionRoles) {
      expect(NIGHT_ACTIONS[id]).toBeDefined();
    }
  });

  it('포는 0명, 1명 또는 3명을 선택할 수 있다', () => {
    expect(NIGHT_ACTIONS.po?.type).toBe('select_one');
    expect(NIGHT_ACTIONS.po?.allowedTargetCounts).toEqual([0, 1, 3]);
  });

  it('객실 청소부는 자신을 제외한 생존 플레이어 2명을 선택한다', () => {
    expect(NIGHT_ACTIONS.chambermaid).toMatchObject({
      type: 'select_two',
      excludeSelf: true,
    });
  });

  it('구마사제는 자기 자신도 선택할 수 있다', () => {
    expect(NIGHT_ACTIONS.exorcist).toMatchObject({
      type: 'select_one',
      excludeSelf: false,
      includeDeadTargets: true,
    });
  });

  it('교수는 사망 플레이어도 대상으로 선택할 수 있다', () => {
    expect(NIGHT_ACTIONS.professor?.includeDeadTargets).toBe(true);
  });

  it('교수는 사망 플레이어만 대상으로 선택한다', () => {
    expect(NIGHT_ACTIONS.professor?.deadTargetsOnly).toBe(true);
  });

  it('BMR에서 생존 제한이 없는 플레이어 선택 역할은 사망 플레이어도 선택할 수 있다', () => {
    for (const id of [
      'exorcist',
      'innkeeper',
      'godfather',
      'assassin',
      'zombuul',
      'pukka',
      'shabaloth',
      'po',
    ]) {
      expect(NIGHT_ACTIONS[id]?.includeDeadTargets).toBe(true);
    }
  });

  it('앱에서 처리되는 BMR 보조 역할 안내는 수동 처리로 표시하지 않는다', () => {
    for (const id of ['courtier', 'gambler', 'gossip', 'moonchild']) {
      expect(NIGHT_ACTIONS[id]?.instruction).not.toContain('수동');
    }
  });
});

describe('BMR 밤 피드백 정의', () => {
  it('할머니는 플레이어와 역할 피드백을 사용한다', () => {
    expect(NIGHT_FEEDBACK.grandmother?.type).toBe('player_and_role');
  });

  it('객실 청소부는 숫자 피드백을 사용한다', () => {
    expect(NIGHT_FEEDBACK.chambermaid?.type).toBe('number');
  });

  it('수습생은 역할 피드백을 사용한다', () => {
    expect(NIGHT_FEEDBACK.apprentice?.type).toBe('role');
  });
});
