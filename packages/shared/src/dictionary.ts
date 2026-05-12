import type { PlayerStatus, Team } from './types.js';

export interface StatusEntry {
  id: PlayerStatus;
  label: string;
  color: string;
  description: string;
}

export interface PhaseEntry {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface RuleSection {
  title: string;
  content: string;
}

export const TEAM_LABELS: Record<Team, string> = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
  traveller: '여행자',
};

export const TEAM_COLORS: Record<Team, string> = {
  townsfolk: '#5dade2',
  outsider: '#2ecc71',
  minion: '#e67e22',
  demon: '#e74c3c',
  traveller: '#b07cc6',
};

export const STATUS_ENTRIES: StatusEntry[] = [
  {
    id: 'poisoned',
    label: '중독',
    color: '#9b59b6',
    description:
      '그리모어에 올리는 Poisoned 표식입니다. 중독된 플레이어의 능력은 무효화되며, 정보 역할이 중독되면 거짓 정보를 받을 수 있습니다.',
  },
  {
    id: 'drunk',
    label: '취함',
    color: '#b07f5c',
    description:
      '그리모어에 올리는 Drunk 표식입니다. 취한 플레이어의 능력은 무효화되며, 자신이 취한 사실을 알 수 없습니다.',
  },
  {
    id: 'protected',
    label: '보호',
    color: '#2ecc71',
    description:
      '수도사가 선택한 플레이어에게 올리는 보호 표식입니다. 해당 밤 악마의 공격으로 사망하지 않습니다.',
  },
  {
    id: 'cursed',
    label: '붉은 청어',
    color: '#8e44ad',
    description:
      '점쟁이의 Red Herring 표식입니다. 이 플레이어는 점쟁이에게 악마로 감지됩니다.',
  },
  {
    id: 'master',
    label: '주인',
    color: '#3a7ca5',
    description:
      '집사가 선택한 주인입니다. 집사는 이 플레이어가 투표할 때만 함께 투표할 수 있습니다. 주인은 매 밤 집사가 새로 선택하며, 집사가 중독되거나 취한 상태이면 이 제약이 무효화됩니다.',
  },
  {
    id: 'witch_cursed',
    label: '마녀 저주',
    color: '#c0392b',
    description:
      '마녀에 의해 저주된 상태입니다. 이 플레이어가 내일 지명하면 즉시 사망합니다. 저주는 하루만 지속됩니다.',
  },
  {
    id: 'cerenovus_mad',
    label: '광기',
    color: '#d35400',
    description:
      '세레노버스가 선택한 플레이어에게 올리는 Mad 표식입니다. 지정된 선한 역할이라고 주장하지 않으면 이야기꾼에 의해 처형될 수 있습니다.',
  },
  {
    id: 'good_twin',
    label: '선한 쌍둥이',
    color: '#27ae60',
    description:
      '사악한 쌍둥이의 선한 쌍둥이입니다. 이 플레이어가 처형되면 악 팀이 승리합니다.',
  },
  {
    id: 'evil_twin',
    label: '악한 쌍둥이',
    color: '#c0392b',
    description:
      '사악한 쌍둥이입니다. 선/악 쌍둥이가 둘 다 살아있는 한 선한 팀은 승리할 수 없습니다.',
  },
  {
    id: 'no_ability',
    label: '능력 소진',
    color: '#7f8c8d',
    description: '1회성 능력을 이미 사용했음을 표시하는 No Ability 표식입니다.',
  },
  {
    id: 'bone_collector_ability',
    label: '능력 회복',
    color: '#a68a64',
    description:
      '뼈 수집가가 죽은 플레이어에게 오늘 능력을 되돌려줄 때 올리는 표식입니다.',
  },
  {
    id: 'barista_sober_healthy',
    label: '맑음/건강',
    color: '#4aa890',
    description:
      '바리스타가 선택한 플레이어에게 올리는 Sober & Healthy 표식입니다. 중독과 취함을 무시합니다.',
  },
  {
    id: 'barista_acts_twice',
    label: '2회 발동',
    color: '#5a8ec8',
    description:
      '바리스타가 선택한 플레이어에게 올리는 Acts Twice 표식입니다. 오늘 밤 능력을 두 번 처리할 수 있습니다.',
  },
  {
    id: 'no_dashii_poisoned',
    label: '중독 (노 다시)',
    color: '#9b59b6',
    description:
      '노 다시의 가장 가까운 마을주민 이웃에게 올리는 Poisoned 표식입니다. 생사와 관계없이 노 다시가 능력을 유지하는 동안 적용됩니다.',
  },
  {
    id: 'vigormortis_poisoned',
    label: '중독 (비고르모르티스)',
    color: '#9b59b6',
    description:
      '비고르모르티스가 죽인 하수인의 마을주민 이웃에게 올리는 Poisoned 표식입니다.',
  },
  {
    id: 'vigormortis_retained',
    label: '능력 유지',
    color: '#8e44ad',
    description:
      '비고르모르티스에게 죽은 하수인에게 올리는 Has Ability 표식입니다. 비고르모르티스가 살아 있고 능력이 있으면 죽은 뒤에도 능력을 유지합니다.',
  },
];

