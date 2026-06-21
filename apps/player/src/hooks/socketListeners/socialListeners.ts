import { vibrateAlert } from '../../notifications';
import { useChatStore } from '../../stores/chatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useWhisperStore } from '../../stores/whisperStore';
import type { AppSocket } from './types';

export function attachSocialListeners(socket: AppSocket) {
  socket.on('whisper:receive', (message) => {
    const { playerId } = usePlayerStore.getState();
    const whisperState = useWhisperStore.getState();
    whisperState.addMessage(message, playerId);

    // 다른 사람과 채팅 중이거나 채팅 목록에 있을 때, 새 밀담 알림 표시
    if (
      message.fromId !== playerId &&
      whisperState.activeChat !== message.conversationId
    ) {
      whisperState.showToast({
        fromId: message.fromId,
        fromName: message.fromName,
        conversationId: message.conversationId,
        participantNames: message.participantNames,
        message: message.message,
      });
    }
  });

  socket.on('chat:receiveFromStoryteller', (message) => {
    const chatState = useChatStore.getState();
    chatState.addMessage(message);

    // Show toast if chat is not open and message is from storyteller
    if (message.fromStoryteller && !chatState.isOpen) {
      chatState.showToast({ message: message.message });
      vibrateAlert();
    }
  });

  socket.on('whisper:activeChats', (chats) => {
    useWhisperStore.getState().setActiveWhispers(chats);
  });

  socket.on('whisper:clockStart', ({ durationMs }) => {
    usePlayerStore.getState().set({
      whisperClock: { startedAt: Date.now(), durationMs },
    });
  });

  socket.on('slayer:declared', () => {
    vibrateAlert();
  });

  socket.on('gossip:announced', (data) => {
    const { playerId } = usePlayerStore.getState();
    usePlayerStore.getState().set({
      gossipAnnouncement: data,
      ...(data.gossipId === playerId ? { gossipUsedToday: true } : {}),
    });
    vibrateAlert();
  });

  socket.on('moonchild:announced', (data) => {
    const { playerId, showEventToast } = usePlayerStore.getState();
    usePlayerStore.getState().set({
      ...(data.moonchildId === playerId ? { moonchildUsed: true } : {}),
    });
    showEventToast({
      title: '달의 자손',
      message: `${data.moonchildName} → ${data.targetName}`,
    });
    vibrateAlert();
  });

  socket.on('slayer:noEffect', (data) => {
    usePlayerStore.getState().set({ slayerFizzle: data, slayerAcked: false });
  });

  socket.on('slayer:allAcked', () => {
    usePlayerStore.getState().set({ slayerFizzle: null, slayerAcked: false });
  });

  socket.on('virgin:triggered', () => {
    vibrateAlert();
  });

  socket.on('witch:curseDeath', () => {
    vibrateAlert();
  });
}
