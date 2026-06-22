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
  type BmrAssistCallback = (res: { success: boolean; error?: string }) => void;

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
      godfatherOutsiderModifier?: -1 | 1;
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
    (nominatorId: string, nomineeId: string, callback?: BmrAssistCallback) =>
      socket?.emit('vote:nominate', { nominatorId, nomineeId }, callback),
    [socket],
  );

  const castVoteForPlayer = useCallback(
    (playerId: string, guilty: boolean, callback?: BmrAssistCallback) =>
      socket?.emit('vote:castForPlayer', { playerId, guilty }, callback),
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
    (
      playerId: string,
      feedback: NightFeedbackPayload,
      callback?: BmrAssistCallback,
    ) => socket?.emit('night:sendFeedback', { playerId, feedback }, callback),
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
    (playerId: string, callback?: BmrAssistCallback) =>
      socket?.emit('game:sweetheartDrunk', playerId, callback),
    [socket],
  );

  const sweetheartSkipDrunk = useCallback(
    (callback?: BmrAssistCallback) =>
      socket?.emit('game:sweetheartSkipDrunk', callback),
    [socket],
  );

  const mayorRedirect = useCallback(
    (mayorId: string, redirectTargetId: string, callback?: BmrAssistCallback) =>
      socket?.emit(
        'game:mayorRedirect',
        { mayorId, redirectTargetId },
        callback,
      ),
    [socket],
  );

  const mayorSkipRedirect = useCallback(
    (mayorId: string, callback?: BmrAssistCallback) =>
      socket?.emit('game:mayorSkipRedirect', { mayorId }, callback),
    [socket],
  );

  const scapegoatSwap = useCallback(
    (scapegoatId: string, callback?: BmrAssistCallback) =>
      socket?.emit('scapegoat:swap', { scapegoatId }, callback),
    [socket],
  );

  const confirmWitchCurseDeath = useCallback(
    (nominatorId: string, kill: boolean, callback?: BmrAssistCallback) =>
      socket?.emit('witch:confirmCurseDeath', { nominatorId, kill }, callback),
    [socket],
  );

  const barberSwapRoles = useCallback(
    (playerId1: string, playerId2: string, callback?: BmrAssistCallback) =>
      socket?.emit('barber:swapRoles', { playerId1, playerId2 }, callback),
    [socket],
  );

  const barberSkipSwap = useCallback(
    (callback?: BmrAssistCallback) => socket?.emit('barber:skipSwap', callback),
    [socket],
  );

  const klutzChoose = useCallback(
    (klutzId: string, chosenPlayerId: string, callback?: BmrAssistCallback) =>
      socket?.emit('klutz:choose', { klutzId, chosenPlayerId }, callback),
    [socket],
  );

  const fangGuConfirmJump = useCallback(
    (oldDemonId: string, newDemonId: string, callback?: BmrAssistCallback) =>
      socket?.emit('fangGu:confirmJump', { oldDemonId, newDemonId }, callback),
    [socket],
  );

  const snakeCharmerSwap = useCallback(
    (snakeCharmerId: string, demonId: string, callback?: BmrAssistCallback) =>
      socket?.emit('snakeCharmer:swap', { snakeCharmerId, demonId }, callback),
    [socket],
  );

  const vigormortisKillMinion = useCallback(
    (
      vigormortisId: string,
      minionId: string,
      poisonedNeighborId: string,
      callback?: BmrAssistCallback,
    ) =>
      socket?.emit(
        'vigormortis:killMinion',
        {
          vigormortisId,
          minionId,
          poisonedNeighborId,
        },
        callback,
      ),
    [socket],
  );

  const pitHagChangeRole = useCallback(
    (
      pitHagId: string,
      targetPlayerId: string,
      newRoleId: string,
      callback?: BmrAssistCallback,
    ) =>
      socket?.emit(
        'pitHag:changeRole',
        {
          pitHagId,
          targetPlayerId,
          newRoleId,
        },
        callback,
      ),
    [socket],
  );

  const assignGoodTwin = useCallback(
    (
      evilTwinPlayerId: string,
      goodTwinPlayerId: string,
      callback?: BmrAssistCallback,
    ) =>
      socket?.emit(
        'evilTwin:assignGoodTwin',
        {
          evilTwinPlayerId,
          goodTwinPlayerId,
        },
        callback,
      ),
    [socket],
  );

  const boneCollectorRestore = useCallback(
    (
      boneCollectorId: string,
      targetPlayerId: string,
      callback?: BmrAssistCallback,
    ) =>
      socket?.emit(
        'boneCollector:restore',
        {
          boneCollectorId,
          targetPlayerId,
        },
        callback,
      ),
    [socket],
  );

  const applyBaristaEffect = useCallback(
    (
      targetPlayerId: string,
      effect: 'sober_healthy' | 'acts_twice',
      callback?: BmrAssistCallback,
    ) => socket?.emit('barista:apply', { targetPlayerId, effect }, callback),
    [socket],
  );

  const courtierChooseRole = useCallback(
    (courtierId: string, roleId: string, callback?: BmrAssistCallback) =>
      socket?.emit('courtier:chooseRole', { courtierId, roleId }, callback),
    [socket],
  );

  const gamblerGuess = useCallback(
    (
      gamblerId: string,
      targetPlayerId: string,
      guessedRoleId: string,
      callback?: BmrAssistCallback,
    ) =>
      socket?.emit(
        'gambler:guess',
        {
          gamblerId,
          targetPlayerId,
          guessedRoleId,
        },
        callback,
      ),
    [socket],
  );

  const gossipKill = useCallback(
    (gossipId: string, targetPlayerId: string, callback?: BmrAssistCallback) =>
      socket?.emit('gossip:kill', { gossipId, targetPlayerId }, callback),
    [socket],
  );

  const shabalothRegurgitate = useCallback(
    (
      shabalothId: string,
      targetPlayerId: string,
      callback?: BmrAssistCallback,
    ) =>
      socket?.emit(
        'shabaloth:regurgitate',
        { shabalothId, targetPlayerId },
        callback,
      ),
    [socket],
  );

  const moonchildChoose = useCallback(
    (
      moonchildId: string,
      targetPlayerId: string,
      optionsOrCallback?: { deferToNight?: boolean } | BmrAssistCallback,
      callback?: BmrAssistCallback,
    ) => {
      const options =
        typeof optionsOrCallback === 'function' ? undefined : optionsOrCallback;
      const cb =
        typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
      socket?.emit(
        'moonchild:choose',
        { moonchildId, targetPlayerId, ...options },
        cb,
      );
    },
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
    (exiled: boolean, callback?: BmrAssistCallback) =>
      socket?.emit('exile:forceClose', { exiled }, callback),
    [socket],
  );

  const approveTraveller = useCallback(
    (
      socketId: string,
      playerName: string,
    ): Promise<{ success: boolean; error?: string; playerId?: string }> =>
      new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('traveller:approve', { socketId, playerName }, (res) => {
          if (res.success) resolve(res);
          else reject(new Error(res.error ?? '여행자 승인 실패'));
        });
      }),
    [],
  );

  const rejectTraveller = useCallback(
    (socketId: string): Promise<{ success: boolean; error?: string }> =>
      new Promise((resolve, reject) => {
        const s = getSocket();
        if (!s) return reject(new Error('Not connected'));
        s.emit('traveller:reject', { socketId }, (res) => {
          if (res.success) resolve(res);
          else reject(new Error(res.error ?? '여행자 거절 실패'));
        });
      }),
    [],
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
    sweetheartSkipDrunk,
    mayorRedirect,
    mayorSkipRedirect,
    scapegoatSwap,
    confirmWitchCurseDeath,
    barberSwapRoles,
    barberSkipSwap,
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
    shabalothRegurgitate,
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
