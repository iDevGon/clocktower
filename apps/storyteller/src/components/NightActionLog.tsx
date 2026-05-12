import type {
  BmrDeathMethod,
  NightAction,
  NightFeedbackPayload,
  Player,
  PlayerStatus,
} from '@clocktower/shared';
import {
  getBmrDeathWarnings,
  getRoleById,
  NIGHT_FEEDBACK,
} from '@clocktower/shared';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { FeedbackComposer } from './FeedbackComposer';
import { useGameEditionRoles } from './feedback/useGameEditionRoles';
import { createNightActionLogStyles } from './NightActionLog.styles';
import {
  getActionTargetKey,
  getKillActionBlockReason,
  isAbilityMalfunctioning,
} from './nightRoleLogic';
import { PlayerPickerModal } from './PlayerPickerModal';
import { RolePickerModal } from './RolePickerModal';

export { NightFeedbackPanel } from './NightFeedbackPanel';

/** 역할별 타겟 액션 버튼 설정 */
interface TargetActionConfig {
  label: string;
  doneLabel: string;
  status?: PlayerStatus;
  isKill?: boolean;
}

const ROLE_TARGET_ACTIONS: Record<string, TargetActionConfig> = {
  imp: { label: '사망 처리', doneLabel: '사망', isKill: true },
  fang_gu: { label: '사망 처리', doneLabel: '사망', isKill: true },
  vigormortis: { label: '사망 처리', doneLabel: '사망', isKill: true },
  no_dashii: { label: '사망 처리', doneLabel: '사망', isKill: true },
  vortox: { label: '사망 처리', doneLabel: '사망', isKill: true },
  zombuul: { label: '사망 처리', doneLabel: '사망', isKill: true },
  pukka: { label: '사망 처리', doneLabel: '사망', isKill: true },
  shabaloth: { label: '사망 처리', doneLabel: '사망', isKill: true },
  po: { label: '사망 처리', doneLabel: '사망', isKill: true },
  assassin: { label: '사망 처리', doneLabel: '사망', isKill: true },
  godfather: { label: '사망 처리', doneLabel: '사망', isKill: true },
  gossip: { label: '사망 처리', doneLabel: '사망', isKill: true },
  gambler: { label: '사망 처리', doneLabel: '사망', isKill: true },
  moonchild: { label: '사망 처리', doneLabel: '사망', isKill: true },
  grandmother: { label: '사망 처리', doneLabel: '사망', isKill: true },
  poisoner: { label: '중독 처리', doneLabel: '중독됨', status: 'poisoned' },
  monk: { label: '보호 처리', doneLabel: '보호됨', status: 'protected' },
  snake_charmer: { label: '확인', doneLabel: '확인' },
  pit_hag: { label: '역할 변경', doneLabel: '역할 변경' },
  cerenovus: {
    label: '광기 처리',
    doneLabel: '광기',
    status: 'cerenovus_mad',
  },
  bone_collector: {
    label: '능력 복구',
    doneLabel: '복구됨',
    status: 'bone_collector_ability',
  },
  // butler, fortune_teller 등은 타겟 액션 버튼 불필요
};

/** 행동 로그에서 제외할 역할 (피드백 패널에서 별도 처리) */
const HIDDEN_ACTION_ROLES = new Set(['ravenkeeper']);

function getBmrDeathMethod(roleId: string): BmrDeathMethod {
  switch (roleId) {
    case 'assassin':
      return 'assassin';
    case 'godfather':
      return 'godfather';
    case 'gossip':
      return 'gossip';
    case 'gambler':
      return 'gambler';
    case 'moonchild':
      return 'moonchild';
    case 'grandmother':
      return 'grandmother';
    case 'pukka':
      return 'pukka_delayed';
    case 'shabaloth':
      return 'shabaloth';
    case 'po':
      return 'po';
    case 'zombuul':
      return 'demon';
    default:
      return 'manual';
  }
}

interface NightActionLogProps {
  actions: NightAction[];
  players: Player[];
  playerStatuses?: Record<string, PlayerStatus[]>;
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
  onKill?: (playerId: string) => void;
  onSetStatus?: (playerId: string, status: PlayerStatus) => void;
  playerOrder?: string[];
  onFangGuJump?: (oldDemonId: string, newDemonId: string) => void;
  onSnakeCharmerSwap?: (snakeCharmerId: string, demonId: string) => void;
  onVigormortisKillMinion?: (
    vigormortisId: string,
    minionId: string,
    poisonedNeighborId: string,
  ) => void;
  onPitHagChangeRole?: (
    pitHagId: string,
    targetPlayerId: string,
    newRoleId: string,
  ) => void;
  onBoneCollectorRestore?: (
    boneCollectorId: string,
    targetPlayerId: string,
  ) => void;
}

