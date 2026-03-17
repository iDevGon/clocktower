import { StyleSheet } from 'react-native';

export const PHASE_COLORS = {
  night: {
    bg: '#1e2038',
    border: '#3a4878',
    text: '#8090c0',
    dot: '#6878b0',
  },
  day: {
    bg: '#302820',
    border: '#6a5a30',
    text: '#c4a050',
    dot: '#b09040',
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
      borderRadius: s(10),
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

    /* ---- phase chip list ---- */
    chipList: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: s(isDesktop ? 24 : isTablet ? 20 : 12),
      paddingBottom: s(isDesktop ? 10 : isTablet ? 8 : 6),
      gap: s(isDesktop ? 6 : 5),
    },
    chip: {
      paddingHorizontal: s(isDesktop ? 14 : isTablet ? 12 : 10),
      paddingVertical: s(isDesktop ? 6 : 5),
      borderRadius: s(6),
      borderWidth: 1,
      borderColor: '#2a2a34',
      backgroundColor: '#14141a',
      minHeight: 44,
      justifyContent: 'center' as const,
    },
    chipActive: {
      borderWidth: 1.5,
    },
    chipPast: {
      opacity: 0.35,
    },
    chipText: {
      fontSize: s(isDesktop ? 11 : isTablet ? 10 : 9),
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

export const styles = createPhaseBarStyles(1, 'phone');
