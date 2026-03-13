import { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const { width: SW, height: SH } = Dimensions.get('window');

const AnimatedLinearGradient =
  Animated.createAnimatedComponent(LinearGradient);

interface FullScreenVignetteProps {
  /** Base tint color of the overlay (e.g. '#0d0500') */
  color: string;
  /** [min, max] opacity range for the pulse animation */
  opacityRange: [number, number];
  /** Half-cycle pulse duration in ms */
  duration: number;
}

/**
 * Full-screen smoky vignette overlay.
 * Simulates a radial vignette using 4 directional LinearGradients
 * that overlap to create dense edges fading to a transparent center.
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

  const stops: [string, string, ...string[]] = [
    color,
    `${color}cc`,
    `${color}66`,
    `${color}20`,
    'transparent',
  ];
  const locs: [number, number, ...number[]] = [0, 0.15, 0.35, 0.55, 0.8];

  return (
    <>
      {/* Top → center */}
      <AnimatedLinearGradient
        colors={stops}
        locations={locs}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, style]}
        pointerEvents="none"
      />
      {/* Bottom → center */}
      <AnimatedLinearGradient
        colors={stops}
        locations={locs}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={[StyleSheet.absoluteFill, style]}
        pointerEvents="none"
      />
    </>
  );
}
