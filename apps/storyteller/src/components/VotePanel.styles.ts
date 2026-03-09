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
      color: '#e05050',
      backgroundColor: '#2a1414',
    },
    votedInnocent: {
      color: '#7070c4',
      backgroundColor: '#14142a',
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
  });
}
export const styles = createVotePanelStyles(1);
