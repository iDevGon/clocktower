import type { Phase } from '@clocktower/shared';
import { colors, space, typography } from '@clocktower/ui';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

/** 챕터 순서 — 단계별 이동용 */
const STEPPER_ORDER: Phase[] = ['night', 'day'];

/** 5개 챕터 마크 — 항상 표시되는 타임라인 */
const CHAPTER_MARKS: { label: string; value: Phase }[] = [
  { label: '준비', value: 'setup' },
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
  const styles = useMemo(() => createStyles(scale, device), [scale, device]);

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
    onSetPhase(STEPPER_ORDER[0]);
  };

  const canPrev = isInStepper && stepperIndex > 0;
  const canNext =
    !disableNext &&
    (isInStepper || currentPhase === 'vote' || currentPhase === 'ended');

  return (
    <View style={styles.container}>
      {/* 챕터 마크 — 5개 점이 금박 라인에 매달려 있는 타임라인 */}
      <View style={styles.chapterRail}>
        <View style={styles.railLine} />
        {CHAPTER_MARKS.map((mark) => {
          const isCurrent = mark.value === currentPhase;
          return (
            <View key={mark.value} style={styles.markColumn}>
              <View
                style={[
                  styles.markDot,
                  isCurrent ? styles.markDotActive : styles.markDotInactive,
                ]}
              />
              <Text
                style={[
                  styles.markLabel,
                  isCurrent ? styles.markLabelActive : null,
                ]}
              >
                {mark.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 스텝퍼 — prev / 현재 페이즈 / next */}
      <View style={styles.stepper}>
        <Pressable
          onPress={handlePrev}
          style={[styles.navButton, canPrev ? null : styles.navButtonDisabled]}
          disabled={!canPrev}
          accessibilityLabel="이전 페이즈"
          accessibilityRole="button"
        >
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>

        <View style={styles.activeCard}>
          <Text style={styles.activePhase}>
            {PHASE_LABELS[currentPhase] ?? currentPhase}
          </Text>
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.navButton, canNext ? null : styles.navButtonDisabled]}
          disabled={!canNext}
          accessibilityLabel="다음 페이즈"
          accessibilityRole="button"
        >
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(scale: number, device: 'phone' | 'tablet' | 'desktop') {
  const s = (v: number) => Math.round(v * scale);
  const isDesktop = device === 'desktop';
  const isTablet = device === 'tablet';

  return StyleSheet.create({
    container: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge.gilt,
      backgroundColor: colors.ink.deep,
    },

    // 챕터 레일
    chapterRail: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: s(isDesktop ? 32 : isTablet ? 24 : 16),
      paddingTop: s(10),
      paddingBottom: s(6),
      position: 'relative',
    },
    railLine: {
      position: 'absolute',
      left: s(isDesktop ? 44 : isTablet ? 36 : 28),
      right: s(isDesktop ? 44 : isTablet ? 36 : 28),
      top: s(14),
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.edge.gilt,
      opacity: 0.4,
    },
    markColumn: {
      alignItems: 'center',
      gap: s(4),
      minWidth: s(36),
    },
    markDot: {
      width: s(8),
      height: s(8),
      borderRadius: s(4),
      borderWidth: 1,
    },
    markDotInactive: {
      backgroundColor: colors.ink.mid,
      borderColor: colors.edge.default,
    },
    markDotActive: {
      backgroundColor: colors.ember.core,
      borderColor: colors.ember.glow,
      // 촛불 느낌 — ember glow 주변 halo
      shadowColor: colors.ember.glow,
      shadowOpacity: 0.7,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 0 },
    },
    markLabel: {
      fontFamily: typography.family.body,
      fontSize: s(isDesktop ? 11 : isTablet ? 10 : 10),
      color: colors.parchment.low,
      letterSpacing: typography.tracking.wide,
    },
    markLabelActive: {
      color: colors.ember.glow,
      fontWeight: typography.weight.semibold,
    },

    // 스텝퍼
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s(isDesktop ? 24 : isTablet ? 20 : 12),
      paddingVertical: s(isDesktop ? 10 : isTablet ? 8 : 6),
      gap: s(isDesktop ? 16 : isTablet ? 14 : 10),
    },
    navButton: {
      width: s(40),
      height: s(40),
      borderRadius: s(20),
      backgroundColor: colors.ink.mid,
      borderWidth: 1,
      borderColor: colors.edge.default,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navButtonDisabled: {
      opacity: 0.35,
    },
    navArrow: {
      fontFamily: typography.family.body,
      fontSize: s(isDesktop ? 20 : isTablet ? 18 : 16),
      fontWeight: typography.weight.semibold,
      color: colors.parchment.mid,
      lineHeight: s(isDesktop ? 22 : 20),
    },
    activeCard: {
      flex: 1,
      borderRadius: space.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.edge.gilt,
      backgroundColor: colors.ink.mid,
      paddingHorizontal: space.base,
      paddingVertical: space.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activePhase: {
      fontFamily: typography.family.display,
      fontSize: s(isDesktop ? 18 : isTablet ? 17 : 15),
      fontWeight: typography.weight.bold,
      color: colors.parchment.high,
      letterSpacing: typography.tracking.tight,
    },
  });
}
