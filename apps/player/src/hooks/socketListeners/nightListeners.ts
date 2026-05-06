import { vibrateAlert } from '../../notifications';
import { usePlayerStore } from '../../stores/playerStore';
import type { AppSocket } from './types';

export function attachNightListeners(socket: AppSocket) {
  socket.on('night:activeRole', ({ roleId, order, players }) => {
    usePlayerStore.getState().set({
      nightProgress: { activeRoleId: roleId, order, players },
      gamePlayers: players,
      nightActionSubmitted: false,
      nightFeedback: null,
      // 새 역할 턴 시작 시 wakeUp 초기화 (서버가 개별 night:wakeUp으로 차례 알림)
      nightWakeUp: null,
    });
  });

  // 서버가 이 플레이어의 차례임을 알림 (모든 역할 대상)
  socket.on('night:wakeUp', ({ roleId }) => {
    const store = usePlayerStore.getState();
    usePlayerStore.getState().set({
      nightWakeUp: roleId,
      nightActionSubmitted: false,
      nightFeedback: null,
      // 승계 오버레이가 밤 행동 UI를 가리지 않도록 즉시 해제
      ...(store.rolePromotion ? { rolePromotion: null } : {}),
    });
    vibrateAlert();
  });

  socket.on('night:feedback', ({ feedback }) => {
    const { nightCount, addFeedback } = usePlayerStore.getState();
    usePlayerStore.getState().set({ nightFeedback: feedback });
    addFeedback(nightCount, feedback);
  });

  socket.on('night:deaths', ({ deaths }) => {
    usePlayerStore.getState().set({ nightDeathAnnouncement: deaths });
  });

  socket.on('day:subPhase', (subPhase) => {
    usePlayerStore.getState().set({
      daySubPhase: subPhase,
      ...(subPhase !== 'whisper' ? { whisperClock: null } : {}),
      ...(subPhase !== 'discussion' ? { discussionClock: null } : {}),
      ...(subPhase !== 'defense' ? { defenseClock: null } : {}),
    });
  });

  socket.on('discussion:clockStart', ({ durationMs }) => {
    usePlayerStore.getState().set({
      discussionClock: { startedAt: Date.now(), durationMs },
    });
  });

  socket.on('nomination:clockStart', ({ durationMs }) => {
    usePlayerStore.getState().set({
      nominationClock: { startedAt: Date.now(), durationMs },
      nominationPaused: false,
      nominationRemainingMs: null,
    });
  });

  socket.on('nomination:clockPause', () => {
    usePlayerStore.getState().set({
      nominationPaused: true,
    });
  });

  socket.on('nomination:clockResume', ({ remainingMs }) => {
    usePlayerStore.getState().set({
      nominationClock: { startedAt: Date.now(), durationMs: remainingMs },
      nominationPaused: false,
      nominationRemainingMs: remainingMs,
    });
  });

  socket.on('defense:clockStart', ({ durationMs }) => {
    usePlayerStore.getState().set({
      defenseClock: { startedAt: Date.now(), durationMs },
    });
  });
}
