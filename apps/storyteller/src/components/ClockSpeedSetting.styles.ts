import { Platform, StyleSheet } from 'react-native';

const THUMB_SIZE = 16;
const TRACK_H = 3;

export function createClockSpeedSettingStyles(s: (v: number) => number) {
  return StyleSheet.create({
    container: {
      gap: s(12),
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      color: '#908e8a',
      fontSize: s(12),
      fontWeight: '600',
    },
    valueText: {
      color: '#8ab4f8',
      fontSize: s(13),
      fontWeight: '700',
    },
    valueTextOff: {
      color: '#e08080',
    },

    /* ---- 트랙 배경 (셀 중앙 ~ 셀 중앙) ---- */
    trackWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: THUMB_SIZE / 2 - TRACK_H / 2,
      height: TRACK_H,
      zIndex: 0,
    },
    trackBg: {
      position: 'absolute',
      top: 0,
      height: TRACK_H,
      borderRadius: TRACK_H / 2,
      backgroundColor: '#3a3a3e',
    },
    trackFill: {
      position: 'absolute',
      top: 0,
      height: TRACK_H,
      borderRadius: TRACK_H / 2,
    },

    /* ---- 셀 그리드 ---- */
    cellRow: {
      flexDirection: 'row',
    },
    cell: {
      flex: 1,
      alignItems: 'center',
      zIndex: 1,
      gap: s(6),
    },

    /* ---- Thumb ---- */
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
        },
        android: { elevation: 3 },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 2,
        },
      }),
    },

    /* ---- 눈금 ---- */
    tickMark: {
      width: 1,
      height: THUMB_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
      // 눈금선: 가운데 일부만
    },
    tickLabel: {
      color: '#4a4a4e',
      fontSize: s(8),
      textAlign: 'center',
    },
    tickLabelActive: {
      color: '#8ab4f8',
      fontWeight: '600',
    },
    tickLabelOff: {
      color: '#e08080',
      fontWeight: '600',
    },
  });
}
