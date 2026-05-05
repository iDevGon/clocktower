import type {
  NightAction,
  NightFeedbackPayload,
  Player,
} from '@clocktower/shared';
import {
  getRoleById,
  hasPoisonStatus,
  NIGHT_ACTIONS,
  NIGHT_FEEDBACK,
} from '@clocktower/shared';
import { AbilityText } from '@clocktower/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { AnimatedBorderCard } from './AnimatedBorderCard';
import { FeedbackComposer } from './FeedbackComposer';
import { createNightActionLogStyles } from './NightActionLog.styles';
import {
  getAbilityTextStyle,
  getContentPadding,
  panelStyles,
} from './NightFeedbackPanel.styles';
import { TEAM_COLORS } from './NightOrderPanel.styles';

/** Map team → gradient colors for the animated border card */
const TEAM_CARD_COLORS: Record<
  string,
  { color: string; bgStart: string; bgMid: string; bgEnd: string }
> = {
  townsfolk: {
    color: '#5a8ec8',
    bgStart: '#161e34',
    bgMid: '#121828',
    bgEnd: '#0e1220',
  },
  outsider: {
    color: '#4aa890',
    bgStart: '#142222',
    bgMid: '#0e1c1a',
    bgEnd: '#0a1414',
  },
  minion: {
    color: '#c07040',
    bgStart: '#221812',
    bgMid: '#1a120e',
    bgEnd: '#140e0a',
  },
  demon: {
    color: '#c03848',
    bgStart: '#221014',
    bgMid: '#1a0c10',
    bgEnd: '#14080c',
  },
};

const FALLBACK_CARD_COLORS = TEAM_CARD_COLORS.townsfolk;

interface EmpathHint {
  neighbors: { id: string; name: string; isEvil: boolean }[];
  evilCount: number;
}

interface ChefHint {
  evilPairCount: number;
  evilPairNames: string[][];
}

interface NightFeedbackPanelProps {
  activeRoleId: string | null;
  players: Player[];
  nightActions?: NightAction[];
  empathHint?: EmpathHint;
  chefHint?: ChefHint;
  executedRoleName?: string;
  executedPlayerName?: string;
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
  onAllFeedbackSent?: () => void;
  /** 서버에서 전달받은 실제 wakeUp 대상 플레이어 ID 목록 */
  wakeUpTargetIds?: string[];
  /** 곡예사 추측의 정답 수 (playerId → count) */
  jugglerCorrectCount?: Record<string, number>;
}

