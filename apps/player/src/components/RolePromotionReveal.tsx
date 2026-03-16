import { getRandomTipText, type Role, type Team } from '@clocktower/shared';
import { AbilityText, GameTip } from '@clocktower/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const TEAM_ACCENT: Record<
  Team,
  { glow: string; border: string; label: string; text: string }
> = {
  townsfolk: {
    glow: '#506aaa',
    border: '#7090c4',
    label: '마을주민',
    text: '#a0b8e0',
  },
  outsider: {
    glow: '#3a8878',
    border: '#50a090',
    label: '외지인',
    text: '#80c8b8',
  },
  minion: {
    glow: '#b87838',
    border: '#c48850',
    label: '하수인',
    text: '#e0b880',
  },
  demon: { glow: '#943c3c', border: '#b85c5c', label: '악마', text: '#e09090' },
};

// Timing
const CARD_APPEAR_DELAY = 800;
const COLOR_SHIFT_DELAY = 1800;
const COLOR_SHIFT_DURATION = 1500;
const AUTO_DISMISS_DELAY = 6000;

// ── Ember particles (rise from bottom) ──

function EmberParticle({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);
  const x = ((index * 53 + 17) % 100) * (SCREEN_W / 100);
  const startY = SCREEN_H * 0.9 + (index % 4) * 20;
  const driftX = (index % 2 === 0 ? 1 : -1) * (8 + (index % 4) * 6);
  const size = 2 + (index % 3) * 1.5;
  const delay = (index * 180) % 2400;
  const duration = 3000 + (index % 4) * 600;

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
      { translateY: interpolate(progress.value, [0, 1], [0, -startY * 0.6]) },
      {
        translateX: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, driftX, driftX * 0.6],
        ),
      },
      { scale: interpolate(progress.value, [0, 0.15, 0.5, 1], [0, 1, 0.8, 0]) },
    ],
    opacity: interpolate(progress.value, [0, 0.1, 0.4, 1], [0, 0.8, 0.5, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
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

// ── Card with color transition ──

function PromotionCard({ role }: { role: Role }) {
  const team = TEAM_ACCENT[role.team];
  const minionAccent = TEAM_ACCENT.minion;

  const colorProgress = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withDelay(
      CARD_APPEAR_DELAY,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    cardScale.value = withDelay(
      CARD_APPEAR_DELAY,
      withSpring(1, { damping: 14, stiffness: 80, mass: 1 }),
    );
    // Color transition from minion orange → demon red
    colorProgress.value = withDelay(
      COLOR_SHIFT_DELAY,
      withTiming(1, {
        duration: COLOR_SHIFT_DURATION,
        easing: Easing.inOut(Easing.cubic),
      }),
    );
    return () => {
      cancelAnimation(colorProgress);
      cancelAnimation(cardScale);
      cancelAnimation(cardOpacity);
    };
  }, [colorProgress, cardScale, cardOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: interpolate(cardScale.value, [0, 1], [0.5, 1]) }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [minionAccent.border, team.border],
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      colorProgress.value,
      [0, 1],
      [minionAccent.text, team.text],
    ),
  }));

  return (
    <Animated.View style={[s.cardContainer, containerStyle]}>
      <Animated.View style={[s.card, cardStyle]}>
        <Animated.Text style={[s.teamLabel, labelStyle]}>
          {team.label}
        </Animated.Text>
        <Text style={s.roleName}>{role.name}</Text>
        <View style={s.divider} />
        <AbilityText text={role.ability} style={s.ability} />
      </Animated.View>
    </Animated.View>
  );
}

// ── Pulsing glow behind card ──

