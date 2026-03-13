import type { NightFeedbackPayload, Player, Team } from '@clocktower/shared';
import { ALL_ROLES } from '@clocktower/shared';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { createNightActionLogStyles } from './NightActionLog.styles';

function useNightActionLogStyles() {
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  return useMemo(() => createNightActionLogStyles(scale), [scale]);
}

// -- Feedback type sub-components --

interface FeedbackComposerProps {
  feedbackDef: { type: string; roleTeamFilter?: Team; allowNone?: boolean };
  players: Player[];
  isDrunkUser?: boolean;
  suggestedNumber?: number;
  onSend: (feedback: NightFeedbackPayload) => void;
}

export function FeedbackComposer({
  feedbackDef,
  players,
  isDrunkUser,
  suggestedNumber,
  onSend,
}: FeedbackComposerProps) {
  switch (feedbackDef.type) {
    case 'number':
      return (
        <NumberFeedback suggestedNumber={suggestedNumber} onSend={onSend} />
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
    case 'role':
      return <RoleFeedback onSend={onSend} />;
    default:
      return null;
  }
}

function NumberFeedback({
  suggestedNumber,
  onSend,
}: {
  suggestedNumber?: number;
  onSend: (fb: NightFeedbackPayload) => void;
}) {
  const styles = useNightActionLogStyles();
  const hasSuggestion = suggestedNumber !== undefined;
  return (
    <View style={styles.composerRow}>
      {[0, 1, 2, 3].map((n) => {
        const isSuggested = hasSuggestion && n === suggestedNumber;
        const isDimmed = hasSuggestion && n !== suggestedNumber;
        return (
          <Pressable
            key={n}
            onPress={() => onSend({ type: 'number', value: n })}
            style={[
              styles.numberButton,
              isSuggested && styles.numberButtonSuggested,
              isDimmed && styles.numberButtonDimmed,
            ]}
          >
            <Text
              style={[
                styles.numberText,
                isSuggested && styles.numberTextSuggested,
                isDimmed && styles.numberTextDimmed,
              ]}
            >
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function YesNoFeedback({
  onSend,
}: {
  onSend: (fb: NightFeedbackPayload) => void;
}) {
  const styles = useNightActionLogStyles();
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
  allowNone,
  isDrunkUser,
  onSend,
}: {
  players: Player[];
  teamFilter: Team;
  allowNone?: boolean;
  isDrunkUser?: boolean;
  onSend: (fb: NightFeedbackPayload) => void;
}) {
  const styles = useNightActionLogStyles();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [noneSelected, setNoneSelected] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [pendingRoleName, setPendingRoleName] = useState<string | null>(null);

  const roles = ALL_ROLES.filter((r) => r.team === teamFilter);

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
    for (const p of selected) {
      if (p.role?.id === 'drunk' && p.drunkAs) {
        // 주정뱅이는 drunkAs 역할로 등록됨
        if (roles.some((r) => r.id === p.drunkAs)) {
          real.add(p.drunkAs);
          teamMatch = true;
        }
      } else if (p.role && roles.some((r) => r.id === p.role?.id)) {
        real.add(p.role.id);
        teamMatch = true;
      }
    }
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
              {p.role ? ` (${p.role.name})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.composerLabel}>
        역할{shouldGiveFalseInfo ? ' (거짓 정보 제공 필요)' : ''}
      </Text>
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
        {displayedRoles.map((r) => (
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

function RoleFeedback({
  onSend,
}: {
  onSend: (fb: NightFeedbackPayload) => void;
}) {
  const styles = useNightActionLogStyles();
  return (
    <View style={styles.composerVertical}>
      <Text style={styles.composerLabel}>캐릭터 선택</Text>
      <View style={styles.composerChips}>
        {ALL_ROLES.map((r) => (
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
