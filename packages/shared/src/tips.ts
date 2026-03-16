export type TipCategory =
  | 'general'
  | 'night'
  | 'day'
  | 'vote'
  | 'death'
  | 'storyteller'
  | 'firstNight';

export interface GameTip {
  category: TipCategory;
  text: string;
}

export const GAMEPLAY_TIPS: GameTip[] = [
  // ── General ──
  {
    category: 'general',
    text: '거짓말은 모든 진영에게 허용된 무기입니다. 선한 플레이어도 전략적으로 거짓말할 수 있어요.',
  },
  {
    category: 'general',
    text: '다른 플레이어의 주장을 메모해 두면 모순을 쉽게 찾을 수 있습니다.',
  },
  {
    category: 'general',
    text: '주정뱅이는 자신이 주정뱅이인 것을 모릅니다. 당신이 받은 정보가 맞다고 확신하지 마세요.',
  },
  {
    category: 'general',
    text: '악마는 게임에 없는 역할 3개를 블러프로 알고 있습니다. 아무도 주장하지 않는 역할이 블러프일 수 있어요.',
  },
  {
    category: 'general',
    text: '정보를 너무 빨리 공개하면 악 진영에게 유리할 수 있습니다. 타이밍을 고려하세요.',
  },
  {
    category: 'general',
    text: '처형하지 않는 것도 전략입니다. 정보가 부족하면 투표를 보류하세요.',
  },
  {
    category: 'general',
    text: '악 진영은 서로를 알고 있습니다. 선한 진영은 소통으로 이를 극복해야 합니다.',
  },
  {
    category: 'general',
    text: '독살범이 중독시킨 플레이어는 잘못된 정보를 받을 수 있습니다.',
  },
  {
    category: 'general',
    text: '역할을 바로 공개하기보다, 상대의 정보를 먼저 들어보세요.',
  },
  {
    category: 'general',
    text: '같은 역할을 주장하는 플레이어가 둘이면, 한 명은 거짓말을 하고 있습니다.',
  },

  // ── Night ──
  {
    category: 'night',
    text: '밤에 받은 정보를 잘 기억해 두세요. 낮에 중요한 단서가 됩니다.',
  },
  {
    category: 'night',
    text: '수도사는 매 밤 다른 플레이어를 보호할 수 있습니다. 핵심 플레이어를 지키세요.',
  },
  {
    category: 'night',
    text: '악마는 매 밤 한 명을 죽일 수 있습니다. 누가 죽었는지가 중요한 단서입니다.',
  },
  {
    category: 'night',
    text: '임프는 자기 자신을 죽여서 하수인에게 악마를 승계할 수 있습니다.',
  },
  {
    category: 'night',
    text: '점쟁이는 매 밤 두 명을 선택하여 악마가 있는지 확인합니다. 하지만 Red Herring에 주의하세요.',
  },
  {
    category: 'night',
    text: '집사는 매 밤 주인을 선택합니다. 주인이 투표하지 않으면 집사도 투표할 수 없어요.',
  },

  // ── Day ──
  {
    category: 'day',
    text: '밀담 시간을 활용해 신뢰할 수 있는 플레이어를 파악하세요.',
  },
  {
    category: 'day',
    text: '공개 토론에서 다른 플레이어의 반응을 관찰하세요. 눈치 보는 사람이 있을 수 있습니다.',
  },
  {
    category: 'day',
    text: '처단자가 있다면, 낮에 공개 선언으로 악마를 제거할 수 있습니다.',
  },
  {
    category: 'day',
    text: '성결자를 지명할 때 주의하세요. 마을주민이 지명하면 지명자가 처형될 수 있습니다.',
  },
  {
    category: 'day',
    text: '밀담은 이야기꾼에게 보입니다. 비밀은 완전하지 않아요.',
  },
  {
    category: 'day',
    text: '지목하기 전에 충분한 정보를 모으세요. 성급한 처형은 마을에 해가 됩니다.',
  },

  // ── Vote ──
  {
    category: 'vote',
    text: '살아있는 플레이어의 과반수 이상이 투표해야 처형이 결정됩니다.',
  },
  {
    category: 'vote',
    text: '사망한 플레이어는 게임 전체에서 딱 한 번만 투표할 수 있습니다.',
  },
  {
    category: 'vote',
    text: '여러 명이 지명되면, 가장 많은 표를 받은 플레이어가 처형됩니다.',
  },
  {
    category: 'vote',
    text: '투표하지 않는 것도 전략입니다. 확신이 없다면 기권도 고려하세요.',
  },
  {
    category: 'vote',
    text: '악 진영은 서로의 투표를 조율할 수 있습니다. 투표 패턴을 주시하세요.',
  },

  // ── Death ──
  {
    category: 'death',
    text: '사망해도 게임은 끝나지 않습니다. 토론에 참여하고 마지막 한 표를 아껴두세요.',
  },
  {
    category: 'death',
    text: '사망 후 남은 1표는 게임의 승패를 가를 수 있습니다. 신중하게 사용하세요.',
  },
  {
    category: 'death',
    text: '사망한 플레이어도 토론에 참여할 수 있습니다. 알고 있는 정보를 공유하세요.',
  },
  {
    category: 'death',
    text: '사망 후에는 지목할 수 없지만, 다른 플레이어에게 지목을 부탁할 수 있습니다.',
  },

  // ── First Night ──
  {
    category: 'firstNight',
    text: '첫째 밤에는 악마와 하수인이 서로를 확인합니다.',
  },
  {
    category: 'firstNight',
    text: '첫째 밤 정보는 가장 순수한 단서입니다. 잘 기억해 두세요.',
  },
  {
    category: 'firstNight',
    text: '첫째 밤에는 아무도 사망하지 않습니다. 내일부터 진짜 게임이 시작됩니다.',
  },
  {
    category: 'firstNight',
    text: '당신의 역할 능력을 꼼꼼히 읽어두세요. 게임 중에 능력을 잊으면 불리합니다.',
  },

  // ── Storyteller ──
  {
    category: 'storyteller',
    text: '밤 행동을 처리할 때 순서를 지켜주세요. 순서가 결과에 영향을 줍니다.',
  },
  {
    category: 'storyteller',
    text: '독살범의 중독 효과를 반영하여 피드백을 보내세요.',
  },
  {
    category: 'storyteller',
    text: '게임 로그를 활용하면 이전 밤의 결과를 쉽게 추적할 수 있습니다.',
  },
  {
    category: 'storyteller',
    text: '플레이어들이 역할을 확인하는 동안 첫째 밤 순서를 미리 확인해 두세요.',
  },
  {
    category: 'storyteller',
    text: '주정뱅이에게는 가짜 피드백을 보내야 합니다. 진짜처럼 보이게 해주세요.',
  },
  {
    category: 'storyteller',
    text: '투표 시 정족수를 확인하세요. 살아있는 플레이어의 과반수(올림)입니다.',
  },
  {
    category: 'storyteller',
    text: '밀담 시간을 적절히 조절하세요. 너무 길면 게임이 느려집니다.',
  },
  {
    category: 'storyteller',
    text: '탕녀가 살아있고 5인 이상일 때 악마가 죽으면 승계가 발생합니다.',
  },
];

/** Pick a random tip from matching categories */
export function getRandomTip(categories: TipCategory | TipCategory[]): GameTip {
  const cats = Array.isArray(categories) ? categories : [categories];
  const matching = GAMEPLAY_TIPS.filter((t) => cats.includes(t.category));
  return matching[Math.floor(Math.random() * matching.length)];
}

/** Pick a random tip text from matching categories */
export function getRandomTipText(
  categories: TipCategory | TipCategory[],
): string {
  return getRandomTip(categories).text;
}
