import { describe, expect, it, vi } from 'vitest';
import {
  CHARACTER_TIPS,
  getCharacterTips,
  getRandomPlayTip,
} from '../characterTips.js';
import {
  GAMEPLAY_TIPS,
  getAllTipTexts,
  getRandomGameTip,
  getRandomTip,
  getRandomTipText,
  type TipCategory,
} from '../tips.js';

const ALL_CATEGORIES: TipCategory[] = [
  'general',
  'night',
  'day',
  'vote',
  'death',
  'firstNight',
  'storyteller',
];

const PLAYER_CATEGORIES: TipCategory[] = ALL_CATEGORIES.filter(
  (c) => c !== 'storyteller',
);

function collectWeightedGameTipResults(
  categories: TipCategory | TipCategory[],
  playerRoleId?: string,
  playerTeam?: Parameters<typeof getRandomGameTip>[2],
): Set<string> {
  const allResults = new Set<string>();
  const randomSpy = vi.spyOn(Math, 'random');

  try {
    for (let i = 0; i < 1000; i++) {
      randomSpy.mockReturnValue(i / 1000);
      allResults.add(getRandomGameTip(categories, playerRoleId, playerTeam));
    }
  } finally {
    randomSpy.mockRestore();
  }

  return allResults;
}

describe('GAMEPLAY_TIPS 데이터', () => {
  it('모든 팁은 비어있지 않은 text를 가진다', () => {
    for (const tip of GAMEPLAY_TIPS) {
      expect(tip.text).toBeTruthy();
    }
  });

  it('frequency는 0~1 범위이다', () => {
    for (const tip of GAMEPLAY_TIPS) {
      expect(tip.frequency).toBeGreaterThan(0);
      expect(tip.frequency).toBeLessThanOrEqual(1);
    }
  });

  it('모든 카테고리에 최소 1개의 팁이 존재한다', () => {
    for (const cat of ALL_CATEGORIES) {
      const tips = GAMEPLAY_TIPS.filter((t) => t.category === cat);
      expect(tips.length).toBeGreaterThan(0);
    }
  });
});

describe('getRandomTip', () => {
  it('각 카테고리별로 유효한 GameTip을 반환한다', () => {
    for (const cat of ALL_CATEGORIES) {
      const tip = getRandomTip(cat);
      expect(tip).toBeDefined();
      expect(tip.category).toBe(cat);
      expect(tip.text).toBeTruthy();
    }
  });

  it('카테고리 배열을 받으면 해당 카테고리 중 하나의 팁을 반환한다', () => {
    const tip = getRandomTip(['night', 'day']);
    expect(['night', 'day']).toContain(tip.category);
    expect(tip.text).toBeTruthy();
  });

  it('roleId를 전달하면 해당 역할 또는 일반 팁을 반환한다', () => {
    const tip = getRandomTip('general', 'imp');
    expect(tip.category).toBe('general');
    // roleId 팁이면 imp, 일반 팁이면 roleId 없음
    if (tip.roleId) {
      expect(tip.roleId).toBe('imp');
    }
  });

  it('존재하지 않는 roleId를 전달해도 일반 팁을 반환한다', () => {
    const tip = getRandomTip('general', 'nonexistent_role');
    expect(tip.category).toBe('general');
    expect(tip.text).toBeTruthy();
    expect(tip.roleId).toBeUndefined();
  });

  it('roleId 없이 호출하면 역할 전용 팁이 나오지 않는다', () => {
    // 여러 번 시도
    for (let i = 0; i < 50; i++) {
      const tip = getRandomTip('general');
      expect(tip.roleId).toBeUndefined();
    }
  });
});

