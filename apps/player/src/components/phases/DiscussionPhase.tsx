import { CountdownTimer } from '@clocktower/ui';
import { Text, View } from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { styles } from '../../styles/game.styles';

interface DiscussionPhaseProps {
  visible: boolean;
}

export function DiscussionPhase({ visible }: DiscussionPhaseProps) {
  const isDead = !usePlayerStore((s) => s.isAlive);
  const discussionClock = usePlayerStore((s) => s.discussionClock);
  if (!visible) return null;
  return (
    <View style={styles.phaseContent}>
      <Text style={[styles.dayTitle, isDead && styles.dayTitleDead]}>
        공개 토론
      </Text>
      {discussionClock && (
        <CountdownTimer
          startedAt={discussionClock.startedAt}
          durationMs={discussionClock.durationMs}
        />
      )}
      <Text style={styles.phaseDescription}>
        마을 사람들과 공개적으로 토론하세요.{'\n'}정보를 공유하고, 의심하고,
        변호하세요.
      </Text>
    </View>
  );
}
