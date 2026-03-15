import { StyleSheet } from 'react-native';

export function createPlayerPickerModalStyles(s: (v: number) => number) {
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
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: 1,
      borderBottomColor: '#3a3a42',
    },
    description: {
      color: '#908e8a',
      fontSize: s(13),
      textAlign: 'center',
    },
    autoSection: {
      paddingHorizontal: s(12),
      paddingTop: s(8),
    },
    autoButtonText: {
      fontSize: s(14),
      fontWeight: '600',
      opacity: 0.9,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: s(16),
      paddingVertical: s(8),
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#3a3a42',
    },
    dividerText: {
      color: '#606060',
      fontSize: s(12),
      marginHorizontal: s(10),
    },
    playerItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playerName: {
      color: '#e0ddd8',
      fontSize: s(15),
      fontWeight: '600',
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

export function titleStyle(s: (v: number) => number, themeColor: string) {
  return {
    color: themeColor,
    fontSize: s(18),
    fontWeight: '700' as const,
    textAlign: 'center' as const,
    marginBottom: s(4),
  };
}

export function autoButtonStyle(
  s: (v: number) => number,
  themeColor: string,
  pressed: boolean,
) {
  const autoBg = `${themeColor}15`;
  const autoBgPressed = `${themeColor}30`;
  return {
    padding: s(12),
    backgroundColor: pressed ? autoBgPressed : autoBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: themeColor,
    alignItems: 'center' as const,
  };
}

export function listContentStyle(
  s: (v: number) => number,
  hasAutoLabel: boolean,
) {
  return {
    paddingHorizontal: s(12),
    paddingTop: hasAutoLabel ? 0 : s(8),
    paddingBottom: s(8),
  };
}

export function playerItemStyle(
  s: (v: number) => number,
  isCurrent: boolean,
  themeColor: string,
) {
  const highlightBg = `${themeColor}20`;
  return {
    paddingVertical: s(12),
    paddingHorizontal: s(12),
    marginBottom: s(4),
    backgroundColor: isCurrent ? highlightBg : '#252528',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: isCurrent ? themeColor : '#555',
  };
}

export function roleText(s: (v: number) => number) {
  return {
    color: '#787674',
    fontSize: s(13),
    marginLeft: s(8),
  };
}

export function currentBadgeStyle(
  s: (v: number) => number,
  themeColor: string,
) {
  return {
    color: themeColor,
    fontSize: s(11),
    fontWeight: '600' as const,
  };
}
