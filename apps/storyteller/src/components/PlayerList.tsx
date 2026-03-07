import type { Player } from '@clocktower/shared';
import { FlatList, Pressable, Text, View } from 'react-native';
import { styles } from './PlayerList.styles';

interface PlayerListProps {
  players: Player[];
  onPlayerPress?: (player: Player) => void;
}

export function PlayerList({ players, onPlayerPress }: PlayerListProps) {
  return (
    <FlatList
      data={players}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <Pressable onPress={() => onPlayerPress?.(item)} style={styles.row}>
          <View style={styles.leftGroup}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isAlive ? '#5a8068' : '#943c3c' },
              ]}
            />
            <Text style={styles.playerName}>{item.name}</Text>
          </View>
          {item.role && <Text style={styles.roleName}>{item.role.name}</Text>}
        </Pressable>
      )}
    />
  );
}

