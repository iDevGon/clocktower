import { getRandomGameTip, type Role, type Team } from '@clocktower/shared';
import {
  AbilityText,
  colors,
  GameTip,
  InkBlot,
  Ornament,
  useReducedMotion,
  WaxSeal,
} from '@clocktower/ui';
import { useEffect, useId, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import type { EvilInfo } from '../stores/playerStore';
import { styles as s } from './GameStartReveal.styles';

// ── 팀별 편지 세팅 ──────────────────────────────────────────────────────────

type TeamTheme = {
  label: string;
  sealTone: 'crimson' | 'amber' | 'twilight' | 'verdure' | 'bruise';
  sealGlyph: 'star' | 'moon' | 'clock' | 'lily' | 'bat';
  eyebrowColor: string;
  accentInk: string;
};

const TEAM_THEMES: Record<Team, TeamTheme> = {
  townsfolk: {
    label: '마을 주민',
    sealTone: 'twilight',
    sealGlyph: 'lily',
    eyebrowColor: colors.twilight.deep,
    accentInk: colors.twilight.deep,
  },
  outsider: {
    label: '외지인',
    sealTone: 'verdure',
    sealGlyph: 'lily',
    eyebrowColor: colors.verdure.deep,
    accentInk: colors.verdure.deep,
  },
  minion: {
    label: '하수인',
    sealTone: 'amber',
    sealGlyph: 'bat',
    eyebrowColor: colors.ember.deep,
    accentInk: colors.ember.deep,
  },
  demon: {
    label: '악마',
    sealTone: 'crimson',
    sealGlyph: 'bat',
    eyebrowColor: colors.crimson.deep,
    accentInk: colors.crimson.deep,
  },
  traveller: {
    label: '여행자',
    sealTone: 'bruise',
    sealGlyph: 'star',
    eyebrowColor: colors.bruise.deep,
    accentInk: colors.bruise.deep,
  },
};

// ── 타이밍 ─────────────────────────────────────────────────────────────────
// 한 번에 한 순간. 서두르지 않고, 과하지 않게.

const T_VIGNETTE_IN = 0;
const T_ENVELOPE_IN = 700;
const T_SEAL_ANTICIPATE = 2100;
const T_SEAL_BREAK = 2600;
const T_LETTER_REVEAL = 3200;
const T_CONTENT_CASCADE = 3700;
const T_SUBTITLE = 4800;
const T_AUTO_DISMISS = 10000;

const PAPER = colors.parchment.letter;
const PAPER_FOLD = colors.parchment.letterFold;
const PAPER_EDGE = colors.parchment.letterEdge;

// ── 배경 촛불 앰버 글로우 ──────────────────────────────────────────────────

function CandleAura() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const style = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.55,
  }));

  return (
    <Animated.View style={[s.candleAura, style]} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 700"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id={`aura-${uid}`} x1="50%" y1="50%" x2="50%" y2="0%">
            <Stop
              offset="0%"
              stopColor={colors.ember.core}
              stopOpacity="0.45"
            />
            <Stop
              offset="60%"
              stopColor={colors.ember.deep}
              stopOpacity="0.12"
            />
            <Stop offset="100%" stopColor={colors.ink.void} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d="M0,0 L400,0 L400,700 L0,700 Z" fill={`url(#aura-${uid})`} />
      </Svg>
    </Animated.View>
  );
}

// ── 편지 봉투 (열리기 전) ──────────────────────────────────────────────────

interface EnvelopeProps {
  theme: TeamTheme;
  /** 0 = 닫힘, 1 = 봉인 깨짐 */
  breakProgress: number;
}

function EnvelopeShape({ theme }: EnvelopeProps) {
  // 봉투는 가로 240, 세로 160 (편지 비율)
  const W = 240;
  const H = 160;
  const flapH = H * 0.58;

  return (
    <View style={{ width: W, height: H }}>
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* 봉투 뒷면 */}
        <Path
          d={`M4,4 L${W - 4},4 L${W - 4},${H - 4} L4,${H - 4} Z`}
          fill={PAPER}
          stroke={PAPER_EDGE}
          strokeWidth={1.2}
        />
        {/* 봉투 플랩 (삼각형 — 실링 아래) */}
        <Path
          d={`M4,4 L${W / 2},${flapH} L${W - 4},4 L${W - 4},${flapH - 4} L${W / 2},${flapH + 4} L4,${flapH - 4} Z`}
          fill={PAPER_FOLD}
          stroke={PAPER_EDGE}
          strokeWidth={1}
        />
        {/* 접힘 선 */}
        <Path
          d={`M4,${flapH - 4} L${W / 2},${flapH + 6} L${W - 4},${flapH - 4}`}
          fill="none"
          stroke={PAPER_EDGE}
          strokeWidth={0.8}
          opacity={0.55}
        />
      </Svg>

      {/* 중앙 밀랍 봉인 */}
      <View style={s.envelopeSeal}>
        <WaxSeal size={58} tone={theme.sealTone} glyph={theme.sealGlyph} />
      </View>
    </View>
  );
}

