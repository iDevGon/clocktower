import { FullScreenVignette } from '@clocktower/ui';
import { useEffect } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { BaseOverlay } from './BaseOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Smoke particles (rising and dissolving) ──

function SmokeWisp({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const centerX = SCREEN_WIDTH / 2;
  const startX =
    centerX + (((index * 37 + 11) % 80) - 40) * (SCREEN_WIDTH / 200);
  const startY = SCREEN_HEIGHT * 0.48 + (index % 5) * 15;
  const driftX = (index % 2 === 0 ? 1 : -1) * (8 + (index % 7) * 5);
  const size = 6 + (index % 4) * 4;
  const delay = (index * 280) % 2800;
  const duration = 2800 + (index % 5) * 500;

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
        translateY: interpolate(
          progress.value,
          [0, 1],
          [0, -SCREEN_HEIGHT * 0.25],
        ),
      },
      {
        translateX: interpolate(
          progress.value,
          [0, 0.3, 0.6, 1],
          [0, driftX * 0.3, driftX * 0.8, driftX * 1.4],
        ),
      },
      {
        scale: interpolate(
          progress.value,
          [0, 0.15, 0.4, 0.7, 1],
          [0.2, 1, 1.8, 2.5, 3],
        ),
      },
    ],
    opacity: interpolate(
      progress.value,
      [0, 0.1, 0.3, 0.6, 1],
      [0, 0.35, 0.25, 0.1, 0],
    ),
  }));

  const colors = ['#6a7a8a', '#7a8a98', '#5a6a7a', '#8090a0', '#4a5a6a'];
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

// ── Gun icon with recoil + smoke puff ──

function GunIcon() {
  const recoil = useSharedValue(0);
  const smokeOpacity = useSharedValue(0);

  useEffect(() => {
    // Short recoil kick
    recoil.value = withDelay(
      300,
      withSequence(
        withTiming(-12, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(4, { duration: 120, easing: Easing.out(Easing.back(2)) }),
        withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) }),
      ),
    );
    // Arrow miss — flies right and fades out (반복 테스트)
    smokeOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 500 }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(recoil);
      cancelAnimation(smokeOpacity);
    };
  }, [recoil, smokeOpacity]);

  const gunStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: recoil.value },
      { rotate: `${recoil.value * 0.5}deg` },
    ],
    opacity: interpolate(recoil.value, [-12, -8], [0.8, 1], 'clamp'),
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: smokeOpacity.value,
    transform: [
      { translateY: interpolate(smokeOpacity.value, [1, 0], [15, -20]) },
      { scale: interpolate(smokeOpacity.value, [1, 0], [0.3, 1.2]) },
    ],
  }));

  return (
    <View style={styles.gunContainer}>
      <Animated.Text style={[styles.gunText, gunStyle]}>
        {'\uD83C\uDFF9'}
      </Animated.Text>
      <Animated.Text style={[styles.arrowText, arrowStyle]}>
        {'\uD83D\uDCAB'}
      </Animated.Text>
    </View>
  );
}

// ── Horizontal dissolve line ──

function DissolveLine() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      700,
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.sin) }),
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, SCREEN_WIDTH * 0.55]),
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.8, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          height: 1,
          backgroundColor: '#4a5a6a',
          marginVertical: 18,
          alignSelf: 'center',
        },
        style,
      ]}
    />
  );
}

const SMOKE_COUNT = 8;

// ── Effects layer ──

function FizzleEffects() {
  return (
    <>
      <FullScreenVignette
        color="#080c12"
        opacityRange={[0.6, 0.75]}
        duration={3000}
      />
      {Array.from({ length: SMOKE_COUNT }).map((_, i) => (
        <SmokeWisp key={`s-${i}`} index={i} />
      ))}
    </>
  );
}

// ── Main Overlay ──

interface SlayerFizzleOverlayProps {
  slayerName: string;
  targetName: string;
  onDismiss: () => void;
}

export function SlayerFizzleOverlay({
  slayerName,
  targetName,
  onDismiss,
}: SlayerFizzleOverlayProps) {
  useEffect(() => {
    // Muffled vibration — a dull thud, not a sharp crack
    Vibration.vibrate([0, 60, 80, 40]);
  }, []);

  return (
    <BaseOverlay
      backgroundColor="#060a10"
      zIndex={94}
      effectsLayer={<FizzleEffects />}
      onDismiss={onDismiss}
    >
      <View style={styles.content}>
        <GunIcon />

        <Animated.Text
          entering={FadeIn.delay(500).duration(500)}
          style={styles.label}
        >
          {'\uBD88\uBC1C'}
        </Animated.Text>

        <DissolveLine />

        <Animated.Text
          entering={FadeIn.delay(800).duration(600)}
          style={styles.nameText}
        >
          {slayerName}
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(1000).duration(500)}
          style={styles.targetBadge}
        >
          <Text style={styles.targetLabel}>{targetName}에게 발사</Text>
        </Animated.View>

        <Animated.Text
          entering={FadeIn.delay(1300).duration(700)}
          style={styles.fizzleText}
        >
          화살이 발사되었으나{'\n'}아무 일도 일어나지 않았습니다
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(1800).duration(600)}
          style={styles.hintBadge}
        >
          <Text style={styles.hintText}>
            {'처단자가 아님 · 대상이 악마가 아님 · 능력 무효'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(2200).duration(500)}>
          <Pressable style={styles.confirmButton} onPress={onDismiss}>
            <Text style={styles.confirmText}>확인</Text>
          </Pressable>
        </Animated.View>
      </View>
    </BaseOverlay>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  gunContainer: {
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gunText: {
    fontSize: 52,
  },
  arrowText: {
    fontSize: 28,
    position: 'absolute',
    right: -8,
    top: -4,
  },
  label: {
    fontSize: 11,
    letterSpacing: 12,
    color: '#4a5a6a',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#8a9aaa',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(100, 140, 180, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  targetBadge: {
    backgroundColor: 'rgba(74, 90, 106, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 90, 106, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  targetLabel: {
    fontSize: 14,
    color: '#6a7a8a',
    fontWeight: '600',
  },
  fizzleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5a6878',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  hintBadge: {
    backgroundColor: 'rgba(60, 70, 85, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(60, 70, 85, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: {
    fontSize: 11,
    color: '#3e4e5e',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  confirmButton: {
    marginTop: 28,
    backgroundColor: 'rgba(74, 90, 106, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(74, 90, 106, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
  },
  confirmText: {
    fontSize: 15,
    color: '#8a9aaa',
    fontWeight: '600',
    textAlign: 'center',
  },
});
