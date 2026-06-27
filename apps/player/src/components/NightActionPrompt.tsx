import type {
  NightActionDef,
  NightFeedbackPayload,
  PlayerInfo,
  Role,
} from '@clocktower/shared';
import { getRoleById, NIGHT_ACTIONS } from '@clocktower/shared';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FeedbackDisplay } from './FeedbackDisplay';
import { styles } from './NightActionPrompt.styles';
import { PhilosopherRolePicker } from './PhilosopherRolePicker';

interface NightActionPromptProps {
  role: Role;
  players: PlayerInfo[];
  myPlayerId: string;
  submitted: boolean;
  feedback: NightFeedbackPayload | null;
  onSubmit: (targets: string[]) => void;
  /** 철학자가 능력을 부여받은 역할 ID (선택 후) */
  philosopherGrantedRoleId?: string | null;
  /** 철학자 첫 밤에 부여받을 역할 선택 콜백 */
  onChoosePhilosopherRole?: (roleId: string) => Promise<void> | void;
}

export function NightActionPrompt({
  role,
  players,
  myPlayerId,
  submitted,
  feedback,
  onSubmit,
  philosopherGrantedRoleId,
  onChoosePhilosopherRole,
}: NightActionPromptProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);

  // 철학자가 아직 역할을 선택하지 않았다면 선택 프롬프트 노출
  if (
    role.id === 'philosopher' &&
    !philosopherGrantedRoleId &&
    !feedback &&
    !submitted
  ) {
    return (
      <View style={styles.container}>
        <Text style={styles.roleName}>{role.name}</Text>
        <Text style={styles.instruction}>
          능력을 부여받을 선한 역할을 선택하세요
        </Text>
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={styles.submitButton}
        >
          <Text style={styles.submitText}>역할 선택</Text>
        </Pressable>
        <PhilosopherRolePicker
          visible={pickerVisible}
          edition={role.edition}
          onPick={async (roleId) => {
            setPickerVisible(false);
            await onChoosePhilosopherRole?.(roleId);
          }}
          onClose={() => setPickerVisible(false)}
        />
      </View>
    );
  }

  // 철학자가 부여받은 역할 → 그 역할의 night action을 사용
  const effectiveRoleId =
    role.id === 'philosopher' && philosopherGrantedRoleId
      ? philosopherGrantedRoleId
      : role.id;
  const effectiveRole: Role =
    effectiveRoleId === role.id ? role : (getRoleById(effectiveRoleId) ?? role);
  const actionDef: NightActionDef | undefined = NIGHT_ACTIONS[effectiveRoleId];

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

  const allowedTargetCounts =
    actionDef.allowedTargetCounts ??
    (actionDef.type === 'select_two' ? [2] : [1]);
  const maxTargets = Math.max(...allowedTargetCounts);
  const availablePlayers = players.filter((p) => {
    if (actionDef.excludeSelf && p.id === myPlayerId) return false;
    if (actionDef.excludeTraveller && p.isTraveller) return false;
    if (actionDef.deadTargetsOnly) return !p.isAlive;
    return actionDef.includeDeadTargets || p.isAlive;
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

  const canSubmit = allowedTargetCounts.includes(selected.length);

  const isPhilosopherChannelled =
    role.id === 'philosopher' && effectiveRole.id !== role.id;

  return (
    <View style={styles.container}>
      <Text style={styles.roleName}>
        {isPhilosopherChannelled
          ? `${role.name} → ${effectiveRole.name}`
          : effectiveRole.name}
      </Text>
      <Text style={styles.instruction}>{actionDef.instruction}</Text>

      <ScrollView
        style={styles.playerScroll}
        contentContainerStyle={styles.playerList}
        nestedScrollEnabled
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
      {actionDef.canSkip && (
        <Pressable onPress={() => onSubmit([])} style={styles.submitButton}>
          <Text style={styles.submitText}>스킵</Text>
        </Pressable>
      )}
    </View>
  );
}
