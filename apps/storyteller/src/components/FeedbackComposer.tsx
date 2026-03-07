import type {
  NightFeedbackPayload,
  Player,
  Team,
} from '@clocktower/shared';
import { TROUBLE_BREWING_ROLES } from '@clocktower/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './NightActionLog.styles';

// -- Feedback type sub-components --

interface FeedbackComposerProps {
  feedbackDef: { type: string; roleTeamFilter?: Team };
  players: Player[];
  onSend: (feedback: NightFeedbackPayload) => void;
}

export function FeedbackComposer({
  feedbackDef,
  players,
  onSend,
}: FeedbackComposerProps) {
  switch (feedbackDef.type) {
    case 'number':
      return <NumberFeedback onSend={onSend} />;
    case 'yes_no':
      return <YesNoFeedback onSend={onSend} />;
    case 'players_and_role':
      return (
        <PlayersAndRoleFeedback
          players={players}
          teamFilter={feedbackDef.roleTeamFilter as Team}
          onSend={onSend}
        />
      );
    case 'role':
      return <RoleFeedback onSend={onSend} />;
    default:
      return null;
  }
}

function NumberFeedback({
  onSend,
}: {
  onSend: (fb: NightFeedbackPayload) => void;
}) {
  return (
    <View style={styles.composerRow}>
      {[0, 1, 2, 3].map((n) => (
        <Pressable
          key={n}
          onPress={() => onSend({ type: 'number', value: n })}
          style={styles.numberButton}
        >
          <Text style={styles.numberText}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function YesNoFeedback({
  onSend,
}: {
  onSend: (fb: NightFeedbackPayload) => void;
}) {
  return (
    <View style={styles.composerRow}>
      <Pressable
        onPress={() => onSend({ type: 'yes_no', value: true })}
        style={[styles.yesNoButton, styles.yesButton]}
      >
        <Text style={styles.yesText}>예</Text>
      </Pressable>
      <Pressable
        onPress={() => onSend({ type: 'yes_no', value: false })}
        style={[styles.yesNoButton, styles.noButton]}
      >
        <Text style={styles.noText}>아니오</Text>
      </Pressable>
    </View>
  );
}

function PlayersAndRoleFeedback({
  players,
  teamFilter,
  onSend,
}: {
  players: Player[];
  teamFilter: Team;
  onSend: (fb: NightFeedbackPayload) => void;
}) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = TROUBLE_BREWING_ROLES.filter((r) => r.team === teamFilter);

  const togglePlayer = (name: string) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 2) return [...prev.slice(1), name];
      return [...prev, name];
    });
  };

  const canSend = selectedPlayers.length === 2 && selectedRole;

  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>플레이어 2명</Text>
      <View style={styles.composerChips}>
        {players.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => togglePlayer(p.name)}
            style={[
              styles.chip,
              selectedPlayers.includes(p.name) && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedPlayers.includes(p.name) && styles.chipTextSelected,
              ]}
            >
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.composerLabel}>역할</Text>
      <View style={styles.composerChips}>
        {roles.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setSelectedRole(r.name)}
            style={[
              styles.chip,
              selectedRole === r.name && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedRole === r.name && styles.chipTextSelected,
              ]}
            >
              {r.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() =>
          canSend &&
          onSend({
            type: 'players_and_role',
            playerNames: selectedPlayers,
            roleName: selectedRole as string,
          })
        }
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        disabled={!canSend}
      >
        <Text style={styles.sendText}>전송</Text>
      </Pressable>
    </View>
  );
}

function RoleFeedback({
  onSend,
}: {
  onSend: (fb: NightFeedbackPayload) => void;
}) {
  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>캐릭터 선택</Text>
      <View style={styles.composerChips}>
        {TROUBLE_BREWING_ROLES.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => onSend({ type: 'role', roleName: r.name })}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{r.name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
