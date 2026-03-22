export type Phase = 'setup' | 'night' | 'day' | 'vote' | 'ended';
export type DaySubPhase = 'whisper' | 'discussion' | 'nomination' | 'defense';

export type Team = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller';

export interface Role {
  id: string;
  name: string;
  team: Team;
  ability: string;
  edition: string;
}

export interface Player {
  id: string;
  name: string;
  role?: Role;
  drunkAs?: string;
  isAlive: boolean;
  hasNominatedToday: boolean;
  hasBeenNominatedToday: boolean;
  deadVoteUsed: boolean;
  statuses: PlayerStatus[];
  isDummy?: boolean;
  /** 여행자(Traveller) 여부. 여행자는 게임 중간에 참가/퇴장 가능하며 추방(exile)으로만 제거 */
  isTraveller?: boolean;
  /** 여행자의 진영 (good/evil). 이야기꾼이 결정 */
  travellerAlignment?: 'good' | 'evil';
}

/** 여행자 역할 정의. 일반 역할과 달리 team은 항상 'traveller' */
export interface TravellerRole extends Role {
  team: 'traveller';
  edition: string;
}

export interface GameState {
  id: string;
  phase: Phase;
  daySubPhase: DaySubPhase | null;
  day: number;
  players: Player[];
  nominations: Nomination[];
  started: boolean;
  butlerMasters?: Record<string, string>;
  playerOrder: string[];
  settings: GameSettings;
  /** 이야기꾼 전용: 악마에게 전달된 블러프 역할 목록 */
  bluffRoles?: { id: string; name: string }[];
}

export interface Nomination {
  nominatorId: string;
  nomineeId: string;
  votes: Record<string, boolean>;
}

export type NightActionType = 'select_one' | 'select_two' | 'passive';

export interface NightActionDef {
  type: NightActionType;
  instruction: string;
  excludeSelf: boolean;
  /** 사망 시에만 능력이 발동하는 역할 (예: 까마귀지기) */
  onlyWhenDead?: boolean;
}

export interface NightAction {
  playerId: string;
  playerName: string;
  roleId: string;
  targets: string[];
  /** 점쟁이 판정 결과: 선택된 2명 중 악마/Red Herring 포함 여부 */
  fortuneTellerResult?: boolean;
}

export interface PlayerInfo {
  id: string;
  name: string;
  isAlive: boolean;
  deadVoteUsed?: boolean;
}

export type FeedbackType =
  | 'none'
  | 'number'
  | 'yes_no'
  | 'players_and_role'
  | 'role'
  | 'grimoire';

export interface NightFeedbackDef {
  type: FeedbackType;
  roleTeamFilter?: Team;
  allowNone?: boolean;
}

export type NightFeedbackPayload =
  | { type: 'number'; value: number }
  | { type: 'yes_no'; value: boolean; targetNames?: string[] }
  | { type: 'players_and_role'; playerNames: string[]; roleName: string }
  | { type: 'no_match'; message: string }
  | { type: 'role'; roleName: string }
  | {
      type: 'grimoire';
      entries: {
        name: string;
        roleName: string;
        team: Team;
        isAlive: boolean;
        statuses: PlayerStatus[];
      }[];
    };

export type PlayerStatus =
  | 'poisoned'
  | 'drunk'
  | 'protected'
  | 'cursed'
  | 'master'
  | 'misregistered'
  | 'witch_cursed'
  | 'cerenovus_mad'
  | 'good_twin'
  | 'evil_twin'
  | 'no_ability';

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  poisoned: '중독',
  drunk: '취함',
  protected: '보호',
  cursed: '저주',
  master: '주인',
  misregistered: '위장',
  witch_cursed: '마녀 저주',
  cerenovus_mad: '광기',
  good_twin: '선한 쌍둥이',
  evil_twin: '악한 쌍둥이',
  no_ability: '능력 소진',
};

