import { colors, typography } from '@clocktower/ui';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { GameLogEntry } from '../stores/logStore';

const PHASE_LABELS: Record<string, string> = {
  setup: '준비',
  night: '밤',
  day: '낮',
  vote: '투표',
  ended: '종료',
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
}: HostDesktopConsoleFrameProps) {
  const latestLogs = [...logs].reverse().slice(0, logOpen ? 18 : 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>{topBar}</View>
      <View style={styles.body}>
        <View style={styles.leftRail}>
          <Text style={styles.railKicker}>STORYTELLER CONSOLE</Text>
          <Text style={styles.railTitle}>
            {day}일차 · {PHASE_LABELS[phase] ?? phase}
          </Text>
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
            <Text style={styles.shortcutLine}>Space · 밤 순서 진행</Text>
            <Text style={styles.shortcutLine}>N · 지목</Text>
            <Text style={styles.shortcutLine}>L · 로그</Text>
            <Text style={styles.shortcutLine}>W · 밀담</Text>
            <Text style={styles.shortcutLine}>1-9 · 플레이어 선택</Text>
            <Text style={styles.shortcutLine}>Esc · 닫기</Text>
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
        </View>

        <View style={styles.centerStage}>{grimoire}</View>

        <View style={styles.rightRail}>
          <View style={styles.rightPanel}>{rightPanel}</View>
          <View style={styles.phasePanel}>{phaseControls}</View>
          {hintBars}
        </View>
      </View>
      <View style={styles.footer}>{bottomBar}</View>
    </View>
  );
}

const arcane = colors.arcane;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: arcane.surface.base,
  },
  header: {
    borderBottomWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: arcane.surface.apparatus,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  leftRail: {
    width: 300,
    borderRightWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: arcane.surface.ledger,
    padding: 16,
    gap: 14,
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
    gap: 5,
  },
  panelTitle: {
    color: arcane.text.label,
    fontFamily: typography.fontFamily.bodyBold,
    fontSize: 12,
    marginBottom: 4,
  },
  shortcutLine: {
    color: arcane.text.primary,
    fontFamily: typography.fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
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
  },
  rightRail: {
    width: 390,
    borderLeftWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: arcane.surface.ledger,
  },
  rightPanel: {
    flex: 1,
    minHeight: 0,
  },
  phasePanel: {
    borderTopWidth: 1,
    borderColor: arcane.border.brassDim,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: arcane.border.brassDim,
    backgroundColor: arcane.surface.apparatus,
  },
});
