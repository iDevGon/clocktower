import type {
  Edition,
  NightActionDef,
  NightFeedbackDef,
  Role,
  TravellerRole,
} from './types.js';

// 밤 행동이 있는 전체 역할 (순서대로)
export const ALL_NIGHT_ROLES: string[] = [
  // Trouble Brewing
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
  // Sects & Violets
  'witch',
  'cerenovus',
  'pit_hag',
  'fang_gu',
  'vigormortis',
  'no_dashii',
  'vortox',
  'snake_charmer',
  'clockmaker',
  'dreamer',
  'mathematician',
  'flowergirl',
  'town_crier',
  'oracle',
  'seamstress',
  'philosopher',
  'juggler',
  'sage',
];

export const TROUBLE_BREWING_ROLES: Role[] = [
  // 마을주민 (13)
  {
    id: 'washerwoman',
    name: '세탁부',
    team: 'townsfolk',
    ability: '게임 시작 시, 플레이어 2명 중 1명이 특정 주민임을 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'librarian',
    name: '사서',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 플레이어 2명 중 1명이 특정 외지인임을 알게 됩니다. 또는, 게임에 참여하는 외지인이 없음을 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'investigator',
    name: '수사관',
    team: 'townsfolk',
    ability: '게임 시작 시, 플레이어 2명 중 1명이 특정 하수인임을 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'chef',
    name: '요리사',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 서로 이웃하게 앉은 악한 플레이어가 몇 쌍 있는지 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'empath',
    name: '초공감자',
    team: 'townsfolk',
    ability: '매일 밤, 이웃 생존자 2명 중 몇 명이나 악한지를 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'fortune_teller',
    name: '점쟁이',
    team: 'townsfolk',
    ability:
      '매일 밤, 플레이어 2명을 선택합니다: 그중 악마가 있는지를 알게 됩니다. 단, 선한 플레이어 중 1명이 당신에게는 악마로 감지되어 보입니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'undertaker',
    name: '장의사',
    team: 'townsfolk',
    ability:
      '매일 밤*, 오늘 낮에 처형으로 사망한 플레이어의 캐릭터를 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'monk',
    name: '수도사',
    team: 'townsfolk',
    ability:
      '매일 밤*, (당신을 제외하고) 플레이어 1명을 선택합니다: 그는 오늘 밤 악마로부터 안전합니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'ravenkeeper',
    name: '까마귀지기',
    team: 'townsfolk',
    ability:
      '밤에 사망하면, 깨어나서 플레이어 1명을 선택합니다: 그의 캐릭터를 알게 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'virgin',
    name: '성결자',
    team: 'townsfolk',
    ability:
      '처음으로 지목당했을 때, 당신을 지목한 플레이어가 주민이라면, 그는 즉시 처형됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'slayer',
    name: '처단자',
    team: 'townsfolk',
    ability:
      '게임당 1번, 낮에, 공개적으로 플레이어 1명을 선택합니다: 그가 악마면 그는 사망합니다.',
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
      '3명만 생존한 상황에서 처형이 일어나지 않았다면, 당신의 팀이 승리합니다. 만약 밤에 사망한다면, 그 대신 다른 플레이어 1명이 사망할 수 있습니다.',
    edition: 'trouble_brewing',
  },

  // 외지인 (4)
  {
    id: 'butler',
    name: '집사',
    team: 'outsider',
    ability:
      '매일 밤, (당신을 제외하고) 플레이어 1명을 선택합니다: 다음 낮에 그가 투표에 참여하는 경우에만, 당신도 투표에 참여할 수 있습니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'drunk',
    name: '주정뱅이',
    team: 'outsider',
    ability:
      '당신은 자신이 주정뱅이라는 사실을 모릅니다. 대신, 주민 캐릭터라고 착각하지만, 실제로는 주정뱅이입니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'recluse',
    name: '은둔자',
    team: 'outsider',
    ability:
      '당신은 악한 팀 소속의 특정 하수인 또는 악마로 위장될 수도 있습니다(사망한 상태에서도).',
    edition: 'trouble_brewing',
  },
  {
    id: 'saint',
    name: '성자',
    team: 'outsider',
    ability: '당신이 처형으로 사망하면, 당신의 선한 팀이 패배합니다.',
    edition: 'trouble_brewing',
  },

  // 하수인 (4)
  {
    id: 'poisoner',
    name: '독살범',
    team: 'minion',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다: 그는 오늘 밤과 내일 낮 동안 중독됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'spy',
    name: '첩자',
    team: 'minion',
    ability:
      '매일 밤, 마도서를 확인합니다. 당신은 선한 팀 소속의 특정 주민 또는 외지인으로 감지될 수도 있습니다(사망한 상태에서도).',
    edition: 'trouble_brewing',
  },
  {
    id: 'scarlet_woman',
    name: '탕녀',
    team: 'minion',
    ability:
      '플레이어가 5명 이상 생존해있는 사이(여행자는 제외) 악마가 사망하면, 당신이 악마가 됩니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'baron',
    name: '남작',
    team: 'minion',
    ability: '외지인이 추가로 게임에 참여합니다. [외지인 +2명]',
    edition: 'trouble_brewing',
  },

  // 악마 (1)
  {
    id: 'imp',
    name: '임프',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 이 방법으로 자결하면, 하수인 1명이 임프가 됩니다.',
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
      '매일 밤, 당신과 여행자를 제외하고 플레이어 1명을 선택합니다: 선한 캐릭터 1개와 악한 캐릭터 1개를 알게 됩니다. 둘 중 하나가 그의 정체입니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'snake_charmer',
    name: '뱀 조련사',
    team: 'townsfolk',
    ability:
      '매일 밤, 생존한 플레이어 1명을 선택합니다: 악마를 선택했다면, 악마는 당신과 소속 및 캐릭터를 맞바꾼 다음 중독됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'mathematician',
    name: '수학자',
    team: 'townsfolk',
    ability:
      '매일 밤, 새벽부터 지금까지 다른 플레이어의 능력 때문에 능력이 이상하게 작동한 플레이어가 몇 명인지 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'flowergirl',
    name: '꽃팔이 소녀',
    team: 'townsfolk',
    ability: '매일 밤*, 오늘 낮에 악마가 투표했는지를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'town_crier',
    name: '포고꾼',
    team: 'townsfolk',
    ability: '매일 밤*, 오늘 낮에 하수인이 지명에 나섰는지를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'oracle',
    name: '예언자',
    team: 'townsfolk',
    ability:
      '매일 밤*, 사망한 플레이어 가운데 몇 명이나 악한 팀인지 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'savant',
    name: '백치천재',
    team: 'townsfolk',
    ability:
      '매일 낮, 이야기꾼으로부터 이야기에 도움되는 정보 2가지를 얻습니다: 그중 하나는 진실이고 다른 하나는 거짓입니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'seamstress',
    name: '재봉사',
    team: 'townsfolk',
    ability:
      '게임당 1번, 밤에, (당신을 제외하고) 플레이어 2명을 선택합니다: 그들이 같은 소속인지 아닌지를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'philosopher',
    name: '철학자',
    team: 'townsfolk',
    ability:
      '게임당 1번, 밤에, 선한 캐릭터 1개를 선택합니다: 그의 능력을 얻습니다. 그 캐릭터가 이미 게임에 참여하고 있다면, 그는 취합니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'artist',
    name: '화가',
    team: 'townsfolk',
    ability:
      '게임당 1번, 낮에, 이야기꾼에게 예/아니오로 답할 수 있는 질문을 합니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'juggler',
    name: '곡예사',
    team: 'townsfolk',
    ability:
      '첫 번째 낮에, 공개적으로 플레이어/역할 조합을 5개까지 추측할 수 있습니다. 그날 밤, 그중 몇 개나 맞혔는지를 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'sage',
    name: '현자',
    team: 'townsfolk',
    ability:
      '악마가 당신을 죽이면, 플레이어 2명을 알게 됩니다. 그중 1명이 악마입니다.',
    edition: 'sects_and_violets',
  },

  // 외지인 (4)
  {
    id: 'mutant',
    name: '변종',
    team: 'outsider',
    ability: '당신이 외지인이라는 사실에 미쳐 있다면, 처형당할 수도 있습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'sweetheart',
    name: '사랑꾼',
    team: 'outsider',
    ability: '당신이 사망하면, 그때부터 플레이어 1명이 취한 상태가 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'barber',
    name: '이발사',
    team: 'outsider',
    ability:
      '오늘 또는 오늘 밤에 사망했다면, 악마는 플레이어 2명을 선택합니다(다른 악마는 제외): 그 두 명의 캐릭터를 맞바꿀 수 있습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'klutz',
    name: '얼뜨기',
    team: 'outsider',
    ability:
      '당신이 사망하면, 생존한 플레이어 1명을 공개적으로 선택합니다: 그가 악한 플레이어라면, 당신의 팀이 패배합니다.',
    edition: 'sects_and_violets',
  },

  // 하수인 (4)
  {
    id: 'evil_twin',
    name: '사악한 쌍둥이',
    team: 'minion',
    ability:
      '당신과 선한 쌍둥이는 서로를 알아봅니다. 선한 쌍둥이가 처형당하면, 악한 팀이 승리합니다. 선/악 쌍둥이가 둘 다 살아있는 한, 선한 팀은 승리할 수 없습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'witch',
    name: '마녀',
    team: 'minion',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다: 그가 다음 낮에 누군가를 지목한다면, 그는 사망합니다. 플레이어가 3명만 남았다면, 이 능력은 무효입니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'cerenovus',
    name: '세레노버스',
    team: 'minion',
    ability:
      '매일 밤, 플레이어 1명과 선한 캐릭터 1개를 선택합니다: 내일 낮, 그 플레이어가 그 캐릭터라고 주장하지 않으면 처형될 수도 있습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'pit_hag',
    name: '마귀할멈',
    team: 'minion',
    ability:
      '매일 밤*, 플레이어 1명과 현재 게임에 참여하지 않은 캐릭터 1개를 선택합니다: 그 플레이어가 그 캐릭터로 바뀝니다. 이 능력으로 악마를 만들었다면, 오늘 밤 예측불허의 죽음이 찾아옵니다.',
    edition: 'sects_and_violets',
  },

  // 악마 (4)
  {
    id: 'fang_gu',
    name: '팡 구',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 이 방법으로 첫 번째 외지인이 사망하면, 그가 팡 구가 되고 당신이 사망합니다. [외지인 +1명]',
    edition: 'sects_and_violets',
  },
  {
    id: 'vigormortis',
    name: '비고르모르티스',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 죽은 하수인은 능력을 유지하며, 그의 양쪽 주민 이웃은 중독됩니다. [외지인 -1명]',
    edition: 'sects_and_violets',
  },
  {
    id: 'no_dashii',
    name: '노 다시',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신의 이웃 주민 2명은 중독됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'vortox',
    name: '보르톡스',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택합니다: 그는 사망합니다. 주민의 능력은 거짓 정보만 제공합니다. 매일 낮, 누구도 처형되지 않으면 악한 팀이 승리합니다.',
    edition: 'sects_and_violets',
  },
];

