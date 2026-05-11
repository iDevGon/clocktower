import { colors, typography } from '@clocktower/ui';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import {
  type GameLogEntry,
  type LogCategory,
  useLogStore,
} from '../../src/stores/logStore';

const PHASE_COLORS: Record<string, string> = {
  setup: colors.arcane.text.muted,
  night: colors.arcane.accent.sapphireLens,
  day: colors.arcane.text.label,
  vote: colors.arcane.action.bloodHighlight,
  ended: '#d7b7ef',
};

const CATEGORY_COLORS: Record<LogCategory, string> = {
  death: colors.arcane.action.bloodHighlight,
  ability: colors.arcane.accent.sapphireLens,
  default: colors.arcane.text.primary,
};

const PHASE_LABELS: Record<string, string> = {
  setup: '준비',
  night: '밤',
  day: '낮',
  vote: '투표',
  ended: '종료',
};

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function createLogStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.arcane.surface.base,
    },
    list: {
      padding: s(16),
      gap: s(8),
    },
    item: {
      flexDirection: 'row',
      alignItems: 'baseline',
      paddingVertical: s(10),
      paddingHorizontal: s(12),
      borderWidth: 1,
      borderColor: colors.arcane.border.parchment,
      borderRadius: 4,
      backgroundColor: colors.arcane.surface.apparatus,
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      width: s(120),
      flexShrink: 0,
    },
    time: {
      color: colors.arcane.text.dead,
      fontSize: s(11),
      fontFamily: typography.fontFamily.bodyMedium,
      fontVariant: ['tabular-nums'],
    },
    phase: {
      fontSize: s(11),
      fontFamily: typography.fontFamily.bodyBold,
    },
    message: {
      color: colors.arcane.text.primary,
      fontSize: s(13),
      lineHeight: s(19),
      fontFamily: typography.fontFamily.body,
      flex: 1,
    },
    empty: {
      color: colors.arcane.text.dead,
      fontSize: s(14),
      fontFamily: typography.fontFamily.body,
      textAlign: 'center',
      marginTop: s(40),
    },
  });
}

function LogItem({
  item,
  logStyles,
}: {
  item: GameLogEntry;
  logStyles: ReturnType<typeof createLogStyles>;
}) {
  const phaseColor = PHASE_COLORS[item.phase] ?? '#908e8a';
  const messageColor =
    CATEGORY_COLORS[item.category ?? 'default'] ?? CATEGORY_COLORS.default;
  return (
    <View style={logStyles.item}>
      <View style={logStyles.meta}>
        <Text style={logStyles.time}>{formatTime(item.timestamp)}</Text>
        <Text style={[logStyles.phase, { color: phaseColor }]}>
          {item.day > 0 ? `${item.day}일` : ''}{' '}
          {PHASE_LABELS[item.phase] ?? item.phase}
        </Text>
      </View>
      <Text style={[logStyles.message, { color: messageColor }]}>
        {item.message}
      </Text>
    </View>
  );
}

export default function LogScreen() {
  const logs = useLogStore((s) => s.logs);
  const reversed = [...logs].reverse();

  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const logStyles = useMemo(() => createLogStyles(scale), [scale]);

  return (
    <View style={logStyles.container}>
      {reversed.length === 0 ? (
        <Text style={logStyles.empty}>기록된 로그가 없습니다</Text>
      ) : (
        <FlatList
          data={reversed}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LogItem item={item} logStyles={logStyles} />
          )}
          contentContainerStyle={logStyles.list}
        />
      )}
    </View>
  );
}
