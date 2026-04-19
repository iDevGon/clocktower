import type { GameResult, Team } from '@clocktower/shared';
import {
  colors,
  Ornament,
  Sigil,
  type SigilTeam,
  WaxSeal,
} from '@clocktower/ui';
import { useEffect, useMemo } from 'react';
import { Text, Vibration, View } from 'react-native';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';
import { BaseOverlay } from './BaseOverlay';
import { DefeatEffects, SlayerEffects, VictoryEffects } from './GameEndEffects';
import { styles as s } from './GameEndOverlay.styles';

type Mood = 'victory' | 'defeat' | 'slayer';

const TEAM_LABELS: Record<string, string> = {
  townsfolk: '마을 주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
  traveller: '여행자',
};

const VALID_SIGIL_TEAMS = new Set<string>([
  'townsfolk',
  'outsider',
  'minion',
  'demon',
  'traveller',
]);

function teamToSigil(team: string): SigilTeam {
  return VALID_SIGIL_TEAMS.has(team) ? (team as SigilTeam) : 'unknown';
}

function isGoodTeam(team: Team): boolean {
  return team === 'townsfolk' || team === 'outsider';
}

// ── 판결 카피 ──────────────────────────────────────────────────────────────

function getHeadings(mood: Mood, myTeamIsGood: boolean, isSlayerKill: boolean) {
  if (mood === 'slayer' && isSlayerKill) {
    return {
      eyebrow: '처단자의 한 발',
      verdict: '사냥꾼이 악마를 쓰러뜨렸다',
      subtitle: '단 한 발의 화살이 어둠을 가릅니다',
    };
  }
  if (mood === 'slayer') {
    return {
      eyebrow: '화살은 빗나갔다',
      verdict: '그대의 편은 이미 무너졌다',
      subtitle: '시계탑에 적막이 흐릅니다',
    };
  }
  if (mood === 'victory') {
    return myTeamIsGood
      ? {
          eyebrow: '승리',
          verdict: '마을에 평화가 찾아왔다',
          subtitle: '선한 영혼들이 어둠을 몰아냈습니다',
        }
      : {
          eyebrow: '승리',
          verdict: '어둠이 마을을 삼켰다',
          subtitle: '그대의 손아귀에 시계탑이 떨어졌습니다',
        };
  }
  // defeat
  return myTeamIsGood
    ? {
        eyebrow: '패배',
        verdict: '시계탑에 피가 흐른다',
        subtitle: '어둠이 마을을 집어삼켰습니다',
      }
    : {
        eyebrow: '패배',
        verdict: '계획이 무너졌다',
        subtitle: '마을 사람들이 진실을 밝혀냈습니다',
      };
}

// ── 플레이어 행 ─────────────────────────────────────────────────────────────

function PlayerRow({
  player,
  index,
}: {
  player: GameResult['players'][number];
  index: number;
}) {
  const sigilTeam = teamToSigil(player.team);
  const teamLabel = TEAM_LABELS[player.team] ?? player.team;

  return (
    <Animated.View
      entering={FadeIn.delay(1600 + index * 70).duration(500)}
      style={[s.playerRow, player.isAlive ? null : s.playerRowDead]}
    >
      <Sigil
        roleName={player.role.name}
        team={sigilTeam}
        size={34}
        dimmed={!player.isAlive}
      />
      <View style={s.playerNameCol}>
        <Text style={[s.playerName, player.isAlive ? null : s.playerNameDead]}>
          {player.name}
        </Text>
        <Text style={s.playerTeam}>{teamLabel}</Text>
      </View>
      <Text style={s.playerRole}>{player.role.name}</Text>
    </Animated.View>
  );
}

// ── 메인 오버레이 ──────────────────────────────────────────────────────────

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

  const mood: Mood = isSlayerKill ? 'slayer' : isVictory ? 'victory' : 'defeat';
  const headings = getHeadings(mood, myTeamIsGood, isSlayerKill && isVictory);

  const effectsLayer = useMemo(() => {
    if (mood === 'slayer') return <SlayerEffects />;
    if (mood === 'victory') return <VictoryEffects />;
    return <DefeatEffects />;
  }, [mood]);

  // 서사적 실링 — 이긴 팀의 정체
  const winnerSeal: {
    tone: 'crimson' | 'verdure' | 'amber';
    glyph: 'lily' | 'bat' | 'star';
  } =
    mood === 'slayer' && isVictory
      ? { tone: 'amber', glyph: 'star' }
      : goodWon
        ? { tone: 'verdure', glyph: 'lily' }
        : { tone: 'crimson', glyph: 'bat' };

  const accentColor =
    mood === 'slayer'
      ? colors.ember.glow
      : isVictory
        ? colors.ember.glow
        : colors.crimson.glow;

  return (
    <BaseOverlay
      backgroundColor={colors.ink.void}
      zIndex={100}
      effectsLayer={effectsLayer}
      scrollable
      contentAlign="flex-start"
      onDismiss={onDismiss}
      dismissOnBackdropPress
      dismissDelayMs={2500}
    >
      <View style={s.content}>
        {/* 두루마리 — 큰 양피지 박스 */}
        <View style={s.scroll}>
          <View style={s.scrollEdgeTop} />

          {/* 봉인 + 헤드라인 */}
          <Animated.View
            entering={ZoomIn.delay(200)
              .duration(500)
              .easing(Easing.out(Easing.cubic))}
            style={s.sealHolder}
          >
            <WaxSeal
              size={88}
              tone={winnerSeal.tone}
              glyph={winnerSeal.glyph}
            />
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(600).duration(500)}
            style={[s.eyebrow, { color: accentColor }]}
          >
            {headings.eyebrow.toUpperCase()}
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(850).duration(700)}
            style={s.verdict}
          >
            {headings.verdict}
          </Animated.Text>

          <Animated.Text
            entering={FadeIn.delay(1100).duration(600)}
            style={s.subtitle}
          >
            {headings.subtitle}
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(1300).duration(500)}
            style={s.ornament}
          >
            <Ornament
              kind="divider"
              width={200}
              color={s.ornamentColor.color}
            />
          </Animated.View>

          <Animated.Text
            entering={FadeIn.delay(1400).duration(500)}
            style={s.reason}
          >
            {gameResult.reason}
          </Animated.Text>

          <Animated.View
            entering={FadeIn.delay(1550).duration(500)}
            style={s.ornament}
          >
            <Ornament
              kind="divider"
              width={200}
              color={s.ornamentColor.color}
            />
          </Animated.View>

          {/* 역할 공개 */}
          <Animated.Text
            entering={FadeIn.delay(1550).duration(500)}
            style={s.rosterEyebrow}
          >
            역할 공개
          </Animated.Text>

          <View style={s.rosterList}>
            {gameResult.players.map((p, i) => (
              <PlayerRow key={p.id} player={p} index={i} />
            ))}
          </View>

          <View style={s.scrollEdgeBottom} />
        </View>

        <Animated.Text
          entering={FadeIn.delay(2500).duration(600)}
          style={s.dismissHint}
        >
          터치하여 닫기
        </Animated.Text>

        <View style={s.bottomSpacer} />
      </View>
    </BaseOverlay>
  );
}
