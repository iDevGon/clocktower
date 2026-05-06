import {
  getRoleById,
  PLAYER_STATUS_COLORS,
  PLAYER_STATUS_DESCRIPTIONS,
  PLAYER_STATUS_LABELS,
  type Player,
  type PlayerStatus,
  TEAM_COLORS,
} from '@clocktower/shared';
import { colors } from '@clocktower/ui';
import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { styles } from './PlayerToken.styles';

const TEAM_BORDER_COLORS = {
  townsfolk: colors.arcane.accent.prussianBlue,
  outsider: colors.arcane.border.parchment,
  minion: colors.arcane.border.brass,
  demon: colors.arcane.action.blood,
  traveller: colors.team.traveller,
} as const;

const TEAM_BG_COLORS = {
  townsfolk: colors.arcane.accent.midnightInk,
  outsider: colors.arcane.surface.ledger,
  minion: colors.arcane.surface.parchment,
  demon: colors.arcane.surface.apparatus,
  traveller: '#1b1224',
} as const;

export type VoteIndicator = 'guilty' | 'preselected_guilty' | 'nominee';

const VOTE_BORDER_COLORS: Record<VoteIndicator, string> = {
  guilty: colors.arcane.action.bloodHighlight,
  preselected_guilty: `${colors.arcane.action.bloodHighlight}80`,
  nominee: colors.arcane.action.blood,
};

const VOTE_GLOW_COLORS: Record<VoteIndicator, string> = {
  guilty: colors.arcane.action.bloodHighlight,
  preselected_guilty: `${colors.arcane.action.bloodHighlight}60`,
  nominee: colors.arcane.action.blood,
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
  /** 토큰이 화면 하반부에 위치하면 블러프를 위쪽에 표시 */
  isBottomHalf?: boolean;
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
  isBottomHalf,
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
  const baseBorderColor = team
    ? TEAM_BORDER_COLORS[team]
    : colors.arcane.border.brassDim;
  const bgColor = team ? TEAM_BG_COLORS[team] : colors.arcane.surface.raised;

  // Vote state overrides border when active
  const hasVoteState = !!voteIndicator;
  const voteBorder = voteIndicator
    ? VOTE_BORDER_COLORS[voteIndicator]
    : undefined;
  const voteGlow = voteIndicator ? VOTE_GLOW_COLORS[voteIndicator] : undefined;

  // 사망자 중 투표권이 남아있으면 푸른 글로우
  const hasGhostVote = !player.isAlive && !player.deadVoteUsed;

  const borderColor = highlighted
    ? colors.arcane.border.brass
    : empathNeighbor
      ? '#2ecc71'
      : hasVoteState
        ? (voteBorder ?? baseBorderColor)
        : hasGhostVote
          ? colors.arcane.accent.sapphireLens
          : baseBorderColor;

  const glowColor = highlighted
    ? colors.arcane.border.brass
    : empathNeighbor
      ? '#2ecc71'
      : hasVoteState
        ? (voteGlow ?? 'transparent')
        : hasGhostVote
          ? colors.arcane.accent.sapphireLens
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
        <View style={[styles.innerRing, { borderColor }]} />
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
                color: team ? TEAM_COLORS[team] : colors.arcane.text.muted,
              },
            ]}
            numberOfLines={1}
          >
            {player.isTraveller
              ? `${player.role.name} (${player.travellerAlignment === 'evil' ? '악' : '선'})`
              : player.role.name}
            {player.role.id === 'drunk' && player.drunkAs
              ? ` (${getRoleById(player.drunkAs)?.name ?? player.drunkAs})`
              : ''}
          </Text>
        )}
        {player.isTraveller && !player.role && (
          <Text
            style={[
              styles.role,
              {
                fontSize: scaledFont.sm,
                color: colors.team.traveller,
              },
            ]}
            numberOfLines={1}
          >
            여행자 (미배정)
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
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: colors.arcane.action.blood },
              ]}
            >
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
            ...(isBottomHalf ? { bottom: s + 2 } : { top: s + 2 }),
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
