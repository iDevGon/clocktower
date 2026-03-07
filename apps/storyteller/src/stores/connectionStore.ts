import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ConnectionStore {
  socket: Socket | null;
  isConnected: boolean;
  serverUrl: string | null;
  setSocket: (socket: Socket | null) => void;
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
