import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { useChatStore } from '../chatStore';

function makeStorytellerMessage(fromStoryteller: boolean) {
  return {
    id: `msg-${Math.random()}`,
    playerId: 'p1',
    playerName: 'Player1',
    message: 'hello',
    fromStoryteller,
    timestamp: Date.now(),
  };
}

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
  });

  it('addMessage: closed + fromStoryteller → unread 증가', () => {
    useChatStore.getState().addMessage(makeStorytellerMessage(true));
    expect(useChatStore.getState().unreadCount).toBe(1);
  });

  it('addMessage: open → unread 미증가', () => {
    useChatStore.getState().setOpen(true);
    useChatStore.getState().addMessage(makeStorytellerMessage(true));
    expect(useChatStore.getState().unreadCount).toBe(0);
  });

  it('addMessage: fromStoryteller false → unread 미증가', () => {
    useChatStore.getState().addMessage(makeStorytellerMessage(false));
    expect(useChatStore.getState().unreadCount).toBe(0);
  });

  it('setOpen(true) → unread 초기화', () => {
    useChatStore.getState().addMessage(makeStorytellerMessage(true));
    useChatStore.getState().addMessage(makeStorytellerMessage(true));
    expect(useChatStore.getState().unreadCount).toBe(2);

    useChatStore.getState().setOpen(true);
    expect(useChatStore.getState().unreadCount).toBe(0);
  });
});
