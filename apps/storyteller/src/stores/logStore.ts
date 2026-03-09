import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface GameLogEntry {
  id: string;
  timestamp: number;
  day: number;
  phase: string;
  message: string;
}

interface LogStore {
  logs: GameLogEntry[];
  addLog: (day: number, phase: string, message: string) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogStore>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (day, phase, message) =>
        set((s) => ({
          logs: [
            ...s.logs,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              timestamp: Date.now(),
              day,
              phase,
              message,
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
