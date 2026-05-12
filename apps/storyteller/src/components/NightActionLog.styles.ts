import { StyleSheet } from 'react-native';

export function createNightActionLogStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      borderTopWidth: 1,
      borderColor: '#2e2e34',
      backgroundColor: '#161618',
      paddingVertical: s(6),
    },
    title: {
      color: '#6ab04c',
      fontSize: s(12),
      fontWeight: '600',
      paddingHorizontal: s(16),
      marginBottom: s(4),
    },
    list: {
      paddingHorizontal: s(12),
      gap: s(8),
    },
    item: {
      backgroundColor: '#1a2618',
      borderWidth: 1,
      borderColor: '#2a3a22',
      borderRadius: 4,
      paddingHorizontal: s(10),
      paddingVertical: s(6),
      minWidth: s(140),
    },
    itemSent: {
      borderColor: '#6a50b0',
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
    },
    actionRole: {
      color: '#8090c0',
      fontSize: s(11),
      fontWeight: 'bold',
    },
    actionPlayer: {
      color: '#908e8a',
      fontSize: s(11),
    },
    actionArrow: {
      color: '#5c5a58',
      fontSize: s(11),
    },
    actionTarget: {
      color: '#a68a64',
      fontSize: s(11),
      fontWeight: '600',
    },
    sentBadge: {
      color: '#8070b0',
      fontSize: s(9),
      fontWeight: '600',
      marginLeft: s(4),
    },
    killRow: {
      flexDirection: 'row',
      gap: s(6),
      marginTop: s(6),
    },
    targetActionGroup: {
      gap: s(6),
    },
    bmrWarningBadge: {
      borderWidth: 1,
      borderColor: 'rgba(209, 170, 105, 0.45)',
      backgroundColor: 'rgba(209, 170, 105, 0.12)',
      borderRadius: s(6),
      paddingHorizontal: s(8),
      paddingVertical: s(5),
    },
    bmrWarningBypass: {
      borderColor: 'rgba(184, 92, 92, 0.5)',
      backgroundColor: 'rgba(184, 92, 92, 0.12)',
    },
    bmrWarningText: {
      color: '#e0ddd8',
      fontSize: s(11),
      lineHeight: s(15),
    },
    killButton: {
      backgroundColor: '#3a1a1a',
      borderWidth: 1,
      borderColor: '#943c3c',
      borderRadius: 6,
      paddingHorizontal: s(10),
      paddingVertical: s(4),
    },
    killButtonDone: {
      backgroundColor: '#1e1a1a',
      borderColor: '#3a3a34',
    },
    killText: {
      color: '#e05050',
      fontSize: s(11),
      fontWeight: '700',
    },
    killTextDone: {
      color: '#5c5a58',
    },
    protectedBadge: {
      backgroundColor: '#1a2e1a',
      borderWidth: 1,
      borderColor: '#2ecc71',
      borderRadius: 6,
      paddingHorizontal: s(10),
      paddingVertical: s(4),
    },
    protectedText: {
      color: '#2ecc71',
      fontSize: s(11),
      fontWeight: '700',
    },
    // Feedback panel (for passive roles)
    feedbackPanel: {
      borderTopWidth: 1,
      borderColor: '#2e2e34',
      backgroundColor: '#161618',
      padding: s(12),
    },
    feedbackPanelTitle: {
      color: '#8090c0',
      fontSize: s(13),
      fontWeight: '600',
      marginBottom: s(8),
    },
    feedbackPanelSent: {
      color: '#8070b0',
      fontSize: s(13),
      fontWeight: '600',
      textAlign: 'center',
    },
    // Composer shared
    composerRow: {
      flexDirection: 'row',
      gap: s(8),
      marginTop: s(8),
    },
    composerVertical: {
      marginTop: s(8),
      gap: s(6),
    },
    composerLabel: {
      color: '#706e6a',
      fontSize: s(10),
      textTransform: 'uppercase',
      letterSpacing: s(1),
    },
    composerChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: s(4),
    },
    // Number
    numberButton: {
      backgroundColor: '#1e2038',
      borderWidth: 1,
      borderColor: '#3a3a52',
      borderRadius: 4,
      width: s(40),
      height: s(36),
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberButtonSuggested: {
      backgroundColor: '#2a3560',
      borderColor: '#5dade2',
      borderWidth: 2,
    },
    numberButtonDimmed: {
      backgroundColor: '#14151e',
      borderColor: '#2a2a36',
      opacity: 0.5,
    },
    numberText: {
      color: '#d0c8f0',
      fontSize: s(18),
      fontWeight: 'bold',
    },
    numberTextSuggested: {
      color: '#5dade2',
    },
    numberTextDimmed: {
      color: '#5c5a68',
    },
    // Yes/No
    yesNoButton: {
      flex: 1,
      borderRadius: 4,
      borderWidth: 1,
      paddingVertical: s(8),
      alignItems: 'center',
    },
    yesButton: {
      backgroundColor: '#1a2618',
      borderColor: '#4a7a3a',
    },
    noButton: {
      backgroundColor: '#261a1a',
      borderColor: '#943c3c',
    },
    yesText: {
      color: '#6ab04c',
      fontSize: s(14),
      fontWeight: 'bold',
    },
    noText: {
      color: '#b85c5c',
      fontSize: s(14),
      fontWeight: 'bold',
    },
    // Search
    searchInput: {
      backgroundColor: '#1a1a1e',
      borderWidth: 1,
      borderColor: '#2e2e34',
      borderRadius: 6,
      paddingHorizontal: s(8),
      paddingVertical: s(4),
      color: '#e0ddd8',
      fontSize: s(11),
    },
    searchInputFocused: {
      borderColor: '#8090c0',
    },
    // Chips
    chip: {
      backgroundColor: '#1a1a1e',
      borderWidth: 1,
      borderColor: '#2e2e34',
      borderRadius: 6,
      paddingHorizontal: s(8),
      paddingVertical: s(4),
    },
    chipSelected: {
      borderColor: '#8090c0',
      backgroundColor: '#1e2038',
    },
    chipHinted: {
      borderColor: '#5a6a40',
      backgroundColor: '#1a2218',
    },
    chipText: {
      color: '#706e6a',
      fontSize: s(11),
    },
    chipTextSelected: {
      color: '#8090c0',
      fontWeight: 'bold',
    },
    chipTextHinted: {
      color: '#a0b880',
    },
    // Send
    sendButton: {
      backgroundColor: '#6a50b0',
      borderRadius: 6,
      paddingVertical: s(8),
      alignItems: 'center',
      marginTop: s(4),
    },
    sendButtonDisabled: {
      backgroundColor: '#2e2e34',
    },
    sendText: {
      color: '#e0ddd8',
      fontSize: s(12),
      fontWeight: 'bold',
    },
    // Drunk warning
    drunkBanner: {
      backgroundColor: '#2a2118',
      borderWidth: 1,
      borderColor: '#b07f5c',
      borderRadius: 4,
      padding: s(10),
      marginBottom: s(8),
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
    },
    drunkBannerText: {
      color: '#b07f5c',
      fontSize: s(12),
      fontWeight: '700',
      flex: 1,
    },
    drunkComposerOverlay: {
      opacity: 0.5,
    },
    drunkModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: s(24),
    },
    drunkModalContent: {
      backgroundColor: '#1a1a2e',
      borderWidth: 1,
      borderColor: '#b07f5c',
      borderRadius: 6,
      padding: s(20),
      maxWidth: 400,
      width: '100%',
    },
    drunkModalTitle: {
      color: '#b07f5c',
      fontSize: s(15),
      fontWeight: '700',
      marginBottom: s(12),
      textAlign: 'center',
    },
    drunkModalMessage: {
      color: '#c0beb8',
      fontSize: s(12),
      lineHeight: s(18),
      textAlign: 'center',
      marginBottom: s(16),
    },
    drunkModalButtons: {
      flexDirection: 'row',
      gap: s(10),
    },
    drunkModalCancel: {
      flex: 1,
      backgroundColor: '#2e2e34',
      borderRadius: 4,
      paddingVertical: s(10),
      alignItems: 'center',
    },
    drunkModalCancelText: {
      color: '#908e8a',
      fontSize: s(13),
      fontWeight: '600',
    },
    drunkModalConfirm: {
      flex: 1,
      backgroundColor: '#8e7758',
      borderRadius: 4,
      paddingVertical: s(10),
      alignItems: 'center',
    },
    drunkModalConfirmText: {
      color: '#120d09',
      fontSize: s(13),
      fontWeight: '700',
    },
  });
}

export const styles = createNightActionLogStyles(1);
