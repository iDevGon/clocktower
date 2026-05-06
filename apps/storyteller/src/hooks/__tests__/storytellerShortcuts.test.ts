import { describe, expect, it } from 'vitest';
import {
  getStorytellerShortcutAction,
  STORYTELLER_SHORTCUT_LABELS,
} from '../storytellerShortcuts';

describe('storytellerShortcuts', () => {
  const base = { isDesktopConsole: true, isTextInputFocused: false };

  it('PC 콘솔에서 주요 단축키를 action으로 변환한다', () => {
    expect(getStorytellerShortcutAction({ key: ' ' }, base)).toBe(
      'advanceNightRole',
    );
    expect(getStorytellerShortcutAction({ key: 'n' }, base)).toBe(
      'openNomination',
    );
    expect(getStorytellerShortcutAction({ key: 'V' }, base)).toBe('focusVote');
    expect(getStorytellerShortcutAction({ key: 'l' }, base)).toBe('toggleLog');
    expect(getStorytellerShortcutAction({ key: 'w' }, base)).toBe(
      'openWhispers',
    );
    expect(getStorytellerShortcutAction({ key: 'f' }, base)).toBe(
      'focusPlayerSearch',
    );
    expect(getStorytellerShortcutAction({ key: 'Escape' }, base)).toBe(
      'closeOverlay',
    );
  });

  it('텍스트 입력 중에는 Esc 외 단축키를 무시한다', () => {
    expect(
      getStorytellerShortcutAction(
        { key: 'n' },
        { isDesktopConsole: true, isTextInputFocused: true },
      ),
    ).toBeNull();
    expect(
      getStorytellerShortcutAction(
        { key: 'Escape' },
        { isDesktopConsole: true, isTextInputFocused: true },
      ),
    ).toBe('closeOverlay');
  });

  it('모바일/태블릿 grimoire에서는 단축키를 무시한다', () => {
    expect(
      getStorytellerShortcutAction(
        { key: 'n' },
        { isDesktopConsole: false, isTextInputFocused: false },
      ),
    ).toBeNull();
  });

  it('숫자키는 대상 선택용 action으로 변환한다', () => {
    expect(getStorytellerShortcutAction({ key: '1' }, base)).toEqual({
      type: 'selectVisiblePlayer',
      index: 0,
    });
    expect(getStorytellerShortcutAction({ key: '9' }, base)).toEqual({
      type: 'selectVisiblePlayer',
      index: 8,
    });
  });

  it('파괴적인 one-key action을 제공하지 않는다', () => {
    expect(Object.keys(STORYTELLER_SHORTCUT_LABELS)).not.toContain('kill');
    expect(Object.keys(STORYTELLER_SHORTCUT_LABELS)).not.toContain('execute');
    expect(Object.keys(STORYTELLER_SHORTCUT_LABELS)).not.toContain('exile');
    expect(Object.keys(STORYTELLER_SHORTCUT_LABELS)).not.toContain('resetGame');
  });
});
