import { TROUBLE_BREWING_ROLES } from '@clocktower/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useGameActions } from '../../src/hooks/useGameActions';
import { styles } from '../../src/styles/assign-role.styles';

const TEAM_LABEL_COLORS = {
  townsfolk: '#7090c4',
  outsider: '#50a090',
  minion: '#c48850',
  demon: '#b85c5c',
} as const;

const TEAM_NAMES = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
} as const;

const TEAM_BORDER_COLORS = {
  townsfolk: '#506aaa',
  outsider: '#3a8878',
  minion: '#b87838',
  demon: '#943c3c',
} as const;

export default function AssignRoleScreen() {
  const router = useRouter();
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const { assignRole } = useGameActions();

  const handleAssign = (roleId: string) => {
    if (playerId) {
      assignRole(playerId, roleId);
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={TROUBLE_BREWING_ROLES}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleAssign(item.id)}
            style={({ pressed }) => [
              styles.roleItem,
              { borderLeftColor: TEAM_BORDER_COLORS[item.team] },
              pressed && styles.roleItemPressed,
            ]}
          >
            <View style={styles.roleHeader}>
              <Text style={styles.roleName}>{item.name}</Text>
              <Text
                style={[
                  styles.teamLabel,
                  { color: TEAM_LABEL_COLORS[item.team] },
                ]}
              >
                {TEAM_NAMES[item.team]}
              </Text>
            </View>
            <Text style={styles.abilityText}>{item.ability}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
