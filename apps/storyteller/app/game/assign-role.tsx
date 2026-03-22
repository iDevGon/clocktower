import {
  ALL_ROLES,
  ALL_TRAVELLER_ROLES,
  EDITION_COLORS,
  EDITION_LABELS,
  getRolesForEdition,
  getTravellersForEdition,
  ROLE_DISTRIBUTION,
  type Team,
} from '@clocktower/shared';
import { AbilityText } from '@clocktower/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SectionList,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BluffSelectModal } from '../../src/components/BluffSelectModal';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useGameStore } from '../../src/stores/gameStore';
import { createAssignRoleStyles } from '../../src/styles/assign-role.styles';

const TEAM_LABEL_COLORS: Record<string, string> = {
  townsfolk: '#7090c4',
  outsider: '#50a090',
  minion: '#c48850',
  demon: '#b85c5c',
  traveller: '#a090c0',
};

const TEAM_BORDER_COLORS: Record<string, string> = {
  townsfolk: '#506aaa',
  outsider: '#3a8878',
  minion: '#b87838',
  demon: '#943c3c',
  traveller: '#6a5a8a',
};

export default function AssignRoleScreen() {
  const router = useRouter();
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createAssignRoleStyles(scale), [scale]);
  const {
    playerId,
    editionId,
    additionalRoleIds: additionalRoleIdsParam,
    travellerOnly: travellerOnlyParam,
  } = useLocalSearchParams<{
    playerId: string;
    editionId?: string;
    additionalRoleIds?: string;
    travellerOnly?: string;
  }>();
  const isTravellerOnly = travellerOnlyParam === 'true';
  const { assignRole, addTraveller } = useGameActions();
  const gameState = useGameStore((s) => s.gameState);

  // 대상 플레이어가 여행자인지 확인
  const targetPlayer = gameState?.players.find((p) => p.id === playerId);
  const isTargetTraveller = targetPlayer?.isTraveller === true;

  const [searchQuery, setSearchQuery] = useState('');
  // 주정뱅이 가짜 역할 선택 모달 상태
  const [drunkModalVisible, setDrunkModalVisible] = useState(false);
  const [drunkSearchQuery, setDrunkSearchQuery] = useState('');
  // 악마 블러프 직업 선택 모달 상태
  const [bluffModalVisible, setBluffModalVisible] = useState(false);
  const [pendingDemonRoleId, setPendingDemonRoleId] = useState<string | null>(
    null,
  );
  // 여행자 진영 선택 모달 상태
  const [travellerAlignmentModal, setTravellerAlignmentModal] = useState<
    string | null
  >(null);

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
    return new Map(
      gameState.players
        .filter((p) => p.id !== playerId && p.role?.id)
        .map((p) => [p.role?.id, p.name]),
    );
  }, [gameState, playerId]);

  // 이미 다른 플레이어에게 배정된 다른 에디션 역할의 ID 수집
  const manuallyAssignedOtherEditionIds = useMemo(() => {
    if (!gameState) return new Set<string>();
    const editionRoleIds = new Set(
      getRolesForEdition(selectedEditionId).map((r) => r.id),
    );
    return new Set(
      gameState.players
        .filter((p) => p.role?.id && !editionRoleIds.has(p.role.id))
        .map((p) => p.role?.id),
    );
  }, [gameState, selectedEditionId]);

  // 여행자 역할 목록 (에디션 기반)
  const travellerRoles = useMemo(() => {
    const editionTravellers = getTravellersForEdition(selectedEditionId);
    return editionTravellers.length > 0
      ? editionTravellers
      : ALL_TRAVELLER_ROLES;
  }, [selectedEditionId]);

  // 현재 에디션 역할 + 추가된 다른 에디션 역할 + 수동 배정된 다른 에디션 역할 + 여행자
  const availableRoles = useMemo(() => {
    if (isTravellerOnly) return travellerRoles;
    const editionRoles = getRolesForEdition(selectedEditionId);
    const editionRoleIds = new Set(editionRoles.map((r) => r.id));
    const extraRoles = ALL_ROLES.filter(
      (r) =>
        !editionRoleIds.has(r.id) &&
        (additionalIds.has(r.id) || manuallyAssignedOtherEditionIds.has(r.id)),
    );
    return [...editionRoles, ...extraRoles, ...travellerRoles];
  }, [
    selectedEditionId,
    additionalIds,
    manuallyAssignedOtherEditionIds,
    travellerRoles,
    isTravellerOnly,
  ]);

  // 검색 필터링
  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q === '') return availableRoles;
    return availableRoles.filter((r) => r.name.toLowerCase().includes(q));
  }, [availableRoles, searchQuery]);

  // 팀별 섹션 데이터
  const sections = useMemo(() => {
    const showTravellerOnly = isTravellerOnly || isTargetTraveller;
    const teamOrder: Array<{ team: Team; label: string }> = showTravellerOnly
      ? [{ team: 'traveller', label: '여행자' }]
      : [
          { team: 'townsfolk', label: '마을주민' },
          { team: 'outsider', label: '외지인' },
          { team: 'minion', label: '하수인' },
          { team: 'demon', label: '악마' },
          { team: 'traveller', label: '여행자' },
        ];
    return teamOrder
      .map(({ team, label }) => ({
        team,
        title: label,
        data: filteredRoles.filter((r) => r.team === team),
      }))
      .filter((s) => s.data.length > 0);
  }, [filteredRoles, isTargetTraveller, isTravellerOnly]);

  // 주정뱅이의 가짜 역할로 선택 가능한 마을주민 목록
  const availableTownsfolk = useMemo(
    () => availableRoles.filter((r) => r.team === 'townsfolk'),
    [availableRoles],
  );

  const filteredDrunkTownsfolk = useMemo(() => {
    const query = drunkSearchQuery.trim().toLowerCase();
    if (!query) return availableTownsfolk;
    return availableTownsfolk.filter((r) =>
      r.name.toLowerCase().includes(query),
    );
  }, [availableTownsfolk, drunkSearchQuery]);

  // 인원수별 팀 구성 제약에 따라 아직 슬롯이 남은 팀 계산
  const allowedTeams = useMemo(() => {
    if (!gameState) return new Set<Team>();
    const playerCount = gameState.players.length;
    const dist = ROLE_DISTRIBUTION[playerCount];
    if (!dist)
      return new Set<Team>(['townsfolk', 'outsider', 'minion', 'demon']);

    let [maxTownsfolk, maxOutsider, maxMinion, maxDemon] = dist;

    // 현재 플레이어(배정 대상)를 제외하고 이미 배정된 팀별 인원수
    const assigned = { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
    const otherPlayers = gameState.players.filter((p) => p.id !== playerId);
    const hasBaron = otherPlayers.some((p) => p.role?.id === 'baron');
    otherPlayers.forEach((p) => {
      if (p.role?.team) {
        assigned[p.role.team as keyof typeof assigned] =
          (assigned[p.role.team as keyof typeof assigned] ?? 0) + 1;
      }
    });

    // 남작이 배정되면 외지인 +2, 마을주민 -2
    if (hasBaron) {
      maxOutsider = Math.min(
        maxOutsider + 2,
        playerCount - maxMinion - maxDemon,
      );
      maxTownsfolk = playerCount - maxOutsider - maxMinion - maxDemon;
    }

    const teams = new Set<Team>();
    if (assigned.townsfolk < maxTownsfolk) teams.add('townsfolk');
    if (assigned.outsider < maxOutsider) teams.add('outsider');
    if (assigned.minion < maxMinion) teams.add('minion');
    if (assigned.demon < maxDemon) teams.add('demon');
    return teams;
  }, [gameState, playerId]);

  // 블러프 선택 가능한 역할: 현재 사용 중인 역할 목록에서 미배정 선한 역할만
  const bluffAvailableRoles = useMemo(() => {
    const assignedRoleIds = new Set(
      gameState?.players
        .flatMap((p) => [p.role?.id, p.drunkAs])
        .filter(Boolean) ?? [],
    );
    return availableRoles.filter(
      (r) =>
        (r.team === 'townsfolk' || r.team === 'outsider') &&
        !assignedRoleIds.has(r.id),
    );
  }, [availableRoles, gameState]);

  const handleBluffConfirm = useCallback(
    (selectedIds: string[]) => {
      if (!playerId || !pendingDemonRoleId) return;
      assignRole(
        playerId,
        pendingDemonRoleId,
        undefined,
        selectedIds.length > 0 ? selectedIds : undefined,
      );
      setBluffModalVisible(false);
      setPendingDemonRoleId(null);
      router.back();
    },
    [playerId, pendingDemonRoleId, assignRole, router],
  );

  const handleRandomAssign = useCallback(() => {
    if (!playerId) return;
    // 일반 역할 중에서만 랜덤 (여행자 역할 제외)
    const unassignedRoles = availableRoles.filter(
      (r) =>
        r.team !== 'traveller' &&
        !roleOwnerMap.has(r.id) &&
        allowedTeams.has(r.team),
    );
    if (unassignedRoles.length === 0) return;
    const randomRole =
      unassignedRoles[Math.floor(Math.random() * unassignedRoles.length)];
    if (randomRole.id !== 'drunk') {
      assignRole(playerId, randomRole.id);
      router.back();
      return;
    }
    // 주정뱅이가 랜덤 선택된 경우 가짜 역할도 랜덤 배정
    const townsfolk = unassignedRoles.filter((r) => r.team === 'townsfolk');
    if (townsfolk.length > 0) {
      const fakeRole = townsfolk[Math.floor(Math.random() * townsfolk.length)];
      assignRole(playerId, 'drunk', fakeRole.id);
    } else {
      assignRole(playerId, 'drunk');
    }
    router.back();
  }, [
    playerId,
    availableRoles,
    roleOwnerMap,
    allowedTeams,
    assignRole,
    router,
  ]);

  const handleAssign = useCallback(
    (roleId: string) => {
      if (!playerId) return;
      // 여행자 역할이면 진영 선택 모달
      const traveller = ALL_TRAVELLER_ROLES.find((r) => r.id === roleId);
      if (traveller) {
        setTravellerAlignmentModal(roleId);
        return;
      }
      if (roleId === 'drunk') {
        setDrunkModalVisible(true);
        return;
      }
      const role = ALL_ROLES.find((r) => r.id === roleId);
      if (role?.team === 'demon') {
        setPendingDemonRoleId(roleId);
        setBluffModalVisible(true);
        return;
      }
      assignRole(playerId, roleId);
      router.back();
    },
    [playerId, assignRole, router],
  );

  const handleTravellerAlignmentSelect = useCallback(
    async (alignment: 'good' | 'evil') => {
      if (!playerId || !travellerAlignmentModal) return;
      try {
        await addTraveller(playerId, travellerAlignmentModal, alignment);
        setTravellerAlignmentModal(null);
        router.back();
      } catch (e) {
        Alert.alert('오류', e instanceof Error ? e.message : '배정 실패');
        setTravellerAlignmentModal(null);
      }
    },
    [playerId, travellerAlignmentModal, addTraveller, router],
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
      <SectionList
        sections={sections}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
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
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              { borderColor: TEAM_BORDER_COLORS[section.team] },
            ]}
          >
            <View
              style={[
                styles.sectionDot,
                { backgroundColor: TEAM_LABEL_COLORS[section.team] },
              ]}
            />
            <Text
              style={[
                styles.sectionTitle,
                { color: TEAM_LABEL_COLORS[section.team] },
              ]}
            >
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
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
                <View style={styles.roleHeaderNameRow}>
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
                ) : null}
              </View>
              <AbilityText text={item.ability} style={styles.abilityText} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          searchQuery !== '' ? (
            <Text style={styles.listEmptyText}>검색 결과가 없습니다</Text>
          ) : null
        }
      />

      {/* 악마 블러프 직업 선택 모달 */}
      <BluffSelectModal
        visible={bluffModalVisible}
        onConfirm={handleBluffConfirm}
        onCancel={() => {
          setBluffModalVisible(false);
          setPendingDemonRoleId(null);
        }}
        initialSelectedIds={gameState?.bluffRoles?.map((r) => r.id)}
        availableRoles={bluffAvailableRoles}
        scale={scale}
      />

      {/* 주정뱅이 가짜 역할 선택 모달 */}
      <Modal
        visible={drunkModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDrunkModalVisible(false)}
        onShow={() => setDrunkSearchQuery('')}
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
            <TextInput
              value={drunkSearchQuery}
              onChangeText={setDrunkSearchQuery}
              placeholder="역할 검색…"
              placeholderTextColor="#5a5a5e"
              style={styles.drunkSearchInput}
            />
            <FlatList
              data={filteredDrunkTownsfolk}
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

      {/* 여행자 진영 선택 모달 */}
      <Modal
        visible={!!travellerAlignmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setTravellerAlignmentModal(null)}
      >
        <Pressable
          style={styles.drunkOverlay}
          onPress={() => setTravellerAlignmentModal(null)}
        >
          <Pressable
            style={[styles.drunkModal, { maxHeight: '40%' }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.drunkModalHeader}>
              <Text style={styles.drunkModalTitle}>여행자 진영 선택</Text>
              <Text style={styles.drunkModalSubtitle}>
                {ALL_TRAVELLER_ROLES.find(
                  (r) => r.id === travellerAlignmentModal,
                )?.name ?? ''}{' '}
                - 진영을 선택하세요
              </Text>
            </View>
            <Pressable
              onPress={() => handleTravellerAlignmentSelect('good')}
              style={({ pressed }) => [
                styles.drunkRoleItem,
                { borderLeftColor: '#7090c4', borderLeftWidth: 3 },
                pressed && styles.drunkRoleItemPressed,
              ]}
            >
              <Text style={[styles.drunkRoleName, { color: '#7090c4' }]}>
                선한 여행자
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleTravellerAlignmentSelect('evil')}
              style={({ pressed }) => [
                styles.drunkRoleItem,
                { borderLeftColor: '#b85c5c', borderLeftWidth: 3 },
                pressed && styles.drunkRoleItemPressed,
              ]}
            >
              <Text style={[styles.drunkRoleName, { color: '#b85c5c' }]}>
                악한 여행자
              </Text>
            </Pressable>
            <Pressable
              style={styles.drunkCancelButton}
              onPress={() => setTravellerAlignmentModal(null)}
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
  const badgeStyles = createAssignRoleStyles(1);

  return (
    <Text style={[badgeStyles.editionBadge, { color, borderColor: color }]}>
      {label}
    </Text>
  );
}
