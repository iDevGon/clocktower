import type {
  DaySubPhase,
  GameState,
  NightAction,
  NightFeedbackPayload,
  Phase,
  Player,
  PlayerInfo,
  WhisperMessage,
} from './types';

export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:phase': (phase: Phase) => void;
  'game:playerUpdate': (player: Player) => void;
  'day:subPhase': (subPhase: DaySubPhase) => void;
  'role:assign': (role: { roleId: string; roleName: string }) => void;
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
  'whisper:activeChats': (
    chats: Array<{
      player1Id: string;
      player1Name: string;
      player2Id: string;
      player2Name: string;
    }>,
  ) => void;
}

export interface ClientToServerEvents {
  'game:join': (
    data: { playerName: string; gameCode: string },
    callback: (res: { success: boolean; playerId?: string }) => void,
  ) => void;
  'game:rejoin': (
    data: { playerId: string; gameCode: string },
    callback: (res: {
      success: boolean;
      playerName?: string;
      roleId?: string;
      phase?: Phase;
      isAlive?: boolean;
      daySubPhase?: DaySubPhase | null;
      hasNominatedToday?: boolean;
      deadVoteUsed?: boolean;
    }) => void,
  ) => void;
  'vote:cast': (data: { guilty: boolean }) => void;
  'night:action': (data: { targets: string[] }) => void;
  'whisper:send': (data: { toId: string; message: string }) => void;
  'nominate:request': (
    data: { nomineeId: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
}

export interface StorytellerToServerEvents {
  'game:create': (
    callback: (res: { success: boolean; gameId?: string }) => void,
  ) => void;
  'game:start': (
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'game:setPhase': (phase: Phase) => void;
  'day:setSubPhase': (subPhase: DaySubPhase) => void;
  'game:assignRole': (data: { playerId: string; roleId: string }) => void;
  'game:kill': (playerId: string) => void;
  'game:revive': (playerId: string) => void;
  'vote:nominate': (data: { nominatorId: string; nomineeId: string }) => void;
  'vote:close': () => void;
  'game:reset': () => void;
  'night:setActiveRole': (roleId: string | null) => void;
  'night:sendFeedback': (data: {
    playerId: string;
    feedback: NightFeedbackPayload;
  }) => void;
  'game:distributeRoles': (
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'game:addDummyPlayers': (count: number) => void;
  'game:removeDummyPlayers': () => void;
}
