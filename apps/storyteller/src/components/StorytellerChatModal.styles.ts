import { colors, createChatStyles, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const chatStyles = createChatStyles('storyteller');

export const styles = StyleSheet.create({
  ...chatStyles,
  modalContainer: {
    flex: 1,
    backgroundColor: colors.arcane.surface.base,
    paddingTop: 48,
  },
  backText: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 14,
    fontFamily: typography.fontFamily.bodyBold,
  },
  // Player list
  playerList: {
    flex: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    borderRadius: 4,
    backgroundColor: colors.arcane.surface.apparatus,
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    color: colors.arcane.text.strong,
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  playerNameDead: {
    color: colors.arcane.text.dead,
  },
  deadBadge: {
    color: colors.arcane.action.bloodHighlight,
    fontSize: 11,
    fontFamily: typography.fontFamily.bodyBold,
  },
  roleBadge: {
    color: colors.arcane.text.label,
    fontSize: 11,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  lastMessage: {
    color: colors.arcane.text.muted,
    fontSize: 13,
    marginTop: 4,
    fontFamily: typography.fontFamily.body,
  },
  unreadBadge: {
    backgroundColor: colors.arcane.action.blood,
    borderRadius: 6,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.arcane.text.strong,
    fontSize: 11,
    fontFamily: typography.fontFamily.bodyBold,
  },
  // Chat view overrides (sender label uses greenish tint for player names)
  senderLabel: {
    ...chatStyles.senderLabel,
    color: colors.arcane.text.label,
  },
  messageBubbleOther: {
    ...chatStyles.messageBubbleOther,
    borderColor: colors.arcane.border.parchment,
  },
});
