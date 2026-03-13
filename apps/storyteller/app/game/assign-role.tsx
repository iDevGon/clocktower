import {
  ALL_ROLES,
  EDITION_COLORS,
  EDITION_LABELS,
  getRolesForEdition,
} from '@clocktower/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { AbilityText } from '@clocktower/shared';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useGameStore } from '../../src/stores/gameStore';
import { createAssignRoleStyles } from '../../src/styles/assign-role.styles';

const TEAM_LABEL_COLORS = {
  townsfolk: '#7090c4',
  outsider: '#50a090',
  minion: '#c48850',
  demon: '#b85c5c',
} as const;

const TEAM_NAMES = {
  townsfolk: '마을주민',
  outsider: '외지인',
  minion: '하수인',
  demon: '악마',
} as const;

const TEAM_BORDER_COLORS = {
  townsfolk: '#506aaa',
  outsider: '#3a8878',
  minion: '#b87838',
  demon: '#943c3c',
} as const;

export default function AssignRoleScreen() {
  const router = useRouter();
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createAssignRoleStyles(scale), [scale]);
  const { playerId, editionId, additionalRoleIds: additionalRoleIdsParam } =
    useLocalSearchParams<{
      playerId: string;
      editionId?: string;
      additionalRoleIds?: string;
    }>();
  const { assignRole } = useGameActions();
  const gameState = useGameStore((s) => s.gameState);

  const [searchQuery, setSearchQuery] = useState('');
  // 주정뱅이 가짜 역할 선택 모달 상태
  const [drunkModalVisible, setDrunkModalVisible] = useState(false);

  const selectedEditionId = editionId ?? 'trouble_brewing';
  const additionalIds = useMemo(() => {
    if (!additionalRoleIdsParam || additionalRoleIdsParam === '') {
      return new Set<string>();
    }
    return new Set(additionalRoleIdsParam.split(','));
  }, [additionalRoleIdsParam]);

  // 역할 ID -> 배정된 플레이어 이름 매핑 (현재 플레이어 제외)
  const roleOwnerMap = useMemo(() => {
    if (!gameState) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const p of gameState.players) {
      if (p.id !== playerId && p.role?.id) {
        map.set(p.role.id, p.name);
      }
    }
    return map;
  }, [gameState, playerId]);

  // 이미 다른 플레이어에게 배정된 다른 에디션 역할의 ID 수집
  const manuallyAssignedOtherEditionIds = useMemo(() => {
    if (!gameState) return new Set<string>();
    const editionRoleIds = new Set(
      getRolesForEdition(selectedEditionId).map((r) => r.id),
    );
    const ids = new Set<string>();
    for (const p of gameState.players) {
      if (p.role?.id && !editionRoleIds.has(p.role.id)) {
        ids.add(p.role.id);
      }
    }
    return ids;
  }, [gameState, selectedEditionId]);

  // 현재 에디션 역할 + 추가된 다른 에디션 역할 + 수동 배정된 다른 에디션 역할
  const availableRoles = useMemo(() => {
    const editionRoles = getRolesForEdition(selectedEditionId);
    const editionRoleIds = new Set(editionRoles.map((r) => r.id));
    const extraRoles = ALL_ROLES.filter(
      (r) =>
        !editionRoleIds.has(r.id) &&
        (additionalIds.has(r.id) || manuallyAssignedOtherEditionIds.has(r.id)),
    );
    return [...editionRoles, ...extraRoles];
  }, [selectedEditionId, additionalIds, manuallyAssignedOtherEditionIds]);

  // 검색 필터링
  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q === '') return availableRoles;
    return availableRoles.filter((r) => r.name.toLowerCase().includes(q));
  }, [availableRoles, searchQuery]);

  // 주정뱅이의 가짜 역할로 선택 가능한 마을주민 목록
  const availableTownsfolk = useMemo(
    () => availableRoles.filter((r) => r.team === 'townsfolk'),
    [availableRoles],
  );

  const handleRandomAssign = useCallback(() => {
    if (!playerId) return;
    const unassignedRoles = availableRoles.filter(
      (r) => !roleOwnerMap.has(r.id),
    );
    if (unassignedRoles.length === 0) return;
    const randomRole =
      unassignedRoles[Math.floor(Math.random() * unassignedRoles.length)];
    if (randomRole.id === 'drunk') {
      // 주정뱅이가 랜덤 선택된 경우 가짜 역할도 랜덤 배정
      const townsfolk = unassignedRoles.filter((r) => r.team === 'townsfolk');
      if (townsfolk.length > 0) {
        const fakeRole =
          townsfolk[Math.floor(Math.random() * townsfolk.length)];
        assignRole(playerId, 'drunk', fakeRole.id);
      } else {
        assignRole(playerId, 'drunk');
      }
    } else {
      assignRole(playerId, randomRole.id);
    }
    router.back();
  }, [playerId, availableRoles, roleOwnerMap, assignRole, router]);

  const handleAssign = useCallback(
    (roleId: string) => {
      if (!playerId) return;
      if (roleId === 'drunk') {
        // 주정뱅이를 선택하면 가짜 역할 선택 모달 표시
        setDrunkModalVisible(true);
        return;
      }
      assignRole(playerId, roleId);
      router.back();
    },
    [playerId, assignRole, router],
  );

  const handleDrunkAssign = useCallback(
    (fakeRoleId: string) => {
      if (!playerId) return;
      assignRole(playerId, 'drunk', fakeRoleId);
      setDrunkModalVisible(false);
      router.back();
    },
    [playerId, assignRole, router],
  );

  const handleRandomDrunkAssign = useCallback(() => {
    if (!playerId || availableTownsfolk.length === 0) return;
    const randomFake =
      availableTownsfolk[Math.floor(Math.random() * availableTownsfolk.length)];
    handleDrunkAssign(randomFake.id);
  }, [playerId, availableTownsfolk, handleDrunkAssign]);

  return (
    <View style={styles.container}>
      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="역할 검색..."
        placeholderTextColor="#5a5a5e"
        style={styles.searchInput}
      />
      <FlatList
        data={filteredRoles}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          filteredRoles.length > 0 && searchQuery === '' ? (
            <Pressable
              onPress={handleRandomAssign}
              style={({ pressed }) => [
                styles.randomButton,
                pressed && styles.randomButtonPressed,
              ]}
            >
              <Text style={styles.randomButtonText}>랜덤 배정</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => {
          const ownerName = roleOwnerMap.get(item.id);
          return (
            <Pressable
              onPress={() => handleAssign(item.id)}
              style={({ pressed }) => [
                styles.roleItem,
                { borderLeftColor: TEAM_BORDER_COLORS[item.team] },
                ownerName && styles.roleItemAssigned,
                pressed && styles.roleItemPressed,
              ]}
            >
              <View style={styles.roleHeader}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Text
                    style={[
                      styles.roleName,
                      ownerName && styles.roleNameAssigned,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <EditionBadge editionId={item.edition} />
                </View>
                {ownerName ? (
                  <Text style={styles.assignedLabel}>{ownerName}</Text>
                ) : (
                  <Text
                    style={[
                      styles.teamLabel,
                      { color: TEAM_LABEL_COLORS[item.team] },
                    ]}
                  >
                    {TEAM_NAMES[item.team]}
                  </Text>
                )}
              </View>
              <AbilityText text={item.ability} style={styles.abilityText} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          searchQuery !== '' ? (
            <Text
              style={{
                color: '#908e8a',
                fontSize: 14,
                textAlign: 'center',
                paddingVertical: 20,
              }}
            >
              검색 결과가 없습니다
            </Text>
          ) : null
        }
      />

      {/* 주정뱅이 가짜 역할 선택 모달 */}
      <Modal
        visible={drunkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDrunkModalVisible(false)}
      >
        <Pressable
          style={styles.drunkOverlay}
          onPress={() => setDrunkModalVisible(false)}
        >
          <Pressable
            style={styles.drunkModal}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.drunkModalHeader}>
              <Text style={styles.drunkModalTitle}>
                주정뱅이 가짜 역할 선택
              </Text>
              <Text style={styles.drunkModalSubtitle}>
                주정뱅이가 자신이라고 믿을 마을주민 역할을 선택하세요
              </Text>
            </View>
            <FlatList
              data={availableTownsfolk}
              keyExtractor={(r) => r.id}
              contentContainerStyle={styles.drunkListContent}
              ListHeaderComponent={
                availableTownsfolk.length > 0 ? (
                  <Pressable
                    onPress={handleRandomDrunkAssign}
                    style={({ pressed }) => [
                      styles.randomButton,
                      pressed && styles.randomButtonPressed,
                    ]}
                  >
                    <Text style={styles.randomButtonText}>랜덤 배정</Text>
                  </Pressable>
                ) : null
              }
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleDrunkAssign(item.id)}
                  style={({ pressed }) => [
                    styles.drunkRoleItem,
                    pressed && styles.drunkRoleItemPressed,
                  ]}
                >
                  <Text style={styles.drunkRoleName}>{item.name}</Text>
                  <AbilityText
                    text={item.ability}
                    style={styles.drunkRoleAbility}
                  />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.drunkEmptyText}>
                  선택 가능한 마을주민 역할이 없습니다
                </Text>
              }
            />
            <Pressable
              style={styles.drunkCancelButton}
              onPress={() => setDrunkModalVisible(false)}
            >
              <Text style={styles.drunkCancelText}>취소</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function EditionBadge({ editionId }: { editionId: string }) {
  const label = EDITION_LABELS[editionId] ?? editionId;
  const color = EDITION_COLORS[editionId] ?? '#908e8a';

  return (
    <Text
      style={{
        fontSize: 9,
        fontWeight: '700',
        color,
        borderWidth: 1,
        borderColor: color,
        borderRadius: 3,
        paddingHorizontal: 4,
        paddingVertical: 1,
        overflow: 'hidden',
      }}
    >
      {label}
    </Text>
  );
}
