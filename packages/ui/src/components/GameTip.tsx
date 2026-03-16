import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface GameTipProps {
  tip: string;
  color?: string;
  delay?: number;
}

export function GameTip({ tip, color = '#4a5a6a', delay = 0 }: GameTipProps) {
  const styles = useMemo(
    () => ({
      tipText: {
        color,
        fontSize: 12,
        fontStyle: 'italic' as const,
        textAlign: 'center' as const,
        lineHeight: 18,
      },
      icon: {
        color,
        fontSize: 11,
      },
    }),
    [color],
  );

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(600)}
      style={s.container}
    >
      <View style={s.tipRow}>
        <Text style={styles.icon}>TIP</Text>
        <View style={[s.tipDivider, { backgroundColor: color }]} />
        <Text style={styles.tipText}>{tip}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 24,
    maxWidth: 320,
  },
  tipRow: {
    alignItems: 'center',
    gap: 6,
  },
  tipDivider: {
    width: 24,
    height: 1,
    opacity: 0.4,
    marginBottom: 2,
  },
});
