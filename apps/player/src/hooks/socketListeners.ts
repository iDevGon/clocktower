import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import type { Socket } from 'socket.io-client';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import { useWhisperStore } from '../stores/whisperStore';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function attachListeners(socket: AppSocket) {
  socket.on('connect', () => {
    const { playerId } = usePlayerStore.getState();
    const { gameCode } = useConnectionStore.getState();
    if (playerId && gameCode) {
      socket.emit('game:rejoin', { playerId, gameCode }, (res) => {
        if (res.success) {
          usePlayerStore.getState().set({
            role: res.roleId ? (getRoleById(res.roleId) ?? null) : null,
            currentPhase: res.phase ?? 'setup',
            isAlive: res.isAlive ?? true,
            daySubPhase: res.daySubPhase ?? null,
            hasNominatedToday: res.hasNominatedToday ?? false,
            deadVoteUsed: res.deadVoteUsed ?? false,
          });
        }
      });
    }
  });

  socket.on('game:phase', (phase) => {
    usePlayerStore.getState().set({
      currentPhase: phase,
      nomination: null,
      nightProgress: null,
      nightFeedback: null,
      ...(phase === 'night' ? { hasNominatedToday: false } : {}),
    });
  });

  socket.on('day:subPhase', (subPhase) => {
    usePlayerStore.getState().set({ daySubPhase: subPhase });
  });

  socket.on('night:activeRole', ({ roleId, order, players }) => {
    const prev = usePlayerStore.getState().nightProgress;
    const prevRoleId = prev?.activeRoleId;
    const resetAction = prevRoleId !== roleId;
    usePlayerStore.getState().set({
      nightProgress: { activeRoleId: roleId, order, players },
      gamePlayers: players,
      ...(resetAction
        ? { nightActionSubmitted: false, nightFeedback: null }
        : {}),
    });
  });

  socket.on('game:state', (state) => {
    const players = state.players.map(({ id, name, isAlive }) => ({
      id,
      name,
      isAlive,
    }));
    usePlayerStore.getState().set({ gamePlayers: players });
  });

  socket.on('night:feedback', ({ feedback }) => {
    usePlayerStore.getState().set({ nightFeedback: feedback });
  });

  socket.on('role:assign', ({ roleId }) => {
    const role = getRoleById(roleId) ?? null;
    usePlayerStore.getState().set({ role });
  });

  socket.on('vote:start', (data) => {
    usePlayerStore.getState().set({
      nomination: data,
      currentPhase: 'vote',
      hasVoted: false,
      voteResult: null,
    });
  });

  socket.on('vote:result', (data) => {
    usePlayerStore.getState().set({ voteResult: data, nomination: null });
    setTimeout(() => {
      const current = usePlayerStore.getState();
      if (current.voteResult === data) {
        usePlayerStore.getState().set({
          voteResult: null,
          currentPhase: 'day',
          daySubPhase: 'nomination',
        });
      }
    }, 5000);
  });

  socket.on('game:playerUpdate', (player) => {
    const state = usePlayerStore.getState();
    if (player.id === state.playerId) {
      usePlayerStore.getState().set({ isAlive: player.isAlive });
    }
    const updated = state.gamePlayers.map((p) =>
      p.id === player.id ? { ...p, isAlive: player.isAlive } : p,
    );
    usePlayerStore.getState().set({ gamePlayers: updated });
  });

  socket.on('whisper:receive', (message) => {
    const { playerId } = usePlayerStore.getState();
    useWhisperStore.getState().addMessage(message, playerId);
  });
}