export const BAD_MOON_RISING_ROLES: Role[] = [
  // 마을주민 (13)
  {
    id: 'grandmother',
    name: '할머니',
    team: 'townsfolk',
    ability:
      '게임 시작 시, 선한 플레이어 1명과 그의 캐릭터를 알게 됩니다. 악마가 그 플레이어를 죽이면 당신도 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'sailor',
    name: '선원',
    team: 'townsfolk',
    ability:
      '매일 밤, 생존한 플레이어 1명을 선택합니다: 당신과 그중 1명은 황혼까지 취합니다. 당신은 사망할 수 없습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'chambermaid',
    name: '객실 청소부',
    team: 'townsfolk',
    ability:
      '매일 밤, (당신을 제외하고) 생존한 플레이어 2명을 선택합니다: 그중 몇 명이 오늘 밤 자기 능력으로 인해 자신이 깨어났는지 알게 됩니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'exorcist',
    name: '구마사제',
    team: 'townsfolk',
    ability:
      '매일 밤*, (지난밤에 선택하지 않은) 플레이어 1명을 선택합니다: 악마를 선택한다면 그 악마는 당신의 정체를 알게 되지만 오늘 밤 깨어나지 않습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'innkeeper',
    name: '여관 주인',
    team: 'townsfolk',
    ability:
      '매일 밤*, 플레이어 2명을 선택합니다: 이들은 오늘 밤 사망할 수 없으나, 그중 1명은 황혼까지 취합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'gambler',
    name: '도박사',
    team: 'townsfolk',
    ability:
      '매일 밤*, 플레이어 1명을 선택하고 그의 캐릭터를 추측합니다: 추측이 틀리면, 당신은 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'gossip',
    name: '험담꾼',
    team: 'townsfolk',
    ability:
      '매일 낮, 당신은 공개 발언을 할 수 있습니다. 오늘 밤, 그 발언이 사실이었다면 플레이어 1명이 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'courtier',
    name: '궁정대신',
    team: 'townsfolk',
    ability:
      '게임당 1번, 밤에 캐릭터 1명을 선택합니다: 그 플레이어는 3일 밤낮 동안 취합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'professor',
    name: '교수',
    team: 'townsfolk',
    ability:
      '게임당 1번, 밤*에, 사망한 플레이어 1명을 선택합니다: 그 플레이어가 주민이라면, 그 플레이어는 부활합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'minstrel',
    name: '음유시인',
    team: 'townsfolk',
    ability:
      '하수인 1명이 처형으로 사망하면, (여행자를 제외하고) 다른 모든 플레이어는 다음 날 황혼까지 취합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'tea_lady',
    name: '찻집 여인',
    team: 'townsfolk',
    ability:
      '이웃 생존자 2명이 모두 선한 플레이어라면, 이들은 사망할 수 없습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'pacifist',
    name: '평화주의자',
    team: 'townsfolk',
    ability: '선한 플레이어가 처형당하면, 그는 사망하지 않을 수도 있습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'fool',
    name: '어릿광대',
    team: 'townsfolk',
    ability: '당신이 처음으로 사망할 때, 사망하지 않습니다.',
    edition: 'bad_moon_rising',
  },

  // 외지인 (4)
  {
    id: 'goon',
    name: '건달',
    team: 'outsider',
    ability:
      '매일 밤, 자기 능력으로 당신을 선택하는 첫 플레이어는 황혼까지 취합니다. 당신은 그 플레이어가 소속한 팀이 됩니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'lunatic',
    name: '미치광이',
    team: 'outsider',
    ability:
      '당신은 악마가 아니지만, 악마라고 착각합니다. 악마는 당신이 누구인지 알고, 밤에 당신이 누구를 선택하는지 알게 됩니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'tinker',
    name: '땜장이',
    team: 'outsider',
    ability: '당신은 언제든지 돌연 사망할 수도 있습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'moonchild',
    name: '달의 자손',
    team: 'outsider',
    ability:
      '당신이 사망했음을 알게 될 때, 생존한 플레이어 1명을 공개적으로 선택합니다. 그가 선한 플레이어라면, 오늘 밤 그는 사망합니다.',
    edition: 'bad_moon_rising',
  },

  // 하수인 (4)
  {
    id: 'godfather',
    name: '대부',
    team: 'minion',
    ability:
      '게임 시작 시, 어느 외지인이 게임에 참여하는지 알게 됩니다. 낮에 외지인 1명이 사망하면, 그날 밤 플레이어 1명을 선택합니다: 그는 사망합니다. [외지인 -1명 또는 +1명]',
    edition: 'bad_moon_rising',
  },
  {
    id: 'devils_advocate',
    name: '악마의 변호사',
    team: 'minion',
    ability:
      '매일 밤, (지난밤에 선택하지 않은) 생존한 플레이어 1명을 선택합니다: 그 플레이어가 내일 처형당하면, 그는 사망하지 않습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'assassin',
    name: '암살자',
    team: 'minion',
    ability:
      '게임당 1번, 밤*에, 플레이어 1명을 선택합니다: 그 플레이어는 이유불문 사망합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'mastermind',
    name: '주모자',
    team: 'minion',
    ability:
      '악마가 처형으로 사망하면(게임 종료 조건), 하루 더 게임을 진행합니다. 그런 다음, 플레이어 1명이 처형당하면, 그 플레이어가 소속된 팀이 패배합니다.',
    edition: 'bad_moon_rising',
  },

  // 악마 (4)
  {
    id: 'zombuul',
    name: '좀버얼',
    team: 'demon',
    ability:
      '매일 밤*, 오늘 낮에 누구도 사망하지 않았다면, 플레이어 1명을 선택합니다: 그는 사망합니다. 당신이 처음으로 사망할 때, 실제로는 생존해 있지만 사망한 상태로 위장합니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'pukka',
    name: '푸카',
    team: 'demon',
    ability:
      '매일 밤, 플레이어 1명을 선택합니다: 그는 중독됩니다. 이전에 당신이 중독시켰던 플레이어는 사망하고, 건강한 상태가 됩니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'shabaloth',
    name: '사발로스',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 2명을 선택합니다: 그들은 사망합니다. 지난밤에 당신이 선택했던 사망한 플레이어를 다시 토해낼 수도 있습니다(살아납니다).',
    edition: 'bad_moon_rising',
  },
  {
    id: 'po',
    name: '포',
    team: 'demon',
    ability:
      '매일 밤*, 플레이어 1명을 선택할 수 있습니다. 그는 사망합니다. 이전에 누구도 선택하지 않았다면, 오늘 밤에는 사망할 플레이어 3명을 선택합니다.',
    edition: 'bad_moon_rising',
  },
];

