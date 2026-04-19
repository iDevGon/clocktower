import { colors, useReducedMotion } from '@clocktower/ui';
import { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

interface CandleDyingProps {
  /** 불꽃이 꺼지기 시작할 때까지 대기 시간 (ms) */
  dieDelay?: number;
  /** 꺼지는 데 걸리는 시간 (ms) */
  dieDuration?: number;
  /** 불꽃 크기 */
  size?: number;
}

/**
 * 촛불이 서서히 꺼지는 연출 — 사망/처형/간밤의 소식 전반에 공유.
 * 불꽃이 깜빡이다 서서히 사그라들고, 심지에서 연기가 피어오른다.
 */
export function CandleDying({
  dieDelay = 300,
  dieDuration = 1400,
  size = 100,
}: CandleDyingProps) {
  const reduced = useReducedMotion();
  const uid = useId().replace(/:/g, '');

  // 초기값을 보이는 상태로 두어 첫 수백 ms의 깜빡임을 방지
  const flicker = useSharedValue(0.5);
  const alive = useSharedValue(1);
  const smoke1 = useSharedValue(0);
  const smoke2 = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      alive.value = 0;
      flicker.value = 0.5;
      smoke1.value = 1;
      smoke2.value = 1;
      return;
    }

    // 깜빡임 — dieDelay까지만 활발하게, 이후 점점 축 쳐짐
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 160, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.5, { duration: 200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.85, { duration: 180, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 260, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    // 불꽃이 꺼짐
    alive.value = withDelay(
      dieDelay,
      withTiming(0, { duration: dieDuration, easing: Easing.in(Easing.cubic) }),
    );

    // 연기 두 줄기
    smoke1.value = withDelay(
      dieDelay + dieDuration * 0.4,
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.cubic) }),
    );
    smoke2.value = withDelay(
      dieDelay + dieDuration * 0.7,
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }),
    );

    return () => {
      cancelAnimation(flicker);
      cancelAnimation(alive);
      cancelAnimation(smoke1);
      cancelAnimation(smoke2);
    };
  }, [reduced, dieDelay, dieDuration, alive, flicker, smoke1, smoke2]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: alive.value * interpolate(flicker.value, [0, 1], [0.5, 1]),
    transform: [
      { scaleY: alive.value * (0.7 + flicker.value * 0.35) },
      { scaleX: alive.value * (0.9 + flicker.value * 0.15) },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: alive.value * 0.3 * interpolate(flicker.value, [0, 1], [0.4, 1]),
    transform: [{ scale: alive.value * (0.9 + flicker.value * 0.3) }],
  }));

  const smoke1Style = useAnimatedStyle(() => ({
    opacity: interpolate(smoke1.value, [0, 0.3, 0.8, 1], [0, 0.5, 0.3, 0]),
    transform: [
      { translateY: -smoke1.value * size * 1.4 },
      { translateX: Math.sin(smoke1.value * 4) * 6 },
      { scale: 0.4 + smoke1.value * 0.8 },
    ],
  }));

  const smoke2Style = useAnimatedStyle(() => ({
    opacity: interpolate(smoke2.value, [0, 0.3, 0.8, 1], [0, 0.3, 0.2, 0]),
    transform: [
      { translateY: -smoke2.value * size * 1.6 },
      { translateX: -Math.sin(smoke2.value * 5) * 8 },
      { scale: 0.3 + smoke2.value },
    ],
  }));

  const W = size * 0.55;
  const H = size;

  return (
    <View style={[styles.root, { width: size, height: size * 1.8 }]}>
      {/* 연기 두 줄기 */}
      <Animated.View style={[styles.smoke, smoke1Style]} />
      <Animated.View style={[styles.smoke, smoke2Style]} />

      {/* 아우라 */}
      <Animated.View
        style={[
          styles.halo,
          { width: size * 1.5, height: size * 1.5, borderRadius: size * 0.75 },
          haloStyle,
        ]}
      />

      {/* 불꽃 */}
      <Animated.View style={[styles.flame, flameStyle]}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <LinearGradient
              id={`cdFlame-${uid}`}
              x1="50%"
              y1="0%"
              x2="50%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="#fff0c8" stopOpacity="0.95" />
              <Stop
                offset="40%"
                stopColor={colors.ember.glow}
                stopOpacity="1"
              />
              <Stop
                offset="80%"
                stopColor={colors.ember.core}
                stopOpacity="0.85"
              />
              <Stop
                offset="100%"
                stopColor={colors.crimson.deep}
                stopOpacity="0.5"
              />
            </LinearGradient>
          </Defs>
          <Path
            d={`M${W / 2},${H * 0.95}
                C${W * 0.15},${H * 0.75} ${W * 0.25},${H * 0.4} ${W / 2},${H * 0.05}
                C${W * 0.75},${H * 0.4} ${W * 0.85},${H * 0.75} ${W / 2},${H * 0.95} Z`}
            fill={`url(#cdFlame-${uid})`}
          />
        </Svg>
      </Animated.View>

      {/* 심지 */}
      <View style={styles.wick} />
      {/* 양초 받침 */}
      <View style={styles.candleBase} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  smoke: {
    position: 'absolute',
    top: '35%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3a3834',
  },
  halo: {
    position: 'absolute',
    top: '5%',
    backgroundColor: colors.ember.core,
    opacity: 0.2,
  },
  flame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wick: {
    width: 2,
    height: 8,
    backgroundColor: colors.ink.void,
  },
  candleBase: {
    width: 18,
    height: 6,
    borderRadius: 2,
    backgroundColor: colors.ink.rise,
    marginTop: -2,
  },
});
