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
});
