import { getRandomGameTip } from '@clocktower/shared';
import { FullScreenVignette, GameTip } from '@clocktower/ui';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { usePlayerStore } from '../stores/playerStore';
import { BaseOverlay } from './BaseOverlay';

// ── Moon icon ──

function MoonIcon() {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      200,
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.quad) }),
      ),
    );
    return () => cancelAnimation(scale);
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0, 0.3, 1], [0, 0.6, 1]),
  }));

  return <Animated.Text style={[s.moonText, style]}>🌙</Animated.Text>;
}

// ── Star particle ──

function StarParticle({ index }: { index: number }) {
  const opacity = useSharedValue(0);
  const x = ((index * 67 + 13) % 100) / 100;
  const y = ((index * 43 + 29) % 80) / 100;
  const size = 2 + (index % 3);
  const delay = 400 + ((index * 200) % 1500);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [opacity, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${x * 100}%` as unknown as number,
          top: `${y * 100}%` as unknown as number,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#c0c8e0',
        },
        style,
      ]}
    />
  );
}

const STAR_COUNT = 12;

function NightFallEffects() {
  return (
    <>
      <FullScreenVignette
        color="#040410"
        opacityRange={[0.5, 0.85]}
        duration={2500}
      />
      {Array.from({ length: STAR_COUNT }).map((_, i) => (
        <StarParticle key={`s-${i}`} index={i} />
      ))}
    </>
  );
}

// ── Divider ──

function DividerLine() {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      600,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
    );
    return () => cancelAnimation(width);
  }, [width]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(width.value, [0, 1], [0, 160]),
    opacity: interpolate(width.value, [0, 0.3, 1], [0, 0.8, 0.4]),
  }));

  return (
    <Animated.View
      style={[
        {
          height: 1,
          backgroundColor: '#4a5a8a',
          alignSelf: 'center',
          marginVertical: 14,
        },
        style,
      ]}
    />
  );
}

// ── Main Overlay ──

interface NightFallOverlayProps {
  onDismiss: () => void;
}

export function NightFallOverlay({ onDismiss }: NightFallOverlayProps) {
  const role = usePlayerStore((s) => s.role);
  const tip = useMemo(
    () => getRandomGameTip('night', role?.id, role?.team),
    [role?.id, role?.team],
  );

  return (
    <BaseOverlay
      backgroundColor="#04040e"
      zIndex={87}
      effectsLayer={<NightFallEffects />}
      onDismiss={onDismiss}
      dismissOnBackdropPress
      autoDismissMs={3500}
      fadeOutDurationMs={1000}
    >
      <View style={s.content}>
        <MoonIcon />

        <Animated.Text
          entering={FadeIn.delay(400).duration(500)}
          style={s.label}
        >
          밤이 찾아옵니다
        </Animated.Text>

        <DividerLine />

        <Animated.Text
          entering={FadeIn.delay(800).duration(600)}
          style={s.message}
        >
          모두 눈을 감으세요
        </Animated.Text>

        <GameTip tip={tip} color="#5a6a90" delay={1200} />
      </View>
    </BaseOverlay>
  );
}

const s = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  moonText: {
    fontSize: 56,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    letterSpacing: 8,
    color: '#6a7aaa',
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  message: {
    fontSize: 20,
    color: '#8a9ac0',
    fontWeight: '500',
    textAlign: 'center',
  },
});
