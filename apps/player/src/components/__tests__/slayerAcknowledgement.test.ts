import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

import { useConnectionStore } from '../../stores/connectionStore';
import { usePlayerStore } from '../../stores/playerStore';
import { acknowledgeSlayerFizzle } from '../slayerAcknowledgement';

describe('acknowledgeSlayerFizzle', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
    useConnectionStore.getState().set({ socket: null, isConnected: false });
  });

  it('emits once and marks the acknowledgement while waiting for all players', () => {
    const emit = vi.fn();
    useConnectionStore.getState().set({
      socket: { connected: true, emit } as never,
      isConnected: true,
    });

    acknowledgeSlayerFizzle();
    acknowledgeSlayerFizzle();

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('slayer:ack');
    expect(usePlayerStore.getState().slayerAcked).toBe(true);
  });

  it('does not acknowledge without a connected socket', () => {
    const emit = vi.fn();
    useConnectionStore.getState().set({
      socket: { connected: false, emit } as never,
      isConnected: false,
    });

    acknowledgeSlayerFizzle();

    expect(emit).not.toHaveBeenCalled();
    expect(usePlayerStore.getState().slayerAcked).toBe(false);
  });
});
