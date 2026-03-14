import type { Edition, NightActionDef, NightFeedbackDef, Role } from './types.js';

// 밤 행동이 있는 전체 역할 (순서대로)
export const ALL_NIGHT_ROLES: string[] = [
  'poisoner',
  'monk',
  'scarlet_woman',
  'imp',
  'washerwoman',
  'librarian',
  'investigator',
  'chef',
  'empath',
  'fortune_teller',
  'ravenkeeper',
  'undertaker',
  'butler',
  'spy',
];

export const TROUBLE_BREWING_ROLES: Role[] = [
  // 마을주민 (13)
  {
    id: 'washerwoman',
    name: '세탁부',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 2명의 플레이어 중 1명이 특정 마을주민임을 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'librarian',
    name: '사서',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 2명의 플레이어 중 1명이 특정 외지인임을 알게 됩니다. (또는 외지인이 없음을 알 수 있습니다.)',
    edition: 'trouble_brewing',
  },
  {
    id: 'investigator',
    name: '수사관',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 2명의 플레이어 중 1명이 특정 하수인임을 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'chef',
    name: '요리사',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 서로 이웃한 악한 플레이어 쌍이 몇 개인지 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'empath',
    name: '초공감자',
    team: 'townsfolk',
    ability: '매일 밤, 살아있는 양쪽 이웃 중 몇 명이 악한지 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'fortune_teller',
    name: '점쟁이',
    team: 'townsfolk',
    ability:
      '매일 밤, 2명의 플레이어를 선택합니다: 둘 중 악마가 있는지 알게 됩니다. 당신에게 악마로 감지되는 선한 플레이어가 1명 있습니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'undertaker',
    name: '장의사',
    team: 'townsfolk',
    ability: '매일 밤*, 오늘 처형으로 사망한 캐릭터가 누구인지 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'monk',
    name: '수도사',
    team: 'townsfolk',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다 (본인 제외): 그 플레이어는 오늘 밤 악마로부터 안전합니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'ravenkeeper',
    name: '까마귀지기',
    team: 'townsfolk',
    ability:
      '밤에 사망하면, 깨어나서 플레이어 1명을 선택합니다: 그 플레이어의 캐릭터를 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'virgin',
    name: '성결자',
    team: 'townsfolk',
    ability: '처음 지명당했을 때, 지명자가 마을주민이면 즉시 처형됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'slayer',
    name: '처단자',
    team: 'townsfolk',
    ability:
      '게임 중 1회, 낮에 공개적으로 플레이어 1명을 선택합니다: 그 플레이어가 악마이면 사망합니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'soldier',
    name: '군인',
    team: 'townsfolk',
    ability: '악마로부터 안전합니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'mayor',
    name: '시장',
    team: 'townsfolk',
    ability:
      '생존자가 3명이고 처형이 없으면 당신 팀이 승리합니다. 밤에 사망하면 다른 플레이어가 대신 사망할 수 있습니다.',
    edition: 'trouble_brewing',
  },

  // 외지인 (4)
  {
    id: 'butler',
    name: '집사',
    team: 'outsider',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다 (본인 제외): 내일, 그 플레이어가 투표할 때만 당신도 투표할 수 있습니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'drunk',
    name: '주정뱅이',
    team: 'outsider',
    ability:
      '자신이 주정뱅이인 것을 모릅니다. 마을주민 캐릭터라고 생각하지만 아닙니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'recluse',
    name: '은둔자',
    team: 'outsider',
    ability:
      '사망한 경우에도 악한 것으로, 하수인이나 악마로 감지될 수 있습니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'saint',
    name: '성자',
    team: 'outsider',
    ability: '처형으로 사망하면 당신 팀이 패배합니다.',
    edition: 'trouble_brewing',
  },

  // 하수인 (4)
  {
    id: 'poisoner',
    name: '독살범',
    team: 'minion',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다: 오늘 밤과 내일 낮 동안 중독됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'spy',
    name: '첩자',
    team: 'minion',
    ability:
      '매일 밤, 마법서를 봅니다. 사망한 경우에도 선한 것으로, 마을주민이나 외지인으로 감지될 수 있습니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'scarlet_woman',
    name: '탕녀',
    team: 'minion',
    ability: '생존자가 5명 이상이고 악마가 사망하면, 당신이 악마가 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'baron',
    name: '남작',
    team: 'minion',
    ability: '게임에 외지인이 추가됩니다. [외지인 +2]',
    edition: 'trouble_brewing',
  },

  // 악마 (1)
  {
    id: 'imp',
    name: '임프',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그 플레이어가 사망합니다. 자신을 선택하면 하수인 1명이 임프가 됩니다.',
    edition: 'trouble_brewing',
  },
];

