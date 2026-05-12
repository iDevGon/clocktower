import { CHARACTER_TIPS } from './characterTips.js';
import { getRoleById } from './roles.js';
import type { Team } from './types.js';

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
  /** 0~1 사이의 노출 빈도 (1 = 항상 후보, 0 = 절대 안 나옴) */
  frequency: number;
  /** 특정 역할에만 노출되는 팁인 경우 해당 역할 ID */
  roleId?: string;
  /** 역할 팁 가중치 배수 (해당 역할을 플레이 중일 때 선택 확률 배수, 기본 3) */
  roleWeight?: number;
}

export const GAMEPLAY_TIPS: GameTip[] = [
  // ── General ──
  {
    category: 'general',
    text: '선한 플레이어도 전략적으로 거짓말할 수 있습니다.',
    frequency: 0.8,
  },
  {
    category: 'general',
    text: '다른 플레이어의 주장을 메모해 두면 모순을 찾기 쉽습니다.',
    frequency: 0.7,
  },
  {
    category: 'general',
    text: '받은 정보가 맞다고 확신하지 마세요. 주정뱅이일 수 있습니다.',
    frequency: 0.6,
  },
  {
    category: 'general',
    text: '아무도 주장하지 않는 역할은 악마의 블러프일 수 있습니다.',
    frequency: 0.7,
  },
  {
    category: 'general',
    text: '정보를 너무 빨리 공개하면 악 진영에게 유리합니다.',
    frequency: 0.8,
  },
  {
    category: 'general',
    text: '처형하지 않는 것도 전략입니다.',
    frequency: 0.6,
  },
  {
    category: 'general',
    text: '악 진영은 서로를 알고 있으므로, 선한 진영은 소통이 핵심입니다.',
    frequency: 0.7,
  },
  {
    category: 'general',
    text: '역할을 바로 공개하기보다 상대의 정보를 먼저 들어보세요.',
    frequency: 0.7,
  },
  {
    category: 'general',
    text: '같은 역할을 주장하는 플레이어가 둘이면 한 명은 거짓입니다.',
    frequency: 0.9,
  },

  // ── Role-specific (general) ──
  {
    category: 'general',
    text: '당신의 정보가 틀렸다면, 중독되었거나 주정뱅이일 수 있습니다.',
    frequency: 0.8,
    roleId: 'drunk',
  },
  {
    category: 'general',
    text: '임프는 블러프 역할을 활용해 마을 주민인 척 위장할 수 있습니다.',
    frequency: 0.9,
    roleId: 'imp',
  },
  {
    category: 'general',
    text: '독살범은 악마를 보호하되, 너무 눈에 띄지 않게 행동해야 합니다.',
    frequency: 0.8,
    roleId: 'poisoner',
  },
  {
    category: 'general',
    text: '첩자는 정보를 교묘하게 섞어 마을을 혼란에 빠뜨릴 수 있습니다.',
    frequency: 0.8,
    roleId: 'spy',
  },
  {
    category: 'general',
    text: '악마가 죽으면 당신이 승계할 수 있습니다. 살아남으세요.',
    frequency: 0.9,
    roleId: 'scarlet_woman',
  },
  {
    category: 'general',
    text: '성자가 처형당하면 마을이 지므로, 의심받지 않도록 조심하세요.',
    frequency: 1.0,
    roleId: 'saint',
  },
  {
    category: 'general',
    text: '은둔자는 특별한 능력이 없지만, 혼란을 만들 수 있습니다.',
    frequency: 0.7,
    roleId: 'recluse',
  },

  // ── Night ──
  {
    category: 'night',
    text: '밤에 받은 정보는 낮의 중요한 단서가 됩니다.',
    frequency: 0.8,
  },
  {
    category: 'night',
    text: '누가 죽었는지가 악마를 추적하는 핵심 단서입니다.',
    frequency: 0.7,
  },

  // Night role-specific
  {
    category: 'night',
    text: '수도사는 매 밤 다른 플레이어를 보호하여 핵심 인물을 지킬 수 있습니다.',
    frequency: 0.9,
    roleId: 'monk',
  },
  {
    category: 'night',
    text: '임프는 자기 자신을 죽여 하수인에게 악마를 승계할 수 있습니다.',
    frequency: 1.0,
    roleId: 'imp',
  },
  {
    category: 'night',
    text: '점쟁이는 붉은 청어 대상에 주의하세요. 결과가 항상 정확하진 않습니다.',
    frequency: 1.0,
    roleId: 'fortune_teller',
  },
  {
    category: 'night',
    text: '집사는 주인이 투표하지 않으면 투표할 수 없습니다.',
    frequency: 1.0,
    roleId: 'butler',
  },
  {
    category: 'night',
    text: '독살범이 중독시킨 플레이어에게는 잘못된 정보가 전달됩니다.',
    frequency: 0.9,
    roleId: 'poisoner',
  },
  {
    category: 'night',
    text: '초공감자는 양옆 이웃 중 악 진영의 수를 확인할 수 있습니다.',
    frequency: 0.9,
    roleId: 'empath',
  },
  {
    category: 'night',
    text: '까마귀지기는 죽는 밤에 한 명을 선택해 역할을 확인할 수 있습니다.',
    frequency: 0.9,
    roleId: 'ravenkeeper',
  },
  {
    category: 'night',
    text: '장의사는 어젯밤 처형된 플레이어의 역할을 확인할 수 있습니다.',
    frequency: 0.9,
    roleId: 'undertaker',
  },

  // ── Day ──
  {
    category: 'day',
    text: '밀담으로 신뢰할 수 있는 플레이어를 파악하세요.',
    frequency: 0.8,
  },
  {
    category: 'day',
    text: '공개 토론에서 다른 플레이어의 반응을 관찰하세요.',
    frequency: 0.7,
  },
  {
    category: 'day',
    text: '밀담은 이야기꾼에게 보입니다. 비밀은 완전하지 않아요.',
    frequency: 0.6,
  },
  {
    category: 'day',
    text: '성급한 처형은 마을에 해가 됩니다. 정보를 먼저 모으세요.',
    frequency: 0.8,
  },

  // Day role-specific
  {
    category: 'day',
    text: '처단자는 낮에 공개 선언으로 악마를 지목하여 제거할 수 있습니다.',
    frequency: 1.0,
    roleId: 'slayer',
  },
  {
    category: 'day',
    text: '성결자는 첫 지목 때 능력이 소모되며, 주민이 지목한 경우에만 지목자가 처형됩니다.',
    frequency: 1.0,
    roleId: 'virgin',
  },
  {
    category: 'day',
    text: '시장이 살아있을 때, 최종 3인에서 처형이 없으면 선 진영이 승리합니다.',
    frequency: 0.9,
    roleId: 'mayor',
  },

  // ── Vote ──
  {
    category: 'vote',
    text: '살아있는 플레이어 과반수 이상이 투표해야 처형됩니다.',
    frequency: 0.9,
  },
  {
    category: 'vote',
    text: '사망한 플레이어는 게임 전체에서 딱 한 번만 투표 가능합니다.',
    frequency: 0.8,
  },
  {
    category: 'vote',
    text: '확신이 없다면 기권도 고려하세요.',
    frequency: 0.6,
  },
  {
    category: 'vote',
    text: '투표 패턴을 주시하면 악 진영을 파악할 수 있습니다.',
    frequency: 0.7,
  },

  // ── Death ──
  {
    category: 'death',
    text: '사망해도 토론에 참여하고, 마지막 한 표를 아껴두세요.',
    frequency: 0.9,
  },
  {
    category: 'death',
    text: '남은 1표는 게임의 승패를 가를 수 있습니다.',
    frequency: 0.8,
  },
  {
    category: 'death',
    text: '알고 있는 정보를 적극적으로 공유하세요.',
    frequency: 0.7,
  },

  // ── First Night ──
  {
    category: 'firstNight',
    text: '첫째 밤 정보는 가장 순수한 단서입니다. 잘 기억하세요.',
    frequency: 0.9,
  },
  {
    category: 'firstNight',
    text: '첫째 밤에는 아무도 사망하지 않습니다.',
    frequency: 0.7,
  },
  {
    category: 'firstNight',
    text: '역할 능력을 꼼꼼히 읽어두세요.',
    frequency: 0.8,
  },

  // First night role-specific
  {
    category: 'firstNight',
    text: '임프는 첫째 밤에 하수인과 블러프 역할 3개를 확인하여 전략을 세울 수 있습니다.',
    frequency: 1.0,
    roleId: 'imp',
  },
  {
    category: 'firstNight',
    text: '하수인은 첫째 밤에 악마가 누구인지 확인하고, 보호하는 방향으로 움직이세요.',
    frequency: 1.0,
    roleId: 'poisoner',
  },
  {
    category: 'firstNight',
    text: '하수인은 첫째 밤에 악마가 누구인지 확인하고, 보호하는 방향으로 움직이세요.',
    frequency: 1.0,
    roleId: 'scarlet_woman',
  },
  {
    category: 'firstNight',
    text: '하수인은 첫째 밤에 악마가 누구인지 확인하고, 보호하는 방향으로 움직이세요.',
    frequency: 1.0,
    roleId: 'spy',
  },
  {
    category: 'firstNight',
    text: '하수인은 첫째 밤에 악마가 누구인지 확인하고, 보호하는 방향으로 움직이세요.',
    frequency: 1.0,
    roleId: 'baron',
  },

  // ── Storyteller ──
  {
    category: 'storyteller',
    text: '밤 행동 순서가 결과에 영향을 줍니다. 순서를 지켜주세요.',
    frequency: 0.9,
  },
  {
    category: 'storyteller',
    text: '중독/취함 상태의 플레이어에게는 조작된 정보를 보내세요.',
    frequency: 0.9,
  },
  {
    category: 'storyteller',
    text: '게임 로그를 활용하면 이전 밤 결과를 쉽게 추적할 수 있습니다.',
    frequency: 0.7,
  },
  {
    category: 'storyteller',
    text: '주정뱅이에게 때로는 진실을 줘서 신뢰를 쌓게 하세요.',
    frequency: 0.8,
  },
  {
    category: 'storyteller',
    text: '게임이 마지막 날까지 팽팽하게 이어지도록 정보를 조절하세요.',
    frequency: 1.0,
  },
  {
    category: 'storyteller',
    text: '불리한 팀에게 약간 유리한 정보 방향을 제시할 수 있습니다.',
    frequency: 0.8,
  },
  {
    category: 'storyteller',
    text: '탕녀가 살아있고 5인 이상일 때 악마 사망 시 승계가 발생합니다.',
    frequency: 0.7,
  },
  {
    category: 'storyteller',
    text: '밀담 시간을 적절히 조절하세요. 너무 길면 게임이 느려집니다.',
    frequency: 0.6,
  },
  {
    category: 'storyteller',
    text: '플레이어 숙련도에 맞춰 정보의 수위를 조절하세요.',
    frequency: 0.7,
  },
  {
    category: 'storyteller',
    text: '규칙 안에서 최고의 드라마를 만드는 것이 이야기꾼의 역할입니다.',
    frequency: 0.8,
  },
];

