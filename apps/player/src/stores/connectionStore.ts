import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@clocktower/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface ConnectionState {
  socket: AppSocket | null;
  isConnected: boolean;
  serverUrl: string | null;
  set: (partial: Partial<ConnectionState>) => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      socket: null,
      isConnected: false,
      serverUrl: null,
      set: (partial) => set(partial),
    }),
    {
      name: 'player-connection',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ serverUrl: state.serverUrl }),
    },
  ),
);
