import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@clocktower/shared';
import type { Socket } from 'socket.io-client';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
