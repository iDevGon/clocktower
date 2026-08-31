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

import { selectGameOverlay } from '../../../components/gameOverlayPresentation';
import { acknowledgeSlayerFizzle } from '../../../components/slayerAcknowledgement';
import { useConnectionStore } from '../../../stores/connectionStore';
import { usePlayerStore } from '../../../stores/playerStore';
import { attachSocialListeners } from '../socialListeners';
import type { AppSocket } from '../types';

class FakeSocket {
  connected = true;
  emitted: string[] = [];
  handlers = new Map<string, (data?: unknown) => void>();

  on(event: string, handler: (data?: unknown) => void) {
    this.handlers.set(event, handler);
  }

  emit(event: string) {
    this.emitted.push(event);
  }

  emitEvent(event: string, data?: unknown) {
    this.handlers.get(event)?.(data);
  }
}

describe('Slayer vote acknowledgement lifecycle', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
    useConnectionStore.getState().set({ socket: null, isConnected: false });
  });

  it('clears an acknowledged vote fizzle without replaying it after voting', () => {
    const socket = new FakeSocket();
    attachSocialListeners(socket as unknown as AppSocket);
    useConnectionStore.getState().set({
      socket: socket as unknown as AppSocket,
      isConnected: true,
    });
    usePlayerStore.getState().set({ currentPhase: 'vote' });

    socket.emitEvent('slayer:noEffect', {
      slayerName: 'Alice',
      targetName: 'Bob',
    });
    expect(usePlayerStore.getState()).toMatchObject({
      currentPhase: 'vote',
      slayerFizzle: { slayerName: 'Alice', targetName: 'Bob' },
      slayerAcked: false,
    });

    acknowledgeSlayerFizzle();
    acknowledgeSlayerFizzle();
    expect(socket.emitted).toEqual(['slayer:ack']);
    expect(usePlayerStore.getState().slayerAcked).toBe(true);

    socket.emitEvent('slayer:allAcked');
    expect(usePlayerStore.getState()).toMatchObject({
      slayerFizzle: null,
      slayerAcked: false,
    });

    usePlayerStore.getState().set({ currentPhase: 'day' });
    const state = usePlayerStore.getState();
    expect(
      selectGameOverlay({
        currentPhase: state.currentPhase,
        slayerFizzle: state.slayerFizzle !== null,
      }),
    ).toBe('none');
  });
});
