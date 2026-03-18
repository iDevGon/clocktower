import { StyleSheet } from 'react-native';

export function createDrunkFakeRoleModalStyles(s: (v: number) => number) {
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
      borderColor: '#e67e22',
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: 1,
      borderBottomColor: '#3a3a42',
    },
    headerTitle: {
      color: '#e67e22',
      fontSize: s(18),
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: s(4),
    },
    headerDesc: {
      color: '#908e8a',
      fontSize: s(13),
      textAlign: 'center',
    },
    searchInput: {
      marginHorizontal: s(12),
      marginTop: s(8),
      marginBottom: s(4),
      paddingHorizontal: s(12),
      paddingVertical: s(10),
      backgroundColor: '#28282e',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#3a3a42',
      color: '#e0ddd8',
      fontSize: s(14),
    },
    listContent: {
      paddingHorizontal: s(12),
      paddingVertical: s(8),
    },
    randomButtonText: {
      color: '#a0a0c0',
      fontSize: s(14),
      fontWeight: '600',
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemName: {
      color: '#e0ddd8',
      fontSize: s(15),
      fontWeight: '600',
    },
    currentBadge: {
      color: '#e67e22',
      fontSize: s(11),
      fontWeight: '600',
    },
    abilityText: {
      color: '#787674',
      fontSize: s(12),
      lineHeight: s(17),
    },
    emptyText: {
      color: '#908e8a',
      fontSize: s(14),
      textAlign: 'center',
      paddingVertical: s(20),
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

export function randomButtonStyle(s: (v: number) => number, pressed: boolean) {
  return {
    marginBottom: s(8),
    padding: s(12),
    backgroundColor: pressed ? '#303040' : '#252530',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a4a5a',
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
    backgroundColor: isCurrentFake ? '#3a2a18' : '#252528',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: isCurrentFake ? '#e67e22' : '#555',
    ...(pressed ? { backgroundColor: '#353538' } : {}),
  };
}