export const PLAYER_STATUS_COLORS: Record<PlayerStatus, string> = {
  poisoned: '#9b59b6',
  drunk: '#e67e22',
  protected: '#2ecc71',
  cursed: '#8e44ad',
  master: '#3a7ca5',
  misregistered: '#e74c3c',
  witch_cursed: '#c0392b',
  cerenovus_mad: '#d35400',
  good_twin: '#27ae60',
  evil_twin: '#c0392b',
  no_ability: '#7f8c8d',
};

export const PLAYER_STATUS_DESCRIPTIONS: Record<PlayerStatus, string> = {
  poisoned:
    '독살범에 의해 중독됨. 이 플레이어의 능력은 오늘 밤과 내일 낮 동안 무효화됩니다.',
  drunk: '주정뱅이. 본인은 자신의 역할을 모르며, 능력이 무효화됩니다.',
  protected:
    '수도사에 의해 보호됨. 이 플레이어는 오늘 밤 악마에게 죽지 않습니다.',
  cursed: '점쟁이의 저주. 점쟁이에게 악마로 감지됩니다.',
  master: '집사의 주인. 이 주인이 투표해야만 집사도 투표할 수 있습니다.',
  misregistered:
    '진영 위장. 은둔자는 악으로, 첩자는 선으로 정보 능력에 감지됩니다.',
  witch_cursed:
    '마녀에 의해 저주됨. 이 플레이어가 내일 지명하면 즉시 사망합니다.',
  cerenovus_mad:
    '세레노버스에 의한 광기. 지정된 역할이라고 주장하지 않으면 처형될 수 있습니다.',
  good_twin:
    '사악한 쌍둥이의 선한 쌍둥이. 이 플레이어가 처형되면 악 팀이 승리합니다.',
  evil_twin:
    '사악한 쌍둥이. 선한 쌍둥이가 살아 있는 동안 처형으로 사망하지 않습니다.',
  no_ability: '1회성 능력을 이미 사용했습니다.',
};

export type WinningTeam = 'good' | 'evil';

export interface GameResult {
  winningTeam: WinningTeam;
  reason: string;
  /** 승리 원인 (특수 연출용) */
  cause?: 'slayer' | 'execution' | 'virgin' | 'witch_curse' | 'klutz' | 'evil_twin' | 'vortox_no_execution';
  players: {
    id: string;
    name: string;
    role: Role;
    isAlive: boolean;
    team: Team;
  }[];
}

export interface WhisperMessage {
  id: string;
  fromId: string;
  fromName: string;
  conversationId: string;
  participantIds: string[];
  participantNames: string[];
  message: string;
  timestamp: number;
}

export interface ActiveWhisperChat {
  conversationId: string;
  participantIds: string[];
  participantNames: string[];
}

export interface GameSettings {
  whisperMode: 'chat' | 'offline';
  votingMode: 'online' | 'offline';
  voteClockSeconds: number;
  whisperClockSeconds: number;
  discussionClockSeconds: number;
  nominationClockSeconds: number;
  defenseClockSeconds: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  whisperMode: 'chat',
  votingMode: 'online',
  voteClockSeconds: 3,
  whisperClockSeconds: 0,
  discussionClockSeconds: 0,
  nominationClockSeconds: 0,
  defenseClockSeconds: 0,
};

export interface StorytellerMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  fromStoryteller: boolean;
  timestamp: number;
}

export type ExecutionStatus =
  | 'new_candidate'
  | 'candidate_changed'
  | 'candidate_cleared'
  | 'no_change';

export type DeathReason =
  | 'execution'
  | 'virgin'
  | 'slayer'
  | 'night_kill'
  | 'exile'
  | 'witch_curse'
  | 'klutz';

export const DEATH_REASON_LABELS: Record<DeathReason, string> = {
  execution: '투표로 처형됨',
  virgin: '성결자의 능력으로 처형됨',
  slayer: '처단자에게 처형됨',
  night_kill: '밤에 사망함',
  exile: '추방됨',
  witch_curse: '마녀의 저주로 사망함',
  klutz: '얼뜨기의 선택으로 패배함',
};

export interface ExecutionAnnouncement {
  executedId: string;
  executedName: string;
  reason: DeathReason;
  detail: string;
}

export interface Edition {
  id: string;
  name: string;
  description: string;
  disabled?: boolean;
}