// ── 여행자 (Traveller) 역할 정의 ──

export const TROUBLE_BREWING_TRAVELLERS: TravellerRole[] = [
  {
    id: 'scapegoat',
    name: '희생양',
    team: 'traveller',
    ability:
      '당신의 팀 소속 플레이어 1명이 처형당하면, 당신이 대신 처형당할 수도 있습니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'gunslinger',
    name: '총잡이',
    team: 'traveller',
    ability:
      '매일 낮, 첫 번째 투표를 집계한 후, 투표에 참여한 플레이어 1명을 선택할 수 있습니다. 그는 사망합니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'beggar',
    name: '거지',
    team: 'traveller',
    ability:
      '투표하려면 투표 토큰이 필요합니다. 사망한 플레이어에게서 투표 토큰을 받으면, 그의 소속을 알아냅니다. 당신은 맨정신이며 건강합니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'bureaucrat',
    name: '관료',
    team: 'traveller',
    ability:
      '매일 밤, (당신을 제외하고) 플레이어 1명을 선택합니다: 다음 날, 그의 투표는 3표로 계산합니다.',
    edition: 'trouble_brewing',
  },
  {
    id: 'thief',
    name: '도둑',
    team: 'traveller',
    ability:
      '매일 밤, (당신을 제외하고) 플레이어 1명을 선택합니다. 다음 날, 그의 투표는 음수로 계산합니다.',
    edition: 'trouble_brewing',
  },
];

