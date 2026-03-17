import { NIGHT_ACTIONS } from '@clocktower/shared';
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
    const effectiveRoleId = drunkAs ?? myRole?.id;
    const isOnlyWhenDead =
      effectiveRoleId != null &&
      NIGHT_ACTIONS[effectiveRoleId]?.onlyWhenDead === true;

    // onlyWhenDead 역할은 night:wakeUp 이벤트로 별도 처리
    if (
      !isOnlyWhenDead &&
      isAlive &&
      roleId &&
      myRole &&
      (myRole.id === roleId || drunkAs === roleId)
    ) {
      vibrateAlert();
    }
  });

  // onlyWhenDead 역할(까마귀지기 등)이 밤에 죽었을 때 서버에서 전송
  socket.on('night:wakeUp', ({ roleId }) => {
    usePlayerStore.getState().set({ nightWakeUp: roleId });
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
    });
  });
}
