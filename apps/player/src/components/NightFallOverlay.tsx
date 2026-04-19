import { getRandomGameTip } from '@clocktower/shared';
import {
  colors,
  FullScreenVignette,
  GameTip,
  Ornament,
  useReducedMotion,
} from '@clocktower/ui';
import { useEffect, useId, useMemo } from 'react';
import { View } from 'react-native';
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
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { usePlayerStore } from '../stores/playerStore';
import { BaseOverlay } from './BaseOverlay';
import { styles as s } from './NightFallOverlay.styles';

// ── 촛불 불꽃 — 중심 시각적 앵커 ──────────────────────────────────────────

function CandleFlame() {
  const uid = useId().replace(/:/g, '');
  const flicker = useSharedValue(0.5);
  const descent = useSharedValue(1); // 시작부터 보이게

  useEffect(() => {
    // 이후 계속 깜빡임
    flicker.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 180, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 260, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.85, { duration: 210, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.5, { duration: 320, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(flicker);
    };
  }, [flicker]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: descent.value * interpolate(flicker.value, [0, 1], [0.65, 1]),
    transform: [
      { scaleY: 0.85 + flicker.value * 0.25 },
      { scaleX: 0.95 + flicker.value * 0.1 },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: descent.value * interpolate(flicker.value, [0, 1], [0.15, 0.4]),
    transform: [{ scale: 0.9 + flicker.value * 0.3 }],
  }));

  const W = 80;
  const H = 120;

  return (
    <View style={s.flameStage}>
      {/* 아우라 */}
      <Animated.View style={[s.flameHalo, haloStyle]} />

      {/* 불꽃 */}
      <Animated.View style={flameStyle}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <LinearGradient
              id={`flame-${uid}`}
              x1="50%"
              y1="0%"
              x2="50%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#fff0c8" stopOpacity="0.95" />
              <Stop
                offset="35%"
                stopColor={colors.ember.glow}
                stopOpacity="1"
              />
              <Stop
                offset="75%"
                stopColor={colors.ember.core}
                stopOpacity="0.9"
              />
              <Stop
                offset="100%"
                stopColor={colors.crimson.core}
                stopOpacity="0.5"
              />
            </LinearGradient>
          </Defs>
          {/* 불꽃 모양 — 물방울 뒤집힌 형태 */}
          <Path
            d={`M${W / 2},${H * 0.95}
                C${W * 0.15},${H * 0.75} ${W * 0.25},${H * 0.4} ${W / 2},${H * 0.05}
                C${W * 0.75},${H * 0.4} ${W * 0.85},${H * 0.75} ${W / 2},${H * 0.95} Z`}
            fill={`url(#flame-${uid})`}
          />
        </Svg>
      </Animated.View>

      {/* 심지 베이스 — 작은 어두운 받침 */}
      <View style={s.candleBase} />
    </View>
  );
}

// ── 시계탑 실루엣 (멀리, 아주 흐리게) ──────────────────────────────────────

function ClocktowerSilhouette() {
  return (
    <View style={s.clocktowerLayer} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYEnd meet"
      >
        {/* 하단 건물 */}
        <Path
          d="M0,240 L0,200 L380,200 L380,240 Z"
          fill="#000"
          opacity={0.45}
        />
        {/* 시계탑 */}
        <Path
          d="M170,200 L170,120 L180,100 L190,80 L200,60 L210,80 L220,100 L230,120 L230,200 Z"
          fill="#000"
          opacity={0.55}
        />
        {/* 시계 글자판 */}
        <Path
          d="M195,125 a8,8 0 1 0 16,0 a8,8 0 1 0 -16,0"
          fill={colors.ember.deep}
          opacity={0.3}
        />
      </Svg>
    </View>
  );
}

// ── 메인 오버레이 ──────────────────────────────────────────────────────────

interface NightFallOverlayProps {
  onDismiss: () => void;
}

export function NightFallOverlay({ onDismiss }: NightFallOverlayProps) {
  const reduced = useReducedMotion();
  const role = usePlayerStore((st) => st.role);
  const tip = useMemo(
    () => getRandomGameTip('night', role?.id, role?.team),
    [role?.id, role?.team],
  );

  return (
    <BaseOverlay
      backgroundColor={colors.ink.void}
      zIndex={87}
      effectsLayer={
        <>
          <FullScreenVignette
            color="#030205"
            opacityRange={[0.55, 0.9]}
            duration={2800}
          />
          <ClocktowerSilhouette />
        </>
      }
      onDismiss={onDismiss}
      dismissOnBackdropPress
      autoDismissMs={3500}
      fadeOutDurationMs={1000}
    >
      <View style={s.content}>
        {!reduced ? <CandleFlame /> : <View style={s.flameStageStatic} />}

        <Animated.Text
          entering={FadeIn.delay(500).duration(600)}
          style={s.label}
        >
          어둠이 찾아옵니다
        </Animated.Text>

        <Ornament kind="divider" width={140} style={s.ornament} />

        <Animated.Text
          entering={FadeIn.delay(900).duration(700)}
          style={s.message}
        >
          모두 눈을 감으세요
        </Animated.Text>

        <GameTip tip={tip} color={colors.parchment.low} delay={1500} />
      </View>
    </BaseOverlay>
  );
}
