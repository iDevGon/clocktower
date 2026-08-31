import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  title: {
    color: colors.arcane.accent.sapphireLens,
    fontFamily: typography.fontFamily.display,
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instruction: {
    color: colors.arcane.text.primary,
    fontFamily: typography.fontFamily.body,
    fontSize: 14,
    textAlign: 'center',
  },
  selector: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colors.arcane.surface.ledger,
    borderWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    borderRadius: 6,
    paddingHorizontal: 16,
  },
  selectorDisabled: {
    opacity: 0.55,
  },
  selectorLabel: {
    color: colors.arcane.text.label,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 12,
    marginBottom: 3,
  },
  selectorValue: {
    color: colors.arcane.text.primary,
    fontFamily: typography.fontFamily.body,
    fontSize: 16,
  },
  selectorPlaceholder: {
    color: colors.arcane.text.muted,
  },
  message: {
    color: colors.arcane.text.label,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  error: {
    color: colors.arcane.action.bloodHighlight,
    fontFamily: typography.fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  submitButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.arcane.accent.midnightInk,
    borderWidth: 1,
    borderColor: colors.arcane.accent.sapphireLens,
    borderRadius: 6,
    paddingHorizontal: 24,
  },
  submitButtonDisabled: {
    backgroundColor: colors.arcane.surface.apparatus,
    borderColor: colors.arcane.border.brassDim,
  },
  submitText: {
    color: colors.arcane.accent.sapphireLens,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 16,
  },
  submitTextDisabled: {
    color: colors.arcane.text.dead,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(13,7,3,0.82)',
  },
  pickerPanel: {
    maxHeight: '80%',
    backgroundColor: colors.arcane.surface.apparatus,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderTopWidth: 1,
    borderColor: colors.arcane.border.brassDim,
    padding: 18,
  },
  pickerTitle: {
    color: colors.arcane.text.strong,
    fontFamily: typography.fontFamily.display,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  pickerScroll: {
    maxHeight: 420,
  },
  pickerContent: {
    gap: 8,
    paddingBottom: 8,
  },
  pickerRow: {
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colors.arcane.surface.base,
    borderWidth: 1,
    borderColor: colors.arcane.border.parchment,
    borderRadius: 4,
    paddingHorizontal: 14,
  },
  pickerRowText: {
    color: colors.arcane.text.primary,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 15,
  },
  pickerClose: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: colors.arcane.surface.ledger,
    borderRadius: 6,
  },
  pickerCloseText: {
    color: colors.arcane.text.primary,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 15,
  },
});
