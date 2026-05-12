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

export interface EvilInfoPayload {
  /** 악마에게: 하수인 이름 목록 */
  minionNames?: string[];
  /** 하수인/악한 여행자에게: 악마 이름 */
  demonName?: string;
  /** 하수인에게: 다른 하수인 이름 목록 */
  otherMinionNames?: string[];
  /** 악마에게: 게임에 없는 선한 역할 3개 (블러프용) */
  bluffRoles?: { id: string; name: string }[];
}

export type DeliveredFeedbackSource = 'manual' | 'auto';

export interface DeliveredNightFeedback {
  playerId: string;
  playerName: string;
  roleId: string | null;
  roleName: string;
  day: number;
  timestamp: number;
  feedback: NightFeedbackPayload;
  source: DeliveredFeedbackSource;
}

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
  /** 마녀 저주로 플레이어가 사망 */
  'witch:curseDeath': (data: {
    nominatorId: string;
    nominatorName: string;
  }) => void;
  'evil:info': (data: EvilInfoPayload) => void;
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
  /** 곡예사가 공개적으로 추측을 선언함. 모든 플레이어에게 오버레이로 표시 */
  'juggler:announced': (data: {
    jugglerId: string;
    jugglerName: string;
    guesses: Array<{
      playerId: string;
      playerName: string;
      roleId: string;
      roleName: string;
    }>;
  }) => void;
  /** 총잡이가 사살 선언. 모든 플레이어에게 오버레이로 표시 */
  'gunslinger:fired': (data: {
    gunslingerId: string;
    gunslingerName: string;
    targetId: string;
    targetName: string;
    targetRoleName: string;
    killed?: boolean;
  }) => void;
  /** 희생양 교체 완료: 처형 예정자가 희생양으로 교체됨 */
  'scapegoat:swapped': (data: {
    originalId: string;
    originalName: string;
    scapegoatId: string;
    scapegoatName: string;
    guiltyVotes: number;
  }) => void;
  /** 거지가 토큰을 받음 (본인에게만 송신) */
  'beggar:tokenReceived': (data: {
    giverId: string;
    giverName: string;
    giverAlignment: 'good' | 'evil';
    tokenCount: number;
  }) => void;
  /** 여행자가 게임에 참가했을 때 전체 플레이어에게 전송 */
  'traveller:joined': (data: {
    playerId: string;
    playerName: string;
    roleId: string;
    roleName: string;
  }) => void;
  /** 이야기꾼이 여행자 참가를 승인했을 때 해당 플레이어에게 전송 */
  'traveller:approved': (data: { playerId: string }) => void;
  /** 이야기꾼이 여행자 참가를 거절했을 때 해당 플레이어에게 전송 */
  'traveller:rejected': (data: { error: string }) => void;
  /** 여행자가 추방(exile)되었을 때 전체 플레이어에게 전송 */
  'traveller:exiled': (data: {
    playerId: string;
    playerName: string;
    roleName: string;
  }) => void;
  /** 추방 투표 시작 */
  'exile:start': (data: {
    proposerId: string;
    proposerName: string;
    targetId: string;
    targetName: string;
    targetRoleName: string;
    totalPlayers: number;
  }) => void;
  /** 추방 투표 현황 업데이트 */
  'exile:voteUpdate': (data: {
    votes: Record<string, boolean>;
    guiltyCount: number;
    innocentCount: number;
    totalPlayers: number;
  }) => void;
  /** 추방 투표 결과 */
  'exile:result': (data: {
    targetId: string;
    targetName: string;
    targetRoleName: string;
    exiled: boolean;
    guiltyCount: number;
    totalPlayers: number;
  }) => void;
  /** 탕녀가 방문한 대상에게 동의를 요청 */
  'harlot:consentRequested': (data: {
    harlotId: string;
    harlotName: string;
  }) => void;
  /** 탕녀 방문 동의 결과 */
  'harlot:consentResult': (data: {
    harlotId: string;
    harlotName: string;
    targetId: string;
    targetName: string;
    accepted: boolean;
    targetRoleName?: string;
    needsFalseInfo?: boolean;
  }) => void;
}

/**
 * 서버 → 이야기꾼 앱으로 전송되는 이벤트.
 * ServerToClientEvents 중 이야기꾼이 수신하는 이벤트만 포함합니다.
 */
