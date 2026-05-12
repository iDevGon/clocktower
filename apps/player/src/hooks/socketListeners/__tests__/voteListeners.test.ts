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

  it('투표 결과를 좌석 배치에서 다시 볼 수 있도록 히스토리에 저장한다', () => {
    const socket = new FakeSocket();
    attachVoteListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      gamePlayers: [
        { id: 'p1', name: 'Alice', isAlive: true },
        { id: 'p2', name: 'Bob', isAlive: true },
        { id: 'p3', name: 'Carol', isAlive: true },
      ],
    });

    socket.emitEvent('vote:start', {
      nominatorId: 'p1',
      nominatorName: 'Alice',
      nomineeId: 'p2',
      nomineeName: 'Bob',
    });
    socket.emitEvent('vote:order', {
      nomineeId: 'p2',
      order: [
        { id: 'p3', name: 'Carol' },
        { id: 'p1', name: 'Alice' },
      ],
      fullOrder: [
        { id: 'p1', name: 'Alice', isAlive: true },
        { id: 'p2', name: 'Bob', isAlive: true },
        { id: 'p3', name: 'Carol', isAlive: true },
      ],
    });
    socket.emitEvent('vote:result', {
      nomineeId: 'p2',
      nomineeName: 'Bob',
      guilty: true,
      votes: { p1: true, p3: false },
      executionCandidate: {
        playerId: 'p2',
        playerName: 'Bob',
        guiltyVotes: 1,
      },
    });

    expect(usePlayerStore.getState().voteHistory).toMatchObject([
      {
        round: 1,
        nominatorId: 'p1',
        nominatorName: 'Alice',
        nomineeId: 'p2',
        nomineeName: 'Bob',
        votes: { p1: true, p3: false },
        eligibleVoterIds: ['p1', 'p2', 'p3'],
      },
    ]);
  });
});
