import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const arcane = colors.arcane;

export function createGrimoireStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: arcane.surface.base,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: s(16),
      paddingVertical: s(12),
      borderBottomWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
      zIndex: 200,
    },
    dayText: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.display,
      fontSize: s(18),
    },
    nominateButton: {
      backgroundColor: arcane.action.bloodPressed,
      paddingHorizontal: s(16),
      paddingVertical: s(8),
      borderRadius: 6,
      borderWidth: 1,
      borderColor: arcane.action.bloodHighlight,
    },
    nominateText: {
      color: arcane.text.strong,
      fontSize: s(14),
      fontWeight: '600',
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(12),
    },
    whisperButton: {
      backgroundColor: arcane.accent.midnightInk,
      paddingHorizontal: s(12),
      paddingVertical: s(8),
      borderRadius: 6,
      borderWidth: 1,
      borderColor: arcane.accent.prussianBlue,
    },
    whisperButtonText: {
      color: arcane.accent.sapphireLens,
      fontSize: s(13),
      fontWeight: '600',
    },
    logButton: {
      backgroundColor: arcane.surface.ledger,
      paddingHorizontal: s(12),
      paddingVertical: s(8),
      borderRadius: 6,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
    },
    logText: {
      color: arcane.text.label,
      fontSize: s(13),
      fontWeight: '600',
    },
    menuButton: {
      backgroundColor: arcane.surface.ledger,
      paddingHorizontal: s(12),
      paddingVertical: s(8),
      borderRadius: 6,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
    },
    menuText: {
      color: arcane.text.primary,
      fontSize: s(13),
      fontWeight: '600',
    },
    tokenArea: {
      flex: 1,
      position: 'relative',
      backgroundColor: arcane.surface.base,
    },
    tokenAreaNight: {
      backgroundColor: '#060d1a',
    },
    tokenAreaDay: {
      backgroundColor: '#14100b',
    },
    tokenAreaVote: {
      backgroundColor: '#130608',
    },
    executionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: arcane.surface.ledger,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: arcane.border.brass,
      paddingHorizontal: s(16),
      paddingVertical: s(10),
    },
    executionBannerContent: {
      flex: 1,
    },
    executionBannerLabel: {
      color: arcane.text.label,
      fontSize: s(11),
      fontWeight: '700',
    },
    executionBannerRole: {
      color: arcane.text.primary,
      fontSize: s(16),
      fontWeight: '700',
      marginTop: s(2),
    },
    executionBannerName: {
      color: arcane.text.muted,
      fontSize: s(12),
      marginTop: s(2),
    },
    executionBannerDismiss: {
      paddingHorizontal: s(12),
      paddingVertical: s(6),
    },
    executionBannerDismissText: {
      color: arcane.text.muted,
      fontSize: s(12),
    },

    /* ---- Execution candidate bar ---- */
    executionCandidateBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: arcane.surface.apparatus,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: arcane.action.blood,
      paddingHorizontal: s(16),
      paddingVertical: s(10),
      gap: s(10),
    },
    executionCandidateLabel: {
      color: arcane.action.bloodHighlight,
      fontSize: s(11),
      fontWeight: '700',
    },
    executionCandidateName: {
      color: arcane.text.strong,
      fontSize: s(15),
      fontWeight: '700',
      flex: 1,
    },
    executionCandidateVotes: {
      color: arcane.text.muted,
      fontSize: s(12),
    },

    /* ---- Execution confirmed bar ---- */
    executionConfirmedBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: arcane.surface.apparatus,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: arcane.border.brass,
      paddingHorizontal: s(16),
      paddingVertical: s(10),
      gap: s(10),
    },
    executionConfirmedLabel: {
      color: arcane.text.label,
      fontSize: s(11),
      fontWeight: '700',
    },
    executionConfirmedName: {
      color: arcane.text.strong,
      fontSize: s(15),
      fontWeight: '700',
      flex: 1,
    },
    executionConfirmedRole: {
      color: arcane.text.muted,
      fontSize: s(12),
    },

    /* ---- Night feedback overlay ---- */
    nightFloatingTimer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(10),
      backgroundColor: arcane.surface.apparatus,
      borderTopWidth: 1,
      borderColor: arcane.border.brassDim,
      paddingHorizontal: s(14),
      paddingVertical: s(6),
    },
    nightFloatingTimerRole: {
      color: arcane.accent.sapphireLens,
      fontSize: s(13),
      fontWeight: '700',
    },
    nightFloatingTimerTime: {
      color: arcane.text.strong,
      fontSize: s(14),
      fontWeight: '700',
      fontVariant: ['tabular-nums' as const],
    },
    nightFeedbackToggle: {
      backgroundColor: arcane.accent.midnightInk,
      paddingHorizontal: s(10),
      paddingVertical: s(4),
      borderRadius: s(6),
      borderWidth: 1,
      borderColor: arcane.accent.prussianBlue,
    },
    nightFeedbackToggleText: {
      color: arcane.accent.sapphireLens,
      fontSize: s(11),
      fontWeight: '600',
    },
    nightFeedbackSentBadge: {
      backgroundColor: arcane.surface.ledger,
      paddingHorizontal: s(10),
      paddingVertical: s(4),
      borderRadius: s(6),
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
    },
    nightFeedbackSentText: {
      color: arcane.text.label,
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
      backgroundColor: arcane.surface.apparatus,
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
      borderRadius: 6,
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
      borderRadius: 4,
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
      color: arcane.text.primary,
    },
    empathHintCount: {
      color: arcane.text.label,
      fontWeight: '700',
    },
    chefHintLabel: {
      color: '#b07f5c',
      fontWeight: '600',
    },
    chefHintNames: {
      color: arcane.text.primary,
    },
    chefHintCount: {
      color: arcane.text.label,
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

    /* ---- Memo modal ---- */
    memoOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(13,7,3,0.78)',
    },
    memoPanel: {
      backgroundColor: arcane.surface.apparatus,
      borderRadius: 4,
      padding: s(20),
      width: '85%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
    },
    memoTitle: {
      color: arcane.text.strong,
      fontSize: s(18),
      fontFamily: typography.fontFamily.display,
      marginBottom: s(12),
      textAlign: 'center',
    },
    memoInput: {
      backgroundColor: arcane.surface.base,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      borderRadius: 4,
      padding: s(12),
      color: arcane.text.primary,
      fontSize: s(14),
      fontFamily: typography.fontFamily.body,
      minHeight: s(100),
      textAlignVertical: 'top',
    },
    memoButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: s(10),
      marginTop: s(12),
    },
    memoClearButton: {
      backgroundColor: arcane.action.bloodPressed,
      paddingHorizontal: s(16),
      paddingVertical: s(10),
      borderRadius: 4,
      borderWidth: 1,
      borderColor: arcane.action.blood,
    },
    memoClearText: {
      color: arcane.action.bloodHighlight,
      fontSize: s(14),
      fontFamily: typography.fontFamily.bodyBold,
    },
    memoSaveButton: {
      backgroundColor: arcane.accent.midnightInk,
      paddingHorizontal: s(16),
      paddingVertical: s(10),
      borderRadius: 4,
      borderWidth: 1,
      borderColor: arcane.accent.prussianBlue,
    },
    memoSaveText: {
      color: arcane.accent.sapphireLens,
      fontSize: s(14),
      fontFamily: typography.fontFamily.bodyBold,
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
