import { beforeEach, describe, expect, it, vi } from 'vitest';

const appState = vi.hoisted(() => ({
  currentState: 'active' as string | null | undefined,
  addEventListener: vi.fn(
    (_event: string, _handler: (state: string) => void) => ({
      remove: vi.fn(),
    }),
  ),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
  },
}));

vi.mock('react-native', () => ({
  AppState: appState,
}));

vi.mock('../../../notifications', () => ({
  vibrateAlert: vi.fn(),
}));

import {
  dismissPersonalDeathPresentation,
  selectGameOverlay,
} from '../../../components/gameOverlayPresentation';
import { usePlayerStore } from '../../../stores/playerStore';
import { attachGameListeners } from '../gameListeners';
import { attachNightListeners } from '../nightListeners';
import type { AppSocket } from '../types';

class FakeSocket {
  connected = true;
  handlers = new Map<string, (data: unknown) => void>();
  rejoinResponse: unknown = { success: false };
  rejoinEmitCount = 0;

  on(event: string, handler: (data: unknown) => void) {
    this.handlers.set(event, handler);
  }

  emitEvent(event: string, data: unknown) {
    this.handlers.get(event)?.(data);
  }

  emit(event: string, _data: unknown, callback?: (res: unknown) => void) {
    if (event === 'game:rejoin') {
      this.rejoinEmitCount += 1;
      callback?.(this.rejoinResponse);
    }
  }
}

describe('attachGameListeners', () => {
  beforeEach(() => {
    usePlayerStore.getState().reset();
    appState.currentState = 'active';
    appState.addEventListener.mockClear();
  });

  it.each([
    null,
    undefined,
  ])('초기 앱 상태가 %s여도 복귀 리스너가 정상 작동한다', (initialState) => {
    appState.currentState = initialState;
    const socket = new FakeSocket();
    usePlayerStore.getState().set({ playerId: 'persisted-player' });
    attachGameListeners(socket as unknown as AppSocket);
    const onChange = appState.addEventListener.mock.calls[0][1];

    expect(() => onChange('active')).not.toThrow();
    expect(socket.rejoinEmitCount).toBe(0);

    onChange('background');
    onChange('active');
    expect(socket.rejoinEmitCount).toBe(1);
  });

  it('초기 연결은 자동 rejoin을 건너뛰고 이후 reconnect마다 한 번만 요청한다', () => {
    const socket = new FakeSocket();
    socket.connected = false;
    usePlayerStore.getState().set({ playerId: 'persisted-player' });
    attachGameListeners(socket as unknown as AppSocket);

    socket.connected = true;
    socket.emitEvent('connect', undefined);
    expect(socket.rejoinEmitCount).toBe(0);

    socket.connected = false;
    socket.emitEvent('disconnect', undefined);
    socket.connected = true;
    socket.emitEvent('connect', undefined);
    expect(socket.rejoinEmitCount).toBe(1);
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

  it('일시적인 재접속 실패는 저장된 플레이어 세션을 보존한다', () => {
    const socket = new FakeSocket();
    socket.rejoinResponse = { success: false };
    usePlayerStore
      .getState()
      .set({ playerId: 'p1', playerName: 'Persisted Player' });
    attachGameListeners(socket as unknown as AppSocket);

    socket.emitEvent('connect', undefined);

    expect(usePlayerStore.getState()).toMatchObject({
      playerId: 'p1',
      playerName: 'Persisted Player',
    });
  });

  it.each([
    'game_not_found',
    'player_not_found',
  ] as const)('%s 재접속 실패는 저장된 플레이어 세션을 지운다', (error) => {
    const socket = new FakeSocket();
    socket.rejoinResponse = { success: false, error };
    usePlayerStore
      .getState()
      .set({ playerId: 'p1', playerName: 'Persisted Player' });
    attachGameListeners(socket as unknown as AppSocket);

    socket.emitEvent('connect', undefined);

    expect(usePlayerStore.getState()).toMatchObject({
      playerId: '',
      playerName: 'Persisted Player',
    });
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

  it('본인의 밤 사망을 해제하면 단체 발표에서 본인만 제외한다', () => {
    const socket = new FakeSocket();
    attachGameListeners(socket as unknown as AppSocket);
    attachNightListeners(socket as unknown as AppSocket);
    usePlayerStore.getState().set({
      playerId: 'dead-player',
      isAlive: true,
      gamePlayers: [
        {
          id: 'dead-player',
          name: 'Dead Player',
          isAlive: true,
          deadVoteUsed: false,
        },
      ],
    });

    socket.emitEvent('game:playerUpdate', {
      id: 'dead-player',
      name: 'Dead Player',
      isAlive: false,
      deadVoteUsed: false,
      statuses: [],
    });
    socket.emitEvent('night:deaths', {
      deaths: [
        { id: 'dead-player', name: 'Dead Player' },
        { id: 'other-dead-player', name: 'Other Dead Player' },
      ],
    });

    let state = usePlayerStore.getState();
    expect(
      selectGameOverlay({
        justDied: state.justDied,
        nightDeaths: state.nightDeathAnnouncement !== null,
      }),
    ).toBe('death');

    dismissPersonalDeathPresentation(
      usePlayerStore.getState().set,
      state.playerId,
      state.nightDeathAnnouncement,
    );

    state = usePlayerStore.getState();
    expect(state).toMatchObject({
      justDied: false,
      deathReason: null,
      nightDeathAnnouncement: [
        { id: 'other-dead-player', name: 'Other Dead Player' },
      ],
    });
    expect(
      selectGameOverlay({
        justDied: state.justDied,
        nightDeaths: state.nightDeathAnnouncement !== null,
      }),
    ).toBe('night_deaths');
  });

  it('본인만 포함된 밤 사망 발표는 개인 사망 해제 시 함께 지운다', () => {
    usePlayerStore.getState().set({
      playerId: 'dead-player',
      justDied: true,
      deathReason: 'night_kill',
      nightDeathAnnouncement: [{ id: 'dead-player', name: 'Dead Player' }],
    });

    const state = usePlayerStore.getState();
    dismissPersonalDeathPresentation(
      state.set,
      state.playerId,
      state.nightDeathAnnouncement,
    );

    expect(usePlayerStore.getState()).toMatchObject({
      justDied: false,
      deathReason: null,
      nightDeathAnnouncement: null,
    });
  });
});
