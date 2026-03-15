import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  clockFaceBgStyle,
  innerRingStyle,
  outerGlowStyle,
  outerRingStyle,
  styles,
} from './VoteClockFace.styles';

const COLORS = {
  brassDark: '#6a1818',
  iron: '#4a4a52',
};

const TICK_COUNT = 60;

interface VoteClockFaceProps {
  centerX: number;
  centerY: number;
  radius: number;
}

export function VoteClockFace({
  centerX,
  centerY,
  radius,
}: VoteClockFaceProps) {
  const ringSize = radius * 2 + 20;
  const innerRingRadius = radius - 20;

  const ticks = useMemo(() => {
    return Array.from({ length: TICK_COUNT }, (_, i) => {
      const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
      const isMajor = i % 5 === 0;
      const tickLen = isMajor ? 8 : 4;
      const tickWidth = isMajor ? 1.5 : 0.8;
      const outerR = radius + 4;
      const x1 = outerR - tickLen;
      const deg = (angle * 180) / Math.PI + 90;

      return {
        key: i,
        left: centerX + x1 * Math.cos(angle) - tickWidth / 2,
        top: centerY + x1 * Math.sin(angle),
        width: tickWidth,
        height: tickLen,
        backgroundColor: isMajor ? COLORS.brassDark : `${COLORS.iron}80`,
        rotate: `${deg}deg`,
      };
    });
  }, [centerX, centerY, radius]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      {/* Outer glow */}
      <View style={outerGlowStyle(centerX, centerY, ringSize)} />

      {/* Clock face background */}
      <View style={clockFaceBgStyle(centerX, centerY, ringSize)} />

      {/* Outer ring border */}
      <View style={outerRingStyle(centerX, centerY, ringSize)} />

      {/* Tick marks */}
      {ticks.map((t) => (
        <View
          key={t.key}
          style={[
            styles.tick,
            {
              left: t.left,
              top: t.top,
              width: t.width,
              height: t.height,
              backgroundColor: t.backgroundColor,
              transform: [{ rotate: t.rotate }],
            },
          ]}
        />
      ))}

      {/* Inner ring */}
      <View style={innerRingStyle(centerX, centerY, innerRingRadius)} />
    </View>
  );
}