export const PHASE_ENTRIES: PhaseEntry[] = [
  {
    id: 'setup',
    name: '준비 단계',
    color: '#908e8a',
    description:
      '플레이어들이 게임에 입장하고 역할이 배정되기를 기다리는 단계입니다. 이야기꾼이 역할을 배정하면 각 플레이어에게 비밀리에 역할이 공개됩니다.',
  },
  {
    id: 'night',
    name: '밤',
    color: '#8090c0',
    description:
      '밤에는 특정 역할을 가진 플레이어들이 순서대로 깨어나 능력을 사용합니다. 악마는 플레이어를 죽이고, 독살범은 중독시키며, 수도사는 보호합니다. 정보 역할은 이야기꾼으로부터 정보를 받습니다.',
  },
  {
    id: 'day',
    name: '낮',
    color: '#a68a64',
    description:
      '낮에는 플레이어들이 토론하고 누가 악인인지 추리합니다. 밀담(비밀 대화), 공개 토론, 지목의 세 단계로 나뉩니다.',
  },
  {
    id: 'vote',
    name: '투표',
    color: '#c47070',
    description:
      '지목된 플레이어에 대해 투표가 진행됩니다. 살아있는 플레이어의 과반수(올림) 이상이 유죄에 투표하면 처형됩니다.',
  },
  {
    id: 'ended',
    name: '종료',
    color: '#b85c5c',
    description:
      '게임이 종료되었습니다. 모든 플레이어의 역할이 공개되고 승리 팀이 발표됩니다.',
  },
];

export const DAY_SUB_PHASE_ENTRIES: PhaseEntry[] = [
  {
    id: 'whisper',
    name: '밀담',
    color: '#6a8a6a',
    description:
      '플레이어들이 1:1로 비밀 대화를 나눌 수 있는 시간입니다. 밀담 내용은 이야기꾼만 볼 수 있으며, 다른 플레이어에게는 누가 누구와 대화했는지만 공개됩니다.',
  },
  {
    id: 'discussion',
    name: '공개 토론',
    color: '#a68a64',
    description:
      '모든 플레이어가 공개적으로 토론하는 시간입니다. 밤에 일어난 일, 자신의 역할, 받은 정보 등을 공유하며 악인을 추리합니다. 거짓말도 자유롭게 할 수 있습니다.',
  },
  {
    id: 'nomination',
    name: '지목',
    color: '#c47070',
    description:
      '플레이어들이 처형할 대상을 지목하는 시간입니다. 살아있는 플레이어만 지목할 수 있으며, 하루에 한 번만 지목할 수 있습니다. 지목된 플레이어에 대해 투표가 진행됩니다.',
  },
];

