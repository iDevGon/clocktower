import { Pressable, Text, View } from 'react-native';
import { styles } from '../../styles/game.styles';

interface NominationPhaseProps {
  visible: boolean;
  isAlive: boolean;
  hasNominatedToday: boolean;
  executionHappenedToday: boolean;
  votingMode?: 'online' | 'offline';
  onOpenNominate: () => void;
}

export function NominationPhase({
  visible,
  isAlive,
  hasNominatedToday,
  executionHappenedToday,
  votingMode,
  onOpenNominate,
}: NominationPhaseProps) {
  const isDead = !isAlive;
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
      <Text style={styles.phaseDescription}>
        처형할 플레이어를 지목하세요.{'\n'}하루에 한 번 지목할 수 있습니다.
      </Text>
      {isAlive && canNominate && (
        <Pressable style={styles.nominateButton} onPress={onOpenNominate}>
          <Text style={styles.nominateButtonText}>지목하기</Text>
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
