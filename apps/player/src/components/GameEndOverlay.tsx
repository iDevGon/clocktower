import type { GameResult, Team } from '@clocktower/shared';
import { useEffect, useMemo } from 'react';
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

const TEAM_LABELS: Record<string, string> = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
};

function isGoodTeam(team: Team): boolean {
  return team === 'townsfolk' || team === 'outsider';
}

// ── Blood Drip (defeat) ──

function BloodDrip({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const x = ((index * 37 + 13) % 100) * (SCREEN_WIDTH / 100);
  const dripWidth = 3 + (index % 4) * 2;
  const dripHeight = SCREEN_HEIGHT * (0.3 + (index % 5) * 0.14);
  const delay = (index * 180) % 2400;

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, {
        duration: 2800 + (index % 3) * 600,
        easing: Easing.in(Easing.quad),
      }),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay, index]);

  const style = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, dripHeight]),
    opacity: interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.9, 0.7, 0.4]),
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

function BloodPool({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const x = ((index * 53 + 7) % 100) * (SCREEN_WIDTH / 100);
  const poolWidth = 20 + (index % 4) * 15;
  const delay = 1800 + ((index * 300) % 1500);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }),
    );
    return () => cancelAnimation(progress);
  }, [progress, delay]);

  const style = useAnimatedStyle(() => ({
    width: interpolate(progress.value, [0, 1], [0, poolWidth]),
    height: interpolate(progress.value, [0, 1], [0, poolWidth * 0.3]),
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 0.6, 0.35]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: x - poolWidth / 2,
          borderRadius: poolWidth,
          backgroundColor: '#6b0000',
        },
        style,
      ]}
    />
  );
}

// ── Victory Particle ──

function VictoryParticle({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const startX = ((index * 41 + 17) % 100) * (SCREEN_WIDTH / 100);
  const startY = SCREEN_HEIGHT * 0.7 + (index % 5) * 40;
  const driftX = (index % 2 === 0 ? 1 : -1) * (10 + (index % 7) * 8);
  const size = 3 + (index % 4) * 2;
  const delay = (index * 120) % 3000;
  const duration = 3000 + (index % 4) * 800;

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
      { translateY: interpolate(progress.value, [0, 1], [0, -startY * 0.8]) },
      {
        translateX: interpolate(
          progress.value,
          [0, 0.5, 1],
          [0, driftX, driftX * 1.5],
        ),
      },
      { scale: interpolate(progress.value, [0, 0.3, 0.7, 1], [0, 1.2, 1, 0]) },
    ],
    opacity: interpolate(progress.value, [0, 0.15, 0.6, 1], [0, 1, 0.8, 0]),
  }));

  const colors = ['#4da6ff', '#80c0ff', '#b3d9ff', '#3399ff', '#cce5ff'];
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

// ── Slayer Spark (golden burst particle) ──

function SlayerSpark({ index }: { index: number }) {
  const progress = useSharedValue(0);
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT * 0.25;
  const angle = (index / 32) * 2 * Math.PI + (index * 137.5 * Math.PI) / 180;
  const distance = 40 + (index % 6) * 50;
  const size = 2 + (index % 5) * 2;
  const delay = (index * 60) % 1800;
  const duration = 1800 + (index % 4) * 600;

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
      { scale: interpolate(progress.value, [0, 0.15, 0.5, 1], [0, 1.8, 1, 0]) },
    ],
    opacity: interpolate(progress.value, [0, 0.1, 0.4, 1], [0, 1, 0.7, 0]),
  }));

  const colors = ['#ffd700', '#ffb300', '#ff8c00', '#ffe066', '#fff5cc'];
  const color = colors[index % colors.length];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: centerX,
          top: centerY,
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

// ── Slayer Glow (golden radial) ──

function SlayerGlow() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.1, 0.3]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.8, 1.2]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: SCREEN_WIDTH * 1.5,
          height: SCREEN_WIDTH * 1.5,
          borderRadius: SCREEN_WIDTH * 0.75,
          backgroundColor: '#b8860b',
          top: SCREEN_HEIGHT * 0.15 - SCREEN_WIDTH * 0.75,
          left: SCREEN_WIDTH * 0.5 - SCREEN_WIDTH * 0.75,
        },
        style,
      ]}
    />
  );
}