// ── 편지 (열린 후) ─────────────────────────────────────────────────────────

interface LetterProps {
  role: Role;
  evilInfo?: EvilInfo | null;
  theme: TeamTheme;
}

function Letter({ role, evilInfo, theme }: LetterProps) {
  return (
    <View style={s.letterPaper}>
      {/* 상단 작은 실링 + 팀 라벨 */}
      <View style={s.letterHeader}>
        <WaxSeal size={32} tone={theme.sealTone} glyph={theme.sealGlyph} />
        <Text style={[s.letterEyebrow, { color: theme.eyebrowColor }]}>
          {theme.label.toUpperCase()}
        </Text>
      </View>

      {/* 역할명 — 대형 세리프 */}
      <Text style={s.letterRoleName}>{role.name}</Text>

      <Ornament
        kind="divider"
        width={140}
        style={s.letterOrnament}
        color={PAPER_EDGE}
      />

      {/* 능력 설명 */}
      <AbilityText text={role.ability} style={s.letterAbility} />

      {/* 악 팀 정보 — 데몬/미니언에게만 */}
      {evilInfo && (role.team === 'demon' || role.team === 'minion') ? (
        <>
          <Ornament
            kind="divider"
            width={90}
            style={s.letterOrnamentMid}
            color={PAPER_EDGE}
          />
          <Text style={[s.letterAsideLabel, { color: theme.accentInk }]}>
            그대의 동지
          </Text>
          {role.team === 'demon' && evilInfo.minionNames?.length ? (
            <Text style={s.letterAsideBody}>
              하수인: {evilInfo.minionNames.join(' · ')}
            </Text>
          ) : null}
          {role.team === 'demon' && evilInfo.bluffRoles?.length ? (
            <Text style={s.letterAsideBody}>
              블러프: {evilInfo.bluffRoles.map((r) => r.name).join(' · ')}
            </Text>
          ) : null}
          {role.team === 'minion' && evilInfo.demonName ? (
            <Text style={s.letterAsideBody}>악마: {evilInfo.demonName}</Text>
          ) : null}
          {role.team === 'minion' && evilInfo.otherMinionNames?.length ? (
            <Text style={s.letterAsideBody}>
              다른 하수인: {evilInfo.otherMinionNames.join(' · ')}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

// ── 메인 오버레이 ──────────────────────────────────────────────────────────

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
  const theme = TEAM_THEMES[role.team];
  const tip = useMemo(
    () => getRandomGameTip('firstNight', role.id, role.team),
    [role.id, role.team],
  );

  // 페이즈 공유 값들
  const vignette = useSharedValue(0);
  const envelopeScale = useSharedValue(0.4);
  const envelopeOpacity = useSharedValue(0);
  const sealPulse = useSharedValue(0);
  const sealBreak = useSharedValue(0);
  const letterOpacity = useSharedValue(0);
  const letterScale = useSharedValue(0.96);
  const contentCascade = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const fadeOut = useSharedValue(1);
  const dismissed = useSharedValue(false);

  const startDismiss = () => {
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
    const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
    const easeIn = Easing.in(Easing.quad);

    if (reduced) {
      vignette.value = 1;
      envelopeScale.value = 1;
      envelopeOpacity.value = 0;
      sealBreak.value = 1;
      letterOpacity.value = 1;
      letterScale.value = 1;
      contentCascade.value = 1;
      subtitleOpacity.value = 1;
    } else {
      // 1. Vignette fade-in
      vignette.value = withDelay(
        T_VIGNETTE_IN,
        withTiming(1, { duration: 600, easing: easeOut }),
      );

      // 2. Envelope materialize
      envelopeOpacity.value = withDelay(
        T_ENVELOPE_IN,
        withTiming(1, { duration: 800, easing: easeOut }),
      );
      envelopeScale.value = withDelay(
        T_ENVELOPE_IN,
        withTiming(1, { duration: 900, easing: easeOut }),
      );

      // 3. Seal anticipate (pulse)
      sealPulse.value = withDelay(
        T_SEAL_ANTICIPATE,
        withSequence(
          withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 240, easing: easeIn }),
        ),
      );

      // 4. Seal breaks + envelope fade
      sealBreak.value = withDelay(
        T_SEAL_BREAK,
        withTiming(1, { duration: 480, easing: easeOut }),
      );
      envelopeOpacity.value = withDelay(
        T_SEAL_BREAK + 260,
        withTiming(0, { duration: 420, easing: easeIn }),
      );

      // 5. Letter reveal
      letterOpacity.value = withDelay(
        T_LETTER_REVEAL,
        withTiming(1, { duration: 520, easing: easeOut }),
      );
      letterScale.value = withDelay(
        T_LETTER_REVEAL,
        withTiming(1, { duration: 720, easing: easeOut }),
      );

      // 6. Content cascade (team label + role + ability sequential via one progress)
      contentCascade.value = withDelay(
        T_CONTENT_CASCADE,
        withTiming(1, { duration: 900, easing: easeOut }),
      );

      // 7. Subtitle
      subtitleOpacity.value = withDelay(
        T_SUBTITLE,
        withTiming(1, { duration: 700, easing: easeOut }),
      );
    }

    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      startDismiss();
    }, T_AUTO_DISMISS);

    return () => {
      clearTimeout(dismissTimer);
      cancelAnimation(vignette);
      cancelAnimation(envelopeScale);
      cancelAnimation(envelopeOpacity);
      cancelAnimation(sealPulse);
      cancelAnimation(sealBreak);
      cancelAnimation(letterOpacity);
      cancelAnimation(letterScale);
      cancelAnimation(contentCascade);
      cancelAnimation(subtitleOpacity);
      cancelAnimation(fadeOut);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  // ── 애니메이션 스타일 ──────────────────────────────────────────────────
  const rootStyle = useAnimatedStyle(() => ({ opacity: fadeOut.value }));
  const vignetteStyle = useAnimatedStyle(() => ({ opacity: vignette.value }));

  const envelopeWrapStyle = useAnimatedStyle(() => {
    const pulse = sealPulse.value;
    const shake = sealBreak.value > 0 && sealBreak.value < 0.5 ? 2 : 0;
    return {
      opacity: envelopeOpacity.value,
      transform: [
        { scale: envelopeScale.value + pulse * 0.03 },
        { translateX: shake * Math.sin(sealBreak.value * 40) },
      ],
    };
  });

  const letterWrapStyle = useAnimatedStyle(() => ({
    opacity: letterOpacity.value,
    transform: [{ scale: letterScale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentCascade.value,
    transform: [{ translateY: (1 - contentCascade.value) * 8 }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, s.root, rootStyle]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={startDismiss}
        accessibilityLabel="역할 공개 닫기"
        accessibilityRole="button"
      >
        {/* 배경 */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.ink.void },
          ]}
        />

        {/* 촛불 아우라 */}
        <Animated.View style={[StyleSheet.absoluteFill, vignetteStyle]}>
          <CandleAura />
        </Animated.View>

        {/* 본체 */}
        <View style={s.content}>
          {/* 편지 / 봉투 영역 */}
          <View style={s.stage}>
            {/* 봉투 (봉인 깨지기 전에만) */}
            <Animated.View style={[s.stageLayer, envelopeWrapStyle]}>
              <EnvelopeShape theme={theme} breakProgress={0} />
              {/* 잉크 번짐 — 봉인 깨질 때 */}
              <View style={s.inkLayer} pointerEvents="none">
                <InkBlot
                  active={!reduced}
                  color={
                    theme.sealTone === 'crimson'
                      ? colors.crimson.deep
                      : colors.ink.deep
                  }
                  size={80}
                  speed={0.4}
                />
              </View>
            </Animated.View>

            {/* 편지 */}
            <Animated.View style={[s.stageLayer, letterWrapStyle]}>
              <Animated.View style={contentStyle}>
                <Letter role={role} evilInfo={evilInfo} theme={theme} />
              </Animated.View>
            </Animated.View>
          </View>

          {/* 부제 + 팁 + 힌트 */}
          <Animated.View style={[s.subtitleBlock, subtitleStyle]}>
            <Text style={s.subtitleText}>첫 번째 밤이 찾아옵니다</Text>
            <GameTip tip={tip} color={colors.parchment.mid} delay={0} />
            <Text style={s.dismissHint}>터치하여 계속</Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
