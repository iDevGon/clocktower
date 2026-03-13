import { StyleSheet } from 'react-native';

export const whisperStyles = StyleSheet.create({
  activePanel: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  activePanelTitle: {
    color: '#8a8a8a',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  activePanelItem: {
    color: '#e0ddd8',
    fontSize: 14,
    paddingVertical: 3,
  },
});

export const endedStyles = StyleSheet.create({
  playerListContainer: {
    marginTop: 16,
    width: '100%',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  playerName: {
    color: '#e0ddd8',
    fontSize: 14,
  },
  playerRole: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export const getPlayerRowOpacity = (isAlive: boolean) => ({
  opacity: isAlive ? 1 : 0.5,
});