// ── Radial Glow (victory) ──

function VictoryGlow() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.08, 0.2]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.9, 1.1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: SCREEN_WIDTH * 1.5,
          height: SCREEN_WIDTH * 1.5,
          borderRadius: SCREEN_WIDTH * 0.75,
          backgroundColor: '#1a7aff',
          top: SCREEN_HEIGHT * 0.15 - SCREEN_WIDTH * 0.75,
          left: SCREEN_WIDTH * 0.5 - SCREEN_WIDTH * 0.75,
        },
        style,
      ]}
    />
  );
}

// ── Defeat Vignette Pulse ──

function DefeatPulse() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.6]),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: '#1a0000' }, style]}
    />
  );
}

// ── Animated Text Line ──

function AnimatedTextLine({
  children,
  delay,
  style: textStyle,
}: {
  children: React.ReactNode;
  delay: number;
  style?: Record<string, unknown>;
}) {
  return (
    <Animated.Text
      entering={FadeIn.delay(delay).duration(800)}
      style={textStyle}
    >
      {children}
    </Animated.Text>
  );
}

// ── Player Row ──

function PlayerRow({
  player,
  index,
  theme,
}: {
  player: GameResult['players'][number];
  index: number;
  theme: 'victory' | 'defeat' | 'slayer';
}) {
  const isPlayerGood = isGoodTeam(player.team);
  const teamColor = isPlayerGood ? '#5dade2' : '#e74c3c';
  const subtleColor =
    theme === 'slayer'
      ? '#6a5a3a'
      : theme === 'victory'
        ? '#6a7a8a'
        : '#6a4444';

  return (
    <Animated.View
      entering={FadeIn.delay(1600 + index * 80).duration(500)}
      style={s.playerRow}
    >
      <View style={s.playerNameCol}>
        <Text style={[s.playerName, !player.isAlive && { opacity: 0.4 }]}>
          {player.name}
          {!player.isAlive ? ' (사망)' : ''}
        </Text>
      </View>
      <View style={s.playerRoleCol}>
        <Text style={[s.playerRole, { color: teamColor }]}>
          {player.role.name}
        </Text>
        <Text style={[s.playerTeam, { color: subtleColor }]}>
          {TEAM_LABELS[player.team] ?? player.team}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Effects layers ──

const DRIP_COUNT = 18;
const POOL_COUNT = 6;
const PARTICLE_COUNT = 24;
const SPARK_COUNT = 32;

function SlayerEffects() {
  return (
    <>
      <SlayerGlow />
      {Array.from({ length: SPARK_COUNT }).map((_, i) => (
        <SlayerSpark key={`sk-${i}`} index={i} />
      ))}
    </>
  );
}

function VictoryEffects() {
  return (
    <>
      <VictoryGlow />
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <VictoryParticle key={`p-${i}`} index={i} />
      ))}
    </>
  );
}

function DefeatEffects() {
  return (
    <>
      <DefeatPulse />
      {Array.from({ length: DRIP_COUNT }).map((_, i) => (
        <BloodDrip key={`d-${i}`} index={i} />
      ))}
      {Array.from({ length: POOL_COUNT }).map((_, i) => (
        <BloodPool key={`bp-${i}`} index={i} />
      ))}
    </>
  );
}

// ── Main Overlay ──

interface GameEndOverlayProps {
  gameResult: GameResult;
  myTeam: Team;
  onDismiss: () => void;
}