export const SECTS_AND_VIOLETS_ROLES: Role[] = [
  // 마을주민 (13)
  {
    id: 'clockmaker',
    name: '시계공',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 악마와 가장 가까운 하수인 사이의 거리를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'dreamer',
    name: '꿈꾸는 자',
    team: 'townsfolk',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다: 그 플레이어의 역할 또는 가짜 역할 중 하나를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'snake_charmer',
    name: '뱀 조련사',
    team: 'townsfolk',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다 (이전과 다른 사람): 그 플레이어가 악마이면 당신과 역할을 교환하고, 당신은 중독됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'mathematician',
    name: '수학자',
    team: 'townsfolk',
    ability:
      '매일 밤, 지난 낮/밤 동안 능력이 잘못 작동한 플레이어 수를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'flowergirl',
    name: '꽃팔이 소녀',
    team: 'townsfolk',
    ability: '매일 밤*, 악마가 오늘 투표했는지 여부를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'town_crier',
    name: '포고꾼',
    team: 'townsfolk',
    ability: '매일 밤*, 하수인이 오늘 지명했는지 여부를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'oracle',
    name: '예언자',
    team: 'townsfolk',
    ability: '매일 밤*, 죽은 플레이어 중 몇 명이 악한지 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'savant',
    name: '백치천재',
    team: 'townsfolk',
    ability:
      '매일 낮, 스토리텔러로부터 2개의 정보를 받습니다. 하나는 참이고 하나는 거짓입니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'seamstress',
    name: '재봉사',
    team: 'townsfolk',
    ability:
      '게임 중 1회, 밤에 2명의 플레이어를 선택합니다 (본인 제외): 둘이 같은 진영인지 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'philosopher',
    name: '철학자',
    team: 'townsfolk',
    ability:
      '게임 중 1회, 밤에 선한 역할을 선택합니다: 그 역할의 능력을 얻습니다. 해당 역할의 플레이어가 있으면 그 플레이어는 중독됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'artist',
    name: '화가',
    team: 'townsfolk',
    ability:
      '게임 중 1회, 낮에 스토리텔러에게 예/아니오 질문을 할 수 있습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'juggler',
    name: '곡예사',
    team: 'townsfolk',
    ability:
      '첫째 날, 공개적으로 플레이어-역할 조합을 최대 5개 추측합니다. 그날 밤 정확한 추측 수를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'sage',
    name: '현자',
    team: 'townsfolk',
    ability:
      '악마에 의해 사망하면, 2명의 플레이어를 알게 됩니다: 둘 중 하나가 악마입니다.',
    edition: 'sects_and_violets',
  },

  // 외지인 (4)
  {
    id: 'mutant',
    name: '변종',
    team: 'outsider',
    ability:
      '자신이 외지인이라고 "밝히면", 처형될 수 있습니다. (스토리텔러 재량)',
    edition: 'sects_and_violets',
  },
  {
    id: 'sweetheart',
    name: '사랑꾼',
    team: 'outsider',
    ability: '사망하면, 1명의 플레이어가 다음 황혼부터 취한 상태가 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'barber',
    name: '이발사',
    team: 'outsider',
    ability:
      '사망하면, 악마가 오늘 밤에 2명의 플레이어를 선택할 수 있습니다: 그 둘의 역할을 교환합니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'klutz',
    name: '얼뜨기',
    team: 'outsider',
    ability:
      '사망하면, 살아있는 플레이어 1명을 선택합니다: 그 플레이어가 악하면 당신 팀이 패배합니다.',
    edition: 'sects_and_violets',
  },

  // 하수인 (4)
  {
    id: 'evil_twin',
    name: '사악한 쌍둥이',
    team: 'minion',
    ability:
      '당신과 선한 플레이어 1명은 서로가 쌍둥이임을 알게 됩니다. 선한 쌍둥이가 살아 있는 동안 처형으로 사망하지 않습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'witch',
    name: '마녀',
    team: 'minion',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다: 그 플레이어가 내일 지명하면 즉시 사망합니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'cerenovus',
    name: '세레노버스',
    team: 'minion',
    ability:
      '매일 밤, 플레이어 1명과 선한 역할을 선택합니다: 그 플레이어가 내일 그 역할이라고 주장하지 않으면 처형될 수 있습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'pit_hag',
    name: '마귀할멈',
    team: 'minion',
    ability:
      '매일 밤*, 플레이어를 선택하고 역할을 지정합니다: 그 플레이어의 역할이 변경됩니다. 같은 역할이 이미 있으면 둘 중 하나가 사망합니다.',
    edition: 'sects_and_violets',
  },

  // 악마 (1)
  {
    id: 'fang_gu',
    name: '팡 구',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그 플레이어가 사망합니다. 첫 번째 외지인 사망 시, 그 외지인이 대신 팡 구가 되고 당신은 사망합니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'vigormortis',
    name: '비고르모르티스',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그 플레이어가 사망합니다. 하수인을 죽이면 그 하수인의 능력이 유지되고, 그 하수인의 마을주민 이웃 1명이 중독됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'no_dashii',
    name: '노 다시',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그 플레이어가 사망합니다. 가장 가까운 살아있는 마을주민 2명이 중독됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'vortox',
    name: '보르톡스',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그 플레이어가 사망합니다. 마을주민의 정보는 모두 거짓입니다. 처형이 있는 날 아무도 사망하지 않으면 선한 팀이 승리합니다.',
    edition: 'sects_and_violets',
  },
];

