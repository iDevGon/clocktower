import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    backgroundColor: '#161618',
    paddingVertical: 6,
  },
  title: {
    color: '#6ab04c',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  list: {
    paddingHorizontal: 12,
    gap: 8,
  },
  item: {
    backgroundColor: '#1a2618',
    borderWidth: 1,
    borderColor: '#2a3a22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 140,
  },
  itemSent: {
    borderColor: '#6a50b0',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionRole: {
    color: '#8090c0',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionPlayer: {
    color: '#908e8a',
    fontSize: 11,
  },
  actionArrow: {
    color: '#5c5a58',
    fontSize: 11,
  },
  actionTarget: {
    color: '#c4a050',
    fontSize: 11,
    fontWeight: '600',
  },
  sentBadge: {
    color: '#8070b0',
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Feedback panel (for passive roles)
  feedbackPanel: {
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    backgroundColor: '#161618',
    padding: 12,
  },
  feedbackPanelTitle: {
    color: '#8090c0',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  feedbackPanelSent: {
    color: '#8070b0',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Composer shared
  composerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  composerVertical: {
    marginTop: 8,
    gap: 6,
  },
  composerLabel: {
    color: '#706e6a',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  composerChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  // Number
  numberButton: {
    backgroundColor: '#1e2038',
    borderWidth: 1,
    borderColor: '#3a3a52',
    borderRadius: 8,
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#d0c8f0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Yes/No
  yesNoButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  noText: {
    color: '#b85c5c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Chips
  chip: {
    backgroundColor: '#1a1a1e',
    borderWidth: 1,
    borderColor: '#2e2e34',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipSelected: {
    borderColor: '#8090c0',
    backgroundColor: '#1e2038',
  },
  chipText: {
    color: '#706e6a',
    fontSize: 11,
  },
  chipTextSelected: {
    color: '#8090c0',
    fontWeight: 'bold',
  },
  // Send
  sendButton: {
    backgroundColor: '#6a50b0',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#2e2e34',
  },
  sendText: {
    color: '#e0ddd8',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
