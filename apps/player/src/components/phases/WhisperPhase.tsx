import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { useWhisperStore } from '../../stores/whisperStore';
import { styles } from '../../styles/game.styles';
import { whisperStyles } from '../PhaseContent.styles';

function useWhisperCountdown() {
  const whisperClock = usePlayerStore((s) => s.whisperClock);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!whisperClock) {
      setRemaining(null);
      return;
    }
    const update = () => {
      const elapsed = Date.now() - whisperClock.startedAt;
      const left = Math.max(
        0,
        Math.ceil((whisperClock.durationMs - elapsed) / 1000),
      );
      setRemaining(left);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [whisperClock]);

  return remaining;
}

interface WhisperPhaseProps {
  visible: boolean;
  totalUnread: number;
  whisperMode?: 'chat' | 'offline';
  onOpenWhisper: () => void;
}

export function WhisperPhase({
  visible,
  totalUnread,
  whisperMode,
  onOpenWhisper,
}: WhisperPhaseProps) {
  const activeWhispers = useWhisperStore((s) => s.activeWhispers);
  const remaining = useWhisperCountdown();
  const isDead = !usePlayerStore((s) => s.isAlive);

  if (!visible) return null;

  if (whisperMode === 'offline') {
    return (
      <View style={styles.phaseContent}>
        <Text style={[styles.dayTitle, isDead && styles.dayTitleDead]}>
          밀담 시간
        </Text>
        <Text style={styles.phaseDescription}>
          밀담은 직접 대면으로 진행하세요.
        </Text>
      </View>
    );
  }

  const minutes = remaining !== null ? Math.floor(remaining / 60) : 0;
  const seconds = remaining !== null ? remaining % 60 : 0;

  const isExpired = remaining === 0;

  return (
    <View style={styles.phaseContent}>
      <Text
        style={[
          styles.dayTitle,
          isDead && styles.dayTitleDead,
          isExpired && whisperStyles.expiredTitle,
        ]}
      >
        {isExpired ? '밀담 시간 종료' : '밀담 시간'}
      </Text>
      {remaining !== null && remaining > 0 && (
        <Text
          style={[
            whisperStyles.countdownText,
            remaining <= 10 && whisperStyles.countdownUrgent,
          ]}
        >
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
      )}
      {!isExpired && (
        <Text style={styles.phaseDescription}>
          다른 플레이어와 자유롭게 대화하세요.
        </Text>
      )}
      <Pressable
        style={[styles.whisperButton, isDead && styles.whisperButtonDead]}
        onPress={onOpenWhisper}
      >
        <Text
          style={[
            styles.whisperButtonText,
            isDead && styles.whisperButtonTextDead,
          ]}
        >
          밀담
        </Text>
        {totalUnread > 0 && (
          <View
            style={[styles.whisperBadge, isDead && styles.whisperBadgeDead]}
          >
            <Text style={styles.whisperBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </Pressable>
      {activeWhispers.length > 0 && (
        <View style={whisperStyles.activePanel}>
          <Text style={whisperStyles.activePanelTitle}>진행 중인 밀담</Text>
          {activeWhispers.map((w) => (
            <Text key={w.conversationId} style={whisperStyles.activePanelItem}>
              {w.participantNames.join(' ↔ ')}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
