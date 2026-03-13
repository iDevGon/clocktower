import { type StorytellerMessage, ALL_ROLES } from '@clocktower/shared';
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
import { useChatStore } from '../stores/chatStore';
import { usePlayerStore } from '../stores/playerStore';
import { QuickSuggestions } from './QuickSuggestions';
import { styles } from './StorytellerChatModal.styles';

interface StorytellerChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (message: string) => void;
}

export function StorytellerChatModal({
  visible,
  onClose,
  onSend,
}: StorytellerChatModalProps) {
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const messages = useChatStore((s) => s.messages);
  const gamePlayers = usePlayerStore((s) => s.gamePlayers);

  const candidates = useMemo(() => {
    const playerNames = gamePlayers.map((p) => p.name);
    const roleNames = ALL_ROLES.map((r) => r.name);
    return [...new Set([...playerNames, ...roleNames])];
  }, [gamePlayers]);

  const handleSuggestionSelect = (word: string) => {
    const parts = text.split(/(\s+)/);
    parts[parts.length - 1] = word;
    setText(parts.join('') + ' ');
  };

  useEffect(() => {
    if (visible) {
      useChatStore.getState().setOpen(true);
      useChatStore.getState().clearUnread();
    } else {
      useChatStore.getState().setOpen(false);
    }
  }, [visible]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on new messages
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleClose = () => {
    useChatStore.getState().setOpen(false);
    onClose();
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>닫기</Text>
          </Pressable>
          <Text style={styles.headerTitle}>진행자 채팅</Text>
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
                진행자에게 메시지를 보내보세요
              </Text>
            </View>
          )}
          {messages.map((msg: StorytellerMessage) => {
            const isMine = !msg.fromStoryteller;
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
                    isMine
                      ? styles.messageBubbleMine
                      : styles.messageBubbleOther,
                  ]}
                >
                  {!isMine && <Text style={styles.senderLabel}>진행자</Text>}
                  <Text
                    style={[
                      styles.messageText,
                      isMine && styles.messageTextMine,
                    ]}
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

        <QuickSuggestions
          text={text}
          candidates={candidates}
          onSelect={handleSuggestionSelect}
        />
        <View
          style={[
            styles.inputRow,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="진행자에게 메시지..."
            placeholderTextColor="#5c5a58"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            style={[
              styles.sendButton,
              !text.trim() && styles.sendButtonDisabled,
            ]}
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
    </Modal>
  );
}
