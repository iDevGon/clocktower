import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export function createIndexStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.arcane.surface.base,
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
      borderColor: colors.arcane.border.brassDim,
      borderRadius: s(6),
      paddingHorizontal: s(16),
      paddingVertical: s(6),
      marginBottom: s(36),
      backgroundColor: 'rgba(38, 22, 6, 0.66)',
    },
    roleBadgeIcon: {
      color: colors.arcane.text.label,
      fontSize: s(14),
    },
    roleBadgeText: {
      color: colors.arcane.text.label,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(11),
      letterSpacing: 0,
    },

    /* ── Title ── */
    titleContainer: {
      alignItems: 'center',
      marginBottom: s(48),
    },
    title: {
      color: colors.arcane.text.label,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(13),
      letterSpacing: 0,
      marginBottom: s(6),
      textShadowColor: 'rgba(196, 160, 80, 0.4)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
    },
    subtitle: {
      color: colors.arcane.text.strong,
      fontFamily: typography.fontFamily.display,
      fontSize: s(56),
      letterSpacing: 0,
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
      color: colors.arcane.border.brassDim,
      fontSize: s(8),
      lineHeight: s(12),
    },
    decorDiamond: {
      color: colors.arcane.text.label,
      fontSize: s(10),
      lineHeight: s(12),
      marginHorizontal: s(2),
    },

    /* ── Form ── */
    form: {
      width: '100%',
      maxWidth: s(480),
      gap: s(14),
      padding: s(16),
      backgroundColor: 'rgba(14, 18, 36, 0.76)',
      borderWidth: 1,
      borderColor: colors.arcane.border.double,
      borderRadius: 6,
    },
    inputRow: {
      flexDirection: 'row',
      gap: s(8),
    },
    input: {
      backgroundColor: colors.arcane.surface.apparatus,
      borderWidth: 1,
      borderColor: colors.arcane.border.brassDim,
      borderRadius: 6,
      paddingHorizontal: s(16),
      paddingVertical: s(14),
      color: colors.arcane.text.primary,
      fontFamily: typography.fontFamily.body,
      fontSize: s(16),
    },
    inputFlex: {
      flex: 1,
    },
    qrButton: {
      backgroundColor: colors.arcane.surface.apparatus,
      borderWidth: 1,
      borderColor: colors.arcane.border.brassDim,
      borderRadius: 6,
      paddingHorizontal: s(18),
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrButtonPressed: {
      backgroundColor: colors.arcane.accent.midnightInk,
      borderColor: colors.arcane.accent.sapphireLens,
    },
    qrButtonText: {
      color: colors.arcane.text.label,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(13),
      letterSpacing: 0,
    },
    errorText: {
      color: colors.arcane.action.bloodHighlight,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(14),
      textAlign: 'center',
      textShadowColor: 'rgba(200, 120, 50, 0.4)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 8,
    },

    /* ── Button ── */
    button: {
      borderRadius: 6,
      paddingVertical: s(16),
      marginTop: s(8),
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.arcane.border.brass,
    },
    buttonGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    buttonPressed: {
      opacity: 0.8,
    },
    buttonText: {
      color: colors.arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(20),
      letterSpacing: 0,
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
      color: colors.arcane.text.dead,
      fontFamily: typography.fontFamily.body,
      fontSize: s(10),
      textAlign: 'center',
      lineHeight: s(16),
      letterSpacing: 0,
      opacity: 0.55,
    },
  });
}

export const styles = createIndexStyles(1);
