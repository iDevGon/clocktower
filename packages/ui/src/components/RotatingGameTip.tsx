import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const FADE_DURATION = 600;
const DEFAULT_INTERVAL = 6000;

interface RotatingGameTipProps {
  tips: string[];
  color?: string;
  glowColor?: string;
  /** 팁 전환 간격 (ms). 기본 8초 */
  interval?: number;
  /** 초기 등장 딜레이 (ms) */
  delay?: number;
}

export function RotatingGameTip({
  tips,
  color = '#5a9ecf',
  glowColor = '#3a7abf',
  interval = DEFAULT_INTERVAL,
  delay = 1000,
}: RotatingGameTipProps) {
  const [index, setIndex] = useState(0);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const indexRef = useRef(0);

  const goNext = useCallback(() => {
    const next = tips.length > 0 ? (indexRef.current + 1) % tips.length : 0;
    indexRef.current = next;
    setIndex(next);
  }, [tips.length]);

  const advance = useCallback(() => {
    // fade out
    opacity.value = withTiming(
      0,
      { duration: FADE_DURATION, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) {
          runOnJS(goNext)();
        }
      },
    );
  }, [opacity, goNext]);

  // index 변경 시 fade in + 다음 전환 예약
  // biome-ignore lint/correctness/useExhaustiveDependencies: index는 팁 변경 시 fade-in 재시작을 위한 의도적 트리거
  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: FADE_DURATION,
      easing: Easing.out(Easing.quad),
    });

    timerRef.current = setTimeout(advance, interval);
    return () => {
      clearTimeout(timerRef.current);
    };
  }, [index, interval, opacity, advance]);

  // 초기 딜레이
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: FADE_DURATION,
        easing: Easing.out(Easing.quad),
      }),
    );
    return () => cancelAnimation(opacity);
  }, [opacity, delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (tips.length === 0) return null;

  const currentTip = tips[index % tips.length];

  // hex → rgba
  const hex = glowColor.replace('#', '');
  const r = Number.parseInt(hex.substring(0, 2), 16);
  const g = Number.parseInt(hex.substring(2, 4), 16);
  const b = Number.parseInt(hex.substring(4, 6), 16);
  const glowBg = `rgba(${r}, ${g}, ${b}, 0.06)`;

  return (
    <Animated.View style={[s.container, animStyle]}>
      <View style={[s.glowWrap, { backgroundColor: glowBg }]}>
        <View style={s.tipRow}>
          <Text
            style={[
              s.icon,
              {
                color,
                textShadowColor: glowColor,
              },
            ]}
          >
            TIP
          </Text>
          <View
            style={[
              s.tipDivider,
              { backgroundColor: color, shadowColor: glowColor },
            ]}
          />
          <Text
            style={[
              s.tipText,
              {
                color,
                textShadowColor: glowColor,
              },
            ]}
          >
            {currentTip}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    maxWidth: 400,
    height: 110,
    justifyContent: 'center',
  },
  glowWrap: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tipRow: {
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    fontSize: 11,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  tipDivider: {
    width: 24,
    height: 1,
    opacity: 0.4,
    marginBottom: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  tipText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'left',
    lineHeight: 21,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
