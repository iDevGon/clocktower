import type {
  DaySubPhase,
  GameSettings,
  NightFeedbackPayload,
  Phase,
  PlayerStatus,
} from '@clocktower/shared';
import { useCallback } from 'react';
import { useConnectionStore } from '../stores/connectionStore';

function getSocket() {
  return useConnectionStore.getState().socket;
}

export function useGameActions() {
  const socket = useConnectionStore((s) => s.socket);

  const createGame = useCallback(
    () =>
      new Promise<void>((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('game:create', (res: { success: boolean }) => {
          if (res.success) resolve();
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
    (options?: {
      excludedRoleIds?: string[];
      editionId?: string;
      additionalRoleIds?: string[];
      bluffRoleIds?: string[];
    }) =>
      new Promise<{ redHerringPlayerId?: string }>((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit(
          'game:distributeRoles',
          options ?? {},
          (res: {
            success: boolean;
            error?: string;
            redHerringPlayerId?: string;
          }) => {
            if (res.success)
              resolve({ redHerringPlayerId: res.redHerringPlayerId });
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
    (
      playerId: string,
      roleId: string,
      drunkAs?: string,
      bluffRoleIds?: string[],
    ) =>
      socket?.emit('game:assignRole', {
        playerId,
        roleId,
        drunkAs,
        bluffRoleIds,
      }),
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

  const castVoteForPlayer = useCallback(
    (playerId: string, guilty: boolean) =>
      socket?.emit('vote:castForPlayer', { playerId, guilty }),
    [socket],
  );

  const closeVote = useCallback(() => socket?.emit('vote:close'), [socket]);

  const proceedToVote = useCallback(
    () => socket?.emit('vote:proceedToVote'),
    [socket],
  );

  const resetGame = useCallback(() => socket?.emit('game:reset'), [socket]);

  const unassignAllRoles = useCallback(
    () => socket?.emit('game:unassignAllRoles'),
    [socket],
  );

  const restartGame = useCallback(
    () =>
      new Promise<string>((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('game:restart', (res: { success: boolean; gameId?: string }) => {
          if (res.success && res.gameId) resolve(res.gameId);
          else reject(new Error('게임 재시작 실패'));
        });
      }),
    [],
  );

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

  const setPlayerStatuses = useCallback(
    (playerId: string, statuses: PlayerStatus[]) =>
      socket?.emit('player:setStatuses', { playerId, statuses }),
    [socket],
  );

  const setGameSettings = useCallback(
    (settings: Partial<GameSettings>) =>
      socket?.emit('game:setSettings', settings),
    [socket],
  );

  const setPlayerOrder = useCallback(
    (order: string[]) => socket?.emit('game:setPlayerOrder', order),
    [socket],
  );

  const assignRedHerring = useCallback(
    (playerId: string) => socket?.emit('game:assignRedHerring', playerId),
    [socket],
  );

  const sweetheartDrunk = useCallback(
    (playerId: string) => socket?.emit('game:sweetheartDrunk', playerId),
    [socket],
  );

  const mayorRedirect = useCallback(
    (mayorId: string, redirectTargetId: string) =>
      socket?.emit('game:mayorRedirect', { mayorId, redirectTargetId }),
    [socket],
  );

  const sendChatToPlayer = useCallback(
    (playerId: string, message: string) =>
      socket?.emit('chat:sendToPlayer', { playerId, message }),
    [socket],
  );

  const kickPlayer = useCallback(
    (playerId: string): Promise<{ success: boolean; error?: string }> =>
      new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('player:kick', playerId, (res) => {
          if (res.success) resolve(res);
          else reject(new Error(res.error ?? '플레이어 강퇴 실패'));
        });
      }),
    [],
  );

  const addTraveller = useCallback(
    (
      playerId: string,
      roleId: string,
      alignment: 'good' | 'evil',
    ): Promise<{ success: boolean; error?: string }> =>
      new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('traveller:add', { playerId, roleId, alignment }, (res) => {
          if (res.success) resolve(res);
          else reject(new Error(res.error ?? '여행자 역할 배정 실패'));
        });
      }),
    [],
  );

  const exileTraveller = useCallback(
    (playerId: string): Promise<{ success: boolean; error?: string }> =>
      new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('traveller:exile', playerId, (res) => {
          if (res.success) resolve(res);
          else reject(new Error(res.error ?? '여행자 추방 실패'));
        });
      }),
    [],
  );

  const forceCloseExile = useCallback(
    (exiled: boolean) => socket?.emit('exile:forceClose', { exiled }),
    [socket],
  );

  const approveTraveller = useCallback(
    (socketId: string, playerName: string) =>
      socket?.emit('traveller:approve', { socketId, playerName }),
    [socket],
  );

  const rejectTraveller = useCallback(
    (socketId: string) => socket?.emit('traveller:reject', { socketId }),
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
    castVoteForPlayer,
    closeVote,
    proceedToVote,
    resetGame,
    restartGame,
    sendNightFeedback,
    setActiveNightRole,
    addDummyPlayers,
    removeDummyPlayers,
    setPlayerStatuses,
    setGameSettings,
    setPlayerOrder,
    assignRedHerring,
    sweetheartDrunk,
    mayorRedirect,
    sendChatToPlayer,
    kickPlayer,
    addTraveller,
    exileTraveller,
    forceCloseExile,
    unassignAllRoles,
    approveTraveller,
    rejectTraveller,
  };
}