export interface ServerToStorytellerEvents {
  'game:state': ServerToClientEvents['game:state'];
  'game:end': ServerToClientEvents['game:end'];
  'night:actionReceived': ServerToClientEvents['night:actionReceived'];
  'night:feedbackSent': (data: DeliveredNightFeedback) => void;
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
  'witch:curseDeath': ServerToClientEvents['witch:curseDeath'];
  'juggler:announced': ServerToClientEvents['juggler:announced'];
  'gunslinger:fired': ServerToClientEvents['gunslinger:fired'];
  'scapegoat:swapped': ServerToClientEvents['scapegoat:swapped'];
  'execution:announced': ServerToClientEvents['execution:announced'];
  'sweetheart:died': (data: { sweetheartName: string }) => void;
  'mayor:nightDeath': (data: { mayorId: string; mayorName: string }) => void;
  'night:wakeUpTargets': (data: { candidateIds: string[] }) => void;
  'game:reset': () => void;
  'player:left': ServerToClientEvents['player:left'];
  'traveller:joined': ServerToClientEvents['traveller:joined'];
  'traveller:exiled': ServerToClientEvents['traveller:exiled'];
  'exile:start': ServerToClientEvents['exile:start'];
  'exile:voteUpdate': ServerToClientEvents['exile:voteUpdate'];
  'exile:result': ServerToClientEvents['exile:result'];
  /** 도살자 추가 지명 가능 알림 */
  'butcher:extraNomination': (data: {
    butcherId: string;
    butcherName: string;
  }) => void;
  /** 익살꾼 추방 투표 통과 후 이야기꾼 판정 요청 */
  'deviant:exileJudgement': (data: {
    targetId: string;
    targetName: string;
    guiltyCount: number;
    totalPlayers: number;
  }) => void;
  /** 탕녀 방문 동의 결과 */
  'harlot:consentResult': (data: {
    harlotId: string;
    harlotName: string;
    targetId: string;
    targetName: string;
    accepted: boolean;
    targetRoleName?: string;
    needsFalseInfo?: boolean;
  }) => void;
  /** 게임 중 참가 요청: 이야기꾼 승인 대기 */
  'traveller:pendingApproval': (data: {
    socketId: string;
    playerName: string;
  }) => void;
  /** 이발사 사망: 악마가 역할 교환할 2명 선택 요청 */
  'barber:died': (data: { barberName: string }) => void;
  /** 얼뜨기 사망: 선한 플레이어 선택 요청 */
  'klutz:died': (data: { klutzId: string; klutzName: string }) => void;
  /** 팡 구 외지인 교환: 외지인이 새 악마가 됨 알림 */
  'fangGu:jumped': (data: {
    oldDemonId: string;
    oldDemonName: string;
    newDemonId: string;
    newDemonName: string;
  }) => void;
  /** 뱀 조련사가 악마를 선택해 직업과 진영을 교환함 */
  'snakeCharmer:swapped': (data: {
    snakeCharmerId: string;
    snakeCharmerName: string;
    demonId: string;
    demonName: string;
  }) => void;
  /** 백치천재가 낮에 능력 사용을 요청함 (이야기꾼이 참/거짓 정보 2개 입력 필요) */
  'savant:requested': (data: { playerId: string; playerName: string }) => void;
  /** 화가가 낮에 능력 사용을 요청함 (이야기꾼이 예/아니오 답변 필요, 게임 중 1회) */
  'artist:requested': (data: { playerId: string; playerName: string }) => void;
  /** 철학자가 능력을 부여받음. 원래 보유자가 있으면 중독 상태가 됨 */
  'philosopher:granted': (data: {
    philosopherId: string;
    philosopherName: string;
    roleId: string;
    roleName: string;
    drunkenedPlayerId?: string;
    drunkenedPlayerName?: string;
  }) => void;
  /** 곡예사 추측 결과의 정답 수 (이야기꾼 전용 — 밤 피드백 입력 시 추천값) */
  'juggler:correctCount': (data: {
    jugglerId: string;
    correctCount: number;
  }) => void;
  /** 처형 후보와 같은 진영의 희생양이 생존 시 이야기꾼에게 교체 제안 */
  'scapegoat:offer': (data: {
    candidateId: string;
    candidateName: string;
    scapegoatId: string;
    scapegoatName: string;
  }) => void;
}

