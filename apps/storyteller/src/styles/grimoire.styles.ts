import { StyleSheet } from 'react-native';

export function createGrimoireStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121214',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: s(16),
      paddingVertical: s(12),
      borderBottomWidth: 1,
      borderColor: '#2e2e34',
      zIndex: 200,
    },
    dayText: {
      color: '#908e8a',
      fontSize: s(14),
    },
    nominateButton: {
      backgroundColor: '#943c3c',
      paddingHorizontal: s(16),
      paddingVertical: s(8),
      borderRadius: 8,
    },
    nominateText: {
      color: '#e0ddd8',
      fontSize: s(14),
      fontWeight: '600',
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(12),
    },
    whisperButton: {
      backgroundColor: '#1a2618',
      paddingHorizontal: s(12),
      paddingVertical: s(8),
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#2a3d2a',
    },
    whisperButtonText: {
      color: '#6a8a6a',
      fontSize: s(13),
      fontWeight: '600',
    },
    logButton: {
      backgroundColor: '#1e2038',
      paddingHorizontal: s(12),
      paddingVertical: s(8),
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#3a3a52',
    },
    logText: {
      color: '#8090c0',
      fontSize: s(13),
      fontWeight: '600',
    },
    menuButton: {
      backgroundColor: '#2a2a30',
      paddingHorizontal: s(12),
      paddingVertical: s(8),
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#4a4a52',
    },
    menuText: {
      color: '#e0ddd8',
      fontSize: s(13),
      fontWeight: '600',
    },
    tokenArea: {
      flex: 1,
      position: 'relative',
    },
    executionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#2a1a0a',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#f5c542',
      paddingHorizontal: s(16),
      paddingVertical: s(10),
    },
    executionBannerContent: {
      flex: 1,
    },
    executionBannerLabel: {
      color: '#f5c542',
      fontSize: s(11),
      fontWeight: '700',
    },
    executionBannerRole: {
      color: '#e0ddd8',
      fontSize: s(16),
      fontWeight: '700',
      marginTop: s(2),
    },
    executionBannerName: {
      color: '#908e8a',
      fontSize: s(12),
      marginTop: s(2),
    },
    executionBannerDismiss: {
      paddingHorizontal: s(12),
      paddingVertical: s(6),
    },
    executionBannerDismissText: {
      color: '#908e8a',
      fontSize: s(12),
    },

    /* ---- Night feedback overlay ---- */
    nightFloatingTimer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(10),
      backgroundColor: '#101014',
      borderTopWidth: 1,
      borderColor: '#1e1e24',
      paddingHorizontal: s(14),
      paddingVertical: s(6),
    },
    nightFloatingTimerRole: {
      color: '#8090c0',
      fontSize: s(13),
      fontWeight: '700',
    },
    nightFloatingTimerTime: {
      color: '#c0c8e0',
      fontSize: s(14),
      fontWeight: '700',
      fontVariant: ['tabular-nums' as const],
    },
    nightFeedbackToggle: {
      backgroundColor: '#1a1a28',
      paddingHorizontal: s(10),
      paddingVertical: s(4),
      borderRadius: s(6),
      borderWidth: 1,
      borderColor: '#2a2a3a',
    },
    nightFeedbackToggleText: {
      color: '#8090c0',
      fontSize: s(11),
      fontWeight: '600',
    },
    nightFeedbackSentBadge: {
      backgroundColor: '#1a2a1a',
      paddingHorizontal: s(10),
      paddingVertical: s(4),
      borderRadius: s(6),
      borderWidth: 1,
      borderColor: '#2a4a2a',
    },
    nightFeedbackSentText: {
      color: '#4a8a4a',
      fontSize: s(11),
      fontWeight: '600',
    },
    nightFeedbackOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      backgroundColor: '#101014',
    },
    nightOrderRelative: {
      position: 'relative',
    },

    /* ---- Empath hint bar ---- */
    empathHintBar: {
      backgroundColor: '#1a2a1a',
      borderTopWidth: 1,
      borderColor: '#2a4a2a',
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    /* ---- Chef hint bar ---- */
    chefHintBar: {
      backgroundColor: '#2a1a0a',
      borderTopWidth: 1,
      borderColor: '#4a2a0a',
      paddingHorizontal: 16,
      paddingVertical: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    /* ---- Settings overlay ---- */
    settingsOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 500,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsPanel: {
      backgroundColor: '#1e1e24',
      borderRadius: 12,
      padding: 24,
      width: '80%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: '#3a3a42',
    },
    settingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    settingsRowLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    settingsCloseButton: {
      backgroundColor: '#2a2a34',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },

    /* ---- Game end result banner ---- */
    gameEndBannerGood: {
      backgroundColor: '#1a3a5c',
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    gameEndBannerEvil: {
      backgroundColor: '#4a1a1a',
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
    },

    /* ---- Vote countdown overlay ---- */
    voteCountdownContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none' as const,
      zIndex: 100,
    },

    /* ---- Game end result text ---- */
    gameEndReason: {
      color: '#aaa',
      marginTop: 4,
    },

    /* ---- Empath / Chef hint bar text ---- */
    empathHintLabel: {
      color: '#2ecc71',
      fontWeight: '600',
    },
    empathHintNames: {
      color: '#e0ddd8',
    },
    empathHintCount: {
      color: '#f5c542',
      fontWeight: '700',
    },
    chefHintLabel: {
      color: '#e67e22',
      fontWeight: '600',
    },
    chefHintNames: {
      color: '#e0ddd8',
    },
    chefHintCount: {
      color: '#f5c542',
      fontWeight: '700',
    },

    /* ---- Settings panel ---- */
    settingsTitle: {
      color: '#e0ddd8',
      fontWeight: '700',
      marginBottom: 20,
      textAlign: 'center',
    },
    settingsLabel: {
      color: '#e0ddd8',
      fontWeight: '600',
    },
    settingsDesc: {
      color: '#908e8a',
    },
    settingsClockMargin: {
      marginBottom: 16,
    },
    settingsClockMarginLast: {
      marginBottom: 24,
    },
    settingsCloseText: {
      color: '#e0ddd8',
      fontWeight: '600',
    },
  });
}

/* ---- Dynamic style helpers ---- */
export const grimoireDynamic = {
  voteCountdownText: (centerX: number, centerY: number) => ({
    position: 'absolute' as const,
    left: centerX - 40,
    top: centerY - 40,
    width: 80,
    textAlign: 'center' as const,
    fontSize: 56,
    fontWeight: '900' as const,
    color: '#c47070',
    textShadowColor: '#c4707060',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  }),
  gameEndWinnerText: (isGood: boolean) => ({
    color: isGood ? '#5dade2' : '#e74c3c',
    fontWeight: '700' as const,
  }),
};

// Default for static imports
export const styles = createGrimoireStyles(1);
