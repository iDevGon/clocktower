import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  getStorytellerShortcutAction,
  type StorytellerShortcutAction,
} from './storytellerShortcuts';

interface UseStorytellerKeyboardShortcutsOptions {
  isDesktopConsole: boolean;
  enabled?: boolean;
  onAction: (action: StorytellerShortcutAction) => void;
}

function isTextInputElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  );
}

export function useStorytellerKeyboardShortcuts({
  isDesktopConsole,
  enabled = true,
  onAction,
}: UseStorytellerKeyboardShortcutsOptions) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = getStorytellerShortcutAction(event, {
        isDesktopConsole,
        isTextInputFocused: isTextInputElement(event.target),
      });
      if (!action) return;

      event.preventDefault();
      onAction(action);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, isDesktopConsole, onAction]);
}
