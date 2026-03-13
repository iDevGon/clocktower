import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

interface ParticleConfig {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  color: string;
}

const PARTICLES: ParticleConfig[] = [
  { x: SW * 0.1, y: SH * 0.15, size: 180, delay: 0, duration: 12000, driftX: 30, driftY: -20, color: 'rgba(120, 20, 20, 0.12)' },
  { x: SW * 0.7, y: SH * 0.25, size: 200, delay: 3000, duration: 14000, driftX: -25, driftY: -15, color: 'rgba(100, 15, 15, 0.10)' },
  { x: SW * 0.3, y: SH * 0.7, size: 160, delay: 1500, duration: 11000, driftX: 20, driftY: -25, color: 'rgba(140, 25, 25, 0.14)' },
  { x: SW * 0.5, y: SH * 0.4, size: 120, delay: 2000, duration: 9000, driftX: 15, driftY: -30, color: 'rgba(80, 10, 10, 0.15)' },
  { x: SW * 0.9, y: SH * 0.4, size: 90, delay: 3500, duration: 8000, driftX: -15, driftY: -10, color: 'rgba(100, 15, 15, 0.09)' },
];

function Particle({ x, y, size, delay, duration, driftX, driftY, color }: ParticleConfig) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: duration * 0.5,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 1, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, driftX]) },
      { translateY: interpolate(progress.value, [0, 1], [0, driftY]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.7, 1.2, 0.7]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

export function SmokeParticles() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((p, i) => (
        <Particle key={i} {...p} />
      ))}
    </View>
  );
}