export function GameEndOverlay({
  gameResult,
  myTeam,
  onDismiss,
}: GameEndOverlayProps) {
  const myTeamIsGood = isGoodTeam(myTeam);
  const goodWon = gameResult.winningTeam === 'good';
  const isVictory = myTeamIsGood === goodWon;
  const isSlayerKill = gameResult.cause === 'slayer';

  useEffect(() => {
    if (isSlayerKill) {
      Vibration.vibrate([0, 50, 50, 50, 50, 600]);
    } else if (isVictory) {
      Vibration.vibrate([0, 100, 80, 100, 80, 300]);
    } else {
      Vibration.vibrate([0, 400, 200, 400]);
    }
  }, [isVictory, isSlayerKill]);

  const theme: 'victory' | 'defeat' | 'slayer' = isSlayerKill
    ? 'slayer'
    : isVictory
      ? 'victory'
      : 'defeat';

  const bgColor =
    theme === 'slayer'
      ? '#0a0800'
      : theme === 'victory'
        ? '#060a10'
        : '#0a0000';

  const effectsLayer = useMemo(() => {
    if (theme === 'slayer') return <SlayerEffects />;
    if (theme === 'victory') return <VictoryEffects />;
    return <DefeatEffects />;
  }, [theme]);

  const dividerColor =
    theme === 'slayer'
      ? 'rgba(255,215,0,0.35)'
      : theme === 'victory'
        ? 'rgba(77,166,255,0.25)'
        : 'rgba(139,0,0,0.4)';

  const listTitleColor =
    theme === 'slayer'
      ? '#b8860b'
      : theme === 'victory'
        ? '#5090c0'
        : '#8b3030';

  const buttonBorder =
    theme === 'slayer'
      ? 'rgba(255,215,0,0.3)'
      : theme === 'victory'
        ? 'rgba(77,166,255,0.3)'
        : 'rgba(139,0,0,0.4)';

  const buttonBg =
    theme === 'slayer'
      ? 'rgba(255,215,0,0.1)'
      : theme === 'victory'
        ? 'rgba(77,166,255,0.1)'
        : 'rgba(139,0,0,0.1)';

  const buttonTextColor =
    theme === 'slayer'
      ? '#e0c870'
      : theme === 'victory'
        ? '#c0daf0'
        : '#d0a0a0';

  return (
    <BaseOverlay
      backgroundColor={bgColor}
      zIndex={100}
      effectsLayer={effectsLayer}
      scrollable
      contentAlign="flex-start"
    >
      <View style={s.content}>
        {/* ── Slayer Easter Egg heading ── */}
        {theme === 'slayer' && isVictory && (
          <>
            <AnimatedTextLine delay={100} style={s.slayerIcon}>
              {'\uD83C\uDFF9'}
            </AnimatedTextLine>
            <AnimatedTextLine delay={300} style={s.slayerLabel}>
              SLAYER
            </AnimatedTextLine>
            <AnimatedTextLine delay={600} style={s.slayerTitle}>
              {'처단자의 한 방!'}
            </AnimatedTextLine>
            <AnimatedTextLine delay={900} style={s.slayerSubtitle}>
              {'단 한 발의 총성이 악마를 쓰러뜨렸습니다'}
            </AnimatedTextLine>
          </>
        )}
        {theme === 'slayer' && !isVictory && (
          <>
            <AnimatedTextLine delay={100} style={s.slayerIcon}>
              {'\uD83C\uDFF9'}
            </AnimatedTextLine>
            <AnimatedTextLine delay={300} style={s.defeatLabel}>
              DEFEAT
            </AnimatedTextLine>
            <AnimatedTextLine delay={600} style={s.slayerDefeatTitle}>
              {'처단자의 총성이 울려 퍼졌으나...'}
            </AnimatedTextLine>
            <AnimatedTextLine delay={900} style={s.slayerDefeatSubtitle}>
              {'당신의 편은 이미 무너져 있었습니다'}
            </AnimatedTextLine>
          </>
        )}

        {/* ── Standard victory headings ── */}
        {theme === 'victory' && myTeamIsGood && (
          <>
            <AnimatedTextLine delay={200} style={s.victoryLabel}>
              VICTORY
            </AnimatedTextLine>
            <AnimatedTextLine delay={500} style={s.victoryTitle}>
              마을에 평화가 찾아왔습니다
            </AnimatedTextLine>
            <AnimatedTextLine delay={800} style={s.victorySubtitle}>
              선한 영혼들이 악을 몰아냈습니다
            </AnimatedTextLine>
          </>
        )}
        {theme === 'victory' && !myTeamIsGood && (
          <>
            <AnimatedTextLine delay={200} style={s.victoryLabel}>
              VICTORY
            </AnimatedTextLine>
            <AnimatedTextLine delay={500} style={s.victoryTitle}>
              어둠이 승리했습니다
            </AnimatedTextLine>
            <AnimatedTextLine delay={800} style={s.victorySubtitle}>
              마을은 당신의 손아귀에 떨어졌습니다
            </AnimatedTextLine>
          </>
        )}

        {/* ── Standard defeat headings ── */}
        {theme === 'defeat' && myTeamIsGood && (
          <>
            <AnimatedTextLine delay={400} style={s.defeatLabel}>
              DEFEAT
            </AnimatedTextLine>
            <AnimatedTextLine delay={700} style={s.defeatTitle}>
              시계탑에 피가 흐릅니다
            </AnimatedTextLine>
            <AnimatedTextLine delay={1000} style={s.defeatSubtitle}>
              어둠이 마을을 삼켰습니다
            </AnimatedTextLine>
          </>
        )}
        {theme === 'defeat' && !myTeamIsGood && (
          <>
            <AnimatedTextLine delay={400} style={s.defeatLabel}>
              DEFEAT
            </AnimatedTextLine>
            <AnimatedTextLine delay={700} style={s.defeatTitle}>
              악의 계획이 무너졌습니다
            </AnimatedTextLine>
            <AnimatedTextLine delay={1000} style={s.defeatSubtitle}>
              마을 사람들이 진실을 밝혀냈습니다
            </AnimatedTextLine>
          </>
        )}

        {/* Reason */}
        <AnimatedTextLine
          delay={1200}
          style={
            theme === 'slayer'
              ? s.reasonSlayer
              : isVictory
                ? s.reasonVictory
                : s.reasonDefeat
          }
        >
          {gameResult.reason}
        </AnimatedTextLine>

        {/* Divider */}
        <Animated.View
          entering={FadeIn.delay(1400).duration(600)}
          style={[s.divider, { backgroundColor: dividerColor }]}
        />

        {/* Player list */}
        <Animated.View
          entering={FadeIn.delay(1500).duration(400)}
          style={s.playerListHeader}
        >
          <Text style={[s.playerListTitle, { color: listTitleColor }]}>
            역할 공개
          </Text>
        </Animated.View>

        {gameResult.players.map((p, i) => (
          <PlayerRow key={p.id} player={p} index={i} theme={theme} />
        ))}

        {/* Confirm button */}
        <Animated.View entering={FadeIn.delay(2000).duration(600)}>
          <Pressable
            onPress={onDismiss}
            style={({ pressed }) => [
              s.confirmButton,
              {
                borderColor: buttonBorder,
                backgroundColor: buttonBg,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[s.confirmButtonText, { color: buttonTextColor }]}>
              확인
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ height: 60 }} />
      </View>
    </BaseOverlay>
  );
}

