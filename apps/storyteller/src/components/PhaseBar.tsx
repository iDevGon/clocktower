import type { Phase } from '@clocktower/shared';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { createPhaseBarStyles, PHASE_COLORS } from './PhaseBar.styles';

/** Stepper navigation order: 밤 → 낮 cycles, with 종료 as terminal */
const STEPPER_ORDER: Phase[] = ['night', 'day'];

/** All phases shown as chips for direct access */
const ALL_PHASES: { label: string; value: Phase }[] = [
  { label: '밤', value: 'night' },
  { label: '낮', value: 'day' },
  { label: '투표', value: 'vote' },
  { label: '종료', value: 'ended' },
];

const PHASE_LABELS: Record<Phase, string> = {
  setup: '준비',
  night: '밤',
  day: '낮',
  vote: '투표',
  ended: '종료',
};

interface PhaseBarProps {
  currentPhase: Phase;
  onSetPhase: (phase: Phase) => void;
  onConfirmNext?: () => void;
  disableNext?: boolean;
}

export function PhaseBar({
  currentPhase,
  onSetPhase,
  onConfirmNext,
  disableNext = false,
}: PhaseBarProps) {
  const { fontSize, device } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(
    () => createPhaseBarStyles(scale, device),
    [scale, device],
  );

  const colors =
    PHASE_COLORS[currentPhase as keyof typeof PHASE_COLORS] ??
    PHASE_COLORS.night;

  const stepperIndex = STEPPER_ORDER.indexOf(currentPhase);
  const isInStepper = stepperIndex >= 0;

  const handlePrev = () => {
    if (!isInStepper || stepperIndex <= 0) return;
    onSetPhase(STEPPER_ORDER[stepperIndex - 1]);
  };

  const handleNext = () => {
    if (isInStepper) {
      const nextIndex = (stepperIndex + 1) % STEPPER_ORDER.length;
      if (onConfirmNext) {
        onConfirmNext();
      } else {
        onSetPhase(STEPPER_ORDER[nextIndex]);
      }
    } else {
      // vote/ended → stepper의 첫 단계(밤)로
      if (onConfirmNext) {
        onConfirmNext();
      } else {
        onSetPhase(STEPPER_ORDER[0]);
      }
    }
  };

  const canPrev = isInStepper && stepperIndex > 0;
  const canNext =
    !disableNext &&
    (isInStepper || currentPhase === 'vote' || currentPhase === 'ended');

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {ALL_PHASES.map((phase) => {
          const pc =
            PHASE_COLORS[phase.value as keyof typeof PHASE_COLORS] ??
            PHASE_COLORS.night;
          const isCurrent = phase.value === currentPhase;

          return (
            <View
              key={phase.value}
              style={[
                styles.progressSegment,
                { backgroundColor: isCurrent ? pc.dot : '#1e1e28' },
              ]}
            />
          );
        })}
      </View>

      {/* Stepper */}
      <View style={styles.stepper}>
        <Pressable
          onPress={handlePrev}
          style={[styles.navButton, !canPrev && styles.navButtonDisabled]}
          disabled={!canPrev}
          accessibilityLabel="이전 페이즈"
          accessibilityRole="button"
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
          <View style={[styles.phaseDot, { backgroundColor: colors.dot }]} />
          <Text style={[styles.phaseLabel, { color: colors.text }]}>
            {PHASE_LABELS[currentPhase] ?? currentPhase}
          </Text>
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.navButton, !canNext && styles.navButtonDisabled]}
          disabled={!canNext}
          accessibilityLabel="다음 페이즈"
          accessibilityRole="button"
        >
          <Text style={[styles.navButtonText, { color: colors.text }]}>
            {'›'}
          </Text>
        </Pressable>
      </View>

      {/* Phase chips */}
      <View style={styles.chipList}>
        {ALL_PHASES.map((phase) => {
          const pc =
            PHASE_COLORS[phase.value as keyof typeof PHASE_COLORS] ??
            PHASE_COLORS.night;
          const isActive = phase.value === currentPhase;

          return (
            <Pressable
              key={phase.value}
              onPress={() => onSetPhase(phase.value)}
              accessibilityLabel={`${phase.label} 페이즈로 전환`}
              accessibilityRole="button"
              style={[
                styles.chip,
                isActive && [
                  styles.chipActive,
                  { borderColor: pc.border, backgroundColor: pc.bg },
                ],
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && [styles.chipTextActive, { color: pc.text }],
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
