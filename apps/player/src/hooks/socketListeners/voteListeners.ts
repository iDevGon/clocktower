import { vibrateAlert } from '../../notifications';
import { usePlayerStore } from '../../stores/playerStore';
import type { AppSocket } from './types';

export function attachVoteListeners(socket: AppSocket) {
  socket.on('vote:start', (data) => {
    const prev = usePlayerStore.getState();
    usePlayerStore.getState().set({
      nomination: data,
      daySubPhase: 'defense',
      hasVoted: false,
      voteResult: null,
      votePreselections: {},
      voteClock: null,
      voteCountdown: null,
      voteConsentReadyIds: [],
      nominatedTodayIds: prev.nominatedTodayIds.includes(data.nomineeId)
        ? prev.nominatedTodayIds
        : [...prev.nominatedTodayIds, data.nomineeId],
    });
    vibrateAlert();
  });

  socket.on('vote:proceedToVote', () => {
    usePlayerStore.getState().set({
      currentPhase: 'vote',
      daySubPhase: null,
      voteCountdown: { startedAt: Date.now(), durationMs: 5000 },
    });
  });

  socket.on('vote:result', (data) => {
    // 처형 예정자 추적: 서버에서 보내는 executionCandidate를 그대로 사용
    // 동률 시 null이 전달되므로 기존 값 유지하지 않음
    usePlayerStore.getState().set({
      voteResult: data,
      nomination: null,
      voteOrder: null,
      voteClock: null,
      voteCountdown: null,
      votePreselections: {},
      executionCandidate: data.executionCandidate ?? null,
    });
    // 5초 후 phase만 day로 전환 (voteResult는 유지)
    setTimeout(() => {
      const current = usePlayerStore.getState();
      if (current.voteResult === data && current.currentPhase === 'vote') {
        usePlayerStore.getState().set({
          currentPhase: 'day',
          daySubPhase: 'nomination',
        });
      }
    }, 5000);
  });

  socket.on('vote:order', (data) => {
    usePlayerStore.getState().set({ voteOrder: data });
  });

  socket.on('vote:clockStart', ({ durationMs }) => {
    usePlayerStore.getState().set({
      voteClock: { startedAt: Date.now(), durationMs },
      voteCountdown: null,
    });
  });

  socket.on('vote:clockPause', () => {
    usePlayerStore.getState().set({ voteClock: null });
  });

  socket.on('vote:preselected', ({ playerId, guilty }) => {
    const prev = usePlayerStore.getState().votePreselections;
    usePlayerStore.getState().set({
      votePreselections: { ...prev, [playerId]: guilty },
    });
  });

  socket.on('vote:confirmed', ({ playerId, guilty }) => {
    const prev = usePlayerStore.getState().votePreselections;
    usePlayerStore.getState().set({
      votePreselections: { ...prev, [playerId]: guilty },
    });
  });

  socket.on('vote:consentStatus', ({ readyPlayerIds }) => {
    usePlayerStore.getState().set({ voteConsentReadyIds: readyPlayerIds });
  });

  socket.on('execution:announced', (data) => {
    const state = usePlayerStore.getState();
    if (data.executedId === state.playerId) {
      // 본인이 처형당한 경우: deathReason만 설정 (사망 오버레이에 반영)
      usePlayerStore
        .getState()
        .set({ deathReason: data.reason, executionHappenedToday: true });
      return;
    }
    // 다른 플레이어가 처형된 경우: 처형 알림 오버레이 표시
    usePlayerStore
      .getState()
      .set({ executionAnnouncement: data, executionHappenedToday: true });
  });
}
