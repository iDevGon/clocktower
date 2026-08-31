import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({
  useCallback: <T extends (...args: never[]) => unknown>(callback: T) =>
    callback,
}));

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../notifications', () => ({
  vibrateAlert: vi.fn(),
}));

import { useConnectionStore } from '../../stores/connectionStore';
import { usePlayerStore } from '../../stores/playerStore';
import { attachNightListeners } from '../socketListeners/nightListeners';
import type { AppSocket } from '../socketListeners/types';
import { useGameActions } from '../useGameActions';

type TimedAck = (
  error: Error | null,
  response?:
    | { success: true; requestId: string }
    | { success: false; error: string },
) => void;

class MissingAckSocket {
  connected = true;
  lateAck: (() => void) | null = null;
  handlers = new Map<string, (data: unknown) => void>();

  emit() {
    // Current implementation waits on this missing ack forever.
  }

  on(event: string, handler: (data: unknown) => void) {
    this.handlers.set(event, handler);
  }

  emitServerEvent(event: string, data: unknown) {
    this.handlers.get(event)?.(data);
  }

  timeout(timeoutMs: number) {
    return {
      emit: (
        _event: string,
        _data: { targetPlayerId: string; guessedRoleId: string },
        callback: TimedAck,
      ) => {
        setTimeout(() => callback(new Error('operation timed out')), timeoutMs);
        this.lateAck = () =>
          callback(null, { success: true, requestId: 'late-request' });
      },
    };
  }
}

describe('useGameActions submitGamblerGuess', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePlayerStore.getState().reset();
    useConnectionStore.getState().set({ socket: null, isConnected: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ack가 유실되면 실패로 종료하고 느지막 성공 ack를 무시한다', async () => {
    const socket = new MissingAckSocket();
    useConnectionStore.getState().set({
      socket: socket as never,
      isConnected: true,
    });
    let outcome: { success: boolean; error?: string } | undefined;

    useGameActions()
      .submitGamblerGuess('target-player', 'chef')
      .then((result) => {
        outcome = result;
      });
    await vi.runAllTimersAsync();

    expect(outcome).toEqual({
      success: false,
      error: '제출 응답 시간이 초과되었습니다. 다시 시도하세요.',
    });
    expect(usePlayerStore.getState()).toMatchObject({
      gamblerGuessStatus: 'idle',
      gamblerGuessRequestId: null,
    });

    socket.lateAck?.();
    await Promise.resolve();

    expect(usePlayerStore.getState()).toMatchObject({
      gamblerGuessStatus: 'idle',
      gamblerGuessRequestId: null,
    });
  });

  it('서버 accepted 이벤트를 받았다면 ack timeout 후에도 pending request를 보존한다', async () => {
    const socket = new MissingAckSocket();
    attachNightListeners(socket as unknown as AppSocket);
    useConnectionStore.getState().set({
      socket: socket as never,
      isConnected: true,
    });
    usePlayerStore.getState().set({ nightWakeUp: 'gambler' });

    const outcomePromise = useGameActions().submitGamblerGuess(
      'target-player',
      'chef',
    );
    socket.emitServerEvent('gambler:guessSubmitted', {
      requestId: 'accepted-request',
    });
    await vi.runAllTimersAsync();

    await expect(outcomePromise).resolves.toEqual({
      success: false,
      error: '제출 응답 시간이 초과되었습니다. 다시 시도하세요.',
    });
    expect(usePlayerStore.getState()).toMatchObject({
      gamblerGuessStatus: 'pending',
      gamblerGuessRequestId: 'accepted-request',
      nightActionSubmitted: false,
    });
  });
});
