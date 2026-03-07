import { useCallback } from 'react';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';

export function useGameActions() {
  const castVote = useCallback((guilty: boolean) => {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('vote:cast', { guilty });
      usePlayerStore.getState().set({ hasVoted: true });
    }
  }, []);

  const submitNightAction = useCallback((targets: string[]) => {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('night:action', { targets });
      usePlayerStore.getState().set({ nightActionSubmitted: true });
    }
  }, []);

  const sendWhisper = useCallback((toId: string, message: string) => {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('whisper:send', { toId, message });
    }
  }, []);

  const nominatePlayer = useCallback(
    (nomineeId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }

        socket.emit('nominate:request', { nomineeId }, (res) => {
          if (res.success) {
            usePlayerStore.getState().set({ hasNominatedToday: true });
          }
          resolve(res);
        });
      });
    },
    [],
  );

  return { castVote, submitNightAction, sendWhisper, nominatePlayer };
}
