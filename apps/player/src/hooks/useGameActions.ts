import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import { getOptimisticConsentReadyIds } from './voteConsentOptimistic';

export function useGameActions() {
  const castVote = useCallback(() => {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('vote:cast', (result) => {
        if (result?.success) {
          usePlayerStore.getState().set({ hasVoted: true });
        }
      });
    }
  }, []);

  const preselectVote = useCallback((guilty: boolean | null) => {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('vote:preselect', { guilty });
    }
  }, []);

  const submitNightAction = useCallback((targets: string[]) => {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('night:action', { targets }, (result) => {
        if (!result?.success) {
          Alert.alert(
            '밤 행동 실패',
            result?.error ?? '밤 행동을 제출할 수 없습니다',
          );
          return;
        }

        const store = usePlayerStore.getState();
        const roleId = store.role?.id;
        if (roleId === 'butler' && targets.length > 0) {
          const master = store.gamePlayers.find((p) => p.id === targets[0]);
          store.set({
            nightActionSubmitted: true,
            butlerMasterName: master?.name ?? null,
          });
          return;
        }
        store.set({ nightActionSubmitted: true });
      });
    }
  }, []);

  const sendWhisper = useCallback(
    (params: {
      conversationId?: string;
      participantIds?: string[];
      message: string;
    }) => {
      const socket = useConnectionStore.getState().socket;
      if (socket) {
        socket.emit('whisper:send', params);
      }
    },
    [],
  );

  const sendChatToStoryteller = useCallback((message: string) => {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      socket.emit('chat:sendToStoryteller', { message });
    }
  }, []);

  const useSlayer = useCallback(
    (targetId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }

        socket.emit('slayer:use', { targetId }, (res) => {
          if (res.success) {
            usePlayerStore.getState().set({ slayerUsed: true });
          }
          resolve(res);
        });
      });
    },
    [],
  );

  const useSavant = useCallback((): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      const socket = useConnectionStore.getState().socket;
      if (!socket || !socket.connected) {
        resolve({ success: false, error: '연결되어 있지 않습니다' });
        return;
      }
      socket.emit('savant:use', (res) => {
        if (res.success) {
          usePlayerStore.getState().set({ savantUsedToday: true });
        }
        resolve(res);
      });
    });
  }, []);

  const declareJuggler = useCallback(
    (
      guesses: Array<{ playerId: string; roleId: string }>,
    ): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }
        socket.emit('juggler:declare', { guesses }, (res) => {
          if (res.success) {
            usePlayerStore.getState().set({ jugglerUsed: true });
          }
          resolve(res);
        });
      });
    },
    [],
  );

  const declareGossip = useCallback(
    (statement: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }
        socket.emit('gossip:declare', { statement }, (res) => {
          if (res.success) {
            usePlayerStore.getState().set({ gossipUsedToday: true });
          }
          resolve(res);
        });
      });
    },
    [],
  );

  const chooseMoonchildTarget = useCallback(
    (targetPlayerId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }
        socket.emit('moonchild:choose', { targetPlayerId }, (res) => {
          if (res.success) {
            usePlayerStore.getState().set({ moonchildUsed: true });
          }
          resolve(res);
        });
      });
    },
    [],
  );

  const choosePhilosopherRole = useCallback(
    (roleId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }
        socket.emit('philosopher:choose', { roleId }, (res) => {
          resolve(res);
        });
      });
    },
    [],
  );

  const useGunslinger = useCallback(
    (targetId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }
        socket.emit('gunslinger:use', { targetId }, (res) => {
          if (res.success) {
            usePlayerStore.getState().set({ gunslingerUsedToday: true });
          }
          resolve(res);
        });
      });
    },
    [],
  );

  const giveBeggarToken = useCallback(
    (beggarId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }
        socket.emit('beggar:giveToken', { beggarId }, (res) => resolve(res));
      });
    },
    [],
  );

  const useArtist = useCallback((): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      const socket = useConnectionStore.getState().socket;
      if (!socket || !socket.connected) {
        resolve({ success: false, error: '연결되어 있지 않습니다' });
        return;
      }
      socket.emit('artist:use', (res) => {
        if (res.success) {
          usePlayerStore.getState().set({ artistUsed: true });
        }
        resolve(res);
      });
    });
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

  const consentReady = useCallback((ready: boolean) => {
    const socket = useConnectionStore.getState().socket;
    if (socket) {
      const state = usePlayerStore.getState();
      state.set({
        voteConsentReadyIds: getOptimisticConsentReadyIds(
          state.voteConsentReadyIds,
          state.playerId,
          ready,
        ),
      });
      socket.emit('vote:consentReady', { ready });
    }
  }, []);

  const proposeExile = useCallback(
    (targetId: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }
        socket.emit('exile:propose', { targetId }, (res) => resolve(res));
      });
    },
    [],
  );

  const castExileVote = useCallback(
    (guilty: boolean): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '연결되어 있지 않습니다' });
          return;
        }
        socket.emit('exile:vote', { guilty }, (res) => resolve(res));
      });
    },
    [],
  );

  const respondHarlotConsent = useCallback(
    (harlotId: string, accepted: boolean) => {
      const socket = useConnectionStore.getState().socket;
      if (socket) {
        socket.emit('harlot:respond', { harlotId, accepted });
        usePlayerStore.getState().set({ harlotConsentRequest: null });
      }
    },
    [],
  );

  const leaveGame = useCallback((): Promise<{
    success: boolean;
    error?: string;
  }> => {
    return new Promise((resolve) => {
      const socket = useConnectionStore.getState().socket;
      if (!socket || !socket.connected) {
        resolve({ success: false, error: '연결되어 있지 않습니다' });
        return;
      }
      socket.emit('player:leave', (res) => {
        resolve(res);
      });
    });
  }, []);

  return {
    castVote,
    preselectVote,
    submitNightAction,
    sendWhisper,
    sendChatToStoryteller,
    nominatePlayer,
    useSlayer,
    useSavant,
    useArtist,
    choosePhilosopherRole,
    declareJuggler,
    declareGossip,
    chooseMoonchildTarget,
    useGunslinger,
    giveBeggarToken,
    consentReady,
    proposeExile,
    castExileVote,
    respondHarlotConsent,
    leaveGame,
  };
}
