import { colors, typography } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

const arcane = colors.arcane;

export function createLobbyStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: arcane.surface.base,
      maxWidth: 600,
      alignSelf: 'center' as const,
      width: '100%' as const,
    },
    desktopContainer: {
      flex: 1,
      backgroundColor: arcane.surface.base,
      width: '100%',
    },
    desktopShell: {
      flex: 1,
      padding: 22,
      gap: 16,
    },
    header: {
      paddingHorizontal: s(18),
      paddingTop: s(18),
      paddingBottom: s(14),
      borderBottomWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: s(8),
    },
    headerKicker: {
      color: arcane.text.label,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(10),
      letterSpacing: 1.4,
    },
    headerTitle: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.display,
      fontSize: s(28),
      lineHeight: s(34),
      marginTop: s(2),
    },
    headerSubtitle: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(12),
    },
    desktopHeader: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      minHeight: 112,
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
      padding: 20,
      gap: 20,
    },
    desktopTitleBlock: {
      flex: 1,
      justifyContent: 'center',
    },
    desktopStats: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    },
    desktopStatCell: {
      width: 104,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      backgroundColor: arcane.surface.ledger,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    desktopStatValue: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: 28,
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },
    desktopStatLabel: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: 12,
      marginTop: 2,
      textAlign: 'center',
    },
    desktopBody: {
      flex: 1,
      flexDirection: 'row',
      gap: 18,
      minHeight: 0,
    },
    desktopRosterPanel: {
      flex: 1.45,
      minWidth: 480,
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.ledger,
      padding: 18,
      minHeight: 0,
    },
    desktopControlColumn: {
      width: 430,
      minWidth: 400,
      maxWidth: 520,
      gap: 14,
      minHeight: 0,
    },
    desktopSetupPanel: {
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
      padding: 18,
      gap: 14,
    },
    desktopSettingsPanel: {
      flex: 1,
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.ledger,
      padding: 18,
      minHeight: 0,
    },
    panelHeader: {
      borderBottomWidth: 1,
      borderBottomColor: arcane.border.parchment,
      paddingBottom: 12,
      marginBottom: 14,
    },
    panelKicker: {
      color: arcane.text.label,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: 10,
      letterSpacing: 1.2,
    },
    panelTitle: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.display,
      fontSize: 24,
      lineHeight: 30,
      marginTop: 3,
    },
    panelSubtitle: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.body,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 3,
    },
    participantHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: s(16),
      paddingVertical: s(12),
      borderBottomWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.ledger,
    },
    participantLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
    },
    participantLabel: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.display,
      fontSize: s(18),
      fontWeight: '600',
    },
    devButtonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(6),
    },
    devButton: {
      backgroundColor: arcane.surface.apparatus,
      paddingHorizontal: s(8),
      paddingVertical: s(4),
      borderRadius: 4,
      borderWidth: 1,
      borderColor: arcane.border.brassDim,
    },
    devButtonText: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(11),
    },
    compositionHint: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(12),
    },
    distributeContainer: {
      paddingHorizontal: s(16),
      paddingVertical: s(12),
      gap: s(10),
      borderBottomWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
    },
    distributeButton: {
      paddingVertical: s(12),
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: arcane.accent.prussianBlue,
      borderWidth: 1,
      borderColor: arcane.accent.sapphireLens,
    },
    desktopDistributeButton: {
      flex: 1,
      minHeight: 52,
    },
    distributeButtonPressed: {
      backgroundColor: arcane.accent.midnightInk,
    },
    distributeButtonDisabled: {
      backgroundColor: arcane.surface.ledger,
      borderColor: arcane.border.parchment,
    },
    distributeButtonText: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(15),
      fontWeight: '600',
    },
    listContainer: {
      flex: 1,
      backgroundColor: arcane.surface.base,
    },
    footer: {
      padding: s(16),
      borderTopWidth: 1,
      borderColor: arcane.border.brassDim,
      backgroundColor: arcane.surface.apparatus,
    },
    startButton: {
      paddingVertical: s(16),
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    startButtonActive: {
      backgroundColor: arcane.action.blood,
      borderColor: arcane.action.bloodHighlight,
    },
    startButtonPressed: {
      backgroundColor: arcane.action.bloodPressed,
    },
    startButtonDisabled: {
      backgroundColor: arcane.surface.ledger,
      borderColor: arcane.border.parchment,
    },
    desktopStartButton: {
      minHeight: 58,
    },
    startButtonText: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(18),
      fontWeight: 'bold',
    },
    mobileStatusBand: {
      flexDirection: 'row',
      gap: s(8),
      paddingHorizontal: s(16),
      paddingVertical: s(12),
      backgroundColor: arcane.surface.base,
    },
    mobileStatCell: {
      flex: 1,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      backgroundColor: arcane.surface.ledger,
      paddingVertical: s(9),
      paddingHorizontal: s(8),
      borderRadius: 6,
    },
    mobileStatValue: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(16),
      fontVariant: ['tabular-nums'],
      textAlign: 'center',
    },
    mobileStatLabel: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(10),
      marginTop: s(2),
      textAlign: 'center',
    },

    /* ---- Edition selector ---- */
    editionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      flexWrap: 'wrap',
    },
    editionLabel: {
      color: arcane.text.label,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(13),
    },
    desktopEditionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    desktopEditionButton: {
      minWidth: 136,
      alignItems: 'center',
    },

    /* ---- Distribute row + veil toggle ---- */
    distributeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
    },
    desktopDistributionControls: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    },
    compositionGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    compositionCell: {
      flex: 1,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      backgroundColor: arcane.surface.ledger,
      paddingVertical: 14,
      paddingHorizontal: 10,
      alignItems: 'center',
    },
    compositionValue: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: 24,
      fontVariant: ['tabular-nums'],
    },
    compositionLabel: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: 12,
      marginTop: 2,
    },
    compositionUnavailable: {
      color: arcane.text.dead,
      fontFamily: typography.fontFamily.body,
      fontSize: 13,
      paddingVertical: 14,
    },
    roleActionGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    roleActionButton: {
      flex: 1,
      minHeight: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 7,
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      backgroundColor: arcane.surface.ledger,
      paddingHorizontal: 10,
    },
    roleActionButtonWarn: {
      borderColor: arcane.action.bloodHighlight,
      backgroundColor: arcane.action.bloodPressed,
    },
    roleActionButtonMix: {
      borderColor: '#8e6eb0',
      backgroundColor: '#1b1224',
    },
    roleActionButtonPressed: {
      opacity: 0.72,
    },
    roleActionText: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(13),
      fontWeight: '600',
    },
    roleActionTextWarn: {
      color: arcane.action.bloodHighlight,
    },
    roleActionTextMix: {
      color: '#c8a7e8',
    },

    /* ---- Role exclude / mix button text (static base) ---- */
    roleSettingButtonText: {
      fontSize: s(13),
      fontWeight: '600',
    },

    /* ---- FlatList ---- */
    playerListContent: {
      paddingHorizontal: s(16),
      paddingBottom: s(12),
    },
    desktopPlayerListContent: {
      gap: 9,
      paddingBottom: 8,
    },

    /* ---- Player row ---- */
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(10),
      paddingVertical: s(11),
      paddingHorizontal: s(12),
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      backgroundColor: arcane.surface.ledger,
      borderRadius: 6,
      marginBottom: s(8),
    },
    desktopPlayerRow: {
      marginBottom: 0,
      backgroundColor: arcane.surface.apparatus,
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    playerRowAssigned: {
      borderColor: arcane.border.brassDim,
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    playerIdentity: {
      minWidth: 0,
    },
    playerName: {
      color: arcane.text.strong,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(15),
    },
    travellerBadge: {
      alignSelf: 'flex-start',
      marginTop: s(3),
      fontSize: s(11),
      color: '#c8a7e8',
      backgroundColor: '#1b1224',
      paddingHorizontal: s(5),
      paddingVertical: s(1),
      borderRadius: s(4),
      overflow: 'hidden',
    } as const,
    travellerBadgeEvil: {
      color: arcane.action.bloodHighlight,
      backgroundColor: '#2e1e1e',
    },
    travellerBadgeGood: {
      color: arcane.accent.sapphireLens,
      backgroundColor: arcane.accent.midnightInk,
    },
    playerRoleContainer: {
      alignItems: 'flex-end',
      maxWidth: '54%',
    },
    unassignedRoleText: {
      color: arcane.text.dead,
      fontFamily: typography.fontFamily.bodyMedium,
      fontSize: s(13),
    },

    /* ---- Drunk change button ---- */
    drunkChangeButton: {
      marginTop: s(4),
      paddingVertical: s(3),
      paddingHorizontal: s(8),
      backgroundColor: arcane.surface.parchment,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: arcane.border.brass,
    },
    drunkChangeText: {
      color: arcane.text.label,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(11),
      fontWeight: '600',
    },

    /* ---- 상세 설정 영역 (listContainer 내부) ---- */
    settingsScrollArea: {
      flex: 1,
    },
    desktopSettingsScrollArea: {
      flex: 1,
      minHeight: 0,
    },
    settingsScrollContent: {
      padding: s(16),
      paddingBottom: s(8),
    },
    desktopSettingsScrollContent: {
      paddingBottom: 6,
    },
    /* ---- 상세 설정 토글 버튼 ---- */
    settingsToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: s(6),
      paddingVertical: s(10),
      paddingHorizontal: s(12),
      marginBottom: s(8),
      borderWidth: 1,
      borderColor: arcane.border.parchment,
      backgroundColor: arcane.surface.ledger,
      borderRadius: 6,
    },
    settingsToggleLabel: {
      color: arcane.text.muted,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(13),
      fontWeight: '600',
    },
    settingsToggleChevron: {
      color: arcane.text.label,
      fontFamily: typography.fontFamily.bodyBold,
      fontSize: s(12),
    },

    /* ---- Footer advanced settings ---- */
    settingsGap: {
      gap: s(10),
    },
    settingsToggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: arcane.surface.apparatus,
      borderRadius: 6,
      paddingVertical: s(10),
      paddingHorizontal: s(12),
      borderWidth: 1,
      borderColor: arcane.border.parchment,
    },
    settingsDivider: {
      width: 1,
      backgroundColor: arcane.border.parchment,
    },
    clockSettingContainer: {
      backgroundColor: arcane.surface.apparatus,
      borderRadius: 6,
      paddingVertical: s(10),
      paddingHorizontal: s(12),
      borderWidth: 1,
      borderColor: arcane.border.parchment,
    },
  });
}

