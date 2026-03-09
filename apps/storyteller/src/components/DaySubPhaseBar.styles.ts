import { StyleSheet } from 'react-native';

export const SUB_PHASE_COLORS = {
  whisper: {
    bg: '#2a2418',
    border: '#5a4a28',
    text: '#c0a050',
    dot: '#a08838',
  },
  discussion: {
    bg: '#282820',
    border: '#58582a',
    text: '#b8b848',
    dot: '#989830',
  },
  nomination: {
    bg: '#2e2218',
    border: '#6a4a20',
    text: '#d0a040',
    dot: '#b88830',
  },
} as const;

export function createDaySubPhaseBarStyles(
  scale: number,
  device: 'phone' | 'tablet' | 'desktop',
) {
  const s = (v: number) => Math.round(v * scale);
  const isDesktop = device === 'desktop';
  const isTablet = device === 'tablet';

  return StyleSheet.create({
    container: {
      borderBottomWidth: 1,
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
      borderRadius: s(8),
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
  });
}

export const styles = createDaySubPhaseBarStyles(1, 'phone');
