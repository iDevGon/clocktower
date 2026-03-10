import type { WhisperMessage } from '@clocktower/shared';
import { create } from 'zustand';

interface WhisperToast {
  fromId: string;
  fromName: string;
  message: string;
}

interface ActiveWhisperChat {
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
}

interface WhisperState {
  conversations: Record<string, WhisperMessage[]>;
  activeChat: string | null;
  unreadCounts: Record<string, number>;
  toast: WhisperToast | null;
  activeWhispers: ActiveWhisperChat[];
  setActiveChat: (playerId: string | null) => void;
  addMessage: (message: WhisperMessage, myPlayerId: string) => void;
  clearUnread: (playerId: string) => void;
  showToast: (toast: WhisperToast) => void;
  dismissToast: () => void;
  setActiveWhispers: (whispers: ActiveWhisperChat[]) => void;
  reset: () => void;
}

const initialState = {
  conversations: {},
  activeChat: null,
  unreadCounts: {},
  toast: null as WhisperToast | null,
  activeWhispers: [] as ActiveWhisperChat[],
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
  showToast: (toast) => set({ toast }),
  dismissToast: () => set({ toast: null }),
  setActiveWhispers: (whispers) => set({ activeWhispers: whispers }),
  reset: () => set(initialState),
}));