function CardGlow({
  fromColor,
  toColor,
}: {
  fromColor: string;
  toColor: string;
}) {
  const pulse = useSharedValue(0);
  const colorProgress = useSharedValue(0);
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = withDelay(
      CARD_APPEAR_DELAY,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
    colorProgress.value = withDelay(
      COLOR_SHIFT_DELAY,
      withTiming(1, {
        duration: COLOR_SHIFT_DURATION,
        easing: Easing.inOut(Easing.cubic),
      }),
    );
    pulse.value = withDelay(
      COLOR_SHIFT_DELAY,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(colorProgress);
      cancelAnimation(appear);
    };
  }, [pulse, colorProgress, appear]);

  const glowSize = SCREEN_W * 0.8;

  const style = useAnimatedStyle(() => ({
    opacity: appear.value * interpolate(pulse.value, [0, 1], [0.12, 0.3]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.9, 1.1]) }],
    backgroundColor: interpolateColor(
      colorProgress.value,
      [0, 1],
      [fromColor, toColor],
    ),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          top: SCREEN_H * 0.38 - glowSize / 2,
          left: SCREEN_W / 2 - glowSize / 2,
        },
        style,
      ]}
    />
  );
}

// ── Main overlay ──

interface RolePromotionRevealProps {
  role: Role;
  onDismiss: () => void;
}

export function RolePromotionReveal({
  role,
  onDismiss,
}: RolePromotionRevealProps) {
  const team = TEAM_ACCENT[role.team];
  const minionAccent = TEAM_ACCENT.minion;
  const tip = useMemo(() => getRandomTipText('general'), []);
  const fadeOut = useSharedValue(1);
  const dismissed = useSharedValue(false);

  const handleDismiss = () => {
    'worklet';
    if (dismissed.value) return;
    dismissed.value = true;
    fadeOut.value = withTiming(
      0,
      { duration: 600, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onDismiss)();
      },
    );
  };

  useEffect(() => {
    fadeOut.value = withDelay(
      AUTO_DISMISS_DELAY,
      withTiming(
        0,
        { duration: 600, easing: Easing.in(Easing.quad) },
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

  // Ember colors transition from orange to red
  const emberColors = [
    minionAccent.glow,
    minionAccent.border,
    team.glow,
    team.border,
    team.text,
    '#e06030',
    '#d04040',
  ];

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: 95 }, containerStyle]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
        {/* Dark background */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#08060a' }]}
        />

        {/* Vignette */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={['#1a0a0a', '#1a0a0acc', '#1a0a0a40', 'transparent']}
            locations={[0, 0.15, 0.35, 0.6]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['#1a0a0a', '#1a0a0acc', '#1a0a0a40', 'transparent']}
            locations={[0, 0.15, 0.35, 0.6]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Ember particles */}
        {Array.from({ length: 16 }).map((_, i) => (
          <EmberParticle
            key={`ep-${i}`}
            index={i}
            color={emberColors[i % emberColors.length]}
          />
        ))}

        {/* Glow behind card */}
        <CardGlow fromColor={minionAccent.glow} toColor={team.glow} />

        {/* Content */}
        <View style={s.content}>
          <Animated.Text
            entering={FadeIn.delay(100).duration(800)}
            style={s.openingLabel}
          >
            ROLE CHANGED
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(400).duration(600)}
            style={s.openingTitle}
          >
            당신의 역할이 변경되었습니다
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            style={s.openingDivider}
          />

          <PromotionCard role={role} />

          <GameTip tip={tip} color="#804a4a" delay={COLOR_SHIFT_DELAY + 600} />

          <Animated.Text
            entering={FadeIn.delay(
              COLOR_SHIFT_DELAY + COLOR_SHIFT_DURATION,
            ).duration(800)}
            style={s.dismissHint}
          >
            터치하여 계속
          </Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 10,
  },
  openingLabel: {
    color: '#804a4a',
    fontSize: 13,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  openingTitle: {
    color: '#c08080',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 16,
  },
  openingDivider: {
    width: 60,
    height: 1,
    backgroundColor: '#602a2a',
    marginBottom: 28,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    backgroundColor: '#14141a',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 22,
    width: '100%',
    overflow: 'hidden',
  },
  teamLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 6,
  },
  roleName: {
    color: '#eae8e4',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 14,
    letterSpacing: 1,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2a2a34',
    marginBottom: 14,
  },
  ability: {
    color: '#b8b6b2',
    fontSize: 14,
    lineHeight: 21,
  },
  dismissHint: {
    color: '#3a2020',
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 24,
  },
});
