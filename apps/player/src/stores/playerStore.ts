import type {
  DaySubPhase,
  DeathReason,
  ExecutionAnnouncement,
  ExecutionStatus,
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
  executionCandidate: {
    playerId: string;
    playerName: string;
    guiltyVotes: number;
  } | null;
  executionStatus?: ExecutionStatus;
  executionMessage?: string;
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

interface VoteClock {
  startedAt: number;
  durationMs: number;
}

interface VoteCountdown {
  startedAt: number;
  durationMs: number;
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
  deathReason: DeathReason | null;
  executionAnnouncement: ExecutionAnnouncement | null;
  nightDeathAnnouncement: Array<{ id: string; name: string }> | null;
  executionHappenedToday: boolean;
  slayerUsed: boolean;
  slayerFizzle: { slayerName: string; targetName: string } | null;
  slayerAcked: boolean;
  gameSettings: GameSettings | null;
  voteCountdown: VoteCountdown | null;
  voteClock: VoteClock | null;
  whisperClock: VoteClock | null;
  voteOrder: {
    nomineeId: string;
    order: Array<{ id: string; name: string }>;
    fullOrder?: Array<{ id: string; name: string; isAlive: boolean }>;
  } | null;
  votePreselections: Record<string, boolean | null>;
  executionCandidate: {
    playerId: string;
    playerName: string;
    guiltyVotes: number;
  } | null;
  nominatedTodayIds: string[];
  /** Set when role changes mid-game (e.g. Scarlet Woman → Imp promotion) */
  rolePromotion: Role | null;
  /** Deferred promotion reveal: set during night, shown when day arrives */
  pendingRolePromotion: Role | null;
  /** 집사가 선택한 주인 이름 */
  butlerMasterName: string | null;
  /** onlyWhenDead 역할이 밤에 죽어서 깨어남 (서버에서 night:wakeUp 수신) */
  nightWakeUp: string | null;
  /** 변론 중 투표 동의 현황 (ready인 플레이어 ID 목록) */
  voteConsentReadyIds: string[];
  discussionClock: VoteClock | null;
  nominationClock: VoteClock | null;
  nominationPaused: boolean;
  nominationRemainingMs: number | null;
  defenseClock: VoteClock | null;
  /** 추방 투표 진행 상태 */
  exileVote: {
    proposerId: string;
    proposerName: string;
    targetId: string;
    targetName: string;
    targetRoleName: string;
    totalPlayers: number;
    votes: Record<string, boolean>;
    guiltyCount: number;
    innocentCount: number;
  } | null;
  /** 추방 투표 결과 */
  exileResult: {
    targetName: string;
    targetRoleName: string;
    exiled: boolean;
    guiltyCount: number;
    totalPlayers: number;
  } | null;
  /** 이벤트 토스트 (여행자 참가 등) */
  eventToast: { title: string; message: string } | null;
  showEventToast: (toast: { title: string; message: string }) => void;
  dismissEventToast: () => void;
  /** 단서 발견 토스트 (밤 피드백 수신 시) */
  feedbackToast: FeedbackHistoryEntry | null;
  dismissFeedbackToast: () => void;
  /** 이야기꾼에 의해 강퇴됨 */
  kicked: boolean;
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
  deathReason: null as DeathReason | null,
  executionAnnouncement: null as ExecutionAnnouncement | null,
  nightDeathAnnouncement: null as Array<{ id: string; name: string }> | null,
  executionHappenedToday: false,
  slayerUsed: false,
  slayerFizzle: null as { slayerName: string; targetName: string } | null,
  slayerAcked: false,
  gameSettings: null as GameSettings | null,
  voteCountdown: null as VoteCountdown | null,
  voteClock: null as VoteClock | null,
  whisperClock: null as VoteClock | null,
  voteOrder: null as {
    nomineeId: string;
    order: Array<{ id: string; name: string }>;
    fullOrder?: Array<{ id: string; name: string; isAlive: boolean }>;
  } | null,
  votePreselections: {} as Record<string, boolean | null>,
  executionCandidate: null as {
    playerId: string;
    playerName: string;
    guiltyVotes: number;
  } | null,
  nominatedTodayIds: [] as string[],
  rolePromotion: null as Role | null,
  pendingRolePromotion: null as Role | null,
  butlerMasterName: null as string | null,
  nightWakeUp: null as string | null,
  voteConsentReadyIds: [] as string[],
  discussionClock: null as VoteClock | null,
  nominationClock: null as VoteClock | null,
  nominationPaused: false,
  nominationRemainingMs: null as number | null,
  defenseClock: null as VoteClock | null,
  exileVote: null as PlayerState['exileVote'],
  exileResult: null as PlayerState['exileResult'],
  eventToast: null as { title: string; message: string } | null,
  feedbackToast: null as FeedbackHistoryEntry | null,
  kicked: false,
};

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      ...initialState,
      showEventToast: (toast) => set({ eventToast: toast }),
      dismissEventToast: () => set({ eventToast: null }),
      dismissFeedbackToast: () => set({ feedbackToast: null }),
      set: (partial) => set(partial),
      addFeedback: (day, feedback) => {
        const entry: FeedbackHistoryEntry = {
          day,
          phase: 'night' as const,
          feedback,
          timestamp: Date.now(),
        };
        set((s) => ({
          feedbackHistory: [...s.feedbackHistory, entry],
          feedbackToast: entry,
        }));
      },
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
