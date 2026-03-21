import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  containerDead: {
    backgroundColor: '#121214',
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#2e2e34',
  },
  headerDead: {
    borderColor: 'rgba(160,165,180,0.15)',
    backgroundColor: 'rgba(20,22,28,0.7)',
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
    color: '#7a7e88',
  },
  playerNameDead: {
    color: '#b0b4be',
  },
  deadSkull: {
    fontSize: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
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

  /* ── Dead (ghostly desaturated) overrides ── */
  feedbackHistoryButtonDead: {
    backgroundColor: '#1e1f24',
    borderColor: '#3a3b42',
  },
  feedbackHistoryCountDead: {
    color: '#6e7078',
  },
  subPhaseBadgeDead: {
    backgroundColor: '#28292e',
    borderColor: '#6a6c74',
  },
  subPhaseTextDead: {
    color: '#6a6c74',
  },
  nightTitleDead: {
    color: '#8a8e98',
  },
  dayTitleDead: {
    color: '#8a8e98',
  },
  whisperButtonDead: {
    backgroundColor: '#28292e',
    borderColor: '#6a6c74',
  },
  whisperButtonTextDead: {
    color: '#6a6c74',
  },
  whisperBadgeDead: {
    backgroundColor: '#6a6c74',
  },

  /* ── Chat unread badge ── */
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeAlive: {
    backgroundColor: '#c44',
  },
  unreadBadgeDead: {
    backgroundColor: '#6a6c74',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  /* ── Execution candidate card ── */
  executionCard: {
    backgroundColor: '#1a1a1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c4707060',
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  executionCardLabel: {
    color: '#908e8a',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 6,
  },
  executionCardName: {
    color: '#c47070',
    fontSize: 18,
    fontWeight: '700',
    textShadowColor: '#c4707040',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  executionCardVotes: {
    color: '#706e6a',
    fontSize: 12,
    marginTop: 4,
  },

  /* ── Slayer button ── */
  slayerContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  slayerButton: {
    backgroundColor: '#b85c5c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  slayerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  /* ── Settings modal ── */
  settingsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  settingsPanel: {
    backgroundColor: '#1e1e24',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#3a3a42',
  },
  settingsTitle: {
    color: '#e0ddd8',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsLabel: {
    color: '#e0ddd8',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsDesc: {
    color: '#706e6a',
    fontSize: 11,
    marginTop: 2,
  },
  settingsLeaveButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(200,80,80,0.25)',
  },
  settingsLeaveText: {
    color: '#c45050',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsCloseButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  settingsCloseText: {
    color: '#e0ddd8',
    fontSize: 14,
    fontWeight: '600',
  },

  /* ── Bottom navigation bar ── */
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#2e2e34',
    backgroundColor: '#18181c',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bottomNavDead: {
    borderColor: 'rgba(160,165,180,0.15)',
    backgroundColor: 'rgba(20,22,28,0.85)',
  },
  bottomNavItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  bottomNavIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  bottomNavLabel: {
    color: '#908e8a',
    fontSize: 10,
    fontWeight: '600',
  },
  bottomNavLabelDead: {
    color: '#6a6c74',
  },
});
