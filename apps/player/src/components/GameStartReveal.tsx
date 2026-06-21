import { getRandomGameTip, type Role, type Team } from '@clocktower/shared';
import { AbilityText, GameTip, useReducedMotion } from '@clocktower/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { EvilInfo } from '../stores/playerStore';
import { styles as s } from './GameStartReveal.styles';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Team colors ──

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
  traveller: {
    glow: '#8a5ca0',
    border: '#b07cc6',
    label: '여행자',
    text: '#d0a8e8',
  },
};

// ── Drift Particle (mystical embers rising) ──

function DriftParticle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const x = ((index * 47 + 11) % 100) * (SCREEN_W / 100);
  const startY = SCREEN_H * 0.85 + (index % 6) * 30;
  const driftX = (index % 2 === 0 ? 1 : -1) * (6 + (index % 5) * 5);
  const size = 2 + (index % 3) * 1.5;
  const delay = (index * 200) % 3000;
  const duration = 4000 + (index % 5) * 800;

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
      { translateY: interpolate(progress.value, [0, 1], [0, -startY * 0.7]) },
      {
        translateX: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, driftX, driftX * 0.8],
        ),
      },
      { scale: interpolate(progress.value, [0, 0.2, 0.6, 1], [0, 1, 0.8, 0]) },
    ],
    opacity: interpolate(progress.value, [0, 0.1, 0.5, 1], [0, 0.9, 0.6, 0]),
  }));

  const colors = ['#6878a8', '#8090c0', '#a0b0d0', '#5060a0', '#c0d0e8'];

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
          backgroundColor: colors[index % colors.length],
        },
        style,
      ]}
    />
  );
}

// ── Burst Particle (radial burst on reveal) ──

function BurstParticle({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);
  const angle = (index / 20) * 2 * Math.PI + (index * 137.5 * Math.PI) / 180;
  const distance = 60 + (index % 5) * 40;
  const size = 2 + (index % 4) * 2;

  useEffect(() => {
    // Burst triggers at flip time (CARD_FLIP_DELAY)
    progress.value = withDelay(
      CARD_FLIP_DELAY + ((index * 40) % 400),
      withTiming(1, {
        duration: 1200 + (index % 3) * 300,
        easing: Easing.out(Easing.cubic),
      }),
    );
    return () => cancelAnimation(progress);
  }, [progress, index]);

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
      { scale: interpolate(progress.value, [0, 0.2, 0.6, 1], [0, 1.5, 1, 0]) },
    ],
    opacity: interpolate(progress.value, [0, 0.15, 0.5, 1], [0, 1, 0.7, 0]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: SCREEN_W / 2,
          top: SCREEN_H * 0.38,
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

// ── Card Glow (pulsing radial behind card) ──

function CardGlow({ color }: { color: string }) {
  const pulse = useSharedValue(0);
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = withDelay(
      CARD_APPEAR_DELAY,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.quad) }),
    );
    pulse.value = withDelay(
      CARD_FLIP_DELAY,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(appear);
    };
  }, [pulse, appear]);

  const glowSize = SCREEN_W * 0.9;

  const style = useAnimatedStyle(() => ({
    opacity: appear.value * interpolate(pulse.value, [0, 1], [0.15, 0.35]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.85, 1.1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: glowSize,
          height: glowSize,
          borderRadius: glowSize / 2,
          backgroundColor: color,
          top: SCREEN_H * 0.38 - glowSize / 2,
          left: SCREEN_W / 2 - glowSize / 2,
        },
        style,
      ]}
    />
  );
}

// ── Night Transition Vignette ──

