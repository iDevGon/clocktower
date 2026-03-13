import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

const COLORS = {
  brass: '#8b2020',
  brassDark: '#6a1818',
  iron: '#4a4a52',
  midnight: '#0d0d12',
  blood: '#8b1a1a',
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
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', overflow: 'visible' }]}>
      {/* Outer glow */}
      <View
        style={{
          position: 'absolute',
          left: centerX - (ringSize + 30) / 2,
          top: centerY - (ringSize + 30) / 2,
          width: ringSize + 30,
          height: ringSize + 30,
          borderRadius: (ringSize + 30) / 2,
          backgroundColor: `${COLORS.blood}10`,
        }}
      />

      {/* Clock face background */}
      <View
        style={{
          position: 'absolute',
          left: centerX - ringSize / 2,
          top: centerY - ringSize / 2,
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          backgroundColor: `${COLORS.midnight}90`,
        }}
      />

      {/* Outer ring border */}
      <View
        style={{
          position: 'absolute',
          left: centerX - ringSize / 2,
          top: centerY - ringSize / 2,
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: 2.5,
          borderColor: COLORS.brassDark,
          shadowColor: COLORS.brass,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      />

      {/* Tick marks */}
      {ticks.map((t) => (
        <View
          key={t.key}
          style={{
            position: 'absolute',
            left: t.left,
            top: t.top,
            width: t.width,
            height: t.height,
            backgroundColor: t.backgroundColor,
            transform: [{ rotate: t.rotate }],
            transformOrigin: 'top',
          }}
        />
      ))}

      {/* Inner ring */}
      <View
        style={{
          position: 'absolute',
          left: centerX - innerRingRadius,
          top: centerY - innerRingRadius,
          width: innerRingRadius * 2,
          height: innerRingRadius * 2,
          borderRadius: innerRingRadius,
          borderWidth: 0.8,
          borderColor: `${COLORS.brassDark}40`,
        }}
      />
    </View>
  );
}
