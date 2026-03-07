import type { Phase } from '@clocktower/shared';
import { StyleSheet, Text, View } from 'react-native';

const PHASE_CONFIG: Record<
  Phase,
  { label: string; color: string; dotColor: string }
> = {
  setup: { label: '준비', color: '#908e8a', dotColor: '#908e8a' },
  night: { label: '밤', color: '#8090c0', dotColor: '#8090c0' },
  day: { label: '낮', color: '#c4a050', dotColor: '#c4a050' },
  vote: { label: '투표', color: '#c47070', dotColor: '#c47070' },
  ended: { label: '게임 종료', color: '#b85c5c', dotColor: '#b85c5c' },
};

interface PhaseIndicatorProps {
  phase: Phase;
}

export function PhaseIndicator({ phase }: PhaseIndicatorProps) {
  const config = PHASE_CONFIG[phase];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: config.dotColor }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
