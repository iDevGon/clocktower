import type { WhisperMessage } from '@clocktower/shared';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayerStore } from '../stores/playerStore';
import { useWhisperStore } from '../stores/whisperStore';
import { styles } from './WhisperChat.styles';

interface WhisperChatProps {
  partnerId: string;
  partnerName: string;
  onBack: () => void;
  onSend: (toId: string, message: string) => void;
}

export function WhisperChat({
  partnerId,
  partnerName,
  onBack,
  onSend,
}: WhisperChatProps) {
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const playerId = usePlayerStore((s) => s.playerId);
  const messages = useWhisperStore((s) => s.conversations[partnerId]) ?? [];

  useEffect(() => {
    useWhisperStore.getState().clearUnread(partnerId);
  }, [partnerId]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(partnerId, trimmed);
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
        <Text style={styles.partnerName}>{partnerName}</Text>
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
              {partnerName}님과의 밀담을 시작하세요
            </Text>
          </View>
        )}
        {messages.map((msg: WhisperMessage) => {
          const isMine = msg.fromId === playerId;
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
