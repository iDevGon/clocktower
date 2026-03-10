import type { StorytellerMessage } from '@clocktower/shared';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../stores/gameStore';

interface StorytellerChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (playerId: string, message: string) => void;
  initialPlayerId?: string | null;
}

export function StorytellerChatModal({
  visible,
  onClose,
  onSend,
  initialPlayerId,
}: StorytellerChatModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && initialPlayerId) {
      setSelectedPlayerId(initialPlayerId);
      useGameStore.getState().setActiveChatPlayerId(initialPlayerId);
      useGameStore.getState().clearChatUnread(initialPlayerId);
    }
  }, [visible, initialPlayerId]);

  const handleClose = () => {
    setSelectedPlayerId(null);
    useGameStore.getState().setActiveChatPlayerId(null);
    onClose();
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayerId(playerId);
    useGameStore.getState().setActiveChatPlayerId(playerId);
    useGameStore.getState().clearChatUnread(playerId);
  };

  const handleBack = () => {
    setSelectedPlayerId(null);
    useGameStore.getState().setActiveChatPlayerId(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        {selectedPlayerId ? (
          <ChatView
            playerId={selectedPlayerId}
            onBack={handleBack}
            onSend={onSend}
          />
        ) : (
          <PlayerListView onSelect={handleSelectPlayer} onClose={handleClose} />
        )}
      </View>
    </Modal>
  );
}

function PlayerListView({
  onSelect,
  onClose,
}: {
  onSelect: (playerId: string) => void;
  onClose: () => void;
}) {
  const gameState = useGameStore((s) => s.gameState);
  const chatMessages = useGameStore((s) => s.chatMessages);
  const chatUnreadCounts = useGameStore((s) => s.chatUnreadCounts);
  const players = gameState?.players ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>닫기</Text>
        </Pressable>
        <Text style={styles.headerTitle}>플레이어 채팅</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.playerList}>
        {players.map((player) => {
          const msgs = chatMessages[player.id] ?? [];
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
          const unread = chatUnreadCounts[player.id] ?? 0;
          return (
            <Pressable
              key={player.id}
              style={styles.playerRow}
              onPress={() => onSelect(player.id)}
            >
              <View style={styles.playerInfo}>
                <View style={styles.playerNameRow}>
                  <Text
                    style={[
                      styles.playerName,
                      !player.isAlive && styles.playerNameDead,
                    ]}
                  >
                    {player.name}
                  </Text>
                  {!player.isAlive && (
                    <Text style={styles.deadBadge}>사망</Text>
                  )}
                  {player.role && (
                    <Text style={styles.roleBadge}>{player.role.name}</Text>
                  )}
                </View>
                {lastMsg && (
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {lastMsg.fromStoryteller ? '나: ' : ''}
                    {lastMsg.message}
                  </Text>
                )}
              </View>
              {unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{unread}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ChatView({
  playerId,
  onBack,
  onSend,
}: {
  playerId: string;
  onBack: () => void;
  onSend: (playerId: string, message: string) => void;
}) {
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const messages = useGameStore((s) => s.chatMessages[playerId]) ?? [];
  const playerName =
    useGameStore((s) => s.gameState?.players.find((p) => p.id === playerId))
      ?.name ?? playerId;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(playerId, trimmed);
    setText('');
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.closeButton}>
          <Text style={styles.backText}>{'<'} 뒤로</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{playerName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {playerName}에게 메시지를 보내보세요
            </Text>
          </View>
        )}
        {messages.map((msg: StorytellerMessage) => {
          const isMine = msg.fromStoryteller;
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubbleRow,
                isMine && styles.messageBubbleRowMine,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                ]}
              >
                {!isMine && (
                  <Text style={styles.senderLabel}>{playerName}</Text>
                )}
                <Text
                  style={[styles.messageText, isMine && styles.messageTextMine]}
                >
                  {msg.message}
                </Text>
                <Text style={styles.messageTime}>
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View
        style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 8) }]}
      >
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor="#5c5a58"
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Pressable
          onPress={handleSend}
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          disabled={!text.trim()}
        >
          <Text
            style={[styles.sendText, !text.trim() && styles.sendTextDisabled]}
          >
            전송
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#121214',
    paddingTop: 48,
  },
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  closeButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  closeText: {
    color: '#8a6a8a',
    fontSize: 14,
    fontWeight: '600',
  },
  backText: {
    color: '#8a6a8a',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60,
  },
  // Player list
  playerList: {
    flex: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#1e1e22',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: '#e0ddd8',
    fontSize: 15,
    fontWeight: '600',
  },
  playerNameDead: {
    color: '#6a6a6a',
  },
  deadBadge: {
    color: '#c44',
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadge: {
    color: '#888',
    fontSize: 11,
  },
  lastMessage: {
    color: '#7a7a7a',
    fontSize: 13,
    marginTop: 4,
  },
  unreadBadge: {
    backgroundColor: '#c44',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Chat view
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#5c5a58',
    fontSize: 14,
  },
  messageBubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageBubbleRowMine: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  messageBubbleMine: {
    backgroundColor: '#2a2a4d',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: '#1a1a1e',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2e2e34',
  },
  senderLabel: {
    color: '#8a8a6a',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  messageText: {
    color: '#e0ddd8',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#d0d0e8',
  },
  messageTime: {
    color: '#5c5a58',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#e0ddd8',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#8a6a8a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#2e2e34',
  },
  sendText: {
    color: '#121214',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendTextDisabled: {
    color: '#5c5a58',
  },
});
