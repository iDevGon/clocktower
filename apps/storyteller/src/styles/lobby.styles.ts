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

    /* ---- Edition selector ---- */
    editionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: s(8),
      gap: s(8),
    },
    editionLabel: {
      color: '#908e8a',
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
      borderBottomColor: '#2a2a2e',
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    playerName: {
      color: '#e0ddd8',
      fontSize: s(15),
    },
    playerRoleContainer: {
      alignItems: 'flex-end',
    },

    /* ---- Drunk change button ---- */
    drunkChangeButton: {
      marginTop: s(4),
      paddingVertical: s(3),
      paddingHorizontal: s(8),
      backgroundColor: '#3a2a18',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#b87838',
    },
    drunkChangeText: {
      color: '#e67e22',
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
      color: '#908e8a',
      fontSize: s(13),
      fontWeight: '600',
    },
    settingsToggleChevron: {
      color: '#706e6a',
      fontSize: s(10),
    },

    /* ---- Footer advanced settings ---- */
    settingsGap: {
      gap: s(10),
    },
    settingsToggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: '#1a1a1e',
      borderRadius: 8,
      paddingVertical: s(10),
      paddingHorizontal: s(12),
      borderWidth: 1,
      borderColor: '#2a2a2e',
    },
    settingsDivider: {
      width: 1,
      backgroundColor: '#2e2e34',
    },
    clockSettingContainer: {
      backgroundColor: '#1a1a1e',
      borderRadius: 8,
      paddingVertical: s(10),
      paddingHorizontal: s(12),
      borderWidth: 1,
      borderColor: '#2a2a2e',
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
      ? '#1a1a1e'
      : selected
        ? '#2a3a5c'
        : pressed
          ? '#2a2a30'
          : '#242428',
    borderWidth: 1,
    borderColor: disabled ? '#2a2a2e' : selected ? '#4a6a9c' : '#3a3a3e',
    opacity: disabled ? 0.5 : 1,
  }),
  editionButtonText: (
    selected: boolean,
    disabled: boolean,
    s: (v: number) => number,
  ) => ({
    color: disabled ? '#4a4a4e' : selected ? '#8ab4f8' : '#706e6a',
    fontSize: s(13),
    fontWeight: '600' as const,
  }),
  aliveDot: (isAlive: boolean, s: (v: number) => number) => ({
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: isAlive ? '#5a8068' : '#943c3c',
    marginRight: s(10),
  }),
  playerRoleText: (veiled: boolean, s: (v: number) => number) => ({
    color: veiled ? '#4a4a4e' : '#908e8a',
    fontSize: s(14),
  }),
  veilToggleButton: (veiled: boolean, s: (v: number) => number) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: s(6),
    paddingVertical: s(12),
    paddingHorizontal: s(10),
    backgroundColor: veiled ? '#3a2a5c' : '#1e1e22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: veiled ? '#7c6caa' : '#3a3a3e',
  }),
  veilToggleEmoji: (veiled: boolean, s: (v: number) => number) => ({
    color: veiled ? '#c4b0ee' : '#706e6a',
    fontSize: s(13),
  }),
  veilToggleLabel: (veiled: boolean, s: (v: number) => number) => ({
    color: veiled ? '#c4b0ee' : '#706e6a',
    fontSize: s(12),
    fontWeight: '600' as const,
  }),
  roleSettingButtonTextColor: (hasItems: boolean, defaultColor: string) => ({
    color: hasItems ? defaultColor : '#908e8a',
  }),
};

export const styles = createLobbyStyles(1);
