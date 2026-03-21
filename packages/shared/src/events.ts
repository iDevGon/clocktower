import type {
  ActiveWhisperChat,
  DaySubPhase,
  ExecutionAnnouncement,
  ExecutionStatus,
  GameResult,
  GameSettings,
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
    executionCandidate: {
      playerId: string;
      playerName: string;
      guiltyVotes: number;
    } | null;
    executionStatus: ExecutionStatus;
    executionMessage: string;
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
  'slayer:noEffect': (data: { slayerName: string; targetName: string }) => void;
  'slayer:allAcked': () => void;
  'vote:clockPause': () => void;
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
  'whisper:activeChats': (chats: ActiveWhisperChat[]) => void;
  'whisper:clockStart': (data: { durationMs: number }) => void;
  'discussion:clockStart': (data: { durationMs: number }) => void;
  'nomination:clockStart': (data: { durationMs: number }) => void;
  'nomination:clockPause': () => void;
  'nomination:clockResume': (data: { remainingMs: number }) => void;
  'defense:clockStart': (data: { durationMs: number }) => void;
  'game:settings': (settings: GameSettings) => void;
  'vote:clockStart': (data: { durationMs: number }) => void;
  'vote:preselected': (data: {
    playerId: string;
    guilty: boolean | null;
  }) => void;
  'vote:confirmed': (data: { playerId: string; guilty: boolean }) => void;
  'vote:order': (data: {
    nomineeId: string;
    order: Array<{ id: string; name: string }>;
    fullOrder?: Array<{ id: string; name: string; isAlive: boolean }>;
  }) => void;
  'chat:receiveFromStoryteller': (message: StorytellerMessage) => void;
  'chat:receiveFromPlayer': (message: StorytellerMessage) => void;
  'vote:proceedToVote': () => void;
  /** 변론 중 투표 동의 현황 (ready인 플레이어 ID 목록) */
  'vote:consentStatus': (data: { readyPlayerIds: string[] }) => void;
  'execution:announced': (data: ExecutionAnnouncement) => void;
  'night:deaths': (data: {
    deaths: Array<{ id: string; name: string }>;
  }) => void;
  /** onlyWhenDead 역할(까마귀지기 등)이 밤에 죽었을 때 해당 플레이어에게만 전송 */
  'night:wakeUp': (data: { roleId: string }) => void;
  /** 이야기꾼이 플레이어를 강퇴했을 때 해당 플레이어에게 전송 */
  'player:kicked': () => void;
  /** 플레이어가 퇴장하거나 강퇴되었을 때 전체 플레이어에게 전송 */
  'player:left': (data: { playerId: string; playerName: string }) => void;
}

/**
 * 서버 → 이야기꾼 앱으로 전송되는 이벤트.
 * ServerToClientEvents 중 이야기꾼이 수신하는 이벤트만 포함합니다.
 */
export interface ServerToStorytellerEvents {
  'game:state': ServerToClientEvents['game:state'];
  'game:end': ServerToClientEvents['game:end'];
  'night:actionReceived': ServerToClientEvents['night:actionReceived'];
  'whisper:activeChats': ServerToClientEvents['whisper:activeChats'];
  'whisper:clockStart': ServerToClientEvents['whisper:clockStart'];
  'discussion:clockStart': ServerToClientEvents['discussion:clockStart'];
  'nomination:clockStart': ServerToClientEvents['nomination:clockStart'];
  'nomination:clockPause': ServerToClientEvents['nomination:clockPause'];
  'nomination:clockResume': ServerToClientEvents['nomination:clockResume'];
  'defense:clockStart': ServerToClientEvents['defense:clockStart'];
  'slayer:declared': ServerToClientEvents['slayer:declared'];
  'slayer:noEffect': ServerToClientEvents['slayer:noEffect'];
  'slayer:allAcked': ServerToClientEvents['slayer:allAcked'];
  'vote:clockPause': ServerToClientEvents['vote:clockPause'];
  'vote:preselected': ServerToClientEvents['vote:preselected'];
  'vote:confirmed': ServerToClientEvents['vote:confirmed'];
  'vote:clockStart': ServerToClientEvents['vote:clockStart'];
  'vote:result': ServerToClientEvents['vote:result'];
  'vote:start': ServerToClientEvents['vote:start'];
  'vote:proceedToVote': ServerToClientEvents['vote:proceedToVote'];
  'vote:consentStatus': ServerToClientEvents['vote:consentStatus'];
  'chat:receiveFromPlayer': ServerToClientEvents['chat:receiveFromPlayer'];
  'virgin:triggered': ServerToClientEvents['virgin:triggered'];
  'execution:announced': ServerToClientEvents['execution:announced'];
  'sweetheart:died': (data: { sweetheartName: string }) => void;
  'mayor:nightDeath': (data: { mayorId: string; mayorName: string }) => void;
  'night:wakeUpTargets': (data: { candidateIds: string[] }) => void;
  'game:reset': () => void;
  'player:left': ServerToClientEvents['player:left'];
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
      gamePlayers?: PlayerInfo[];
      butlerMasterName?: string;
      nomination?: {
        nominatorId: string;
        nomineeId: string;
        nominatorName: string;
        nomineeName: string;
      };
      executionCandidate?: {
        playerId: string;
        playerName: string;
        guiltyVotes: number;
      };
    }) => void,
  ) => void;
  'vote:cast': (
    callback?: (result: { success: boolean; error?: string }) => void,
  ) => void;
  'vote:preselect': (data: { guilty: boolean | null }) => void;
  'night:action': (data: { targets: string[] }) => void;
  'slayer:use': (
    data: { targetId: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'whisper:send': (data: {
    conversationId?: string;
    participantIds?: string[];
    message: string;
  }) => void;
  'nominate:request': (
    data: { nomineeId: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  'push:register': (data: { token: string }) => void;
  'chat:sendToStoryteller': (data: { message: string }) => void;
  'slayer:ack': () => void;
  /** 변론 중 투표 준비 완료 토글 */
  'vote:consentReady': (data: { ready: boolean }) => void;
  /** 플레이어가 자발적으로 게임 퇴장 */
  'player:leave': (
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
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
  'vote:proceedToVote': () => void;
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
    options: {
      excludedRoleIds?: string[];
      editionId?: string;
      additionalRoleIds?: string[];
      /** 이야기꾼이 사전 선택한 블러프 역할 ID (최대 3개, 미선택 시 랜덤) */
      bluffRoleIds?: string[];
    },
    callback: (res: {
      success: boolean;
      error?: string;
      redHerringPlayerId?: string;
    }) => void,
  ) => void;
  'game:assignRedHerring': (playerId: string) => void;
  'game:sweetheartDrunk': (playerId: string) => void;
  'game:mayorRedirect': (data: {
    mayorId: string;
    redirectTargetId: string;
  }) => void;
  'game:addDummyPlayers': (count: number) => void;
  'game:removeDummyPlayers': () => void;
  'player:setStatuses': (data: {
    playerId: string;
    statuses: PlayerStatus[];
  }) => void;
  'game:setSettings': (settings: Partial<GameSettings>) => void;
  'game:setPlayerOrder': (order: string[]) => void;
  'chat:sendToPlayer': (data: { playerId: string; message: string }) => void;
  'slayer:forceAck': () => void;
  /** 이야기꾼이 플레이어를 강퇴 */
  'player:kick': (
    playerId: string,
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
}