export const EDITIONS: Edition[] = [
  {
    id: 'trouble_brewing',
    name: '점철되는 혼란',
    description: '입문자용 에디션. 21개 역할.',
  },
  {
    id: 'sects_and_violets',
    name: '화단에 꽃피운 이단',
    description: '중급자용 에디션. 25개 역할. (능력 미구현)',
    disabled: true,
  },
];

/** S&V 에디션에서 실제 능력이 구현된 역할 ID 목록 */
const IMPLEMENTED_SV_ROLE_IDS = new Set(['sweetheart']);

/** 구현된 S&V 역할만 필터링 */
const IMPLEMENTED_SV_ROLES = SECTS_AND_VIOLETS_ROLES.filter((r) =>
  IMPLEMENTED_SV_ROLE_IDS.has(r.id),
);

export const EDITION_ROLES: Record<string, Role[]> = {
  trouble_brewing: TROUBLE_BREWING_ROLES,
  sects_and_violets: IMPLEMENTED_SV_ROLES,
};

/** 모든 에디션의 역할을 합친 목록 (미구현 역할 제외) */
export const ALL_ROLES: Role[] = [
  ...TROUBLE_BREWING_ROLES,
  ...IMPLEMENTED_SV_ROLES,
];

export function getRolesForEdition(editionId: string): Role[] {
  return EDITION_ROLES[editionId] ?? TROUBLE_BREWING_ROLES;
}

export const ROLES_BY_ID = new Map(ALL_ROLES.map((r) => [r.id, r]));

export const EDITION_LABELS: Record<string, string> = {
  trouble_brewing: '혼란',
  sects_and_violets: '이단',
};

export const EDITION_COLORS: Record<string, string> = {
  trouble_brewing: '#5dade2',
  sects_and_violets: '#a569bd',
};

// 첫째 밤 진행 순서
export const FIRST_NIGHT_ORDER: string[] = [
  'poisoner',
  'washerwoman',
  'librarian',
  'investigator',
  'chef',
  'empath',
  'fortune_teller',
  'butler',
  'spy',
];

// 이후 밤 진행 순서
export const OTHER_NIGHT_ORDER: string[] = [
  'poisoner',
  'monk',
  'scarlet_woman',
  'imp',
  'ravenkeeper',
  'undertaker',
  'empath',
  'fortune_teller',
  'butler',
  'spy',
];

