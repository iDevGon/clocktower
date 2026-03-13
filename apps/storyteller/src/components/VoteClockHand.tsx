import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useGameStore } from '../stores/gameStore';
import { COLORS, styles } from './VoteClockHand.styles';

// Pre-generated smoke particle configurations
const SMOKE_COUNT = 10;
const SMOKE_CONFIGS = Array.from({ length: SMOKE_COUNT }, (_, i) => {
  const baseAngle = (i / SMOKE_COUNT) * 360;
  const jitter = (Math.random() - 0.5) * (360 / SMOKE_COUNT) * 0.7;
  return {
    angle: baseAngle + jitter,
    delay: Math.random() * 3000,
    duration: 2200 + Math.random() * 1800,
    sizeFactor: 0.04 + Math.random() * 0.05,
    driftFactor: 0.12 + Math.random() * 0.15,
    lateralDrift: (Math.random() - 0.5) * 0.08,
    maxOpacity: 0.12 + Math.random() * 0.15,
  };
});

function SmokeParticle({
  config,
  centerX,
  centerY,
  circleRadius,
}: {
  config: (typeof SMOKE_CONFIGS)[0];
  centerX: number;
  centerY: number;
  circleRadius: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: config.duration,
            easing: Easing.out(Easing.cubic),
          }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
      ),
    );
  }, []);

  const rad = (config.angle * Math.PI) / 180;
  const size = circleRadius * config.sizeFactor;
  const drift = circleRadius * config.driftFactor;
  const lateral = circleRadius * config.lateralDrift;
  const borderR = circleRadius + 1;
  const baseX = centerX + borderR * Math.cos(rad) - size / 2;
  const baseY = centerY + borderR * Math.sin(rad) - size / 2;
  const outX = Math.cos(rad) * drift + Math.sin(rad) * lateral;
  const outY = Math.sin(rad) * drift - Math.cos(rad) * lateral;
  const maxOp = config.maxOpacity;

  const animStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const fade =
      p < 0.15 ? (p / 0.15) * maxOp : maxOp * (1 - (p - 0.15) / 0.85);
    return {
      opacity: Math.max(0, fade),
      transform: [
        { translateX: outX * p },
        { translateY: outY * p },
        { scale: 1 + p * 0.7 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: baseX,
          top: baseY,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: COLORS.smoke,
          shadowColor: COLORS.smoke,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: size,
        },
        animStyle,
      ]}
    />
  );
}

interface VoteClockHandProps {
  nomineeIndex: number;
  totalPlayers: number;
  centerX: number;
  centerY: number;
  radius: number;
}

export function VoteClockHand({
  nomineeIndex,
  totalPlayers,
  centerX,
  centerY,
  radius,
}: VoteClockHandProps) {
  const voteClock = useGameStore((s) => s.voteClock);
  const handAngleSV = useSharedValue(0);

  const nomineeAngle =
    totalPlayers > 0 ? (nomineeIndex / totalPlayers) * 360 : 0;
  // Offset by half a player slot so the hand passes through each player's
  // center at the midpoint of their voting window, not at the end.
  const halfSlot = totalPlayers > 0 ? 180 / totalPlayers : 0;

  useEffect(() => {
    if (!voteClock) {
      cancelAnimation(handAngleSV);
      handAngleSV.value = nomineeAngle + halfSlot;
      return;
    }

    const elapsed = Date.now() - voteClock.startedAt;
    const initialProgress = Math.min(elapsed / voteClock.durationMs, 1);
    const remainingMs = (1 - initialProgress) * voteClock.durationMs;

    cancelAnimation(handAngleSV);
    handAngleSV.value = nomineeAngle + halfSlot + initialProgress * 360;
    if (remainingMs > 0) {
      handAngleSV.value = withTiming(nomineeAngle + halfSlot + 360, {
        duration: remainingMs,
        easing: Easing.linear,
      });
    }
  }, [voteClock, nomineeAngle, halfSlot]);

  const daggerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${handAngleSV.value}deg` }],
  }));

  const handLength = radius * 0.85;

  // Dagger proportions based on handLength
  const daggerW = 24;
  const tipH = Math.round(handLength * 0.1);
  const bladeW = 6;
  const bladeH = Math.round(handLength * 0.5);
  const crossguardW = 18;
  const crossguardH = 3;
  const gripW = 3.5;
  const gripH = handLength - tipH - bladeH - crossguardH - 3;
  const pommelSize = 6;

  // Memoize smoke particle elements
  const smokeElements = useMemo(
    () =>
      SMOKE_CONFIGS.map((config, i) => (
        <SmokeParticle
          key={`smoke-${i}`}
          config={config}
          centerX={centerX}
          centerY={centerY}
          circleRadius={radius}
        />
      )),
    [centerX, centerY, radius],
  );

  return (
    <View style={[StyleSheet.absoluteFill, styles.pointerEventsNone]}>
      {/* Smoke particles — only when clock is active */}
      {voteClock && smokeElements}

      {/* Dagger hand */}
      <Animated.View
        style={[
          styles.daggerContainer,
          {
            left: centerX - daggerW / 2,
            top: centerY - handLength,
            width: daggerW,
            height: handLength,
            transformOrigin: `${daggerW / 2}px ${handLength}px`,
          },
          daggerStyle,
        ]}
      >
        {/* Blade tip */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            alignSelf: 'center',
            width: 0,
            height: 0,
            borderLeftWidth: bladeW / 2,
            borderRightWidth: bladeW / 2,
            borderBottomWidth: tipH,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: COLORS.daggerBlade,
            zIndex: 2,
          }}
        />
        {/* Blade body */}
        <View
          style={{
            position: 'absolute',
            top: tipH,
            alignSelf: 'center',
            width: bladeW,
            height: bladeH,
            backgroundColor: COLORS.daggerBlade,
            borderWidth: 0.5,
            borderColor: COLORS.daggerEdge,
            borderTopWidth: 0,
            zIndex: 2,
          }}
        />
        {/* Blood groove */}
        <View
          style={{
            position: 'absolute',
            top: tipH + 6,
            alignSelf: 'center',
            width: 1.5,
            height: bladeH - 10,
            backgroundColor: '#3a0f14',
            borderRadius: 1,
            zIndex: 3,
          }}
        />
        {/* Crossguard */}
        <View
          style={{
            position: 'absolute',
            top: tipH + bladeH,
            alignSelf: 'center',
            width: crossguardW,
            height: crossguardH,
            backgroundColor: COLORS.daggerCrossguard,
            borderRadius: 1,
            borderWidth: 0.5,
            borderColor: COLORS.daggerCrossguardEdge,
            zIndex: 2,
          }}
        />
        {/* Grip */}
        <View
          style={{
            position: 'absolute',
            top: tipH + bladeH + crossguardH + 1,
            alignSelf: 'center',
            width: gripW,
            height: gripH,
            backgroundColor: COLORS.daggerGrip,
            borderRadius: 1.5,
            zIndex: 2,
          }}
        />
        {/* Pommel */}
        <View
          style={{
            position: 'absolute',
            top: handLength - pommelSize,
            alignSelf: 'center',
            width: pommelSize,
            height: pommelSize,
            borderRadius: pommelSize / 2,
            backgroundColor: COLORS.daggerPommel,
            borderWidth: 0.5,
            borderColor: COLORS.daggerPommelEdge,
            zIndex: 2,
          }}
        />
      </Animated.View>

      {/* Center hub */}
      <View
        style={[
          styles.centerHub,
          {
            left: centerX - 10,
            top: centerY - 10,
          },
        ]}
      >
        <View style={styles.centerDot} />
      </View>
    </View>
  );
}
