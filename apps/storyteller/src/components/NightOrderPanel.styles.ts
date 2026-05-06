import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const TEAM_COLORS = {
  townsfolk: {
    bg: colors.arcane.accent.midnightInk,
    border: colors.arcane.accent.prussianBlue,
    text: colors.arcane.accent.sapphireLens,
    dot: colors.arcane.accent.sapphireLens,
  },
  outsider: {
    bg: colors.arcane.surface.ledger,
    border: colors.arcane.border.parchment,
    text: colors.arcane.text.primary,
    dot: colors.arcane.text.label,
  },
  minion: {
    bg: colors.arcane.surface.parchment,
    border: colors.arcane.border.brass,
    text: colors.arcane.text.label,
    dot: colors.arcane.border.brass,
  },
  demon: {
    bg: colors.arcane.surface.apparatus,
    border: colors.arcane.action.blood,
    text: colors.arcane.action.bloodHighlight,
    dot: colors.arcane.action.blood,
  },
} as const;

export { TEAM_COLORS };

export function createNightOrderPanelStyles(
  scale: number,
  device: 'phone' | 'tablet' | 'desktop',
) {
  const s = (v: number) => Math.round(v * scale);

  const isDesktop = device === 'desktop';
  const isTablet = device === 'tablet';

  return StyleSheet.create({
    container: {
      borderTopWidth: 1,
      borderColor: colors.arcane.border.brassDim,
      backgroundColor: colors.arcane.surface.apparatus,
    },

    /* ---- progress bar ---- */
    progressBar: {
      flexDirection: 'row',
      height: s(3),
      backgroundColor: colors.arcane.surface.base,
    },
    progressSegment: {
      flex: 1,
      marginHorizontal: 0.5,
    },

    /* ---- stepper: the main active-role area ---- */
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s(isDesktop ? 24 : isTablet ? 20 : 12),
      paddingVertical: s(isDesktop ? 14 : isTablet ? 12 : 10),
      gap: s(isDesktop ? 16 : isTablet ? 14 : 10),
    },
    navButton: {
      width: s(isDesktop ? 48 : isTablet ? 44 : 44),
      height: s(isDesktop ? 48 : isTablet ? 44 : 44),
      borderRadius: s(isDesktop ? 24 : 22),
      backgroundColor: colors.arcane.surface.ledger,
      borderWidth: 1,
      borderColor: colors.arcane.border.parchment,
      justifyContent: 'center',
      alignItems: 'center',
    },
    navButtonDisabled: {
      opacity: 0.3,
    },
    navButtonText: {
      color: colors.arcane.text.label,
      fontSize: s(isDesktop ? 20 : isTablet ? 18 : 16),
      fontWeight: '600',
    },

    /* ---- active role card ---- */
    activeCard: {
      flex: 1,
      borderRadius: s(6),
      borderWidth: 1,
      paddingHorizontal: s(isDesktop ? 20 : isTablet ? 16 : 14),
      paddingVertical: s(isDesktop ? 14 : isTablet ? 12 : 10),
      minHeight: s(isDesktop ? 72 : isTablet ? 64 : 56),
      justifyContent: 'center',
    },
    activeCardIdle: {
      backgroundColor: colors.arcane.surface.base,
      borderColor: colors.arcane.border.brassDim,
      borderStyle: 'dashed',
    },
    activeCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    activeCardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      flex: 1,
    },
    teamDot: {
      width: s(8),
      height: s(8),
      borderRadius: s(4),
    },
    activeRoleName: {
      fontSize: s(isDesktop ? 17 : isTablet ? 15 : 14),
      fontFamily: typography.fontFamily.display,
      fontWeight: '700',
    },
    activeRoleTeam: {
      fontSize: s(isDesktop ? 11 : isTablet ? 10 : 9),
      fontFamily: typography.fontFamily.bodyMedium,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
      opacity: 0.6,
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      backgroundColor: '#00000024',
      paddingHorizontal: s(8),
      paddingVertical: s(3),
      borderRadius: s(10),
    },
    timerDot: {
      width: s(6),
      height: s(6),
      borderRadius: s(3),
      backgroundColor: '#8090c0',
    },
    timerText: {
      color: colors.arcane.text.strong,
      fontSize: s(isDesktop ? 13 : 12),
      fontFamily: typography.fontFamily.bodyBold,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    activeAbility: {
      marginTop: s(6),
      fontSize: s(isDesktop ? 13 : isTablet ? 12 : 11),
      lineHeight: s(isDesktop ? 20 : isTablet ? 18 : 17),
      color: colors.arcane.text.primary,
      fontFamily: typography.fontFamily.body,
    },
    inGameBadge: {
      marginTop: s(6),
      alignSelf: 'flex-start',
      borderRadius: s(4),
      paddingHorizontal: s(8),
      paddingVertical: s(2),
    },
    inGameBadgeText: {
      fontSize: s(isDesktop ? 10 : 9),
      fontWeight: '600',
    },
    idleText: {
      color: colors.arcane.text.dead,
      fontSize: s(isDesktop ? 15 : isTablet ? 14 : 13),
      fontFamily: typography.fontFamily.bodyMedium,
      fontWeight: '500',
      textAlign: 'center',
    },
    stepCounter: {
      color: colors.arcane.text.dead,
      fontSize: s(isDesktop ? 12 : 11),
      fontFamily: typography.fontFamily.bodyMedium,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
      marginTop: s(4),
    },

    /* ---- role list (scrollable pills below stepper) ---- */
    roleList: {
      paddingHorizontal: s(isDesktop ? 24 : isTablet ? 20 : 12),
      paddingBottom: s(isDesktop ? 12 : isTablet ? 10 : 8),
      gap: s(isDesktop ? 6 : 5),
    },
    roleChip: {
      paddingHorizontal: s(isDesktop ? 14 : isTablet ? 12 : 10),
      paddingVertical: s(isDesktop ? 7 : isTablet ? 6 : 5),
      borderRadius: s(4),
      borderWidth: 1,
      borderColor: colors.arcane.border.brassDim,
      backgroundColor: colors.arcane.surface.base,
    },
    roleChipActive: {
      borderWidth: 1.5,
    },
    roleChipPast: {
      opacity: 0.35,
    },
    roleChipAbsent: {
      borderStyle: 'dashed',
      opacity: 0.5,
    },
    roleChipName: {
      fontSize: s(isDesktop ? 12 : isTablet ? 11 : 10),
      fontFamily: typography.fontFamily.bodyMedium,
      fontWeight: '500',
      color: colors.arcane.text.muted,
    },
    roleChipNameActive: {
      fontWeight: '700',
    },
    roleChipNamePast: {
      color: colors.arcane.text.dead,
    },
  });
}

export const styles = createNightOrderPanelStyles(1, 'phone');
