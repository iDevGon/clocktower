import type { Role, Team } from '@clocktower/shared';
import {
  AbilityText,
  colors,
  RoleTips,
  useReducedMotion,
} from '@clocktower/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Easing,
  Pressable,
  Animated as RNAnimated,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolate,
  Easing as REasing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { EvilInfo } from '../stores/playerStore';
import { usePlayerStore } from '../stores/playerStore';
import { styles } from './RoleCard.styles';

// ─── Constants ───────────────────────────────────────────────

type TeamStyleEntry = {
  borderColor: string;
  label: string;
  labelColor: string;
  accentDim: string;
};

const TEAM_STYLES: Record<Team, TeamStyleEntry> = {
  townsfolk: {
    borderColor: colors.arcane.accent.prussianBlue,
    label: '마을주민',
    labelColor: colors.arcane.accent.sapphireLens,
    accentDim: colors.arcane.accent.midnightInk,
  },
  outsider: {
    borderColor: colors.arcane.border.parchment,
    label: '외지인',
    labelColor: colors.arcane.text.primary,
    accentDim: colors.arcane.surface.ledger,
  },
  minion: {
    borderColor: colors.arcane.border.brass,
    label: '하수인',
    labelColor: colors.arcane.text.label,
    accentDim: colors.arcane.surface.parchment,
  },
  demon: {
    borderColor: colors.arcane.action.blood,
    label: '악마',
    labelColor: colors.arcane.action.bloodHighlight,
    accentDim: colors.arcane.surface.apparatus,
  },
  traveller: {
    borderColor: colors.team.traveller,
    label: '여행자',
    labelColor: '#a090c0',
    accentDim: '#2a2040',
  },
};

const DEAD_TEAM_STYLE: TeamStyleEntry = {
  borderColor: colors.arcane.text.dead,
  label: '',
  labelColor: colors.arcane.text.dead,
  accentDim: colors.arcane.surface.base,
};

const VEIL_PHRASES = [
  '운명이 결정되었습니다',
  '당신의 역할이 기다리고 있습니다',
  '어둠 속에 답이 숨어 있습니다',
  '곧 베일이 벗겨집니다',
  '당신은 누구인가요?',
];

type CardMode = 'veiled' | 'revealed' | 'hidden';

interface RoleCardProps {
  role?: Role | null;
  evilInfo?: EvilInfo | null;
  /** 'veiled' in setup, 'revealed' once assigned (can flip to hidden) */
  mode: CardMode;
  flipHint?: boolean;
  isHidden?: boolean;
  butlerMasterName?: string | null;
}

// ─── Main Component ──────────────────────────────────────────

export function RoleCard({
  role,
  evilInfo,
  mode,
  flipHint,
  isHidden,
  butlerMasterName,
}: RoleCardProps) {
  const reduced = useReducedMotion();
  // 0 = front (role visible), 1 = back (hidden)
  const flip = useSharedValue(mode === 'revealed' ? 0 : 1);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    if (mode === 'veiled') {
      flip.value = 1;
      prevModeRef.current = mode;
      return;
    }
    if (mode === 'revealed') {
      if (reduced) {
        flip.value = 0;
      } else if (prevModeRef.current === 'veiled') {
        // dramatic reveal from veiled state
        flip.value = withSpring(0, {
          damping: 14,
          stiffness: 80,
          mass: 1.2,
        });
      } else {
        flip.value = withTiming(0, {
          duration: 400,
          easing: REasing.inOut(REasing.cubic),
        });
      }
      prevModeRef.current = mode;
      return;
    }
    // hidden
    flip.value = reduced
      ? 1
      : withTiming(1, {
          duration: 800,
          easing: REasing.inOut(REasing.cubic),
        });
    prevModeRef.current = mode;
  }, [mode, flip, reduced]);

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

  const isDead = !usePlayerStore((s) => s.isAlive);
  const teamStyle = role
    ? isDead
      ? { ...DEAD_TEAM_STYLE, label: TEAM_STYLES[role.team].label }
      : TEAM_STYLES[role.team]
    : null;

  return (
    <View style={styles.container}>
      {/* Front face — role info */}
      <Animated.View style={[styles.face, frontStyle]}>
        <FrontFace
          role={role}
          evilInfo={evilInfo}
          teamStyle={teamStyle}
          flipHint={flipHint}
          isHidden={isHidden}
          isDead={isDead}
          butlerMasterName={butlerMasterName}
        />
      </Animated.View>

      {/* Back face — card back or veiled */}
      <Animated.View style={[styles.face, styles.faceBack, backStyle]}>
        <BackFace isVeiled={mode === 'veiled'} />
      </Animated.View>
    </View>
  );
}

// ─── Front Face ──────────────────────────────────────────────

