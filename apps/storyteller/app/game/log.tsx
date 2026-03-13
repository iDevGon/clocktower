import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import {
  type GameLogEntry,
  type LogCategory,
  useLogStore,
} from '../../src/stores/logStore';

const PHASE_COLORS: Record<string, string> = {
  setup: '#908e8a',
  night: '#8090c0',
  day: '#c4a050',
  vote: '#c47070',
  ended: '#6ab04c',
};

const CATEGORY_COLORS: Record<LogCategory, string> = {
  death: '#c47070',
  ability: '#6ab04c',
  default: '#e0ddd8',
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
      backgroundColor: '#121214',
    },
    list: {
      padding: s(16),
      gap: s(2),
    },
    item: {
      flexDirection: 'row',
      alignItems: 'baseline',
      paddingVertical: s(6),
      borderBottomWidth: 1,
      borderColor: '#1e1e22',
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(8),
      width: s(120),
      flexShrink: 0,
    },
    time: {
      color: '#5c5a58',
      fontSize: s(11),
      fontVariant: ['tabular-nums'],
    },
    phase: {
      fontSize: s(11),
      fontWeight: '600',
    },
    message: {
      color: '#e0ddd8',
      fontSize: s(13),
      flex: 1,
    },
    empty: {
      color: '#5c5a58',
      fontSize: s(14),
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
