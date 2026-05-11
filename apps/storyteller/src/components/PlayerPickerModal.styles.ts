import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const arcane = colors.arcane;

export function createPlayerPickerModalStyles(s: (v: number) => number) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(13, 7, 3, 0.78)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: arcane.surface.apparatus,
      borderRadius: 4,
      width: '90%',
      maxHeight: '80%',
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
    },
    header: {
      paddingHorizontal: s(16),
      paddingTop: s(16),
      paddingBottom: s(12),
      borderBottomWidth: 1,
      borderBottomColor: arcane.border.brassDim,
    },
    description: {
      color: arcane.text.muted,
      fontSize: s(13),
      fontFamily: typography.fontFamily.body,
      textAlign: 'center',
    },
    autoSection: {
      paddingHorizontal: s(12),
      paddingTop: s(8),
    },
    autoButtonText: {
      fontSize: s(14),
      fontFamily: typography.fontFamily.bodyBold,
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
      backgroundColor: arcane.border.brassDim,
    },
    dividerText: {
      color: arcane.text.dead,
      fontSize: s(12),
      fontFamily: typography.fontFamily.bodyMedium,
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
      color: arcane.text.primary,
      fontSize: s(15),
      fontFamily: typography.fontFamily.bodyBold,
    },
    footer: {
      paddingVertical: s(14),
      borderTopWidth: 1,
      borderTopColor: arcane.border.brassDim,
    },
    footerText: {
      color: arcane.accent.sapphireLens,
      fontSize: s(15),
      fontFamily: typography.fontFamily.bodyBold,
      textAlign: 'center',
    },
  });
}

export function titleStyle(s: (v: number) => number, themeColor: string) {
  return {
    color: themeColor,
    fontSize: s(18),
    fontFamily: typography.fontFamily.display,
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
    borderRadius: 4,
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
    backgroundColor: isCurrent ? highlightBg : arcane.surface.ledger,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: isCurrent ? themeColor : arcane.border.parchment,
  };
}

export function roleText(s: (v: number) => number) {
  return {
    color: arcane.text.muted,
    fontSize: s(13),
    marginLeft: s(8),
    fontFamily: typography.fontFamily.body,
  };
}

export function currentBadgeStyle(
  s: (v: number) => number,
  themeColor: string,
) {
  return {
    color: themeColor,
    fontSize: s(11),
    fontFamily: typography.fontFamily.bodyBold,
  };
}