function FrontFace({
  role,
  evilInfo,
  teamStyle,
  flipHint,
  isHidden,
  isDead,
  butlerMasterName,
}: {
  role?: Role | null;
  evilInfo?: EvilInfo | null;
  teamStyle: TeamStyleEntry | null;
  flipHint?: boolean;
  isHidden?: boolean;
  isDead?: boolean;
  butlerMasterName?: string | null;
}) {
  if (!role || !teamStyle) return null;

  return (
    <View style={[styles.card, { borderColor: teamStyle.borderColor }]}>
      <Text style={[styles.teamLabel, { color: teamStyle.labelColor }]}>
        {teamStyle.label}
      </Text>
      <Text style={[styles.roleName, isDead && styles.roleNameDead]}>
        {role.name}
      </Text>
      <View style={styles.divider} />
      <AbilityText text={role.ability} style={styles.ability} />
      <RoleTips roleId={role.id} playOnly />

      {evilInfo && role.team === 'demon' && (
        <View style={styles.evilInfoSection}>
          <View style={styles.divider} />
          {evilInfo.minionNames && evilInfo.minionNames.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>하수인</Text>
              <Text style={styles.infoValue}>
                {evilInfo.minionNames.join(', ')}
              </Text>
            </View>
          )}
          {evilInfo.bluffRoles && evilInfo.bluffRoles.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>블러프</Text>
              <Text style={styles.infoValue}>
                {evilInfo.bluffRoles.map((r) => r.name).join(', ')}
              </Text>
            </View>
          )}
        </View>
      )}

      {evilInfo && role.team === 'minion' && (
        <View style={styles.evilInfoSection}>
          <View style={styles.divider} />
          {evilInfo.demonName && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>악마</Text>
              <Text style={styles.infoValue}>{evilInfo.demonName}</Text>
            </View>
          )}
          {evilInfo.otherMinionNames &&
            evilInfo.otherMinionNames.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>다른 하수인</Text>
                <Text style={styles.infoValue}>
                  {evilInfo.otherMinionNames.join(', ')}
                </Text>
              </View>
            )}
        </View>
      )}

      {butlerMasterName && (
        <View style={styles.evilInfoSection}>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: '#3a7ca5' }]}>주인</Text>
            <Text style={styles.infoValue}>{butlerMasterName}</Text>
          </View>
        </View>
      )}

      {flipHint && (
        <View style={styles.flipHintBar}>
          <View style={styles.flipHintLine} />
          <Text style={styles.flipHintText}>
            {isHidden ? '꾹 눌러서 카드 보기' : '꾹 눌러서 카드 가리기'}
          </Text>
          <View style={styles.flipHintLine} />
        </View>
      )}
    </View>
  );
}

// ─── Back Face ───────────────────────────────────────────────

