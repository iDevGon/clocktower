import type { ActiveWhisperChat, WhisperMessage } from '@clocktower/shared';
import { create } from 'zustand';

interface WhisperToast {
  fromId: string;
  fromName: string;
  conversationId: string;
  participantNames: string[];
  message: string;
}

interface ConversationMeta {
  participantIds: string[];
  participantNames: string[];
}

interface WhisperState {
  conversations: Record<string, WhisperMessage[]>;
  conversationMeta: Record<string, ConversationMeta>;
  activeChat: string | null;
  unreadCounts: Record<string, number>;
  toast: WhisperToast | null;
  activeWhispers: ActiveWhisperChat[];
  setActiveChat: (conversationId: string | null) => void;
  addMessage: (message: WhisperMessage, myPlayerId: string) => void;
  clearUnread: (conversationId: string) => void;
  showToast: (toast: WhisperToast) => void;
  dismissToast: () => void;
  setActiveWhispers: (whispers: ActiveWhisperChat[]) => void;
  reset: () => void;
}

const initialState = {
  conversations: {},
  conversationMeta: {},
  activeChat: null,
  unreadCounts: {},
  toast: null as WhisperToast | null,
  activeWhispers: [] as ActiveWhisperChat[],
};

export const useWhisperStore = create<WhisperState>((set, get) => ({
  ...initialState,
  setActiveChat: (conversationId) => {
    set({ activeChat: conversationId });
    if (conversationId) {
      const { unreadCounts } = get();
      set({ unreadCounts: { ...unreadCounts, [conversationId]: 0 } });
    }
  },
  addMessage: (message, myPlayerId) => {
    const { conversations, conversationMeta, activeChat, unreadCounts } = get();
    const convId = message.conversationId;
    const prev = conversations[convId] ?? [];
    set({
      conversations: {
        ...conversations,
        [convId]: [...prev, message],
      },
      conversationMeta: {
        ...conversationMeta,
        [convId]: {
          participantIds: message.participantIds,
          participantNames: message.participantNames,
        },
      },
    });
    // Increment unread if not currently viewing this chat
    if (activeChat !== convId && message.fromId !== myPlayerId) {
      set({
        unreadCounts: {
          ...unreadCounts,
          [convId]: (unreadCounts[convId] ?? 0) + 1,
        },
      });
    }
  },
  clearUnread: (conversationId) => {
    const { unreadCounts } = get();
    set({ unreadCounts: { ...unreadCounts, [conversationId]: 0 } });
  },
  showToast: (toast) => set({ toast }),
  dismissToast: () => set({ toast: null }),
  setActiveWhispers: (whispers) => set({ activeWhispers: whispers }),
  reset: () => set(initialState),
}));
