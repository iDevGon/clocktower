import type { StorytellerMessage } from '@clocktower/shared';
import {
  applySuggestion,
  buildChatCandidates,
  formatChatTime,
  HighlightedMessage,
  QuickSuggestions,
} from '@clocktower/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '../stores/gameStore';
import { styles } from './StorytellerChatModal.styles';

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
  const player = useGameStore((s) =>
    s.gameState?.players.find((p) => p.id === playerId),
  );
  const playerRole = player?.role ?? null;
  const playerName = player?.name ?? playerId;
  const headerLabel = playerRole
    ? `${playerName}(${playerRole.name})`
    : playerName;

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

  const allPlayers = useGameStore((s) => s.gameState?.players) ?? [];
  const candidates = useMemo(
    () => buildChatCandidates(allPlayers.map((p) => p.name)),
    [allPlayers],
  );

  const handleSuggestionSelect = (word: string) => {
    setText(applySuggestion(text, word));
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
        <Text style={styles.headerTitle}>{headerLabel}</Text>
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
                <HighlightedMessage
                  message={msg.message}
                  keywords={candidates}
                  baseStyle={[
                    styles.messageText,
                    isMine && styles.messageTextMine,
                  ]}
                />
                <Text style={styles.messageTime}>
                  {formatChatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <QuickSuggestions
        text={text}
        candidates={candidates}
        onSelect={handleSuggestionSelect}
      />
      <View
        style={[
          styles.inputRow,
          { paddingBottom: Math.max(insets.bottom, 12) + 8 },
        ]}
      >
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력하세요..."
          placeholderTextColor="#746b60"
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
