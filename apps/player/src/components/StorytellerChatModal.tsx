import {
  ALL_ROLES,
  PLAYER_STATUS_LABELS,
  type StorytellerMessage,
} from '@clocktower/shared';
import type { TaggedCandidate } from '@clocktower/ui';
import { HighlightedMessage, QuickSuggestions } from '@clocktower/ui';
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

  const candidates = useMemo(() => {
    const items: TaggedCandidate[] = [];
    const seen = new Set<string>();
    for (const p of gamePlayers) {
      if (!seen.has(p.name)) {
        seen.add(p.name);
        items.push({ word: p.name, category: 'player' });
      }
    }
    for (const r of ALL_ROLES) {
      if (!seen.has(r.name)) {
        seen.add(r.name);
        items.push({ word: r.name, category: 'role' });
      }
    }
    for (const label of Object.values(PLAYER_STATUS_LABELS)) {
      if (!seen.has(label)) {
        seen.add(label);
        items.push({ word: label, category: 'status' });
      }
    }
    for (const extra of ['사망', '생존', '죽음', '이야기꾼']) {
      if (!seen.has(extra)) {
        seen.add(extra);
        items.push({ word: extra, category: 'status' });
      }
    }
    return items;
  }, [gamePlayers]);

  const handleSuggestionSelect = (word: string) => {
    const parts = text.split(/(\s+)/);
    parts[parts.length - 1] = word;
    setText(`${parts.join('')} `);
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
                    {formatTime(msg.timestamp)}
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