/* ---- Dynamic style helpers ---- */
export const lobbyDynamic = {
  editionButton: (
    selected: boolean,
    disabled: boolean,
    pressed: boolean,
    s: (v: number) => number,
  ) => ({
    paddingVertical: s(6),
    paddingHorizontal: s(12),
    borderRadius: 7,
    backgroundColor: disabled
      ? arcane.surface.ledger
      : selected
        ? arcane.accent.prussianBlue
        : pressed
          ? arcane.surface.parchment
          : arcane.surface.ledger,
    borderWidth: 1,
    borderColor: disabled
      ? arcane.border.parchment
      : selected
        ? arcane.accent.sapphireLens
        : arcane.border.brassDim,
    opacity: disabled ? 0.5 : 1,
  }),
  editionButtonText: (
    selected: boolean,
    disabled: boolean,
    s: (v: number) => number,
  ) => ({
    color: disabled
      ? arcane.text.dead
      : selected
        ? arcane.text.strong
        : arcane.text.muted,
    fontSize: s(13),
    fontFamily: typography.fontFamily.bodyBold,
    fontWeight: '600' as const,
  }),
  aliveDot: (isAlive: boolean, s: (v: number) => number) => ({
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: isAlive ? '#5a8068' : '#943c3c',
    marginRight: s(10),
  }),
  playerRoleText: (
    veiled: boolean,
    s: (v: number) => number,
    teamColor?: string,
  ) => ({
    color: veiled ? arcane.text.dead : (teamColor ?? arcane.text.muted),
    fontSize: s(14),
    fontFamily: typography.fontFamily.bodyBold,
  }),
  veilToggleButton: (veiled: boolean, s: (v: number) => number) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: s(6),
    paddingVertical: s(12),
    paddingHorizontal: s(10),
    backgroundColor: veiled ? '#1b1224' : arcane.surface.ledger,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: veiled ? '#8e6eb0' : arcane.border.brassDim,
  }),
  veilToggleLabel: (veiled: boolean, s: (v: number) => number) => ({
    color: veiled ? '#c8a7e8' : arcane.text.muted,
    fontSize: s(12),
    fontFamily: typography.fontFamily.bodyBold,
    fontWeight: '600' as const,
  }),
  roleSettingButtonTextColor: (hasItems: boolean, defaultColor: string) => ({
    color: hasItems ? defaultColor : arcane.text.muted,
  }),
};

export const styles = createLobbyStyles(1);
