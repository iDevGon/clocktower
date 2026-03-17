import { StyleSheet } from 'react-native';

export function createClockSpeedSettingStyles(s: (v: number) => number) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(6),
    },
    options: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: s(6),
    },
    label: {
      color: '#908e8a',
      fontSize: s(12),
      fontWeight: '600',
    },
  });
}

export function optionButtonStyle(
  s: (v: number) => number,
  isActive: boolean,
  isOff?: boolean,
) {
  return {
    paddingVertical: s(4),
    paddingHorizontal: s(8),
    borderRadius: 4,
    backgroundColor: isOff
      ? isActive
        ? '#3a2a2a'
        : '#242428'
      : isActive
        ? '#2a3a5c'
        : '#242428',
    borderWidth: 1,
    borderColor: isOff
      ? isActive
        ? '#6a3a3a'
        : '#3a3a3e'
      : isActive
        ? '#4a6a9c'
        : '#3a3a3e',
  };
}

export function optionTextStyle(
  s: (v: number) => number,
  isActive: boolean,
  isOff?: boolean,
) {
  return {
    color: isOff
      ? isActive
        ? '#e08080'
        : '#706e6a'
      : isActive
        ? '#8ab4f8'
        : '#706e6a',
    fontSize: s(11),
    fontWeight: '600' as const,
  };
}