export function getRoleById(roleId: string): Role | undefined {
  return ROLES_BY_ID.get(roleId);
}

// 플레이어 수별 팀 구성 [마을주민, 외지인, 하수인, 악마]
export const ROLE_DISTRIBUTION: Record<
  number,
  [number, number, number, number]
> = {
  5: [3, 0, 1, 1],
  6: [3, 1, 1, 1],
  7: [5, 0, 1, 1],
  8: [5, 1, 1, 1],
  9: [5, 2, 1, 1],
  10: [7, 0, 2, 1],
  11: [7, 1, 2, 1],
  12: [7, 2, 2, 1],
  13: [9, 0, 3, 1],
  14: [9, 1, 3, 1],
  15: [9, 2, 3, 1],
  16: [10, 2, 3, 1],
  17: [11, 2, 3, 1],
  18: [12, 2, 3, 1],
  19: [13, 2, 3, 1],
  20: [14, 2, 3, 1],
};

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface RoleDistribution {
  assignments: { playerId: string; role: Role; drunkAs?: string }[];
}

export interface DistributeOptions {
  excludedRoleIds?: string[];
  editionId?: string;
  /** 다른 에디션에서 추가로 포함할 역할 ID 목록 (크로스 에디션 믹싱) */
  additionalRoleIds?: string[];
}

/**
 * 플레이어 수에 맞게 역할을 자동 배분합니다.
 * 남작이 포함되면 외지인 +2, 마을주민 -2 적용.
 */
export function distributeRoles(
  playerIds: string[],
  options?: DistributeOptions,
): RoleDistribution | null {
  const count = playerIds.length;
  const dist = ROLE_DISTRIBUTION[count];
  if (!dist) return null;

  let [townsfolkCount, outsiderCount, minionCount, demonCount] = dist;

  const excluded = new Set(options?.excludedRoleIds ?? []);
  const editionRoles = getRolesForEdition(
    options?.editionId ?? 'trouble_brewing',
  );

  // 크로스 에디션 믹싱: 다른 에디션 역할 추가
  const additionalIds = new Set(options?.additionalRoleIds ?? []);
  const editionRoleIds = new Set(editionRoles.map((r) => r.id));
  const additionalRoles =
    additionalIds.size > 0
      ? ALL_ROLES.filter(
          (r) => additionalIds.has(r.id) && !editionRoleIds.has(r.id),
        )
      : [];
  const allRoles = [...editionRoles, ...additionalRoles];

  const townsfolk = allRoles.filter(
    (r) => r.team === 'townsfolk' && !excluded.has(r.id),
  );
  const outsiders = allRoles.filter(
    (r) => r.team === 'outsider' && !excluded.has(r.id),
  );
  const minions = allRoles.filter(
    (r) => r.team === 'minion' && !excluded.has(r.id),
  );
  const demons = allRoles.filter(
    (r) => r.team === 'demon' && !excluded.has(r.id),
  );

  // 제외 후 역할이 부족하면 배분 불가
  if (
    townsfolk.length < townsfolkCount ||
    outsiders.length < outsiderCount ||
    demons.length < demonCount ||
    minions.length < minionCount
  ) {
    return null;
  }

  // 하수인 랜덤 선택 (마을주민이 부족한 경우 남작 필수 포함)
  const baron = minions.find((r) => r.id === 'baron');
  const otherMinions = minions.filter((r) => r.id !== 'baron');
  const forceIncludeBaron = townsfolkCount > townsfolk.length && !!baron;
  let selectedMinions: Role[];
  if (forceIncludeBaron && baron) {
    selectedMinions = [
      baron,
      ...shuffle(otherMinions).slice(0, minionCount - 1),
    ];
  } else {
    selectedMinions = shuffle(minions).slice(0, minionCount);
  }

  // 남작이 포함되면 외지인 +2, 마을주민 -2
  const hasBaron = selectedMinions.some((r) => r.id === 'baron');
  if (hasBaron) {
    outsiderCount = Math.min(outsiderCount + 2, outsiders.length);
    townsfolkCount = count - outsiderCount - minionCount - demonCount;
  }

  const selectedDemons = shuffle(demons).slice(0, demonCount);
  const selectedOutsiders = shuffle(outsiders).slice(0, outsiderCount);
  const selectedTownsfolk = shuffle(townsfolk).slice(0, townsfolkCount);

  // 주정뱅이가 포함된 경우, 게임에 없는 마을주민 중 하나를 가짜 역할로 선택
  const hasDrunk = selectedOutsiders.some((r) => r.id === 'drunk');
  let drunkFakeRoleId: string | undefined;
  if (hasDrunk) {
    const unselectedTownsfolk = townsfolk.filter(
      (t) => !selectedTownsfolk.some((st) => st.id === t.id),
    );
    if (unselectedTownsfolk.length > 0) {
      drunkFakeRoleId =
        unselectedTownsfolk[
          Math.floor(Math.random() * unselectedTownsfolk.length)
        ].id;
    }
  }

  const shuffledRoles = shuffle([
    ...selectedTownsfolk,
    ...selectedOutsiders,
    ...selectedMinions,
    ...selectedDemons,
  ]);

  const shuffledPlayerIds = shuffle(playerIds);

  return {
    assignments: shuffledPlayerIds.map((playerId, i) => ({
      playerId,
      role: shuffledRoles[i],
      ...(shuffledRoles[i].id === 'drunk' && drunkFakeRoleId
        ? { drunkAs: drunkFakeRoleId }
        : {}),
    })),
  };
}

