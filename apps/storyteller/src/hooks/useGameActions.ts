import type { DaySubPhase, NightFeedbackPayload, Phase } from '@clocktower/shared';
import { useCallback } from 'react';
import { useConnectionStore } from '../stores/connectionStore';

function getSocket() {
  return useConnectionStore.getState().socket;
}

export function useGameActions() {
  const socket = useConnectionStore((s) => s.socket);

  const createGame = useCallback(
    () =>
      new Promise<string>((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('game:create', (res: { success: boolean; gameId?: string }) => {
          if (res.success && res.gameId) resolve(res.gameId);
          else reject(new Error('Failed to create game'));
        });
      }),
    [],
  );

  const startGame = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('game:start', (res: { success: boolean; error?: string }) => {
          if (res.success) resolve();
          else reject(new Error(res.error ?? '게임 시작 실패'));
        });
      }),
    [],
  );

  const distributeRoles = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit(
          'game:distributeRoles',
          (res: { success: boolean; error?: string }) => {
            if (res.success) resolve();
            else reject(new Error(res.error ?? '직업 배분 실패'));
          },
        );
      }),
    [],
  );

  const setPhase = useCallback(
    (phase: Phase) => socket?.emit('game:setPhase', phase),
    [socket],
  );

  const setDaySubPhase = useCallback(
    (subPhase: DaySubPhase) => socket?.emit('day:setSubPhase', subPhase),
    [socket],
  );

  const assignRole = useCallback(
    (playerId: string, roleId: string) =>
      socket?.emit('game:assignRole', { playerId, roleId }),
    [socket],
  );

  const kill = useCallback(
    (playerId: string) => socket?.emit('game:kill', playerId),
    [socket],
  );

  const revive = useCallback(
    (playerId: string) => socket?.emit('game:revive', playerId),
    [socket],
  );

  const nominate = useCallback(
    (nominatorId: string, nomineeId: string) =>
      socket?.emit('vote:nominate', { nominatorId, nomineeId }),
    [socket],
  );

  const closeVote = useCallback(() => socket?.emit('vote:close'), [socket]);

  const resetGame = useCallback(() => socket?.emit('game:reset'), [socket]);

  const sendNightFeedback = useCallback(
    (playerId: string, feedback: NightFeedbackPayload) =>
      socket?.emit('night:sendFeedback', { playerId, feedback }),
    [socket],
  );

  const setActiveNightRole = useCallback(
    (roleId: string | null) => socket?.emit('night:setActiveRole', roleId),
    [socket],
  );

  const addDummyPlayers = useCallback(
    (count: number) => socket?.emit('game:addDummyPlayers', count),
    [socket],
  );

  const removeDummyPlayers = useCallback(
    () => socket?.emit('game:removeDummyPlayers'),
    [socket],
  );

  return {
    createGame,
    startGame,
    distributeRoles,
    setPhase,
    setDaySubPhase,
    assignRole,
    kill,
    revive,
    nominate,
    closeVote,
    resetGame,
    sendNightFeedback,
    setActiveNightRole,
    addDummyPlayers,
    removeDummyPlayers,
  };
}
