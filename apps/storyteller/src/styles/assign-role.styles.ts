import { StyleSheet } from 'react-native';

export function createAssignRoleStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121214',
    },
    listContent: {
      paddingHorizontal: s(16),
      paddingVertical: s(16),
    },
    randomButton: {
      marginBottom: s(12),
      padding: s(14),
      backgroundColor: '#252530',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#4a4a5a',
      alignItems: 'center',
    },
    randomButtonPressed: {
      backgroundColor: '#303040',
    },
    randomButtonText: {
      color: '#a0a0c0',
      fontSize: s(15),
      fontWeight: '600',
    },
    roleItem: {
      marginBottom: s(8),
      padding: s(16),
      backgroundColor: '#1a1a1e',
      borderRadius: 8,
      borderLeftWidth: 4,
    },
    roleItemAssigned: {
      opacity: 0.55,
    },
    roleItemPressed: {
      backgroundColor: '#242428',
    },
    roleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: s(4),
    },
    roleName: {
      color: '#e0ddd8',
      fontSize: s(16),
      fontWeight: 'bold',
    },
    roleNameAssigned: {
      color: '#908e8a',
    },
    assignedLabel: {
      fontSize: s(12),
      fontWeight: '600',
      color: '#c4a050',
    },
    teamLabel: {
      fontSize: s(12),
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    abilityText: {
      color: '#908e8a',
      fontSize: s(14),
      lineHeight: s(20),
    },

    // 주정뱅이 가짜 역할 선택 모달
    drunkOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    drunkModal: {
      backgroundColor: '#1e1e22',
      borderRadius: 12,
      width: '90%',
      maxHeight: '80%',
      borderWidth: 2,
      borderColor: '#e67e22',
    },
    drunkModalHeader: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: 1,
      borderBottomColor: '#3a3a42',
    },
    drunkModalTitle: {
      color: '#e67e22',
      fontSize: s(18),
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: s(4),
    },
    drunkModalSubtitle: {
      color: '#908e8a',
      fontSize: s(13),
      textAlign: 'center',
    },
    drunkListContent: {
      paddingHorizontal: s(12),
      paddingVertical: s(8),
    },
    drunkRoleItem: {
      paddingVertical: s(12),
      paddingHorizontal: s(12),
      marginBottom: s(4),
      backgroundColor: '#252528',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#e67e22',
    },
    drunkRoleItemPressed: {
      backgroundColor: '#353538',
    },
    drunkRoleName: {
      color: '#e0ddd8',
      fontSize: s(15),
      fontWeight: '600',
      marginBottom: s(2),
    },
    drunkRoleAbility: {
      color: '#787674',
      fontSize: s(12),
      lineHeight: s(17),
    },
    drunkEmptyText: {
      color: '#908e8a',
      fontSize: s(14),
      textAlign: 'center',
      paddingVertical: s(20),
    },
    drunkCancelButton: {
      paddingVertical: s(14),
      borderTopWidth: 1,
      borderTopColor: '#3a3a42',
    },
    drunkCancelText: {
      color: '#7070c4',
      fontSize: s(15),
      fontWeight: '600',
      textAlign: 'center',
    },
  });
}

export const styles = createAssignRoleStyles(1);
