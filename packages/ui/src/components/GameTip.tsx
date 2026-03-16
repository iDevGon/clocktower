import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface GameTipProps {
  tip: string;
  color?: string;
  delay?: number;
}

const TIP_BLUE = '#5a9ecf';
const TIP_GLOW = '#3a7abf';

export function GameTip({ tip, color = TIP_BLUE, delay = 0 }: GameTipProps) {
  const styles = useMemo(
    () => ({
      tipText: {
        color,
        fontSize: 12,
        fontStyle: 'italic' as const,
        textAlign: 'center' as const,
        lineHeight: 18,
        textShadowColor: TIP_GLOW,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
      },
      icon: {
        color,
        fontSize: 11,
        textShadowColor: TIP_GLOW,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
    }),
    [color],
  );

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(600)}
      style={s.container}
    >
      <View style={s.glowWrap}>
        <View style={s.tipRow}>
          <Text style={styles.icon}>TIP</Text>
          <View style={[s.tipDivider, { backgroundColor: color }]} />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
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
  glowWrap: {
    borderRadius: 8,
    backgroundColor: 'rgba(58, 122, 191, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    shadowColor: '#3a7abf',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
