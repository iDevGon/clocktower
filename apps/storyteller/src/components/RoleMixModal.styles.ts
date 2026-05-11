import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const arcane = colors.arcane;

export function createRoleMixModalStyles(s: (v: number) => number) {
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
      borderColor: '#725b85',
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: 1,
      borderBottomColor: arcane.border.brassDim,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      color: arcane.text.strong,
      fontSize: s(18),
      fontFamily: typography.fontFamily.display,
    },
    resetButton: {
      paddingVertical: s(4),
      paddingHorizontal: s(10),
      borderRadius: 4,
      backgroundColor: arcane.action.bloodPressed,
      borderWidth: 1,
      borderColor: arcane.action.blood,
    },
    resetText: {
      color: arcane.action.bloodHighlight,
      fontSize: s(12),
      fontFamily: typography.fontFamily.bodyBold,
    },
    searchInput: {
      marginHorizontal: s(12),
      marginTop: s(8),
      marginBottom: s(4),
      paddingVertical: s(8),
      paddingHorizontal: s(12),
      backgroundColor: arcane.surface.base,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      color: arcane.text.primary,
      fontSize: s(14),
      fontFamily: typography.fontFamily.body,
    },
    scrollContent: {
      paddingHorizontal: s(12),
      paddingVertical: s(8),
    },
    teamSection: {
      marginBottom: s(12),
    },
    teamLabel: {
      fontSize: s(14),
      fontFamily: typography.fontFamily.bodyBold,
      marginBottom: s(6),
    },
    checkbox: {
      width: s(18),
      height: s(18),
      borderRadius: 4,
      borderWidth: 2,
      marginRight: s(10),
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkmark: {
      color: arcane.surface.base,
      fontSize: s(12),
      fontFamily: typography.fontFamily.bodyBold,
      lineHeight: s(14),
    },
    roleContent: {
      flex: 1,
    },
    roleNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
    },
    roleName: {
      color: arcane.text.primary,
      fontSize: s(14),
      fontFamily: typography.fontFamily.bodyBold,
    },
    roleAbility: {
      color: arcane.text.muted,
      fontSize: s(11),
      lineHeight: s(15),
      fontFamily: typography.fontFamily.body,
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

export function roleItemStyle(
  s: (v: number) => number,
  isSelected: boolean,
  pressed: boolean,
) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: s(8),
    paddingHorizontal: s(10),
    marginBottom: s(2),
    borderRadius: 6,
    backgroundColor: isSelected
      ? '#241926'
      : pressed
        ? arcane.surface.parchment
        : arcane.surface.ledger,
  };
}

export function checkboxStyle(s: (v: number) => number, isSelected: boolean) {
  return {
    width: s(18),
    height: s(18),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: isSelected ? '#d7b7ef' : arcane.text.dead,
    backgroundColor: isSelected ? '#d7b7ef' : 'transparent',
    marginRight: s(10),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}
