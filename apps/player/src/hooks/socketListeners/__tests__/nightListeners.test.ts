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

  it('새 도박사 wakeUp은 기존 검토 상태와 제출 상태를 초기화한다', () => {
    const socket = new FakeSocket();
    attachNightListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      gamblerGuessStatus: 'approved',
      gamblerGuessRequestId: 'old-request',
      nightActionSubmitted: true,
    });

    socket.emitEvent('night:wakeUp', { roleId: 'gambler' });

    expect(usePlayerStore.getState()).toMatchObject({
      nightWakeUp: 'gambler',
      gamblerGuessStatus: 'idle',
      gamblerGuessRequestId: null,
      nightActionSubmitted: false,
    });
  });

  it('현재 요청의 승인만 행동 완료로 반영한다', () => {
    const socket = new FakeSocket();
    attachNightListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      gamblerGuessStatus: 'pending',
      gamblerGuessRequestId: 'request-1',
      nightActionSubmitted: false,
    });

    socket.emitEvent('gambler:guessReviewed', {
      requestId: 'request-1',
      status: 'approved',
    });

    expect(usePlayerStore.getState()).toMatchObject({
      gamblerGuessStatus: 'approved',
      gamblerGuessRequestId: 'request-1',
      nightActionSubmitted: true,
    });
  });

  it('현재 요청의 반려는 재제출할 수 있도록 풀린 상태로 반영한다', () => {
    const socket = new FakeSocket();
    attachNightListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      gamblerGuessStatus: 'pending',
      gamblerGuessRequestId: 'request-1',
      nightActionSubmitted: false,
    });

    socket.emitEvent('gambler:guessReviewed', {
      requestId: 'request-1',
      status: 'rejected',
    });

    expect(usePlayerStore.getState()).toMatchObject({
      gamblerGuessStatus: 'rejected',
      gamblerGuessRequestId: null,
      nightActionSubmitted: false,
    });
  });

  it('오래된 요청 ID의 검토 이벤트를 무시한다', () => {
    const socket = new FakeSocket();
    attachNightListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      gamblerGuessStatus: 'pending',
      gamblerGuessRequestId: 'current-request',
      nightActionSubmitted: false,
    });

    socket.emitEvent('gambler:guessReviewed', {
      requestId: 'stale-request',
      status: 'approved',
    });

    expect(usePlayerStore.getState()).toMatchObject({
      gamblerGuessStatus: 'pending',
      gamblerGuessRequestId: 'current-request',
      nightActionSubmitted: false,
    });
  });

  it('활성 역할이 바뀌면 이전 도박사 검토 상태를 제거한다', () => {
    const socket = new FakeSocket();
    attachNightListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      gamblerGuessStatus: 'pending',
      gamblerGuessRequestId: 'request-1',
      nightActionSubmitted: false,
    });

    socket.emitEvent('night:activeRole', {
      roleId: 'grandmother',
      activeIndex: 2,
      order: ['gambler', 'grandmother'],
      players: [],
    });

    expect(usePlayerStore.getState()).toMatchObject({
      gamblerGuessStatus: 'idle',
      gamblerGuessRequestId: null,
      nightActionSubmitted: false,
    });
  });
});
