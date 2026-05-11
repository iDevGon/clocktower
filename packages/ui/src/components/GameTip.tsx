import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface GameTipProps {
  tip: string;
  color?: string;
  glowColor?: string;
  delay?: number;
}

const TIP_BLUE = '#5a9ecf';
const TIP_GLOW = '#3a7abf';

export function GameTip({
  tip,
  color = TIP_BLUE,
  glowColor = TIP_GLOW,
  delay = 0,
}: GameTipProps) {
  const styles = useMemo(
    () => ({
      tipText: {
        color,
        fontSize: 12,
        fontStyle: 'italic' as const,
        textAlign: 'center' as const,
        lineHeight: 18,
        textShadowColor: glowColor,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
      },
      icon: {
        color,
        fontSize: 11,
        textShadowColor: glowColor,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
    }),
    [color, glowColor],
  );

  const glowBg = useMemo(() => {
    // glowColor hex → rgba(r,g,b, 0.06)
    const hex = glowColor.replace('#', '');
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.06)`;
  }, [glowColor]);

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(600)}
      style={s.container}
    >
      <View style={[s.glowWrap, { backgroundColor: glowBg }]}>
        <View style={s.tipRow}>
          <Text style={styles.icon}>TIP</Text>
          <View
            style={[
              s.tipDivider,
              { backgroundColor: color, shadowColor: glowColor },
            ]}
          />
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
    borderRadius: 4,
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
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
