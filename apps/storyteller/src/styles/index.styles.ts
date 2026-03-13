import { StyleSheet } from 'react-native';

export function createIndexStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#06080f',
    },
    backgroundGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: s(32),
    },

    /* ── Role badge ── */
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      borderWidth: 1,
      borderColor: 'rgba(196, 160, 80, 0.25)',
      borderRadius: s(20),
      paddingHorizontal: s(16),
      paddingVertical: s(6),
      marginBottom: s(36),
      backgroundColor: 'rgba(196, 160, 80, 0.06)',
    },
    roleBadgeIcon: {
      color: '#c4a050',
      fontSize: s(14),
    },
    roleBadgeText: {
      color: '#c4a050',
      fontSize: s(11),
      fontWeight: '700',
      letterSpacing: s(4),
      textTransform: 'uppercase',
    },

    /* ── Title ── */
    titleContainer: {
      alignItems: 'center',
      marginBottom: s(48),
    },
    title: {
      color: '#8b7530',
      fontSize: s(13),
      fontWeight: '600',
      letterSpacing: s(8),
      textTransform: 'uppercase',
      marginBottom: s(6),
      textShadowColor: 'rgba(196, 160, 80, 0.4)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
    },
    subtitle: {
      color: '#e8e0d0',
      fontSize: s(56),
      fontWeight: '900',
      letterSpacing: s(4),
      textShadowColor: 'rgba(196, 160, 80, 0.35)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 20,
    },
    titleDivider: {
      width: s(80),
      height: 1,
      marginTop: s(18),
    },
    titleDividerGradient: {
      flex: 1,
      height: 1,
    },
    decorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      marginTop: s(14),
    },
    decorStar: {
      color: '#8b7530',
      fontSize: s(8),
      lineHeight: s(12),
    },
    decorDiamond: {
      color: '#c4a050',
      fontSize: s(10),
      lineHeight: s(12),
      marginHorizontal: s(2),
    },

    /* ── Form ── */
    form: {
      width: '100%',
      maxWidth: s(480),
      gap: s(14),
    },
    inputRow: {
      flexDirection: 'row',
      gap: s(8),
    },
    input: {
      backgroundColor: 'rgba(10, 12, 25, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(196, 160, 80, 0.18)',
      borderRadius: 10,
      paddingHorizontal: s(16),
      paddingVertical: s(14),
      color: '#d8d0c0',
      fontSize: s(16),
    },
    inputFlex: {
      flex: 1,
    },
    qrButton: {
      backgroundColor: 'rgba(10, 12, 25, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(196, 160, 80, 0.18)',
      borderRadius: 10,
      paddingHorizontal: s(18),
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrButtonPressed: {
      backgroundColor: 'rgba(196, 160, 80, 0.12)',
      borderColor: 'rgba(196, 160, 80, 0.35)',
    },
    qrButtonText: {
      color: '#8b7530',
      fontSize: s(13),
      fontWeight: '800',
      letterSpacing: 1,
    },
    errorText: {
      color: '#cc7744',
      fontSize: s(14),
      textAlign: 'center',
      textShadowColor: 'rgba(200, 120, 50, 0.4)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },

    /* ── Button ── */
    button: {
      borderRadius: 10,
      paddingVertical: s(16),
      marginTop: s(8),
      alignItems: 'center',
      overflow: 'hidden',
    },
    buttonGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    buttonPressed: {
      opacity: 0.8,
    },
    buttonText: {
      color: '#f0ead8',
      fontSize: s(20),
      fontWeight: '900',
      letterSpacing: s(4),
      textTransform: 'uppercase',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },

    /* ── Footer ── */
    copyright: {
      position: 'absolute',
      bottom: s(20),
      left: 0,
      right: 0,
      color: '#2a2840',
      fontSize: s(10),
      textAlign: 'center',
      lineHeight: s(16),
      letterSpacing: 1,
    },
  });
}

export const styles = createIndexStyles(1);