export interface ClientToServerEvents {
  'game:join': (
    data: { playerName: string },
    callback: (res: {
      success: boolean;
      playerId?: string;
      error?: string;
      isTraveller?: boolean;
      /** 이야기꾼 승인 대기 중 */
      pending?: boolean;
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
      nightCount?: number;
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
      evilInfo?: EvilInfoPayload | null;
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
  /** 백치천재가 낮에 능력 사용 요청 (이야기꾼이 참/거짓 정보 2개를 보내옴) */
  'savant:use': (
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 화가가 낮에 능력 사용 요청 (이야기꾼이 예/아니오로 답변, 게임 중 1회) */
  'artist:use': (
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 철학자가 밤에 부여받을 선한 역할을 선택 (게임 중 1회) */
  'philosopher:choose': (
    data: { roleId: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 곡예사가 첫 낮에 공개적으로 플레이어-역할 추측 1~5개 선언 (게임 중 1회) */
  'juggler:declare': (
    data: { guesses: Array<{ playerId: string; roleId: string }> },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 총잡이가 낮에 오늘 첫 투표자 중 1명을 사살 (하루 1회) */
  'gunslinger:use': (
    data: { targetId: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 죽은 플레이어가 거지에게 투표 토큰 수여 */
  'beggar:giveToken': (
    data: { beggarId: string },
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
  /** 여행자 추방 제안 (낮 페이즈 중 누구나 가능) */
  'exile:propose': (
    data: { targetId: string },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 추방 투표 (찬성/반대) */
  'exile:vote': (
    data: { guilty: boolean },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 탕녀 방문 요청에 대한 대상 플레이어의 동의/거절 */
  'harlot:respond': (data: { harlotId: string; accepted: boolean }) => void;
  /** 여행자로 게임에 참가 (게임 진행 중에도 가능) */
  'game:joinAsTraveller': (
    data: { playerName: string },
    callback: (res: {
      success: boolean;
      playerId?: string;
      error?: string;
    }) => void,
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
    /** 악마 역할 배정 시 이야기꾼이 사전 선택한 블러프 역할 ID (최대 3개) */
    bluffRoleIds?: string[];
  }) => void;
  'game:unassignAllRoles': () => void;
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
  /** 여행자를 게임에 추가 (게임 진행 중에도 가능) */
  'traveller:add': (
    data: {
      playerId: string;
      roleId: string;
      alignment: 'good' | 'evil';
    },
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 이야기꾼이 추방 투표를 강제 종료 */
  'exile:forceClose': (
    data: { exiled: boolean },
    callback?: (res: { success: boolean; error?: string }) => void,
  ) => void;
  /** 여행자 추방 (처형과 다름: 전체 플레이어 과반수, 처형 효과 미발동) */
  'traveller:exile': (
    playerId: string,
    callback: (res: { success: boolean; error?: string }) => void,
  ) => void;

  /** 게임 중 참가 요청 승인 */
  'traveller:approve': (data: { socketId: string; playerName: string }) => void;
  /** 게임 중 참가 요청 거절 */
  'traveller:reject': (data: { socketId: string }) => void;

  // ── Sects & Violets ──
  /** 마녀 저주 사망 확인 (이야기꾼이 판단) */
  'witch:confirmCurseDeath': (data: {
    nominatorId: string;
    kill: boolean;
  }) => void;
  /** 이발사 사망 시 악마의 역할 교환 대상 지정 */
  'barber:swapRoles': (data: { playerId1: string; playerId2: string }) => void;
  /** 얼뜨기 사망 시 선택한 플레이어 지정 */
  'klutz:choose': (data: { klutzId: string; chosenPlayerId: string }) => void;
  /** 팡 구 외지인 교환 실행 */
  'fangGu:confirmJump': (data: {
    oldDemonId: string;
    newDemonId: string;
  }) => void;
  /** 뱀 조련사가 선택한 악마와 직업/진영 교환 실행 */
  'snakeCharmer:swap': (data: {
    snakeCharmerId: string;
    demonId: string;
  }) => void;
  'vigormortis:killMinion': (data: {
    vigormortisId: string;
    minionId: string;
    poisonedNeighborId: string;
  }) => void;
  /** 마귀할멈 역할 변경 실행 */
  'pitHag:changeRole': (data: {
    pitHagId: string;
    targetPlayerId: string;
    newRoleId: string;
  }) => void;
  /** 사악한 쌍둥이 선한 쌍둥이 지정 */
  'evilTwin:assignGoodTwin': (data: {
    evilTwinPlayerId: string;
    goodTwinPlayerId: string;
  }) => void;
  /** 희생양 처형 교체: 현재 처형 후보를 희생양으로 교체 */
  'scapegoat:swap': (data: { scapegoatId: string }) => void;
  /** 유골 수집가가 죽은 플레이어의 능력을 황혼까지 복구 */
  'boneCollector:restore': (data: {
    boneCollectorId: string;
    targetPlayerId: string;
  }) => void;
  /** 바리스타가 오늘 밤/내일 낮 효과를 부여 */
  'barista:apply': (data: {
    targetPlayerId: string;
    effect: 'sober_healthy' | 'acts_twice';
  }) => void;
}
