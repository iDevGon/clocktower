import type { WhisperMessage } from '@clocktower/shared';
import { create } from 'zustand';

interface WhisperState {
  conversations: Record<string, WhisperMessage[]>;
  activeChat: string | null;
  unreadCounts: Record<string, number>;
  setActiveChat: (playerId: string | null) => void;
  addMessage: (message: WhisperMessage, myPlayerId: string) => void;
  clearUnread: (playerId: string) => void;
  reset: () => void;
}

const initialState = {
  conversations: {},
  activeChat: null,
  unreadCounts: {},
};

export const useWhisperStore = create<WhisperState>((set, get) => ({
  ...initialState,
  setActiveChat: (playerId) => {
    set({ activeChat: playerId });
    if (playerId) {
      const { unreadCounts } = get();
      set({ unreadCounts: { ...unreadCounts, [playerId]: 0 } });
    }
  },
  addMessage: (message, myPlayerId) => {
    const { conversations, activeChat, unreadCounts } = get();
    const partnerId =
      message.fromId === myPlayerId ? message.toId : message.fromId;
    const prev = conversations[partnerId] ?? [];
    set({
      conversations: {
        ...conversations,
        [partnerId]: [...prev, message],
      },
    });
    // Increment unread if not currently viewing this chat
    if (activeChat !== partnerId && message.fromId !== myPlayerId) {
      set({
        unreadCounts: {
          ...unreadCounts,
          [partnerId]: (unreadCounts[partnerId] ?? 0) + 1,
        },
      });
    }
  },
  clearUnread: (playerId) => {
    const { unreadCounts } = get();
    set({ unreadCounts: { ...unreadCounts, [playerId]: 0 } });
  },
  reset: () => set(initialState),
}));
