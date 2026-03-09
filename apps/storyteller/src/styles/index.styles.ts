import { StyleSheet } from 'react-native';

export function createIndexStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121214',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: s(32),
    },
    title: {
      color: '#e0ddd8',
      fontSize: s(36),
      fontWeight: 'bold',
      marginBottom: s(8),
    },
    subtitle: {
      color: '#b85c5c',
      fontSize: s(42),
      fontWeight: '900',
      letterSpacing: s(2),
      marginBottom: s(48),
    },
    label: {
      color: '#908e8a',
      fontSize: s(18),
      marginBottom: s(24),
    },
    form: {
      width: '100%',
      maxWidth: s(480),
      gap: s(12),
    },
    inputRow: {
      flexDirection: 'row',
      gap: s(8),
    },
    input: {
      backgroundColor: '#1a1a1e',
      borderWidth: 1,
      borderColor: '#2e2e34',
      borderRadius: 8,
      paddingHorizontal: s(16),
      paddingVertical: s(12),
      color: '#e0ddd8',
      fontSize: s(16),
    },
    inputFlex: {
      flex: 1,
    },
    qrButton: {
      backgroundColor: '#1a1a1e',
      borderWidth: 1,
      borderColor: '#2e2e34',
      borderRadius: 8,
      paddingHorizontal: s(16),
      justifyContent: 'center',
      alignItems: 'center',
    },
    qrButtonPressed: {
      backgroundColor: '#2e2e34',
    },
    qrButtonText: {
      color: '#908e8a',
      fontSize: s(14),
      fontWeight: 'bold',
    },
    errorText: {
      color: '#b85c5c',
      fontSize: s(14),
      textAlign: 'center',
    },
    button: {
      backgroundColor: '#943c3c',
      paddingVertical: s(16),
      borderRadius: 12,
      alignItems: 'center',
    },
    buttonPressed: {
      backgroundColor: '#7a3030',
    },
    buttonText: {
      color: '#e0ddd8',
      fontSize: s(20),
      fontWeight: 'bold',
    },
  });
}

export const styles = createIndexStyles(1);
