import { StyleSheet } from 'react-native';

export function createLobbyStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121214',
      maxWidth: 600,
      alignSelf: 'center' as const,
      width: '100%' as const,
    },
    header: {
      alignItems: 'center',
      paddingVertical: s(24),
      borderBottomWidth: 1,
      borderColor: '#2e2e34',
    },
    qrContainer: {
      marginTop: s(16),
      alignItems: 'center',
    },
    qrHint: {
      color: '#5c5a58',
      fontSize: s(11),
      marginTop: s(8),
    },
    participantHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: s(16),
      paddingVertical: s(12),
    },
    participantLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
    },
    participantLabel: {
      color: '#b8b6b2',
      fontSize: s(18),
      fontWeight: '600',
    },
    devButton: {
      backgroundColor: '#3a3a40',
      paddingHorizontal: s(8),
      paddingVertical: s(4),
      borderRadius: 4,
    },
    devButtonText: {
      color: '#908e8a',
      fontSize: s(11),
    },
    compositionHint: {
      color: '#706e6a',
      fontSize: s(12),
    },
    distributeContainer: {
      paddingHorizontal: s(16),
      paddingBottom: s(8),
    },
    distributeButton: {
      paddingVertical: s(12),
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: '#2a3a5c',
    },
    distributeButtonPressed: {
      backgroundColor: '#1e2e4a',
    },
    distributeButtonDisabled: {
      backgroundColor: '#242428',
    },
    distributeButtonText: {
      color: '#e0ddd8',
      fontSize: s(15),
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
    startButton: {
      paddingVertical: s(16),
      borderRadius: 12,
      alignItems: 'center',
    },
    startButtonActive: {
      backgroundColor: '#943c3c',
    },
    startButtonPressed: {
      backgroundColor: '#7a3030',
    },
    startButtonDisabled: {
      backgroundColor: '#242428',
    },
    startButtonText: {
      color: '#e0ddd8',
      fontSize: s(18),
      fontWeight: 'bold',
    },
  });
}

export const styles = createLobbyStyles(1);
