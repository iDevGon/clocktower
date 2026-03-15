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
    });

    const { role: myRole, drunkAs, isAlive } = usePlayerStore.getState();
    if (
      isAlive &&
      roleId &&
      myRole &&
      (myRole.id === roleId || drunkAs === roleId)
    ) {
      vibrateAlert();
    }
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
    });
  });
}
