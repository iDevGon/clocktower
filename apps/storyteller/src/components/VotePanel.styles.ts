import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  votePanel: {
    backgroundColor: '#1a1a1e',
    borderTopWidth: 1,
    borderColor: '#4a2a2a',
    padding: 16,
  },
  votePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  votePanelTitle: {
    color: '#c47070',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  votePanelInfo: {
    color: '#e0ddd8',
    fontSize: 14,
  },
  votePanelCount: {
    color: '#908e8a',
    fontSize: 13,
    marginBottom: 12,
  },
  closeVoteButton: {
    backgroundColor: '#943c3c',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeVoteText: {
    color: '#e0ddd8',
    fontSize: 15,
    fontWeight: '600',
  },
});
