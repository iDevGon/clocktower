import { FullScreenVignette } from '@clocktower/ui';
import { useEffect } from 'react';
import { StyleSheet, Text, Vibration, View } from 'react-native';
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

// ── Raven icon animation ──

function RavenIcon() {
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

  return <Animated.Text style={[s.iconText, style]}>🐦‍⬛</Animated.Text>;
}

// ── Feather particles ──

function FeatherParticle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const startX = ((index * 47 + 23) % 100) / 100;
  const startY = 0.2 + (index % 6) * 0.1;
  const drift = (index % 2 === 0 ? 1 : -1) * (15 + (index % 4) * 10);
  const size = 30 + (index % 4) * 15;
  const delay = (index * 350) % 3000;
  const duration = 3500 + (index % 3) * 800;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.08, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, drift]) },
      { translateY: interpolate(progress.value, [0, 0.5, 1], [0, 20, 0]) },
      { scale: interpolate(progress.value, [0, 0.5, 1], [0.8, 1.2, 0.8]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${startX * 100}%` as unknown as number,
          top: `${startY * 100}%` as unknown as number,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#40a0a0',
        },
        style,
      ]}
    />
  );
}

const FEATHER_COUNT = 8;

function RavenkeeperEffects() {
  return (
    <>
      <FullScreenVignette
        color="#041515"
        opacityRange={[0.6, 0.8]}
        duration={3000}
      />
      {Array.from({ length: FEATHER_COUNT }).map((_, i) => (
        <FeatherParticle key={`f-${i}`} index={i} />
      ))}
    </>
  );
}

// ── Divider line ──

function DividerLine() {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(
      500,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }),
    );
    return () => cancelAnimation(width);
  }, [width]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(width.value, [0, 1], [0, 200]),
    opacity: interpolate(width.value, [0, 0.3, 1], [0, 0.8, 0.5]),
  }));

  return (
    <Animated.View
      style={[
        {
          height: 1,
          backgroundColor: '#40a0a0',
          alignSelf: 'center',
          marginVertical: 16,
        },
        style,
      ]}
    />
  );
}

// ── Main Overlay ──

interface RavenkeeperOverlayProps {
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 4500;

export function RavenkeeperOverlay({ onDismiss }: RavenkeeperOverlayProps) {
  useEffect(() => {
    Vibration.vibrate([0, 200, 100, 400, 150, 300]);
  }, []);

  return (
    <BaseOverlay
      backgroundColor="#040e10"
      zIndex={89}
      effectsLayer={<RavenkeeperEffects />}
      onDismiss={onDismiss}
      dismissOnBackdropPress
      dismissDelayMs={2500}
      autoDismissMs={AUTO_DISMISS_MS}
      fadeOutDurationMs={800}
    >
      <View style={s.content}>
        <RavenIcon />

        <Animated.Text
          entering={FadeIn.delay(400).duration(500)}
          style={s.label}
        >
          까마귀지기
        </Animated.Text>

        <DividerLine />

        <Animated.Text
          entering={FadeIn.delay(800).duration(600)}
          style={s.title}
        >
          어둠 속에서 눈을 뜹니다
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(1200).duration(600)}
          style={s.subtitle}
        >
          죽음이 찾아왔으나,{'\n'}까마귀의 눈은 아직 감기지 않았습니다
        </Animated.Text>

        <Animated.View
          entering={FadeIn.delay(1600).duration(500)}
          style={s.abilityBadge}
        >
          <Text style={s.abilityText}>마지막 숨결로 진실을 꿰뚫으세요</Text>
        </Animated.View>

        <DividerLine />

        <Animated.Text
          entering={FadeIn.delay(2500).duration(500)}
          style={s.dismissHint}
        >
          터치하여 계속
        </Animated.Text>
      </View>
    </BaseOverlay>
  );
}

const s = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconText: {
    fontSize: 56,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    letterSpacing: 8,
    color: '#50b0b0',
    fontWeight: '300',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#60c8c8',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(80, 180, 180, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#50a8a8',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
  },
  abilityBadge: {
    backgroundColor: 'rgba(64, 160, 160, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(64, 160, 160, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  abilityText: {
    fontSize: 14,
    color: '#70c0c0',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  dismissHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#2a5a5a',
    letterSpacing: 1,
  },
});
