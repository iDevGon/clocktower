import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type LogCategory = 'death' | 'ability' | 'default';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  day: number;
  phase: string;
  message: string;
  category?: LogCategory;
}

interface LogStore {
  logs: GameLogEntry[];
  addLog: (
    day: number,
    phase: string,
    message: string,
    category?: LogCategory,
  ) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogStore>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (day, phase, message, category) =>
        set((s) => ({
          logs: [
            ...s.logs,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now(),
              day,
              phase,
              message,
              ...(category && { category }),
            },
          ],
        })),
      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'clocktower-logs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
