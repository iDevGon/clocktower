import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';

export function acknowledgeSlayerFizzle(): void {
  const socket = useConnectionStore.getState().socket;
  const playerStore = usePlayerStore.getState();

  if (!socket?.connected || playerStore.slayerAcked) return;

  socket.emit('slayer:ack');
  playerStore.set({ slayerAcked: true });
}
