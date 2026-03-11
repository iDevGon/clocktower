import type {
  GameResult,
  GameState,
  NightAction,
  PlayerStatus,
  StorytellerMessage,
} from '@clocktower/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ActiveWhisper {
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
}

interface TokenPosition {
  x: number;
  y: number;
}

interface VoteResult {
  nomineeId: string;
  nomineeName: string;
  guilty: boolean;
  votes: Record<string, boolean>;
}

interface GameStore {
  gameId: string | null;
  gameState: GameState | null;
  nightActions: NightAction[];
  activeNightRoleId: string | null;
  activeWhispers: ActiveWhisper[];
  playerStatuses: Record<string, PlayerStatus[]>;
  tokenPositions: Record<string, TokenPosition>;
  lastExecutedPlayerId: string | null;
  voteCountdown: { startedAt: number; durationMs: number } | null;
  voteClock: { startedAt: number; durationMs: number } | null;
  votePreselections: Record<string, boolean | null>;
  voteConfirmed: Record<string, boolean>;
  voteResult: VoteResult | null;
  gameResult: GameResult | null;
  playerOrder: string[];
  chatMessages: Record<string, StorytellerMessage[]>;
  chatUnreadCounts: Record<string, number>;
  activeChatPlayerId: string | null;
  chatToast: { playerName: string; message: string } | null;
  showChatToast: (toast: { playerName: string; message: string }) => void;
  dismissChatToast: () => void;
  setGameState: (state: GameState) => void;
  addNightAction: (action: NightAction) => void;
  clearNightActions: () => void;
  setActiveNightRoleId: (roleId: string | null) => void;
  setActiveWhispers: (whispers: ActiveWhisper[]) => void;
  setLastExecutedPlayerId: (id: string | null) => void;
  setVoteClock: (
    clock: { startedAt: number; durationMs: number } | null,
  ) => void;
  setVotePreselection: (playerId: string, guilty: boolean | null) => void;
  setVoteConfirmed: (playerId: string, guilty: boolean) => void;
  clearVotePreselections: () => void;
  addPlayerStatus: (playerId: string, status: PlayerStatus) => void;
  removePlayerStatus: (playerId: string, status: PlayerStatus) => void;
  clearPlayerStatuses: (playerId: string) => void;
  setVoteResult: (result: VoteResult | null) => void;
  setGameResult: (result: GameResult | null) => void;
  setTokenPosition: (playerId: string, pos: TokenPosition) => void;
  clearTokenPositions: () => void;
  setPlayerOrder: (order: string[]) => void;
  swapPlayerOrder: (fromIndex: number, toIndex: number) => void;
  addChatMessage: (message: StorytellerMessage) => void;
  setActiveChatPlayerId: (playerId: string | null) => void;
  clearChatUnread: (playerId: string) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      gameId: null,
      gameState: null,
      nightActions: [],
      activeNightRoleId: null,
      activeWhispers: [],
      playerStatuses: {},
      tokenPositions: {},
      lastExecutedPlayerId: null,
      voteCountdown: null,
      voteClock: null,
      votePreselections: {},
      voteConfirmed: {},
      voteResult: null,
      gameResult: null,
      playerOrder: [],
      chatMessages: {},
      chatUnreadCounts: {},
      activeChatPlayerId: null,
      chatToast: null,
      showChatToast: (toast) => set({ chatToast: toast }),
      dismissChatToast: () => set({ chatToast: null }),
      setGameState: (state) => {
        // 서버 상태의 player.statuses를 playerStatuses 스토어에 동기화
        const synced: Record<string, PlayerStatus[]> = {};
        for (const player of state.players) {
          synced[player.id] = player.statuses ?? [];
        }
        const prev = useGameStore.getState();
        const phaseChangedToVote =
          state.phase === 'vote' && prev.gameState?.phase !== 'vote';
        set({
          gameState: state,
          gameId: state.id,
          playerStatuses: synced,
          playerOrder: state.playerOrder ?? [],
          ...(phaseChangedToVote
            ? {
                voteCountdown: { startedAt: Date.now(), durationMs: 5000 },
                voteResult: null,
              }
            : {}),
          ...(state.phase !== 'vote'
            ? { voteCountdown: null, voteClock: null }
            : {}),
        });
      },
      addNightAction: (action) =>
        set((s) => ({ nightActions: [...s.nightActions, action] })),
      clearNightActions: () => set({ nightActions: [] }),
      setActiveNightRoleId: (roleId) => set({ activeNightRoleId: roleId }),
      setActiveWhispers: (whispers) => set({ activeWhispers: whispers }),
      setLastExecutedPlayerId: (id) => set({ lastExecutedPlayerId: id }),
      setVoteClock: (clock) => set({ voteClock: clock, voteCountdown: null }),
      setVotePreselection: (playerId, guilty) =>
        set((s) => ({
          votePreselections: { ...s.votePreselections, [playerId]: guilty },
        })),
      setVoteConfirmed: (playerId, guilty) =>
        set((s) => ({
          voteConfirmed: { ...s.voteConfirmed, [playerId]: guilty },
        })),
      clearVotePreselections: () =>
        set({ votePreselections: {}, voteConfirmed: {} }),
      addPlayerStatus: (playerId, status) =>
        set((s) => {
          const current = s.playerStatuses[playerId] ?? [];
          if (current.includes(status)) return s;
          return {
            playerStatuses: {
              ...s.playerStatuses,
              [playerId]: [...current, status],
            },
          };
        }),
      removePlayerStatus: (playerId, status) =>
        set((s) => {
          const current = s.playerStatuses[playerId] ?? [];
          return {
            playerStatuses: {
              ...s.playerStatuses,
              [playerId]: current.filter((st) => st !== status),
            },
          };
        }),
      clearPlayerStatuses: (playerId) =>
        set((s) => {
          const { [playerId]: _, ...rest } = s.playerStatuses;
          return { playerStatuses: rest };
        }),
      setVoteResult: (result) => set({ voteResult: result }),
      setGameResult: (result) => set({ gameResult: result }),
      addChatMessage: (message) =>
        set((s) => {
          const prev = s.chatMessages[message.playerId] ?? [];
          const isActive = s.activeChatPlayerId === message.playerId;
          return {
            chatMessages: {
              ...s.chatMessages,
              [message.playerId]: [...prev, message],
            },
            chatUnreadCounts:
              !message.fromStoryteller && !isActive
                ? {
                    ...s.chatUnreadCounts,
                    [message.playerId]:
                      (s.chatUnreadCounts[message.playerId] ?? 0) + 1,
                  }
                : s.chatUnreadCounts,
          };
        }),
      setActiveChatPlayerId: (playerId) => {
        set((s) => ({
          activeChatPlayerId: playerId,
          chatUnreadCounts: playerId
            ? { ...s.chatUnreadCounts, [playerId]: 0 }
            : s.chatUnreadCounts,
        }));
      },
      clearChatUnread: (playerId) =>
        set((s) => ({
          chatUnreadCounts: { ...s.chatUnreadCounts, [playerId]: 0 },
        })),
      setTokenPosition: (playerId, pos) =>
        set((s) => ({
          tokenPositions: { ...s.tokenPositions, [playerId]: pos },
        })),
      clearTokenPositions: () => set({ tokenPositions: {} }),
      setPlayerOrder: (order) => set({ playerOrder: order }),
      swapPlayerOrder: (fromIndex, toIndex) =>
        set((s) => {
          const order = [...s.playerOrder];
          if (
            fromIndex >= 0 &&
            fromIndex < order.length &&
            toIndex >= 0 &&
            toIndex < order.length
          ) {
            [order[fromIndex], order[toIndex]] = [
              order[toIndex],
              order[fromIndex],
            ];
          }
          return { playerOrder: order };
        }),
      reset: () =>
        set({
          gameId: null,
          gameState: null,
          nightActions: [],
          activeNightRoleId: null,
          activeWhispers: [],
          playerStatuses: {},
          tokenPositions: {},
          lastExecutedPlayerId: null,
          voteCountdown: null,
          voteClock: null,
          votePreselections: {},
          voteConfirmed: {},
          voteResult: null,
          gameResult: null,
          playerOrder: [],
          chatMessages: {},
          chatUnreadCounts: {},
          activeChatPlayerId: null,
          chatToast: null,
        }),
    }),
    {
      name: 'clocktower-game',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        gameId: state.gameId,
        gameState: state.gameState,
        playerStatuses: state.playerStatuses,
        tokenPositions: state.tokenPositions,
        activeNightRoleId: state.activeNightRoleId,
        nightActions: state.nightActions,
        playerOrder: state.playerOrder,
      }),
    },
  ),
);
