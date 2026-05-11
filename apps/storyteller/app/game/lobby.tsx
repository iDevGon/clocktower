import type { Player } from '@clocktower/shared';
import {
  ALL_ROLES,
  EDITIONS,
  getRoleById,
  getRolesForEdition,
  ROLE_DISTRIBUTION,
  TEAM_COLORS,
} from '@clocktower/shared';
import { SpriteIcon } from '@clocktower/ui';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { arcaneUiSprite, uiIcon } from '../../src/assets/ui';
import { BluffSelectModal } from '../../src/components/BluffSelectModal';
import { ClockSpeedSetting } from '../../src/components/ClockSpeedSetting';
import { CollapsibleSection } from '../../src/components/CollapsibleSection';
import { DrunkFakeRoleModal } from '../../src/components/DrunkFakeRoleModal';
import { RoleExcludeModal } from '../../src/components/RoleExcludeModal';
import { RoleMixModal } from '../../src/components/RoleMixModal';
import { SettingToggle } from '../../src/components/SettingToggle';
import { IS_DEV } from '../../src/constants';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useGameStore } from '../../src/stores/gameStore';
import { createLobbyStyles, lobbyDynamic } from '../../src/styles/lobby.styles';

export default function LobbyScreen() {
  const router = useRouter();
  const { fontSize, isDesktopConsole } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createLobbyStyles(scale), [scale]);
  const gameState = useGameStore((s) => s.gameState);
  const {
    startGame,
    distributeRoles,
    assignRole,
    addDummyPlayers,
    removeDummyPlayers,
    setGameSettings,
    kickPlayer,
    unassignAllRoles,
  } = useGameActions();
  const [distributing, setDistributing] = useState(false);
  const [selectedEditionId, setSelectedEditionId] = useState('trouble_brewing');
  const [excludedRoleIds, setExcludedRoleIds] = useState<Set<string>>(
    new Set(),
  );
  const [showExcludeModal, setShowExcludeModal] = useState(false);
  const [additionalRoleIds, setAdditionalRoleIds] = useState<Set<string>>(
    new Set(),
  );
  const [showMixModal, setShowMixModal] = useState(false);
  const [excludeSearch, setExcludeSearch] = useState('');
  const [mixSearch, setMixSearch] = useState('');
  const [roleSettingsOpen, setRoleSettingsOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [rolesVeiled, setRolesVeiled] = useState(false);

  // 주정뱅이 가짜 역할 변경 모달 상태
  const [drunkModalPlayer, setDrunkModalPlayer] = useState<Player | null>(null);

  // 악마 블러프 직업 변경 모달 상태
  const [bluffChangePlayer, setBluffChangePlayer] = useState<Player | null>(
    null,
  );

  const bluffAvailableRoles = useMemo(() => {
    const editionRoleIds = new Set(
      getRolesForEdition(selectedEditionId).map((r) => r.id),
    );
    const activeRoleIds = new Set([...editionRoleIds, ...additionalRoleIds]);
    const assignedRoleIds = new Set(
      gameState?.players
        .flatMap((p) => [p.role?.id, p.drunkAs])
        .filter(Boolean) ?? [],
    );
    return ALL_ROLES.filter(
      (r) =>
        (r.team === 'townsfolk' || r.team === 'outsider') &&
        activeRoleIds.has(r.id) &&
        !assignedRoleIds.has(r.id),
    );
  }, [gameState, selectedEditionId, additionalRoleIds]);

  const handleBluffConfirm = useCallback(
    (selectedIds: string[]) => {
      if (!bluffChangePlayer) return;
      assignRole(
        bluffChangePlayer.id,
        bluffChangePlayer.role?.id ?? '',
        undefined,
        selectedIds,
      );
      setBluffChangePlayer(null);
    },
    [bluffChangePlayer, assignRole],
  );

  const editionRoles = useMemo(
    () => getRolesForEdition(selectedEditionId),
    [selectedEditionId],
  );

  const toggleExcludedRole = useCallback((roleId: string) => {
    setExcludedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }, []);

  // 현재 에디션에 없는 다른 에디션 역할 목록 (믹싱 가능)
  const mixableRoles = useMemo(() => {
    const editionRoleIds = new Set(editionRoles.map((r) => r.id));
    return ALL_ROLES.filter((r) => !editionRoleIds.has(r.id));
  }, [editionRoles]);

  const toggleAdditionalRole = useCallback((roleId: string) => {
    setAdditionalRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }, []);

  const handleStartGame = async () => {
    try {
      await startGame();
      router.replace('/game/grimoire');
    } catch (e) {
      Alert.alert(
        '게임 시작 불가',
        e instanceof Error ? e.message : '알 수 없는 오류',
      );
    }
  };

  const players = gameState?.players ?? [];
  const regularPlayers = players.filter((p) => !p.isTraveller);
  const playerCount = regularPlayers.length;
  const travellerCount = players.filter((p) => p.isTraveller).length;
  const hasPlayers = playerCount > 0;
  const canDistribute = playerCount >= 5 && playerCount <= 20;
  const allRolesAssigned = hasPlayers && regularPlayers.every((p) => p.role);
  const assignedRegularCount = regularPlayers.filter((p) => p.role).length;
  const selectedEdition =
    EDITIONS.find((edition) => edition.id === selectedEditionId) ?? EDITIONS[0];
  const distribution = ROLE_DISTRIBUTION[playerCount];

  const handleDistributeRoles = async () => {
    if (!canDistribute) {
      Alert.alert(
        '직업 배분 불가',
        `${playerCount}명은 지원하지 않습니다.\n5~20명이 필요합니다.`,
      );
      return;
    }
    doDistribute();
  };

  const doDistribute = async () => {
    setDistributing(true);
    try {
      await distributeRoles({
        excludedRoleIds:
          excludedRoleIds.size > 0 ? [...excludedRoleIds] : undefined,
        editionId: selectedEditionId,
        additionalRoleIds:
          additionalRoleIds.size > 0 ? [...additionalRoleIds] : undefined,
      });
    } catch (e) {
      Alert.alert('오류', e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setDistributing(false);
    }
  };

  // 주정뱅이의 가짜 역할로 선택 가능한 마을주민 목록
  const availableTownsfolk = useMemo(() => {
    if (!gameState) return [];
    const assignedRoleIds = new Set(
      gameState.players
        .map((p) => {
          if (p.role?.id === 'drunk') return null; // 주정뱅이 자신의 역할은 제외
          return p.role?.id;
        })
        .filter((id): id is string => !!id),
    );
    return ALL_ROLES.filter(
      (r) => r.team === 'townsfolk' && !assignedRoleIds.has(r.id),
    );
  }, [gameState]);

  const handleChangeDrunkFakeRole = useCallback(
    (fakeRoleId: string) => {
      if (!drunkModalPlayer) return;
      assignRole(drunkModalPlayer.id, 'drunk', fakeRoleId);
      setDrunkModalPlayer(null);
    },
    [drunkModalPlayer, assignRole],
  );

  const handleRandomDrunkFakeRole = useCallback(() => {
    if (!drunkModalPlayer || availableTownsfolk.length === 0) return;
    const randomFake =
      availableTownsfolk[Math.floor(Math.random() * availableTownsfolk.length)];
    handleChangeDrunkFakeRole(randomFake.id);
  }, [drunkModalPlayer, availableTownsfolk, handleChangeDrunkFakeRole]);

  const s = (v: number) => Math.round(v * scale);

  const openAssignRole = (item: Player) => {
    router.push({
      pathname: '/game/assign-role',
      params: {
        playerId: item.id,
        editionId: selectedEditionId,
        additionalRoleIds:
          additionalRoleIds.size > 0 ? [...additionalRoleIds].join(',') : '',
      },
    });
  };

  const confirmKickPlayer = (item: Player) => {
    Alert.alert(
      `${item.name} 강퇴`,
      '이 플레이어를 게임에서 제거하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '강퇴',
          style: 'destructive',
          onPress: async () => {
            try {
              await kickPlayer(item.id);
            } catch (e) {
              Alert.alert(
                '오류',
                e instanceof Error ? e.message : '강퇴에 실패했습니다.',
              );
            }
          },
        },
      ],
    );
  };

  const renderPlayerRow = (item: Player, mode: 'desktop' | 'mobile') => (
    <Pressable
      onPress={() => openAssignRole(item)}
      onLongPress={() => confirmKickPlayer(item)}
      style={[
        styles.playerRow,
        mode === 'desktop' && styles.desktopPlayerRow,
        item.role && styles.playerRowAssigned,
      ]}
    >
      <View style={styles.playerNameRow}>
        <View style={lobbyDynamic.aliveDot(item.isAlive, s)} />
        <View style={styles.playerIdentity}>
          <Text style={styles.playerName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isTraveller && (
            <Text
              style={[
                styles.travellerBadge,
                item.travellerAlignment === 'evil' && styles.travellerBadgeEvil,
                item.travellerAlignment === 'good' && styles.travellerBadgeGood,
              ]}
            >
              여행자
            </Text>
          )}
        </View>
      </View>
      <View style={styles.playerRoleContainer}>
        {item.role ? (
          <Text
            style={lobbyDynamic.playerRoleText(
              rolesVeiled,
              s,
              !rolesVeiled && item.role.team
                ? TEAM_COLORS[item.role.team]
                : undefined,
            )}
            numberOfLines={mode === 'desktop' ? 2 : 1}
          >
            {rolesVeiled ? '???' : item.role.name}
            {!rolesVeiled && item.role.id === 'drunk' && item.drunkAs
              ? ` (${getRoleById(item.drunkAs)?.name ?? '?'})`
              : ''}
            {!rolesVeiled &&
              item.role.team === 'demon' &&
              ` (${gameState?.bluffRoles && gameState.bluffRoles.length > 0 ? gameState.bluffRoles.map((r) => r.name).join(', ') : '랜덤'})`}
          </Text>
        ) : (
          <Text style={styles.unassignedRoleText}>미배정</Text>
        )}
        {!rolesVeiled && item.role?.id === 'drunk' && item.drunkAs && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              setDrunkModalPlayer(item);
            }}
            hitSlop={8}
            style={styles.drunkChangeButton}
          >
            <Text style={styles.drunkChangeText}>가짜역할 변경</Text>
          </Pressable>
        )}
        {!rolesVeiled && item.role?.team === 'demon' && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              setBluffChangePlayer(item);
            }}
            hitSlop={8}
            style={styles.drunkChangeButton}
          >
            <Text style={styles.drunkChangeText}>블러프 변경</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );

  const renderEditionSelector = (mode: 'desktop' | 'mobile') => (
    <View
      style={mode === 'desktop' ? styles.desktopEditionGrid : styles.editionRow}
    >
      {mode === 'mobile' && <Text style={styles.editionLabel}>에디션</Text>}
      {EDITIONS.map((edition) => (
        <Pressable
          key={edition.id}
          onPress={() => {
            if (edition.disabled) return;
            if (selectedEditionId === edition.id) return;
            setSelectedEditionId(edition.id);
            setExcludedRoleIds(new Set());
            setAdditionalRoleIds(new Set());
            unassignAllRoles();
          }}
          disabled={edition.disabled}
          style={({ pressed }) => [
            lobbyDynamic.editionButton(
              selectedEditionId === edition.id,
              !!edition.disabled,
              pressed,
              s,
            ),
            mode === 'desktop' && styles.desktopEditionButton,
          ]}
        >
          <Text
            style={lobbyDynamic.editionButtonText(
              selectedEditionId === edition.id,
              !!edition.disabled,
              s,
            )}
            numberOfLines={1}
          >
            {edition.name}
            {edition.disabled ? ' (준비중)' : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderRoleSettingActions = () => (
    <View style={styles.roleActionGrid}>
      <Pressable
        onPress={() => {
          setExcludeSearch('');
          setShowExcludeModal(true);
        }}
        style={({ pressed }) => [
          styles.roleActionButton,
          excludedRoleIds.size > 0 && styles.roleActionButtonWarn,
          pressed && styles.roleActionButtonPressed,
        ]}
      >
        <Text
          style={[
            styles.roleActionText,
            excludedRoleIds.size > 0 && styles.roleActionTextWarn,
          ]}
        >
          직업 제외
          {excludedRoleIds.size > 0 ? ` ${excludedRoleIds.size}` : ''}
        </Text>
      </Pressable>

      {mixableRoles.length > 0 && (
        <Pressable
          onPress={() => {
            setMixSearch('');
            setShowMixModal(true);
          }}
          style={({ pressed }) => [
            styles.roleActionButton,
            additionalRoleIds.size > 0 && styles.roleActionButtonMix,
            pressed && styles.roleActionButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.roleActionText,
              additionalRoleIds.size > 0 && styles.roleActionTextMix,
            ]}
          >
            에디션 혼합
            {additionalRoleIds.size > 0 ? ` ${additionalRoleIds.size}` : ''}
          </Text>
        </Pressable>
      )}
    </View>
  );

  const renderDistributionControls = (mode: 'desktop' | 'mobile') => (
    <View
      style={
        mode === 'desktop'
          ? styles.desktopDistributionControls
          : styles.distributeRow
      }
    >
      <Pressable
        onPress={handleDistributeRoles}
        disabled={distributing}
        style={({ pressed }) => [
          styles.distributeButton,
          mode === 'mobile' && { flex: 1 },
          mode === 'desktop' && styles.desktopDistributeButton,
          !canDistribute && styles.distributeButtonDisabled,
          canDistribute && pressed && styles.distributeButtonPressed,
        ]}
      >
        <Text style={styles.distributeButtonText}>직업 자동 배분</Text>
      </Pressable>
      <Pressable
        onPress={() => setRolesVeiled((v) => !v)}
        style={lobbyDynamic.veilToggleButton(rolesVeiled, s)}
      >
        <SpriteIcon
          source={arcaneUiSprite}
          index={rolesVeiled ? uiIcon.veiledEye : uiIcon.openEye}
          size={s(28)}
          opacity={rolesVeiled ? 0.86 : 1}
        />
        <Text style={lobbyDynamic.veilToggleLabel(rolesVeiled, s)}>가리기</Text>
      </Pressable>
    </View>
  );

  const renderSettingsControls = (mode: 'desktop' | 'mobile') => {
    if (!gameState) return null;

    return (
      <ScrollView
        style={
          mode === 'desktop'
            ? styles.desktopSettingsScrollArea
            : styles.settingsScrollArea
        }
        contentContainerStyle={
          mode === 'desktop'
            ? styles.desktopSettingsScrollContent
            : styles.settingsScrollContent
        }
        bounces={false}
      >
        <View style={styles.settingsGap}>
          <View style={styles.settingsToggleRow}>
            <SettingToggle
              label="채팅 밀담"
              value={gameState.settings.whisperMode === 'chat'}
              onValueChange={(val: boolean) =>
                setGameSettings({
                  whisperMode: val ? 'chat' : 'offline',
                })
              }
              scale={scale}
            />
            <View style={styles.settingsDivider} />
            <SettingToggle
              label="온라인 투표"
              value={gameState.settings.votingMode === 'online'}
              onValueChange={(val: boolean) =>
                setGameSettings({
                  votingMode: val ? 'online' : 'offline',
                })
              }
              scale={scale}
            />
          </View>
          {gameState.settings.whisperMode === 'chat' && (
            <View style={styles.clockSettingContainer}>
              <ClockSpeedSetting
                label="밀담 시간"
                value={gameState.settings.whisperClockSeconds}
                onChange={(val: number) =>
                  setGameSettings({ whisperClockSeconds: val })
                }
                scale={scale}
                showOff
                options={[10, 300, 600, 900, 1200]}
                formatOption={(sec: number) =>
                  sec < 60 ? `${sec}초` : `${sec / 60}분`
                }
              />
            </View>
          )}
          {gameState.settings.votingMode === 'online' && (
            <View style={styles.clockSettingContainer}>
              <ClockSpeedSetting
                label="1인당 투표 시간"
                value={gameState.settings.voteClockSeconds}
                onChange={(val: number) =>
                  setGameSettings({ voteClockSeconds: val })
                }
                scale={scale}
                options={[2, 3, 4, 5, 6]}
              />
            </View>
          )}
          <View style={styles.clockSettingContainer}>
            <ClockSpeedSetting
              label="공개토론 시간"
              value={gameState.settings.discussionClockSeconds}
              onChange={(val: number) =>
                setGameSettings({ discussionClockSeconds: val })
              }
              scale={scale}
              showOff
              options={[600, 1200, 1800]}
              formatOption={(sec: number) => `${sec / 60}분`}
            />
          </View>
          <View style={styles.clockSettingContainer}>
            <ClockSpeedSetting
              label="지목 시간"
              value={gameState.settings.nominationClockSeconds}
              onChange={(val: number) =>
                setGameSettings({ nominationClockSeconds: val })
              }
              scale={scale}
              showOff
              options={[300, 600, 900]}
              formatOption={(sec: number) => `${sec / 60}분`}
            />
          </View>
          <View style={styles.clockSettingContainer}>
            <ClockSpeedSetting
              label="변론 시간"
              value={gameState.settings.defenseClockSeconds}
              onChange={(val: number) =>
                setGameSettings({ defenseClockSeconds: val })
              }
              scale={scale}
              showOff
              options={[30, 60, 90, 120, 180, 300]}
              formatOption={(sec: number) =>
                sec < 60 ? `${sec}초` : `${sec / 60}분`
              }
            />
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={isDesktopConsole ? styles.desktopContainer : styles.container}>
      {isDesktopConsole ? (
        <View style={styles.desktopShell}>
          <View style={styles.desktopHeader}>
            <View style={styles.desktopTitleBlock}>
              <Text style={styles.headerKicker}>STORYTELLER LOBBY</Text>
              <Text style={styles.headerTitle}>게임 준비실</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {selectedEdition.name} · 일반 {playerCount}명
                {travellerCount > 0 ? ` · 여행자 ${travellerCount}명` : ''}
              </Text>
            </View>
            <View style={styles.desktopStats}>
              <View style={styles.desktopStatCell}>
                <Text style={styles.desktopStatValue}>
                  {assignedRegularCount}
                </Text>
                <Text style={styles.desktopStatLabel}>배정</Text>
              </View>
              <View style={styles.desktopStatCell}>
                <Text style={styles.desktopStatValue}>{playerCount}</Text>
                <Text style={styles.desktopStatLabel}>일반</Text>
              </View>
              <View style={styles.desktopStatCell}>
                <Text style={styles.desktopStatValue}>
                  {excludedRoleIds.size}
                </Text>
                <Text style={styles.desktopStatLabel}>제외</Text>
              </View>
              <View style={styles.desktopStatCell}>
                <Text style={styles.desktopStatValue}>
                  {additionalRoleIds.size}
                </Text>
                <Text style={styles.desktopStatLabel}>혼합</Text>
              </View>
            </View>
          </View>

          <View style={styles.desktopBody}>
            <View style={styles.desktopRosterPanel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelKicker}>참가자</Text>
                <Text style={styles.panelTitle}>참가자 명부</Text>
                <Text style={styles.panelSubtitle}>
                  {allRolesAssigned
                    ? '모든 일반 플레이어 배정 완료'
                    : `미배정 ${Math.max(playerCount - assignedRegularCount, 0)}명`}
                </Text>
              </View>
              {IS_DEV && (
                <View style={styles.devButtonRow}>
                  <Pressable
                    onPress={() =>
                      addDummyPlayers(5 - playerCount > 0 ? 5 - playerCount : 1)
                    }
                    style={styles.devButton}
                  >
                    <Text style={styles.devButtonText}>+더미</Text>
                  </Pressable>
                  {hasPlayers && (
                    <Pressable
                      onPress={removeDummyPlayers}
                      style={styles.devButton}
                    >
                      <Text style={styles.devButtonText}>-더미</Text>
                    </Pressable>
                  )}
                </View>
              )}
              <FlatList
                data={players}
                keyExtractor={(p) => p.id}
                contentContainerStyle={styles.desktopPlayerListContent}
                renderItem={({ item }) => renderPlayerRow(item, 'desktop')}
              />
            </View>

            <View style={styles.desktopControlColumn}>
              <View style={styles.desktopSetupPanel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelKicker}>직업 구성</Text>
                  <Text style={styles.panelTitle}>에디션과 배분</Text>
                  <Text style={styles.panelSubtitle}>
                    {canDistribute
                      ? '현재 인원으로 자동 배분 가능'
                      : '일반 플레이어 5~20명 필요'}
                  </Text>
                </View>
                {renderEditionSelector('desktop')}
                <View style={styles.compositionGrid}>
                  {distribution ? (
                    <>
                      <View style={styles.compositionCell}>
                        <Text style={styles.compositionValue}>
                          {distribution[0]}
                        </Text>
                        <Text style={styles.compositionLabel}>마을</Text>
                      </View>
                      <View style={styles.compositionCell}>
                        <Text style={styles.compositionValue}>
                          {distribution[1]}
                        </Text>
                        <Text style={styles.compositionLabel}>외지인</Text>
                      </View>
                      <View style={styles.compositionCell}>
                        <Text style={styles.compositionValue}>
                          {distribution[2]}
                        </Text>
                        <Text style={styles.compositionLabel}>하수인</Text>
                      </View>
                      <View style={styles.compositionCell}>
                        <Text style={styles.compositionValue}>
                          {distribution[3]}
                        </Text>
                        <Text style={styles.compositionLabel}>악마</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.compositionUnavailable}>
                      현재 인원은 자동 배분표가 없습니다
                    </Text>
                  )}
                </View>
                {renderRoleSettingActions()}
                {renderDistributionControls('desktop')}
                <Pressable
                  onPress={handleStartGame}
                  disabled={!allRolesAssigned}
                  style={({ pressed }) => [
                    styles.startButton,
                    styles.desktopStartButton,
                    allRolesAssigned
                      ? [
                          styles.startButtonActive,
                          pressed && styles.startButtonPressed,
                        ]
                      : styles.startButtonDisabled,
                  ]}
                >
                  <Text style={styles.startButtonText}>게임 시작</Text>
                </Pressable>
              </View>

              <View style={styles.desktopSettingsPanel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelKicker}>진행 설정</Text>
                  <Text style={styles.panelTitle}>타이머와 운영</Text>
                  <Text style={styles.panelSubtitle}>
                    밀담, 투표, 토론 시간을 준비합니다
                  </Text>
                </View>
                {renderSettingsControls('desktop')}
              </View>
            </View>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View>
                <Text style={styles.headerKicker}>STORYTELLER</Text>
                <Text style={styles.headerTitle}>게임 준비실</Text>
              </View>
              <SpriteIcon
                source={arcaneUiSprite}
                index={uiIcon.menu}
                size={s(42)}
              />
            </View>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {selectedEdition.name} · 일반 {playerCount}명
              {travellerCount > 0 ? ` · 여행자 ${travellerCount}명` : ''}
            </Text>
          </View>

          <View style={styles.mobileStatusBand}>
            <View style={styles.mobileStatCell}>
              <Text style={styles.mobileStatValue}>{assignedRegularCount}</Text>
              <Text style={styles.mobileStatLabel}>배정</Text>
            </View>
            <View style={styles.mobileStatCell}>
              <Text style={styles.mobileStatValue}>{playerCount}</Text>
              <Text style={styles.mobileStatLabel}>일반</Text>
            </View>
            <View style={styles.mobileStatCell}>
              <Text style={styles.mobileStatValue}>
                {distribution ? distribution.join('/') : '-'}
              </Text>
              <Text style={styles.mobileStatLabel}>구성</Text>
            </View>
          </View>

          <View style={styles.participantHeader}>
            <View style={styles.participantLabelRow}>
              <Text style={styles.participantLabel}>참가자</Text>
              {IS_DEV && (
                <View style={styles.devButtonRow}>
                  <Pressable
                    onPress={() =>
                      addDummyPlayers(5 - playerCount > 0 ? 5 - playerCount : 1)
                    }
                    style={styles.devButton}
                  >
                    <Text style={styles.devButtonText}>+더미</Text>
                  </Pressable>
                  {hasPlayers && (
                    <Pressable
                      onPress={removeDummyPlayers}
                      style={styles.devButton}
                    >
                      <Text style={styles.devButtonText}>-더미</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
            {canDistribute && distribution && (
              <Text style={styles.compositionHint}>
                마을{distribution[0]} 외지인{distribution[1]} 하수인
                {distribution[2]} 악마{distribution[3]}
              </Text>
            )}
          </View>

          <View style={styles.distributeContainer}>
            {renderEditionSelector('mobile')}
            <CollapsibleSection
              label="직업 상세 설정"
              isOpen={roleSettingsOpen}
              onToggle={() => setRoleSettingsOpen((v) => !v)}
              scale={scale}
            >
              {renderRoleSettingActions()}
            </CollapsibleSection>
            {renderDistributionControls('mobile')}
          </View>

          <View style={styles.listContainer}>
            {advancedSettingsOpen && gameState ? (
              renderSettingsControls('mobile')
            ) : (
              <FlatList
                data={players}
                keyExtractor={(p) => p.id}
                contentContainerStyle={styles.playerListContent}
                renderItem={({ item }) => renderPlayerRow(item, 'mobile')}
              />
            )}
          </View>

          <View style={styles.footer}>
            {gameState && (
              <Pressable
                onPress={() => setAdvancedSettingsOpen((v) => !v)}
                style={styles.settingsToggleButton}
              >
                <Text style={styles.settingsToggleLabel}>상세 설정</Text>
                <Text style={styles.settingsToggleChevron}>
                  {advancedSettingsOpen ? '접기' : '열기'}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleStartGame}
              disabled={!allRolesAssigned}
              style={({ pressed }) => [
                styles.startButton,
                allRolesAssigned
                  ? [
                      styles.startButtonActive,
                      pressed && styles.startButtonPressed,
                    ]
                  : styles.startButtonDisabled,
              ]}
            >
              <Text style={styles.startButtonText}>게임 시작</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* 악마 블러프 직업 변경 모달 */}
      <BluffSelectModal
        visible={!!bluffChangePlayer}
        onConfirm={handleBluffConfirm}
        onCancel={() => setBluffChangePlayer(null)}
        initialSelectedIds={gameState?.bluffRoles?.map((r) => r.id)}
        availableRoles={bluffAvailableRoles}
        scale={scale}
      />
      {/* 주정뱅이 가짜 역할 변경 모달 */}
      <DrunkFakeRoleModal
        drunkModalPlayer={drunkModalPlayer}
        onClose={() => setDrunkModalPlayer(null)}
        availableTownsfolk={availableTownsfolk}
        onChangeFakeRole={handleChangeDrunkFakeRole}
        onRandomFakeRole={handleRandomDrunkFakeRole}
        scale={scale}
      />
      {/* 직업 제외 설정 모달 */}
      <RoleExcludeModal
        visible={showExcludeModal}
        onClose={() => {
          setShowExcludeModal(false);
          setExcludeSearch('');
        }}
        excludedRoleIds={excludedRoleIds}
        onToggleExclude={toggleExcludedRole}
        onResetExclude={() => setExcludedRoleIds(new Set())}
        editionRoles={editionRoles}
        additionalRoleIds={additionalRoleIds}
        searchText={excludeSearch}
        onSearchChange={setExcludeSearch}
        scale={scale}
      />
      {/* 다른 에디션 역할 믹스 모달 */}
      <RoleMixModal
        visible={showMixModal}
        onClose={() => {
          setShowMixModal(false);
          setMixSearch('');
        }}
        additionalRoleIds={additionalRoleIds}
        onToggleAdditional={toggleAdditionalRole}
        onResetAdditional={() => setAdditionalRoleIds(new Set())}
        mixableRoles={mixableRoles}
        searchText={mixSearch}
        onSearchChange={setMixSearch}
        scale={scale}
      />
    </View>
  );
}
