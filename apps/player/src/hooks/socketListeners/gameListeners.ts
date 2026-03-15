import { getRoleById } from '@clocktower/shared';
import { useChatStore } from '../../stores/chatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useWhisperStore } from '../../stores/whisperStore';
import type { AppSocket } from './types';

export function attachGameListeners(socket: AppSocket) {
  socket.on('connect', () => {
    const { playerId } = usePlayerStore.getState();
    if (playerId) {
      socket.emit('game:rejoin', { playerId }, (res) => {
        if (res.success) {
          usePlayerStore.getState().set({
            role: res.roleId ? (getRoleById(res.roleId) ?? null) : null,
            drunkAs: res.drunkAs ?? null,
            currentPhase: res.phase ?? 'setup',
            isAlive: res.isAlive ?? true,
            daySubPhase: res.daySubPhase ?? null,
            hasNominatedToday: res.hasNominatedToday ?? false,
            deadVoteUsed: res.deadVoteUsed ?? false,
            nightProgress: res.nightProgress ?? null,
          });
        } else {
          // Game was reset or no longer exists — clear game state but keep connection
          const { playerName } = usePlayerStore.getState();
          usePlayerStore.getState().reset();
          usePlayerStore.getState().set({ playerName });
          useWhisperStore.getState().reset();
          useChatStore.getState().reset();
        }
      });
    }
  });

  socket.on('game:end', (result) => {
    usePlayerStore.getState().set({
      gameResult: result,
      currentPhase: 'ended',
      nomination: null,
    });
  });

  socket.on('game:phase', (phase) => {
    const prev = usePlayerStore.getState();
    if (phase === 'setup') {
      useChatStore.getState().reset();
      useWhisperStore.getState().reset();
    }
    usePlayerStore.getState().set({
      currentPhase: phase,
      ...(phase !== 'vote' ? { nomination: null } : {}),
      nightProgress: null,
      nightFeedback: null,
      ...(phase === 'night'
        ? {
            hasNominatedToday: false,
            executionHappenedToday: false,
            nightCount: prev.nightCount + 1,
            nominatedTodayIds: [],
            voteResult: null,
            executionCandidate: null,
          }
        : {}),
      // 새 게임 시작 (setup): 역할/상태 초기화, 피드백 히스토리 리셋
      ...(phase === 'setup'
        ? {
            role: null,
            evilInfo: null,
            drunkAs: null,
            isAlive: true,
            hasNominatedToday: false,
            deadVoteUsed: false,
            nightActionSubmitted: false,
            nightCount: 0,
            feedbackHistory: [],
            gameResult: null,
            justDied: false,
            deathReason: null,
            executionAnnouncement: null,
            nightDeathAnnouncement: null,
            executionHappenedToday: false,
            slayerUsed: false,
            voteResult: null,
            executionCandidate: null,
            nominatedTodayIds: [],
          }
        : {}),
    });
  });

  socket.on('game:state', (state) => {
    const players = state.players.map(({ id, name, isAlive }) => ({
      id,
      name,
      isAlive,
    }));

    // Game was reset - player no longer exists in the game
    const { playerId, playerName } = usePlayerStore.getState();
    if (playerId && !state.players.find((p) => p.id === playerId)) {
      // 게임 상태만 초기화하고 서버 연결/게임코드는 유지
      usePlayerStore.getState().reset();
      usePlayerStore.getState().set({ playerName });
      useWhisperStore.getState().reset();
      useChatStore.getState().reset();
      return;
    }

    usePlayerStore.getState().set({ gamePlayers: players });
  });

  socket.on('game:playerUpdate', (player) => {
    const state = usePlayerStore.getState();
    if (player.id === state.playerId) {
      const wasDeath = state.isAlive && !player.isAlive;
      usePlayerStore.getState().set({
        isAlive: player.isAlive,
        ...(wasDeath
          ? {
              justDied: true,
              // execution:announced가 먼저 왔으면 그 이유 유지, 아니면 night_kill
              deathReason: state.deathReason ?? 'night_kill',
            }
          : {}),
      });
    }
    const updated = state.gamePlayers.map((p) =>
      p.id === player.id ? { ...p, isAlive: player.isAlive } : p,
    );
    usePlayerStore.getState().set({ gamePlayers: updated });
  });

  socket.on('game:settings', (settings) => {
    usePlayerStore.getState().set({ gameSettings: settings });
  });
}
