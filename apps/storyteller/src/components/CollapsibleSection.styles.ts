import { StyleSheet } from 'react-native';

export function createCollapsibleSectionStyles(s: (v: number) => number) {
  return StyleSheet.create({
    container: {
      marginBottom: s(8),
    },
    label: {
      color: '#908e8a',
      fontSize: s(13),
      fontWeight: '600',
    },
    chevron: {
      color: '#908e8a',
      fontSize: s(11),
    },
    contentWrapper: {
      marginTop: s(8),
    },
  });
}

export function toggleButtonStyle(s: (v: number) => number, pressed: boolean) {
  return {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: s(8),
    borderRadius: 6,
    backgroundColor: pressed ? '#2a2a30' : '#1e1e22',
    borderWidth: 1,
    borderColor: '#3a3a3e',
    gap: s(6),
  };
}
