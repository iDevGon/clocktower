import { useReducedMotion } from '@clocktower/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  type LayoutChangeEvent,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedBorderCardProps {
  color: string;
  /** Background gradient: top */
  bgStart: string;
  /** Background gradient: middle accent */
  bgMid: string;
  /** Background gradient: bottom */
  bgEnd: string;
  borderRadius?: number;
  borderWidth?: number;
  style?: ViewStyle;
  children: React.ReactNode;
}

function useEdgeBeamStyle(
  progress: SharedValue<number>,
  edge: 'top' | 'right' | 'bottom' | 'left',
  w: number,
  h: number,
  beamLen: number,
) {
  const perimeter = 2 * (w + h);
  const starts = {
    top: 0,
    right: w / perimeter,
    bottom: (w + h) / perimeter,
    left: (2 * w + h) / perimeter,
  };
  const lengths = {
    top: w / perimeter,
    right: h / perimeter,
    bottom: w / perimeter,
    left: h / perimeter,
  };

  const edgeStart = starts[edge];
  const edgeLen = lengths[edge];
  const isHorizontal = edge === 'top' || edge === 'bottom';
  const edgePx = isHorizontal ? w : h;
  const beamFrac = perimeter > 0 ? beamLen / perimeter : 0;

  return useAnimatedStyle(() => {
    const p = progress.value;
    const beamHead = p;
    const beamTail = p - beamFrac;
    const eS = edgeStart;
    const eE = edgeStart + edgeLen;

    const visStart = Math.max(beamTail, eS);
    const visEnd = Math.min(beamHead, eE);

    let visStart2 = -1;
    let visEnd2 = -1;
    if (beamHead > 1) {
      visStart2 = Math.max(0, eS);
      visEnd2 = Math.min(beamHead - 1, eE);
    }
    if (beamTail < 0) {
      const wrapStart = Math.max(beamTail + 1, eS);
      const wrapEnd = Math.min(1, eE);
      if (wrapStart < wrapEnd) {
        visStart2 = wrapStart;
        visEnd2 = wrapEnd;
      }
    }

    let show = visStart < visEnd;
    let fracStart = 0;
    let fracEnd = 0;

    if (show) {
      fracStart = (visStart - eS) / edgeLen;
      fracEnd = (visEnd - eS) / edgeLen;
    }

    if (visStart2 >= 0 && visStart2 < visEnd2) {
      const f2s = (visStart2 - eS) / edgeLen;
      const f2e = (visEnd2 - eS) / edgeLen;
      if (!show) {
        show = true;
        fracStart = f2s;
        fracEnd = f2e;
      } else {
        fracStart = Math.min(fracStart, f2s);
        fracEnd = Math.max(fracEnd, f2e);
      }
    }

    if (!show || edgePx === 0) {
      return { opacity: 0 };
    }

    let posStart = fracStart;
    let posEnd = fracEnd;
    if (edge === 'bottom' || edge === 'left') {
      posStart = 1 - fracEnd;
      posEnd = 1 - fracStart;
    }

    const startPx = posStart * edgePx;
    const widthPx = Math.max(1, (posEnd - posStart) * edgePx);

    if (isHorizontal) {
      return { opacity: 1, left: startPx, width: widthPx };
    }
    return { opacity: 1, top: startPx, height: widthPx };
  });
}

/** 빔의 진행방향에 맞는 LinearGradient 방향 */
function beamGradientDir(edge: 'top' | 'right' | 'bottom' | 'left') {
  // 빔은 진행방향으로 tail→head: transparent → color → transparent
  switch (edge) {
    case 'top': // 좌→우
      return { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } } as const;
    case 'right': // 상→하
      return { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } } as const;
    case 'bottom': // 우→좌 (좌표는 반전됨, gradient도 반전)
      return { start: { x: 1, y: 0.5 }, end: { x: 0, y: 0.5 } } as const;
    case 'left': // 하→상
      return { start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } } as const;
  }
}

export function AnimatedBorderCard({
  color,
  bgStart,
  bgMid,
  bgEnd,
  borderRadius = 12,
  borderWidth = 1.5,
  style,
  children,
}: AnimatedBorderCardProps) {
  const reduced = useReducedMotion();
  const [size, setSize] = useState({ w: 400, h: 100 });

  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress, reduced]);

  const perimeter = 2 * (size.w + size.h);
  const beamLen = perimeter * 0.1;

  const topStyle = useEdgeBeamStyle(progress, 'top', size.w, size.h, beamLen);
  const rightStyle = useEdgeBeamStyle(
    progress,
    'right',
    size.w,
    size.h,
    beamLen,
  );
  const bottomStyle = useEdgeBeamStyle(
    progress,
    'bottom',
    size.w,
    size.h,
    beamLen,
  );
  const leftStyle = useEdgeBeamStyle(progress, 'left', size.w, size.h, beamLen);

  const glowOpacity = useSharedValue(0.35);
  useEffect(() => {
    if (reduced) return;
    glowOpacity.value = withRepeat(
      withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glowOpacity, reduced]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const bw = borderWidth;
  const br = borderRadius;
  const innerBr = Math.max(0, br - bw);

  const edges = ['top', 'right', 'bottom', 'left'] as const;
  const edgeStyles = [topStyle, rightStyle, bottomStyle, leftStyle];

  // 빔 그라데이션: 양끝 투명 → 중앙 반투명
  const beamColors: [string, string, string, string, string] = [
    'transparent',
    `${color}40`,
    `${color}90`,
    `${color}40`,
    'transparent',
  ];

  return (
    <View
      style={[s.outer, { borderRadius: br }, style]}
      onLayout={handleLayout}
    >
      {/* Glow */}
      <Animated.View
        style={[
          s.glowLayer,
          {
            borderRadius: br,
            shadowColor: color,
            shadowRadius: 12,
            shadowOpacity: 0.6,
            shadowOffset: { width: 0, height: 0 },
          },
          glowStyle,
        ]}
      />

      {/* Dim base border */}
      <View
        style={[
          s.borderBase,
          { borderRadius: br, backgroundColor: `${color}12` },
        ]}
      />

      {/* 4 edge beams with gradient fade */}
      {!reduced &&
        edges.map((edge, i) => {
          const isHorizontal = edge === 'top' || edge === 'bottom';
          const dir = beamGradientDir(edge);
          const posStyle: ViewStyle = {
            position: 'absolute',
            ...(edge === 'top' && { top: 0, height: bw }),
            ...(edge === 'bottom' && { bottom: 0, height: bw }),
            ...(edge === 'right' && { right: 0, width: bw }),
            ...(edge === 'left' && { left: 0, width: bw }),
            // 기본 크기 (animated style이 덮어씀)
            ...(isHorizontal ? { width: 0 } : { height: 0 }),
          };

          return (
            <Animated.View key={edge} style={[posStyle, edgeStyles[i]]}>
              <LinearGradient
                colors={beamColors}
                locations={[0, 0.2, 0.5, 0.8, 1]}
                start={dir.start}
                end={dir.end}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          );
        })}

      {/* Inner content with 3-stop vertical gradient */}
      <View style={[s.inner, { borderRadius: innerBr, margin: bw }]}>
        <LinearGradient
          colors={[bgStart, bgMid, bgEnd]}
          locations={[0, 0.4, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: innerBr }]}
        />
        {children}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  outer: {
    position: 'relative',
    overflow: 'hidden',
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    elevation: 8,
  },
  borderBase: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    position: 'relative',
    overflow: 'hidden',
  },
});