function NightVignette() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      CARD_FLIP_DELAY + 800,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(progress);
  }, [progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.2, 0.5]),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={['#0a0e1a', '#0a0e1acc', '#0a0e1a40', 'transparent']}
        locations={[0, 0.2, 0.45, 0.7]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['#0a0e1a', '#0a0e1acc', '#0a0e1a40', 'transparent']}
        locations={[0, 0.2, 0.45, 0.7]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

// ── Flip Reveal Card (back → front 3D flip) ──

const VEIL_PHRASES = [
  '운명이 결정되었습니다',
  '당신의 역할이 기다리고 있습니다',
  '어둠 속에 답이 숨어 있습니다',
  '곧 베일이 벗겨집니다',
  '당신은 누구인가요?',
];

// Timing: card appears at 1.4s (back face), flips at 2.6s over 1.5s
const CARD_APPEAR_DELAY = 1400;
const CARD_FLIP_DELAY = 2600;
const CARD_FLIP_DURATION = 1500;
const AUTO_DISMISS_DELAY = 10000;

function RevealCard({
  role,
  evilInfo,
}: {
  role: Role;
  evilInfo?: EvilInfo | null;
}) {
  const team = TEAM_ACCENT[role.team];

  // 0 = front visible, 1 = back visible (start at back)
  const flip = useSharedValue(1);
  const cardScale = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    // Phase 1: Card appears (back face visible, scale up)
    cardOpacity.value = withDelay(
      CARD_APPEAR_DELAY,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }),
    );
    cardScale.value = withDelay(
      CARD_APPEAR_DELAY,
      withSpring(1, { damping: 14, stiffness: 80, mass: 1 }),
    );

    // Phase 2: Flip to front (slow, dramatic timing)
    flip.value = withDelay(
      CARD_FLIP_DELAY,
      withTiming(0, {
        duration: CARD_FLIP_DURATION,
        easing: Easing.inOut(Easing.cubic),
      }),
    );

    return () => {
      cancelAnimation(flip);
      cancelAnimation(cardScale);
      cancelAnimation(cardOpacity);
    };
  }, [flip, cardScale, cardOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: interpolate(cardScale.value, [0, 1], [0.4, 1]) }],
  }));

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
      opacity: flip.value < 0.5 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
      opacity: flip.value >= 0.5 ? 1 : 0,
    };
  });

  const phraseIndex = useMemo(
    () => Math.floor(Math.random() * VEIL_PHRASES.length),
    [],
  );

  return (
    <Animated.View style={[s.flipContainer, containerStyle]}>
      {/* Front face — role info */}
      <Animated.View style={[s.flipFace, frontStyle]}>
        <View style={[s.revealCard, { borderColor: team.border }]}>
          <ShimmerSweep color={team.glow} delay={CARD_FLIP_DELAY + 400} />

          <Text style={[s.revealTeamLabel, { color: team.text }]}>
            {team.label}
          </Text>

          <Text style={s.revealRoleName}>{role.name}</Text>

          <View style={s.revealDivider} />

          <AbilityText text={role.ability} style={s.revealAbility} />

          {evilInfo && role.team === 'demon' && (
            <View style={s.evilInfoSection}>
              <View style={s.revealDivider} />
              {evilInfo.minionNames && evilInfo.minionNames.length > 0 && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>하수인</Text>
                  <Text style={s.infoValue}>
                    {evilInfo.minionNames.join(', ')}
                  </Text>
                </View>
              )}
              {evilInfo.bluffRoles && evilInfo.bluffRoles.length > 0 && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>블러프</Text>
                  <Text style={s.infoValue}>
                    {evilInfo.bluffRoles.map((r) => r.name).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {evilInfo && role.team === 'minion' && (
            <View style={s.evilInfoSection}>
              <View style={s.revealDivider} />
              {evilInfo.demonName && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>악마</Text>
                  <Text style={s.infoValue}>{evilInfo.demonName}</Text>
                </View>
              )}
              {evilInfo.otherMinionNames &&
                evilInfo.otherMinionNames.length > 0 && (
                  <View style={s.infoRow}>
                    <Text style={s.infoLabel}>다른 하수인</Text>
                    <Text style={s.infoValue}>
                      {evilInfo.otherMinionNames.join(', ')}
                    </Text>
                  </View>
                )}
              {evilInfo.outsiderRoles && evilInfo.outsiderRoles.length > 0 && (
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>외지인</Text>
                  <Text style={s.infoValue}>
                    {evilInfo.outsiderRoles.map((r) => r.name).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Back face — veiled mystery */}
      <Animated.View style={[s.flipFace, s.flipFaceBack, backStyle]}>
        <View
          style={[s.revealCard, s.revealCardBack, { borderColor: '#2a3050' }]}
        >
          <ShimmerSweep color="#5a6898" delay={CARD_APPEAR_DELAY + 200} />

          {/* Ornate diamond pattern */}
          <View style={s.backPatternContainer}>
            {Array.from({ length: 3 }).map((_, row) => (
              <View key={`brow-${row}`} style={s.backPatternRow}>
                {Array.from({ length: 5 }).map((_, col) => (
                  <View
                    key={`bd-${row}-${col}`}
                    style={[
                      s.backDiamond,
                      {
                        opacity: 0.06 + ((row + col) % 3) * 0.04,
                        marginLeft: row % 2 === 1 && col === 0 ? 14 : 0,
                      },
                    ]}
                  />
                ))}
              </View>
            ))}
          </View>

          <View style={s.backContent}>
            <Text style={s.backTeamLabel}>???</Text>
            <View style={s.backMysteryRow}>
              <View style={s.backMysteryLine} />
              <Text style={s.backQuestionMark}>?</Text>
              <View style={s.backMysteryLine} />
            </View>
            <View style={s.backDividerLine} />
            <Text style={s.backPhrase}>{VEIL_PHRASES[phraseIndex]}</Text>

            {/* Seal */}
            <View style={s.backSealContainer}>
              <View style={s.backSeal}>
                <Text style={s.backSealIcon}>&#x2726;</Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ── Shimmer sweep across the card ──

function ShimmerSweep({
  color,
  delay = 2200,
}: {
  color: string;
  delay?: number;
}) {
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 0 }),
          withDelay(1500, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );
    return () => cancelAnimation(sweep);
  }, [sweep, delay]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweep.value, [0, 1], [-200, 200]) }],
    opacity: interpolate(
      sweep.value,
      [0, 0.2, 0.5, 0.8, 1],
      [0, 0.6, 1, 0.6, 0],
    ),
  }));

  return (
    <Animated.View style={[s.shimmerContainer, style]}>
      <LinearGradient
        colors={[
          'transparent',
          `${color}15`,
          `${color}30`,
          `${color}15`,
          'transparent',
        ]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.shimmerGradient}
      />
    </Animated.View>
  );
}

