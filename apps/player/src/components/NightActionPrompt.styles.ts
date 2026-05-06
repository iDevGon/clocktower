import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  roleName: {
    color: colors.arcane.accent.sapphireLens,
    fontFamily: typography.fontFamily.display,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instruction: {
    color: colors.arcane.text.primary,
    fontSize: 14,
    fontFamily: typography.fontFamily.body,
    marginBottom: 16,
    textAlign: 'center',
  },
  playerScroll: {
    width: '100%',
    maxHeight: 300,
  },
  playerList: {
    gap: 8,
    paddingRight: 4,
  },
  playerItem: {
    backgroundColor: colors.arcane.surface.ledger,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  playerItemSelected: {
    backgroundColor: colors.arcane.accent.midnightInk,
    borderColor: colors.arcane.accent.sapphireLens,
  },
  playerName: {
    color: colors.arcane.text.muted,
    fontSize: 16,
    fontFamily: typography.fontFamily.body,
  },
  playerNameSelected: {
    color: colors.arcane.accent.sapphireLens,
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: colors.arcane.accent.midnightInk,
    borderWidth: 1,
    borderColor: colors.arcane.accent.sapphireLens,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 48,
  },
  submitButtonDisabled: {
    backgroundColor: colors.arcane.surface.apparatus,
    borderColor: colors.arcane.border.brassDim,
  },
  submitText: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 16,
    fontFamily: typography.fontFamily.bodyBold,
    fontWeight: 'bold',
  },
  submitTextDisabled: {
    color: colors.arcane.text.dead,
  },
  // Done / Passive
  doneBanner: {
    backgroundColor: colors.arcane.surface.ledger,
    borderWidth: 1,
    borderColor: colors.arcane.border.brass,
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneText: {
    color: colors.arcane.text.label,
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneSubtext: {
    color: colors.arcane.text.muted,
    fontSize: 13,
    marginTop: 4,
  },
  passiveBanner: {
    backgroundColor: colors.arcane.accent.midnightInk,
    borderWidth: 1,
    borderColor: colors.arcane.accent.prussianBlue,
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  passiveText: {
    color: colors.arcane.accent.sapphireLens,
    fontSize: 15,
    textAlign: 'center',
  },
});