export function NightActionLog({
  actions,
  players,
  playerStatuses,
  onSendFeedback,
  onKill,
  onSetStatus,
  playerOrder,
  onFangGuJump,
  onSnakeCharmerSwap,
  onVigormortisKillMinion,
  onPitHagChangeRole,
  onBoneCollectorRestore,
}: NightActionLogProps) {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createNightActionLogStyles(scale), [scale]);

  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? id;
  const isPlayerAlive = (id: string) =>
    players.find((p) => p.id === id)?.isAlive ?? false;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [sentIndices, setSentIndices] = useState<Set<number>>(new Set());
  const [processedTargets, setProcessedTargets] = useState<Set<string>>(
    new Set(),
  );
  const [pitHagTarget, setPitHagTarget] = useState<{
    actionIndex: number;
    pitHagId: string;
    targetId: string;
    targetName: string;
  } | null>(null);
  const [cerenovusTarget, setCerenovusTarget] = useState<{
    actionIndex: number;
    cerenovusId: string;
    targetId: string;
    targetName: string;
  } | null>(null);
  const [vigormortisPoisonChoice, setVigormortisPoisonChoice] = useState<{
    actionIndex: number;
    vigormortisId: string;
    minionId: string;
    minionName: string;
    candidates: Player[];
  } | null>(null);
  const gameRoles = useGameEditionRoles(players);
  const goodRoles = useMemo(
    () =>
      gameRoles.filter(
        (role) => role.team === 'townsfolk' || role.team === 'outsider',
      ),
    [gameRoles],
  );
  const pitHagDisabledRoleIds = useMemo(() => {
    const disabled = new Set<string>();
    for (const p of players) {
      if (p.id !== pitHagTarget?.targetId && p.role) disabled.add(p.role.id);
    }
    return disabled;
  }, [pitHagTarget?.targetId, players]);

  const getTownsfolkNeighborPlayers = (sourcePlayerId: string) => {
    const order =
      playerOrder && playerOrder.length > 0
        ? playerOrder
        : players.map((p) => p.id);
    const idx = order.indexOf(sourcePlayerId);
    if (idx === -1) return [];
    const neighborIds: string[] = [];

    for (let i = 1; i < order.length; i++) {
      const player = players.find(
        (p) => p.id === order[(idx + i) % order.length],
      );
      if (player?.role?.team === 'townsfolk') {
        neighborIds.push(player.id);
        break;
      }
    }

    for (let i = 1; i < order.length; i++) {
      const player = players.find(
        (p) => p.id === order[(idx - i + order.length) % order.length],
      );
      if (player?.role?.team === 'townsfolk') {
        if (!neighborIds.includes(player.id)) neighborIds.push(player.id);
        break;
      }
    }

    return neighborIds
      .map((id) => players.find((p) => p.id === id))
      .filter((player): player is Player => player != null);
  };

  const handleSend = (
    action: NightAction,
    index: number,
    feedback: NightFeedbackPayload,
  ) => {
    onSendFeedback(action.playerId, feedback);
    setSentIndices((prev) => new Set(prev).add(index));
    setExpandedIndex(null);
  };

  const handleTargetAction = (
    action: NightAction,
    index: number,
    targetId: string,
    config: TargetActionConfig,
  ) => {
    if (config.isKill) {
      onKill?.(targetId);
    } else if (config.status) {
      onSetStatus?.(targetId, config.status);
    }
    setProcessedTargets((prev) =>
      new Set(prev).add(getActionTargetKey(action, index, targetId)),
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>플레이어 행동</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {actions
          .filter((a) => !HIDDEN_ACTION_ROLES.has(a.roleId))
          .map((action, i) => {
            const role = getRoleById(action.roleId);
            const targetNames = action.targets.map(getPlayerName).join(', ');
            const isExpanded = expandedIndex === i;
            const isSent = sentIndices.has(i);
            const feedbackDef = NIGHT_FEEDBACK[action.roleId];
            const hasTargets = action.targets.length > 0;
            const actionConfig = ROLE_TARGET_ACTIONS[action.roleId];
            const actionPlayer = players.find((p) => p.id === action.playerId);
            const isActionPlayerMalfunctioning =
              isAbilityMalfunctioning(actionPlayer);

            return (
              <Pressable
                key={`${i}-${action.playerId}-${action.roleId}`}
                onPress={() => {
                  if (
                    feedbackDef &&
                    feedbackDef.type !== 'none' &&
                    feedbackDef.type !== 'grimoire'
                  ) {
                    setExpandedIndex(isExpanded ? null : i);
                  }
                }}
                style={[styles.item, isSent && styles.itemSent]}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.actionRole}>
                    {role?.name ?? action.roleId}
                  </Text>
                  <Text style={styles.actionPlayer}>{action.playerName}</Text>
                  <Text style={styles.actionArrow}>→</Text>
                  <Text style={styles.actionTarget}>{targetNames}</Text>
                  {action.fortuneTellerResult !== undefined && (
                    <Text
                      style={[
                        styles.sentBadge,
                        {
                          backgroundColor: action.fortuneTellerResult
                            ? 'rgba(106,176,76,0.2)'
                            : 'rgba(184,92,92,0.2)',
                          color: action.fortuneTellerResult
                            ? '#6ab04c'
                            : '#b85c5c',
                        },
                      ]}
                    >
                      {action.fortuneTellerResult ? '예' : '아니오'}
                    </Text>
                  )}
                  {isSent && <Text style={styles.sentBadge}>전송됨</Text>}
                </View>
                {hasTargets && actionConfig && (
                  <View style={styles.killRow}>
                    {action.targets.map((targetId) => {
                      const targetPlayer = players.find(
                        (p) => p.id === targetId,
                      );
                      const targetStatuses =
                        playerStatuses?.[targetId] ??
                        targetPlayer?.statuses ??
                        [];
                      const targetKey = getActionTargetKey(action, i, targetId);
                      const blockReason = actionConfig.isKill
                        ? getKillActionBlockReason(
                            action.roleId,
                            actionPlayer,
                            targetPlayer,
                            targetStatuses,
                          )
                        : isActionPlayerMalfunctioning
                          ? 'actor_malfunctioning'
                          : null;
                      const bmrWarnings = actionConfig.isKill
                        ? getBmrDeathWarnings({
                            roleId: action.roleId,
                            method: getBmrDeathMethod(action.roleId),
                            timing: 'night',
                            actor: actionPlayer,
                            target: targetPlayer,
                            targetStatuses,
                          })
                        : [];

                      if (blockReason === 'actor_malfunctioning') {
                        return (
                          <View key={targetId} style={styles.protectedBadge}>
                            <Text style={styles.protectedText}>
                              {getPlayerName(targetId)} 능력 무효 — 처리 없음
                            </Text>
                          </View>
                        );
                      }

                      if (blockReason === 'soldier') {
                        return (
                          <View key={targetId} style={styles.protectedBadge}>
                            <Text style={styles.protectedText}>
                              {getPlayerName(targetId)} 군인 — 악마에 면역!
                            </Text>
                          </View>
                        );
                      }

                      if (blockReason === 'protected') {
                        return (
                          <View key={targetId} style={styles.protectedBadge}>
                            <Text style={styles.protectedText}>
                              {getPlayerName(targetId)} 보호됨!
                            </Text>
                          </View>
                        );
                      }

                      const alreadyDone = actionConfig.isKill
                        ? processedTargets.has(targetKey) ||
                          !isPlayerAlive(targetId)
                        : processedTargets.has(targetKey);
                      const warningBadges =
                        bmrWarnings.length > 0 ? (
                          <View key={`${targetId}-warnings`}>
                            {bmrWarnings.map((warning) => (
                              <View
                                key={warning.kind}
                                style={[
                                  styles.bmrWarningBadge,
                                  warning.severity === 'bypass' &&
                                    styles.bmrWarningBypass,
                                ]}
                              >
                                <Text style={styles.bmrWarningText}>
                                  {warning.message}
                                </Text>
                              </View>
                            ))}
                          </View>
                        ) : null;
                      if (action.roleId === 'pit_hag') {
                        return (
                          <Pressable
                            key={targetId}
                            onPress={() =>
                              setPitHagTarget({
                                actionIndex: i,
                                pitHagId: action.playerId,
                                targetId,
                                targetName: getPlayerName(targetId),
                              })
                            }
                            style={[
                              styles.killButton,
                              processedTargets.has(targetKey) &&
                                styles.killButtonDone,
                            ]}
                          >
                            <Text
                              style={[
                                styles.killText,
                                processedTargets.has(targetKey) &&
                                  styles.killTextDone,
                              ]}
                            >
                              {processedTargets.has(targetKey)
                                ? `${getPlayerName(targetId)} 역할 변경됨`
                                : `${getPlayerName(targetId)} 역할 변경`}
                            </Text>
                          </Pressable>
                        );
                      }

                      if (action.roleId === 'cerenovus') {
                        return (
                          <Pressable
                            key={targetId}
                            onPress={() =>
                              setCerenovusTarget({
                                actionIndex: i,
                                cerenovusId: action.playerId,
                                targetId,
                                targetName: getPlayerName(targetId),
                              })
                            }
                            style={[
                              styles.killButton,
                              processedTargets.has(targetKey) &&
                                styles.killButtonDone,
                            ]}
                            disabled={processedTargets.has(targetKey)}
                          >
                            <Text
                              style={[
                                styles.killText,
                                processedTargets.has(targetKey) &&
                                  styles.killTextDone,
                              ]}
                            >
                              {processedTargets.has(targetKey)
                                ? `${getPlayerName(targetId)} 광기 지정됨`
                                : `${getPlayerName(targetId)} 광기 역할 지정`}
                            </Text>
                          </Pressable>
                        );
                      }

                      if (
                        action.roleId === 'vigormortis' &&
                        targetPlayer?.role?.team === 'minion'
                      ) {
                        return (
                          <Pressable
                            key={targetId}
                            onPress={() => {
                              if (alreadyDone) return;
                              const candidates =
                                getTownsfolkNeighborPlayers(targetId);
                              if (candidates.length === 0) {
                                handleTargetAction(
                                  action,
                                  i,
                                  targetId,
                                  actionConfig,
                                );
                                return;
                              }
                              setVigormortisPoisonChoice({
                                actionIndex: i,
                                vigormortisId: action.playerId,
                                minionId: targetId,
                                minionName: getPlayerName(targetId),
                                candidates,
                              });
                            }}
                            style={[
                              styles.killButton,
                              alreadyDone && styles.killButtonDone,
                            ]}
                            disabled={alreadyDone}
                          >
                            <Text
                              style={[
                                styles.killText,
                                alreadyDone && styles.killTextDone,
                              ]}
                            >
                              {alreadyDone
                                ? `${getPlayerName(targetId)} 유지됨`
                                : `${getPlayerName(targetId)} 처치/유지`}
                            </Text>
                          </Pressable>
                        );
                      }

                      if (
                        action.roleId === 'fang_gu' &&
                        targetPlayer?.role?.team === 'outsider'
                      ) {
                        return (
                          <Pressable
                            key={targetId}
                            onPress={() => {
                              if (alreadyDone) return;
                              onFangGuJump?.(action.playerId, targetId);
                              setProcessedTargets((prev) =>
                                new Set(prev).add(targetKey),
                              );
                            }}
                            style={[
                              styles.killButton,
                              alreadyDone && styles.killButtonDone,
                            ]}
                            disabled={alreadyDone}
                          >
                            <Text
                              style={[
                                styles.killText,
                                alreadyDone && styles.killTextDone,
                              ]}
                            >
                              {alreadyDone
                                ? `${getPlayerName(targetId)} 팡 구`
                                : `${getPlayerName(targetId)} 팡 구 점프`}
                            </Text>
                          </Pressable>
                        );
                      }

                      if (
                        action.roleId === 'snake_charmer' &&
                        targetPlayer?.role?.team === 'demon'
                      ) {
                        return (
                          <Pressable
                            key={targetId}
                            onPress={() => {
                              if (alreadyDone) return;
                              onSnakeCharmerSwap?.(action.playerId, targetId);
                              setProcessedTargets((prev) =>
                                new Set(prev).add(targetKey),
                              );
                            }}
                            style={[
                              styles.killButton,
                              alreadyDone && styles.killButtonDone,
                            ]}
                            disabled={alreadyDone}
                          >
                            <Text
                              style={[
                                styles.killText,
                                alreadyDone && styles.killTextDone,
                              ]}
                            >
                              {alreadyDone
                                ? `${getPlayerName(targetId)} 교환됨`
                                : `${getPlayerName(targetId)} 악마와 교환`}
                            </Text>
                          </Pressable>
                        );
                      }

                      if (action.roleId === 'bone_collector') {
                        return (
                          <Pressable
                            key={targetId}
                            onPress={() => {
                              if (alreadyDone) return;
                              onBoneCollectorRestore?.(
                                action.playerId,
                                targetId,
                              );
                              setProcessedTargets((prev) =>
                                new Set(prev).add(targetKey),
                              );
                            }}
                            style={[
                              styles.killButton,
                              alreadyDone && styles.killButtonDone,
                            ]}
                            disabled={alreadyDone}
                          >
                            <Text
                              style={[
                                styles.killText,
                                alreadyDone && styles.killTextDone,
                              ]}
                            >
                              {alreadyDone
                                ? `${getPlayerName(targetId)} 복구됨`
                                : `${getPlayerName(targetId)} 능력 복구`}
                            </Text>
                          </Pressable>
                        );
                      }

                      return (
                        <View key={targetId} style={styles.targetActionGroup}>
                          {warningBadges}
                          <Pressable
                            onPress={() =>
                              !alreadyDone &&
                              handleTargetAction(
                                action,
                                i,
                                targetId,
                                actionConfig,
                              )
                            }
                            style={[
                              styles.killButton,
                              alreadyDone && styles.killButtonDone,
                            ]}
                            disabled={alreadyDone}
                          >
                            <Text
                              style={[
                                styles.killText,
                                alreadyDone && styles.killTextDone,
                              ]}
                            >
                              {alreadyDone
                                ? `${getPlayerName(targetId)} ${actionConfig.doneLabel}`
                                : `${getPlayerName(targetId)} ${actionConfig.label}`}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                )}
                {isExpanded && feedbackDef && (
                  <FeedbackComposer
                    feedbackDef={feedbackDef}
                    players={players}
                    isDrunkUser={isActionPlayerMalfunctioning}
                    action={action}
                    onSend={(fb) => handleSend(action, i, fb)}
                  />
                )}
              </Pressable>
            );
          })}
      </ScrollView>
      <RolePickerModal
        visible={pitHagTarget != null}
        title="마귀할멈 역할 변경"
        description={`${pitHagTarget?.targetName ?? '대상'}의 새 역할을 선택하세요. 현재 게임에 없는 역할만 지정할 수 있고 진영은 유지됩니다.`}
        roles={gameRoles}
        disabledRoleIds={pitHagDisabledRoleIds}
        disabledLabel="현재 게임에 있음"
        onSelectRole={(roleId) => {
          if (!pitHagTarget) return;
          onPitHagChangeRole?.(
            pitHagTarget.pitHagId,
            pitHagTarget.targetId,
            roleId,
          );
          setProcessedTargets((prev) =>
            new Set(prev).add(
              getActionTargetKey(
                { playerId: pitHagTarget.pitHagId, roleId: 'pit_hag' },
                pitHagTarget.actionIndex,
                pitHagTarget.targetId,
              ),
            ),
          );
          setPitHagTarget(null);
        }}
        onClose={() => setPitHagTarget(null)}
        scale={scale}
      />
      <RolePickerModal
        visible={cerenovusTarget != null}
        title="세레노버스 광기 지정"
        description={`${cerenovusTarget?.targetName ?? '대상'}이 낮 동안 주장해야 할 선한 역할을 선택하세요.`}
        roles={goodRoles}
        onSelectRole={(roleId) => {
          if (!cerenovusTarget) return;
          const role = gameRoles.find((r) => r.id === roleId);
          if (!role) return;
          onSetStatus?.(cerenovusTarget.targetId, 'cerenovus_mad');
          onSendFeedback(cerenovusTarget.targetId, {
            type: 'mad_as',
            roleName: role.name,
          });
          setProcessedTargets((prev) =>
            new Set(prev).add(
              getActionTargetKey(
                { playerId: cerenovusTarget.cerenovusId, roleId: 'cerenovus' },
                cerenovusTarget.actionIndex,
                cerenovusTarget.targetId,
              ),
            ),
          );
          setCerenovusTarget(null);
        }}
        onClose={() => setCerenovusTarget(null)}
        scale={scale}
      />
      <PlayerPickerModal
        visible={vigormortisPoisonChoice != null}
        title="비고르모르티스 중독 대상"
        description={`${vigormortisPoisonChoice?.minionName ?? '하수인'}의 능력을 유지하고 중독시킬 마을주민 이웃을 선택하세요.`}
        themeColor="#9b59b6"
        candidates={vigormortisPoisonChoice?.candidates ?? []}
        onSelectPlayer={(poisonedNeighborId) => {
          if (!vigormortisPoisonChoice) return;
          onVigormortisKillMinion?.(
            vigormortisPoisonChoice.vigormortisId,
            vigormortisPoisonChoice.minionId,
            poisonedNeighborId,
          );
          setProcessedTargets((prev) =>
            new Set(prev).add(
              getActionTargetKey(
                {
                  playerId: vigormortisPoisonChoice.vigormortisId,
                  roleId: 'vigormortis',
                },
                vigormortisPoisonChoice.actionIndex,
                vigormortisPoisonChoice.minionId,
              ),
            ),
          );
          setVigormortisPoisonChoice(null);
        }}
        onClose={() => setVigormortisPoisonChoice(null)}
        showRole
        scale={scale}
      />
    </View>
  );
}
