import type { DaySubPhase } from '@clocktower/shared';
import { Pressable, Text, View } from 'react-native';
import { styles } from './DaySubPhaseBar.styles';

const DAY_SUB_PHASES: { label: string; value: DaySubPhase }[] = [
  { label: '밀담', value: 'whisper' },
  { label: '공개 토론', value: 'discussion' },
  { label: '지목', value: 'nomination' },
];

interface DaySubPhaseBarProps {
  currentSubPhase: DaySubPhase | null;
  onSetSubPhase: (subPhase: DaySubPhase) => void;
}

export function DaySubPhaseBar({
  currentSubPhase,
  onSetSubPhase,
}: DaySubPhaseBarProps) {
  return (
    <View style={styles.subPhaseBar}>
      {DAY_SUB_PHASES.map(({ label, value }) => {
        const isActive = currentSubPhase === value;
        return (
          <Pressable
            key={value}
            onPress={() => onSetSubPhase(value)}
            style={[
              styles.subPhaseButton,
              isActive && styles.subPhaseButtonActive,
            ]}
          >
            <Text
              style={[
                styles.subPhaseLabel,
                isActive && styles.subPhaseLabelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
