import type {
  DaySubPhase,
  GameResult,
  GameState,
  NightAction,
  NightFeedbackPayload,
  Phase,
  Player,
  PlayerInfo,
  PlayerStatus,
  StorytellerMessage,
  WhisperMessage,
} from './types';

export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:phase': (phase: Phase) => void;
  'game:playerUpdate': (player: Player) => void;
  'day:subPhase': (subPhase: DaySubPhase) => void;
  'role:assign': (role: {
    roleId: string;
    roleName: string;
    drunkAs?: string;
  }) => void;
  'vote:start': (data: {
    nominatorId: string;
    nomineeId: string;
    nominatorName: string;
    nomineeName: string;
  }) => void;
  'vote:result': (data: {
    nomineeId: string;
    nomineeName: string;
    guilty: boolean;
    votes: Record<string, boolean>;
  }) => void;
  'night:activeRole': (data: {
    roleId: string | null;
    order: string[];
    players: PlayerInfo[];
  }) => void;
  'night:actionReceived': (action: NightAction) => void;
  'night:feedback': (data: { feedback: NightFeedbackPayload }) => void;
  'whisper:receive': (message: WhisperMessage) => void;
  'game:end': (result: GameResult) => void;
  'slayer:declared': (data: {
    slayerName: string;
    targetName: string;
    targetId: string;
  }) => void;
  'virgin:triggered': (data: {
    virginName: string;
    nominatorName: string;
    nominatorId: string;
  }) => void;
  'evil:info': (data: {
    /** 악마에게: 하수인 이름 목록 */
    minionNames?: string[];
    /** 하수인에게: 악마 이름 */
    demonName?: string;
    /** 하수인에게: 다른 하수인 이름 목록 */
    otherMinionNames?: string[];
    /** 악마에게: 게임에 없는 선한 역할 3개 (블러프용) */
    bluffRoles?: { id: string; name: string }[];
  }) => void;
  'whisper:activeChats': (
    chats: Array<{
      player1Id: string;
      player1Name: string;
      player2Id: string;
      player2Name: string;
    }>,
  ) => void;
  'chat:receiveFromStoryteller': (message: StorytellerMessage) => void;
  'chat:receiveFromPlayer': (message: StorytellerMessage) => void;
}

export interface ClientToServerEvents {
  'game:join': (
    data: { playerName: string },
    callback: (res: {
      success: boolean;
      playerId?: string;
      error?: string;
    }) => void,
  ) => void;
  'game:rejoin': (
    data: { playerId: string },
    callback: (res: {
      success: boolean;
      playerName?: string;
      roleId?: string;
      drunkAs?: string;
      phase?: Phase;
      isAlive?: boolean;
      daySubPhase?: DaySubPhase | null;
      hasNominatedToday?: boolean;
      deadVoteUsed?: boolean;
      nightProgress?: {
        activeRoleId: string | null;
        order: string[];
        players: PlayerInfo[];
      };
    }) => void,
  ) => void;
  'vote:cast': (data: { guilty: boolean }) => void;
  'night:action': (data: { targets: string[] }) => void;
  'slayer:use': (
    data: { targetId: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'whisper:send': (data: { toId: string; message: string }) => void;
  'nominate:request': (
    data: { nomineeId: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'push:register': (data: { token: string }) => void;
  'chat:sendToStoryteller': (data: { message: string }) => void;
}

export interface StorytellerToServerEvents {
  'game:create': (callback: (res: { success: boolean }) => void) => void;
  'game:start': (
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'game:setPhase': (phase: Phase) => void;
  'day:setSubPhase': (subPhase: DaySubPhase) => void;
  'game:assignRole': (data: {
    playerId: string;
    roleId: string;
    drunkAs?: string;
  }) => void;
  'game:kill': (playerId: string) => void;
  'game:revive': (playerId: string) => void;
  'vote:nominate': (data: { nominatorId: string; nomineeId: string }) => void;
  'vote:castForPlayer': (data: { playerId: string; guilty: boolean }) => void;
  'vote:close': () => void;
  'game:reset': () => void;
  'game:restart': (
    callback: (res: { success: boolean; gameId?: string }) => void,
  ) => void;
  'night:setActiveRole': (roleId: string | null) => void;
  'night:sendFeedback': (data: {
    playerId: string;
    feedback: NightFeedbackPayload;
  }) => void;
  'game:distributeRoles': (
    options: { excludedRoleIds?: string[]; editionId?: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'game:addDummyPlayers': (count: number) => void;
  'game:removeDummyPlayers': () => void;
  'player:setStatuses': (data: {
    playerId: string;
    statuses: PlayerStatus[];
  }) => void;
  'chat:sendToPlayer': (data: { playerId: string; message: string }) => void;
}