export const SECTS_AND_VIOLETS_TRAVELLERS: TravellerRole[] = [
  {
    id: 'butcher_traveller',
    name: '푸주한',
    team: 'traveller',
    ability:
      '매일 낮, 첫 번째 처형이 끝난 후, 당신은 한 번 더 지목할 수 있습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'bone_collector',
    name: '뼈 수집가',
    team: 'traveller',
    ability:
      '게임당 1번, 밤에, 사망한 플레이어 1명을 선택합니다. 그는 황혼까지 자기 능력을 되찾습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'harlot',
    name: '매춘부',
    team: 'traveller',
    ability:
      '매일 밤*, 생존한 플레이어 1명을 선택합니다: 그가 동의한다면, 그의 캐릭터를 알게 되지만 둘 다 사망할 수도 있습니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'barista',
    name: '바리스타',
    team: 'traveller',
    ability:
      '매일 밤, 황혼이 될 때까지 플레이어 1명으로 하여금, 1) 맨정신 및 건강한 상태로 진실된 정보만 얻게 만들거나 2) 능력이 2번 작동하게 합니다. 그는 둘 중 무엇을 적용받는지 알게 됩니다.',
    edition: 'sects_and_violets',
  },
  {
    id: 'deviant',
    name: '이단아',
    team: 'traveller',
    ability: '오늘 웃음을 선사했다면, 추방으로 사망할 수 없습니다.',
    edition: 'sects_and_violets',
  },
];

