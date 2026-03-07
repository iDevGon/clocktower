import type { Player } from '@clocktower/shared';
import { Pressable, Text, View } from 'react-native';
import { styles } from './PlayerToken.styles';

const TEAM_BORDER_COLORS = {
  townsfolk: '#506aaa',
  outsider: '#3a8878',
  minion: '#b87838',
  demon: '#943c3c',
} as const;

const TEAM_BG_COLORS = {
  townsfolk: '#14161e',
  outsider: '#141a18',
  minion: '#1e1814',
  demon: '#1e1414',
} as const;

interface PlayerTokenProps {
  player: Player;
  onPress?: () => void;
}

export function PlayerToken({ player, onPress }: PlayerTokenProps) {
  const team = player.role?.team;
  const borderColor = team ? TEAM_BORDER_COLORS[team] : '#3a3a42';
  const bgColor = team ? TEAM_BG_COLORS[team] : '#1a1a1e';

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.token,
          {
            borderColor,
            backgroundColor: bgColor,
            opacity: player.isAlive ? 1 : 0.4,
          },
        ]}
      >
        <Text style={styles.name} numberOfLines={1}>
          {player.name}
        </Text>
        {player.role && (
          <Text style={styles.role} numberOfLines={1}>
            {player.role.name}
          </Text>
        )}
        {!player.isAlive && <Text style={styles.dead}>사망</Text>}
      </View>
    </Pressable>
  );
}

