import type { Phase } from '@clocktower/shared';
import { WaxSeal } from '@clocktower/ui';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface PhaseSealProps {
  phase: Phase;
  centerX: number;
  centerY: number;
  size?: number;
}

const PHASE_CONFIG: Record<
  Phase,
  {
    tone: 'crimson' | 'amber' | 'twilight' | 'verdure' | 'bruise';
    glyph: 'star' | 'moon' | 'clock' | 'lily' | 'bat' | 'blank';
  }
> = {
  setup: { tone: 'bruise', glyph: 'star' },
  night: { tone: 'twilight', glyph: 'moon' },
  day: { tone: 'amber', glyph: 'clock' },
  vote: { tone: 'crimson', glyph: 'bat' },
  ended: { tone: 'verdure', glyph: 'lily' },
};

/**
 * 그리모어 중앙 페이즈 실링 — 투표 클럭이 없을 때 중앙을 채우는
 * 상징적 장식. 페이즈 전환 시 은은하게 pulse.
 */
export function PhaseSeal({
  phase,
  centerX,
  centerY,
  size = 120,
}: PhaseSealProps) {
  const { tone, glyph } = PHASE_CONFIG[phase] ?? PHASE_CONFIG.setup;

  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.15,
    transform: [{ scale: 0.97 + pulse.value * 0.04 }],
  }));

  return (
    <View
      style={[
        styles.root,
        {
          left: centerX - size / 2,
          top: centerY - size / 2,
          width: size,
          height: size,
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View style={style}>
        <WaxSeal size={size} tone={tone} glyph={glyph} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
