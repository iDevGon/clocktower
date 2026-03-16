import { getRandomTipText } from '@clocktower/shared';
import { GameTip } from '@clocktower/ui';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const AUTO_DISMISS_MS = 8000;
const FADE_OUT_MS = 600;

function PulsingDot({ index }: { index: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * 300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(opacity);
  }, [opacity, index]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[s.dot, style]} />;
}

function CountdownRing({ durationMs }: { durationMs: number }) {
  const [remaining, setRemaining] = useState(Math.ceil(durationMs / 1000));

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const sec = Math.ceil(Math.max(0, durationMs - elapsed) / 1000);
      setRemaining(sec);
      if (sec <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [durationMs]);

  return (
    <View style={s.countdownContainer}>
      <Text style={s.countdownText}>{remaining}</Text>
    </View>
  );
}

interface RoleRevealWaitingOverlayProps {
  playerCount: number;
  onDismiss: () => void;
}

export function RoleRevealWaitingOverlay({
  playerCount,
  onDismiss,
}: RoleRevealWaitingOverlayProps) {
  const tip = useMemo(() => getRandomTipText('storyteller'), []);
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    fadeOut.value = withDelay(
      AUTO_DISMISS_MS,
      withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) runOnJS(onDismiss)();
        },
      ),
    );
    return () => cancelAnimation(fadeOut);
  }, [fadeOut, onDismiss]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  const handleDismiss = () => {
    cancelAnimation(fadeOut);
    fadeOut.value = withTiming(
      0,
      { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onDismiss)();
      },
    );
  };

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: 95 }, containerStyle]}
    >
      <Pressable
        style={[StyleSheet.absoluteFill, s.overlay]}
        onPress={handleDismiss}
      >
        <View
          style={[StyleSheet.absoluteFill, s.background]}
          pointerEvents="none"
        />

        <View style={s.content}>
          <Animated.Text
            entering={FadeIn.delay(200).duration(600)}
            style={s.icon}
          >
            🎭
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(400).duration(600)}
            style={s.title}
          >
            직업 공개 중
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            style={s.divider}
          />

          <Animated.Text
            entering={FadeIn.delay(800).duration(600)}
            style={s.subtitle}
          >
            {playerCount}명의 플레이어가 자신의 역할을{'\n'}확인하고 있습니다
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(1000).duration(400)}
            style={s.dotsRow}
          >
            <PulsingDot index={0} />
            <PulsingDot index={1} />
            <PulsingDot index={2} />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(1200).duration(400)}>
            <CountdownRing durationMs={AUTO_DISMISS_MS} />
          </Animated.View>

          <GameTip tip={tip} color="#5a6898" delay={1400} />

          <Animated.Text
            entering={FadeIn.delay(1800).duration(600)}
            style={s.hint}
          >
            터치하여 건너뛰기
          </Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  background: {
    backgroundColor: '#08081a',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    color: '#8090c0',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: 16,
  },
  divider: {
    width: 80,
    height: 1,
    backgroundColor: '#2a3860',
    marginBottom: 20,
  },
  subtitle: {
    color: '#6070a0',
    fontSize: 15,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6070a0',
  },
  countdownContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#2a3a6a',
    backgroundColor: 'rgba(20, 25, 50, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  countdownText: {
    color: '#8090c0',
    fontSize: 24,
    fontWeight: '700',
  },
  hint: {
    color: '#3a4060',
    fontSize: 12,
    letterSpacing: 1,
  },
});