describe('getRandomTipText', () => {
  it('각 카테고리별로 비어있지 않은 문자열을 반환한다', () => {
    for (const cat of ALL_CATEGORIES) {
      const text = getRandomTipText(cat);
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('카테고리 배열로 호출해도 문자열을 반환한다', () => {
    const text = getRandomTipText(['night', 'day', 'vote']);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('roleId를 전달해도 문자열을 반환한다', () => {
    const text = getRandomTipText('night', 'empath');
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });
});

describe('getRandomGameTip', () => {
  it('각 플레이어 카테고리별로 비어있지 않은 문자열을 반환한다', () => {
    for (const cat of PLAYER_CATEGORIES) {
      const text = getRandomGameTip(cat);
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('storyteller 카테고리는 빈 문자열을 반환한다 (storyteller 전용 제외)', () => {
    // storyteller 카테고리의 팁은 모두 제외되므로 빈 문자열
    const text = getRandomGameTip('storyteller');
    expect(text).toBe('');
  });

  it('roleId를 전달하면 해당 역할의 CHARACTER_TIPS playTips도 후보에 포함된다', () => {
    const impPlayTips = CHARACTER_TIPS.imp.playTips;
    const allResults = collectWeightedGameTipResults('general', 'imp');
    const hasPlayTip = impPlayTips.some((tip) => allResults.has(tip));
    expect(hasPlayTip).toBe(true);
  });

  it('선 진영 플레이어에게는 악 역할의 counterTips가 후보에 포함된다', () => {
    const impCounterTips = CHARACTER_TIPS.imp.counterTips;
    const allResults = collectWeightedGameTipResults(
      'general',
      'empath',
      'townsfolk',
    );
    const hasCounterTip = impCounterTips.some((tip) => allResults.has(tip));
    expect(hasCounterTip).toBe(true);
  });

  it('악 진영 플레이어에게는 선 역할의 counterTips가 후보에 포함된다', () => {
    const empathCounterTips = CHARACTER_TIPS.empath.counterTips;
    const allResults = collectWeightedGameTipResults('general', 'imp', 'demon');
    const hasCounterTip = empathCounterTips.some((tip) => allResults.has(tip));
    expect(hasCounterTip).toBe(true);
  });

  it('자기 역할의 counterTips는 후보에서 제외된다', () => {
    const impCounterTips = CHARACTER_TIPS.imp.counterTips;
    const allResults = collectWeightedGameTipResults('general', 'imp', 'demon');
    const hasSelfCounterTip = impCounterTips.some((tip) => allResults.has(tip));
    expect(hasSelfCounterTip).toBe(false);
  });

  it('roleId/team 없이 호출해도 일반 팁을 반환한다', () => {
    const text = getRandomGameTip('general');
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('존재하지 않는 roleId를 전달해도 정상 동작한다', () => {
    const text = getRandomGameTip('general', 'nonexistent_role');
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  it('카테고리 배열을 받으면 해당 카테고리들의 팁 중 하나를 반환한다', () => {
    const text = getRandomGameTip(['night', 'day']);
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });
});

describe('getAllTipTexts', () => {
  it('player 모드에서 storyteller 팁을 제외한 팁 목록을 반환한다', () => {
    const tips = getAllTipTexts('player');
    expect(tips.length).toBeGreaterThan(0);
    // storyteller 전용 팁 텍스트가 포함되지 않아야 함
    const storytellerTexts = GAMEPLAY_TIPS.filter(
      (t) => t.category === 'storyteller',
    ).map((t) => t.text);
    for (const st of storytellerTexts) {
      expect(tips).not.toContain(st);
    }
  });

  it('player 모드에서 CHARACTER_TIPS의 플레이/상대 팁이 포함된다', () => {
    const tips = getAllTipTexts('player');
    // CHARACTER_TIPS의 playTips 중 하나가 [역할명 플레이할 때] 형식으로 포함
    const hasCharacterTip = tips.some(
      (t) => t.includes('플레이할 때]') || t.includes('상대할 때]'),
    );
    expect(hasCharacterTip).toBe(true);
  });

  it('storyteller 모드에서 storyteller 카테고리 팁만 반환한다', () => {
    const tips = getAllTipTexts('storyteller');
    expect(tips.length).toBeGreaterThan(0);
    const storytellerTexts = GAMEPLAY_TIPS.filter(
      (t) => t.category === 'storyteller',
    ).map((t) => t.text);
    // 모든 반환된 팁이 storyteller 팁 목록에 있어야 함
    for (const tip of tips) {
      expect(storytellerTexts).toContain(tip);
    }
  });

  it('중복이 없는 팁 목록을 반환한다', () => {
    const playerTips = getAllTipTexts('player');
    expect(new Set(playerTips).size).toBe(playerTips.length);

    const stTips = getAllTipTexts('storyteller');
    expect(new Set(stTips).size).toBe(stTips.length);
  });

  it('셔플된 결과를 반환한다 (비결정적이므로 순서가 다를 수 있음)', () => {
    // 여러 번 호출하여 최소 한 번은 순서가 다른지 확인
    const first = getAllTipTexts('player');
    let isDifferent = false;
    for (let i = 0; i < 10; i++) {
      const other = getAllTipTexts('player');
      if (first.some((t, idx) => t !== other[idx])) {
        isDifferent = true;
        break;
      }
    }
    expect(isDifferent).toBe(true);
  });
});

describe('getRandomPlayTip (characterTips)', () => {
  it('알려진 역할에 대해 해당 역할의 playTips 중 하나를 반환한다', () => {
    const tip = getRandomPlayTip('imp');
    expect(tip).not.toBeNull();
    expect(typeof tip).toBe('string');
    expect(CHARACTER_TIPS.imp.playTips).toContain(tip);
  });

  it('여러 역할에 대해 정상 동작한다', () => {
    const roles = ['empath', 'fortune_teller', 'poisoner', 'monk', 'mayor'];
    for (const roleId of roles) {
      const tip = getRandomPlayTip(roleId);
      expect(tip).not.toBeNull();
      expect(typeof tip).toBe('string');
    }
  });

  it('존재하지 않는 roleId에 대해 null을 반환한다', () => {
    const tip = getRandomPlayTip('nonexistent_role');
    expect(tip).toBeNull();
  });
});

describe('getCharacterTips (characterTips)', () => {
  it('알려진 역할에 대해 playTips와 counterTips를 반환한다', () => {
    const tips = getCharacterTips('imp');
    expect(tips).not.toBeNull();
    expect(tips?.playTips.length).toBeGreaterThan(0);
    expect(tips?.counterTips.length).toBeGreaterThan(0);
  });

  it('모든 정의된 역할에 대해 유효한 팁을 반환한다', () => {
    for (const roleId of Object.keys(CHARACTER_TIPS)) {
      const tips = getCharacterTips(roleId);
      expect(tips).not.toBeNull();
      expect(tips?.playTips.length).toBeGreaterThan(0);
      expect(tips?.counterTips.length).toBeGreaterThan(0);
      // 모든 팁이 비어있지 않은 문자열인지 확인
      for (const t of tips?.playTips ?? []) {
        expect(t.length).toBeGreaterThan(0);
      }
      for (const t of tips?.counterTips ?? []) {
        expect(t.length).toBeGreaterThan(0);
      }
    }
  });

  it('존재하지 않는 roleId에 대해 null을 반환한다', () => {
    const tips = getCharacterTips('nonexistent_role');
    expect(tips).toBeNull();
  });
});

describe('CHARACTER_TIPS 데이터', () => {
  it('성결자 팁은 첫 지목으로 능력이 소모됨을 안내한다', () => {
    expect(CHARACTER_TIPS.virgin.playTips).toContain(
      '능력은 첫 번째 지목 때 소모됩니다. 외지인, 하수인, 악마, 여행자가 먼저 지목하면 처형은 없지만 이후 주민이 지목해도 발동하지 않습니다.',
    );
  });

  it('사악한 쌍둥이 팁은 선 팀 승리 불가 조건을 안내한다', () => {
    expect(CHARACTER_TIPS.evil_twin.playTips).toContain(
      '선/악 쌍둥이가 둘 다 살아있는 한, 선 팀은 승리할 수 없습니다. 악마가 처형되어도 게임이 계속됩니다.',
    );
  });

  it('보르톡스 팁은 현자의 정보도 거짓 정보 대상임을 안내한다', () => {
    const vortoxTips = [
      ...CHARACTER_TIPS.vortox.playTips,
      ...CHARACTER_TIPS.vortox.counterTips,
    ];
    expect(vortoxTips.join('\n')).not.toContain(
      '현자, 변종 등 마을주민 능력이 아닌 역할은 보르톡스의 영향을 받지 않아 정확한 정보를 제공합니다.',
    );
    expect(vortoxTips).toContain(
      '현자처럼 주민 능력으로 얻는 정보도 거짓이어야 합니다. 보르톡스 게임에서는 주민 정보의 반대 가능성을 기준으로 검토하세요.',
    );
  });

  it('여행자 팁은 현재 한국어 명칭을 사용한다', () => {
    const travellerTips = [
      ...CHARACTER_TIPS.butcher_traveller.playTips,
      ...CHARACTER_TIPS.butcher_traveller.counterTips,
      ...CHARACTER_TIPS.harlot.playTips,
      ...CHARACTER_TIPS.harlot.counterTips,
      ...CHARACTER_TIPS.deviant.playTips,
      ...CHARACTER_TIPS.deviant.counterTips,
      ...CHARACTER_TIPS.apprentice.playTips,
      ...CHARACTER_TIPS.apprentice.counterTips,
      ...CHARACTER_TIPS.matron.playTips,
      ...CHARACTER_TIPS.matron.counterTips,
      ...CHARACTER_TIPS.voudon.playTips,
      ...CHARACTER_TIPS.voudon.counterTips,
    ].join('\n');

    expect(travellerTips).not.toMatch(/백정|창녀|기인|견습생|사감|부두\b/);
  });

  it('sweetheart (Sects & Violets) 역할의 팁이 존재한다', () => {
    const tips = CHARACTER_TIPS.sweetheart;
    expect(tips).toBeDefined();
    expect(tips.playTips.length).toBeGreaterThan(0);
    expect(tips.counterTips.length).toBeGreaterThan(0);
  });

  it('Trouble Brewing 전체 역할의 팁이 정의되어 있다', () => {
    const tbRoles = [
      'washerwoman',
      'librarian',
      'investigator',
      'chef',
      'empath',
      'fortune_teller',
      'undertaker',
      'monk',
      'ravenkeeper',
      'virgin',
      'slayer',
      'soldier',
      'mayor',
      'butler',
      'drunk',
      'recluse',
      'saint',
      'poisoner',
      'spy',
      'scarlet_woman',
      'baron',
      'imp',
    ];
    for (const roleId of tbRoles) {
      expect(CHARACTER_TIPS).toHaveProperty(roleId);
    }
  });

  it('Bad Moon Rising 전체 일반 역할의 팁이 정의되어 있다', () => {
    const bmrRoles = [
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
    ] as const;

    for (const roleId of bmrRoles) {
      expect(CHARACTER_TIPS).toHaveProperty(roleId);
      expect(CHARACTER_TIPS[roleId].playTips.length).toBeGreaterThanOrEqual(3);
      expect(CHARACTER_TIPS[roleId].counterTips.length).toBeGreaterThanOrEqual(
        3,
      );
    }
  });

  it('Bad Moon Rising 여행자 팁이 정의되어 있다', () => {
    const bmrTravellers = [
      'apprentice',
      'matron',
      'voudon',
      'judge',
      'bishop',
    ] as const;

    for (const roleId of bmrTravellers) {
      expect(CHARACTER_TIPS[roleId].playTips.length).toBeGreaterThanOrEqual(3);
      expect(CHARACTER_TIPS[roleId].counterTips.length).toBeGreaterThanOrEqual(
        3,
      );
    }
  });

  it('캐릭터 팁에는 에디션 축약어를 직접 노출하지 않는다', () => {
    const forbiddenEditionAbbreviations = /\b(?:TB|S&V|BMR)\b/;

    for (const tips of Object.values(CHARACTER_TIPS)) {
      for (const text of [...tips.playTips, ...tips.counterTips]) {
        expect(text).not.toMatch(forbiddenEditionAbbreviations);
      }
    }
  });
});
