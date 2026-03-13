import type {
  ActiveWhisperChat,
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

interface ActiveConversationEntry {
  conversationId: string;
  participantIds: string[];
  participantNames: string[];
  lastMessageAt: number;
}

const WHISPER_TIMEOUT = 60_000; // 60 seconds

export class WhisperTracker {
  private activeConversations: Map<string, ActiveConversationEntry> = new Map();
  private storytellerIo: StorytellerNamespace;
  private playerIo: PlayerNamespace;

  constructor(storytellerIo: StorytellerNamespace, playerIo: PlayerNamespace) {
    this.storytellerIo = storytellerIo;
    this.playerIo = playerIo;
  }

  static makeConversationId(...ids: string[]): string {
    return [...ids].sort().join(':');
  }

  update(msg: WhisperMessage): void {
    this.activeConversations.set(msg.conversationId, {
      conversationId: msg.conversationId,
      participantIds: msg.participantIds,
      participantNames: msg.participantNames,
      lastMessageAt: msg.timestamp,
    });
    this.broadcastActive();
  }

  clear(): void {
    this.activeConversations.clear();
  }

  private broadcastActive(): void {
    const now = Date.now();
    const chats: ActiveWhisperChat[] = [];
    for (const [key, entry] of this.activeConversations) {
      if (now - entry.lastMessageAt > WHISPER_TIMEOUT) {
        this.activeConversations.delete(key);
      } else {
        chats.push({
          conversationId: entry.conversationId,
          participantIds: entry.participantIds,
          participantNames: entry.participantNames,
        });
      }
    }
    this.storytellerIo.emit('whisper:activeChats', chats);
    this.playerIo.emit('whisper:activeChats', chats);
  }
}
