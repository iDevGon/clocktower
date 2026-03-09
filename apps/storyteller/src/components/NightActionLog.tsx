import type {
  NightAction,
  NightFeedbackPayload,
  Player,
  PlayerStatus,
} from '@clocktower/shared';
import { getRoleById, NIGHT_FEEDBACK } from '@clocktower/shared';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { FeedbackComposer } from './FeedbackComposer';
import { createNightActionLogStyles } from './NightActionLog.styles';

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
  poisoner: { label: '중독 처리', doneLabel: '중독됨', status: 'poisoned' },
  monk: { label: '보호 처리', doneLabel: '보호됨', status: 'protected' },
  // butler, ravenkeeper, fortune_teller 등은 타겟 액션 버튼 불필요
};

interface NightActionLogProps {
  actions: NightAction[];
  players: Player[];
  playerStatuses?: Record<string, PlayerStatus[]>;
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
  onKill?: (playerId: string) => void;
  onSetStatus?: (playerId: string, status: PlayerStatus) => void;
}

export function NightActionLog({
  actions,
  players,
  playerStatuses,
  onSendFeedback,
  onKill,
  onSetStatus,
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

  const handleSend = (
    action: NightAction,
    index: number,
    feedback: NightFeedbackPayload,
  ) => {
    onSendFeedback(action.playerId, feedback);
    setSentIndices((prev) => new Set(prev).add(index));
    setExpandedIndex(null);
  };

  const handleTargetAction = (targetId: string, config: TargetActionConfig) => {
    if (config.isKill) {
      onKill?.(targetId);
    } else if (config.status) {
      onSetStatus?.(targetId, config.status);
    }
    setProcessedTargets((prev) => new Set(prev).add(targetId));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>플레이어 행동</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {actions.map((action, i) => {
          const role = getRoleById(action.roleId);
          const targetNames = action.targets.map(getPlayerName).join(', ');
          const isExpanded = expandedIndex === i;
          const isSent = sentIndices.has(i);
          const feedbackDef = NIGHT_FEEDBACK[action.roleId];
          const hasTargets = action.targets.length > 0;
          const actionConfig = ROLE_TARGET_ACTIONS[action.roleId];

          return (
            <Pressable
              key={`${action.playerId}-${action.roleId}`}
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
                    const targetStatuses = playerStatuses?.[targetId] ?? [];
                    const isProtected =
                      actionConfig.isKill &&
                      targetStatuses.includes('protected');

                    if (isProtected) {
                      return (
                        <View key={targetId} style={styles.protectedBadge}>
                          <Text style={styles.protectedText}>
                            {getPlayerName(targetId)} 보호됨!
                          </Text>
                        </View>
                      );
                    }

                    const alreadyDone = actionConfig.isKill
                      ? processedTargets.has(targetId) ||
                        !isPlayerAlive(targetId)
                      : processedTargets.has(targetId);
                    return (
                      <Pressable
                        key={targetId}
                        onPress={() =>
                          !alreadyDone &&
                          handleTargetAction(targetId, actionConfig)
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
                    );
                  })}
                </View>
              )}
              {isExpanded && feedbackDef && (
                <FeedbackComposer
                  feedbackDef={feedbackDef}
                  players={players}
                  onSend={(fb) => handleSend(action, i, fb)}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
