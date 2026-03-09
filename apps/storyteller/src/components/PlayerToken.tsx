import {
  PLAYER_STATUS_COLORS,
  PLAYER_STATUS_LABELS,
  type Player,
  type PlayerStatus,
  getRoleById,
} from '@clocktower/shared';
import { Pressable, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
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
  statuses?: PlayerStatus[];
  size?: number;
  highlighted?: boolean;
  onPress?: () => void;
}

export function PlayerToken({
  player,
  statuses,
  size,
  highlighted,
  onPress,
}: PlayerTokenProps) {
  const { tokenSize, fontSize } = useResponsive();
  const s = size ?? tokenSize;
  const sizeRatio = s / tokenSize;
  const scaledFont = {
    xs: Math.round(fontSize.xs * sizeRatio),
    sm: Math.round(fontSize.sm * sizeRatio),
    md: Math.round(fontSize.md * sizeRatio),
    lg: Math.round(fontSize.lg * sizeRatio),
    xl: Math.round(fontSize.xl * sizeRatio),
  };
  const team = player.role?.team;
  const borderColor = team ? TEAM_BORDER_COLORS[team] : '#3a3a42';
  const bgColor = team ? TEAM_BG_COLORS[team] : '#1a1a1e';

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.token,
          {
            width: s,
            height: s,
            borderColor: highlighted ? '#f5c542' : borderColor,
            borderWidth: highlighted ? 3 : 2,
            backgroundColor: bgColor,
            opacity: player.isAlive ? 1 : 0.4,
            shadowColor: highlighted ? '#f5c542' : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: highlighted ? 0.8 : 0,
            shadowRadius: highlighted ? 10 : 0,
            elevation: highlighted ? 10 : 0,
          },
        ]}
      >
        <Text
          style={[styles.name, { fontSize: scaledFont.md }]}
          numberOfLines={1}
        >
          {player.name}
        </Text>
        {player.role && (
          <Text
            style={[styles.role, { fontSize: scaledFont.sm }]}
            numberOfLines={1}
          >
            {player.role.name}
            {player.role.id === 'drunk' && player.drunkAs
              ? ` (${getRoleById(player.drunkAs)?.name ?? player.drunkAs})`
              : ''}
          </Text>
        )}
        {!player.isAlive && (
          <Text style={[styles.dead, { fontSize: scaledFont.sm }]}>사망</Text>
        )}
        {statuses && statuses.length > 0 && (
          <View style={styles.statusRow}>
            {statuses.map((status) => (
              <View
                key={status}
                style={[
                  styles.statusBadge,
                  { backgroundColor: PLAYER_STATUS_COLORS[status] },
                ]}
              >
                <Text style={[styles.statusText, { fontSize: scaledFont.xs }]}>
                  {PLAYER_STATUS_LABELS[status]}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}
