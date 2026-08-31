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
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { FeedbackComposer } from './FeedbackComposer';
import { createNightActionLogStyles } from './NightActionLog.styles';
import { getAbilityTextStyle, modalStyles } from './NightFeedbackPanel.styles';
import { TEAM_COLORS } from './NightOrderPanel.styles';
import {
  createNightFeedbackCompletionGuard,
  createNightFeedbackDeliveryGuard,
  getNightActionForFeedbackTargetOccurrence,
  getPendingFeedbackIndex,
} from './nightFeedbackQueue';
import { getNightFeedbackSuggestion } from './nightFeedbackSuggestion';
import {
  getAbilityMalfunctionWarning,
  getEmpathHint,
  isAbilityMalfunctioning,
} from './nightRoleLogic';

/** Map team → modal border color */
const TEAM_CARD_COLORS: Record<string, { color: string }> = {
  townsfolk: { color: '#5a8ec8' },
  outsider: { color: '#4aa890' },
  minion: { color: '#c07040' },
  demon: { color: '#c03848' },
};

const FALLBACK_CARD_COLORS = TEAM_CARD_COLORS.townsfolk;

interface ChefHint {
  evilPairCount: number;
  evilPairNames: string[][];
}

interface NightFeedbackPanelProps {
  visible: boolean;
  onCollapse: () => void;
  activeRoleId: string | null;
  players: Player[];
  playerOrder: string[];
  nightActions?: NightAction[];
  chefHint?: ChefHint;
  executedRoleName?: string;
  executedPlayerName?: string;
  onSendFeedback: (
    playerId: string,
    feedback: NightFeedbackPayload,
    callback?: (result: { success: boolean; error?: string }) => void,
  ) => void;
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
  visible,
  onCollapse,
  activeRoleId,
  players,
  playerOrder,
  nightActions,
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

