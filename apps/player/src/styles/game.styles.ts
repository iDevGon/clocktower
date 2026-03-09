import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  containerDead: {
    backgroundColor: '#140a0a',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  headerDead: {
    borderColor: 'rgba(139,20,20,0.4)',
    backgroundColor: 'rgba(30,8,8,0.6)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerLabel: {
    color: '#908e8a',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  playerName: {
    color: '#e0ddd8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  feedbackHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2030',
    borderWidth: 1,
    borderColor: '#3a3a50',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  feedbackHistoryIcon: {
    fontSize: 16,
  },
  feedbackHistoryCount: {
    color: '#8090c0',
    fontSize: 12,
    fontWeight: '700',
  },
  playerLabelDead: {
    color: '#8b3030',
  },
  playerNameDead: {
    color: '#c08080',
  },
  deadSkull: {
    fontSize: 28,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingVertical: 24,
    gap: 24,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subPhaseBadge: {
    backgroundColor: '#302820',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#c4a050',
  },
  subPhaseText: {
    color: '#c4a050',
    fontSize: 12,
    fontWeight: '600',
  },
  phaseContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  phaseContentLarge: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  setupTitle: {
    color: '#5c5a58',
    fontSize: 18,
  },
  setupSubtitle: {
    color: '#464446',
    fontSize: 14,
    marginTop: 8,
  },
  nightTitle: {
    color: '#8090c0',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dayTitle: {
    color: '#c4a050',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  phaseDescription: {
    color: '#908e8a',
    textAlign: 'center',
    lineHeight: 22,
  },
  phaseDescriptionSub: {
    color: '#706e6a',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 12,
  },
  endedTitle: {
    color: '#b85c5c',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  whisperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a3d2a',
    borderWidth: 1,
    borderColor: '#6a8a6a',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
    gap: 8,
  },
  whisperButtonText: {
    color: '#6a8a6a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  whisperBadge: {
    backgroundColor: '#6a8a6a',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  whisperBadgeText: {
    color: '#121214',
    fontSize: 11,
    fontWeight: 'bold',
  },
  nominateButton: {
    backgroundColor: '#3a2020',
    borderWidth: 1,
    borderColor: '#943c3c',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 20,
  },
  nominateButtonText: {
    color: '#c47070',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nominatedBadge: {
    backgroundColor: '#242428',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  nominatedText: {
    color: '#706e6a',
    fontSize: 14,
  },
});
