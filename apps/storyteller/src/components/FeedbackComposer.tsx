import type {
  NightAction,
  NightFeedbackPayload,
  Player,
  Team,
} from '@clocktower/shared';
import { matchQuery } from '@clocktower/ui';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { NumberFeedback } from './feedback/NumberFeedback';
import { PlayersAndRoleFeedback } from './feedback/PlayersAndRoleFeedback';
import { RoleFeedback } from './feedback/RoleFeedback';
import { useGameEditionRoles } from './feedback/useGameEditionRoles';
import { YesNoFeedback } from './feedback/YesNoFeedback';
import { createNightActionLogStyles } from './NightActionLog.styles';

interface FeedbackComposerProps {
  feedbackDef: { type: string; roleTeamFilter?: Team; allowNone?: boolean };
  players: Player[];
  isDrunkUser?: boolean;
  suggestedNumber?: number;
  /** number 피드백의 최대 숫자 (기본 3, 곡예사는 5) */
  maxNumber?: number;
  highlightedRoleName?: string;
  action?: NightAction;
  onSend: (feedback: NightFeedbackPayload) => void;
}

function useNightActionLogStyles() {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  return useMemo(() => createNightActionLogStyles(scale), [scale]);
}

function DreamerFeedback({
  players,
  action,
  isDrunkUser,
  onSend,
}: {
  players: Player[];
  action?: NightAction;
  isDrunkUser?: boolean;
  onSend: (feedback: NightFeedbackPayload) => void;
}) {
  const styles = useNightActionLogStyles();
  const [goodRoleName, setGoodRoleName] = useState<string | null>(null);
  const [evilRoleName, setEvilRoleName] = useState<string | null>(null);
  const [goodQuery, setGoodQuery] = useState('');
  const [evilQuery, setEvilQuery] = useState('');
  const gameRoles = useGameEditionRoles(players);
  const target = action?.targets[0]
    ? players.find((p) => p.id === action.targets[0])
    : undefined;
  const targetName = target?.name ?? '선택한 플레이어';
  const targetRoleName =
    target?.role?.id === 'drunk' && target.drunkAs
      ? gameRoles.find((r) => r.id === target.drunkAs)?.name
      : target?.role?.name;

  const goodRoles = gameRoles.filter(
    (r) => r.team === 'townsfolk' || r.team === 'outsider',
  );
  const evilRoles = gameRoles.filter(
    (r) => r.team === 'minion' || r.team === 'demon',
  );
  const filteredGoodRoles = goodQuery.trim()
    ? goodRoles.filter((r) => matchQuery(r.name, goodQuery.trim()))
    : goodRoles;
  const filteredEvilRoles = evilQuery.trim()
    ? evilRoles.filter((r) => matchQuery(r.name, evilQuery.trim()))
    : evilRoles;
  const canSend = goodRoleName != null && evilRoleName != null;

  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>
        대상: {targetName}
        {targetRoleName && !isDrunkUser ? ` (${targetRoleName})` : ''}
      </Text>
      <Text style={styles.composerLabel}>선한 역할</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="선한 역할 검색"
        placeholderTextColor="#5c5a58"
        value={goodQuery}
        onChangeText={setGoodQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {filteredGoodRoles.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setGoodRoleName(r.name)}
            style={[
              styles.chip,
              goodRoleName === r.name && styles.chipSelected,
              !isDrunkUser &&
                targetRoleName === r.name &&
                goodRoleName !== r.name &&
                styles.chipHinted,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                goodRoleName === r.name && styles.chipTextSelected,
                !isDrunkUser &&
                  targetRoleName === r.name &&
                  goodRoleName !== r.name &&
                  styles.chipTextHinted,
              ]}
            >
              {r.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.composerLabel}>악한 역할</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="악한 역할 검색"
        placeholderTextColor="#5c5a58"
        value={evilQuery}
        onChangeText={setEvilQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {filteredEvilRoles.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => setEvilRoleName(r.name)}
            style={[
              styles.chip,
              evilRoleName === r.name && styles.chipSelected,
              !isDrunkUser &&
                targetRoleName === r.name &&
                evilRoleName !== r.name &&
                styles.chipHinted,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                evilRoleName === r.name && styles.chipTextSelected,
                !isDrunkUser &&
                  targetRoleName === r.name &&
                  evilRoleName !== r.name &&
                  styles.chipTextHinted,
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
            type: 'dreamer_info',
            targetName,
            goodRoleName: goodRoleName as string,
            evilRoleName: evilRoleName as string,
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

function PlayersFeedback({
  players,
  onSend,
}: {
  players: Player[];
  onSend: (feedback: NightFeedbackPayload) => void;
}) {
  const styles = useNightActionLogStyles();
  const [selected, setSelected] = useState<string[]>([]);
  const [playerQuery, setPlayerQuery] = useState('');
  const filteredPlayers = playerQuery.trim()
    ? players.filter((p) => matchQuery(p.name, playerQuery.trim()))
    : players;
  const canSend = selected.length === 2;

  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>플레이어 2명</Text>
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
            onPress={() =>
              setSelected((prev) => {
                if (prev.includes(p.name)) {
                  return prev.filter((name) => name !== p.name);
                }
                if (prev.length >= 2) return [...prev.slice(1), p.name];
                return [...prev, p.name];
              })
            }
            style={[
              styles.chip,
              selected.includes(p.name) && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selected.includes(p.name) && styles.chipTextSelected,
              ]}
            >
              {p.name}
              {p.role ? ` (${p.role.name})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => {
          if (!canSend) return;
          onSend({
            type: 'players',
            playerNames: selected,
            message: '둘 중 한 명이 악마입니다',
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

export function FeedbackComposer({
  feedbackDef,
  players,
  isDrunkUser,
  suggestedNumber,
  maxNumber,
  highlightedRoleName,
  action,
  onSend,
}: FeedbackComposerProps) {
  switch (feedbackDef.type) {
    case 'number':
      return (
        <NumberFeedback
          suggestedNumber={suggestedNumber}
          maxNumber={maxNumber}
          onSend={onSend}
        />
      );
    case 'yes_no':
      return <YesNoFeedback onSend={onSend} />;
    case 'players_and_role':
      return (
        <PlayersAndRoleFeedback
          players={players}
          teamFilter={feedbackDef.roleTeamFilter as Team}
          allowNone={feedbackDef.allowNone}
          isDrunkUser={isDrunkUser}
          onSend={onSend}
        />
      );
    case 'dreamer_info':
      return (
        <DreamerFeedback
          players={players}
          action={action}
          isDrunkUser={isDrunkUser}
          onSend={onSend}
        />
      );
    case 'players':
      return <PlayersFeedback players={players} onSend={onSend} />;
    case 'role':
      return (
        <RoleFeedback
          players={players}
          onSend={onSend}
          highlightedRoleName={highlightedRoleName}
        />
      );
    default:
      return null;
  }
}
