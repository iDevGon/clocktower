import { StyleSheet } from 'react-native';

export function createNominateStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121214',
    },
    header: {
      paddingHorizontal: s(16),
      paddingVertical: s(16),
      borderBottomWidth: 1,
      borderColor: '#2e2e34',
    },
    instruction: {
      color: '#908e8a',
      fontSize: s(14),
      marginBottom: s(4),
    },
    selectionRow: {
      flexDirection: 'row',
      gap: s(12),
      marginTop: s(8),
    },
    selectionBox: {
      flex: 1,
      backgroundColor: '#1a1a1e',
      borderRadius: 8,
      padding: s(12),
      borderWidth: 1,
      borderColor: '#2e2e34',
    },
    selectionLabel: {
      color: '#5c5a58',
      fontSize: s(12),
      marginBottom: s(4),
    },
    selectionValue: {
      color: '#e0ddd8',
      fontSize: s(16),
      fontWeight: '600',
    },
    listContainer: {
      flex: 1,
    },
    footer: {
      padding: s(16),
      borderTopWidth: 1,
      borderColor: '#2e2e34',
    },
    submitButton: {
      paddingVertical: s(16),
      borderRadius: 12,
      alignItems: 'center',
    },
    submitButtonActive: {
      backgroundColor: '#943c3c',
    },
    submitButtonPressed: {
      backgroundColor: '#7a3030',
    },
    submitButtonDisabled: {
      backgroundColor: '#242428',
    },
    submitButtonText: {
      color: '#e0ddd8',
      fontSize: s(18),
      fontWeight: 'bold',
    },
  });
}

export const styles = createNominateStyles(1);
