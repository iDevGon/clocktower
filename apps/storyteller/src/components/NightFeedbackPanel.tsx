import type { NightFeedbackPayload, Player } from '@clocktower/shared';
import { getRoleById, NIGHT_FEEDBACK } from '@clocktower/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { FeedbackComposer } from './FeedbackComposer';
import { styles } from './NightActionLog.styles';

interface NightFeedbackPanelProps {
  activeRoleId: string | null;
  players: Player[];
  onSendFeedback: (playerId: string, feedback: NightFeedbackPayload) => void;
}

export function NightFeedbackPanel({
  activeRoleId,
  players,
  onSendFeedback,
}: NightFeedbackPanelProps) {
  const [sent, setSent] = useState<string | null>(null);

  if (!activeRoleId) return null;

  const feedbackDef = NIGHT_FEEDBACK[activeRoleId];
  if (
    !feedbackDef ||
    feedbackDef.type === 'none' ||
    feedbackDef.type === 'grimoire'
  )
    return null;

  const targetPlayer = players.find((p) => p.role?.id === activeRoleId);
  if (!targetPlayer) return null;

  if (sent === activeRoleId) {
    return (
      <View style={styles.feedbackPanel}>
        <Text style={styles.feedbackPanelSent}>피드백 전송됨</Text>
      </View>
    );
  }

  const handleSend = (fb: NightFeedbackPayload) => {
    onSendFeedback(targetPlayer.id, fb);
    setSent(activeRoleId);
  };

  const role = getRoleById(activeRoleId);

  return (
    <View style={styles.feedbackPanel}>
      <Text style={styles.feedbackPanelTitle}>
        {role?.name ?? activeRoleId} → {targetPlayer.name}
      </Text>
      <FeedbackComposer
        feedbackDef={feedbackDef}
        players={players}
        onSend={handleSend}
      />
    </View>
  );
}
