import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
}));

import { usePlayerStore } from '../../../stores/playerStore';
import { attachGameListeners } from '../gameListeners';
import type { AppSocket } from '../types';

class FakeSocket {
  connected = true;
  handlers = new Map<string, (data: unknown) => void>();

  on(event: string, handler: (data: unknown) => void) {
    this.handlers.set(event, handler);
  }

  emitEvent(event: string, data: unknown) {
    this.handlers.get(event)?.(data);
  }

  emit() {
    // noop for game:rejoin in these tests
  }
}

describe('attachGameListeners', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it('창녀 본인에게는 동의한 대상의 역할명을 표시한다', () => {
    const socket = new FakeSocket();
    attachGameListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({ playerId: 'harlot' });

    socket.emitEvent('harlot:consentResult', {
      harlotId: 'harlot',
      harlotName: 'Harlot',
      targetId: 'target',
      targetName: 'Target',
      accepted: true,
      targetRoleName: '임프',
    });

    expect(usePlayerStore.getState().eventToast?.message).toContain('임프');
  });
});
