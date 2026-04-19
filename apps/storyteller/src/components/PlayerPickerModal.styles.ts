import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export function createPlayerPickerModalStyles(s: (v: number) => number) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(5,3,1,0.78)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: colors.ink.mid,
      borderRadius: 14,
      width: '90%',
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: colors.edge.gilt,
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.edge.gilt,
    },
    description: {
      fontFamily: typography.family.body,
      color: colors.parchment.mid,
      fontSize: s(13),
      textAlign: 'center',
    },
    autoSection: {
      paddingHorizontal: s(12),
      paddingTop: s(8),
    },
    autoButtonText: {
      fontFamily: typography.family.body,
      fontSize: s(14),
      fontWeight: typography.weight.semibold,
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
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.edge.default,
    },
    dividerText: {
      fontFamily: typography.family.body,
      color: colors.parchment.low,
      fontSize: s(12),
      marginHorizontal: s(10),
      letterSpacing: typography.tracking.wide,
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
      fontFamily: typography.family.display,
      color: colors.parchment.high,
      fontSize: s(15),
      fontWeight: typography.weight.semibold,
    },
    footer: {
      paddingVertical: s(14),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.edge.default,
    },
    footerText: {
      fontFamily: typography.family.body,
      color: colors.parchment.mid,
      fontSize: s(15),
      fontWeight: typography.weight.semibold,
      textAlign: 'center',
    },
  });
}

export function titleStyle(s: (v: number) => number, themeColor: string) {
  return {
    fontFamily: typography.family.display,
    color: themeColor,
    fontSize: s(20),
    fontWeight: typography.weight.bold,
    textAlign: 'center' as const,
    marginBottom: s(4),
    letterSpacing: typography.tracking.tight,
  };
}

export function autoButtonStyle(
  s: (v: number) => number,
  themeColor: string,
  pressed: boolean,
) {
  const autoBg = `${themeColor}12`;
  const autoBgPressed = `${themeColor}24`;
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
  const highlightBg = `${themeColor}1a`;
  // border-left 스트라이프 폐기 — 대신 전체 보더로 강조
  return {
    paddingVertical: s(12),
    paddingHorizontal: s(12),
    marginBottom: s(4),
    backgroundColor: isCurrent ? highlightBg : colors.ink.rise,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isCurrent ? themeColor : colors.edge.default,
  };
}

export function roleText(s: (v: number) => number) {
  return {
    fontFamily: typography.family.body,
    color: colors.parchment.low,
    fontSize: s(13),
    marginLeft: s(8),
  };
}

export function currentBadgeStyle(
  s: (v: number) => number,
  themeColor: string,
) {
  return {
    fontFamily: typography.family.body,
    color: themeColor,
    fontSize: s(11),
    fontWeight: typography.weight.semibold,
    letterSpacing: typography.tracking.wide,
  };
}
