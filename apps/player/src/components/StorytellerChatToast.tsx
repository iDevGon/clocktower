import { BaseToast } from '@clocktower/ui';
import { useChatStore } from '../stores/chatStore';

interface StorytellerChatToastProps {
  onPress?: () => void;
}

export function StorytellerChatToast({ onPress }: StorytellerChatToastProps) {
  const toast = useChatStore((s) => s.toast);
  const dismissToast = useChatStore((s) => s.dismissToast);

  return (
    <BaseToast
      visible={!!toast}
      onDismiss={dismissToast}
      badgeLabel="진행자"
      message={toast?.message ?? ''}
      onPress={onPress}
      zIndex={101}
    />
  );
}
