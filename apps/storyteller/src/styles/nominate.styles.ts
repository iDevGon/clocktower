import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const arcane = colors.arcane;

export function createNominateStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: arcane.surface.base,
    },
    header: {
      paddingHorizontal: s(16),
      paddingVertical: s(16),
      borderBottomWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
    },
    instruction: {
      color: arcane.text.label,
      fontSize: s(14),
      fontFamily: typography.fontFamily.bodyBold,
      marginBottom: s(4),
    },
    selectionRow: {
      flexDirection: 'row',
      gap: s(12),
      marginTop: s(8),
    },
    selectionBox: {
      flex: 1,
      backgroundColor: arcane.surface.ledger,
      borderRadius: 4,
      padding: s(12),
      borderWidth: 1,
      borderColor: arcane.border.parchment,
    },
    selectionLabel: {
      color: arcane.text.dead,
      fontSize: s(12),
      fontFamily: typography.fontFamily.bodyMedium,
      marginBottom: s(4),
    },
    selectionValue: {
      color: arcane.text.strong,
      fontSize: s(16),
      fontFamily: typography.fontFamily.bodyBold,
    },
    listContainer: {
      flex: 1,
    },
    footer: {
      padding: s(16),
      borderTopWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
    },
    submitButton: {
      paddingVertical: s(16),
      borderRadius: 4,
      alignItems: 'center',
      borderWidth: 1,
    },
    submitButtonActive: {
      backgroundColor: arcane.action.blood,
      borderColor: arcane.action.bloodHighlight,
    },
    submitButtonPressed: {
      backgroundColor: arcane.action.bloodPressed,
    },
    submitButtonDisabled: {
      backgroundColor: arcane.surface.ledger,
      borderColor: arcane.border.parchment,
    },
    submitButtonText: {
      color: arcane.text.strong,
      fontSize: s(18),
      fontFamily: typography.fontFamily.bodyBold,
    },
  });
}

export const styles = createNominateStyles(1);
