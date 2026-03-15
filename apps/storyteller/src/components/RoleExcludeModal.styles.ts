import { StyleSheet } from 'react-native';

export function createRoleExcludeModalStyles(s: (v: number) => number) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: '#1e1e22',
      borderRadius: 12,
      width: '90%',
      maxHeight: '80%',
      borderWidth: 2,
      borderColor: '#4a4a5a',
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: 1,
      borderBottomColor: '#3a3a42',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      color: '#e0ddd8',
      fontSize: s(18),
      fontWeight: '700',
    },
    resetButton: {
      paddingVertical: s(4),
      paddingHorizontal: s(10),
      borderRadius: 4,
      backgroundColor: '#3a2020',
    },
    resetText: {
      color: '#c47070',
      fontSize: s(12),
      fontWeight: '600',
    },
    searchInput: {
      marginHorizontal: s(12),
      marginTop: s(8),
      marginBottom: s(4),
      paddingVertical: s(8),
      paddingHorizontal: s(12),
      backgroundColor: '#252528',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#3a3a3e',
      color: '#e0ddd8',
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
      fontSize: s(14),
      fontWeight: '700',
      marginBottom: s(6),
    },
    checkmark: {
      color: '#1e1e22',
      fontSize: s(12),
      fontWeight: '900',
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
    footer: {
      paddingVertical: s(14),
      borderTopWidth: 1,
      borderTopColor: '#3a3a42',
    },
    footerText: {
      color: '#7070c4',
      fontSize: s(15),
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}

export function roleItemStyle(
  s: (v: number) => number,
  isExcluded: boolean,
  pressed: boolean,
) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: s(8),
    paddingHorizontal: s(10),
    marginBottom: s(2),
    borderRadius: 6,
    backgroundColor: isExcluded ? '#2a1a1a' : pressed ? '#2a2a30' : '#252528',
  };
}

export function checkboxStyle(s: (v: number) => number, isExcluded: boolean) {
  return {
    width: s(18),
    height: s(18),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: isExcluded ? '#c47070' : '#5a5a5e',
    backgroundColor: isExcluded ? '#c47070' : 'transparent',
    marginRight: s(10),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function roleNameStyle(s: (v: number) => number, isExcluded: boolean) {
  return {
    color: isExcluded ? '#706060' : '#e0ddd8',
    fontSize: s(14),
    fontWeight: '600' as const,
    textDecorationLine: isExcluded
      ? ('line-through' as const)
      : ('none' as const),
  };
}

export function roleAbilityStyle(
  s: (v: number) => number,
  isExcluded: boolean,
) {
  return {
    color: isExcluded ? '#504848' : '#787674',
    fontSize: s(11),
    lineHeight: s(15),
  };
}
