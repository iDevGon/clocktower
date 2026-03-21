import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, Vibration } from 'react-native';
import { colors } from '../tokens';

interface CountdownTimerProps {
  startedAt: number;
  durationMs: number;
  isPaused?: boolean;
  remainingMs?: number;
  phaseColor?: string;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function CountdownTimer({
  startedAt,
  durationMs,
  isPaused = false,
  remainingMs,
  phaseColor = colors.phase.day,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(() => {
    if (isPaused && remainingMs != null) {
      return Math.max(0, Math.ceil(remainingMs / 1000));
    }
    const elapsed = Date.now() - startedAt;
    return Math.max(0, Math.ceil((durationMs - elapsed) / 1000));
  });

  const lastVibratedRef = useRef<number>(-1);

  useEffect(() => {
    if (isPaused) return;

    const effectiveDuration = remainingMs ?? durationMs;

    const update = () => {
      const elapsed = Date.now() - startedAt;
      const left = Math.max(0, Math.ceil((effectiveDuration - elapsed) / 1000));
      setRemaining(left);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt, durationMs, isPaused, remainingMs]);

  // 5초 이하일 때 진동
  useEffect(() => {
    if (remaining > 5 || remaining <= 0) return;
    if (isPaused) return;
    if (lastVibratedRef.current === remaining) return;
    lastVibratedRef.current = remaining;
    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }
  }, [remaining, isPaused]);

  const isUrgent = remaining <= 5 && remaining > 0;
  const isExpired = remaining === 0;

  const textColor = isExpired
    ? '#555'
    : isUrgent
      ? colors.phase.vote
      : phaseColor;

  return (
    <Text
      style={[
        timerStyles.text,
        { color: textColor },
        isExpired && timerStyles.expired,
      ]}
    >
      {formatTime(remaining)}
    </Text>
  );
}

const timerStyles = StyleSheet.create({
  text: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  expired: {
    textDecorationLine: 'line-through',
  },
});