// ── Main Overlay ──

interface GameStartRevealProps {
  role: Role;
  evilInfo?: EvilInfo | null;
  onDismiss: () => void;
}

export function GameStartReveal({
  role,
  evilInfo,
  onDismiss,
}: GameStartRevealProps) {
  const reduced = useReducedMotion();
  const team = TEAM_ACCENT[role.team];
  const tip = useMemo(
    () => getRandomGameTip('firstNight', role.id, role.team),
    [role.id, role.team],
  );
  const fadeOut = useSharedValue(1);
  const dismissed = useSharedValue(false);

  const burstColors = useMemo(() => {
    const base = team.glow;
    return [base, team.border, team.text, `${base}cc`, `${team.text}cc`];
  }, [team]);

  const startFadeOut = () => {
    'worklet';
    if (dismissed.value) return;
    dismissed.value = true;
    fadeOut.value = withTiming(
      0,
      { duration: 800, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onDismiss)();
      },
    );
  };

  const handleDismiss = () => {
    startFadeOut();
  };

  // Auto-dismiss after delay
  useEffect(() => {
    fadeOut.value = withDelay(
      AUTO_DISMISS_DELAY,
      withTiming(
        0,
        { duration: 800, easing: Easing.in(Easing.quad) },
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

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { zIndex: 95 }, containerStyle]}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleDismiss}
        accessibilityLabel="역할 공개 닫기"
        accessibilityRole="button"
      >
        {/* Background */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: '#06080e' }]}
        />

        {/* Night vignette atmosphere */}
        <NightVignette />

        {/* Drift particles — skip when reduced motion */}
        {!reduced &&
          Array.from({ length: 20 }).map((_, i) => (
            <DriftParticle key={`dp-${i}`} index={i} />
          ))}

        {/* Card glow */}
        <CardGlow color={team.glow} />

        {/* Burst particles — skip when reduced motion */}
        {!reduced &&
          Array.from({ length: 20 }).map((_, i) => (
            <BurstParticle
              key={`bp-${i}`}
              index={i}
              color={burstColors[i % burstColors.length]}
            />
          ))}

        {/* Content */}
        <View style={s.content}>
          {/* Opening text */}
          <Animated.Text
            entering={FadeIn.delay(200).duration(1000)}
            style={s.openingLabel}
          >
            FATE UNVEILED
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(600).duration(800)}
            style={s.openingTitle}
          >
            당신의 운명이 결정되었습니다
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(1000).duration(600)}
            style={s.openingDivider}
          />

          {/* Role card */}
          <RevealCard role={role} evilInfo={evilInfo} />

          {/* Night transition text (after flip settles) */}
          <GameTip tip={tip} color="#5a6898" delay={3600} />

          <Animated.Text
            entering={FadeIn.delay(3800).duration(1000)}
            style={s.nightText}
          >
            첫 번째 밤이 찾아옵니다
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(4400).duration(800)}
            style={s.dismissHint}
          >
            터치하여 계속
          </Animated.Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
