import type {
  DaySubPhase,
  GameResult,
  GameSettings,
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

export interface FeedbackHistoryEntry {
  day: number;
  phase: 'night';
  feedback: NightFeedbackPayload;
  timestamp: number;
}

interface VoteTurn {
  playerId: string;
  playerName: string;
  timeLimit: number;
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
  feedbackHistory: FeedbackHistoryEntry[];
  nightCount: number;
  gamePlayers: PlayerInfo[];
  gameResult: GameResult | null;
  justDied: boolean;
  slayerUsed: boolean;
  gameSettings: GameSettings | null;
  voteTurn: VoteTurn | null;
  voteTimerMs: number | null;
  set: (partial: Partial<PlayerState>) => void;
  addFeedback: (day: number, feedback: NightFeedbackPayload) => void;
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
  feedbackHistory: [],
  nightCount: 0,
  gamePlayers: [],
  gameResult: null,
  justDied: false,
  slayerUsed: false,
  gameSettings: null as GameSettings | null,
  voteTurn: null as VoteTurn | null,
  voteTimerMs: null as number | null,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,
      set: (partial) => set(partial),
      addFeedback: (day, feedback) =>
        set((s) => ({
          feedbackHistory: [
            ...s.feedbackHistory,
            { day, phase: 'night' as const, feedback, timestamp: Date.now() },
          ],
        })),
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
