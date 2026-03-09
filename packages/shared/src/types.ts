export type Phase = 'setup' | 'night' | 'day' | 'vote' | 'ended';
export type DaySubPhase = 'whisper' | 'discussion' | 'nomination';

export type Team = 'townsfolk' | 'outsider' | 'minion' | 'demon';

export interface Role {
  id: string;
  name: string;
  team: Team;
  ability: string;
}

export interface Player {
  id: string;
  name: string;
  role?: Role;
  drunkAs?: string;
  isAlive: boolean;
  hasNominatedToday: boolean;
  deadVoteUsed: boolean;
  statuses: PlayerStatus[];
}

export interface GameState {
  id: string;
  phase: Phase;
  daySubPhase: DaySubPhase | null;
  day: number;
  players: Player[];
  nominations: Nomination[];
  started: boolean;
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
}

export interface NightAction {
  playerId: string;
  playerName: string;
  roleId: string;
  targets: string[];
}

export interface PlayerInfo {
  id: string;
  name: string;
  isAlive: boolean;
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
  | { type: 'yes_no'; value: boolean }
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
  | 'cursed';

export const PLAYER_STATUS_LABELS: Record<PlayerStatus, string> = {
  poisoned: '중독',
  drunk: '취함',
  protected: '보호',
  cursed: '저주',
};

export const PLAYER_STATUS_COLORS: Record<PlayerStatus, string> = {
  poisoned: '#9b59b6',
  drunk: '#e67e22',
  protected: '#2ecc71',
  cursed: '#8e44ad',
};

export type WinningTeam = 'good' | 'evil';

export interface GameResult {
  winningTeam: WinningTeam;
  reason: string;
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
  toId: string;
  toName: string;
  message: string;
  timestamp: number;
}
