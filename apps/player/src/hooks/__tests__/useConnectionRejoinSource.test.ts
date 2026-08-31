import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({
  useCallback: <T extends (...args: never[]) => unknown>(callback: T) =>
    callback,
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('../../notifications', () => ({
  registerForPushNotifications: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('../socketListeners', () => ({
  attachListeners: vi.fn(),
}));

import { useConnectionStore } from '../../stores/connectionStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useConnection } from '../useConnection';

function setSocket(socket: {
  connected: boolean;
  emit: (...args: unknown[]) => unknown;
}) {
  useConnectionStore.getState().set({ socket: socket as never });
}

describe('useConnection rejoin outcomes', () => {
  beforeEach(() => {
    vi.useRealTimers();
    usePlayerStore.getState().reset();
    useConnectionStore.getState().set({ socket: null, isConnected: false });
  });

  it.each([
    'game_not_found',
    'player_not_found',
  ] as const)('%s 응답만 만료 세션으로 판별해 저장된 플레이어 ID를 지운다', async (error) => {
    usePlayerStore
      .getState()
      .set({ playerId: 'persisted-player', playerName: 'Player' });
    setSocket({
      connected: true,
      emit: (_event, _data, callback) => {
        (callback as (response: unknown) => void)({
          success: false,
          error,
        });
      },
    });

    const outcome = await useConnection().rejoinGame('persisted-player');

    expect(outcome).toEqual({ status: 'missing' });
    expect(usePlayerStore.getState().playerId).toBe('');
  });

  it('연결되지 않은 소켓은 unavailable로 반환하고 세션을 보존한다', async () => {
    usePlayerStore.getState().set({ playerId: 'persisted-player' });
    const emit = vi.fn();
    setSocket({ connected: false, emit });

    const outcome = await useConnection().rejoinGame('persisted-player');

    expect(outcome).toEqual({ status: 'unavailable' });
    expect(usePlayerStore.getState().playerId).toBe('persisted-player');
    expect(emit).not.toHaveBeenCalled();
  });

  it('응답 시간 초과는 unavailable로 반환하고 세션을 보존한다', async () => {
    vi.useFakeTimers();
    usePlayerStore.getState().set({ playerId: 'persisted-player' });
    setSocket({ connected: true, emit: vi.fn() });

    const outcomePromise = useConnection().rejoinGame('persisted-player');
    await vi.advanceTimersByTimeAsync(5000);

    await expect(outcomePromise).resolves.toEqual({ status: 'unavailable' });
    expect(usePlayerStore.getState().playerId).toBe('persisted-player');
  });

  it('소켓 예외는 unavailable로 반환하고 세션을 보존한다', async () => {
    usePlayerStore.getState().set({ playerId: 'persisted-player' });
    setSocket({
      connected: true,
      emit: () => {
        throw new Error('socket unavailable');
      },
    });

    const outcome = await useConnection().rejoinGame('persisted-player');

    expect(outcome).toEqual({ status: 'unavailable' });
    expect(usePlayerStore.getState().playerId).toBe('persisted-player');
  });

  it('성공 응답은 게임 설정까지 한 번에 복원한다', async () => {
    usePlayerStore.getState().set({ playerId: 'persisted-player' });
    const gameSettings = {
      whisperMode: 'offline' as const,
      votingMode: 'offline' as const,
      voteClockSeconds: 9,
      whisperClockSeconds: 8,
      discussionClockSeconds: 7,
      nominationClockSeconds: 6,
      defenseClockSeconds: 5,
      setupEditionId: 'custom-edition',
      additionalRoleIds: ['chef'],
      excludedRoleIds: ['imp'],
      showVoteHistory: false,
    };
    setSocket({
      connected: true,
      emit: (_event, _data, callback) => {
        (callback as (response: unknown) => void)({
          success: true,
          playerName: 'Player',
          phase: 'day',
          gameSettings,
        });
      },
    });

    const outcome = await useConnection().rejoinGame('persisted-player');

    expect(outcome).toEqual({ status: 'success' });
    expect(usePlayerStore.getState().gameSettings).toEqual(gameSettings);
  });
});
