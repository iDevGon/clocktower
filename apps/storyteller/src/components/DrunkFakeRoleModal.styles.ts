import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export function createDrunkFakeRoleModalStyles(s: (v: number) => number) {
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
      borderColor: colors.ember.core,
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.edge.gilt,
    },
    headerTitle: {
      fontFamily: typography.family.display,
      color: colors.ember.glow,
      fontSize: s(20),
      fontWeight: typography.weight.bold,
      textAlign: 'center',
      marginBottom: s(4),
      letterSpacing: typography.tracking.tight,
    },
    headerDesc: {
      fontFamily: typography.family.body,
      color: colors.parchment.mid,
      fontSize: s(13),
      textAlign: 'center',
    },
    searchInput: {
      fontFamily: typography.family.body,
      marginHorizontal: s(12),
      marginTop: s(8),
      marginBottom: s(4),
      paddingHorizontal: s(12),
      paddingVertical: s(10),
      backgroundColor: colors.ink.rise,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.edge.default,
      color: colors.parchment.high,
      fontSize: s(14),
    },
    listContent: {
      paddingHorizontal: s(12),
      paddingVertical: s(8),
    },
    randomButtonText: {
      fontFamily: typography.family.body,
      color: colors.parchment.mid,
      fontSize: s(14),
      fontWeight: typography.weight.semibold,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemName: {
      fontFamily: typography.family.display,
      color: colors.parchment.high,
      fontSize: s(15),
      fontWeight: typography.weight.semibold,
    },
    currentBadge: {
      fontFamily: typography.family.body,
      color: colors.ember.glow,
      fontSize: s(11),
      fontWeight: typography.weight.semibold,
      letterSpacing: typography.tracking.wide,
    },
    abilityText: {
      fontFamily: typography.family.body,
      color: colors.parchment.low,
      fontSize: s(12),
      lineHeight: s(17),
    },
    emptyText: {
      fontFamily: typography.family.body,
      color: colors.parchment.mid,
      fontSize: s(14),
      textAlign: 'center',
      paddingVertical: s(20),
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

export function randomButtonStyle(s: (v: number) => number, pressed: boolean) {
  return {
    marginBottom: s(8),
    padding: s(12),
    backgroundColor: pressed ? colors.ink.rise : colors.ink.mid,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.edge.default,
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
      ? `${colors.ember.core}1a`
      : pressed
        ? colors.ink.rise
        : colors.ink.mid,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isCurrentFake ? colors.ember.core : colors.edge.default,
  };
}
