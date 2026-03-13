import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface FullScreenVignetteProps {
  /** Background color of the overlay */
  color: string;
  /** [min, max] opacity range for the pulse animation */
  opacityRange: [number, number];
  /** Full pulse cycle duration in ms (one direction) */
  duration: number;
}

/**
 * Full-screen pulsing vignette overlay.
 * Used for atmospheric effects (death, execution, fizzle, defeat).
 */
export function FullScreenVignette({
  color,
  opacityRange,
  duration,
}: FullScreenVignetteProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, duration]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], opacityRange),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: color }, style]}
    />
  );
}
