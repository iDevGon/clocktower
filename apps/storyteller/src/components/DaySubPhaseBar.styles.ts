import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';
import type { DaySubPhaseBarVariant } from './DaySubPhaseBar.presentation';
import { DAY_SUB_PHASE_CONSOLE_LAYOUT } from './DaySubPhaseBar.presentation';

export const SUB_PHASE_COLORS = {
  whisper: {
    bg: colors.arcane.surface.parchment,
    border: colors.arcane.border.brassDim,
    text: colors.arcane.text.label,
    dot: colors.arcane.border.brass,
  },
  discussion: {
    bg: colors.arcane.accent.midnightInk,
    border: colors.arcane.accent.prussianBlue,
    text: colors.arcane.accent.sapphireLens,
    dot: colors.arcane.accent.sapphireLens,
  },
  nomination: {
    bg: colors.arcane.action.bloodPressed,
    border: colors.arcane.action.blood,
    text: colors.arcane.action.bloodHighlight,
    dot: '#c47252',
  },
  defense: {
    bg: '#241926',
    border: '#725b85',
    text: '#d7b7ef',
    dot: '#b48ad0',
  },
} as const;

export function createDaySubPhaseBarStyles(
  scale: number,
  device: 'phone' | 'tablet' | 'desktop',
  variant: DaySubPhaseBarVariant = 'default',
) {
  const s = (v: number) => Math.round(v * scale);
  const isDesktop = device === 'desktop';
  const isTablet = device === 'tablet';
  const isConsoleTop = variant === 'consoleTop';

  return StyleSheet.create({
    container: {
      minHeight: isConsoleTop
        ? s(DAY_SUB_PHASE_CONSOLE_LAYOUT.minHeight)
        : undefined,
      borderBottomWidth: 1,
      borderColor: isConsoleTop ? colors.arcane.border.brassDim : '#1e1e24',
      backgroundColor: isConsoleTop ? '#100c08' : '#101014',
    },

    /* ---- progress bar ---- */
    progressBar: {
      flexDirection: 'row',
      height: s(3),
      backgroundColor: '#1a1a20',
    },
    progressSegment: {
      flex: 1,
      marginHorizontal: 0.5,
    },

    /* ---- stepper ---- */
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s(isDesktop ? 24 : isTablet ? 20 : 12),
      paddingVertical: s(isDesktop ? 10 : isTablet ? 8 : 6),
      gap: s(isDesktop ? 14 : isTablet ? 12 : 8),
    },
    navButton: {
      width: s(isDesktop ? 40 : isTablet ? 36 : 32),
      height: s(isDesktop ? 40 : isTablet ? 36 : 32),
      borderRadius: s(isDesktop ? 20 : isTablet ? 18 : 16),
      backgroundColor: '#1a1a22',
      borderWidth: 1,
      borderColor: '#2a2a34',
      justifyContent: 'center',
      alignItems: 'center',
    },
    navButtonDisabled: {
      opacity: 0.3,
    },
    navButtonText: {
      fontSize: s(isDesktop ? 16 : isTablet ? 14 : 13),
      fontWeight: '600',
    },

    /* ---- active sub-phase card ---- */
    activeCard: {
      flex: 1,
      borderRadius: s(4),
      borderWidth: 1,
      paddingHorizontal: s(isDesktop ? 16 : isTablet ? 14 : 12),
      paddingVertical: s(isDesktop ? 10 : isTablet ? 8 : 6),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(6),
      minHeight: s(isDesktop ? 40 : isTablet ? 36 : 32),
    },
    subPhaseDot: {
      width: s(6),
      height: s(6),
      borderRadius: s(3),
    },
    subPhaseLabel: {
      fontSize: s(isDesktop ? 14 : isTablet ? 13 : 12),
      fontWeight: '700',
    },

    /* ---- sub-phase chip list ---- */
    chipList: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: s(isDesktop ? 24 : isTablet ? 20 : 12),
      paddingBottom: s(isDesktop ? 8 : isTablet ? 6 : 5),
      gap: s(isDesktop ? 6 : 5),
    },
    chip: {
      paddingHorizontal: s(isDesktop ? 12 : isTablet ? 10 : 8),
      paddingVertical: s(isDesktop ? 5 : 4),
      borderRadius: s(5),
      borderWidth: 1,
      borderColor: '#2a2a34',
      backgroundColor: '#14141a',
    },
    chipActive: {
      borderWidth: 1.5,
    },
    chipPast: {
      opacity: 0.35,
    },
    chipText: {
      fontSize: s(isDesktop ? 10 : isTablet ? 9 : 8),
      fontWeight: '500',
      color: '#707078',
    },
    chipTextActive: {
      fontWeight: '700',
    },
    chipTextPast: {
      color: '#404048',
    },

    /* ---- desktop console top ---- */
    consoleShell: {
      minHeight: s(DAY_SUB_PHASE_CONSOLE_LAYOUT.minHeight),
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: s(10),
      paddingHorizontal: s(12),
      paddingVertical: s(7),
      backgroundColor: '#0f0b08',
    },
    consoleCurrent: {
      width: s(166),
      borderRadius: s(DAY_SUB_PHASE_CONSOLE_LAYOUT.cornerRadius),
      borderWidth: 1,
      paddingHorizontal: s(10),
      paddingVertical: s(8),
      justifyContent: 'center',
      gap: s(3),
    },
    consoleEyebrow: {
      color: colors.arcane.text.dead,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(10),
      letterSpacing: 0.8,
    },
    consoleCurrentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      minWidth: 0,
    },
    consoleCurrentDot: {
      width: s(8),
      height: s(20),
      borderRadius: s(2),
    },
    consoleCurrentLabel: {
      flex: 1,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(16),
      lineHeight: s(20),
    },
    consoleStepList: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: s(7),
    },
    consoleStep: {
      flex: 1,
      minHeight: s(DAY_SUB_PHASE_CONSOLE_LAYOUT.stepMinHeight),
      borderRadius: s(DAY_SUB_PHASE_CONSOLE_LAYOUT.cornerRadius),
      borderWidth: 1,
      borderColor: '#34313b',
      backgroundColor: '#121118',
      paddingHorizontal: s(10),
      paddingVertical: s(6),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(9),
    },
    consoleStepActive: {
      backgroundColor: '#191b28',
    },
    consoleStepPast: {
      opacity: 0.58,
    },
    consoleStepMarker: {
      width: s(7),
      height: s(20),
      borderRadius: s(2),
    },
    consoleStepTextGroup: {
      flex: 1,
      minWidth: 0,
      gap: s(2),
    },
    consoleStepLabel: {
      color: colors.arcane.text.muted,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(12),
      lineHeight: s(16),
    },
    consoleStepLabelActive: {
      color: colors.arcane.text.primary,
      fontFamily: typography.fontFamily.bodyBold,
    },
    consoleStepTimer: {
      color: colors.arcane.text.dead,
      fontFamily: typography.fontFamily.body,
      fontSize: s(10),
      lineHeight: s(13),
    },
    consoleActions: {
      width: s(150),
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: s(7),
    },
    consoleActionButton: {
      minWidth: s(DAY_SUB_PHASE_CONSOLE_LAYOUT.actionButtonMinWidth),
      borderRadius: s(DAY_SUB_PHASE_CONSOLE_LAYOUT.cornerRadius),
      borderWidth: 1,
      borderColor: '#34313b',
      backgroundColor: '#121118',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: s(10),
    },
    consoleActionButtonPrimary: {
      backgroundColor: colors.arcane.surface.parchment,
    },
    consoleActionButtonDisabled: {
      opacity: 0.34,
    },
    consoleActionText: {
      color: colors.arcane.text.muted,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(12),
    },
  });
}

export const styles = createDaySubPhaseBarStyles(1, 'phone');
