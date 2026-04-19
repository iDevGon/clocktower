import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export function createRoleMixModalStyles(s: (v: number) => number) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(5,3,1,0.78)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: colors.ink.mid,
      borderRadius: 14,
      width: '90%',
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: colors.bruise.core,
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.edge.gilt,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: typography.family.display,
      color: colors.parchment.high,
      fontSize: s(20),
      fontWeight: typography.weight.bold,
      letterSpacing: typography.tracking.tight,
    },
    resetButton: {
      paddingVertical: s(4),
      paddingHorizontal: s(10),
      borderRadius: 4,
      backgroundColor: colors.crimson.deep,
    },
    resetText: {
      fontFamily: typography.family.body,
      color: colors.crimson.glow,
      fontSize: s(12),
      fontWeight: typography.weight.semibold,
    },
    searchInput: {
      fontFamily: typography.family.body,
      marginHorizontal: s(12),
      marginTop: s(8),
      marginBottom: s(4),
      paddingVertical: s(8),
      paddingHorizontal: s(12),
      backgroundColor: colors.ink.rise,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.edge.default,
      color: colors.parchment.high,
      fontSize: s(14),
    },
    scrollContent: {
      paddingHorizontal: s(12),
      paddingVertical: s(8),
    },
    teamSection: {
      marginBottom: s(12),
    },
    teamLabel: {
      fontFamily: typography.family.body,
      fontSize: s(14),
      fontWeight: typography.weight.bold,
      letterSpacing: typography.tracking.wide,
      marginBottom: s(6),
      textTransform: 'uppercase',
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
      fontFamily: typography.family.body,
      color: colors.ink.deep,
      fontSize: s(12),
      fontWeight: typography.weight.black,
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
      fontFamily: typography.family.display,
      color: colors.parchment.high,
      fontSize: s(14),
      fontWeight: typography.weight.semibold,
    },
    roleAbility: {
      fontFamily: typography.family.body,
      color: colors.parchment.low,
      fontSize: s(11),
      lineHeight: s(15),
    },
    footer: {
      paddingVertical: s(14),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.edge.default,
    },
    footerText: {
      fontFamily: typography.family.body,
      color: colors.parchment.mid,
      fontSize: s(15),
      fontWeight: typography.weight.semibold,
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
      ? `${colors.bruise.core}22`
      : pressed
        ? colors.ink.rise
        : colors.ink.mid,
  };
}

export function checkboxStyle(s: (v: number) => number, isSelected: boolean) {
  return {
    width: s(18),
    height: s(18),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: isSelected ? colors.bruise.glow : colors.edge.default,
    backgroundColor: isSelected ? colors.bruise.glow : 'transparent',
    marginRight: s(10),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}
