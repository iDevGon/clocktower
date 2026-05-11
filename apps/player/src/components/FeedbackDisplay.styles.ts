import { StyleSheet } from 'react-native';

/** Inline styles (used inside NightActionPrompt -- full-size display) */
export const inlineStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#1e1a30',
    borderWidth: 1,
    borderColor: '#6a50b0',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  label: {
    color: '#8070b0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  number: {
    color: '#d0c8f0',
    fontSize: 48,
    fontWeight: 'bold',
  },
  big: {
    color: '#d0c8f0',
    fontSize: 28,
    fontWeight: 'bold',
  },
});

/** Compact styles (used inside FeedbackHistoryModal) */
export const compactStyles = StyleSheet.create({
  banner: {
    backgroundColor: '#1e1a30',
    borderWidth: 1,
    borderColor: '#3a3452',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  label: {
    color: '#8070b0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  number: {
    color: '#d0c8f0',
    fontSize: 36,
    fontWeight: 'bold',
  },
  big: {
    color: '#d0c8f0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  grimoireTitle: {
    color: '#8070b0',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

/** Styles shared between both modes */
export const sharedStyles = StyleSheet.create({
  yesVariant: {
    borderColor: '#4a7a3a',
    backgroundColor: '#1a2618',
  },
  noVariant: {
    borderColor: '#943c3c',
    backgroundColor: '#261a1a',
  },
  playersText: {
    color: '#b8b6b2',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 4,
  },
  roleText: {
    color: '#b8b6b2',
    fontSize: 16,
    textAlign: 'center',
  },
  highlight: {
    color: '#d0c8f0',
    fontWeight: 'bold',
  },
  grimoireList: {
    width: '100%',
    gap: 6,
  },
  grimoireRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16141e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  grimoireRowDead: {
    backgroundColor: '#1a1218',
    opacity: 0.7,
  },
  grimoireNameCol: {
    flex: 1,
    marginRight: 8,
  },
  grimoireNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  grimoireDeadIcon: {
    fontSize: 12,
  },
  grimoireName: {
    color: '#e0ddd8',
    fontSize: 14,
  },
  grimoireNameDead: {
    color: '#8a7070',
    textDecorationLine: 'line-through',
  },
  grimoireStatusRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 3,
  },
  grimoireStatus: {
    fontSize: 10,
    color: '#c48850',
    fontWeight: '600',
    backgroundColor: 'rgba(196,136,80,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  grimoireRole: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  targetNamesText: {
    color: '#d0c8f0',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 4,
  },
  savantPair: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  savantRow: {
    backgroundColor: '#16141e',
    borderWidth: 1,
    borderColor: '#3a3452',
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  savantTag: {
    color: '#8070b0',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  savantText: {
    color: '#e0ddd8',
    fontSize: 14,
    lineHeight: 20,
  },
  savantHint: {
    color: '#8a8a8a',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
