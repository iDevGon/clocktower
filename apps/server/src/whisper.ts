import type {
  ClientToServerEvents,
  ServerToClientEvents,
  ServerToStorytellerEvents,
  StorytellerToServerEvents,
  WhisperMessage,
} from '@clocktower/shared';
import type { Namespace } from 'socket.io';

type PlayerNamespace = Namespace<ClientToServerEvents, ServerToClientEvents>;
type StorytellerNamespace = Namespace<
  StorytellerToServerEvents,
  ServerToStorytellerEvents
>;

interface ActiveWhisperEntry {
  player1Id: string;
  player1Name: string;
  player2Id: string;
  player2Name: string;
  lastMessageAt: number;
}

const WHISPER_TIMEOUT = 60_000; // 60 seconds

export class WhisperTracker {
  private activeWhispers: Map<string, ActiveWhisperEntry> = new Map();
  private storytellerIo: StorytellerNamespace;
  private playerIo: PlayerNamespace;

  constructor(storytellerIo: StorytellerNamespace, playerIo: PlayerNamespace) {
    this.storytellerIo = storytellerIo;
    this.playerIo = playerIo;
  }

  getKey(id1: string, id2: string): string {
    return [id1, id2].sort().join(':');
  }

  update(msg: WhisperMessage): void {
    const key = this.getKey(msg.fromId, msg.toId);
    this.activeWhispers.set(key, {
      player1Id: msg.fromId,
      player1Name: msg.fromName,
      player2Id: msg.toId,
      player2Name: msg.toName,
      lastMessageAt: msg.timestamp,
    });
    this.broadcastActive();
  }

  clear(): void {
    this.activeWhispers.clear();
  }

  private broadcastActive(): void {
    const now = Date.now();
    const chats: Array<{
      player1Id: string;
      player1Name: string;
      player2Id: string;
      player2Name: string;
    }> = [];
    for (const [key, entry] of this.activeWhispers) {
      if (now - entry.lastMessageAt > WHISPER_TIMEOUT) {
        this.activeWhispers.delete(key);
      } else {
        chats.push({
          player1Id: entry.player1Id,
          player1Name: entry.player1Name,
          player2Id: entry.player2Id,
          player2Name: entry.player2Name,
        });
      }
    }
    this.storytellerIo.emit('whisper:activeChats', chats);
    this.playerIo.emit('whisper:activeChats', chats);
  }
}
