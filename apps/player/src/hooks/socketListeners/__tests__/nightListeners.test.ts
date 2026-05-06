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
import { attachNightListeners } from '../nightListeners';
import type { AppSocket } from '../types';

class FakeSocket {
  handlers = new Map<string, (data: unknown) => void>();

  on(event: string, handler: (data: unknown) => void) {
    this.handlers.set(event, handler);
  }

  emitEvent(event: string, data: unknown) {
    this.handlers.get(event)?.(data);
  }
}

describe('attachNightListeners', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it('같은 역할의 두 번째 wakeUp에서도 행동/피드백 상태를 초기화한다', () => {
    const socket = new FakeSocket();
    attachNightListeners(socket as unknown as AppSocket);

    usePlayerStore.getState().set({
      nightActionSubmitted: true,
      nightFeedback: { type: 'number', value: 2 },
    });

    socket.emitEvent('night:wakeUp', { roleId: 'dreamer' });

    const state = usePlayerStore.getState();
    expect(state.nightWakeUp).toBe('dreamer');
    expect(state.nightActionSubmitted).toBe(false);
    expect(state.nightFeedback).toBeNull();
  });
});
