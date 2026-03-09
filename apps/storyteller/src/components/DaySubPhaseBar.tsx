import type { DaySubPhase } from '@clocktower/shared';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import {
  SUB_PHASE_COLORS,
  createDaySubPhaseBarStyles,
} from './DaySubPhaseBar.styles';

const DAY_SUB_PHASES: { label: string; value: DaySubPhase }[] = [
  { label: '밀담', value: 'whisper' },
  { label: '공개 토론', value: 'discussion' },
  { label: '지목', value: 'nomination' },
];

interface DaySubPhaseBarProps {
  currentSubPhase: DaySubPhase | null;
  onSetSubPhase: (subPhase: DaySubPhase) => void;
}

export function DaySubPhaseBar({
  currentSubPhase,
  onSetSubPhase,
}: DaySubPhaseBarProps) {
  const { fontSize, device } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(
    () => createDaySubPhaseBarStyles(scale, device),
    [scale, device],
  );

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

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {DAY_SUB_PHASES.map((phase, index) => {
          const pc =
            SUB_PHASE_COLORS[
              phase.value as keyof typeof SUB_PHASE_COLORS
            ] ?? SUB_PHASE_COLORS.whisper;
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
          <View
            style={[styles.subPhaseDot, { backgroundColor: colors.dot }]}
          />
          <Text style={[styles.subPhaseLabel, { color: colors.text }]}>
            {active?.label ?? '밀담'}
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
            SUB_PHASE_COLORS[
              phase.value as keyof typeof SUB_PHASE_COLORS
            ] ?? SUB_PHASE_COLORS.whisper;
          const isActive = index === currentIndex;
          const isPast = currentIndex >= 0 && index < currentIndex;

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
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
