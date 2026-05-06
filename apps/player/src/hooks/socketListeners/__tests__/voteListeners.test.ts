import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../../notifications', () => ({
  vibrateAlert: vi.fn(),
}));

import { usePlayerStore } from '../../../stores/playerStore';
import type { AppSocket } from '../types';
import { attachVoteListeners } from '../voteListeners';

class FakeSocket {
  handlers = new Map<string, (data: unknown) => void>();

  on(event: string, handler: (data: unknown) => void) {
    this.handlers.set(event, handler);
  }

  emitEvent(event: string, data: unknown) {
    this.handlers.get(event)?.(data);
  }
}

describe('attachVoteListeners', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it('처단자와 마녀 저주 사망은 오늘 처형 발생으로 표시하지 않는다', () => {
    const socket = new FakeSocket();
    attachVoteListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({ playerId: 'me' });

    socket.emitEvent('execution:announced', {
      executedId: 'other',
      executedName: 'Other',
      reason: 'slayer',
      detail: 'Other died',
    });
    expect(usePlayerStore.getState().executionHappenedToday).toBe(false);

    socket.emitEvent('execution:announced', {
      executedId: 'other',
      executedName: 'Other',
      reason: 'witch_curse',
      detail: 'Other died',
    });
    expect(usePlayerStore.getState().executionHappenedToday).toBe(false);
  });
});
