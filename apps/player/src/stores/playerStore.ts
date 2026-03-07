import type {
  DaySubPhase,
  NightFeedbackPayload,
  Phase,
  PlayerInfo,
  Role,
} from '@clocktower/shared';
import { create } from 'zustand';

interface Nomination {
  nominatorId: string;
  nomineeId: string;
  nominatorName: string;
  nomineeName: string;
}

interface VoteResult {
  nomineeId: string;
  nomineeName: string;
  guilty: boolean;
  votes: Record<string, boolean>;
}

export interface NightProgress {
  activeRoleId: string | null;
  order: string[];
  players: PlayerInfo[];
}

interface PlayerState {
  playerId: string;
  playerName: string;
  role: Role | null;
  isAlive: boolean;
  currentPhase: Phase;
  daySubPhase: DaySubPhase | null;
  nomination: Nomination | null;
  voteResult: VoteResult | null;
  nightProgress: NightProgress | null;
  hasVoted: boolean;
  hasNominatedToday: boolean;
  deadVoteUsed: boolean;
  nightActionSubmitted: boolean;
  nightFeedback: NightFeedbackPayload | null;
  gamePlayers: PlayerInfo[];
  set: (partial: Partial<PlayerState>) => void;
  reset: () => void;
}

const initialState = {
  playerId: '',
  playerName: '',
  role: null,
  isAlive: true,
  currentPhase: 'setup' as Phase,
  daySubPhase: null as DaySubPhase | null,
  nomination: null,
  voteResult: null,
  nightProgress: null,
  hasVoted: false,
  hasNominatedToday: false,
  deadVoteUsed: false,
  nightActionSubmitted: false,
  nightFeedback: null,
  gamePlayers: [],
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,
  set: (partial) => set(partial),
  reset: () => set(initialState),
}));