export const BAD_MOON_RISING_TRAVELLERS: TravellerRole[] = [
  {
    id: 'apprentice',
    name: '수습생',
    team: 'traveller',
    ability:
      '당신의 첫 번째 밤에 선한 팀이라면 주민의 능력을, 악한 팀이라면 하수인의 능력을 얻습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'matron',
    name: '가정교사',
    team: 'traveller',
    ability:
      '매일 낮, 플레이어 2명의 자리를 맞바꿀 수 있습니다(낮마다 총 3번까지 가능). 플레이어들은 자기 자리를 떠나 1:1로 대화할 수 없습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'voudon',
    name: '부두술사',
    team: 'traveller',
    ability:
      '오직 사망한 플레이어와 당신만 투표할 수 있습니다. 투표 토큰 없이도 투표할 수 있으며, 50% 이상의 찬성표를 요구하지 않습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'judge',
    name: '판사',
    team: 'traveller',
    ability:
      '게임당 1번, 다른 플레이어가 누군가를 지목했을 때, 이번 처형의 성패를 당신이 단독으로 선택할 수 있습니다.',
    edition: 'bad_moon_rising',
  },
  {
    id: 'bishop',
    name: '주교',
    team: 'traveller',
    ability:
      '이야기꾼만이 누군가를 지목할 수 있습니다. 매일 낮, 상대 팀 플레이어 1명 이상이 지목되어야 합니다.',
    edition: 'bad_moon_rising',
  },
];

/** 모든 여행자 역할 */
export const ALL_TRAVELLER_ROLES: TravellerRole[] = [
  ...TROUBLE_BREWING_TRAVELLERS,
  ...SECTS_AND_VIOLETS_TRAVELLERS,
  ...BAD_MOON_RISING_TRAVELLERS,
];

/** 에디션별 여행자 역할 */
export const EDITION_TRAVELLERS: Record<string, TravellerRole[]> = {
  trouble_brewing: TROUBLE_BREWING_TRAVELLERS,
  sects_and_violets: SECTS_AND_VIOLETS_TRAVELLERS,
  bad_moon_rising: BAD_MOON_RISING_TRAVELLERS,
};

export function getTravellersForEdition(editionId: string): TravellerRole[] {
  return EDITION_TRAVELLERS[editionId] ?? [];
}

export const TRAVELLER_ROLES_BY_ID = new Map(
  ALL_TRAVELLER_ROLES.map((r) => [r.id, r]),
);

export function getTravellerById(roleId: string): TravellerRole | undefined {
  return TRAVELLER_ROLES_BY_ID.get(roleId);
}

export const EDITIONS: Edition[] = [
  {
    id: 'trouble_brewing',
    name: '점철되는 혼란',
    description: '입문자용 에디션. 21개 역할.',
  },
  {
    id: 'sects_and_violets',
    name: '화단에 꽃피운 이단',
    description: '중급자용 에디션. 25개 역할.',
  },
  {
    id: 'bad_moon_rising',
    name: '피로 물든 달',
    description: '중급자용 에디션. 25개 역할.',
  },
];

export const EDITION_ROLES: Record<string, Role[]> = {
  trouble_brewing: TROUBLE_BREWING_ROLES,
  sects_and_violets: SECTS_AND_VIOLETS_ROLES,
  bad_moon_rising: BAD_MOON_RISING_ROLES,
};

/** 모든 에디션의 역할을 합친 목록 */
export const ALL_ROLES: Role[] = [
  ...TROUBLE_BREWING_ROLES,
  ...SECTS_AND_VIOLETS_ROLES,
  ...BAD_MOON_RISING_ROLES,
];

export function getRolesForEdition(editionId: string): Role[] {
  return EDITION_ROLES[editionId] ?? TROUBLE_BREWING_ROLES;
}

export const ROLES_BY_ID = new Map(ALL_ROLES.map((r) => [r.id, r]));

export const EDITION_LABELS: Record<string, string> = {
  trouble_brewing: '혼란',
  sects_and_violets: '이단',
  bad_moon_rising: '피달',
};

export const EDITION_COLORS: Record<string, string> = {
  trouble_brewing: '#5dade2',
  sects_and_violets: '#a569bd',
  bad_moon_rising: '#b85c5c',
};

