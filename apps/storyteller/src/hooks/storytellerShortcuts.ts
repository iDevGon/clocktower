export type StorytellerShortcutActionName =
  | 'advanceNightRole'
  | 'openNomination'
  | 'focusVote'
  | 'toggleLog'
  | 'openWhispers'
  | 'focusPlayerSearch'
  | 'closeOverlay';

export type StorytellerShortcutAction =
  | StorytellerShortcutActionName
  | { type: 'selectVisiblePlayer'; index: number };

export const STORYTELLER_SHORTCUT_LABELS: Record<
  StorytellerShortcutActionName,
  string
> = {
  advanceNightRole: '밤 순서 진행',
  openNomination: '지목 열기',
  focusVote: '투표 제어',
  toggleLog: '로그 열기/닫기',
  openWhispers: '밀담 패널',
  focusPlayerSearch: '플레이어 검색',
  closeOverlay: '닫기',
};

interface ShortcutEventLike {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

interface ShortcutContext {
  isDesktopConsole: boolean;
  isTextInputFocused: boolean;
}

export function getStorytellerShortcutAction(
  event: ShortcutEventLike,
  context: ShortcutContext,
): StorytellerShortcutAction | null {
  if (!context.isDesktopConsole) return null;
  if (event.metaKey || event.ctrlKey || event.altKey) return null;

  const key = event.key.toLowerCase();
  if (context.isTextInputFocused && key !== 'escape') return null;

  if (event.key === ' ') return 'advanceNightRole';
  if (key === 'n') return 'openNomination';
  if (key === 'v') return 'focusVote';
  if (key === 'l') return 'toggleLog';
  if (key === 'w') return 'openWhispers';
  if (key === 'f') return 'focusPlayerSearch';
  if (key === 'escape') return 'closeOverlay';

  const numeric = Number.parseInt(event.key, 10);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 9) {
    return { type: 'selectVisiblePlayer', index: numeric - 1 };
  }

  return null;
}
