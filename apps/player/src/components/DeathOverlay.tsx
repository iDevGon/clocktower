import { DEATH_REASON_LABELS, type DeathReason } from '@clocktower/shared';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, Vibration, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Skull icon (text-based) ──

function SkullIcon() {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      300,
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.quad) }),
      ),
    );
    return () => cancelAnimation(scale);
  }, [scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(scale.value, [0, 0.3, 1], [0, 0.6, 1]),
  }));

  return <Animated.Text style={[s.skullText, style]}>💀</Animated.Text>;
}

// ── Blood drip ──

function BloodDrip({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const x = ((index * 37 + 13) % 100) * (SCREEN_WIDTH / 100);
  const dripWidth = 3 + (index % 4) * 2;
  const dripHeight = SCREEN_HEIGHT * (0.4 + (index % 5) * 0.12);
  const delay = (index * 150) % 2000;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 2400 + (index % 3) * 500,
        easing: Easing.in(Easing.quad),
      }),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, index]);

  const style = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, dripHeight]),
    opacity: interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.9, 0.7, 0.5]),
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

// ── Vignette pulse ──

function VignettePulse() {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0.7, { duration: 800, easing: Easing.out(Easing.quad) }),
      withTiming(0.4, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: '#1a0000' }, style]}
    />
  );
}

// ── Auto-dismiss timer ──

const AUTO_DISMISS_MS = 4500;
const FADE_OUT_MS = 800;

// ── Main Overlay ──

interface DeathOverlayProps {
  onDismiss: () => void;
  reason?: DeathReason | null;
}

const DRIP_COUNT = 14;

export function DeathOverlay({ onDismiss, reason }: DeathOverlayProps) {
  const fadeOut = useSharedValue(1);

  useEffect(() => {
    Vibration.vibrate([0, 300, 150, 500]);

    // Auto-dismiss: fade out then call onDismiss
    fadeOut.value = withDelay(
      AUTO_DISMISS_MS,
      withTiming(
        0,
        { duration: FADE_OUT_MS, easing: Easing.in(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(onDismiss)();
          }
        },
      ),
    );

    return () => cancelAnimation(fadeOut);
  }, [fadeOut, onDismiss]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.overlay, containerStyle]}>
      {/* Dark background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0000' }]} />

      {/* Vignette */}
      <VignettePulse />

      {/* Blood drips */}
      {Array.from({ length: DRIP_COUNT }).map((_, i) => (
        <BloodDrip key={`d-${i}`} index={i} />
      ))}

      {/* Content */}
      <View style={s.content}>
        <SkullIcon />

        <Animated.Text
          entering={FadeIn.delay(600).duration(600)}
          style={s.label}
        >
          DEAD
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(900).duration(600)}
          style={s.title}
        >
          당신은 사망했습니다
        </Animated.Text>

        {reason && (
          <Animated.View
            entering={FadeIn.delay(1100).duration(500)}
            style={s.reasonBadge}
          >
            <Text style={s.reasonText}>{DEATH_REASON_LABELS[reason]}</Text>
          </Animated.View>
        )}

        <Animated.Text
          entering={FadeIn.delay(1400).duration(600)}
          style={s.subtitle}
        >
          투표권이 <Text style={s.subtitleEmphasis}>단 1회</Text> 남아있습니다
        </Animated.Text>
        <Animated.Text
          entering={FadeIn.delay(1700).duration(600)}
          style={s.subtitleHint}
        >
          신중하게 사용하세요
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  overlay: {
    zIndex: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  skullText: {
    fontSize: 64,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    letterSpacing: 12,
    color: '#8b0000',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#cc2020',
    textAlign: 'center',
    marginBottom: 8,
  },
  reasonBadge: {
    backgroundColor: 'rgba(139, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 0, 0, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    marginTop: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#a04040',
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7a2020',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitleEmphasis: {
    color: '#ff4040',
    fontWeight: '800',
    fontSize: 16,
  },
  subtitleHint: {
    fontSize: 13,
    color: '#5a1818',
    fontWeight: '300',
    textAlign: 'center',
  },
});
