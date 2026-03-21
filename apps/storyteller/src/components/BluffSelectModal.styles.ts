import { StyleSheet } from 'react-native';

export function createBluffSelectModalStyles(s: (v: number) => number) {
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
    },
    headerTitle: {
      color: '#e0ddd8',
      fontSize: s(18),
      fontWeight: '700',
    },
    headerSubtitle: {
      color: '#908e8a',
      fontSize: s(12),
      marginTop: s(4),
    },
    selectedContainer: {
      paddingHorizontal: s(12),
      paddingVertical: s(8),
      borderBottomWidth: 1,
      borderBottomColor: '#2a2a2e',
    },
    selectedLabel: {
      color: '#b85c5c',
      fontSize: s(12),
      fontWeight: '600',
      marginBottom: s(6),
    },
    selectedRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: s(6),
    },
    selectedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(4),
      paddingVertical: s(4),
      paddingHorizontal: s(10),
      backgroundColor: '#2a1e2e',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: '#5a3a6a',
    },
    selectedChipText: {
      color: '#c4a0d0',
      fontSize: s(13),
      fontWeight: '600',
    },
    selectedChipRemove: {
      color: '#c47070',
      fontSize: s(14),
      fontWeight: '700',
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
    backgroundColor: isSelected ? '#2a1e2e' : pressed ? '#2a2a30' : '#252528',
  };
}

export function checkboxStyle(s: (v: number) => number, isSelected: boolean) {
  return {
    width: s(18),
    height: s(18),
    borderRadius: 4,
    borderWidth: 2,
    borderColor: isSelected ? '#8a6a9a' : '#5a5a5e',
    backgroundColor: isSelected ? '#8a6a9a' : 'transparent',
    marginRight: s(10),
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

export function roleNameStyle(s: (v: number) => number, isSelected: boolean) {
  return {
    color: isSelected ? '#c4a0d0' : '#e0ddd8',
    fontSize: s(14),
    fontWeight: '600' as const,
  };
}

export function roleAbilityStyle(s: (v: number) => number) {
  return {
    color: '#787674',
    fontSize: s(11),
    lineHeight: s(15),
  };
}
