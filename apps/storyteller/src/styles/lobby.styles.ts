import { colors } from '@clocktower/ui';
import { StyleSheet } from 'react-native';

export function createLobbyStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.ink.deep,
      maxWidth: 600,
      alignSelf: 'center' as const,
      width: '100%' as const,
    },
    header: {
      alignItems: 'center',
      paddingVertical: s(24),
      borderBottomWidth: 1,
      borderColor: colors.edge.default,
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
      color: colors.parchment.mid,
      fontSize: s(18),
      fontWeight: '600',
    },
    devButton: {
      backgroundColor: colors.ink.rise,
      paddingHorizontal: s(8),
      paddingVertical: s(4),
      borderRadius: 4,
    },
    devButtonText: {
      color: colors.parchment.mid,
      fontSize: s(11),
    },
    compositionHint: {
      color: colors.parchment.low,
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
      backgroundColor: colors.twilight.deep,
    },
    distributeButtonPressed: {
      backgroundColor: colors.ink.void,
    },
    distributeButtonDisabled: {
      backgroundColor: colors.ink.mid,
    },
    distributeButtonText: {
      color: colors.parchment.high,
      fontSize: s(15),
      fontWeight: '600',
    },
    listContainer: {
      flex: 1,
    },
    footer: {
      padding: s(16),
      borderTopWidth: 1,
      borderColor: colors.edge.default,
    },
    startButton: {
      paddingVertical: s(16),
      borderRadius: 12,
      alignItems: 'center',
    },
    startButtonActive: {
      backgroundColor: colors.crimson.core,
    },
    startButtonPressed: {
      backgroundColor: colors.crimson.deep,
    },
    startButtonDisabled: {
      backgroundColor: colors.ink.mid,
    },
    startButtonText: {
      color: colors.parchment.high,
      fontSize: s(18),
      fontWeight: 'bold',
    },

    /* ---- Edition selector ---- */
    editionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: s(8),
      gap: s(8),
    },
    editionLabel: {
      color: colors.parchment.mid,
      fontSize: s(13),
    },

    /* ---- Distribute row + veil toggle ---- */
    distributeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(10),
    },

    /* ---- Role exclude / mix button text (static base) ---- */
    roleSettingButtonText: {
      fontSize: s(13),
      fontWeight: '600',
    },

    /* ---- FlatList ---- */
    playerListContent: {
      paddingHorizontal: s(16),
    },

    /* ---- Player row ---- */
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: s(12),
      paddingHorizontal: s(12),
      borderBottomWidth: 1,
      borderBottomColor: colors.edge.hairline,
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playerName: {
      color: colors.parchment.high,
      fontSize: s(15),
    },
    travellerBadge: {
      marginLeft: s(6),
      fontSize: s(11),
      color: colors.bruise.core,
      backgroundColor: colors.bruise.deep,
      paddingHorizontal: s(5),
      paddingVertical: s(1),
      borderRadius: s(4),
      overflow: 'hidden',
    } as const,
    playerRoleContainer: {
      alignItems: 'flex-end',
    },

    /* ---- Drunk change button ---- */
    drunkChangeButton: {
      marginTop: s(4),
      paddingVertical: s(3),
      paddingHorizontal: s(8),
      backgroundColor: colors.ember.deep,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.ember.core,
    },
    drunkChangeText: {
      color: colors.ember.glow,
      fontSize: s(11),
      fontWeight: '600',
    },

    /* ---- 상세 설정 영역 (listContainer 내부) ---- */
    settingsScrollArea: {
      flex: 1,
    },
    settingsScrollContent: {
      padding: s(16),
      paddingBottom: s(8),
    },
    /* ---- 상세 설정 토글 버튼 ---- */
    settingsToggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s(6),
      paddingVertical: s(8),
      marginBottom: s(8),
    },
    settingsToggleLabel: {
      color: colors.parchment.mid,
      fontSize: s(13),
      fontWeight: '600',
    },
    settingsToggleChevron: {
      color: colors.parchment.low,
      fontSize: s(10),
    },

    /* ---- Footer advanced settings ---- */
    settingsGap: {
      gap: s(10),
    },
    settingsToggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.ink.mid,
      borderRadius: 8,
      paddingVertical: s(10),
      paddingHorizontal: s(12),
      borderWidth: 1,
      borderColor: colors.edge.hairline,
    },
    settingsDivider: {
      width: 1,
      backgroundColor: colors.edge.default,
    },
    clockSettingContainer: {
      backgroundColor: colors.ink.mid,
      borderRadius: 8,
      paddingVertical: s(10),
      paddingHorizontal: s(12),
      borderWidth: 1,
      borderColor: colors.edge.hairline,
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
    borderRadius: 6,
    backgroundColor: disabled
      ? colors.ink.mid
      : selected
        ? colors.twilight.deep
        : pressed
          ? colors.ink.rise
          : colors.ink.mid,
    borderWidth: 1,
    borderColor: disabled
      ? colors.edge.hairline
      : selected
        ? colors.twilight.core
        : colors.edge.default,
    opacity: disabled ? 0.5 : 1,
  }),
  editionButtonText: (
    selected: boolean,
    disabled: boolean,
    s: (v: number) => number,
  ) => ({
    color: disabled
      ? colors.parchment.ghost
      : selected
        ? colors.twilight.glow
        : colors.parchment.low,
    fontSize: s(13),
    fontWeight: '600' as const,
  }),
  aliveDot: (isAlive: boolean, s: (v: number) => number) => ({
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: isAlive ? colors.verdure.core : colors.crimson.core,
    marginRight: s(10),
  }),
  playerRoleText: (
    veiled: boolean,
    s: (v: number) => number,
    teamColor?: string,
  ) => ({
    color: veiled
      ? colors.parchment.ghost
      : (teamColor ?? colors.parchment.mid),
    fontSize: s(14),
  }),
  veilToggleButton: (veiled: boolean, s: (v: number) => number) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: s(6),
    paddingVertical: s(12),
    paddingHorizontal: s(10),
    backgroundColor: veiled ? colors.bruise.deep : colors.ink.mid,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: veiled ? colors.bruise.core : colors.edge.default,
  }),
  veilToggleEmoji: (veiled: boolean, s: (v: number) => number) => ({
    color: veiled ? colors.bruise.glow : colors.parchment.low,
    fontSize: s(13),
  }),
  veilToggleLabel: (veiled: boolean, s: (v: number) => number) => ({
    color: veiled ? colors.bruise.glow : colors.parchment.low,
    fontSize: s(12),
    fontWeight: '600' as const,
  }),
  roleSettingButtonTextColor: (hasItems: boolean, defaultColor: string) => ({
    color: hasItems ? defaultColor : colors.parchment.mid,
  }),
};

export const styles = createLobbyStyles(1);
