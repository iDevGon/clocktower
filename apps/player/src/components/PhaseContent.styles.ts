import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const whisperStyles = StyleSheet.create({
  activePanel: {
    marginTop: 16,
    backgroundColor: colors.arcane.surface.ledger,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  activePanelTitle: {
    color: colors.arcane.text.label,
    fontSize: 12,
    fontFamily: typography.fontFamily.bodyBold,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  activePanelItem: {
    color: colors.arcane.text.primary,
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
    paddingVertical: 3,
  },
  countdownText: {
    color: colors.arcane.text.label,
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  countdownUrgent: {
    color: colors.arcane.action.bloodHighlight,
  },
  expiredTitle: {
    color: colors.arcane.text.dead,
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
    color: colors.arcane.text.primary,
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
  },
  playerRole: {
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
    fontWeight: '600',
  },
});

export const getPlayerRowOpacity = (isAlive: boolean) => ({
  opacity: isAlive ? 1 : 0.5,
});
