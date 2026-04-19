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
import Svg, { Path } from 'react-native-svg';
import { useResponsive } from '../hooks/useResponsive';
import { styles } from './PlayerToken.styles';

const TEAM_INK_BG = colors.teamInk;

export type VoteIndicator = 'guilty' | 'preselected_guilty' | 'nominee';

const VOTE_BORDER_COLORS: Record<VoteIndicator, string> = {
  guilty: colors.crimson.glow,
  preselected_guilty: `${colors.crimson.glow}80`,
  nominee: colors.crimson.core,
};

const VOTE_GLOW_COLORS: Record<VoteIndicator, string> = {
  guilty: colors.crimson.glow,
  preselected_guilty: `${colors.crimson.glow}60`,
  nominee: colors.crimson.core,
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
  const bgColor = team ? TEAM_INK_BG[team] : colors.ink.mid;

  // 투표 상태 활성 시 보더 오버라이드
  const hasVoteState = !!voteIndicator;
  const voteBorder = voteIndicator
    ? VOTE_BORDER_COLORS[voteIndicator]
    : undefined;
  const voteGlow = voteIndicator ? VOTE_GLOW_COLORS[voteIndicator] : undefined;

  // 사망자 중 투표권이 남아있으면 twilight 글로우
  const hasGhostVote = !player.isAlive && !player.deadVoteUsed;

  // 기본 보더 = 금박, 하이라이트/이웃/투표 상태에서만 색상 변경
  const borderColor = highlighted
    ? colors.ember.glow
    : empathNeighbor
      ? colors.verdure.glow
      : hasVoteState
        ? (voteBorder ?? colors.edge.gilt)
        : hasGhostVote
          ? colors.twilight.glow
          : colors.edge.gilt;

  const glowColor = highlighted
    ? colors.ember.glow
    : empathNeighbor
      ? colors.verdure.glow
      : hasVoteState
        ? (voteGlow ?? 'transparent')
        : hasGhostVote
          ? colors.twilight.glow
          : 'transparent';

  const hasGlow = highlighted || empathNeighbor || hasVoteState || hasGhostVote;
  const bw = highlighted || empathNeighbor || hasVoteState ? 2 : 1;

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
            opacity: player.isAlive ? 1 : 0.55,
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: hasGlow ? 0.7 : 0,
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
                color: team ? TEAM_COLORS[team] : colors.parchment.mid,
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

        {/* 사망 = 잉크 X 스트로크 */}
        {!player.isAlive ? (
          <View
            style={[styles.deadStroke, { width: s, height: s }]}
            pointerEvents="none"
          >
            <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
              <Path
                d={`M${s * 0.2},${s * 0.2} L${s * 0.8},${s * 0.8} M${s * 0.8},${s * 0.2} L${s * 0.2},${s * 0.8}`}
                stroke={colors.crimson.glow}
                strokeWidth={Math.max(2, s * 0.04)}
                strokeLinecap="round"
                opacity={0.85}
              />
            </Svg>
          </View>
        ) : null}

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
                { backgroundColor: colors.crimson.core },
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
                    backgroundColor: colors.ink.rise,
                    borderWidth: 1,
                    borderColor: colors.bruise.core,
                    borderRadius: 3,
                    paddingHorizontal: 4,
                    paddingVertical: 1,
                  }}
                >
                  <Text
                    style={{
                      color: colors.bruise.glow,
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
                    color: colors.parchment.low,
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
                backgroundColor: colors.ink.rise,
                borderWidth: 1,
                borderColor: colors.bruise.core,
                borderRadius: 3,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: colors.bruise.glow,
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