export const NIGHT_ACTIONS: Record<string, NightActionDef> = {
  poisoner: {
    type: 'select_one',
    instruction: '중독시킬 플레이어를 선택하세요',
    excludeSelf: true,
  },
  monk: {
    type: 'select_one',
    instruction: '보호할 플레이어를 선택하세요',
    excludeSelf: true,
  },
  imp: {
    type: 'select_one',
    instruction: '죽일 플레이어를 선택하세요',
    excludeSelf: false,
  },
  butler: {
    type: 'select_one',
    instruction: '주인으로 삼을 플레이어를 선택하세요',
    excludeSelf: true,
  },
  ravenkeeper: {
    type: 'select_one',
    instruction: '캐릭터를 확인할 플레이어를 선택하세요',
    excludeSelf: true,
  },
  fortune_teller: {
    type: 'select_two',
    instruction: '확인할 플레이어 2명을 선택하세요',
    excludeSelf: true,
  },
  washerwoman: {
    type: 'passive',
    instruction: '진행자가 정보를 알려줍니다',
    excludeSelf: false,
  },
  librarian: {
    type: 'passive',
    instruction: '진행자가 정보를 알려줍니다',
    excludeSelf: false,
  },
  investigator: {
    type: 'passive',
    instruction: '진행자가 정보를 알려줍니다',
    excludeSelf: false,
  },
  chef: {
    type: 'passive',
    instruction: '진행자가 정보를 알려줍니다',
    excludeSelf: false,
  },
  empath: {
    type: 'passive',
    instruction: '진행자가 정보를 알려줍니다',
    excludeSelf: false,
  },
  undertaker: {
    type: 'passive',
    instruction: '진행자가 정보를 알려줍니다',
    excludeSelf: false,
  },
  spy: {
    type: 'passive',
    instruction: '진행자가 마법서 정보를 알려줍니다',
    excludeSelf: false,
  },
  scarlet_woman: {
    type: 'passive',
    instruction: '대기 중...',
    excludeSelf: false,
  },
};

export const NIGHT_FEEDBACK: Record<string, NightFeedbackDef> = {
  washerwoman: { type: 'players_and_role', roleTeamFilter: 'townsfolk' },
  librarian: {
    type: 'players_and_role',
    roleTeamFilter: 'outsider',
    allowNone: true,
  },
  investigator: { type: 'players_and_role', roleTeamFilter: 'minion' },
  chef: { type: 'number' },
  empath: { type: 'number' },
  fortune_teller: { type: 'yes_no' },
  undertaker: { type: 'role' },
  ravenkeeper: { type: 'role' },
  spy: { type: 'grimoire' },
};
