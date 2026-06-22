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
  rejoinResponse: unknown = { success: false };

  on(event: string, handler: (data: unknown) => void) {
    this.handlers.set(event, handler);
  }

  emitEvent(event: string, data: unknown) {
    this.handlers.get(event)?.(data);
  }

  emit(event: string, _data: unknown, callback?: (res: unknown) => void) {
    if (event === 'game:rejoin') {
      callback?.(this.rejoinResponse);
    }
  }
}

describe('attachGameListeners', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
  });

  it('매춘부 본인에게는 동의한 대상의 역할명을 표시한다', () => {
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

  it('재접속 응답의 하수인 악 진영 정보를 카드 상태에 복원한다', () => {
    const socket = new FakeSocket();
    socket.rejoinResponse = {
      success: true,
      playerName: 'Player2',
      roleId: 'poisoner',
      phase: 'night',
      evilInfo: {
        demonName: 'Player1',
        otherMinionNames: ['Player3'],
      },
    };
    usePlayerStore.getState().set({ playerId: 'p2' });
    attachGameListeners(socket as unknown as AppSocket);

    socket.emitEvent('connect', undefined);

    expect(usePlayerStore.getState().evilInfo).toEqual({
      demonName: 'Player1',
      otherMinionNames: ['Player3'],
    });
  });

  it('재접속 응답의 철학자 부여 역할을 복원한다', () => {
    const socket = new FakeSocket();
    socket.rejoinResponse = {
      success: true,
      playerName: 'Philosopher',
      roleId: 'philosopher',
      phase: 'night',
      philosopherGrantedRole: 'po',
    };
    usePlayerStore.getState().set({ playerId: 'p1' });
    attachGameListeners(socket as unknown as AppSocket);

    socket.emitEvent('connect', undefined);

    expect(usePlayerStore.getState().philosopherGrantedRole).toBe('po');
  });

  it('플레이어 갱신의 좀버얼 공개 사망 상태를 사망으로 표시한다', () => {
    const socket = new FakeSocket();
    attachGameListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      playerId: 'zombuul',
      isAlive: false,
      gamePlayers: [
        {
          id: 'zombuul',
          name: 'Zombuul',
          isAlive: false,
          deadVoteUsed: false,
        },
      ],
    });

    socket.emitEvent('game:playerUpdate', {
      id: 'zombuul',
      name: 'Zombuul',
      isAlive: true,
      deadVoteUsed: false,
      statuses: ['zombuul_registers_dead'],
    });

    expect(usePlayerStore.getState().isAlive).toBe(false);
    expect(usePlayerStore.getState().gamePlayers[0]?.isAlive).toBe(false);
  });

  it('부활 플레이어 갱신은 사망 투표권 사용 상태도 되돌린다', () => {
    const socket = new FakeSocket();
    attachGameListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      playerId: 'revived',
      isAlive: false,
      deadVoteUsed: true,
      gamePlayers: [
        {
          id: 'revived',
          name: 'Revived',
          isAlive: false,
          deadVoteUsed: true,
        },
      ],
    });

    socket.emitEvent('game:playerUpdate', {
      id: 'revived',
      name: 'Revived',
      isAlive: true,
      deadVoteUsed: false,
      statuses: [],
    });

    expect(usePlayerStore.getState().isAlive).toBe(true);
    expect(usePlayerStore.getState().deadVoteUsed).toBe(false);
    expect(usePlayerStore.getState().gamePlayers[0]?.isAlive).toBe(true);
    expect(usePlayerStore.getState().gamePlayers[0]?.deadVoteUsed).toBe(false);
  });
});