export const GAME_RULES: RuleSection[] = [
  {
    title: '게임 목표',
    content:
      '선한 팀(마을주민, 외지인)은 악마를 처형하여 승리합니다. 악한 팀(하수인, 악마)은 생존자가 2명 이하가 되면 승리합니다. 시장이 살아있고 생존자가 3명이며 처형이 없으면 선한 팀이 승리합니다. 성자가 처형으로 사망하면 악한 팀이 승리합니다.',
  },
  {
    title: '팀 구성',
    content:
      '플레이어 수에 따라 역할이 자동 배분됩니다. 5~6인: 마을주민 3명, 외지인 0~1명, 하수인 1명, 악마 1명. 10~12인: 마을주민 7명, 외지인 0~2명, 하수인 2명, 악마 1명. 13~15인: 마을주민 9명, 외지인 0~2명, 하수인 3명, 악마 1명. 남작이 포함되면 외지인이 2명 추가되고 마을주민이 2명 감소합니다.',
  },
  {
    title: '밤 진행',
    content:
      '밤에는 정해진 순서대로 역할이 활성화됩니다. 첫째 밤 순서: 독살범 → 세탁부 → 사서 → 수사관 → 요리사 → 초공감자 → 점쟁이 → 집사 → 첩자. 이후 밤 순서: 독살범 → 수도사 → 탕녀 → 임프 → 까마귀지기 → 장의사 → 초공감자 → 점쟁이 → 집사 → 첩자. 각 역할은 능력을 사용한 후 이야기꾼으로부터 피드백을 받습니다.',
  },
  {
    title: '투표와 처형',
    content:
      '지목이 이루어지면 모든 플레이어가 투표합니다. 살아있는 플레이어 수의 과반수(올림) 이상이 유죄에 투표하면 처형이 결정됩니다. 하루에 최대 한 명만 처형할 수 있으며, 가장 많은 표를 받은 플레이어가 처형됩니다. 처형하지 않는 것도 가능합니다.',
  },
  {
    title: '사망한 플레이어',
    content:
      '사망한 플레이어는 토론에는 참여할 수 있지만, 능력은 사용할 수 없습니다(일부 예외 제외). 사망한 플레이어는 게임 전체에서 딱 한 번만 투표할 수 있습니다. 한번 사용하면 더 이상 투표할 수 없습니다. 사망한 플레이어는 지목할 수 없습니다.',
  },
  {
    title: '특수 규칙',
    content:
      '주정뱅이는 자신이 주정뱅이라는 사실을 모릅니다. 주민 캐릭터라고 착각하지만 실제로는 주정뱅이입니다. 처단자는 게임당 한 번, 낮에 공개적으로 플레이어를 선택할 수 있습니다. 대상이 악마면 즉시 사망합니다. 성결자는 처음 지목당했을 때 능력이 소모되며, 지목자가 주민이면 지목자가 즉시 처형됩니다. 탕녀는 여행자를 제외한 플레이어가 5명 이상 생존해있는 사이 악마가 사망하면 새로운 악마가 됩니다.',
  },
  {
    title: '악 진영 정보',
    content:
      '첫째 밤에 악마는 자신의 하수인이 누구인지, 그리고 게임에 포함되지 않은 마을주민 역할 3개(블러프)를 알게 됩니다. 하수인은 자신의 악마가 누구인지 알게 됩니다. 이 정보를 활용하여 악한 팀은 전략을 세울 수 있습니다.',
  },
  {
    title: '여행자 (Traveller)',
    content:
      '여행자는 게임 중간에 참가하거나 퇴장할 수 있는 특수한 역할입니다. 여행자는 일반 역할 배분에 포함되지 않으며, 이야기꾼이 별도로 역할과 진영(선/악)을 배정합니다. 악한 여행자는 악마가 누구인지 알게 됩니다. 여행자는 처형이 아닌 추방(Exile)으로 제거됩니다. 추방은 전체 플레이어(죽은 플레이어 포함)의 과반수 투표가 필요하며, 처형 관련 능력(성자, 성결자 등)이 발동하지 않습니다. 추방은 하루 처형 횟수에 포함되지 않으며, 여행자는 승리 조건의 생존자 수에 포함되지 않습니다.',
  },
];

export const GAME_FLOW: { step: string; description: string }[] = [
  {
    step: '1. 준비',
    description:
      '플레이어들이 게임에 입장합니다. 이야기꾼이 역할을 배분하면 각 플레이어에게 비밀리에 역할이 공개됩니다.',
  },
  {
    step: '2. 첫째 밤',
    description:
      '독살범이 중독 대상을 선택합니다. 정보 역할(세탁부, 사서, 수사관, 요리사, 초공감자, 점쟁이)이 첫 정보를 받습니다. 악마와 하수인이 서로를 확인합니다. 집사가 주인을 선택합니다.',
  },
  {
    step: '3. 낮',
    description:
      '밀담 시간에 비밀 대화를 나눕니다. 공개 토론에서 정보를 공유하고 추리합니다. 지목 시간에 의심스러운 플레이어를 처형 대상으로 지목합니다.',
  },
  {
    step: '4. 투표',
    description:
      '지목된 플레이어에 대해 유죄/무죄 투표를 합니다. 과반수 이상 유죄면 처형됩니다. 성결자가 처음 지목당하면 지목자에 따라 특수 효과가 발동할 수 있습니다.',
  },
  {
    step: '5. 이후 밤',
    description:
      '독살범이 새 대상을 중독시킵니다. 수도사가 보호 대상을 선택합니다. 임프가 죽일 대상을 선택합니다. 장의사가 처형된 캐릭터를 확인합니다. 정보 역할이 새 정보를 받습니다.',
  },
  {
    step: '6. 반복',
    description:
      '낮과 밤을 반복하며 게임을 진행합니다. 선한 팀은 토론과 추리로 악마를 찾아 처형해야 합니다. 악한 팀은 정체를 숨기며 매 밤 플레이어를 제거합니다.',
  },
  {
    step: '7. 게임 종료',
    description:
      '악마가 처형되면 선한 팀이 승리합니다. 생존자가 2명 이하가 되면 악한 팀이 승리합니다. 성자가 처형되면 악한 팀이 즉시 승리합니다. 시장 특수 승리 조건도 적용됩니다.',
  },
];