// ── Trouble Brewing 밤 진행 순서 ──

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
  'bureaucrat',
  'thief',
  'spy',
];

// 이후 밤 진행 순서
export const OTHER_NIGHT_ORDER: string[] = [
  'poisoner',
  'monk',
  'imp',
  'ravenkeeper',
  'undertaker',
  'empath',
  'fortune_teller',
  'butler',
  'bureaucrat',
  'thief',
  'spy',
];

// ── Sects & Violets 밤 진행 순서 ──

// S&V 첫째 밤 진행 순서
export const SV_FIRST_NIGHT_ORDER: string[] = [
  'barista',
  'philosopher',
  'snake_charmer',
  'evil_twin',
  'witch',
  'cerenovus',
  'clockmaker',
  'dreamer',
  'seamstress',
  'mathematician',
];

// S&V 이후 밤 진행 순서
export const SV_OTHER_NIGHT_ORDER: string[] = [
  'barista',
  'philosopher',
  'snake_charmer',
  'witch',
  'cerenovus',
  'pit_hag',
  'fang_gu',
  'vigormortis',
  'no_dashii',
  'vortox',
  'sage',
  'dreamer',
  'seamstress',
  'flowergirl',
  'town_crier',
  'oracle',
  'mathematician',
  'juggler',
  'bone_collector',
  'harlot',
];

// ── Bad Moon Rising 밤 진행 순서 ──

// BMR 첫째 밤 진행 순서
export const BMR_FIRST_NIGHT_ORDER: string[] = [
  'sailor',
  'courtier',
  'godfather',
  'devils_advocate',
  'pukka',
  'apprentice',
  'grandmother',
  'chambermaid',
];

// BMR 이후 밤 진행 순서
export const BMR_OTHER_NIGHT_ORDER: string[] = [
  'sailor',
  'innkeeper',
  'courtier',
  'gambler',
  'devils_advocate',
  'lunatic',
  'exorcist',
  'zombuul',
  'pukka',
  'shabaloth',
  'po',
  'assassin',
  'godfather',
  'professor',
  'gossip',
  'tinker',
  'moonchild',
  'apprentice',
  'grandmother',
  'chambermaid',
];

/** 에디션별 밤 진행 순서를 반환합니다. */
export function getNightOrderForEdition(
  editionId: string,
  day: number,
): string[] {
  if (editionId === 'sects_and_violets') {
    return day <= 1 ? SV_FIRST_NIGHT_ORDER : SV_OTHER_NIGHT_ORDER;
  }
  if (editionId === 'bad_moon_rising') {
    return day <= 1 ? BMR_FIRST_NIGHT_ORDER : BMR_OTHER_NIGHT_ORDER;
  }
  return day <= 1 ? FIRST_NIGHT_ORDER : OTHER_NIGHT_ORDER;
}

export function getRoleById(roleId: string): Role | undefined {
  return ROLES_BY_ID.get(roleId) ?? TRAVELLER_ROLES_BY_ID.get(roleId);
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
  /** Godfather setup choice: add or remove one Outsider when possible. */
  godfatherOutsiderModifier?: -1 | 1;
}

