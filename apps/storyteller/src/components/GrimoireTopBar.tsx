import { Pressable, Text, View } from 'react-native';
import { IS_DEV } from '../constants';
import type { createGrimoireStyles } from '../styles/grimoire.styles';

interface GrimoireTopBarProps {
  day: number;
  phase: string;
  daySubPhase?: string;
  activeWhispersCount: number;
  slayerWaitingAck: boolean;
  totalChatUnread: number;
  onWhispersPress: () => void;
  onNominatePress: () => void;
  onSlayerForceAck: () => void;
  onDictionaryPress: () => void;
  onChatPress: () => void;
  onLogPress: () => void;
  onMenuPress: () => void;
  styles: ReturnType<typeof createGrimoireStyles>;
}

export function GrimoireTopBar({
  day,
  phase,
  daySubPhase,
  activeWhispersCount,
  slayerWaitingAck,
  totalChatUnread,
  onWhispersPress,
  onNominatePress,
  onSlayerForceAck,
  onDictionaryPress,
  onChatPress,
  onLogPress,
  onMenuPress,
  styles,
}: GrimoireTopBarProps) {
  return (
    <View style={styles.topBar}>
      <Text style={styles.dayText}>{day}일차</Text>
      <View style={styles.topBarRight}>
        {phase === 'day' && daySubPhase === 'whisper' && (
          <Pressable onPress={onWhispersPress} style={styles.whisperButton}>
            <Text style={styles.whisperButtonText}>
              밀담 {activeWhispersCount > 0 ? `(${activeWhispersCount})` : ''}
            </Text>
          </Pressable>
        )}
        {IS_DEV && phase === 'day' && daySubPhase === 'nomination' && (
          <Pressable onPress={onNominatePress} style={styles.nominateButton}>
            <Text style={styles.nominateText}>지목 (수동)</Text>
          </Pressable>
        )}
        {IS_DEV && slayerWaitingAck && (
          <Pressable
            onPress={onSlayerForceAck}
            style={[styles.nominateButton, { backgroundColor: '#7a2a2a' }]}
          >
            <Text style={styles.nominateText}>처단자 강제확인</Text>
          </Pressable>
        )}
        <Pressable onPress={onDictionaryPress} style={styles.logButton}>
          <Text style={styles.logText}>사전</Text>
        </Pressable>
        <Pressable onPress={onChatPress} style={styles.logButton}>
          <Text style={styles.logText}>
            채팅{totalChatUnread > 0 ? ` (${totalChatUnread})` : ''}
          </Text>
        </Pressable>
        <Pressable onPress={onLogPress} style={styles.logButton}>
          <Text style={styles.logText}>로그</Text>
        </Pressable>
        <Pressable onPress={onMenuPress} style={styles.menuButton}>
          <Text style={styles.menuText}>메뉴</Text>
        </Pressable>
      </View>
    </View>
  );
}
