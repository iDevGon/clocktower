import type { Phase } from '@clocktower/shared';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import {
  PHASE_BAR_RAIL_LAYOUT,
  type PhaseBarVariant,
} from './PhaseBar.presentation';
import { createPhaseBarStyles, PHASE_COLORS } from './PhaseBar.styles';

/** Stepper navigation order: 밤 → 낮 cycles, with 종료 as terminal */
const STEPPER_ORDER: Phase[] = ['night', 'day'];

/** Main phases shown in progress and rail status */
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

const PHASE_HINTS: Record<Phase, string> = {
  setup: '플레이어와 역할 배정을 마치고 밤으로 시작합니다.',
  night: '밤 행동 순서를 진행하고 완료 후 낮으로 넘깁니다.',
  day: '토론과 지목을 진행한 뒤 필요하면 투표로 전환합니다.',
  vote: '찬반 결과를 확인하고 처형 또는 다음 밤을 결정합니다.',
  ended: '게임 결과를 확인한 뒤 새 게임을 시작할 수 있습니다.',
};

interface PhaseBarProps {
  currentPhase: Phase;
  onSetPhase: (phase: Phase) => void;
  onConfirmNext?: () => void;
  disableNext?: boolean;
  variant?: PhaseBarVariant;
}

export function PhaseBar({
  currentPhase,
  onSetPhase,
  onConfirmNext,
  disableNext = false,
  variant = 'default',
}: PhaseBarProps) {
  const { fontSize, device } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(
    () => createPhaseBarStyles(scale, device, variant),
    [scale, device, variant],
  );
  const isRail = variant === 'rail';

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
    if (onConfirmNext) {
      onConfirmNext();
      return;
    }
    if (isInStepper) {
      const nextIndex = (stepperIndex + 1) % STEPPER_ORDER.length;
      onSetPhase(STEPPER_ORDER[nextIndex]);
      return;
    }
    // vote/ended → stepper의 첫 단계(밤)로
    onSetPhase(STEPPER_ORDER[0]);
  };

  const canPrev = isInStepper && stepperIndex > 0;
  const canNext =
    !disableNext &&
    (isInStepper || currentPhase === 'vote' || currentPhase === 'ended');

  const nextPhaseLabel =
    currentPhase === 'night'
      ? '낮으로 진행'
      : currentPhase === 'day'
        ? '다음 밤으로 진행'
        : currentPhase === 'vote'
          ? '밤으로 복귀'
          : currentPhase === 'ended'
            ? '새 게임 확인'
            : '밤으로 진행';
  const nextPhaseHint = disableNext
    ? '밤 행동 순서가 끝나면 진행할 수 있습니다.'
    : `${PHASE_BAR_RAIL_LAYOUT.shortcutLabel} 단축키로도 실행됩니다.`;

  if (isRail) {
    return (
      <View style={styles.container}>
        <View style={styles.railContainer}>
          <View
            style={[
              styles.railCurrentCard,
              { backgroundColor: colors.bg, borderColor: colors.border },
            ]}
          >
            <Text style={styles.railEyebrow}>현재 메인 페이즈</Text>
            <Text style={[styles.railCurrentLabel, { color: colors.text }]}>
              {PHASE_LABELS[currentPhase] ?? currentPhase}
            </Text>
            <Text style={styles.railCurrentHint}>
              {PHASE_HINTS[currentPhase] ?? '현재 진행 상태를 확인합니다.'}
            </Text>
          </View>

          <View style={styles.railPhaseList}>
            {ALL_PHASES.map((phase) => {
              const pc =
                PHASE_COLORS[phase.value as keyof typeof PHASE_COLORS] ??
                PHASE_COLORS.night;
              const isCurrent = phase.value === currentPhase;

              return (
                <View
                  key={phase.value}
                  style={[
                    styles.railPhaseStep,
                    isCurrent && styles.railPhaseStepCurrent,
                    {
                      borderColor: isCurrent ? pc.border : '#2d2d38',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.railPhaseMarker,
                      { backgroundColor: isCurrent ? pc.dot : '#3a3a46' },
                    ]}
                  />
                  <Text
                    style={[
                      styles.railPhaseText,
                      isCurrent && styles.railPhaseTextCurrent,
                    ]}
                  >
                    {phase.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.railActions}>
            <Pressable
              onPress={handlePrev}
              style={[
                styles.railSecondaryButton,
                !canPrev && styles.railSecondaryButtonDisabled,
              ]}
              disabled={!canPrev}
              accessibilityLabel="이전 페이즈"
              accessibilityRole="button"
            >
              <Text style={styles.railSecondaryText}>‹ 이전</Text>
            </Pressable>

            <Pressable
              onPress={handleNext}
              style={[
                styles.railPrimaryButton,
                { backgroundColor: colors.bg, borderColor: colors.border },
                !canNext && styles.railPrimaryButtonDisabled,
              ]}
              disabled={!canNext}
              accessibilityLabel="다음 페이즈"
              accessibilityRole="button"
            >
              <View style={styles.railPrimaryHeader}>
                <Text style={[styles.railPrimaryLabel, { color: colors.text }]}>
                  {nextPhaseLabel}
                </Text>
                <View style={styles.railShortcutBadge}>
                  <Text style={styles.railShortcutText}>
                    {PHASE_BAR_RAIL_LAYOUT.shortcutLabel}
                  </Text>
                </View>
              </View>
              <Text style={styles.railPrimarySubText}>{nextPhaseHint}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

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
    </View>
  );
}
