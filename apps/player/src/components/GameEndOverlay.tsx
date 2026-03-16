import type { GameResult, Team } from '@clocktower/shared';
import { useEffect, useMemo } from 'react';
import { Text, Vibration, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { BaseOverlay } from './BaseOverlay';
import { DefeatEffects, SlayerEffects, VictoryEffects } from './GameEndEffects';
import { styles as s } from './GameEndOverlay.styles';

const TEAM_LABELS: Record<string, string> = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
};

function isGoodTeam(team: Team): boolean {
  return team === 'townsfolk' || team === 'outsider';
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
      onDismiss={onDismiss}
      dismissOnBackdropPress
      dismissDelayMs={2500}
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
              {'단 한 발의 화살이 악마를 쓰러뜨렸습니다'}
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
              {'처단자의 화살이 날아갔으나...'}
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

        <Animated.Text
          entering={FadeIn.delay(2500).duration(600)}
          style={[s.dismissHint, { color: buttonTextColor }]}
        >
          터치하여 닫기
        </Animated.Text>

        <View style={s.bottomSpacer} />
      </View>
    </BaseOverlay>
  );
}
