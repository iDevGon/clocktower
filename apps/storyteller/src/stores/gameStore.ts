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

interface GameStore {
  gameId: string | null;
  gameState: GameState | null;
  nightActions: NightAction[];
  activeNightRoleId: string | null;
  activeWhispers: ActiveWhisper[];
  playerStatuses: Record<string, PlayerStatus[]>;
  tokenPositions: Record<string, TokenPosition>;
  lastExecutedPlayerId: string | null;
  gameResult: GameResult | null;
  chatMessages: Record<string, StorytellerMessage[]>;
  chatUnreadCounts: Record<string, number>;
  activeChatPlayerId: string | null;
  setGameState: (state: GameState) => void;
  addNightAction: (action: NightAction) => void;
  clearNightActions: () => void;
  setActiveNightRoleId: (roleId: string | null) => void;
  setActiveWhispers: (whispers: ActiveWhisper[]) => void;
  setLastExecutedPlayerId: (id: string | null) => void;
  addPlayerStatus: (playerId: string, status: PlayerStatus) => void;
  removePlayerStatus: (playerId: string, status: PlayerStatus) => void;
  clearPlayerStatuses: (playerId: string) => void;
  setGameResult: (result: GameResult | null) => void;
  setTokenPosition: (playerId: string, pos: TokenPosition) => void;
  clearTokenPositions: () => void;
  addChatMessage: (message: StorytellerMessage) => void;
  setActiveChatPlayerId: (playerId: string | null) => void;
  clearChatUnread: (playerId: string) => void;
  totalChatUnread: () => number;
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
      gameResult: null,
      chatMessages: {},
      chatUnreadCounts: {},
      activeChatPlayerId: null,
      setGameState: (state) => {
        // 서버 상태의 player.statuses를 playerStatuses 스토어에 동기화
        const synced: Record<string, PlayerStatus[]> = {};
        for (const player of state.players) {
          synced[player.id] = player.statuses ?? [];
        }
        set({
          gameState: state,
          gameId: state.id,
          playerStatuses: synced,
        });
      },
      addNightAction: (action) =>
        set((s) => ({ nightActions: [...s.nightActions, action] })),
      clearNightActions: () => set({ nightActions: [] }),
      setActiveNightRoleId: (roleId) => set({ activeNightRoleId: roleId }),
      setActiveWhispers: (whispers) => set({ activeWhispers: whispers }),
      setLastExecutedPlayerId: (id) => set({ lastExecutedPlayerId: id }),
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
      totalChatUnread: () => {
        const s = useGameStore.getState();
        return Object.values(s.chatUnreadCounts).reduce((a, b) => a + b, 0);
      },
      setTokenPosition: (playerId, pos) =>
        set((s) => ({
          tokenPositions: { ...s.tokenPositions, [playerId]: pos },
        })),
      clearTokenPositions: () => set({ tokenPositions: {} }),
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
          gameResult: null,
          chatMessages: {},
          chatUnreadCounts: {},
          activeChatPlayerId: null,
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
      }),
    },
  ),
);
