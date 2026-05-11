import { colors, typography } from '@clocktower/ui';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useGameStore } from '../../src/stores/gameStore';

function createWhisperStyles(scale: number) {
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
      alignItems: 'center',
      gap: s(12),
      backgroundColor: colors.arcane.surface.apparatus,
      borderWidth: 1,
      borderColor: colors.arcane.border.parchment,
      borderRadius: 4,
      paddingHorizontal: s(16),
      paddingVertical: s(12),
    },
    player: {
      color: colors.arcane.text.strong,
      fontSize: s(16),
      fontFamily: typography.fontFamily.bodyBold,
    },
    arrow: {
      color: colors.arcane.text.label,
      fontSize: s(16),
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

export default function WhispersScreen() {
  const activeWhispers = useGameStore((s) => s.activeWhispers);

  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const ws = useMemo(() => createWhisperStyles(scale), [scale]);

  return (
    <View style={ws.container}>
      {activeWhispers.length === 0 ? (
        <Text style={ws.empty}>진행 중인 밀담이 없습니다</Text>
      ) : (
        <FlatList
          data={activeWhispers}
          keyExtractor={(w) => w.conversationId}
          contentContainerStyle={ws.list}
          renderItem={({ item }) => (
            <View style={ws.item}>
              {item.participantNames.map((name, i) => (
                <View
                  key={item.participantIds[i]}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  {i > 0 && <Text style={ws.arrow}> ↔ </Text>}
                  <Text style={ws.player}>{name}</Text>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}
