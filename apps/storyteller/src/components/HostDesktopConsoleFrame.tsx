import { colors, typography, useReducedMotion } from '@clocktower/ui';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { GameLogEntry } from '../stores/logStore';
import {
  getHostDesktopRailLayout,
  getVoteFocusCenterProgress,
  HOST_DESKTOP_RAIL_TOGGLE,
  VOTE_FOCUS_CHROME,
} from './HostDesktopConsoleFrame.layout';

const arcane = colors.arcane;

const PHASE_LABELS: Record<string, string> = {
  setup: '준비',
  night: '밤',
  day: '낮',
  vote: '투표',
  ended: '종료',
};

const SHORTCUTS = [
  ['Space', '밤 순서 진행'],
  ['N', '지목'],
  ['L', '로그'],
  ['W', '밀담'],
  ['1-9', '플레이어 선택'],
  ['Esc', '닫기'],
] as const;

const VOTE_FOCUS_EASING = Easing.bezier(0.22, 1, 0.36, 1);

const PHASE_THEMES: Record<
  string,
  {
    base: string;
    rail: string;
    panel: string;
    stage: string;
    border: string;
    accent: string;
  }
> = {
  setup: {
    base: arcane.surface.base,
    rail: arcane.surface.ledger,
    panel: arcane.surface.apparatus,
    stage: arcane.surface.base,
    border: arcane.border.brassDim,
    accent: arcane.text.label,
  },
  night: {
    base: '#07101e',
    rail: '#0d1626',
    panel: '#10182f',
    stage: '#060d1a',
    border: '#2f4f8f',
    accent: '#8fb0f7',
  },
  day: {
    base: '#16110c',
    rail: '#211911',
    panel: '#28211a',
    stage: '#14100b',
    border: arcane.border.brass,
    accent: colors.phase.day,
  },
  vote: {
    base: '#170809',
    rail: '#25100c',
    panel: '#32150f',
    stage: '#130608',
    border: '#8d3529',
    accent: '#e48a5e',
  },
  ended: {
    base: '#100b10',
    rail: '#1d151c',
    panel: '#241926',
    stage: '#0d090e',
    border: '#725b85',
    accent: '#d7b7ef',
  },
};