/**
 * 로고 화면용: 조건 없이 모든 팁 텍스트를 반환 (중복 제거, 셔플)
 * CHARACTER_TIPS에는 자동으로 "X를 플레이할 때," / "X를 상대할 때," 맥락을 추가.
 * - mode 'player': storyteller 카테고리 제외, 전체 포함
 * - mode 'storyteller': storyteller 카테고리만
 */
export function getAllTipTexts(mode: 'player' | 'storyteller'): string[] {
  const texts = new Set<string>();

  if (mode === 'storyteller') {
    GAMEPLAY_TIPS.filter((t) => t.category === 'storyteller' && t.text).forEach(
      (t) => {
        texts.add(t.text);
      },
    );
  } else {
    // 플레이어: storyteller 제외 모든 GAMEPLAY_TIPS
    GAMEPLAY_TIPS.filter((t) => t.category !== 'storyteller' && t.text).forEach(
      (t) => {
        texts.add(t.text);
      },
    );
    // CHARACTER_TIPS: 역할 맥락 자동 추가
    Object.entries(CHARACTER_TIPS).forEach(([roleId, charTip]) => {
      const role = getRoleById(roleId);
      const roleName = role?.name ?? roleId;
      charTip.playTips
        .filter((tip) => tip)
        .forEach((tip) => {
          texts.add(`[${roleName} 플레이할 때] ${tip}`);
        });
      charTip.counterTips
        .filter((tip) => tip)
        .forEach((tip) => {
          texts.add(`[${roleName} 상대할 때] ${tip}`);
        });
    });
  }

  // Fisher-Yates 셔플
  const arr = Array.from(texts);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick a random tip from matching categories using weighted frequency */
export function getRandomTip(
  categories: TipCategory | TipCategory[],
  playerRoleId?: string,
): GameTip {
  const cats = Array.isArray(categories) ? categories : [categories];
  const matching = GAMEPLAY_TIPS.filter((t) => {
    if (!cats.includes(t.category)) return false;
    // 역할 전용 팁은 해당 역할 플레이어에게만 노출
    if (t.roleId && playerRoleId && t.roleId !== playerRoleId) return false;
    // roleId 팁인데 playerRoleId가 없으면 스킵 (역할 정보 없는 상황)
    if (t.roleId && !playerRoleId) return false;
    return true;
  });

  if (matching.length === 0) {
    // 폴백: 역할 필터 없이 일반 팁만
    const general = GAMEPLAY_TIPS.filter(
      (t) => cats.includes(t.category) && !t.roleId,
    );
    if (general.length === 0)
      return { category: cats[0], text: '', frequency: 1 };
    return general[Math.floor(Math.random() * general.length)];
  }

  // 가중치 기반 선택: frequency * (역할 팁이면 roleWeight 배수)
  const DEFAULT_ROLE_WEIGHT = 3;
  const weights = matching.map((t) => {
    const base = t.frequency;
    if (t.roleId && t.roleId === playerRoleId) {
      return base * (t.roleWeight ?? DEFAULT_ROLE_WEIGHT);
    }
    return base;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let rand = Math.random() * totalWeight;

  for (let i = 0; i < matching.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return matching[i];
  }

  return matching[matching.length - 1];
}

/** Pick a random tip text from matching categories */
export function getRandomTipText(
  categories: TipCategory | TipCategory[],
  playerRoleId?: string,
): string {
  return getRandomTip(categories, playerRoleId).text;
}

function isGoodTeam(team: Team): boolean {
  return team === 'townsfolk' || team === 'outsider';
}

/**
 * 통합 팁 함수: GAMEPLAY_TIPS + CHARACTER_TIPS(playTips/counterTips)를 합산하여 가중치 기반으로 랜덤 선택.
 *
 * - 일반 팁 (roleId 없음): 모든 유저에게 노출
 * - roleId 팁 (GAMEPLAY_TIPS): 해당 역할 플레이어에게만 노출 (= playTip)
 * - playTips (CHARACTER_TIPS): 해당 역할 플레이어에게만 노출
 * - counterTips (CHARACTER_TIPS): 반대 진영에게만 노출 (게임 참가 여부 무관)
 * - storyteller 카테고리: 제외 (이야기꾼 앱에서만 기존 getRandomTipText 사용)
 */
export function getRandomGameTip(
  categories: TipCategory | TipCategory[],
  playerRoleId?: string,
  playerTeam?: Team,
): string {
  const cats = Array.isArray(categories) ? categories : [categories];
  const candidates: { text: string; weight: number }[] = [];

  // 1. GAMEPLAY_TIPS (storyteller 카테고리 제외)
  GAMEPLAY_TIPS.filter(
    (t) => cats.includes(t.category) && t.category !== 'storyteller',
  ).forEach((t) => {
    if (t.roleId) {
      // roleId 팁: 해당 역할 플레이어에게만 노출
      if (!playerRoleId || t.roleId !== playerRoleId) return;
      candidates.push({
        text: t.text,
        weight: t.frequency * (t.roleWeight ?? 3),
      });
      return;
    }
    candidates.push({ text: t.text, weight: t.frequency });
  });

  // 2. CHARACTER_TIPS - playTips (자기 역할만)
  if (playerRoleId) {
    const charTips = (
      CHARACTER_TIPS as Record<
        string,
        { playTips: string[]; counterTips: string[] }
      >
    )[playerRoleId];
    if (charTips) {
      charTips.playTips.forEach((tip) => {
        candidates.push({ text: tip, weight: 2 });
      });
    }
  }

  // 3. CHARACTER_TIPS - counterTips (반대 진영만, 게임 참가 여부 무관)
  if (playerTeam) {
    const playerIsGood = isGoodTeam(playerTeam);
    Object.entries(CHARACTER_TIPS)
      .filter(([roleId]) => {
        if (roleId === playerRoleId) return false;
        const role = getRoleById(roleId);
        if (!role) return false;
        const roleIsGood = isGoodTeam(role.team);
        return playerIsGood !== roleIsGood;
      })
      .forEach(([, charTip]) => {
        charTip.counterTips.forEach((tip) => {
          candidates.push({ text: tip, weight: 1.5 });
        });
      });
  }

  if (candidates.length === 0) return '';

  // 가중치 기반 랜덤 선택
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const c of candidates) {
    rand -= c.weight;
    if (rand <= 0) return c.text;
  }
  return candidates[candidates.length - 1].text;
}
