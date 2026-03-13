import { StyleSheet } from 'react-native';

export function createVotePanelStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    votePanel: {
      backgroundColor: '#1a1a1e',
      borderTopWidth: 1,
      borderColor: '#4a2a2a',
      padding: s(16),
    },
    votePanelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: s(8),
    },
    votePanelTitle: {
      color: '#c47070',
      fontSize: s(14),
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    votePanelInfo: {
      color: '#e0ddd8',
      fontSize: s(14),
    },
    votePanelCount: {
      color: '#908e8a',
      fontSize: s(13),
      fontVariant: ['tabular-nums'] as const,
      marginBottom: s(12),
    },
    voterList: {
      gap: s(8),
      paddingBottom: s(12),
    },
    voterItem: {
      alignItems: 'center',
      gap: s(4),
      minWidth: s(56),
      paddingVertical: s(4),
      paddingHorizontal: s(4),
      borderRadius: s(6),
    },
    voterName: {
      color: '#e0ddd8',
      fontSize: s(11),
      fontWeight: '600',
    },
    voterNameDead: {
      color: '#5c5a58',
    },
    voteButtons: {
      flexDirection: 'row',
      gap: s(4),
    },
    guiltyButton: {
      backgroundColor: '#3a1a1a',
      borderWidth: 1,
      borderColor: '#943c3c',
      borderRadius: 4,
      paddingHorizontal: s(8),
      paddingVertical: s(4),
    },
    guiltyText: {
      color: '#e05050',
      fontSize: s(11),
      fontWeight: '700',
    },
    innocentButton: {
      backgroundColor: '#1a1a2e',
      borderWidth: 1,
      borderColor: '#3a3a6a',
      borderRadius: 4,
      paddingHorizontal: s(8),
      paddingVertical: s(4),
    },
    innocentText: {
      color: '#7070c4',
      fontSize: s(11),
      fontWeight: '700',
    },
    votedBadge: {
      fontSize: s(11),
      fontWeight: '700',
      paddingHorizontal: s(6),
      paddingVertical: s(3),
      borderRadius: 4,
      overflow: 'hidden',
    },
    votedGuilty: {
      color: '#ffffff',
      backgroundColor: '#e05050',
    },
    votedInnocent: {
      color: '#ffffff',
      backgroundColor: '#5090e0',
    },
    preselectedGuilty: {
      color: '#e05050',
      backgroundColor: '#e0505025',
      fontStyle: 'italic',
    },
    preselectedInnocent: {
      color: '#5090e0',
      backgroundColor: '#5090e025',
      fontStyle: 'italic',
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(10),
      backgroundColor: '#12121a',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#2a2a36',
      paddingVertical: s(8),
      paddingHorizontal: s(14),
      marginBottom: s(12),
    },
    timerText: {
      color: '#c0c8e0',
      fontSize: s(16),
      fontWeight: '800',
      fontVariant: ['tabular-nums'] as const,
    },
    timerUrgent: {
      color: '#e74c3c',
    },
    countdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#12121a',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#4a3a2a',
      paddingVertical: s(10),
      paddingHorizontal: s(14),
      marginBottom: s(12),
    },
    countdownText: {
      color: '#c4a050',
      fontSize: s(14),
      fontWeight: '700',
      fontVariant: ['tabular-nums'] as const,
    },
    closeVoteButton: {
      backgroundColor: '#943c3c',
      borderRadius: 8,
      paddingVertical: s(10),
      alignItems: 'center',
    },
    closeVoteText: {
      color: '#e0ddd8',
      fontSize: s(15),
      fontWeight: '600',
    },
    resultBanner: {
      backgroundColor: '#12121a',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#2a2a36',
      padding: s(14),
      alignItems: 'center',
      gap: s(6),
    },
    resultVerdict: {
      fontSize: s(16),
      fontWeight: '800',
    },
    resultVerdictGuilty: {
      color: '#c47070',
    },
    resultVerdictInnocent: {
      color: '#6a9a6a',
    },
    resultCount: {
      color: '#908e8a',
      fontSize: s(12),
      fontVariant: ['tabular-nums'] as const,
    },
    resultThreshold: {
      color: '#706e6a',
      fontSize: s(10),
      marginTop: s(2),
    },
    resultThresholdHighlight: {
      color: '#a0967a',
      fontWeight: '600' as const,
    },
    resultSentence: {
      fontSize: s(14),
      fontWeight: '700',
      marginTop: s(4),
    },
    resultSentenceGuilty: {
      color: '#c47070',
    },
    resultSentenceInnocent: {
      color: '#6a9a6a',
    },
    resultDismiss: {
      backgroundColor: '#2a2a36',
      borderRadius: 6,
      paddingVertical: s(8),
      paddingHorizontal: s(24),
      marginTop: s(8),
    },
    resultDismissText: {
      color: '#e0ddd8',
      fontSize: s(13),
      fontWeight: '600',
    },
  });
}
export const styles = createVotePanelStyles(1);
