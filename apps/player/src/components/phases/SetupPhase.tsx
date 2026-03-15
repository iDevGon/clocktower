import { Text, View } from 'react-native';
import { styles } from '../../styles/game.styles';

interface SetupPhaseProps {
  visible: boolean;
}

export function SetupPhase({ visible }: SetupPhaseProps) {
  if (!visible) return null;
  return (
    <View style={styles.phaseContentLarge}>
      <Text style={styles.setupTitle}>게임 시작을 기다리는 중...</Text>
      <Text style={styles.setupSubtitle}>
        진행자가 게임을 준비하고 있습니다
      </Text>
    </View>
  );
}
