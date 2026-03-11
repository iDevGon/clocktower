import type { Edition, NightActionDef, NightFeedbackDef, Role } from './types';

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
  },
  {
    id: 'librarian',
    name: '사서',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 2명의 플레이어 중 1명이 특정 외지인임을 알게 됩니다. (또는 외지인이 없음을 알 수 있습니다.)',
  },
  {
    id: 'investigator',
    name: '수사관',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 2명의 플레이어 중 1명이 특정 하수인임을 알게 됩니다.',
  },
  {
    id: 'chef',
    name: '요리사',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 서로 이웃한 악한 플레이어 쌍이 몇 개인지 알게 됩니다.',
  },
  {
    id: 'empath',
    name: '초공감자',
    team: 'townsfolk',
    ability: '매일 밤, 살아있는 양쪽 이웃 중 몇 명이 악한지 알게 됩니다.',
  },
  {
    id: 'fortune_teller',
    name: '점쟁이',
    team: 'townsfolk',
    ability:
      '매일 밤, 2명의 플레이어를 선택합니다: 둘 중 악마가 있는지 알게 됩니다. 당신에게 악마로 감지되는 선한 플레이어가 1명 있습니다.',
  },
  {
    id: 'undertaker',
    name: '장의사',
    team: 'townsfolk',
    ability: '매일 밤*, 오늘 처형으로 사망한 캐릭터가 누구인지 알게 됩니다.',
  },
  {
    id: 'monk',
    name: '수도사',
    team: 'townsfolk',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다 (본인 제외): 그 플레이어는 오늘 밤 악마로부터 안전합니다.',
  },
  {
    id: 'ravenkeeper',
    name: '까마귀지기',
    team: 'townsfolk',
    ability:
      '밤에 사망하면, 깨어나서 플레이어 1명을 선택합니다: 그 플레이어의 캐릭터를 알게 됩니다.',
  },
  {
    id: 'virgin',
    name: '성결자',
    team: 'townsfolk',
    ability: '처음 지명당했을 때, 지명자가 마을주민이면 즉시 처형됩니다.',
  },
  {
    id: 'slayer',
    name: '처단자',
    team: 'townsfolk',
    ability:
      '게임 중 1회, 낮에 공개적으로 플레이어 1명을 선택합니다: 그 플레이어가 악마이면 사망합니다.',
  },
  {
    id: 'soldier',
    name: '군인',
    team: 'townsfolk',
    ability: '악마로부터 안전합니다.',
  },
  {
    id: 'mayor',
    name: '시장',
    team: 'townsfolk',
    ability:
      '생존자가 3명이고 처형이 없으면 당신 팀이 승리합니다. 밤에 사망하면 다른 플레이어가 대신 사망할 수 있습니다.',
  },

  // 외지인 (4)
  {
    id: 'butler',
    name: '집사',
    team: 'outsider',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다 (본인 제외): 내일, 그 플레이어가 투표할 때만 당신도 투표할 수 있습니다.',
  },
  {
    id: 'drunk',
    name: '주정뱅이',
    team: 'outsider',
    ability:
      '자신이 주정뱅이인 것을 모릅니다. 마을주민 캐릭터라고 생각하지만 아닙니다.',
  },
  {
    id: 'recluse',
    name: '은둔자',
    team: 'outsider',
    ability:
      '사망한 경우에도 악한 것으로, 하수인이나 악마로 감지될 수 있습니다.',
  },
  {
    id: 'saint',
    name: '성자',
    team: 'outsider',
    ability: '처형으로 사망하면 당신 팀이 패배합니다.',
  },

  // 하수인 (4)
  {
    id: 'poisoner',
    name: '독살범',
    team: 'minion',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다: 오늘 밤과 내일 낮 동안 중독됩니다.',
  },
  {
    id: 'spy',
    name: '첩자',
    team: 'minion',
    ability:
      '매일 밤, 마법서를 봅니다. 사망한 경우에도 선한 것으로, 마을주민이나 외지인으로 감지될 수 있습니다.',
  },
  {
    id: 'scarlet_woman',
    name: '탕녀',
    team: 'minion',
    ability: '생존자가 5명 이상이고 악마가 사망하면, 당신이 악마가 됩니다.',
  },
  {
    id: 'baron',
    name: '남작',
    team: 'minion',
    ability: '게임에 외지인이 추가됩니다. [외지인 +2]',
  },

  // 악마 (1)
  {
    id: 'imp',
    name: '임프',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그 플레이어가 사망합니다. 자신을 선택하면 하수인 1명이 임프가 됩니다.',
  },
];

export const EDITIONS: Edition[] = [
  {
    id: 'trouble_brewing',
    name: 'Trouble Brewing',
    description: '입문자용 에디션. 21개 역할.',
  },
];

export const EDITION_ROLES: Record<string, Role[]> = {
  trouble_brewing: TROUBLE_BREWING_ROLES,
};

export function getRolesForEdition(editionId: string): Role[] {
  return EDITION_ROLES[editionId] ?? TROUBLE_BREWING_ROLES;
}

export const ROLES_BY_ID = new Map(TROUBLE_BREWING_ROLES.map((r) => [r.id, r]));

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
  const allRoles = getRolesForEdition(options?.editionId ?? 'trouble_brewing');

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
