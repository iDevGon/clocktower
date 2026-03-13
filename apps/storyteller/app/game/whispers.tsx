import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useGameStore } from '../../src/stores/gameStore';

function createWhisperStyles(scale: number) {
  const s = (v: number) => Math.round(v * scale);
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#121214',
    },
    list: {
      padding: s(16),
      gap: s(8),
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s(12),
      backgroundColor: '#1a1a1e',
      borderWidth: 1,
      borderColor: '#2a3d2a',
      borderRadius: 8,
      paddingHorizontal: s(16),
      paddingVertical: s(12),
    },
    player: {
      color: '#e0ddd8',
      fontSize: s(16),
      fontWeight: '600',
    },
    arrow: {
      color: '#6a8a6a',
      fontSize: s(16),
    },
    empty: {
      color: '#5c5a58',
      fontSize: s(14),
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
