import { CountdownTimer } from '@clocktower/ui';
import { Pressable, Text, View } from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { styles } from '../../styles/game.styles';

interface NominationPhaseProps {
  visible: boolean;
  isAlive: boolean;
  hasNominatedToday: boolean;
  executionHappenedToday: boolean;
  votingMode?: 'online' | 'offline';
  onOpenNominate: () => void;
  hasTravellers?: boolean;
  onOpenExile?: () => void;
}

export function NominationPhase({
  visible,
  isAlive,
  hasNominatedToday,
  executionHappenedToday,
  votingMode,
  onOpenNominate,
  hasTravellers,
  onOpenExile,
}: NominationPhaseProps) {
  const isDead = !isAlive;
  const nominationClock = usePlayerStore((s) => s.nominationClock);
  const nominationPaused = usePlayerStore((s) => s.nominationPaused);
  if (!visible) return null;

  if (votingMode === 'offline') {
    return (
      <View style={styles.phaseContent}>
        <Text style={[styles.dayTitle, isDead && styles.dayTitleDead]}>
          지목
        </Text>
        <Text style={styles.phaseDescription}>
          투표는 오프라인으로 진행됩니다.{'\n'}진행자의 안내를 따라주세요.
        </Text>
      </View>
    );
  }

  const canNominate = isAlive && !hasNominatedToday && !executionHappenedToday;

  return (
    <View style={styles.phaseContent}>
      <Text style={[styles.dayTitle, isDead && styles.dayTitleDead]}>지목</Text>
      {nominationClock && !nominationPaused && (
        <CountdownTimer
          startedAt={nominationClock.startedAt}
          durationMs={nominationClock.durationMs}
        />
      )}
      <Text style={styles.phaseDescription}>
        처형할 플레이어를 지목하세요.{'\n'}하루에 한 번 지목할 수 있습니다.
      </Text>
      {isAlive && canNominate && (
        <Pressable style={styles.nominateButton} onPress={onOpenNominate}>
          <Text style={styles.nominateButtonText}>지목하기</Text>
        </Pressable>
      )}
      {hasTravellers && onOpenExile && (
        <Pressable
          style={[
            styles.nominateButton,
            {
              backgroundColor: '#2a1e2e',
              borderColor: '#4a2e5a',
              marginTop: 8,
            },
          ]}
          onPress={onOpenExile}
        >
          <Text style={[styles.nominateButtonText, { color: '#b07cc6' }]}>
            여행자 추방 제안
          </Text>
        </Pressable>
      )}
      {isAlive && executionHappenedToday && (
        <View style={styles.nominatedBadge}>
          <Text style={styles.nominatedText}>오늘 처형이 집행되었습니다</Text>
        </View>
      )}
      {isAlive && !executionHappenedToday && hasNominatedToday && (
        <View style={styles.nominatedBadge}>
          <Text style={styles.nominatedText}>오늘 지목을 사용했습니다</Text>
        </View>
      )}
      {!isAlive && (
        <Text style={styles.phaseDescriptionSub}>
          사망한 플레이어는 지목할 수 없습니다.
        </Text>
      )}
    </View>
  );
}
