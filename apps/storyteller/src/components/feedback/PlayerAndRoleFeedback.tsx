import type { NightFeedbackPayload, Player } from '@clocktower/shared';
import { matchQuery } from '@clocktower/ui';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { createNightActionLogStyles } from '../NightActionLog.styles';
import { useGameEditionRoles } from './useGameEditionRoles';

function useNightActionLogStyles() {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  return useMemo(() => createNightActionLogStyles(scale), [scale]);
}

interface PlayerAndRoleFeedbackProps {
  players: Player[];
  onSend: (fb: NightFeedbackPayload) => void;
}

export function PlayerAndRoleFeedback({
  players,
  onSend,
}: PlayerAndRoleFeedbackProps) {
  const styles = useNightActionLogStyles();
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(
    null,
  );
  const [selectedRoleName, setSelectedRoleName] = useState<string | null>(null);
  const [playerQuery, setPlayerQuery] = useState('');
  const [roleQuery, setRoleQuery] = useState('');
  const gameRoles = useGameEditionRoles(players);

  const filteredPlayers = playerQuery.trim()
    ? players.filter((p) => matchQuery(p.name, playerQuery.trim()))
    : players;
  const filteredRoles = roleQuery.trim()
    ? gameRoles.filter((r) => matchQuery(r.name, roleQuery.trim()))
    : gameRoles;
  const canSend = selectedPlayerName != null && selectedRoleName != null;

  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>플레이어 1명</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="플레이어 검색"
        placeholderTextColor="#5c5a58"
        value={playerQuery}
        onChangeText={setPlayerQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {filteredPlayers.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setSelectedPlayerName(p.name)}
            style={[
              styles.chip,
              selectedPlayerName === p.name && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedPlayerName === p.name && styles.chipTextSelected,
              ]}
            >
              {p.name}
              {p.role ? ` (${p.role.name})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.composerLabel}>역할 1개</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="역할 검색"
        placeholderTextColor="#5c5a58"
        value={roleQuery}
        onChangeText={setRoleQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {filteredRoles.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setSelectedRoleName(r.name)}
            style={[
              styles.chip,
              selectedRoleName === r.name && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedRoleName === r.name && styles.chipTextSelected,
              ]}
            >
              {r.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => {
          if (!canSend) return;
          onSend({
            type: 'player_and_role',
            playerName: selectedPlayerName as string,
            roleName: selectedRoleName as string,
          });
        }}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        disabled={!canSend}
      >
        <Text style={styles.sendText}>전송</Text>
      </Pressable>
    </View>
  );
}
