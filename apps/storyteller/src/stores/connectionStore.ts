import type {
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
} from '@clocktower/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type StorytellerSocket = Socket<
  ServerToStorytellerEvents,
  StorytellerToServerEvents
>;

interface ConnectionStore {
  socket: StorytellerSocket | null;
  isConnected: boolean;
  serverUrl: string | null;
  setSocket: (socket: StorytellerSocket | null) => void;
  setConnected: (connected: boolean) => void;
  setServerUrl: (url: string) => void;
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set) => ({
      socket: null,
      isConnected: false,
      serverUrl: null,
      setSocket: (socket) => set({ socket }),
      setConnected: (connected) => set({ isConnected: connected }),
      setServerUrl: (url) => set({ serverUrl: url }),
    }),
    {
      name: 'clocktower-connection',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        serverUrl: state.serverUrl,
      }),
    },
  ),
);
