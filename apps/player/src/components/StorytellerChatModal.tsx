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
import { useChatStore } from '../stores/chatStore';

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    paddingTop: 48,
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
  headerTitle: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 60,
  },
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
    borderColor: '#3a2a4a',
  },
  senderLabel: {
    color: '#8a6a8a',
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
