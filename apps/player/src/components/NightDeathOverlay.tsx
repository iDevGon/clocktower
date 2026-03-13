import { FullScreenVignette } from '@clocktower/shared';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
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

// ── Moon icon animation ──

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

// ── Fog particle ──

function FogParticle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const startX = ((index * 53 + 17) % 100) / 100;
  const startY = 0.3 + (index % 7) * 0.08;
  const drift = (index % 2 === 0 ? 1 : -1) * (10 + (index % 4) * 8);
  const size = 40 + (index % 5) * 20;
  const delay = (index * 300) % 3000;
  const duration = 3000 + (index % 3) * 1000;

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
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.06, 0]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, drift]) },
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
          backgroundColor: '#4a5a8a',
        },
        style,
      ]}
    />
  );
}

const FOG_COUNT = 8;

function NightDeathEffects() {
  return (
    <>
      <FullScreenVignette
        color="#080818"
        opacityRange={[0.6, 0.8]}
        duration={3000}
      />
      {Array.from({ length: FOG_COUNT }).map((_, i) => (
        <FogParticle key={`f-${i}`} index={i} />
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
          backgroundColor: '#4a5a8a',
          alignSelf: 'center',
          marginVertical: 16,
        },
        style,
      ]}
    />
  );
}

// ── Main Overlay ──

interface NightDeathOverlayProps {
  deaths: Array<{ id: string; name: string }>;
  onDismiss: () => void;
}

export function NightDeathOverlay({
  deaths,
  onDismiss,
}: NightDeathOverlayProps) {
  useEffect(() => {
    Vibration.vibrate([0, 200, 100, 300]);
  }, []);

  const noDeaths = deaths.length === 0;

  return (
    <BaseOverlay
      backgroundColor="#06060e"
      zIndex={88}
      effectsLayer={<NightDeathEffects />}
      onDismiss={onDismiss}
    >
      <View style={s.content}>
        <MoonIcon />

        <Animated.Text
          entering={FadeIn.delay(400).duration(500)}
          style={s.label}
        >
          간밤의 소식
        </Animated.Text>

        <DividerLine />

        {noDeaths ? (
          <Animated.Text
            entering={FadeIn.delay(700).duration(600)}
            style={s.noDeathText}
          >
            아무도 사망하지 않았습니다
          </Animated.Text>
        ) : (
          deaths.map((death, i) => (
            <Animated.View
              key={death.id}
              entering={FadeIn.delay(700 + i * 300).duration(600)}
              style={s.deathRow}
            >
              <Text style={s.skullSmall}>💀</Text>
              <View style={s.deathInfo}>
                <Text style={s.deathName}>{death.name}</Text>
                <Text style={s.deathSuffix}>사망</Text>
              </View>
            </Animated.View>
          ))
        )}

        <DividerLine />

        <Animated.View
          entering={FadeIn.delay(
            noDeaths ? 1000 : 700 + deaths.length * 300 + 200,
          ).duration(500)}
        >
          <Pressable style={s.confirmButton} onPress={onDismiss}>
            <Text style={s.confirmText}>확인</Text>
          </Pressable>
        </Animated.View>
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
  noDeathText: {
    fontSize: 18,
    color: '#8a9ac0',
    fontWeight: '500',
    textAlign: 'center',
  },
  deathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
    backgroundColor: 'rgba(80,30,30,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(140,50,50,0.25)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 200,
  },
  skullSmall: {
    fontSize: 24,
  },
  deathInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  deathName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#cc4040',
    textShadowColor: 'rgba(200, 50, 50, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  deathSuffix: {
    fontSize: 14,
    color: '#8a4040',
    fontWeight: '400',
  },
  confirmButton: {
    marginTop: 12,
    backgroundColor: 'rgba(70, 90, 140, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(100, 120, 180, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  confirmText: {
    fontSize: 16,
    color: '#8a9ac0',
    fontWeight: '600',
    textAlign: 'center',
  },
});
