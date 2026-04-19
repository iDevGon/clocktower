import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useReducedMotion } from '../ReducedMotionContext';
import { colors, motion } from '../tokens';

interface InkBlotProps {
  /** 재생 여부 — false면 잉크가 퍼지지 않은 초기 상태 */
  active: boolean;
  /** 잉크 색상. 기본 크림슨 */
  color?: string;
  /** 총 직경(px) — 번짐 최대 크기 */
  size?: number;
  /** 번지는 속도 멀티플라이어. 1=기본 */
  speed?: number;
  style?: ViewStyle;
}

/**
 * 잉크 한 방울이 종이에 번지는 모션.
 *
 * 사망 오버레이, 저주 마커, 밤 낙하 등 "무언가가 서서히 퍼지는" 순간에 사용.
 * 세 겹의 blot (중심 진하게 + 중간 + 외곽 희미)이 시차를 두고 번진다.
 */
export function InkBlot({
  active,
  color = colors.crimson.deep,
  size = 240,
  speed = 1,
  style,
}: InkBlotProps) {
  const reduced = useReducedMotion();
  const core = useSharedValue(0);
  const mid = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      core.value = 0;
      mid.value = 0;
      halo.value = 0;
      return;
    }
    if (reduced) {
      core.value = 1;
      mid.value = 1;
      halo.value = 1;
      return;
    }
    const duration = motion.duration.cinematic * speed;
    const easing = Easing.bezier(...motion.easing.cinematic);

    core.value = withTiming(1, { duration: duration * 0.4, easing });
    mid.value = withDelay(
      120,
      withTiming(1, { duration: duration * 0.7, easing }),
    );
    halo.value = withDelay(220, withTiming(1, { duration, easing }));

    return () => {
      cancelAnimation(core);
      cancelAnimation(mid);
      cancelAnimation(halo);
    };
  }, [active, reduced, speed, core, mid, halo]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.2 + core.value * 0.3 }],
    opacity: core.value,
  }));
  const midStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.3 + mid.value * 0.55 }],
    opacity: mid.value * 0.7,
  }));
  const haloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.4 + halo.value * 0.9 }],
    opacity: halo.value * 0.4,
  }));

  return (
    <View
      style={[styles.root, { width: size, height: size }, style]}
      pointerEvents="none"
    >
      <Animated.View
        style={[styles.circle, { backgroundColor: color }, haloStyle]}
      />
      <Animated.View
        style={[styles.circle, { backgroundColor: color }, midStyle]}
      />
      <Animated.View
        style={[styles.circle, { backgroundColor: color }, coreStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
});
