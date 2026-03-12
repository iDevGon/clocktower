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
const EDGE_H = SH * 0.12;
const SIDE_W = SW * 0.08;

/**
 * A 3-stop gradient layer config for edge overlays.
 * Each entry defines a layer's positional offset, size proportion, and color.
 */
interface GradientLayer {
  /** CSS-like offset from the anchor edge (e.g. '0%', '40%') */
  offset: string;
  /** Size proportion (e.g. '40%', '30%') */
  size: string;
  /** Background color with alpha */
  color: string;
}

interface EdgeColors {
  /** 3-layer gradient colors for the top edge (outermost to innermost) */
  top: [GradientLayer, GradientLayer, GradientLayer];
  /** 3-layer gradient colors for the bottom edge */
  bottom: [GradientLayer, GradientLayer, GradientLayer];
  /** 2-layer gradient colors for side edges */
  side: [GradientLayer, GradientLayer];
  /** Inner border color */
  borderColor: string;
}

interface EdgeOpacityRanges {
  top: [number, number];
  bottom: [number, number];
  side: [number, number];
  border: [number, number];
}

interface EdgeVignetteProps {
  /** Color configuration for all edges */
  colors: EdgeColors;
  /** Opacity ranges for each edge group */
  opacityRanges: EdgeOpacityRanges;
  /** Half-cycle duration in ms */
  duration: number;
  /** z-index for the edges (default: 80) */
  zIndex?: number;
}

/**
 * Edge vignette overlay with 4-sided gradient-like falloff and inner border.
 * Provides a persistent colored border effect with pulse animation.
 */
export function EdgeVignette({
  colors,
  opacityRanges,
  duration,
  zIndex = 80,
}: EdgeVignetteProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, duration]);

  const topStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], opacityRanges.top),
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], opacityRanges.bottom),
  }));

  const sideStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], opacityRanges.side),
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], opacityRanges.border),
  }));

  return (
    <>
      {/* Top edge */}
      <Animated.View
        style={[s.edgeTop, { zIndex }, topStyle]}
        pointerEvents="none"
      >
        {colors.top.map((layer, i) => (
          <Animated.View
            key={`t-${i}`}
            style={[
              s.gradLayer,
              {
                top: layer.offset,
                height: layer.size,
                backgroundColor: layer.color,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Bottom edge */}
      <Animated.View
        style={[s.edgeBottom, { zIndex }, bottomStyle]}
        pointerEvents="none"
      >
        {colors.bottom.map((layer, i) => (
          <Animated.View
            key={`b-${i}`}
            style={[
              s.gradLayer,
              {
                bottom: layer.offset,
                height: layer.size,
                backgroundColor: layer.color,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Left edge */}
      <Animated.View
        style={[s.edgeLeft, { zIndex }, sideStyle]}
        pointerEvents="none"
      >
        {colors.side.map((layer, i) => (
          <Animated.View
            key={`l-${i}`}
            style={[
              s.gradLayer,
              {
                left: layer.offset,
                width: layer.size,
                top: 0,
                bottom: 0,
                backgroundColor: layer.color,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Right edge */}
      <Animated.View
        style={[s.edgeRight, { zIndex }, sideStyle]}
        pointerEvents="none"
      >
        {colors.side.map((layer, i) => (
          <Animated.View
            key={`r-${i}`}
            style={[
              s.gradLayer,
              {
                right: layer.offset,
                width: layer.size,
                top: 0,
                bottom: 0,
                backgroundColor: layer.color,
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Inner border */}
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
  gradLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
  },
});
