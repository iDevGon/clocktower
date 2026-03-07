import type { Phase } from '@clocktower/shared';
import { Pressable, Text, View } from 'react-native';
import { styles } from './PhaseBar.styles';

const PHASES: { label: string; value: Phase }[] = [
  { label: '밤', value: 'night' },
  { label: '낮', value: 'day' },
  { label: '투표', value: 'vote' },
  { label: '종료', value: 'ended' },
];

const PHASE_BG_COLORS: Record<Phase, string> = {
  setup: '#242428',
  night: '#1e2038',
  day: '#302820',
  vote: '#301c22',
  ended: '#242428',
};

interface PhaseBarProps {
  currentPhase: Phase;
  onSetPhase: (phase: Phase) => void;
}

export function PhaseBar({ currentPhase, onSetPhase }: PhaseBarProps) {
  return (
    <View style={styles.bar}>
      {PHASES.map(({ label, value }) => {
        const isActive = currentPhase === value;
        return (
          <Pressable
            key={value}
            onPress={() => onSetPhase(value)}
            style={[
              styles.button,
              {
                backgroundColor: isActive ? PHASE_BG_COLORS[value] : '#1a1a1e',
              },
              isActive && styles.activeButton,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? '#e0ddd8' : '#5c5a58' },
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

