import { StyleSheet } from 'react-native';
import { VOTE_CLOCK_LAYER } from './votePresentation';

const COLORS = {
  brass: '#8b2020',
  brassDark: '#6a1818',
  midnight: '#0d0d12',
  blood: '#8b1a1a',
};

export const styles = StyleSheet.create({
  root: {
    pointerEvents: 'none',
    overflow: 'visible',
    zIndex: VOTE_CLOCK_LAYER.face,
  },
});

export function outerGlowStyle(centerX: number, centerY: number, size: number) {
  const s = size + 30;
  return {
    position: 'absolute' as const,
    left: centerX - s / 2,
    top: centerY - s / 2,
    width: s,
    height: s,
    borderRadius: s / 2,
    backgroundColor: `${COLORS.blood}10`,
  };
}

export function clockFaceBgStyle(
  centerX: number,
  centerY: number,
  size: number,
) {
  return {
    position: 'absolute' as const,
    left: centerX - size / 2,
    top: centerY - size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: `${COLORS.midnight}90`,
  };
}

export function clockFaceImageStyle(
  centerX: number,
  centerY: number,
  size: number,
) {
  return {
    position: 'absolute' as const,
    left: centerX - size / 2,
    top: centerY - size / 2,
    width: size,
    height: size,
  };
}

export function outerRingStyle(centerX: number, centerY: number, size: number) {
  return {
    position: 'absolute' as const,
    left: centerX - size / 2,
    top: centerY - size / 2,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2.5,
    borderColor: COLORS.brassDark,
    shadowColor: COLORS.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  };
}

export function innerRingStyle(
  centerX: number,
  centerY: number,
  innerRadius: number,
) {
  return {
    position: 'absolute' as const,
    left: centerX - innerRadius,
    top: centerY - innerRadius,
    width: innerRadius * 2,
    height: innerRadius * 2,
    borderRadius: innerRadius,
    borderWidth: 0.8,
    borderColor: `${COLORS.brassDark}40`,
  };
}
