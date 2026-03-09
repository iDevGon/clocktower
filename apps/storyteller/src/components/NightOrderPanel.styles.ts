import { StyleSheet } from 'react-native';

const TEAM_COLORS = {
  townsfolk: { bg: '#1a2540', border: '#3a5a8a', text: '#6a9fd8', dot: '#5a8ec8' },
  outsider: { bg: '#1a2a2a', border: '#2a5a5a', text: '#5ab8a0', dot: '#4aa890' },
  minion: { bg: '#2a1a18', border: '#6a3a28', text: '#d08050', dot: '#c07040' },
  demon: { bg: '#2a1418', border: '#6a2830', text: '#d04858', dot: '#c03848' },
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
      borderColor: '#1e1e24',
      backgroundColor: '#101014',
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

    /* ---- stepper: the main active-role area ---- */
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s(isDesktop ? 24 : isTablet ? 20 : 12),
      paddingVertical: s(isDesktop ? 14 : isTablet ? 12 : 10),
      gap: s(isDesktop ? 16 : isTablet ? 14 : 10),
    },
    navButton: {
      width: s(isDesktop ? 48 : isTablet ? 44 : 40),
      height: s(isDesktop ? 48 : isTablet ? 44 : 40),
      borderRadius: s(isDesktop ? 24 : isTablet ? 22 : 20),
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
      color: '#8090c0',
      fontSize: s(isDesktop ? 20 : isTablet ? 18 : 16),
      fontWeight: '600',
    },

    /* ---- active role card ---- */
    activeCard: {
      flex: 1,
      borderRadius: s(10),
      borderWidth: 1,
      paddingHorizontal: s(isDesktop ? 20 : isTablet ? 16 : 14),
      paddingVertical: s(isDesktop ? 14 : isTablet ? 12 : 10),
      minHeight: s(isDesktop ? 72 : isTablet ? 64 : 56),
      justifyContent: 'center',
    },
    activeCardIdle: {
      backgroundColor: '#14141a',
      borderColor: '#2a2a34',
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
      fontWeight: '700',
    },
    activeRoleTeam: {
      fontSize: s(isDesktop ? 11 : isTablet ? 10 : 9),
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
      opacity: 0.6,
    },
    timerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      backgroundColor: '#ffffff08',
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
      color: '#c0c8e0',
      fontSize: s(isDesktop ? 13 : 12),
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    activeAbility: {
      marginTop: s(6),
      fontSize: s(isDesktop ? 13 : isTablet ? 12 : 11),
      lineHeight: s(isDesktop ? 20 : isTablet ? 18 : 17),
      color: '#a0a0a8',
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
      color: '#505058',
      fontSize: s(isDesktop ? 15 : isTablet ? 14 : 13),
      fontWeight: '500',
      textAlign: 'center',
    },
    stepCounter: {
      color: '#505060',
      fontSize: s(isDesktop ? 12 : 11),
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
      borderRadius: s(6),
      borderWidth: 1,
      borderColor: '#2a2a34',
      backgroundColor: '#14141a',
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
      fontWeight: '500',
      color: '#707078',
    },
    roleChipNameActive: {
      fontWeight: '700',
    },
    roleChipNamePast: {
      color: '#404048',
    },
  });
}

export const styles = createNightOrderPanelStyles(1, 'phone');
