import { StyleSheet } from 'react-native';
import { VOTE_STATE_BADGE } from './votePresentation';

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
      gap: s(6),
      minWidth: s(62),
      paddingVertical: s(4),
      paddingHorizontal: s(4),
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
      backgroundColor: VOTE_STATE_BADGE.raised.backgroundColor,
      borderWidth: 1,
      borderColor: VOTE_STATE_BADGE.raised.borderColor,
      paddingHorizontal: s(4),
      paddingVertical: s(3),
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: s(VOTE_STATE_BADGE.minWidth),
      minHeight: s(34),
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
      paddingHorizontal: s(8),
      paddingVertical: s(5),
      overflow: 'hidden',
      minWidth: s(VOTE_STATE_BADGE.minWidth),
      minHeight: s(26),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: VOTE_STATE_BADGE.down.borderColor,
      backgroundColor: VOTE_STATE_BADGE.down.backgroundColor,
    },
    emptyVoteText: {
      color: VOTE_STATE_BADGE.down.color,
      fontSize: s(11),
      fontWeight: '900',
    },
    votedGuilty: {
      backgroundColor: VOTE_STATE_BADGE.raised.backgroundColor,
      borderColor: VOTE_STATE_BADGE.raised.borderColor,
    },
    votedInnocent: {
      backgroundColor: '#5090e0',
    },
    preselectedGuilty: {
      backgroundColor: VOTE_STATE_BADGE.pending.backgroundColor,
      borderWidth: 1,
      borderColor: VOTE_STATE_BADGE.pending.borderColor,
    },
    preselectedInnocent: {
      backgroundColor: '#5090e025',
      borderWidth: 1,
      borderColor: '#5090e060',
    },
    voteStateBadge: {
      paddingHorizontal: s(4),
      paddingVertical: s(3),
      minWidth: s(VOTE_STATE_BADGE.minWidth),
      minHeight: s(34),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: VOTE_STATE_BADGE.down.borderColor,
      backgroundColor: VOTE_STATE_BADGE.down.backgroundColor,
    },
    voteStateRaised: {
      backgroundColor: VOTE_STATE_BADGE.raised.backgroundColor,
      borderColor: VOTE_STATE_BADGE.raised.borderColor,
    },
    voteStatePending: {
      backgroundColor: VOTE_STATE_BADGE.pending.backgroundColor,
      borderColor: VOTE_STATE_BADGE.pending.borderColor,
    },
    voteStateDown: {
      backgroundColor: VOTE_STATE_BADGE.down.backgroundColor,
      borderColor: VOTE_STATE_BADGE.down.borderColor,
    },
    voteStateText: {
      color: VOTE_STATE_BADGE.down.color,
      fontSize: s(11),
      fontWeight: '900',
    },
    voteStateRaisedText: {
      color: VOTE_STATE_BADGE.raised.color,
    },
    voteStatePendingText: {
      color: VOTE_STATE_BADGE.pending.color,
    },
    voteStateImage: {
      width: s(VOTE_STATE_BADGE.iconSize),
      height: s(VOTE_STATE_BADGE.iconSize),
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
    defenseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#12121a',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#4a3a2a',
      paddingVertical: s(10),
      paddingHorizontal: s(14),
      marginBottom: s(12),
    },
    consentBadge: {
      backgroundColor: '#1a1a24',
      borderRadius: 4,
      paddingVertical: s(4),
      paddingHorizontal: s(8),
      alignItems: 'flex-end' as const,
      gap: s(2),
    },
    consentBadgeText: {
      color: '#909098',
      fontSize: s(12),
      fontWeight: '600',
    },
    consentBadgeReady: {
      backgroundColor: '#1a2e1a',
      borderWidth: 1,
      borderColor: '#2e4a2e',
    },
    consentBadgeTextReady: {
      color: '#7dce82',
    },
    countdownText: {
      color: '#a68a64',
      fontSize: s(14),
      fontWeight: '700',
      fontVariant: ['tabular-nums'] as const,
    },
    closeVoteButton: {
      backgroundColor: '#943c3c',
      borderRadius: 4,
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
      borderRadius: 4,
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
    resultSentenceCleared: {
      color: '#a68a64',
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
