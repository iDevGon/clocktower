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
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore } from '../stores/chatStore';
import { usePlayerStore } from '../stores/playerStore';
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
  const listRef = useRef<FlatList<StorytellerMessage>>(null);
  const insets = useSafeAreaInsets();
  const messages = useChatStore((s) => s.messages);
  const gamePlayers = usePlayerStore((s) => s.gamePlayers);

  const candidates = useMemo(
    () => buildChatCandidates(gamePlayers.map((p) => p.name)),
    [gamePlayers],
  );

  const handleSuggestionSelect = (word: string) => {
    setText(applySuggestion(text, word));
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
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
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

        <FlatList
          ref={listRef}
          data={messages}
          renderItem={({ item: msg }) => {
            const isMine = !msg.fromStoryteller;
            return (
              <View
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
          }}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                진행자에게 메시지를 보내보세요
              </Text>
            </View>
          }
        />

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
            placeholder="진행자에게 메시지..."
            placeholderTextColor="#5c5a58"
            returnKeyType="send"
            blurOnSubmit={false}
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
