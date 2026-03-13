import {
  ALL_ROLES,
  PLAYER_STATUS_LABELS,
  type WhisperMessage,
} from '@clocktower/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../stores/playerStore';
import { useWhisperStore } from '../stores/whisperStore';
import { HighlightedMessage } from './HighlightedMessage';
import type { TaggedCandidate } from './QuickSuggestions';
import { QuickSuggestions } from './QuickSuggestions';
import { styles } from './WhisperChat.styles';

interface WhisperChatProps {
  conversationId: string;
  participantIds: string[];
  participantNames: string[];
  onBack: () => void;
  onSend: (params: {
    conversationId?: string;
    participantIds?: string[];
    message: string;
  }) => void;
  readOnly?: boolean;
}

export function WhisperChat({
  conversationId,
  participantIds,
  participantNames,
  onBack,
  onSend,
  readOnly = false,
}: WhisperChatProps) {
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<WhisperMessage>>(null);
  const insets = useSafeAreaInsets();
  const playerId = usePlayerStore((s) => s.playerId);
  const gamePlayers = usePlayerStore((s) => s.gamePlayers);
  const messages =
    useWhisperStore((s) => s.conversations[conversationId]) ?? [];

  const isGroup = participantIds.length > 2;
  const displayName = participantNames
    .filter((_, i) => participantIds[i] !== playerId)
    .join(', ');

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
    useWhisperStore.getState().clearUnread(conversationId);
  }, [conversationId]);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend({
      conversationId,
      participantIds,
      message: trimmed,
    });
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
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{'<'} 뒤로</Text>
        </Pressable>
        <Text style={styles.partnerName} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={({ item: msg }) => {
          const isMine = msg.fromId === playerId;
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
                  isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
                ]}
              >
                {isGroup && !isMine && (
                  <Text style={styles.senderName}>{msg.fromName}</Text>
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
                  {formatTime(msg.timestamp)}
                </Text>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>밀담을 시작하세요</Text>
          </View>
        }
      />

      {readOnly ? (
        <View
          style={[
            styles.inputRow,
            {
              paddingBottom: Math.max(insets.bottom, 12) + 8,
              justifyContent: 'center',
            },
          ]}
        >
          <Text style={{ color: '#706e6a', fontSize: 14, fontWeight: '600' }}>
            밀담 시간이 종료되었습니다
          </Text>
        </View>
      ) : (
        <>
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
                style={[
                  styles.sendText,
                  !text.trim() && styles.sendTextDisabled,
                ]}
              >
                전송
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
