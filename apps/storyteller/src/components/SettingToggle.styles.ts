import { StyleSheet } from 'react-native';

export function createSettingToggleStyles(s: (v: number) => number) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
    },
  });
}

export function labelStyle(s: (v: number) => number, isActive: boolean) {
  return {
    color: isActive ? '#e0ddd8' : '#5c5a58',
    fontSize: s(12),
    fontWeight: '600' as const,
  };
}
