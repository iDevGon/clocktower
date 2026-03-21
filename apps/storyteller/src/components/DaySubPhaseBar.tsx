import type { DaySubPhase } from '@clocktower/shared';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, Vibration, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import {
  createDaySubPhaseBarStyles,
  SUB_PHASE_COLORS,
} from './DaySubPhaseBar.styles';

const DAY_SUB_PHASES: { label: string; value: DaySubPhase }[] = [
  { label: '밀담', value: 'whisper' },
  { label: '공개 토론', value: 'discussion' },
  { label: '지목', value: 'nomination' },
];

function formatTimer(remaining: number): string {
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

type ClockData = { startedAt: number; durationMs: number } | null;

function useClockRemaining(clock: ClockData, isPaused = false): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!clock) {
      setRemaining(null);
      return;
    }
    if (isPaused) return;
    const update = () => {
      const elapsed = Date.now() - clock.startedAt;
      const left = Math.max(0, Math.ceil((clock.durationMs - elapsed) / 1000));
      setRemaining(left);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [clock, isPaused]);

  // 5초 이하일 때 진동
  useEffect(() => {
    if (remaining === null || remaining > 5 || remaining <= 0) return;
    if (isPaused) return;
    if (Platform.OS !== 'web') {
      Vibration.vibrate(100);
    }
  }, [remaining, isPaused]);

  return remaining;
}

function TimerText({
  remaining,
  activeColor,
  isActive,
}: {
  remaining: number;
  activeColor: string;
  isActive: boolean;
}) {
  const color =
    remaining === 0
      ? '#555'
      : remaining <= 5
        ? '#e05050'
        : isActive
          ? activeColor
          : undefined;
  return (
    <Text
      style={{
        color,
        fontVariant: ['tabular-nums'],
        textDecorationLine: remaining === 0 ? 'line-through' : 'none',
      }}
    >
      ({formatTimer(remaining)})
    </Text>
  );
}

interface DaySubPhaseBarProps {
  currentSubPhase: DaySubPhase | null;
  onSetSubPhase: (subPhase: DaySubPhase) => void;
  whisperClock?: ClockData;
  discussionClock?: ClockData;
  nominationClock?: ClockData;
  nominationPaused?: boolean;
  defenseClock?: ClockData;
}

export function DaySubPhaseBar({
  currentSubPhase,
  onSetSubPhase,
  whisperClock,
  discussionClock,
  nominationClock,
  nominationPaused = false,
  defenseClock,
}: DaySubPhaseBarProps) {
  const { fontSize, device } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(
    () => createDaySubPhaseBarStyles(scale, device),
    [scale, device],
  );

  const whisperRemaining = useClockRemaining(whisperClock ?? null);
  const discussionRemaining = useClockRemaining(discussionClock ?? null);
  const nominationRemaining = useClockRemaining(
    nominationClock ?? null,
    nominationPaused,
  );
  const defenseRemaining = useClockRemaining(defenseClock ?? null);

  const getTimerRemaining = (value: DaySubPhase): number | null => {
    if (value === 'whisper') return whisperRemaining;
    if (value === 'discussion') return discussionRemaining;
    if (value === 'nomination') return nominationRemaining;
    return null;
  };

  const currentIndex = DAY_SUB_PHASES.findIndex(
    (p) => p.value === currentSubPhase,
  );
  const active = currentIndex >= 0 ? DAY_SUB_PHASES[currentIndex] : null;
  const colors =
    SUB_PHASE_COLORS[
      (active?.value ?? 'whisper') as keyof typeof SUB_PHASE_COLORS
    ] ?? SUB_PHASE_COLORS.whisper;

  const handlePrev = () => {
    if (currentIndex <= 0) return;
    onSetSubPhase(DAY_SUB_PHASES[currentIndex - 1].value);
  };

  const handleNext = () => {
    if (currentIndex >= DAY_SUB_PHASES.length - 1) return;
    onSetSubPhase(DAY_SUB_PHASES[currentIndex + 1].value);
  };

  // 변론 타이머 표시 (defense 서브페이즈일 때)
  const showDefenseTimer =
    currentSubPhase === 'defense' && defenseRemaining !== null;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {DAY_SUB_PHASES.map((phase, index) => {
          const pc =
            SUB_PHASE_COLORS[phase.value as keyof typeof SUB_PHASE_COLORS] ??
            SUB_PHASE_COLORS.whisper;
          const isCurrent = index === currentIndex;
          const isPast = currentIndex >= 0 && index < currentIndex;

          let bgColor: string;
          if (isCurrent) {
            bgColor = pc.dot;
          } else if (isPast) {
            bgColor = `${pc.dot}40`;
          } else {
            bgColor = '#1e1e28';
          }

          return (
            <View
              key={phase.value}
              style={[styles.progressSegment, { backgroundColor: bgColor }]}
            />
          );
        })}
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        <Pressable
          onPress={handlePrev}
          style={[
            styles.navButton,
            currentIndex <= 0 && styles.navButtonDisabled,
          ]}
          disabled={currentIndex <= 0}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>
            {'‹'}
          </Text>
        </Pressable>

        <View
          style={[
            styles.activeCard,
            { backgroundColor: colors.bg, borderColor: colors.border },
          ]}
        >
          <View style={[styles.subPhaseDot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.subPhaseLabel, { color: colors.text }]}>
            {active?.label ?? '밀담'}
            {active &&
              (() => {
                const remaining = getTimerRemaining(active.value);
                if (remaining === null) return null;
                return (
                  <TimerText
                    remaining={remaining}
                    activeColor={colors.text}
                    isActive
                  />
                );
              })()}
            {showDefenseTimer && (
              <>
                {' '}
                <TimerText
                  remaining={defenseRemaining}
                  activeColor="#e05050"
                  isActive
                />
              </>
            )}
          </Text>
        </View>

        <Pressable
          onPress={handleNext}
          style={[
            styles.navButton,
            currentIndex >= DAY_SUB_PHASES.length - 1 &&
              styles.navButtonDisabled,
          ]}
          disabled={currentIndex >= DAY_SUB_PHASES.length - 1}
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>
            {'›'}
          </Text>
        </Pressable>
      </View>

      {/* Sub-phase chips */}
      <View style={styles.chipList}>
        {DAY_SUB_PHASES.map((phase, index) => {
          const pc =
            SUB_PHASE_COLORS[phase.value as keyof typeof SUB_PHASE_COLORS] ??
            SUB_PHASE_COLORS.whisper;
          const isActive = index === currentIndex;
          const isPast = currentIndex >= 0 && index < currentIndex;
          const remaining = getTimerRemaining(phase.value);

          return (
            <Pressable
              key={phase.value}
              onPress={() => onSetSubPhase(phase.value)}
              style={[
                styles.chip,
                isActive && [
                  styles.chipActive,
                  { borderColor: pc.border, backgroundColor: pc.bg },
                ],
                isPast && styles.chipPast,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && [styles.chipTextActive, { color: pc.text }],
                  isPast && styles.chipTextPast,
                ]}
              >
                {phase.label}
                {remaining !== null && (
                  <TimerText
                    remaining={remaining}
                    activeColor={pc.text}
                    isActive={isActive}
                  />
                )}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