  const [sentIndices, setSentIndices] = useState<Set<number>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const deliveryGuardRef = useRef(createNightFeedbackDeliveryGuard());
  const completionGuardRef = useRef(createNightFeedbackCompletionGuard());

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
          : p.isAlive ||
            p.statuses.includes('vigormortis_retained') ||
            p.statuses.includes('bone_collector_ability')),
    );
    return shuffle(matched);
  }, [activeRoleId, players, wakeUpTargetIds]);

  // 모든 피드백 전송 완료 시 부모에게 알림
  useEffect(() => {
    if (
      targetPlayers.length > 0 &&
      sentIndices.size >= targetPlayers.length &&
      onAllFeedbackSent &&
      completionGuardRef.current.tryComplete()
    ) {
      onAllFeedbackSent();
    }
  }, [sentIndices, targetPlayers, onAllFeedbackSent]);

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
  const currentIndex = getPendingFeedbackIndex(targetPlayers, sentIndices);
  const currentTarget =
    currentIndex == null ? undefined : targetPlayers[currentIndex];
  const allSent = currentTarget == null;

  if (allSent) return null;

  const targetPlayer = currentTarget;
  const isDrunk = targetPlayer.role?.id === 'drunk';
  const isSoberHealthy =
    targetPlayer.role?.id === 'beggar' ||
    targetPlayer.statuses.includes('barista_sober_healthy');
  const isPoisoned = !isSoberHealthy && hasPoisonStatus(targetPlayer.statuses);
  const isMalfunctioning = isAbilityMalfunctioning(targetPlayer);
  const malfunctionWarningText = getAbilityMalfunctionWarning(targetPlayer);
  const role = getRoleById(activeRoleId);
  const team = role?.team ?? 'townsfolk';
  const cardColors = TEAM_CARD_COLORS[team] ?? FALLBACK_CARD_COLORS;
  const teamColor =
    TEAM_COLORS[team as keyof typeof TEAM_COLORS] ?? TEAM_COLORS.townsfolk;
  const currentNightAction =
    currentIndex == null
      ? undefined
      : getNightActionForFeedbackTargetOccurrence(
          nightActions,
          activeRoleId,
          targetPlayers,
          currentIndex,
        );
  const currentEmpathHint =
    activeRoleId === 'empath'
      ? getEmpathHint(players, playerOrder, targetPlayer.id)
      : undefined;
  const currentNightActionTargetNames =
    currentNightAction?.targets.map(
      (id) => players.find((player) => player.id === id)?.name ?? id,
    ) ?? [];
  const ravenkeeperTarget =
    currentNightAction?.roleId === 'ravenkeeper'
      ? players.find((player) => player.id === currentNightAction.targets[0])
      : undefined;
  const ravenkeeperRoleName = ravenkeeperTarget?.role?.name;
  const suggestion = getNightFeedbackSuggestion({
    roleId: activeRoleId,
    isMalfunctioning,
    empathEvilCount: currentEmpathHint?.evilCount,
    chefEvilPairCount: chefHint?.evilPairCount,
    jugglerCorrectCount: jugglerCorrectCount?.[targetPlayer.id],
    fortuneTellerResult: currentNightAction?.fortuneTellerResult,
    revealedRoleName:
      activeRoleId === 'undertaker'
        ? executedRoleName
        : activeRoleId === 'ravenkeeper'
          ? ravenkeeperRoleName
          : undefined,
  });

  const handleSend = (fb: NightFeedbackPayload) => {
    const attemptToken = deliveryGuardRef.current.tryStart();
    if (attemptToken == null) return;
    setIsSending(true);

    // 점쟁이 yes_no 피드백에 지목 대상 이름 포함
    if (activeRoleId === 'fortune_teller' && fb.type === 'yes_no') {
      if (currentNightActionTargetNames.length > 0) {
        fb = { ...fb, targetNames: currentNightActionTargetNames };
      }
    }
    onSendFeedback(targetPlayer.id, fb, (result) => {
      const settlement = deliveryGuardRef.current.settle(
        attemptToken,
        result.success,
      );
      if (settlement === 'ignored') return;
      setIsSending(false);
      if (settlement === 'advance' && currentIndex != null) {
        setSentIndices((prev) => new Set(prev).add(currentIndex));
      }
    });
  };

  const progressLabel = `(${sentIndices.size + 1}/${targetPlayers.length})`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCollapse}
      statusBarTranslucent
    >
      <View style={modalStyles.backdrop}>
        <View
          style={[modalStyles.modal, { borderColor: cardColors.color }]}
          accessibilityViewIsModal
          accessibilityLabelledBy="night-feedback-title"
          accessibilityLabel="밤 피드백"
        >
          <View style={modalStyles.header}>
            <View style={modalStyles.headerCopy}>
              <Text
                nativeID="night-feedback-title"
                style={[modalStyles.title, { color: teamColor.text }]}
              >
                {role?.name ?? activeRoleId}
              </Text>
              <Text style={modalStyles.target}>
                {targetPlayer.name}에게 전달 {progressLabel}
              </Text>
            </View>
            <Pressable
              onPress={onCollapse}
              accessibilityRole="button"
              accessibilityLabel="피드백 접기"
              style={modalStyles.collapseButton}
            >
              <Text style={modalStyles.collapseText}>접기</Text>
            </Pressable>
          </View>
          <ScrollView
            style={modalStyles.scrollView}
            contentContainerStyle={modalStyles.content}
            showsVerticalScrollIndicator
          >
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
                  {malfunctionWarningText}
                </Text>
              </View>
            )}

            {activeRoleId === 'fortune_teller' &&
              currentNightAction?.fortuneTellerResult !== undefined && (
                <View
                  style={[
                    styles.drunkBanner,
                    {
                      backgroundColor: currentNightAction.fortuneTellerResult
                        ? 'rgba(106,176,76,0.15)'
                        : 'rgba(184,92,92,0.15)',
                      borderColor: currentNightAction.fortuneTellerResult
                        ? '#6ab04c'
                        : '#b85c5c',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.drunkBannerText,
                      {
                        color: currentNightAction.fortuneTellerResult
                          ? '#6ab04c'
                          : '#b85c5c',
                      },
                    ]}
                  >
                    {currentNightActionTargetNames.join(', ')} →{' '}
                    {currentNightAction.fortuneTellerResult
                      ? '예 (악마/붉은 청어 포함)'
                      : '아니오'}
                    {hasPoisonStatus(targetPlayer.statuses)
                      ? ' (중독 반전 적용됨)'
                      : ''}
                  </Text>
                </View>
              )}

            {activeRoleId === 'empath' &&
              currentEmpathHint &&
              currentEmpathHint.neighbors.length > 0 && (
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
                    이웃:{' '}
                    {currentEmpathHint.neighbors
                      .map((neighbor) => neighbor.name)
                      .join(', ')}{' '}
                    → 악한 {currentEmpathHint.evilCount}명
                    {isMalfunctioning ? ' (가짜 정보 제공 필요)' : ''}
                  </Text>
                </View>
              )}

            {activeRoleId === 'ravenkeeper' && ravenkeeperTarget && (
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
                  선택한 대상: {ravenkeeperTarget.name} →{' '}
                  {ravenkeeperRoleName ?? '???'}
                  {isMalfunctioning ? ' (가짜 정보 제공 필요)' : ''}
                </Text>
              </View>
            )}

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
                    backgroundColor: 'rgba(176,127,92,0.14)',
                    borderColor: '#b07f5c',
                  },
                ]}
              >
                <Text style={[styles.drunkBannerText, { color: '#b07f5c' }]}>
                  인접 악한 쌍: {chefHint.evilPairCount}개
                  {chefHint.evilPairNames.length > 0
                    ? ` (${chefHint.evilPairNames.map((pair) => pair.join('-')).join(', ')})`
                    : ''}
                  {isMalfunctioning ? ' (가짜 정보 제공 필요)' : ''}
                </Text>
              </View>
            )}

            <View
              style={[
                modalStyles.recommendation,
                suggestion && modalStyles.recommendationSuggested,
              ]}
              accessibilityLiveRegion="polite"
            >
              <Text
                style={[
                  modalStyles.recommendationTitle,
                  suggestion && modalStyles.recommendationTitleSuggested,
                ]}
              >
                {suggestion ? '현재 추천 피드백' : '추천 피드백 없음'}
              </Text>
              <Text style={modalStyles.recommendationBody}>
                {suggestion
                  ? suggestion.reason
                  : isMalfunctioning
                    ? '취함·중독 등으로 정확한 추천값을 제공하지 않습니다.'
                    : '확정된 추천 정보가 없습니다.'}
              </Text>
            </View>

            {isSending && (
              <Text
                style={modalStyles.sendingStatus}
                accessibilityLiveRegion="polite"
              >
                피드백 전송 중…
              </Text>
            )}

            <View
              pointerEvents={isSending ? 'none' : 'auto'}
              accessibilityElementsHidden={isSending}
              importantForAccessibility={
                isSending ? 'no-hide-descendants' : 'auto'
              }
            >
              <FeedbackComposer
                feedbackDef={feedbackDef}
                players={players.filter((p) => p.id !== targetPlayer.id)}
                isDrunkUser={isMalfunctioning}
                action={currentNightAction}
                maxNumber={activeRoleId === 'juggler' ? 5 : undefined}
                suggestion={suggestion}
                onSend={handleSend}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
