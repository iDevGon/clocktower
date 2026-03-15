import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { useWhisperStore } from '../whisperStore';

function makeMessage(overrides: { conversationId: string; fromId: string }) {
  return {
    id: `msg-${Math.random()}`,
    fromName: 'Test',
    participantIds: ['p1', 'p2'],
    participantNames: ['Player1', 'Player2'],
    message: 'hello',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('whisperStore', () => {
  beforeEach(() => {
    useWhisperStore.getState().reset();
  });

  it('addMessage: 다른 채팅이면 unread 증가', () => {
    useWhisperStore.getState().setActiveChat('other-conv');

    useWhisperStore
      .getState()
      .addMessage(makeMessage({ conversationId: 'p1:p2', fromId: 'p2' }), 'p1');

    expect(useWhisperStore.getState().unreadCounts['p1:p2']).toBe(1);
  });

  it('addMessage: activeChat이면 unread 미증가', () => {
    useWhisperStore.getState().setActiveChat('p1:p2');

    useWhisperStore
      .getState()
      .addMessage(makeMessage({ conversationId: 'p1:p2', fromId: 'p2' }), 'p1');

    expect(useWhisperStore.getState().unreadCounts['p1:p2'] ?? 0).toBe(0);
  });

  it('addMessage: 자신의 메시지는 unread 미증가', () => {
    useWhisperStore.getState().setActiveChat(null);

    useWhisperStore
      .getState()
      .addMessage(makeMessage({ conversationId: 'p1:p2', fromId: 'p1' }), 'p1');

    expect(useWhisperStore.getState().unreadCounts['p1:p2'] ?? 0).toBe(0);
  });

  it('setActiveChat: unread 초기화', () => {
    useWhisperStore
      .getState()
      .addMessage(makeMessage({ conversationId: 'p1:p2', fromId: 'p2' }), 'p1');
    expect(useWhisperStore.getState().unreadCounts['p1:p2']).toBe(1);

    useWhisperStore.getState().setActiveChat('p1:p2');
    expect(useWhisperStore.getState().unreadCounts['p1:p2']).toBe(0);
  });
});
