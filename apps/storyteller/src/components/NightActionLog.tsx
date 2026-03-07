import type {
  NightAction,
  NightFeedbackPayload,
  Player,
} from '@clocktower/shared';
import { getRoleById, NIGHT_FEEDBACK } from '@clocktower/shared';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FeedbackComposer } from './FeedbackComposer';
import { styles } from './NightActionLog.styles';

export { NightFeedbackPanel } from './NightFeedbackPanel';

interface NightActionLogProps {
  actions: NightAction[];
  players: Player[];
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
}

export function NightActionLog({
  actions,
  players,
  onSendFeedback,
}: NightActionLogProps) {
  const getPlayerName = (id: string) =>
    players.find((p) => p.id === id)?.name ?? id;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [sentIndices, setSentIndices] = useState<Set<number>>(new Set());

  const handleSend = (
    action: NightAction,
    index: number,
    feedback: NightFeedbackPayload,
  ) => {
    onSendFeedback(action.playerId, feedback);
    setSentIndices((prev) => new Set(prev).add(index));
    setExpandedIndex(null);
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
                {isSent && <Text style={styles.sentBadge}>전송됨</Text>}
              </View>
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