function BackFace({ isVeiled }: { isVeiled: boolean }) {
  const reduced = useReducedMotion();
  // Shimmer animation for veiled state
  const shimmer = useRef(new RNAnimated.Value(0)).current;
  const pulse = useRef(new RNAnimated.Value(0)).current;
  const phraseIndex = useMemo(
    () => Math.floor(Math.random() * VEIL_PHRASES.length),
    [],
  );

  useEffect(() => {
    if (reduced) return;

    const shimmerAnim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(shimmer, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(shimmer, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        RNAnimated.delay(1200),
      ]),
    );

    const pulseAnim = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulse, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    shimmerAnim.start();
    pulseAnim.start();

    return () => {
      shimmerAnim.stop();
      pulseAnim.stop();
    };
  }, [shimmer, pulse, reduced]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.15, 0.5, 0.85, 1],
    outputRange: [0, 0.6, 1, 0.6, 0],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.35],
  });

  const phraseOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 1, 0.4],
  });

  // Back face always uses neutral colors — must NOT reveal team info
  const borderColor = colors.arcane.border.brassDim;
  const accentColor = colors.arcane.accent.prussianBlue;

  return (
    <View style={[styles.card, styles.cardBack, { borderColor }]}>
      {/* Outer glow */}
      <RNAnimated.View
        style={[
          styles.outerGlow,
          { opacity: glowOpacity, backgroundColor: accentColor },
        ]}
      />

      {/* Shimmer sweep */}
      <RNAnimated.View
        style={[
          styles.shimmerContainer,
          {
            transform: [{ translateX: shimmerTranslate }],
            opacity: shimmerOpacity,
          },
        ]}
      >
        <LinearGradient
          colors={[
            'transparent',
            `${accentColor}18`,
            `${accentColor}30`,
            `${accentColor}18`,
            'transparent',
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </RNAnimated.View>

      {/* Geometric pattern — interlocking diamonds */}
      <View style={styles.patternContainer}>
        <OrnatePattern color={accentColor} />
      </View>

      {/* Center content */}
      <View style={styles.backContent}>
        {isVeiled ? (
          <>
            <Text
              style={[styles.backTeamLabel, { color: colors.arcane.text.dead }]}
            >
              ???
            </Text>
            <View style={styles.mysteryRow}>
              <View
                style={[
                  styles.mysteryLine,
                  { backgroundColor: colors.arcane.border.brassDim },
                ]}
              />
              <Text style={[styles.questionMark, { color: accentColor }]}>
                ?
              </Text>
              <View
                style={[
                  styles.mysteryLine,
                  { backgroundColor: colors.arcane.border.brassDim },
                ]}
              />
            </View>
            <View style={styles.backDivider} />
            <RNAnimated.Text
              style={[
                styles.phrase,
                { opacity: phraseOpacity, color: colors.arcane.text.primary },
              ]}
            >
              {VEIL_PHRASES[phraseIndex]}
            </RNAnimated.Text>
          </>
        ) : (
          <>
            <View style={styles.mysteryRow}>
              <View
                style={[styles.mysteryLine, { backgroundColor: accentColor }]}
              />
              <View style={[styles.sealOuter, { borderColor: accentColor }]}>
                <Text style={[styles.sealIcon, { color: accentColor }]}>✦</Text>
              </View>
              <View
                style={[styles.mysteryLine, { backgroundColor: accentColor }]}
              />
            </View>
            <View style={styles.backDivider} />
            <Text style={[styles.hiddenHint, { color: `${accentColor}cc` }]}>
              터치하여 역할 확인
            </Text>
          </>
        )}

        {/* Seal */}
        <View style={styles.sealContainer}>
          <RNAnimated.View
            style={[
              styles.sealGlow,
              { opacity: glowOpacity, backgroundColor: accentColor },
            ]}
          />
          <View style={[styles.seal, { borderColor: `${accentColor}60` }]}>
            <Text style={[styles.sealIcon, { color: accentColor }]}>
              &#x2726;
            </Text>
          </View>
        </View>

        {isVeiled ? (
          <Text style={styles.bottomHint}>게임이 시작되면 공개됩니다</Text>
        ) : (
          <View style={styles.flipHintBar}>
            <View style={styles.flipHintLine} />
            <Text style={styles.flipHintText}>꾹 눌러서 카드 보기</Text>
            <View style={styles.flipHintLine} />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Ornate Pattern ──────────────────────────────────────────

function OrnatePattern({ color }: { color: string }) {
  const rows = 4;
  const cols = 5;

  return (
    <View style={styles.ornateGrid}>
      {Array.from({ length: rows }).map((_, row) => (
        <View key={`orow-${row}`} style={styles.ornateRow}>
          {Array.from({ length: cols }).map((_, col) => {
            const isOffset = row % 2 === 1;
            const opacity = 0.06 + ((row + col) % 3) * 0.04;
            return (
              <View
                key={`odiamond-${row}-${col}`}
                style={[
                  styles.diamond,
                  {
                    borderColor: color,
                    opacity,
                    marginLeft: isOffset && col === 0 ? 16 : 0,
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Wrapper for tap-to-flip ─────────────────────────────────

interface FlippableRoleCardProps {
  role?: Role | null;
  evilInfo?: EvilInfo | null;
  /** If true, shows veiled (setup) state, no flip interaction */
  veiled?: boolean;
  /** Current game phase – used to auto-hide card on night→day transition */
  currentPhase?: string | null;
  butlerMasterName?: string | null;
}

export function FlippableRoleCard({
  role,
  evilInfo,
  veiled,
  currentPhase,
  butlerMasterName,
}: FlippableRoleCardProps) {
  const [isHidden, setIsHidden] = useState(false);
  const prevPhaseRef = useRef(currentPhase);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = currentPhase;
    if (prev === 'night' && currentPhase === 'day' && !isHidden) {
      setIsHidden(true);
    }
  }, [currentPhase, isHidden]);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mode: CardMode = veiled ? 'veiled' : isHidden ? 'hidden' : 'revealed';

  const clearTimer = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const handlePressIn = useCallback(() => {
    if (veiled) return;
    holdTimer.current = setTimeout(() => {
      holdTimer.current = null;
      setIsHidden((h) => !h);
    }, 500);
  }, [veiled]);

  const handlePressOut = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
      accessibilityLabel={
        veiled
          ? '역할 카드 (미공개)'
          : `역할 카드${role ? `: ${role.name}` : ''}`
      }
      accessibilityRole="button"
      accessibilityHint={veiled ? undefined : '길게 눌러서 카드를 뒤집습니다'}
    >
      <RoleCard
        role={role}
        evilInfo={evilInfo}
        mode={mode}
        flipHint={!veiled}
        isHidden={isHidden}
        butlerMasterName={butlerMasterName}
      />
    </Pressable>
  );
}