const s = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.15,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  // Slayer Easter Egg styles (golden/amber)
  slayerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  slayerLabel: {
    fontSize: 16,
    letterSpacing: 16,
    color: '#ffd700',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  slayerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffe066',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  slayerSubtitle: {
    fontSize: 15,
    color: '#c0a030',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  slayerDefeatTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#b8860b',
    textAlign: 'center',
    marginBottom: 8,
  },
  slayerDefeatSubtitle: {
    fontSize: 15,
    color: '#8a6a20',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonSlayer: {
    fontSize: 13,
    color: '#a08030',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },

  // Victory styles (blue)
  victoryLabel: {
    fontSize: 14,
    letterSpacing: 12,
    color: '#4da6ff',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  victoryTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e0eeff',
    textAlign: 'center',
    marginBottom: 8,
  },
  victorySubtitle: {
    fontSize: 15,
    color: '#6aa0d0',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonVictory: {
    fontSize: 13,
    color: '#5080a0',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },

  // Defeat styles
  defeatLabel: {
    fontSize: 14,
    letterSpacing: 12,
    color: '#8b0000',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  defeatTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#cc2020',
    textAlign: 'center',
    marginBottom: 8,
  },
  defeatSubtitle: {
    fontSize: 15,
    color: '#7a2020',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonDefeat: {
    fontSize: 13,
    color: '#6a3030',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },

  // Common
  divider: {
    width: 60,
    height: 1,
    marginBottom: 24,
  },
  playerListHeader: {
    marginBottom: 12,
  },
  playerListTitle: {
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  playerNameCol: {
    flex: 1,
  },
  playerName: {
    color: '#d0ccc6',
    fontSize: 14,
    fontWeight: '500',
  },
  playerRoleCol: {
    alignItems: 'flex-end',
  },
  playerRole: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerTeam: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  confirmButton: {
    marginTop: 28,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
