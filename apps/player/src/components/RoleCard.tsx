import type { Role, Team } from '@clocktower/shared';
import { AbilityText } from '@clocktower/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Easing,
  Pressable,
  Animated as RNAnimated,
  StyleSheet,
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

// ─── Constants ───────────────────────────────────────────────

type TeamStyleEntry = { borderColor: string; label: string; labelColor: string; accentDim: string };

const TEAM_STYLES: Record<Team, TeamStyleEntry> = {
  townsfolk: {
    borderColor: '#506aaa',
    label: '마을주민',
    labelColor: '#7090c4',
    accentDim: '#2a3560',
  },
  outsider: {
    borderColor: '#3a8878',
    label: '외지인',
    labelColor: '#50a090',
    accentDim: '#1e4a40',
  },
  minion: {
    borderColor: '#b87838',
    label: '하수인',
    labelColor: '#c48850',
    accentDim: '#5a3a18',
  },
  demon: {
    borderColor: '#943c3c',
    label: '악마',
    labelColor: '#b85c5c',
    accentDim: '#4a1c1c',
  },
};

const DEAD_TEAM_STYLE: TeamStyleEntry = {
  borderColor: '#4a4c54',
  label: '',
  labelColor: '#6e7078',
  accentDim: '#2a2c30',
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
}

// ─── Main Component ──────────────────────────────────────────

export function RoleCard({
  role,
  evilInfo,
  mode,
  flipHint,
  isHidden,
}: RoleCardProps) {
  // 0 = front (role visible), 1 = back (hidden)
  const flip = useSharedValue(mode === 'revealed' ? 0 : 1);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    if (mode === 'veiled') {
      flip.value = 1;
    } else if (mode === 'revealed') {
      if (prevModeRef.current === 'veiled') {
        // dramatic reveal from veiled state
        flip.value = withSpring(0, {
          damping: 14,
          stiffness: 80,
          mass: 1.2,
        });
      } else {
        flip.value = withTiming(0, {
          duration: 800,
          easing: REasing.inOut(REasing.cubic),
        });
      }
    } else {
      // hidden
      flip.value = withTiming(1, {
        duration: 800,
        easing: REasing.inOut(REasing.cubic),
      });
    }
    prevModeRef.current = mode;
  }, [mode, flip]);

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
  const teamStyle = role ? (isDead ? { ...DEAD_TEAM_STYLE, label: TEAM_STYLES[role.team].label } : TEAM_STYLES[role.team]) : null;

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
}: {
  role?: Role | null;
  evilInfo?: EvilInfo | null;
  teamStyle: TeamStyleEntry | null;
  flipHint?: boolean;
  isHidden?: boolean;
  isDead?: boolean;
}) {
  if (!role || !teamStyle) return null;

  return (
    <View style={[styles.card, { borderColor: teamStyle.borderColor }]}>
      <Text style={[styles.teamLabel, { color: teamStyle.labelColor }]}>
        {teamStyle.label}
      </Text>
      <Text style={[styles.roleName, isDead && styles.roleNameDead]}>{role.name}</Text>
      <View style={styles.divider} />
      <AbilityText text={role.ability} style={styles.ability} />

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
  // Shimmer animation for veiled state
  const shimmer = useRef(new RNAnimated.Value(0)).current;
  const pulse = useRef(new RNAnimated.Value(0)).current;
  const phraseIndex = useMemo(
    () => Math.floor(Math.random() * VEIL_PHRASES.length),
    [],
  );

  useEffect(() => {
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
  }, [shimmer, pulse]);

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
  const borderColor = '#2a3050';
  const accentColor = '#5a6898';

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
            <Text style={[styles.backTeamLabel, { color: '#4a5070' }]}>
              ???
            </Text>
            <View style={styles.mysteryRow}>
              <View
                style={[styles.mysteryLine, { backgroundColor: '#3a4060' }]}
              />
              <Text style={[styles.questionMark, { color: accentColor }]}>
                ?
              </Text>
              <View
                style={[styles.mysteryLine, { backgroundColor: '#3a4060' }]}
              />
            </View>
            <View style={styles.backDivider} />
            <RNAnimated.Text
              style={[
                styles.phrase,
                { opacity: phraseOpacity, color: '#7080b0' },
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
}

export function FlippableRoleCard({
  role,
  evilInfo,
  veiled,
}: FlippableRoleCardProps) {
  const [isHidden, setIsHidden] = useState(false);
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
    }, 1000);
  }, [veiled]);

  const handlePressOut = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.pressable}
    >
      <RoleCard
        role={role}
        evilInfo={evilInfo}
        mode={mode}
        flipHint={!veiled}
        isHidden={isHidden}
      />
    </Pressable>
  );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  container: {
    width: '100%',
    position: 'relative',
  },
  face: {
    width: '100%',
  },
  faceBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: '#1a1a1e',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  cardBack: {
    backgroundColor: '#14141a',
  },
  teamLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
    marginTop: 2,
  },
  roleName: {
    color: '#e0ddd8',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  roleNameDead: {
    color: '#9a9ca4',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#2e2e34',
    marginBottom: 12,
  },
  ability: {
    color: '#b8b6b2',
    fontSize: 14,
    lineHeight: 20,
  },
  flipHintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  flipHintLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2e2e38',
  },
  flipHintText: {
    color: '#6a6a7a',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  evilInfoSection: {
    marginTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#b85c5c',
    fontSize: 13,
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    color: '#d0ccc8',
    fontSize: 13,
    flex: 1,
  },

  // Back face styles
  outerGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 16,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 200,
    left: '50%',
    marginLeft: -100,
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
    transform: [{ skewX: '-15deg' }],
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backContent: {
    alignItems: 'center',
    paddingVertical: 16,
    zIndex: 2,
  },
  backTeamLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: 10,
  },
  mysteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  mysteryLine: {
    width: 40,
    height: 1,
  },
  questionMark: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  backDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#242838',
    marginBottom: 16,
  },
  phrase: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  hiddenHint: {
    fontSize: 14,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
  },
  sealContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  sealGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  seal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#1c1e28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#1c1e28',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealIcon: {
    fontSize: 14,
  },
  bottomHint: {
    color: '#3a3e4a',
    fontSize: 11,
    letterSpacing: 1,
  },

  // Ornate pattern
  ornateGrid: {
    justifyContent: 'space-evenly',
    width: '100%',
    height: '100%',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  ornateRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 4,
  },
  diamond: {
    width: 14,
    height: 14,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
});
