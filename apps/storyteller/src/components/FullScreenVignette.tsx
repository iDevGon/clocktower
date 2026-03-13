import { LinearGradient } from 'expo-linear-gradient';
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

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface FullScreenVignetteProps {
  color: string;
  opacityRange: [number, number];
  duration: number;
}

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
      <AnimatedLinearGradient
        colors={stops}
        locations={locs}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFill, style]}
        pointerEvents="none"
      />
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
