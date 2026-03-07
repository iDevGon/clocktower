import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@clocktower/shared';
import type { Socket } from 'socket.io-client';
import { create } from 'zustand';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface ConnectionState {
  socket: AppSocket | null;
  isConnected: boolean;
  serverUrl: string | null;
  gameCode: string | null;
  set: (partial: Partial<ConnectionState>) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  socket: null,
  isConnected: false,
  serverUrl: null,
  gameCode: null,
  set: (partial) => set(partial),
}));