/** Fisher-Yates shuffle (creates a new array) */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function NightFeedbackPanel({
  activeRoleId,
  players,
  nightActions,
  empathHint,
  chefHint,
  executedRoleName,
  executedPlayerName,
  onSendFeedback,
  onAllFeedbackSent,
  wakeUpTargetIds,
  jugglerCorrectCount,
}: NightFeedbackPanelProps) {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createNightActionLogStyles(scale), [scale]);

  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const prevRoleIdRef = useRef(activeRoleId);

  // 대상 플레이어 목록 (서버의 wakeUp 대상과 동기화)
  const targetPlayers = useMemo(() => {
    if (!activeRoleId) return [];
    // 서버가 알려준 wakeUp 대상이 있으면 그것만 사용 (순서 유지)
    if (wakeUpTargetIds && wakeUpTargetIds.length > 0) {
      return wakeUpTargetIds
        .map((id) => players.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => p != null);
    }
    // fallback: 서버 정보 없으면 기존 로직
    const isOnlyWhenDead = NIGHT_ACTIONS[activeRoleId]?.onlyWhenDead === true;
    const matched = players.filter(
      (p) =>
        (p.role?.id === activeRoleId ||
          (p.role?.id === 'drunk' && p.drunkAs === activeRoleId)) &&
        (isOnlyWhenDead
          ? !p.isAlive
          : p.isAlive || p.statuses.includes('vigormortis_retained')),
    );
    return shuffle(matched);
  }, [activeRoleId, players, wakeUpTargetIds]);

  // activeRoleId 변경 시 sent 상태 초기화
  if (prevRoleIdRef.current !== activeRoleId) {
    prevRoleIdRef.current = activeRoleId;
    setSentIds(new Set());
  }

  // 모든 피드백 전송 완료 시 부모에게 알림
  useEffect(() => {
    if (
      targetPlayers.length > 0 &&
      sentIds.size >= targetPlayers.length &&
      onAllFeedbackSent
    ) {
      onAllFeedbackSent();
    }
  }, [sentIds, targetPlayers, onAllFeedbackSent]);

  if (!activeRoleId) return null;

  const feedbackDef = NIGHT_FEEDBACK[activeRoleId];
  if (
    !feedbackDef ||
    feedbackDef.type === 'none' ||
    feedbackDef.type === 'grimoire'
  )
    return null;

  if (targetPlayers.length === 0) return null;

  // 아직 피드백 미전송인 첫 번째 플레이어를 현재 대상으로 표시
  const currentTarget = targetPlayers.find((p) => !sentIds.has(p.id));
  const allSent = !currentTarget;

  if (allSent) {
    return (
      <View style={styles.feedbackPanel}>
        <Text style={styles.feedbackPanelSent}>피드백 전송됨</Text>
      </View>
    );
  }

  const targetPlayer = currentTarget;
  const isDrunk = targetPlayer.role?.id === 'drunk';
  const isPoisoned = hasPoisonStatus(targetPlayer.statuses);
  const isMalfunctioning = isDrunk || isPoisoned;
  const role = getRoleById(activeRoleId);
  const team = role?.team ?? 'townsfolk';
  const cardColors = TEAM_CARD_COLORS[team] ?? FALLBACK_CARD_COLORS;
  const teamColor =
    TEAM_COLORS[team as keyof typeof TEAM_COLORS] ?? TEAM_COLORS.townsfolk;

  const handleSend = (fb: NightFeedbackPayload) => {
    // 점쟁이 yes_no 피드백에 지목 대상 이름 포함
    if (activeRoleId === 'fortune_teller' && fb.type === 'yes_no') {
      const ftAction =
        nightActions?.find(
          (a) =>
            a.roleId === 'fortune_teller' && a.playerId === targetPlayer.id,
        ) ?? nightActions?.find((a) => a.roleId === 'fortune_teller');
      if (ftAction) {
        const targetNames = ftAction.targets
          .map((id) => players.find((p) => p.id === id)?.name ?? id)
          .filter(Boolean);
        if (targetNames.length > 0) {
          fb = { ...fb, targetNames };
        }
      }
    }
    onSendFeedback(targetPlayer.id, fb);
    setSentIds((prev) => new Set(prev).add(targetPlayer.id));
  };

  const progressLabel =
    targetPlayers.length > 1
      ? `(${sentIds.size + 1}/${targetPlayers.length})`
      : '';

  return (
    <ScrollView style={panelStyles.scrollViewFlex}>
      <AnimatedBorderCard
        color={cardColors.color}
        bgStart={cardColors.bgStart}
        bgMid={cardColors.bgMid}
        bgEnd={cardColors.bgEnd}
        borderRadius={0}
        borderWidth={1.5}
      >
        <View style={getContentPadding(scale)}>
          <Text style={[styles.feedbackPanelTitle, { color: teamColor.text }]}>
            {role?.name ?? activeRoleId} → {targetPlayer.name} {progressLabel}
          </Text>

          {role?.ability && (
            <AbilityText
              text={role.ability}
              style={getAbilityTextStyle(scale)}
            />
          )}

          {isMalfunctioning && (
            <View
              style={[
                styles.drunkBanner,
                isPoisoned &&
                  !isDrunk && {
                    backgroundColor: 'rgba(155,89,182,0.15)',
                    borderColor: '#9b59b6',
                  },
              ]}
            >
              <Text
                style={[
                  styles.drunkBannerText,
                  isPoisoned && !isDrunk && { color: '#9b59b6' },
                ]}
              >
                {isDrunk
                  ? '⚠️ 주정뱅이 - 가짜 정보를 제공하세요'
                  : '⚠️ 중독 상태 - 가짜 정보를 제공하세요'}
              </Text>
            </View>
          )}

          {activeRoleId === 'fortune_teller' &&
            (() => {
              const ftAction =
                nightActions?.find(
                  (a) =>
                    a.roleId === 'fortune_teller' &&
                    a.playerId === targetPlayer.id,
                ) ?? nightActions?.find((a) => a.roleId === 'fortune_teller');
              if (!ftAction || ftAction.fortuneTellerResult === undefined)
                return null;
              const targetNames = ftAction.targets
                .map((id) => players.find((p) => p.id === id)?.name ?? id)
                .join(', ');
              const isPoisoned = hasPoisonStatus(targetPlayer.statuses);
              return (
                <View
                  style={[
                    styles.drunkBanner,
                    {
                      backgroundColor: ftAction.fortuneTellerResult
                        ? 'rgba(106,176,76,0.15)'
                        : 'rgba(184,92,92,0.15)',
                      borderColor: ftAction.fortuneTellerResult
                        ? '#6ab04c'
                        : '#b85c5c',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.drunkBannerText,
                      {
                        color: ftAction.fortuneTellerResult
                          ? '#6ab04c'
                          : '#b85c5c',
                      },
                    ]}
                  >
                    {targetNames} →{' '}
                    {ftAction.fortuneTellerResult
                      ? '예 (악마/저주 포함)'
                      : '아니오'}
                    {isPoisoned ? ' (중독 반전 적용됨)' : ''}
                  </Text>
                </View>
              );
            })()}

          {activeRoleId === 'empath' &&
            empathHint &&
            empathHint.neighbors.length > 0 && (
              <View
                style={[
                  styles.drunkBanner,
                  {
                    backgroundColor: 'rgba(46,204,113,0.15)',
                    borderColor: '#2ecc71',
                  },
                ]}
              >
                <Text style={[styles.drunkBannerText, { color: '#2ecc71' }]}>
                  이웃: {empathHint.neighbors.map((n) => n.name).join(', ')} →
                  악한 {empathHint.evilCount}명
                  {isMalfunctioning ? ' (가짜 정보 제공 필요)' : ''}
                </Text>
              </View>
            )}

          {activeRoleId === 'ravenkeeper' &&
            (() => {
              const rkAction =
                nightActions?.find(
                  (a) =>
                    a.roleId === 'ravenkeeper' &&
                    a.playerId === targetPlayer.id,
                ) ?? nightActions?.find((a) => a.roleId === 'ravenkeeper');
              if (!rkAction || rkAction.targets.length === 0) return null;
              const chosen = players.find((p) => p.id === rkAction.targets[0]);
              if (!chosen) return null;
              const chosenRole = chosen.role
                ? getRoleById(chosen.role.id)
                : null;
              return (
                <View
                  style={[
                    styles.drunkBanner,
                    {
                      backgroundColor: 'rgba(64,160,160,0.15)',
                      borderColor: '#40a0a0',
                    },
                  ]}
                >
                  <Text style={[styles.drunkBannerText, { color: '#40a0a0' }]}>
                    선택한 대상: {chosen.name} → {chosenRole?.name ?? '???'}
                    {isMalfunctioning ? ' (가짜 정보 제공 필요)' : ''}
                  </Text>
                </View>
              );
            })()}

          {activeRoleId === 'undertaker' && executedRoleName && (
            <View
              style={[
                styles.drunkBanner,
                {
                  backgroundColor: 'rgba(90,140,200,0.15)',
                  borderColor: '#5a8ec8',
                },
              ]}
            >
              <Text style={[styles.drunkBannerText, { color: '#5a8ec8' }]}>
                어젯밤 처형:{' '}
                {executedPlayerName ? `${executedPlayerName} → ` : ''}
                {executedRoleName}
                {isMalfunctioning ? ' (가짜 정보 제공 필요)' : ''}
              </Text>
            </View>
          )}

          {activeRoleId === 'chef' && chefHint && (
            <View
              style={[
                styles.drunkBanner,
                {
                  backgroundColor: 'rgba(230,126,34,0.15)',
                  borderColor: '#e67e22',
                },
              ]}
            >
              <Text style={[styles.drunkBannerText, { color: '#e67e22' }]}>
                인접 악한 쌍: {chefHint.evilPairCount}개
                {chefHint.evilPairNames.length > 0
                  ? ` (${chefHint.evilPairNames.map((pair) => pair.join('-')).join(', ')})`
                  : ''}
                {isMalfunctioning ? ' (가짜 정보 제공 필요)' : ''}
              </Text>
            </View>
          )}

          <FeedbackComposer
            feedbackDef={feedbackDef}
            players={players.filter((p) => p.id !== targetPlayer.id)}
            isDrunkUser={isMalfunctioning}
            action={nightActions?.find(
              (a) =>
                a.roleId === activeRoleId && a.playerId === targetPlayer.id,
            )}
            maxNumber={activeRoleId === 'juggler' ? 5 : undefined}
            suggestedNumber={
              isDrunk
                ? undefined
                : activeRoleId === 'empath' && empathHint
                  ? empathHint.evilCount
                  : activeRoleId === 'chef' && chefHint
                    ? chefHint.evilPairCount
                    : activeRoleId === 'juggler'
                      ? jugglerCorrectCount?.[targetPlayer.id]
                      : undefined
            }
            highlightedRoleName={
              activeRoleId === 'undertaker' && !isMalfunctioning
                ? executedRoleName
                : activeRoleId === 'ravenkeeper' && !isMalfunctioning
                  ? (() => {
                      const rkAction =
                        nightActions?.find(
                          (a) =>
                            a.roleId === 'ravenkeeper' &&
                            a.playerId === targetPlayer.id,
                        ) ??
                        nightActions?.find((a) => a.roleId === 'ravenkeeper');
                      if (!rkAction || rkAction.targets.length === 0)
                        return undefined;
                      const chosen = players.find(
                        (p) => p.id === rkAction.targets[0],
                      );
                      return chosen?.role
                        ? getRoleById(chosen.role.id)?.name
                        : undefined;
                    })()
                  : undefined
            }
            onSend={handleSend}
          />
        </View>
      </AnimatedBorderCard>
    </ScrollView>
  );
}
