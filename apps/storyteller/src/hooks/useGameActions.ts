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
    (phase: Phase, options?: { skipExecution?: boolean }) =>
      socket?.emit('game:setPhase', phase, options),
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

  const scapegoatSwap = useCallback(
    (scapegoatId: string) => socket?.emit('scapegoat:swap', { scapegoatId }),
    [socket],
  );

  const confirmWitchCurseDeath = useCallback(
    (nominatorId: string, kill: boolean) =>
      socket?.emit('witch:confirmCurseDeath', { nominatorId, kill }),
    [socket],
  );

  const barberSwapRoles = useCallback(
    (playerId1: string, playerId2: string) =>
      socket?.emit('barber:swapRoles', { playerId1, playerId2 }),
    [socket],
  );

  const klutzChoose = useCallback(
    (klutzId: string, chosenPlayerId: string) =>
      socket?.emit('klutz:choose', { klutzId, chosenPlayerId }),
    [socket],
  );

  const fangGuConfirmJump = useCallback(
    (oldDemonId: string, newDemonId: string) =>
      socket?.emit('fangGu:confirmJump', { oldDemonId, newDemonId }),
    [socket],
  );

  const snakeCharmerSwap = useCallback(
    (snakeCharmerId: string, demonId: string) =>
      socket?.emit('snakeCharmer:swap', { snakeCharmerId, demonId }),
    [socket],
  );

  const vigormortisKillMinion = useCallback(
    (vigormortisId: string, minionId: string, poisonedNeighborId: string) =>
      socket?.emit('vigormortis:killMinion', {
        vigormortisId,
        minionId,
        poisonedNeighborId,
      }),
    [socket],
  );

  const pitHagChangeRole = useCallback(
    (pitHagId: string, targetPlayerId: string, newRoleId: string) =>
      socket?.emit('pitHag:changeRole', {
        pitHagId,
        targetPlayerId,
        newRoleId,
      }),
    [socket],
  );

  const assignGoodTwin = useCallback(
    (evilTwinPlayerId: string, goodTwinPlayerId: string) =>
      socket?.emit('evilTwin:assignGoodTwin', {
        evilTwinPlayerId,
        goodTwinPlayerId,
      }),
    [socket],
  );

  const boneCollectorRestore = useCallback(
    (boneCollectorId: string, targetPlayerId: string) =>
      socket?.emit('boneCollector:restore', {
        boneCollectorId,
        targetPlayerId,
      }),
    [socket],
  );

  const applyBaristaEffect = useCallback(
    (targetPlayerId: string, effect: 'sober_healthy' | 'acts_twice') =>
      socket?.emit('barista:apply', { targetPlayerId, effect }),
    [socket],
  );

  const courtierChooseRole = useCallback(
    (courtierId: string, roleId: string) =>
      socket?.emit('courtier:chooseRole', { courtierId, roleId }),
    [socket],
  );

  const gamblerGuess = useCallback(
    (gamblerId: string, targetPlayerId: string, guessedRoleId: string) =>
      socket?.emit('gambler:guess', {
        gamblerId,
        targetPlayerId,
        guessedRoleId,
      }),
    [socket],
  );

  const gossipKill = useCallback(
    (gossipId: string, targetPlayerId: string) =>
      socket?.emit('gossip:kill', { gossipId, targetPlayerId }),
    [socket],
  );

  const moonchildChoose = useCallback(
    (moonchildId: string, targetPlayerId: string) =>
      socket?.emit('moonchild:choose', { moonchildId, targetPlayerId }),
    [socket],
  );

  const checkPacifistSave = useCallback(
    (
      targetPlayerId: string,
      callback: (
        res:
          | { canSave: true; pacifistId: string; targetId: string }
          | { canSave: false },
      ) => void,
    ) => socket?.emit('pacifist:checkSave', { targetPlayerId }, callback),
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
    scapegoatSwap,
    confirmWitchCurseDeath,
    barberSwapRoles,
    klutzChoose,
    fangGuConfirmJump,
    snakeCharmerSwap,
    vigormortisKillMinion,
    pitHagChangeRole,
    assignGoodTwin,
    boneCollectorRestore,
    applyBaristaEffect,
    courtierChooseRole,
    gamblerGuess,
    gossipKill,
    moonchildChoose,
    checkPacifistSave,
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
