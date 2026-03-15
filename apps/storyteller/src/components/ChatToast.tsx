import { BaseToast } from '@clocktower/ui';
import { useGameStore } from '../stores/gameStore';

interface ChatToastProps {
  onPress?: () => void;
}

export function ChatToast({ onPress }: ChatToastProps) {
  const chatToast = useGameStore((s) => s.chatToast);
  const dismissChatToast = useGameStore((s) => s.dismissChatToast);

  return (
    <BaseToast
      visible={!!chatToast}
      onDismiss={dismissChatToast}
      badgeLabel={chatToast?.playerName ?? ''}
      message={chatToast?.message ?? ''}
      onPress={onPress}
      zIndex={600}
    />
  );
}
