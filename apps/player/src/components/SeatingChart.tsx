import type { Phase, PlayerInfo, Role, Team } from '@clocktower/shared';
import { colors } from '@clocktower/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { voteHandDown, voteHandRaised } from '../assets/ui';
import type { VoteHistoryEntry } from '../stores/playerStore';
import { styles as s } from './SeatingChart.styles';

interface SeatingChartProps {
  visible: boolean;
  players: PlayerInfo[];
  myId: string;
  phase: Phase;
  roleOptions: Role[];
  roleNotes: Record<string, string>;
  playerNotes: Record<string, string>;
  voteHistory: VoteHistoryEntry[];
  onSetRoleNote: (playerId: string, note: string) => void;
  onSetPlayerNote: (playerId: string, note: string) => void;
  onClose: () => void;
}

const TOKEN_SIZE = 56;
const MODAL_HORIZONTAL_PADDING = 68;
const MAX_RING_SIZE = 400;
const MIN_RING_SIZE = 280;
const TEAM_ORDER: Team[] = [
  'townsfolk',
  'outsider',
  'minion',
  'demon',
  'traveller',
];
const TEAM_LABELS: Record<Team, string> = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
  traveller: '여행자',
};

export function SeatingChart({
  visible,
  players,
  myId,
  phase,
  roleOptions,
  roleNotes,
  playerNotes,
  voteHistory,
  onSetRoleNote,
  onSetPlayerNote,
  onClose,
}: SeatingChartProps) {
  // 밤 진입 시점의 사망자 ID를 스냅샷으로 저장
  const deadBeforeNight = useRef<Set<string>>(new Set());
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedVoteId, setSelectedVoteId] = useState<string | null>(null);
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    if (phase === 'night') {
      deadBeforeNight.current = new Set(
        players.filter((p) => !p.isAlive).map((p) => p.id),
      );
    }
  }, [phase, players]);

  const areaSize = useMemo(() => {
    const availableWidth = Math.max(0, windowWidth - MODAL_HORIZONTAL_PADDING);
    return Math.max(
      Math.min(MIN_RING_SIZE, availableWidth),
      Math.min(availableWidth, MAX_RING_SIZE),
    );
  }, [windowWidth]);

  const tokenSize = useMemo(() => {
    if (players.length <= 6) return TOKEN_SIZE;
    if (players.length <= 10) return 50;
    if (players.length <= 14) return 44;
    return 40;
  }, [players.length]);

  const positions = useMemo(() => {
    const center = areaSize / 2;
    const radius = center - tokenSize / 2 - 8;
    return players.map((_, i) => {
      const angle = (i / players.length) * 2 * Math.PI - Math.PI / 2;
      return {
        x: center + radius * Math.cos(angle) - tokenSize / 2,
        y: center + radius * Math.sin(angle) - tokenSize / 2,
      };
    });
  }, [players, areaSize, tokenSize]);

  const visibleVoteHistory = useMemo(
    () => [...voteHistory].reverse(),
    [voteHistory],
  );

  const selectedVote = useMemo(
    () => voteHistory.find((entry) => entry.id === selectedVoteId) ?? null,
    [selectedVoteId, voteHistory],
  );

  const selectedEligibleVoterIds = useMemo(
    () => new Set(selectedVote?.eligibleVoterIds ?? []),
    [selectedVote],
  );

  const editingPlayer = useMemo(
    () => players.find((p) => p.id === editingPlayerId) ?? null,
    [editingPlayerId, players],
  );
  const filteredRoleGroups = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    return TEAM_ORDER.map((team) => {
      const roles = roleOptions.filter((role) => {
        if (role.team !== team) return false;
        if (!query) return true;
        return (
          role.name.toLowerCase().includes(query) ||
          role.id.toLowerCase().includes(query)
        );
      });
      return { team, roles };
    }).filter((group) => group.roles.length > 0);
  }, [roleOptions, roleSearch]);

  useEffect(() => {
    if (!visible) {
      setEditingPlayerId(null);
      setRoleSearch('');
      setSelectedVoteId(null);
    }
  }, [visible]);

  useEffect(() => {
    if (
      selectedVoteId &&
      !voteHistory.some((entry) => entry.id === selectedVoteId)
    ) {
      setSelectedVoteId(null);
    }
  }, [selectedVoteId, voteHistory]);

  const openNoteEditor = useCallback((player: PlayerInfo) => {
    setEditingPlayerId(player.id);
    setRoleSearch('');
  }, []);

  const closeNoteEditor = useCallback(() => {
    setEditingPlayerId(null);
    setRoleSearch('');
  }, []);

  const selectRoleNote = useCallback(
    (roleName: string) => {
      if (!editingPlayerId) return;
      onSetRoleNote(editingPlayerId, roleName);
      closeNoteEditor();
    },
    [closeNoteEditor, editingPlayerId, onSetRoleNote],
  );

  const clearNote = useCallback(() => {
    if (!editingPlayerId) return;
    onSetRoleNote(editingPlayerId, '');
    closeNoteEditor();
  }, [closeNoteEditor, editingPlayerId, onSetRoleNote]);

  const renderSelectedVoteOverlay = useCallback(() => {
    if (!selectedVote) return null;
    const fromIndex = players.findIndex(
      (p) => p.id === selectedVote.nominatorId,
    );
    const toIndex = players.findIndex((p) => p.id === selectedVote.nomineeId);
    if (fromIndex < 0 || toIndex < 0) return null;

    const from = positions[fromIndex];
    const to = positions[toIndex];
    const fromX = from.x + tokenSize / 2;
    const fromY = from.y + tokenSize / 2;
    const toX = to.x + tokenSize / 2;
    const toY = to.y + tokenSize / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.max(0, Math.hypot(dx, dy));
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return (
      <View pointerEvents="none" style={s.voteOverlay}>
        <View
          style={[
            s.nominationArrow,
            {
              left: fromX,
              top: fromY,
              width: distance,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
        <View
          style={[
            s.nominationArrowHead,
            {
              left: toX - 8,
              top: toY - 6,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      </View>
    );
  }, [players, positions, selectedVote, tokenSize]);

  const renderToken = useCallback(
    (player: PlayerInfo, index: number) => {
      const isMe = player.id === myId;
      const pos = positions[index];
      const fontSize = tokenSize <= 44 ? 10 : 11;
      const note = roleNotes[player.id];
      const playerNote = playerNotes[player.id];

      // 밤에는 밤 진입 전 이미 죽었던 사람만 사망 표시
      // 그 외 페이즈에서는 서버 상태 그대로 표시
      const showDeath =
        phase === 'night'
          ? deadBeforeNight.current.has(player.id)
          : !player.isAlive && phase !== 'setup';

      // 사망자 중 투표권이 남아있으면 푸른 글로우
      const hasGhostVote = showDeath && !player.deadVoteUsed;
      const votingLabel = player.isAlive
        ? '투표 가능'
        : player.deadVoteUsed
          ? '사용됨'
          : '유령표';
      const isSelectedVoteEligible =
        selectedEligibleVoterIds.has(player.id) ||
        selectedVote?.votes[player.id] === true;
      const selectedVoteRaised = selectedVote?.votes[player.id] === true;

      const borderColor = isMe
        ? colors.phase.day
        : hasGhostVote
          ? '#5aa0d0'
          : '#3a3a42';

      return (
        <Pressable
          key={player.id}
          onPress={() => openNoteEditor(player)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${player.name} 예상 직업 메모`}
          style={({ pressed }) => [
            s.token,
            {
              width: tokenSize,
              height: tokenSize,
              left: pos.x,
              top: pos.y,
              borderColor,
              borderWidth: isMe ? 2.5 : hasGhostVote ? 2 : 1.5,
              opacity: showDeath ? 0.42 : 1,
              shadowColor: hasGhostVote ? '#5aa0d0' : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: hasGhostVote ? 0.8 : 0,
              shadowRadius: hasGhostVote ? 8 : 0,
              elevation: hasGhostVote ? 8 : 0,
            },
            isMe && s.tokenMe,
            selectedVote?.nominatorId === player.id && s.nominatorToken,
            selectedVote?.nomineeId === player.id && s.nomineeToken,
            pressed && s.tokenPressed,
          ]}
        >
          <Text
            style={[s.name, { fontSize }, isMe && s.nameMe]}
            numberOfLines={1}
          >
            {player.name}
          </Text>
          {note && (
            <Text
              style={[s.roleNote, { fontSize: fontSize - 1 }]}
              numberOfLines={1}
            >
              {note}
            </Text>
          )}
          {playerNote && (
            <Text
              style={[s.playerNote, { fontSize: fontSize - 2 }]}
              numberOfLines={1}
            >
              {playerNote}
            </Text>
          )}
          {player.isTraveller && (
            <Text style={[s.travellerTag, { fontSize: fontSize - 2 }]}>
              여행자
            </Text>
          )}
          {showDeath && (
            <View style={s.deadRow}>
              <Text style={[s.dead, { fontSize: fontSize - 1 }]}>사망</Text>
            </View>
          )}
          <View
            style={[
              s.voteRightBadge,
              player.isAlive
                ? s.voteRightAlive
                : player.deadVoteUsed
                  ? s.voteRightSpent
                  : s.voteRightGhost,
            ]}
          >
            <Text
              style={[
                s.voteRightText,
                !player.isAlive && !player.deadVoteUsed && s.voteRightGhostText,
              ]}
              numberOfLines={1}
            >
              {votingLabel}
            </Text>
          </View>
          {selectedVote && isSelectedVoteEligible && (
            <View
              style={[
                s.voteHandBadge,
                selectedVoteRaised ? s.voteHandRaised : s.voteHandDown,
              ]}
            >
              <Image
                source={selectedVoteRaised ? voteHandRaised : voteHandDown}
                style={s.voteHandImage}
                resizeMode="contain"
              />
            </View>
          )}
        </Pressable>
      );
    },
    [
      myId,
      openNoteEditor,
      playerNotes,
      positions,
      roleNotes,
      selectedEligibleVoterIds,
      selectedVote,
      tokenSize,
      phase,
    ],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={s.container}>
          <View style={s.header}>
            <Text style={s.title}>좌석 배치</Text>
            <Pressable
              onPress={onClose}
              style={s.closeButton}
              accessibilityRole="button"
              accessibilityLabel="좌석 배치 닫기"
            >
              <Text style={s.closeText}>닫기</Text>
            </Pressable>
          </View>

          <View style={[s.ring, { width: areaSize, height: areaSize }]}>
            {renderSelectedVoteOverlay()}
            {players.map(renderToken)}
          </View>

          <View style={s.historyPanel}>
            <View style={s.historyHeader}>
              <Text style={s.historyTitle}>투표 기록</Text>
              {selectedVote && (
                <Pressable
                  onPress={() => setSelectedVoteId(null)}
                  style={s.clearVoteButton}
                  accessibilityRole="button"
                  accessibilityLabel="투표 기록 선택 해제"
                >
                  <Text style={s.clearVoteText}>해제</Text>
                </Pressable>
              )}
            </View>
            {visibleVoteHistory.length === 0 ? (
              <Text style={s.emptyHistory}>기록 없음</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.historyList}
              >
                {visibleVoteHistory.map((entry) => {
                  const guiltyCount = Object.values(entry.votes).filter(
                    Boolean,
                  ).length;
                  const selected = entry.id === selectedVoteId;
                  return (
                    <Pressable
                      key={entry.id}
                      onPress={() =>
                        setSelectedVoteId(selected ? null : entry.id)
                      }
                      style={[s.historyChip, selected && s.historyChipSelected]}
                      accessibilityRole="button"
                      accessibilityLabel={`${entry.round}번째 투표 기록`}
                    >
                      <Text style={s.historyChipRound}>#{entry.round}</Text>
                      <Text style={s.historyChipNames} numberOfLines={1}>
                        {entry.nominatorName} → {entry.nomineeName}
                      </Text>
                      <Text style={s.historyChipVotes}>{guiltyCount}표</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {editingPlayer && (
            <View style={s.noteEditorOverlay}>
              <View style={s.noteEditorPanel}>
                <Text style={s.noteEditorName}>{editingPlayer.name}</Text>
                <Text style={s.noteEditorLabel}>예상 직업</Text>
                <TextInput
                  value={roleSearch}
                  onChangeText={setRoleSearch}
                  style={s.roleSearchInput}
                  placeholder="직업 검색"
                  placeholderTextColor="#6f6870"
                  maxLength={24}
                  autoFocus
                  autoCorrect={false}
                />
                <Text style={s.noteEditorLabel}>직접 메모</Text>
                <TextInput
                  value={playerNotes[editingPlayer.id] ?? ''}
                  onChangeText={(text) =>
                    onSetPlayerNote(editingPlayer.id, text)
                  }
                  style={s.playerNoteInput}
                  placeholder="플레이어별 메모 입력"
                  placeholderTextColor="#6f6870"
                  maxLength={80}
                  multiline
                  autoCorrect={false}
                />
                <ScrollView
                  style={s.rolePickerList}
                  contentContainerStyle={s.rolePickerContent}
                  showsVerticalScrollIndicator={false}
                >
                  {filteredRoleGroups.length === 0 ? (
                    <Text style={s.emptyRoleSearch}>검색 결과 없음</Text>
                  ) : (
                    filteredRoleGroups.map((group) => (
                      <View key={group.team} style={s.roleGroup}>
                        <Text style={s.roleGroupTitle}>
                          {TEAM_LABELS[group.team]}
                        </Text>
                        <View style={s.roleOptionList}>
                          {group.roles.map((role) => {
                            const selected =
                              roleNotes[editingPlayer.id] === role.name;
                            return (
                              <Pressable
                                key={role.id}
                                onPress={() => selectRoleNote(role.name)}
                                style={[
                                  s.roleOptionButton,
                                  selected && s.roleOptionButtonSelected,
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel={`${role.name} 예상 직업 선택`}
                              >
                                <Text
                                  style={[
                                    s.roleOptionName,
                                    selected && s.roleOptionNameSelected,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {role.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    ))
                  )}
                </ScrollView>
                <View style={s.noteEditorActions}>
                  {roleNotes[editingPlayer.id] ? (
                    <Pressable
                      onPress={clearNote}
                      style={[s.noteButton, s.noteButtonSecondary]}
                      accessibilityRole="button"
                    >
                      <Text style={s.noteButtonSecondaryText}>지우기</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={closeNoteEditor}
                    style={[s.noteButton, s.noteButtonSecondary]}
                    accessibilityRole="button"
                  >
                    <Text style={s.noteButtonSecondaryText}>닫기</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
