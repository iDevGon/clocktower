import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: colors.arcane.surface.base,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    backgroundColor: colors.arcane.surface.apparatus,
  },
  title: {
    color: colors.arcane.text.strong,
    fontSize: 17,
    fontFamily: typography.fontFamily.display,
  },
  closeText: {
    color: colors.arcane.text.label,
    fontSize: 15,
    fontFamily: typography.fontFamily.bodyBold,
  },
  headerSpacer: {
    width: 40,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.arcane.surface.apparatus,
    borderRadius: 4,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
  },
  playerItemPressed: {
    backgroundColor: colors.arcane.surface.parchment,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: colors.arcane.action.bloodPressed,
    borderWidth: 1,
    borderColor: colors.arcane.action.blood,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: {
    color: colors.arcane.action.bloodHighlight,
    fontSize: 16,
    fontFamily: typography.fontFamily.bodyBold,
  },
  playerName: {
    color: colors.arcane.text.strong,
    fontSize: 16,
    fontFamily: typography.fontFamily.bodyMedium,
  },
  playerItemDisabled: {
    opacity: 0.45,
  },
  playerAvatarDisabled: {
    backgroundColor: colors.arcane.surface.ledger,
    borderColor: colors.arcane.border.parchment,
  },
  playerAvatarTextDisabled: {
    color: colors.arcane.text.dead,
  },
  playerNameDisabled: {
    color: colors.arcane.text.dead,
  },
  alreadyNominatedHint: {
    color: colors.arcane.text.muted,
    fontSize: 12,
    fontFamily: typography.fontFamily.body,
    marginLeft: 'auto',
  },
});
