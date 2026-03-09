import {
  PLAYER_STATUS_COLORS,
  PLAYER_STATUS_DESCRIPTIONS,
  PLAYER_STATUS_LABELS,
  type Player,
  type PlayerStatus,
  getRoleById,
} from '@clocktower/shared';
import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
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
  butlerMasterName?: string;
  onPress?: () => void;
}

export function PlayerToken({
  player,
  statuses,
  size,
  highlighted,
  butlerMasterName,
  onPress,
}: PlayerTokenProps) {
  const [tooltipStatus, setTooltipStatus] = useState<PlayerStatus | null>(null);

  const showTooltip = useCallback((status: PlayerStatus) => {
    setTooltipStatus(status);
  }, []);

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
              <Pressable
                key={status}
                onPress={(e) => {
                  e.stopPropagation?.();
                  showTooltip(status);
                }}
                style={[
                  styles.statusBadge,
                  { backgroundColor: PLAYER_STATUS_COLORS[status] },
                ]}
              >
                <Text style={[styles.statusText, { fontSize: scaledFont.xs }]}>
                  {PLAYER_STATUS_LABELS[status]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
        {butlerMasterName && (
          <View style={[styles.statusRow, { marginTop: 1 }]}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                setTooltipStatus('butler_master' as PlayerStatus);
              }}
              style={[styles.statusBadge, { backgroundColor: '#2c3e50' }]}
            >
              <Text style={[styles.statusText, { fontSize: scaledFont.xs }]}>
                주인: {butlerMasterName}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {tooltipStatus && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setTooltipStatus(null)}
        >
          <Pressable
            style={styles.tooltipOverlay}
            onPress={() => setTooltipStatus(null)}
          >
            <View style={[styles.tooltipBox, {
              borderColor: tooltipStatus === 'butler_master' as string
                ? '#2c3e50'
                : PLAYER_STATUS_COLORS[tooltipStatus],
            }]}>
              <Text style={[styles.tooltipTitle, {
                color: tooltipStatus === 'butler_master' as string
                  ? '#5a8aaa'
                  : PLAYER_STATUS_COLORS[tooltipStatus],
              }]}>
                {tooltipStatus === 'butler_master' as string
                  ? `주인: ${butlerMasterName}`
                  : PLAYER_STATUS_LABELS[tooltipStatus]}
              </Text>
              <Text style={styles.tooltipDesc}>
                {tooltipStatus === 'butler_master' as string
                  ? '집사의 주인. 이 주인이 투표해야만 집사도 투표할 수 있습니다.'
                  : PLAYER_STATUS_DESCRIPTIONS[tooltipStatus]}
              </Text>
            </View>
          </Pressable>
        </Modal>
      )}
    </Pressable>
  );
}
