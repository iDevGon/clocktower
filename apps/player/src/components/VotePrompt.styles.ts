import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a2a2a',
    padding: 20,
  },
  label: {
    color: '#c47070',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  nominationInfo: {
    color: '#b8b6b2',
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  playerNameHighlight: {
    color: '#e0ddd8',
    fontWeight: 'bold',
  },
  description: {
    color: '#908e8a',
    fontSize: 14,
    marginBottom: 16,
  },
  votedContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  votedText: {
    color: '#6a9a6a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  votedSubtext: {
    color: '#908e8a',
    fontSize: 13,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  guiltyButton: {
    flex: 1,
    backgroundColor: '#2a1818',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#943c3c',
  },
  guiltyButtonPressed: {
    backgroundColor: '#3a2020',
  },
  guiltyText: {
    color: '#c47070',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  innocentButton: {
    flex: 1,
    backgroundColor: '#242428',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a42',
  },
  innocentButtonPressed: {
    backgroundColor: '#2e2e34',
  },
  innocentText: {
    color: '#b8b6b2',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
