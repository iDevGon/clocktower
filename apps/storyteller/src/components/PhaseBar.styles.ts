import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';
import type { PhaseBarVariant } from './PhaseBar.presentation';
import { PHASE_BAR_RAIL_LAYOUT } from './PhaseBar.presentation';

export const PHASE_COLORS = {
  night: {
    bg: '#1e2038',
    border: '#3a4878',
    text: '#8090c0',
    dot: '#6878b0',
  },
  day: {
    bg: '#28211a',
    border: colors.arcane.border.brassDim,
    text: colors.phase.day,
    dot: colors.arcane.border.brass,
  },
  vote: {
    bg: '#301c22',
    border: '#6a2838',
    text: '#c47070',
    dot: '#b06060',
  },
  ended: {
    bg: '#1e1e24',
    border: '#3a3a48',
    text: '#909098',
    dot: '#707078',
  },
} as const;

export function createPhaseBarStyles(
  scale: number,
  device: 'phone' | 'tablet' | 'desktop',
  variant: PhaseBarVariant = 'default',
) {
  const s = (v: number) => Math.round(v * scale);
  const isDesktop = device === 'desktop';
  const isTablet = device === 'tablet';
  const isRail = variant === 'rail';

  return StyleSheet.create({
    container: {
      flex: isRail ? 1 : undefined,
      minHeight: isRail ? 0 : undefined,
      borderTopWidth: isRail ? 0 : 1,
      borderColor: '#1e1e24',
      backgroundColor: isRail ? 'transparent' : '#101014',
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
      paddingVertical: s(isDesktop ? 12 : isTablet ? 10 : 8),
      gap: s(isDesktop ? 16 : isTablet ? 14 : 10),
    },
    navButton: {
      width: s(isDesktop ? 44 : isTablet ? 44 : 44),
      height: s(isDesktop ? 44 : isTablet ? 44 : 44),
      borderRadius: s(22),
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
      fontSize: s(isDesktop ? 18 : isTablet ? 16 : 14),
      fontWeight: '600',
    },

    /* ---- active phase card ---- */
    activeCard: {
      flex: 1,
      borderRadius: s(5),
      borderWidth: 1,
      paddingHorizontal: s(isDesktop ? 20 : isTablet ? 16 : 14),
      paddingVertical: s(isDesktop ? 12 : isTablet ? 10 : 8),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(8),
      minHeight: s(isDesktop ? 48 : isTablet ? 44 : 40),
    },
    phaseDot: {
      width: s(8),
      height: s(8),
      borderRadius: s(4),
    },
    phaseLabel: {
      fontSize: s(isDesktop ? 16 : isTablet ? 15 : 14),
      fontWeight: '700',
    },

    /* ---- desktop rail ---- */
    railContainer: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: s(14),
      paddingTop: s(14),
      paddingBottom: s(16),
      gap: s(14),
      justifyContent: 'space-between',
    },
    railCurrentCard: {
      borderRadius: s(5),
      borderWidth: 1,
      paddingHorizontal: s(14),
      paddingVertical: s(13),
      minHeight: s(102),
      justifyContent: 'center',
      gap: s(7),
    },
    railEyebrow: {
      color: '#a18a62',
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(10),
      letterSpacing: 0.8,
    },
    railCurrentLabel: {
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(24),
      lineHeight: s(30),
    },
    railCurrentHint: {
      color: colors.arcane.text.muted,
      fontFamily: typography.fontFamily.body,
      fontSize: s(12),
      lineHeight: s(17),
    },
    railPhaseList: {
      gap: s(8),
    },
    railPhaseStep: {
      minHeight: s(PHASE_BAR_RAIL_LAYOUT.phaseStepMinHeight),
      borderRadius: s(4),
      borderWidth: 1,
      borderColor: '#2d2d38',
      backgroundColor: '#11131c',
      paddingHorizontal: s(12),
      paddingVertical: s(9),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
    },
    railPhaseStepCurrent: {
      backgroundColor: '#191b28',
    },
    railPhaseMarker: {
      width: s(8),
      height: s(22),
      borderRadius: s(2),
    },
    railPhaseText: {
      flex: 1,
      color: colors.arcane.text.muted,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(13),
    },
    railPhaseTextCurrent: {
      color: colors.arcane.text.primary,
      fontFamily: typography.fontFamily.bodyBold,
    },
    railActions: {
      gap: s(10),
    },
    railPrimaryButton: {
      minHeight: s(PHASE_BAR_RAIL_LAYOUT.primaryActionMinHeight),
      borderRadius: s(5),
      borderWidth: 1,
      paddingHorizontal: s(14),
      paddingVertical: s(14),
      justifyContent: 'center',
      gap: s(9),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.24,
      shadowRadius: 12,
      elevation: 8,
    },
    railPrimaryButtonDisabled: {
      opacity: 0.42,
    },
    railPrimaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(10),
    },
    railPrimaryLabel: {
      flex: 1,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(18),
      lineHeight: s(23),
    },
    railShortcutBadge: {
      borderRadius: s(4),
      borderWidth: 1,
      borderColor: '#ffffff30',
      backgroundColor: '#00000024',
      paddingHorizontal: s(8),
      paddingVertical: s(4),
    },
    railShortcutText: {
      color: '#f0dbc0',
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(10),
      letterSpacing: 0.5,
    },
    railPrimarySubText: {
      color: colors.arcane.text.muted,
      fontFamily: typography.fontFamily.body,
      fontSize: s(12),
      lineHeight: s(17),
    },
    railSecondaryButton: {
      alignSelf: 'stretch',
      minHeight: s(PHASE_BAR_RAIL_LAYOUT.secondaryActionMinHeight),
      borderRadius: s(4),
      borderWidth: 1,
      borderColor: '#34313b80',
      backgroundColor: 'transparent',
      paddingHorizontal: s(8),
      paddingVertical: s(5),
      alignItems: 'center',
      justifyContent: 'center',
    },
    railSecondaryButtonDisabled: {
      opacity: 0.18,
    },
    railSecondaryText: {
      color: colors.arcane.text.dead,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(11),
    },
  });
}

export const styles = createPhaseBarStyles(1, 'phone');
