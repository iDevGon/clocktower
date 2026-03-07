import type { GameState, NightAction } from '@clocktower/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ActiveWhisper {
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
}

interface GameStore {
  gameId: string | null;
  gameState: GameState | null;
  nightActions: NightAction[];
  activeNightRoleId: string | null;
  activeWhispers: ActiveWhisper[];
  setGameState: (state: GameState) => void;
  addNightAction: (action: NightAction) => void;
  clearNightActions: () => void;
  setActiveNightRoleId: (roleId: string | null) => void;
  setActiveWhispers: (whispers: ActiveWhisper[]) => void;
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
      setGameState: (state) => set({ gameState: state, gameId: state.id }),
      addNightAction: (action) =>
        set((s) => ({ nightActions: [...s.nightActions, action] })),
      clearNightActions: () => set({ nightActions: [] }),
      setActiveNightRoleId: (roleId) => set({ activeNightRoleId: roleId }),
      setActiveWhispers: (whispers) => set({ activeWhispers: whispers }),
      reset: () =>
        set({
          gameId: null,
          gameState: null,
          nightActions: [],
          activeNightRoleId: null,
          activeWhispers: [],
        }),
    }),
    {
      name: 'clocktower-game',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        gameId: state.gameId,
        gameState: state.gameState,
      }),
    },
  ),
);