/**
 * 플레이어 수에 맞게 역할을 자동 배분합니다.
 * 셋업 변경 역할이 포함되면 플레이어 수에 맞는 팀 수를 조정합니다.
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

  // BMR: 갓파더 → 외지인 +1 또는 -1.
  const hasGodfather = selectedMinions.some((r) => r.id === 'godfather');
  const godfatherModifier = options?.godfatherOutsiderModifier ?? 1;
  if (
    hasGodfather &&
    godfatherModifier === 1 &&
    outsiderCount < outsiders.length
  ) {
    outsiderCount++;
    townsfolkCount = count - outsiderCount - minionCount - demonCount;
  }
  if (hasGodfather && godfatherModifier === -1 && outsiderCount > 0) {
    outsiderCount--;
    townsfolkCount = count - outsiderCount - minionCount - demonCount;
  }

  // 악마 먼저 선택 (S&V 셋업 조정에 필요)
  const selectedDemons = shuffle(demons).slice(0, demonCount);

  // S&V: 팡 구 → 외지인 +1, 마을주민 -1
  const hasFangGu = selectedDemons.some((r) => r.id === 'fang_gu');
  if (hasFangGu && outsiderCount < outsiders.length) {
    outsiderCount++;
    townsfolkCount = Math.max(
      0,
      count - outsiderCount - minionCount - demonCount,
    );
  }

  // S&V: 비고르모르티스 → 외지인 -1, 마을주민 +1
  const hasVigormortis = selectedDemons.some((r) => r.id === 'vigormortis');
  if (hasVigormortis && outsiderCount > 0) {
    outsiderCount--;
    townsfolkCount = count - outsiderCount - minionCount - demonCount;
  }

  const selectedOutsiders = shuffle(outsiders).slice(0, outsiderCount);
  const selectedTownsfolk = shuffle(townsfolk).slice(0, townsfolkCount);

  // 주정뱅이가 포함된 경우, 게임에 없는 마을주민 중 하나를 가짜 역할로 선택
  const hasDrunk = selectedOutsiders.some((r) => r.id === 'drunk');
  let drunkFakeRoleId: string | undefined;
  if (hasDrunk) {
    const unselectedTownsfolk = townsfolk.filter(
      (t) => !selectedTownsfolk.some((st) => st.id === t.id),
    );
    // 미배정 마을주민이 없으면 전체 마을주민에서 선택 (중복 허용)
    const candidates =
      unselectedTownsfolk.length > 0 ? unselectedTownsfolk : townsfolk;
    if (candidates.length > 0) {
      drunkFakeRoleId =
        candidates[Math.floor(Math.random() * candidates.length)].id;
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
  // ── Trouble Brewing ──
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
    onlyWhenDead: true,
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
    instruction: '진행자가 마도서 정보를 알려줍니다',
    excludeSelf: false,
  },

  // ── Sects & Violets ──
  clockmaker: {
    type: 'passive',
    instruction: '진행자가 악마와 가장 가까운 하수인 사이의 거리를 알려줍니다',
    excludeSelf: false,
  },
  dreamer: {
    type: 'select_one',
    instruction: '확인할 플레이어를 선택하세요 (여행자 제외)',
    excludeSelf: true,
    excludeTraveller: true,
  },
  snake_charmer: {
    type: 'select_one',
    instruction: '플레이어를 선택하세요 (악마를 선택하면 역할이 교환됩니다)',
    excludeSelf: true,
  },
  mathematician: {
    type: 'passive',
    instruction: '진행자가 능력이 잘못 작동한 플레이어 수를 알려줍니다',
    excludeSelf: false,
  },
  flowergirl: {
    type: 'passive',
    instruction: '진행자가 악마가 오늘 투표했는지 알려줍니다',
    excludeSelf: false,
  },
  town_crier: {
    type: 'passive',
    instruction: '진행자가 하수인이 오늘 지명했는지 알려줍니다',
    excludeSelf: false,
  },
  oracle: {
    type: 'passive',
    instruction: '진행자가 죽은 플레이어 중 악한 수를 알려줍니다',
    excludeSelf: false,
  },
  seamstress: {
    type: 'select_two',
    instruction: '같은 진영인지 확인할 플레이어 2명을 선택하세요 (1회 사용)',
    excludeSelf: true,
  },
  philosopher: {
    type: 'passive',
    instruction: '진행자가 선택한 역할의 능력을 부여합니다 (1회 사용)',
    excludeSelf: false,
  },
  juggler: {
    type: 'passive',
    instruction: '진행자가 정확한 추측 수를 알려줍니다',
    excludeSelf: false,
  },
  sage: {
    type: 'passive',
    instruction: '진행자가 2명의 플레이어를 알려줍니다: 그중 하나가 악마입니다',
    excludeSelf: false,
    onlyWhenDead: true,
  },
  witch: {
    type: 'select_one',
    instruction: '저주할 플레이어를 선택하세요 (내일 지명하면 사망)',
    excludeSelf: true,
  },
  cerenovus: {
    type: 'select_one',
    instruction: '광기를 부여할 플레이어를 선택하세요',
    excludeSelf: true,
    includeDeadTargets: true,
  },
  pit_hag: {
    type: 'select_one',
    instruction: '역할을 변경할 플레이어를 선택하세요',
    excludeSelf: true,
    includeDeadTargets: true,
  },
  fang_gu: {
    type: 'select_one',
    instruction: '죽일 플레이어를 선택하세요 (외지인 사망 시 역할 교환)',
    excludeSelf: false,
  },
  vigormortis: {
    type: 'select_one',
    instruction: '죽일 플레이어를 선택하세요 (하수인 사망 시 능력 유지)',
    excludeSelf: false,
  },
  no_dashii: {
    type: 'select_one',
    instruction: '죽일 플레이어를 선택하세요',
    excludeSelf: false,
  },
  vortox: {
    type: 'select_one',
    instruction: '죽일 플레이어를 선택하세요',
    excludeSelf: false,
  },
  evil_twin: {
    type: 'passive',
    instruction: '선한 쌍둥이와 서로를 확인합니다',
    excludeSelf: false,
  },

  // ── Bad Moon Rising ──
  grandmother: {
    type: 'passive',
    instruction: '진행자가 손주 플레이어와 캐릭터를 알려줍니다',
    excludeSelf: false,
  },
  sailor: {
    type: 'select_one',
    instruction: '술을 마실 생존 플레이어 1명을 선택하세요',
    excludeSelf: false,
  },
  chambermaid: {
    type: 'select_two',
    instruction:
      '오늘 밤 자기 능력으로 깨어났는지 확인할 생존 플레이어 2명을 선택하세요',
    excludeSelf: true,
  },
  exorcist: {
    type: 'select_one',
    instruction: '오늘 밤 깨어나지 못하게 할 플레이어 1명을 선택하세요',
    excludeSelf: false,
    includeDeadTargets: true,
  },
  innkeeper: {
    type: 'select_two',
    instruction: '오늘 밤 사망할 수 없게 할 플레이어 2명을 선택하세요',
    excludeSelf: false,
    includeDeadTargets: true,
  },
  gambler: {
    type: 'passive',
    instruction: '이야기꾼 앱에서 플레이어와 캐릭터 추측을 기록하세요',
    excludeSelf: false,
  },
  gossip: {
    type: 'passive',
    instruction: '이야기꾼 앱에서 공개 발언 성공 시 사망 대상을 선택하세요',
    excludeSelf: false,
  },
  courtier: {
    type: 'passive',
    instruction: '이야기꾼 앱에서 취하게 할 캐릭터를 선택하세요',
    excludeSelf: false,
  },
  professor: {
    type: 'select_one',
    instruction: '부활시킬 사망 플레이어를 선택하세요',
    excludeSelf: true,
    includeDeadTargets: true,
    deadTargetsOnly: true,
  },
  lunatic: {
    type: 'passive',
    instruction: '가짜 악마 행동은 진행자가 수동으로 안내합니다',
    excludeSelf: false,
  },
  tinker: {
    type: 'passive',
    instruction: '돌연 사망 여부는 진행자가 수동으로 처리합니다',
    excludeSelf: false,
  },
  moonchild: {
    type: 'passive',
    instruction: '이야기꾼 앱에서 공개 선택 대상과 사망 처리를 기록하세요',
    excludeSelf: false,
  },
  godfather: {
    type: 'select_one',
    instruction: '외지인이 낮에 사망했다면 죽일 플레이어를 선택하세요',
    excludeSelf: false,
    includeDeadTargets: true,
  },
  devils_advocate: {
    type: 'select_one',
    instruction: '내일 처형되어도 사망하지 않을 생존 플레이어를 선택하세요',
    excludeSelf: false,
  },
  assassin: {
    type: 'select_one',
    instruction: '암살할 플레이어를 선택하세요 (1회 사용)',
    excludeSelf: false,
    includeDeadTargets: true,
  },
  zombuul: {
    type: 'select_one',
    instruction:
      '오늘 낮에 아무도 사망하지 않았다면 죽일 플레이어를 선택하세요',
    excludeSelf: false,
    includeDeadTargets: true,
  },
  pukka: {
    type: 'select_one',
    instruction: '중독시킬 플레이어를 선택하세요',
    excludeSelf: false,
    includeDeadTargets: true,
  },
  shabaloth: {
    type: 'select_two',
    instruction: '죽일 플레이어 2명을 선택하세요',
    excludeSelf: false,
    includeDeadTargets: true,
  },
  po: {
    type: 'select_one',
    instruction:
      '죽일 플레이어 1명 또는, 지난밤 아무도 선택하지 않았다면 3명을 선택하세요',
    excludeSelf: false,
    includeDeadTargets: true,
    allowedTargetCounts: [0, 1, 3],
  },

  // ── 여행자 (Traveller) ──
  bureaucrat: {
    type: 'select_one',
    instruction: '내일 투표가 3표로 계산될 플레이어를 선택하세요',
    excludeSelf: true,
    includeDeadTargets: true,
  },
  thief: {
    type: 'select_one',
    instruction: '내일 투표가 음수로 계산될 플레이어를 선택하세요',
    excludeSelf: true,
    includeDeadTargets: true,
  },
  apprentice: {
    type: 'passive',
    instruction: '진행자가 주민 또는 하수인 능력을 부여합니다',
    excludeSelf: false,
  },
  bone_collector: {
    type: 'select_one',
    instruction: '능력을 되찾을 죽은 플레이어를 선택하세요 (1회 사용)',
    excludeSelf: true,
    includeDeadTargets: true,
  },
  harlot: {
    type: 'select_one',
    instruction: '방문할 플레이어를 선택하세요 (동의 시 캐릭터를 알게 됩니다)',
    excludeSelf: true,
  },
  barista: {
    type: 'passive',
    instruction:
      '진행자가 플레이어 1명에게 맑은 정신 또는 능력 2회 작동을 부여합니다',
    excludeSelf: false,
  },
};

export const NIGHT_FEEDBACK: Record<string, NightFeedbackDef> = {
  // ── Trouble Brewing ──
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

  // ── Sects & Violets ──
  clockmaker: { type: 'number' },
  dreamer: { type: 'dreamer_info' },
  mathematician: { type: 'number' },
  flowergirl: { type: 'yes_no' },
  town_crier: { type: 'yes_no' },
  oracle: { type: 'number' },
  seamstress: { type: 'yes_no' },
  juggler: { type: 'number' },
  sage: { type: 'players' },
  savant: { type: 'savant_info' },

  // ── Bad Moon Rising ──
  grandmother: { type: 'player_and_role' },
  chambermaid: { type: 'number' },

  // ── 여행자 (Traveller) ──
  apprentice: { type: 'role' },
  harlot: { type: 'role' },
};
