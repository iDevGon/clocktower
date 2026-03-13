import type {
  NightActionDef,
  NightFeedbackPayload,
  PlayerInfo,
  Role,
} from '@clocktower/shared';
import { NIGHT_ACTIONS } from '@clocktower/shared';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FeedbackDisplay } from './FeedbackDisplay';
import { styles } from './NightActionPrompt.styles';

interface NightActionPromptProps {
  role: Role;
  players: PlayerInfo[];
  myPlayerId: string;
  submitted: boolean;
  feedback: NightFeedbackPayload | null;
  onSubmit: (targets: string[]) => void;
}

export function NightActionPrompt({
  role,
  players,
  myPlayerId,
  submitted,
  feedback,
  onSubmit,
}: NightActionPromptProps) {
  const actionDef: NightActionDef | undefined = NIGHT_ACTIONS[role.id];
  const [selected, setSelected] = useState<string[]>([]);

  if (!actionDef) return null;

  if (feedback) {
    return (
      <View style={styles.container}>
        <FeedbackDisplay feedback={feedback} />
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.doneBanner}>
          <Text style={styles.doneText}>행동 완료</Text>
          <Text style={styles.doneSubtext}>진행자의 안내를 기다리세요</Text>
        </View>
      </View>
    );
  }

  if (actionDef.type === 'passive') {
    return (
      <View style={styles.container}>
        <View style={styles.passiveBanner}>
          <Text style={styles.passiveText}>{actionDef.instruction}</Text>
        </View>
      </View>
    );
  }

  const maxTargets = actionDef.type === 'select_two' ? 2 : 1;
  const availablePlayers = players.filter((p) => {
    if (actionDef.excludeSelf && p.id === myPlayerId) return false;
    return p.isAlive;
  });

  const handleToggle = (playerId: string) => {
    setSelected((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }
      if (prev.length >= maxTargets) {
        return [...prev.slice(1), playerId];
      }
      return [...prev, playerId];
    });
  };

  const canSubmit = selected.length === maxTargets;

  return (
    <View style={styles.container}>
      <Text style={styles.roleName}>{role.name}</Text>
      <Text style={styles.instruction}>{actionDef.instruction}</Text>

      <ScrollView
        style={styles.playerScroll}
        contentContainerStyle={styles.playerList}
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
      >
        {availablePlayers.map((player) => {
          const isSelected = selected.includes(player.id);
          return (
            <Pressable
              key={player.id}
              onPress={() => handleToggle(player.id)}
              style={[
                styles.playerItem,
                isSelected && styles.playerItemSelected,
              ]}
            >
              <Text
                style={[
                  styles.playerName,
                  isSelected && styles.playerNameSelected,
                ]}
              >
                {player.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable
        onPress={() => canSubmit && onSubmit(selected)}
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        disabled={!canSubmit}
      >
        <Text
          style={[styles.submitText, !canSubmit && styles.submitTextDisabled]}
        >
          확인
        </Text>
      </Pressable>
    </View>
  );
}
