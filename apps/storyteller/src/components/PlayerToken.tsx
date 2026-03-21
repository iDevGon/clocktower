import {
  getRoleById,
  PLAYER_STATUS_COLORS,
  PLAYER_STATUS_DESCRIPTIONS,
  PLAYER_STATUS_LABELS,
  type Player,
  type PlayerStatus,
  TEAM_COLORS,
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

export type VoteIndicator = 'guilty' | 'preselected_guilty' | 'nominee';

const VOTE_BORDER_COLORS: Record<VoteIndicator, string> = {
  guilty: '#e05050',
  preselected_guilty: '#e0505080',
  nominee: '#c43c3c',
};

const VOTE_GLOW_COLORS: Record<VoteIndicator, string> = {
  guilty: '#e05050',
  preselected_guilty: '#e0505060',
  nominee: '#c43c3c',
};

export interface BluffRole {
  id: string;
  name: string;
}

interface PlayerTokenProps {
  player: Player;
  statuses?: PlayerStatus[];
  size?: number;
  highlighted?: boolean;
  empathNeighbor?: boolean;
  voteIndicator?: VoteIndicator;
  isPreselected?: boolean;
  isExecutionCandidate?: boolean;
  hasNominated?: boolean;
  wasNominated?: boolean;
  memo?: string;
  bluffRoles?: BluffRole[];
  showBluffs?: boolean;
  onToggleBluffs?: () => void;
  onPress?: () => void;
}

export function PlayerToken({
  player,
  statuses,
  size,
  highlighted,
  empathNeighbor,
  voteIndicator,
  isPreselected,
  isExecutionCandidate,
  hasNominated,
  wasNominated,
  memo,
  bluffRoles,
  showBluffs,
  onToggleBluffs,
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
  const baseBorderColor = team ? TEAM_BORDER_COLORS[team] : '#3a3a42';
  const bgColor = team ? TEAM_BG_COLORS[team] : '#1a1a1e';

  // Vote state overrides border when active
  const hasVoteState = !!voteIndicator;
  const voteBorder = voteIndicator
    ? VOTE_BORDER_COLORS[voteIndicator]
    : undefined;
  const voteGlow = voteIndicator ? VOTE_GLOW_COLORS[voteIndicator] : undefined;

  // 사망자 중 투표권이 남아있으면 푸른 글로우
  const hasGhostVote = !player.isAlive && !player.deadVoteUsed;

  const borderColor = highlighted
    ? '#f5c542'
    : empathNeighbor
      ? '#2ecc71'
      : hasVoteState
        ? (voteBorder ?? baseBorderColor)
        : hasGhostVote
          ? '#5aa0d0'
          : baseBorderColor;

  const glowColor = highlighted
    ? '#f5c542'
    : empathNeighbor
      ? '#2ecc71'
      : hasVoteState
        ? (voteGlow ?? 'transparent')
        : hasGhostVote
          ? '#5aa0d0'
          : 'transparent';

  const hasGlow = highlighted || empathNeighbor || hasVoteState || hasGhostVote;
  const bw = highlighted || empathNeighbor || hasVoteState ? 3 : 2;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${player.name} 토큰`}
      accessibilityRole="button"
    >
      <View
        style={[
          styles.token,
          {
            width: s,
            height: s,
            borderColor,
            borderWidth: bw,
            backgroundColor: bgColor,
            opacity: player.isAlive ? 1 : 0.4,
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: hasGlow ? 0.8 : 0,
            shadowRadius: hasGlow ? 10 : 0,
            elevation: hasGlow ? 10 : 0,
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
            style={[
              styles.role,
              {
                fontSize: scaledFont.sm,
                color: team ? TEAM_COLORS[team] : '#908e8a',
              },
            ]}
            numberOfLines={1}
          >
            {player.role.name}
            {player.role.id === 'drunk' && player.drunkAs
              ? ` (${getRoleById(player.drunkAs)?.name ?? player.drunkAs})`
              : ''}
          </Text>
        )}
        {!player.isAlive && (
          <View style={styles.deadRow}>
            <Text style={[styles.dead, { fontSize: scaledFont.sm }]}>사망</Text>
          </View>
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
                accessibilityLabel={`${PLAYER_STATUS_LABELS[status]} 상태 정보`}
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
        {voteIndicator === 'guilty' && (
          <Text style={[styles.voteBadgeText, { fontSize: scaledFont.lg }]}>
            ✋🏻
          </Text>
        )}
        {voteIndicator !== 'guilty' &&
          (voteIndicator === 'preselected_guilty' || isPreselected) && (
            <Text
              style={[
                styles.voteBadgeText,
                { fontSize: scaledFont.md, opacity: 0.5 },
              ]}
            >
              ✋🏻?
            </Text>
          )}
        {isExecutionCandidate && (
          <View style={[styles.statusRow, { marginTop: 1 }]}>
            <View style={[styles.statusBadge, { backgroundColor: '#c43c3c' }]}>
              <Text style={[styles.statusText, { fontSize: scaledFont.xs }]}>
                처형 예정
              </Text>
            </View>
          </View>
        )}
        {hasNominated && (
          <Text style={[styles.nominationBadge, { fontSize: scaledFont.md }]}>
            👆
          </Text>
        )}
        {wasNominated && (
          <Text
            style={[styles.nominationTargetBadge, { fontSize: scaledFont.md }]}
          >
            🎯
          </Text>
        )}
        {memo && memo.length > 0 && (
          <Text style={[styles.memoBadge, { fontSize: scaledFont.sm }]}>
            📝
          </Text>
        )}
      </View>

      {bluffRoles && bluffRoles.length > 0 && (
        <View
          style={{
            position: 'absolute',
            top: s + 2,
            left: (s - s * 0.9) / 2,
            width: s * 0.9,
            alignItems: 'center',
            gap: 1,
          }}
        >
          {showBluffs ? (
            <>
              {bluffRoles.map((r) => (
                <View
                  key={r.id}
                  style={{
                    backgroundColor: '#1a1420',
                    borderWidth: 1,
                    borderColor: '#3a2a4a',
                    borderRadius: 3,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                  }}
                >
                  <Text
                    style={{
                      color: '#b090c0',
                      fontSize: Math.max(scaledFont.xs, 8),
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {r.name}
                  </Text>
                </View>
              ))}
              <Pressable
                onPress={onToggleBluffs}
                style={{
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                }}
              >
                <Text
                  style={{
                    color: '#6a5a7a',
                    fontSize: Math.max(scaledFont.xs, 8),
                  }}
                >
                  ▲ 숨기기
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={onToggleBluffs}
              style={{
                backgroundColor: '#1a1420',
                borderWidth: 1,
                borderColor: '#3a2a4a',
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: '#b090c0',
                  fontSize: Math.max(scaledFont.xs, 8),
                  fontWeight: '600',
                }}
              >
                블러프 ▼
              </Text>
            </Pressable>
          )}
        </View>
      )}

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
            accessibilityLabel="상태 정보 닫기"
          >
            <View
              style={[
                styles.tooltipBox,
                {
                  borderColor: PLAYER_STATUS_COLORS[tooltipStatus],
                },
              ]}
            >
              <Text
                style={[
                  styles.tooltipTitle,
                  {
                    color: PLAYER_STATUS_COLORS[tooltipStatus],
                  },
                ]}
              >
                {PLAYER_STATUS_LABELS[tooltipStatus]}
              </Text>
              <Text style={styles.tooltipDesc}>
                {PLAYER_STATUS_DESCRIPTIONS[tooltipStatus]}
              </Text>
            </View>
          </Pressable>
        </Modal>
      )}
    </Pressable>
  );
}
