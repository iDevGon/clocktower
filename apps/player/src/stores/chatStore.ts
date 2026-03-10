import type { StorytellerMessage } from '@clocktower/shared';
import { create } from 'zustand';

interface ChatToast {
  message: string;
}

interface ChatState {
  messages: StorytellerMessage[];
  unreadCount: number;
  isOpen: boolean;
  toast: ChatToast | null;
  addMessage: (message: StorytellerMessage) => void;
  setOpen: (open: boolean) => void;
  clearUnread: () => void;
  showToast: (toast: ChatToast) => void;
  dismissToast: () => void;
  reset: () => void;
}

const initialState = {
  messages: [] as StorytellerMessage[],
  unreadCount: 0,
  isOpen: false,
  toast: null as ChatToast | null,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,
  addMessage: (message) => {
    const { isOpen } = get();
    set((s) => ({
      messages: [...s.messages, message],
      unreadCount:
        !message.fromStoryteller || isOpen ? s.unreadCount : s.unreadCount + 1,
    }));
  },
  setOpen: (open) => {
    set({ isOpen: open });
    if (open) {
      set({ unreadCount: 0 });
    }
  },
  clearUnread: () => set({ unreadCount: 0 }),
  showToast: (toast) => set({ toast }),
  dismissToast: () => set({ toast: null }),
  reset: () => set(initialState),
}));
