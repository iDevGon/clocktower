import { Dimensions, StyleSheet } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT * 0.15,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  // Slayer Easter Egg styles (golden/amber)
  slayerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  slayerLabel: {
    fontSize: 16,
    letterSpacing: 16,
    color: '#ffd700',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  slayerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffe066',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 16,
  },
  slayerSubtitle: {
    fontSize: 15,
    color: '#c0a030',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  slayerDefeatTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#b8860b',
    textAlign: 'center',
    marginBottom: 8,
  },
  slayerDefeatSubtitle: {
    fontSize: 15,
    color: '#8a6a20',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonSlayer: {
    fontSize: 13,
    color: '#a08030',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },

  // Victory styles (blue)
  victoryLabel: {
    fontSize: 14,
    letterSpacing: 12,
    color: '#4da6ff',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  victoryTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e0eeff',
    textAlign: 'center',
    marginBottom: 8,
  },
  victorySubtitle: {
    fontSize: 15,
    color: '#6aa0d0',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonVictory: {
    fontSize: 13,
    color: '#5080a0',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },

  // Defeat styles
  defeatLabel: {
    fontSize: 14,
    letterSpacing: 12,
    color: '#8b0000',
    fontWeight: '300',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  defeatTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#cc2020',
    textAlign: 'center',
    marginBottom: 8,
  },
  defeatSubtitle: {
    fontSize: 15,
    color: '#7a2020',
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 24,
  },
  reasonDefeat: {
    fontSize: 13,
    color: '#6a3030',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 24,
  },

  // Common
  divider: {
    width: 60,
    height: 1,
    marginBottom: 24,
  },
  playerListHeader: {
    marginBottom: 12,
  },
  playerListTitle: {
    fontSize: 12,
    letterSpacing: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  playerNameCol: {
    flex: 1,
  },
  playerName: {
    color: '#d0ccc6',
    fontSize: 14,
    fontWeight: '500',
  },
  playerRoleCol: {
    alignItems: 'flex-end',
  },
  playerRole: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerTeam: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  dismissHint: {
    marginTop: 28,
    fontSize: 12,
    letterSpacing: 1,
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 60,
  },
});
