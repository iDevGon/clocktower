import type {
  DaySubPhase,
  GameResult,
  NightFeedbackPayload,
  Phase,
  PlayerInfo,
  Role,
} from '@clocktower/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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

export interface EvilInfo {
  minionNames?: string[];
  demonName?: string;
  otherMinionNames?: string[];
  bluffRoles?: { id: string; name: string }[];
}

interface PlayerState {
  playerId: string;
  playerName: string;
  role: Role | null;
  evilInfo: EvilInfo | null;
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
  drunkAs: string | null;
  nightFeedback: NightFeedbackPayload | null;
  gamePlayers: PlayerInfo[];
  gameResult: GameResult | null;
  justDied: boolean;
  slayerUsed: boolean;
  set: (partial: Partial<PlayerState>) => void;
  reset: () => void;
}

const initialState = {
  playerId: '',
  playerName: '',
  role: null,
  evilInfo: null,
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
  drunkAs: null,
  nightFeedback: null,
  gamePlayers: [],
  gameResult: null,
  justDied: false,
  slayerUsed: false,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,
      set: (partial) => set(partial),
      reset: () => set(initialState),
    }),
    {
      name: 'player-state',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        playerId: state.playerId,
        playerName: state.playerName,
      }),
    },
  ),
);
