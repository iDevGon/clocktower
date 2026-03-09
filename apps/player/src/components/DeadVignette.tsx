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

/**
 * Persistent red vignette overlay shown when the player is dead.
 * Dark-red edges around the screen with a slow pulse animation.
 * Uses only react-native-reanimated (no extra dependencies).
 */
export function DeadVignette() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const topStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.55, 0.75]),
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0.65]),
  }));

  const sideStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.55]),
  }));

  const borderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.3, 0.6]),
  }));

  return (
    <>
      {/* Top edge — stacked layers for gradient-like falloff */}
      <Animated.View style={[s.edgeTop, topStyle]} pointerEvents="none">
        <Animated.View
          style={[
            s.gradLayer,
            { top: 0, height: '40%', backgroundColor: 'rgba(80,10,10,0.9)' },
          ]}
        />
        <Animated.View
          style={[
            s.gradLayer,
            { top: '40%', height: '30%', backgroundColor: 'rgba(50,8,8,0.5)' },
          ]}
        />
        <Animated.View
          style={[
            s.gradLayer,
            { top: '70%', height: '30%', backgroundColor: 'rgba(30,5,5,0.2)' },
          ]}
        />
      </Animated.View>

      {/* Bottom edge */}
      <Animated.View style={[s.edgeBottom, bottomStyle]} pointerEvents="none">
        <Animated.View
          style={[
            s.gradLayer,
            { bottom: 0, height: '40%', backgroundColor: 'rgba(60,8,8,0.85)' },
          ]}
        />
        <Animated.View
          style={[
            s.gradLayer,
            {
              bottom: '40%',
              height: '30%',
              backgroundColor: 'rgba(40,6,6,0.45)',
            },
          ]}
        />
        <Animated.View
          style={[
            s.gradLayer,
            {
              bottom: '70%',
              height: '30%',
              backgroundColor: 'rgba(25,4,4,0.15)',
            },
          ]}
        />
      </Animated.View>

      {/* Left edge */}
      <Animated.View style={[s.edgeLeft, sideStyle]} pointerEvents="none">
        <Animated.View
          style={[
            s.gradLayer,
            {
              left: 0,
              width: '50%',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(60,8,8,0.7)',
            },
          ]}
        />
        <Animated.View
          style={[
            s.gradLayer,
            {
              left: '50%',
              width: '50%',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(30,5,5,0.2)',
            },
          ]}
        />
      </Animated.View>

      {/* Right edge */}
      <Animated.View style={[s.edgeRight, sideStyle]} pointerEvents="none">
        <Animated.View
          style={[
            s.gradLayer,
            {
              right: 0,
              width: '50%',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(60,8,8,0.7)',
            },
          ]}
        />
        <Animated.View
          style={[
            s.gradLayer,
            {
              right: '50%',
              width: '50%',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(30,5,5,0.2)',
            },
          ]}
        />
      </Animated.View>

      {/* Thin red inner border */}
      <Animated.View
        style={[s.innerBorder, borderStyle]}
        pointerEvents="none"
      />
    </>
  );
}

const EDGE_H = SH * 0.12;
const SIDE_W = SW * 0.08;

const s = StyleSheet.create({
  edgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: EDGE_H,
    zIndex: 80,
  },
  edgeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: EDGE_H,
    zIndex: 80,
  },
  edgeLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: SIDE_W,
    zIndex: 80,
  },
  edgeRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SIDE_W,
    zIndex: 80,
  },
  gradLayer: {
    position: 'absolute',
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(139,20,20,0.5)',
    zIndex: 81,
  },
});
