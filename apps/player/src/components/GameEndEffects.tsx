import { useEffect } from 'react';
import { Dimensions } from 'react-native';
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
import { FullScreenVignette } from '@clocktower/shared';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Blood Drip (defeat) ──

function BloodDrip({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const x = ((index * 37 + 13) % 100) * (SCREEN_WIDTH / 100);
  const dripWidth = 3 + (index % 4) * 2;
  const dripHeight = SCREEN_HEIGHT * (0.3 + (index % 5) * 0.14);
  const delay = (index * 180) % 2400;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 2800 + (index % 3) * 600,
        easing: Easing.in(Easing.quad),
      }),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, index]);

  const style = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, dripHeight]),
    opacity: interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.9, 0.7, 0.4]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: x,
          width: dripWidth,
          borderBottomLeftRadius: dripWidth,
          borderBottomRightRadius: dripWidth,
          backgroundColor: '#8b0000',
        },
        style,
      ]}
    />
  );
}

function BloodPool({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const x = ((index * 53 + 7) % 100) * (SCREEN_WIDTH / 100);
  const poolWidth = 20 + (index % 4) * 15;
  const delay = 1800 + ((index * 300) % 1500);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, poolWidth]),
    height: interpolate(progress.value, [0, 1], [0, poolWidth * 0.3]),
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.6, 0.35]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: x - poolWidth / 2,
          borderRadius: poolWidth,
          backgroundColor: '#6b0000',
        },
        style,
      ]}
    />
  );
}

// ── Victory Particle ──

function VictoryParticle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const startX = ((index * 41 + 17) % 100) * (SCREEN_WIDTH / 100);
  const startY = SCREEN_HEIGHT * 0.7 + (index % 5) * 40;
  const driftX = (index % 2 === 0 ? 1 : -1) * (10 + (index % 7) * 8);
  const size = 3 + (index % 4) * 2;
  const delay = (index * 120) % 3000;
  const duration = 3000 + (index % 4) * 800;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -startY * 0.8]) },
      {
        translateX: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, driftX, driftX * 1.5],
        ),
      },
      { scale: interpolate(progress.value, [0, 0.3, 0.7, 1], [0, 1.2, 1, 0]) },
    ],
    opacity: interpolate(progress.value, [0, 0.15, 0.6, 1], [0, 1, 0.8, 0]),
  }));

  const colors = ['#4da6ff', '#80c0ff', '#b3d9ff', '#3399ff', '#cce5ff'];
  const color = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: startY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// ── Slayer Spark (golden burst particle) ──

function SlayerSpark({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT * 0.25;
  const angle = (index / 32) * 2 * Math.PI + (index * 137.5 * Math.PI) / 180;
  const distance = 40 + (index % 6) * 50;
  const size = 2 + (index % 5) * 2;
  const delay = (index * 60) % 1800;
  const duration = 1800 + (index % 4) * 600;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [0, Math.cos(angle) * distance],
        ),
      },
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [0, Math.sin(angle) * distance],
        ),
      },
      { scale: interpolate(progress.value, [0, 0.15, 0.5, 1], [0, 1.8, 1, 0]) },
    ],
    opacity: interpolate(progress.value, [0, 0.1, 0.4, 1], [0, 1, 0.7, 0]),
  }));

  const colors = ['#ffd700', '#ffb300', '#ff8c00', '#ffe066', '#fff5cc'];
  const color = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: centerX,
          top: centerY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

// ── Slayer Glow (golden radial) ──

function SlayerGlow() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.1, 0.3]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.2]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: SCREEN_WIDTH * 1.5,
          height: SCREEN_WIDTH * 1.5,
          borderRadius: SCREEN_WIDTH * 0.75,
          backgroundColor: '#b8860b',
          top: SCREEN_HEIGHT * 0.15 - SCREEN_WIDTH * 0.75,
          left: SCREEN_WIDTH * 0.5 - SCREEN_WIDTH * 0.75,
        },
        style,
      ]}
    />
  );
}

// ── Radial Glow (victory) ──

function VictoryGlow() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.08, 0.2]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.9, 1.1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: SCREEN_WIDTH * 1.5,
          height: SCREEN_WIDTH * 1.5,
          borderRadius: SCREEN_WIDTH * 0.75,
          backgroundColor: '#1a7aff',
          top: SCREEN_HEIGHT * 0.15 - SCREEN_WIDTH * 0.75,
          left: SCREEN_WIDTH * 0.5 - SCREEN_WIDTH * 0.75,
        },
        style,
      ]}
    />
  );
}

// ── Effects layers ──

const DRIP_COUNT = 18;
const POOL_COUNT = 6;
const PARTICLE_COUNT = 24;
const SPARK_COUNT = 32;

export function SlayerEffects() {
  return (
    <>
      <SlayerGlow />
      {Array.from({ length: SPARK_COUNT }).map((_, i) => (
        <SlayerSpark key={`sk-${i}`} index={i} />
      ))}
    </>
  );
}

export function VictoryEffects() {
  return (
    <>
      <VictoryGlow />
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <VictoryParticle key={`p-${i}`} index={i} />
      ))}
    </>
  );
}

export function DefeatEffects() {
  return (
    <>
      <FullScreenVignette
        color="#1a0000"
        opacityRange={[0.3, 0.6]}
        duration={3000}
      />
      {Array.from({ length: DRIP_COUNT }).map((_, i) => (
        <BloodDrip key={`d-${i}`} index={i} />
      ))}
      {Array.from({ length: POOL_COUNT }).map((_, i) => (
        <BloodPool key={`bp-${i}`} index={i} />
      ))}
    </>
  );
}
