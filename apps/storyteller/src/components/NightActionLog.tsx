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
  professor: { label: '부활 처리', doneLabel: '부활됨' },
  innkeeper: {
    label: '보호 처리',
    doneLabel: '보호됨',
    status: 'innkeeper_protected',
  },
  devils_advocate: {
    label: '처형 보호',
    doneLabel: '보호됨',
    status: 'devils_advocate_protected',
  },
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

const BMR_DISCRETIONARY_DEATH_NOTES: Partial<Record<string, string>> = {
  gossip:
    '험담꾼 발언이 사실이었다면 오늘 밤 이야기꾼이 플레이어 1명을 사망시킬 수 있습니다.',
  gambler:
    '도박사 추측이 틀렸다면 도박사가 사망합니다. 정답 여부를 확인한 뒤 처리하세요.',
  moonchild:
    '달의 자손이 선택한 플레이어가 선한 팀이면 오늘 밤 그 플레이어가 사망합니다.',
};

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
  onRevive?: (playerId: string) => void;
  onSetStatus?: (playerId: string, status: PlayerStatus) => void;
  onRemoveStatus?: (playerId: string, status: PlayerStatus) => void;
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
  onRevive,
  onSetStatus,
  onRemoveStatus,
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
  const getCurrentStatuses = (player?: Player) =>
    player ? (playerStatuses?.[player.id] ?? player.statuses ?? []) : [];
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
            const shabalothReviveCandidates =
              action.roleId === 'shabaloth'
                ? players.filter(
                    (player) =>
                      !player.isAlive &&
                      getCurrentStatuses(player).includes(
                        'shabaloth_marked_dead',
                      ),
                  )
                : [];
            const poRestKey = `${i}-${action.playerId}-po-rest`;
            const isPoRestProcessed =
              processedTargets.has(poRestKey) ||
              getCurrentStatuses(actionPlayer).includes('po_chose_no_one');

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
                {shabalothReviveCandidates.length > 0 && (
                  <View style={styles.targetActionGroup}>
                    <View style={styles.bmrWarningBadge}>
                      <Text style={styles.bmrWarningText}>
                        사발로스가 토해내 부활시킬 수 있는 대상
                      </Text>
                    </View>
                    <View style={styles.killRow}>
                      {shabalothReviveCandidates.map((player) => {
                        const reviveKey = `${i}-${action.playerId}-shabaloth-revive-${player.id}`;
                        const alreadyRevived =
                          processedTargets.has(reviveKey) || player.isAlive;

                        return (
                          <Pressable
                            key={player.id}
                            onPress={() => {
                              if (alreadyRevived) return;
                              onRevive?.(player.id);
                              onRemoveStatus?.(
                                player.id,
                                'shabaloth_marked_dead',
                              );
                              setProcessedTargets((prev) =>
                                new Set(prev).add(reviveKey),
                              );
                            }}
                            style={[
                              styles.killButton,
                              alreadyRevived && styles.killButtonDone,
                            ]}
                            disabled={alreadyRevived}
                          >
                            <Text
                              style={[
                                styles.killText,
                                alreadyRevived && styles.killTextDone,
                              ]}
                            >
                              {alreadyRevived
                                ? `${player.name} 부활됨`
                                : `${player.name} 부활 처리`}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
                {action.roleId === 'po' &&
                  !hasTargets &&
                  actionConfig &&
                  isActionPlayerMalfunctioning && (
                    <View style={styles.targetActionGroup}>
                      <View style={styles.bmrWarningBadge}>
                        <Text style={styles.bmrWarningText}>
                          포가 중독/취함 상태라 자동 휴식 미적용
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          if (isPoRestProcessed) return;
                          onSetStatus?.(action.playerId, 'po_chose_no_one');
                          setProcessedTargets((prev) =>
                            new Set(prev).add(poRestKey),
                          );
                        }}
                        style={[
                          styles.killButton,
                          isPoRestProcessed && styles.killButtonDone,
                        ]}
                        disabled={isPoRestProcessed}
                      >
                        <Text
                          style={[
                            styles.killText,
                            isPoRestProcessed && styles.killTextDone,
                          ]}
                        >
                          {isPoRestProcessed
                            ? '포 휴식 처리됨'
                            : '포 휴식 처리'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                {BMR_DISCRETIONARY_DEATH_NOTES[action.roleId] && (
                  <View style={styles.bmrWarningBadge}>
                    <Text style={styles.bmrWarningText}>
                      {BMR_DISCRETIONARY_DEATH_NOTES[action.roleId]}
                    </Text>
                  </View>
                )}
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
                        if (action.roleId === 'pukka') {
                          const previousPukkaTarget = players.find((player) =>
                            getCurrentStatuses(player).includes(
                              'pukka_poisoned',
                            ),
                          );
                          const previousKillKey = `${targetKey}:pukka-previous-kill`;
                          const poisonKey = `${targetKey}:pukka-poison`;
                          const previousKillDone =
                            previousPukkaTarget != null &&
                            (processedTargets.has(previousKillKey) ||
                              !isPlayerAlive(previousPukkaTarget.id));
                          const poisonDone = processedTargets.has(poisonKey);

                          return (
                            <View
                              key={targetId}
                              style={styles.targetActionGroup}
                            >
                              <View style={styles.bmrWarningBadge}>
                                <Text style={styles.bmrWarningText}>
                                  푸카가 중독/취함 상태라 자동 판정 미적용
                                </Text>
                              </View>
                              {previousPukkaTarget != null && (
                                <Pressable
                                  onPress={() => {
                                    if (previousKillDone) return;
                                    onKill?.(previousPukkaTarget.id);
                                    setProcessedTargets((prev) =>
                                      new Set(prev).add(previousKillKey),
                                    );
                                  }}
                                  style={[
                                    styles.killButton,
                                    previousKillDone && styles.killButtonDone,
                                  ]}
                                  disabled={previousKillDone}
                                >
                                  <Text
                                    style={[
                                      styles.killText,
                                      previousKillDone && styles.killTextDone,
                                    ]}
                                  >
                                    {previousKillDone
                                      ? `${previousPukkaTarget.name} 이전 푸카 중독 대상 사망`
                                      : `${previousPukkaTarget.name} 이전 푸카 중독 대상 사망 처리`}
                                  </Text>
                                </Pressable>
                              )}
                              <Pressable
                                onPress={() => {
                                  if (poisonDone) return;
                                  onSetStatus?.(targetId, 'pukka_poisoned');
                                  setProcessedTargets((prev) =>
                                    new Set(prev).add(poisonKey),
                                  );
                                }}
                                style={[
                                  styles.killButton,
                                  poisonDone && styles.killButtonDone,
                                ]}
                                disabled={poisonDone}
                              >
                                <Text
                                  style={[
                                    styles.killText,
                                    poisonDone && styles.killTextDone,
                                  ]}
                                >
                                  {poisonDone
                                    ? `${getPlayerName(targetId)} 푸카 중독됨`
                                    : `${getPlayerName(targetId)} 푸카 중독 처리`}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }

                        if (action.roleId === 'shabaloth') {
                          const shabalothKillKey = `${targetKey}:shabaloth-manual-kill`;
                          const shabalothMarkKey = `${targetKey}:shabaloth-manual-mark`;
                          const killDone =
                            processedTargets.has(shabalothKillKey) ||
                            !isPlayerAlive(targetId);
                          const markDone =
                            processedTargets.has(shabalothMarkKey) ||
                            targetStatuses.includes('shabaloth_marked_dead');

                          return (
                            <View
                              key={targetId}
                              style={styles.targetActionGroup}
                            >
                              <View style={styles.bmrWarningBadge}>
                                <Text style={styles.bmrWarningText}>
                                  사발로스가 중독/취함 상태라 자동 판정 미적용
                                </Text>
                              </View>
                              <Pressable
                                onPress={() => {
                                  if (killDone) return;
                                  onKill?.(targetId);
                                  setProcessedTargets((prev) =>
                                    new Set(prev).add(shabalothKillKey),
                                  );
                                }}
                                style={[
                                  styles.killButton,
                                  killDone && styles.killButtonDone,
                                ]}
                                disabled={killDone}
                              >
                                <Text
                                  style={[
                                    styles.killText,
                                    killDone && styles.killTextDone,
                                  ]}
                                >
                                  {killDone
                                    ? `${getPlayerName(targetId)} 사망`
                                    : `${getPlayerName(targetId)} 사망 처리`}
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  if (markDone) return;
                                  onSetStatus?.(
                                    targetId,
                                    'shabaloth_marked_dead',
                                  );
                                  setProcessedTargets((prev) =>
                                    new Set(prev).add(shabalothMarkKey),
                                  );
                                }}
                                style={[
                                  styles.killButton,
                                  markDone && styles.killButtonDone,
                                ]}
                                disabled={markDone}
                              >
                                <Text
                                  style={[
                                    styles.killText,
                                    markDone && styles.killTextDone,
                                  ]}
                                >
                                  {markDone
                                    ? `${getPlayerName(targetId)} 사발로스 표식`
                                    : `${getPlayerName(targetId)} 사발로스 표식 처리`}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }

                        if (action.roleId === 'po') {
                          const poKillKey = `${targetKey}:po-manual-kill`;
                          const killDone =
                            processedTargets.has(poKillKey) ||
                            !isPlayerAlive(targetId);

                          return (
                            <View
                              key={targetId}
                              style={styles.targetActionGroup}
                            >
                              <View style={styles.bmrWarningBadge}>
                                <Text style={styles.bmrWarningText}>
                                  포가 중독/취함 상태라 자동 판정 미적용
                                </Text>
                              </View>
                              <Pressable
                                onPress={() => {
                                  if (killDone) return;
                                  onKill?.(targetId);
                                  setProcessedTargets((prev) =>
                                    new Set(prev).add(poKillKey),
                                  );
                                }}
                                style={[
                                  styles.killButton,
                                  killDone && styles.killButtonDone,
                                ]}
                                disabled={killDone}
                              >
                                <Text
                                  style={[
                                    styles.killText,
                                    killDone && styles.killTextDone,
                                  ]}
                                >
                                  {killDone
                                    ? `${getPlayerName(targetId)} 사망`
                                    : `${getPlayerName(targetId)} 사망 처리`}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }

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

                      if (action.roleId === 'professor') {
                        const reviveKey = `${targetKey}:professor-manual-revive`;
                        const spentKey = `${i}-${action.playerId}-professor-spent`;
                        const reviveDone =
                          processedTargets.has(reviveKey) ||
                          isPlayerAlive(targetId);
                        const spentDone =
                          processedTargets.has(spentKey) ||
                          getCurrentStatuses(actionPlayer).includes(
                            'professor_spent',
                          );
                        const isTownsfolk =
                          targetPlayer?.role?.team === 'townsfolk';

                        return (
                          <View key={targetId} style={styles.targetActionGroup}>
                            {isActionPlayerMalfunctioning && (
                              <View style={styles.bmrWarningBadge}>
                                <Text style={styles.bmrWarningText}>
                                  교수가 중독/취함 상태라 자동 부활 미적용
                                </Text>
                              </View>
                            )}
                            {!isTownsfolk && (
                              <View style={styles.bmrWarningBadge}>
                                <Text style={styles.bmrWarningText}>
                                  대상이 마을주민이 아니면 자동 부활하지 않음
                                </Text>
                              </View>
                            )}
                            <Pressable
                              onPress={() => {
                                if (reviveDone) return;
                                onRevive?.(targetId);
                                setProcessedTargets((prev) =>
                                  new Set(prev).add(reviveKey),
                                );
                              }}
                              style={[
                                styles.killButton,
                                reviveDone && styles.killButtonDone,
                              ]}
                              disabled={reviveDone}
                            >
                              <Text
                                style={[
                                  styles.killText,
                                  reviveDone && styles.killTextDone,
                                ]}
                              >
                                {reviveDone
                                  ? `${getPlayerName(targetId)} 부활됨`
                                  : `${getPlayerName(targetId)} 부활 처리`}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                if (spentDone) return;
                                onSetStatus?.(
                                  action.playerId,
                                  'professor_spent',
                                );
                                setProcessedTargets((prev) =>
                                  new Set(prev).add(spentKey),
                                );
                              }}
                              style={[
                                styles.killButton,
                                spentDone && styles.killButtonDone,
                              ]}
                              disabled={spentDone}
                            >
                              <Text
                                style={[
                                  styles.killText,
                                  spentDone && styles.killTextDone,
                                ]}
                              >
                                {spentDone
                                  ? '교수 능력 소모됨'
                                  : '교수 능력 소모 처리'}
                              </Text>
                            </Pressable>
                          </View>
                        );
                      }

                      if (action.roleId === 'innkeeper') {
                        const protectKey = `${targetKey}:innkeeper-protect`;
                        const drunkKey = `${targetKey}:innkeeper-drunk`;
                        const innkeeperDrunkTargetId = action.targets.find(
                          (id) => {
                            const player = players.find((p) => p.id === id);
                            return (
                              getCurrentStatuses(player).includes(
                                'innkeeper_drunk',
                              ) ||
                              processedTargets.has(
                                `${getActionTargetKey(action, i, id)}:innkeeper-drunk`,
                              )
                            );
                          },
                        );
                        const protectDone =
                          processedTargets.has(protectKey) ||
                          targetStatuses.includes('innkeeper_protected');
                        const drunkDone =
                          processedTargets.has(drunkKey) ||
                          targetStatuses.includes('innkeeper_drunk') ||
                          innkeeperDrunkTargetId != null;

                        return (
                          <View key={targetId} style={styles.targetActionGroup}>
                            {isActionPlayerMalfunctioning && (
                              <View style={styles.bmrWarningBadge}>
                                <Text style={styles.bmrWarningText}>
                                  여관 주인이 중독/취함 상태라 자동 판정 미적용
                                </Text>
                              </View>
                            )}
                            <Pressable
                              onPress={() => {
                                if (protectDone) return;
                                onSetStatus?.(targetId, 'innkeeper_protected');
                                setProcessedTargets((prev) =>
                                  new Set(prev).add(protectKey),
                                );
                              }}
                              style={[
                                styles.killButton,
                                protectDone && styles.killButtonDone,
                              ]}
                              disabled={protectDone}
                            >
                              <Text
                                style={[
                                  styles.killText,
                                  protectDone && styles.killTextDone,
                                ]}
                              >
                                {protectDone
                                  ? `${getPlayerName(targetId)} 보호됨`
                                  : `${getPlayerName(targetId)} 보호 처리`}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                if (drunkDone) return;
                                onSetStatus?.(targetId, 'innkeeper_drunk');
                                setProcessedTargets((prev) =>
                                  new Set(prev).add(drunkKey),
                                );
                              }}
                              style={[
                                styles.killButton,
                                drunkDone && styles.killButtonDone,
                              ]}
                              disabled={drunkDone}
                            >
                              <Text
                                style={[
                                  styles.killText,
                                  drunkDone && styles.killTextDone,
                                ]}
                              >
                                {drunkDone
                                  ? targetStatuses.includes('innkeeper_drunk')
                                    ? `${getPlayerName(targetId)} 여관 주인 취함`
                                    : '여관 주인 취함 선택 완료'
                                  : `${getPlayerName(targetId)} 여관 주인 취함 처리`}
                              </Text>
                            </Pressable>
                          </View>
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
