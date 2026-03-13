import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGameStore } from '../stores/gameStore';
import { COLORS, styles } from './VoteClockHand.styles';

interface VoteClockHandProps {
  nomineeIndex: number;
  totalPlayers: number;
  centerX: number;
  centerY: number;
  radius: number;
}

export function VoteClockHand({
  nomineeIndex,
  totalPlayers,
  centerX,
  centerY,
  radius,
}: VoteClockHandProps) {
  const voteClock = useGameStore((s) => s.voteClock);
  const [handAngle, setHandAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);

  const nomineeAngle =
    totalPlayers > 0 ? (nomineeIndex / totalPlayers) * 360 : 0;

  useEffect(() => {
    if (!voteClock) {
      setHandAngle(nomineeAngle);
      return;
    }

    function tick() {
      const elapsed = Date.now() - voteClock.startedAt;
      const progress = Math.min(elapsed / voteClock.durationMs, 1);
      setHandAngle(nomineeAngle + progress * 360);
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    }

    tick();
    return () => {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [voteClock, nomineeAngle]);

  const handLength = radius * 0.85;

  const wedgeHalfWidth = radius * 0.55;
  const wedgeInnerHalf = radius * 0.22;

  return (
    <View style={[StyleSheet.absoluteFill, styles.pointerEventsNone]}>
      {/* Active voter wedge glow */}
      {voteClock && (
        <View
          style={[
            styles.wedgeContainer,
            {
              left: centerX - wedgeHalfWidth,
              top: centerY - radius,
              width: wedgeHalfWidth * 2,
              height: radius,
              transform: [{ rotate: `${handAngle}deg` }],
              transformOrigin: `${wedgeHalfWidth}px ${radius}px`,
            },
          ]}
        >
          <View
            style={[
              styles.outerTriangle,
              {
                borderLeftWidth: wedgeHalfWidth,
                borderRightWidth: wedgeHalfWidth,
                borderBottomWidth: radius,
                borderBottomColor: `${COLORS.active}08`,
              },
            ]}
          />
          <View
            style={[
              styles.innerTriangle,
              {
                left: wedgeHalfWidth - wedgeInnerHalf,
                borderLeftWidth: wedgeInnerHalf,
                borderRightWidth: wedgeInnerHalf,
                borderBottomWidth: radius * 0.7,
                borderBottomColor: `${COLORS.active}12`,
              },
            ]}
          />
        </View>
      )}

      <View
        style={[
          styles.handContainer,
          {
            left: centerX - 5,
            top: centerY - handLength,
            width: 10,
            height: handLength,
            transform: [{ rotate: `${handAngle}deg` }],
            transformOrigin: `5px ${handLength}px`,
          },
        ]}
      >
        <View style={[styles.handGlow, { height: handLength }]} />
        <View style={[styles.hand, { height: handLength }]} />
        <View style={styles.handTip} />
      </View>

      <View
        style={[
          styles.centerHub,
          {
            left: centerX - 10,
            top: centerY - 10,
          },
        ]}
      >
        <View style={styles.centerDot} />
      </View>
    </View>
  );
}
