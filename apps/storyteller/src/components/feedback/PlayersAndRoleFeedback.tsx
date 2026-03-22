import type { NightFeedbackPayload, Player, Team } from '@clocktower/shared';
import { matchQuery } from '@clocktower/ui';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { createNightActionLogStyles } from '../NightActionLog.styles';
import { useGameEditionRoles } from './useGameEditionRoles';

function useNightActionLogStyles() {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  return useMemo(() => createNightActionLogStyles(scale), [scale]);
}

interface PlayersAndRoleFeedbackProps {
  players: Player[];
  teamFilter: Team;
  allowNone?: boolean;
  isDrunkUser?: boolean;
  onSend: (fb: NightFeedbackPayload) => void;
}

export function PlayersAndRoleFeedback({
  players,
  teamFilter,
  allowNone,
  isDrunkUser,
  onSend,
}: PlayersAndRoleFeedbackProps) {
  const styles = useNightActionLogStyles();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [noneSelected, setNoneSelected] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [pendingRoleName, setPendingRoleName] = useState<string | null>(null);
  const [playerQuery, setPlayerQuery] = useState('');
  const [roleQuery, setRoleQuery] = useState('');

  const gameRoles = useGameEditionRoles(players);
  const roles = useMemo(
    () => gameRoles.filter((r) => r.team === teamFilter),
    [gameRoles, teamFilter],
  );

  const filteredPlayers = useMemo(() => {
    if (!playerQuery.trim()) return players;
    return players.filter((p) => matchQuery(p.name, playerQuery.trim()));
  }, [players, playerQuery]);

  const togglePlayer = (name: string) => {
    setNoneSelected(false);
    setSelectedPlayers((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 2) return [...prev.slice(1), name];
      return [...prev, name];
    });
    setSelectedRole(null);
  };

  // 선택된 플레이어의 역할에 따른 힌트 하이라이트 계산
  // 주정뱅이는 drunkAs 역할로 등록됨 (본인은 취한 줄 모름)
  const { realRoleIds, hasTeamMatchPlayer } = useMemo(() => {
    if (selectedPlayers.length === 0)
      return { realRoleIds: new Set<string>(), hasTeamMatchPlayer: false };
    const selected = players.filter((p) => selectedPlayers.includes(p.name));
    const real = new Set<string>();
    let teamMatch = false;
    selected.forEach((p) => {
      if (p.role?.id === 'drunk') {
        // 주정뱅이는 외지인이므로 외지인 필터에 매치
        if (roles.some((r) => r.id === 'drunk')) {
          real.add('drunk');
          teamMatch = true;
        }
      } else if (p.role && roles.some((r) => r.id === p.role?.id)) {
        real.add(p.role.id);
        teamMatch = true;
      }
    });
    return { realRoleIds: real, hasTeamMatchPlayer: teamMatch };
  }, [selectedPlayers, players, roles]);

  // 거짓 정보를 줘야 하는 경우: 능력 사용자가 주정뱅이일 때만
  const shouldGiveFalseInfo = isDrunkUser ?? false;

  const highlightedRoleIds = useMemo(() => {
    if (selectedPlayers.length === 0) return new Set<string>();
    // 주정뱅이면 하이라이트 비활성화
    if (shouldGiveFalseInfo) return new Set<string>();
    // 정상: 실제 역할을 하이라이트
    return realRoleIds;
  }, [selectedPlayers.length, shouldGiveFalseInfo, realRoleIds]);

  // 정상 피드백일 때 선택된 플레이어의 실제 역할만 표시
  // 팀 필터에 맞는 플레이어가 있으면 그 역할만, 없으면 전체 (자유 선택)
  const displayedRoles = useMemo(() => {
    if (shouldGiveFalseInfo || selectedPlayers.length === 0) return roles;
    if (hasTeamMatchPlayer) return roles.filter((r) => realRoleIds.has(r.id));
    return roles;
  }, [
    shouldGiveFalseInfo,
    selectedPlayers.length,
    roles,
    realRoleIds,
    hasTeamMatchPlayer,
  ]);

  const filteredRoles = useMemo(() => {
    if (!roleQuery.trim()) return displayedRoles;
    return displayedRoles.filter((r) => matchQuery(r.name, roleQuery.trim()));
  }, [displayedRoles, roleQuery]);

  // 정상 피드백에서 역할이 하나뿐이면 자동 선택
  useEffect(() => {
    if (
      !shouldGiveFalseInfo &&
      selectedPlayers.length === 2 &&
      displayedRoles.length === 1
    ) {
      setSelectedRole(displayedRoles[0].name);
    }
  }, [shouldGiveFalseInfo, selectedPlayers.length, displayedRoles]);

  const canSend =
    noneSelected || (selectedPlayers.length === 2 && selectedRole);

  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>플레이어 2명</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="플레이어 검색 (초성 가능)"
        placeholderTextColor="#5c5a58"
        value={playerQuery}
        onChangeText={setPlayerQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {filteredPlayers.map((p) => (
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
              {p.role ? ` (${p.role.name})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.composerLabel}>
        역할{shouldGiveFalseInfo ? ' (거짓 정보 제공 필요)' : ''}
      </Text>
      <TextInput
        style={styles.searchInput}
        placeholder="역할 검색 (초성 가능)"
        placeholderTextColor="#5c5a58"
        value={roleQuery}
        onChangeText={setRoleQuery}
        autoCorrect={false}
      />
      <View style={styles.composerChips}>
        {allowNone && (
          <Pressable
            onPress={() => {
              setNoneSelected((prev) => !prev);
              setSelectedPlayers([]);
              setSelectedRole(null);
            }}
            style={[styles.chip, noneSelected && styles.chipSelected]}
          >
            <Text
              style={[styles.chipText, noneSelected && styles.chipTextSelected]}
            >
              외지인 없음
            </Text>
          </Pressable>
        )}
        {filteredRoles.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => {
              if (isDrunkUser && realRoleIds.has(r.id)) {
                // 능력 사용자가 주정뱅이인데 진짜 직업을 선택하면 경고
                setPendingRoleName(r.name);
                setWarningVisible(true);
                return;
              }
              if (
                !isDrunkUser &&
                selectedPlayers.length === 2 &&
                hasTeamMatchPlayer &&
                !realRoleIds.has(r.id)
              ) {
                // 정상 능력 사용자인데 부정확한 직업을 선택하면 경고
                setPendingRoleName(r.name);
                setWarningVisible(true);
                return;
              }
              setNoneSelected(false);
              setSelectedRole(r.name);
            }}
            style={[
              styles.chip,
              selectedRole === r.name && styles.chipSelected,
              selectedRole !== r.name &&
                highlightedRoleIds.has(r.id) &&
                styles.chipHinted,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedRole === r.name && styles.chipTextSelected,
                selectedRole !== r.name &&
                  highlightedRoleIds.has(r.id) &&
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
          if (noneSelected) {
            onSend({ type: 'no_match', message: '외지인 없음' });
            return;
          }
          onSend({
            type: 'players_and_role',
            playerNames: selectedPlayers,
            roleName: selectedRole as string,
          });
        }}
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        disabled={!canSend}
      >
        <Text style={styles.sendText}>전송</Text>
      </Pressable>

      <Modal
        visible={warningVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWarningVisible(false)}
      >
        <View style={styles.drunkModalOverlay}>
          <View style={styles.drunkModalContent}>
            <Text style={styles.drunkModalTitle}>
              {isDrunkUser ? '⚠️ 진짜 직업 선택' : '⚠️ 잘못된 직업 선택'}
            </Text>
            <Text style={styles.drunkModalMessage}>
              {isDrunkUser
                ? `선택한 직업은 해당 플레이어의 실제 직업입니다.\n거짓 정보를 제공해야 하는 상황입니다.\n그래도 선택하시겠습니까?`
                : `선택한 직업은 해당 플레이어들의 실제 직업과 일치하지 않습니다.\n정확한 정보를 제공해야 하는 상황입니다.\n그래도 선택하시겠습니까?`}
            </Text>
            <View style={styles.drunkModalButtons}>
              <Pressable
                style={styles.drunkModalCancel}
                onPress={() => {
                  setPendingRoleName(null);
                  setWarningVisible(false);
                }}
              >
                <Text style={styles.drunkModalCancelText}>취소</Text>
              </Pressable>
              <Pressable
                style={styles.drunkModalConfirm}
                onPress={() => {
                  setNoneSelected(false);
                  setSelectedRole(pendingRoleName);
                  setPendingRoleName(null);
                  setWarningVisible(false);
                }}
              >
                <Text style={styles.drunkModalConfirmText}>선택</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
