import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useGameStore } from '../stores/gameStore';

const COLORS = {
  brass: '#b8964e',
  brassLight: '#d4b06a',
  brassDark: '#8a6e38',
  bloodGlow: '#c43c3c',
  iron: '#4a4a52',
  ironDark: '#2a2a30',
};

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

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
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

const styles = StyleSheet.create({
  handContainer: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 50,
  },
  handGlow: {
    position: 'absolute',
    width: 10,
    borderRadius: 5,
    backgroundColor: `${COLORS.bloodGlow}25`,
  },
  hand: {
    position: 'absolute',
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.brass,
    shadowColor: COLORS.brassLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  handTip: {
    position: 'absolute',
    top: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: COLORS.brassLight,
  },
  centerHub: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.ironDark,
    borderWidth: 2,
    borderColor: COLORS.brassDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 51,
    shadowColor: COLORS.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.brass,
  },
});