interface HostDesktopConsoleFrameProps {
  day: number;
  phase: string;
  playerCount: number;
  aliveCount: number;
  activeWhispersCount: number;
  unreadCount: number;
  topBar: ReactNode;
  grimoire: ReactNode;
  rightPanel?: ReactNode;
  phaseControls: ReactNode;
  hintBars?: ReactNode;
  bottomBar: ReactNode;
  logOpen: boolean;
  logs: GameLogEntry[];
  isVoteFocusMode?: boolean;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

export function HostDesktopConsoleFrame({
  day,
  phase,
  playerCount,
  aliveCount,
  activeWhispersCount,
  unreadCount,
  topBar,
  grimoire,
  rightPanel,
  phaseControls,
  hintBars,
  bottomBar,
  logOpen,
  logs,
  isVoteFocusMode = false,
}: HostDesktopConsoleFrameProps) {
  const reduced = useReducedMotion();
  const latestLogs = [...logs].reverse().slice(0, logOpen ? 18 : 5);
  const phaseTheme = PHASE_THEMES[phase] ?? PHASE_THEMES.setup;
  const hasRightPanel = !!rightPanel;
  const [isLeftRailHidden, setLeftRailHidden] = useState(false);
  const [isRightRailHidden, setRightRailHidden] = useState(false);
  const focusProgress = useSharedValue(isVoteFocusMode ? 1 : 0);
  const leftRailHiddenProgress = useSharedValue(0);
  const rightRailHiddenProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(isVoteFocusMode ? 1 : 0, {
      duration: reduced ? 0 : 460,
      easing: VOTE_FOCUS_EASING,
    });
  }, [focusProgress, isVoteFocusMode, reduced]);

  useEffect(() => {
    leftRailHiddenProgress.value = withTiming(isLeftRailHidden ? 1 : 0, {
      duration: reduced ? 0 : HOST_DESKTOP_RAIL_TOGGLE.animationDurationMs,
      easing: VOTE_FOCUS_EASING,
    });
  }, [isLeftRailHidden, leftRailHiddenProgress, reduced]);

  useEffect(() => {
    rightRailHiddenProgress.value = withTiming(isRightRailHidden ? 1 : 0, {
      duration: reduced ? 0 : HOST_DESKTOP_RAIL_TOGGLE.animationDurationMs,
      easing: VOTE_FOCUS_EASING,
    });
  }, [isRightRailHidden, reduced, rightRailHiddenProgress]);

  const headerFocusStyle = useAnimatedStyle(() => ({
    opacity: 1 - focusProgress.value * 0.92,
    transform: [
      { translateY: VOTE_FOCUS_CHROME.headerOffset * focusProgress.value },
    ],
  }));

  const footerFocusStyle = useAnimatedStyle(() => ({
    opacity: 1 - focusProgress.value * 0.92,
    transform: [
      { translateY: VOTE_FOCUS_CHROME.footerOffset * focusProgress.value },
    ],
  }));

  const leftRailFocusStyle = useAnimatedStyle(() => {
    const layout = getHostDesktopRailLayout({
      voteFocusProgress: focusProgress.value,
      leftRailHiddenProgress: leftRailHiddenProgress.value,
      rightRailHiddenProgress: rightRailHiddenProgress.value,
    });
    return {
      opacity: 1 - focusProgress.value * 0.88,
      transform: layout.leftRail.transform,
    };
  });

  const rightRailFocusStyle = useAnimatedStyle(() => {
    const layout = getHostDesktopRailLayout({
      voteFocusProgress: focusProgress.value,
      leftRailHiddenProgress: leftRailHiddenProgress.value,
      rightRailHiddenProgress: rightRailHiddenProgress.value,
    });
    return {
      opacity: 1 - focusProgress.value * 0.88,
      transform: layout.rightRail.transform,
    };
  });

  const centerStageFocusStyle = useAnimatedStyle(() => {
    const layout = getHostDesktopRailLayout({
      voteFocusProgress: focusProgress.value,
      leftRailHiddenProgress: leftRailHiddenProgress.value,
      rightRailHiddenProgress: rightRailHiddenProgress.value,
    });
    const centerProgress = getVoteFocusCenterProgress(focusProgress.value);
    return {
      marginLeft: layout.centerStage.marginLeft,
      marginRight: layout.centerStage.marginRight,
      transform: [{ scale: 1 + centerProgress * 0.012 }],
    };
  });

  const leftRevealHandleStyle = useAnimatedStyle(() => ({
    opacity: leftRailHiddenProgress.value * (1 - focusProgress.value),
    transform: [
      {
        translateX:
          -HOST_DESKTOP_RAIL_TOGGLE.revealHandleWidth *
          (1 - leftRailHiddenProgress.value),
      },
    ],
  }));

  const rightRevealHandleStyle = useAnimatedStyle(() => ({
    opacity: rightRailHiddenProgress.value * (1 - focusProgress.value),
    transform: [
      {
        translateX:
          HOST_DESKTOP_RAIL_TOGGLE.revealHandleWidth *
          (1 - rightRailHiddenProgress.value),
      },
    ],
  }));

  return (
    <View style={[styles.container, { backgroundColor: phaseTheme.base }]}>
      <Animated.View
        pointerEvents={isVoteFocusMode ? 'none' : 'auto'}
        style={[
          styles.header,
          {
            backgroundColor: phaseTheme.panel,
            borderColor: phaseTheme.border,
          },
          headerFocusStyle,
        ]}
      >
        {topBar}
      </Animated.View>
      <View style={styles.body}>
        <Animated.View
          pointerEvents={isVoteFocusMode ? 'none' : 'auto'}
          style={[
            styles.leftRail,
            {
              backgroundColor: phaseTheme.rail,
              borderColor: phaseTheme.border,
            },
            leftRailFocusStyle,
          ]}
        >
          <View style={styles.railHeaderRow}>
            <View style={styles.railHeadingGroup}>
              <Text style={[styles.railKicker, { color: phaseTheme.accent }]}>
                STORYTELLER CONSOLE
              </Text>
              <Text style={styles.railTitle}>
                {day}일차 · {PHASE_LABELS[phase] ?? phase}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="좌측 패널 숨기기"
              accessibilityRole="button"
              onPress={() => setLeftRailHidden(true)}
              style={[
                styles.railToggleButton,
                { borderColor: phaseTheme.accent },
              ]}
            >
              <Text
                style={[styles.railToggleText, { color: phaseTheme.accent }]}
              >
                ‹
              </Text>
            </Pressable>
          </View>
          <View style={styles.metricGrid}>
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>{aliveCount}</Text>
              <Text style={styles.metricLabel}>생존</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>{playerCount}</Text>
              <Text style={styles.metricLabel}>전체</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>{activeWhispersCount}</Text>
              <Text style={styles.metricLabel}>밀담</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>{unreadCount}</Text>
              <Text style={styles.metricLabel}>미확인</Text>
            </View>
          </View>
          <View style={styles.shortcutPanel}>
            <Text style={styles.panelTitle}>단축키</Text>
            <View style={styles.shortcutBadgeGrid}>
              {SHORTCUTS.map(([key, label]) => (
                <View key={key} style={styles.shortcutBadgeRow}>
                  <Text
                    style={[
                      styles.shortcutKeyBadge,
                      {
                        borderColor: phaseTheme.accent,
                        color: phaseTheme.accent,
                      },
                    ]}
                  >
                    {key}
                  </Text>
                  <Text style={styles.shortcutBadgeLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.logPanel}>
            <Text style={styles.panelTitle}>
              {logOpen ? '진행 기록' : '최근 기록'}
            </Text>
            {latestLogs.length === 0 ? (
              <Text style={styles.emptyText}>기록된 로그가 없습니다</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {latestLogs.map((log) => (
                  <View key={log.id} style={styles.logRow}>
                    <Text style={styles.logMeta}>
                      {formatTime(log.timestamp)} ·{' '}
                      {PHASE_LABELS[log.phase] ?? log.phase}
                    </Text>
                    <Text style={styles.logMessage}>{log.message}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.centerStage,
            { backgroundColor: phaseTheme.stage },
            centerStageFocusStyle,
          ]}
        >
          {grimoire}
        </Animated.View>

        <Animated.View
          pointerEvents={isVoteFocusMode ? 'none' : 'auto'}
          style={[
            styles.rightRail,
            {
              backgroundColor: phaseTheme.rail,
              borderColor: phaseTheme.border,
            },
            rightRailFocusStyle,
          ]}
        >
          <View style={styles.rightRailToolbar}>
            <Pressable
              accessibilityLabel="우측 패널 숨기기"
              accessibilityRole="button"
              onPress={() => setRightRailHidden(true)}
              style={[
                styles.railToggleButton,
                { borderColor: phaseTheme.accent },
              ]}
            >
              <Text
                style={[styles.railToggleText, { color: phaseTheme.accent }]}
              >
                ›
              </Text>
            </Pressable>
            <Text
              style={[
                styles.rightRailToolbarTitle,
                { color: phaseTheme.accent },
              ]}
            >
              진행 패널
            </Text>
          </View>
          {hasRightPanel && <View style={styles.rightPanel}>{rightPanel}</View>}
          <View
            style={[
              styles.phasePanel,
              { borderColor: phaseTheme.border },
              !hasRightPanel && styles.phasePanelDetached,
            ]}
          >
            {phaseControls}
          </View>
          {hintBars}
        </Animated.View>
        <Animated.View
          pointerEvents={isLeftRailHidden && !isVoteFocusMode ? 'auto' : 'none'}
          style={[
            styles.revealHandle,
            styles.leftRevealHandle,
            {
              borderColor: phaseTheme.border,
              backgroundColor: phaseTheme.panel,
            },
            leftRevealHandleStyle,
          ]}
        >
          <Pressable
            accessibilityLabel="좌측 패널 보이기"
            accessibilityRole="button"
            onPress={() => setLeftRailHidden(false)}
            style={styles.revealHandlePressable}
          >
            <Text
              style={[styles.revealHandleText, { color: phaseTheme.accent }]}
            >
              ›
            </Text>
          </Pressable>
        </Animated.View>
        <Animated.View
          pointerEvents={
            isRightRailHidden && !isVoteFocusMode ? 'auto' : 'none'
          }
          style={[
            styles.revealHandle,
            styles.rightRevealHandle,
            {
              borderColor: phaseTheme.border,
              backgroundColor: phaseTheme.panel,
            },
            rightRevealHandleStyle,
          ]}
        >
          <Pressable
            accessibilityLabel="우측 패널 보이기"
            accessibilityRole="button"
            onPress={() => setRightRailHidden(false)}
            style={styles.revealHandlePressable}
          >
            <Text
              style={[styles.revealHandleText, { color: phaseTheme.accent }]}
            >
              ‹
            </Text>
          </Pressable>
        </Animated.View>
      </View>
      <Animated.View
        pointerEvents={isVoteFocusMode ? 'none' : 'auto'}
        style={[
          styles.footer,
          { backgroundColor: phaseTheme.panel, borderColor: phaseTheme.border },
          footerFocusStyle,
        ]}
      >
        {bottomBar}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: arcane.surface.base,
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: arcane.surface.apparatus,
    zIndex: 30,
  },
  body: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  leftRail: {
    width: 288,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    borderRightWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: arcane.surface.ledger,
    padding: 16,
    gap: 14,
  },
  railHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  railHeadingGroup: {
    flex: 1,
    minWidth: 0,
  },
  railKicker: {
    color: arcane.text.label,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
  },
  railTitle: {
    color: arcane.text.strong,
    fontFamily: typography.fontFamily.display,
    fontSize: 24,
    lineHeight: 30,
  },
  railToggleButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: '#0000002e',
  },
  railToggleText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 22,
    lineHeight: 24,
    marginTop: -2,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCell: {
    width: '48%',
    borderWidth: 1,
    borderColor: arcane.border.parchment,
    backgroundColor: arcane.surface.apparatus,
    padding: 10,
  },
  metricValue: {
    color: arcane.text.strong,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    color: arcane.text.muted,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 11,
    marginTop: 2,
  },
  shortcutPanel: {
    borderWidth: 1,
    borderColor: arcane.border.parchment,
    backgroundColor: arcane.surface.apparatus,
    padding: 12,
    gap: 10,
  },
  panelTitle: {
    color: arcane.text.label,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 12,
    marginBottom: 4,
  },
  shortcutBadgeGrid: {
    gap: 7,
  },
  shortcutBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  shortcutKeyBadge: {
    minWidth: 52,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#00000026',
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
    textAlign: 'center',
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 11,
    lineHeight: 14,
  },
  shortcutBadgeLabel: {
    color: arcane.text.primary,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  logPanel: {
    flex: 1,
    minHeight: 130,
    borderWidth: 1,
    borderColor: arcane.border.parchment,
    backgroundColor: arcane.surface.apparatus,
    padding: 12,
  },
  emptyText: {
    color: arcane.text.dead,
    fontFamily: typography.fontFamily.body,
    fontSize: 12,
  },
  logRow: {
    borderTopWidth: 1,
    borderColor: '#3f2b16',
    paddingTop: 8,
    paddingBottom: 8,
  },
  logMeta: {
    color: arcane.text.dead,
    fontFamily: typography.fontFamily.bodyMedium,
    fontSize: 10,
    marginBottom: 3,
  },
  logMessage: {
    color: arcane.text.primary,
    fontFamily: typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
  },
  centerStage: {
    flex: 1,
    minWidth: 0,
    backgroundColor: arcane.surface.base,
    zIndex: 1,
  },
  rightRail: {
    width: 340,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    borderLeftWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: arcane.surface.ledger,
  },
  rightRailToolbar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: '#0000001f',
  },
  rightRailToolbarTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
  },
  rightPanel: {
    flex: 1,
    minHeight: 0,
  },
  phasePanel: {
    borderTopWidth: 1,
    borderColor: arcane.border.brassDim,
  },
  phasePanelDetached: {
    borderTopWidth: 0,
    flex: 1,
    minHeight: 0,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: arcane.surface.apparatus,
    zIndex: 30,
  },
  revealHandle: {
    position: 'absolute',
    top: 84,
    width: HOST_DESKTOP_RAIL_TOGGLE.revealHandleWidth,
    height: HOST_DESKTOP_RAIL_TOGGLE.revealHandleHeight,
    zIndex: 25,
    borderWidth: 1,
    shadowColor: arcane.border.brass,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 10,
  },
  leftRevealHandle: {
    left: 0,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    borderLeftWidth: 0,
  },
  rightRevealHandle: {
    right: 0,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderRightWidth: 0,
  },
  revealHandlePressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealHandleText: {
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 24,
    lineHeight: 28,
  },
});
