import { useReducedMotion } from '@clocktower/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

/* Smoky edge sizes — generous overlap for soft blending */
const EDGE_H = SH * 0.22;
const SIDE_W = SW * 0.18;

interface EdgeColorConfig {
  /** Gradient color stops from edge inward (outermost → transparent) */
  stops: readonly [string, string, ...string[]];
  /** Matching stop positions 0..1  */
  locations: readonly [number, number, ...number[]];
}

interface EdgeColors {
  top: EdgeColorConfig;
  bottom: EdgeColorConfig;
  side: EdgeColorConfig;
  /** Corner bloom tint (radial-like diagonal gradient) */
  corner: string;
  /** Subtle inner border color */
  borderColor: string;
}

interface EdgeOpacityRanges {
  top: [number, number];
  bottom: [number, number];
  side: [number, number];
  border: [number, number];
}

interface EdgeVignetteProps {
  colors: EdgeColors;
  opacityRanges: EdgeOpacityRanges;
  /** Half-cycle duration in ms */
  duration: number;
  /** z-index for the edges (default: 80) */
  zIndex?: number;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Smoky edge vignette overlay with smooth LinearGradient falloff.
 * Multiple overlapping layers create a soft, atmospheric haze effect.
 */
export function EdgeVignette({
  colors,
  opacityRanges,
  duration,
  zIndex = 80,
}: EdgeVignetteProps) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      pulse.value = 0.5;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, duration, reduced]);

  const mid = (range: [number, number]) => (range[0] + range[1]) / 2;

  const topStyle = useAnimatedStyle(() => ({
    opacity: reduced
      ? mid(opacityRanges.top)
      : interpolate(pulse.value, [0, 1], opacityRanges.top),
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: reduced
      ? mid(opacityRanges.bottom)
      : interpolate(pulse.value, [0, 1], opacityRanges.bottom),
  }));

  const sideStyle = useAnimatedStyle(() => ({
    opacity: reduced
      ? mid(opacityRanges.side)
      : interpolate(pulse.value, [0, 1], opacityRanges.side),
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: reduced
      ? mid(opacityRanges.border)
      : interpolate(pulse.value, [0, 1], opacityRanges.border),
  }));

  return (
    <>
      {/* ── Top edge: smooth vertical gradient ── */}
      <AnimatedLinearGradient
        colors={colors.top.stops}
        locations={colors.top.locations}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[s.edgeTop, { zIndex }, topStyle]}
        pointerEvents="none"
      />

      {/* ── Bottom edge ── */}
      <AnimatedLinearGradient
        colors={colors.bottom.stops}
        locations={colors.bottom.locations}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={[s.edgeBottom, { zIndex }, bottomStyle]}
        pointerEvents="none"
      />

      {/* ── Left edge ── */}
      <AnimatedLinearGradient
        colors={colors.side.stops}
        locations={colors.side.locations}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[s.edgeLeft, { zIndex }, sideStyle]}
        pointerEvents="none"
      />

      {/* ── Right edge ── */}
      <AnimatedLinearGradient
        colors={colors.side.stops}
        locations={colors.side.locations}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0, y: 0.5 }}
        style={[s.edgeRight, { zIndex }, sideStyle]}
        pointerEvents="none"
      />

      {/* ── Inner border: very subtle glow line ── */}
      <Animated.View
        style={[
          s.innerBorder,
          { zIndex: zIndex + 1, borderColor: colors.borderColor },
          borderStyle,
        ]}
        pointerEvents="none"
      />
    </>
  );
}

const s = StyleSheet.create({
  edgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: EDGE_H,
  },
  edgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: EDGE_H,
  },
  edgeLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDE_W,
  },
  edgeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SIDE_W,
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
