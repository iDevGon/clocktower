import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const arcane = colors.arcane;

export function createDrunkFakeRoleModalStyles(s: (v: number) => number) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(13, 7, 3, 0.78)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: arcane.surface.apparatus,
      borderRadius: 4,
      width: '90%',
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: 1,
      borderBottomColor: arcane.border.brassDim,
    },
    headerTitle: {
      color: arcane.text.label,
      fontSize: s(18),
      fontFamily: typography.fontFamily.display,
      textAlign: 'center',
      marginBottom: s(4),
    },
    headerDesc: {
      color: arcane.text.muted,
      fontSize: s(13),
      fontFamily: typography.fontFamily.body,
      textAlign: 'center',
    },
    searchInput: {
      marginHorizontal: s(12),
      marginTop: s(8),
      marginBottom: s(4),
      paddingHorizontal: s(12),
      paddingVertical: s(10),
      backgroundColor: arcane.surface.base,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      color: arcane.text.primary,
      fontSize: s(14),
      fontFamily: typography.fontFamily.body,
    },
    listContent: {
      paddingHorizontal: s(12),
      paddingVertical: s(8),
    },
    randomButtonText: {
      color: arcane.accent.sapphireLens,
      fontSize: s(14),
      fontFamily: typography.fontFamily.bodyBold,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemName: {
      color: arcane.text.primary,
      fontSize: s(15),
      fontFamily: typography.fontFamily.bodyBold,
    },
    currentBadge: {
      color: arcane.text.label,
      fontSize: s(11),
      fontFamily: typography.fontFamily.bodyBold,
    },
    abilityText: {
      color: arcane.text.muted,
      fontSize: s(12),
      lineHeight: s(17),
      fontFamily: typography.fontFamily.body,
    },
    emptyText: {
      color: arcane.text.dead,
      fontSize: s(14),
      fontFamily: typography.fontFamily.body,
      textAlign: 'center',
      paddingVertical: s(20),
    },
    footer: {
      paddingVertical: s(14),
      borderTopWidth: 1,
      borderTopColor: arcane.border.brassDim,
    },
    footerText: {
      color: arcane.accent.sapphireLens,
      fontSize: s(15),
      fontFamily: typography.fontFamily.bodyBold,
      textAlign: 'center',
    },
  });
}

export function randomButtonStyle(s: (v: number) => number, pressed: boolean) {
  return {
    marginBottom: s(8),
    padding: s(12),
    backgroundColor: pressed ? arcane.surface.parchment : arcane.surface.ledger,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: arcane.border.parchment,
    alignItems: 'center' as const,
  };
}

export function roleItemStyle(
  s: (v: number) => number,
  isCurrentFake: boolean,
  pressed: boolean,
) {
  return {
    paddingVertical: s(12),
    paddingHorizontal: s(12),
    marginBottom: s(4),
    backgroundColor: isCurrentFake
      ? arcane.surface.parchment
      : arcane.surface.ledger,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: isCurrentFake
      ? arcane.text.label
      : arcane.border.parchment,
    ...(pressed ? { backgroundColor: arcane.surface.parchment } : {}),
  };
}
