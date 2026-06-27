import type { Player } from '@clocktower/shared';
import {
  ALL_ROLES,
  EDITION_COLORS,
  EDITIONS,
  getRolesForEdition,
  ROLE_DISTRIBUTION,
} from '@clocktower/shared';
import { SpriteIcon } from '@clocktower/ui';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { arcaneUiSprite, uiIcon } from '../../src/assets/ui';
import { BluffSelectModal } from '../../src/components/BluffSelectModal';
import { ClockSpeedSetting } from '../../src/components/ClockSpeedSetting';
import { CollapsibleSection } from '../../src/components/CollapsibleSection';
import {
  type CircularPosition,
  DraggablePlayerToken,
} from '../../src/components/DraggablePlayerToken';
import { DrunkFakeRoleModal } from '../../src/components/DrunkFakeRoleModal';
import { RoleExcludeModal } from '../../src/components/RoleExcludeModal';
import { RoleMixModal } from '../../src/components/RoleMixModal';
import { SettingToggle } from '../../src/components/SettingToggle';
import { IS_DEV } from '../../src/constants';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useGameStore } from '../../src/stores/gameStore';
import { createLobbyStyles, lobbyDynamic } from '../../src/styles/lobby.styles';

const DESKTOP_SETTINGS_EXPANDED_TOP = 74;
const DESKTOP_SETTINGS_PANEL_GAP = 14;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    convertTravellerToRegular,
    unassignAllRoles,
    setPlayerOrder: syncPlayerOrder,
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
  const [godfatherOutsiderModifier, setGodfatherOutsiderModifier] = useState<
    -1 | 1
  >(1);
  const [showMixModal, setShowMixModal] = useState(false);
  const [excludeSearch, setExcludeSearch] = useState('');
  const [mixSearch, setMixSearch] = useState('');
  const [roleSettingsOpen, setRoleSettingsOpen] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [settingsFocused, setSettingsFocused] = useState(false);
  const [setupPanelHeight, setSetupPanelHeight] = useState(0);
  const [showSeatingBoard, setShowSeatingBoard] = useState(true);
  const [rolesVeiled, setRolesVeiled] = useState(false);
  const [seatArea, setSeatArea] = useState({ width: 0, height: 0 });
  const [selectedSeatPlayerId, setSelectedSeatPlayerId] = useState<
    string | null
  >(null);
  const setLocalPlayerOrder = useGameStore((s) => s.setPlayerOrder);
  const settingsFocusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsInteractionActive = useRef(false);
  const settingsPanelProgress = useRef(new Animated.Value(0)).current;

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
    async (selectedIds: string[]) => {
      if (!bluffChangePlayer) return;
      try {
        await assignRole(
          bluffChangePlayer.id,
          bluffChangePlayer.role?.id ?? '',
          undefined,
          selectedIds,
        );
        setBluffChangePlayer(null);
      } catch (e) {
        Alert.alert('오류', e instanceof Error ? e.message : '배정 실패');
      }
    },
    [bluffChangePlayer, assignRole],
  );

  const editionRoles = useMemo(
    () => getRolesForEdition(selectedEditionId),
    [selectedEditionId],
  );
  const additionalRoleIdList = useMemo(
    () => [...additionalRoleIds],
    [additionalRoleIds],
  );

  useEffect(() => {
    setGameSettings({
      setupEditionId: selectedEditionId,
      additionalRoleIds: additionalRoleIdList,
    });
  }, [additionalRoleIdList, selectedEditionId, setGameSettings]);

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
  const focusSettingsPanel = useCallback(() => {
    if (settingsFocusTimer.current) {
      clearTimeout(settingsFocusTimer.current);
      settingsFocusTimer.current = null;
    }
    setSettingsFocused(true);
  }, []);
  const blurSettingsPanel = useCallback(() => {
    if (settingsFocusTimer.current) clearTimeout(settingsFocusTimer.current);
    settingsFocusTimer.current = setTimeout(() => {
      if (settingsInteractionActive.current) {
        blurSettingsPanel();
        return;
      }
      setSettingsFocused(false);
      settingsFocusTimer.current = null;
    }, 90);
  }, []);
  const startSettingsInteraction = useCallback(() => {
    settingsInteractionActive.current = true;
    focusSettingsPanel();
  }, [focusSettingsPanel]);
  const endSettingsInteraction = useCallback(() => {
    settingsInteractionActive.current = false;
  }, []);
  const handleSetupPanelLayout = useCallback((event: LayoutChangeEvent) => {
    setSetupPanelHeight(event.nativeEvent.layout.height);
  }, []);

  useEffect(() => {
    Animated.timing(settingsPanelProgress, {
      toValue: settingsFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [settingsFocused, settingsPanelProgress]);

  const collapsedSettingsTop =
    setupPanelHeight > 0
      ? setupPanelHeight + DESKTOP_SETTINGS_PANEL_GAP
      : DESKTOP_SETTINGS_EXPANDED_TOP;
  const settingsPanelAnimatedStyle = useMemo(
    () => ({
      top: settingsPanelProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [collapsedSettingsTop, DESKTOP_SETTINGS_EXPANDED_TOP],
      }),
    }),
    [collapsedSettingsTop, settingsPanelProgress],
  );
  const setupPanelAnimatedStyle = useMemo(
    () => ({
      opacity: settingsPanelProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.48],
      }),
    }),
    [settingsPanelProgress],
  );

  useEffect(
    () => () => {
      if (settingsFocusTimer.current) clearTimeout(settingsFocusTimer.current);
    },
    [],
  );

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
          additionalRoleIdList.length > 0 ? additionalRoleIdList : undefined,
        godfatherOutsiderModifier:
          selectedEditionId === 'bad_moon_rising' ||
          additionalRoleIds.has('godfather')
            ? godfatherOutsiderModifier
            : undefined,
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
    async (fakeRoleId: string) => {
      if (!drunkModalPlayer) return;
      try {
        await assignRole(drunkModalPlayer.id, 'drunk', fakeRoleId);
        setDrunkModalPlayer(null);
      } catch (e) {
        Alert.alert('오류', e instanceof Error ? e.message : '배정 실패');
      }
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
          additionalRoleIdList.length > 0 ? additionalRoleIdList.join(',') : '',
      },
    });
  };

  const orderedPlayers = useMemo(() => {
    const order = gameState?.playerOrder ?? [];
    if (order.length === 0) return players;
    const byId = new Map(players.map((p) => [p.id, p]));
    const ordered = order
      .map((id) => byId.get(id))
      .filter((p): p is Player => p != null);
    const missing = players.filter((p) => !order.includes(p.id));
    return [...ordered, ...missing];
  }, [gameState?.playerOrder, players]);

  const currentPlayerOrder = useMemo(
    () => orderedPlayers.map((player) => player.id),
    [orderedPlayers],
  );

  const selectedSeatPlayer = useMemo(
    () =>
      orderedPlayers.find((player) => player.id === selectedSeatPlayerId) ??
      null,
    [orderedPlayers, selectedSeatPlayerId],
  );

  const commitPlayerOrder = useCallback(
    (order: string[]) => {
      setLocalPlayerOrder(order);
      syncPlayerOrder(order);
    },
    [setLocalPlayerOrder, syncPlayerOrder],
  );

  const selectSeatPlayer = useCallback(
    (playerId: string) => {
      if (selectedSeatPlayerId === playerId) {
        setSelectedSeatPlayerId(null);
        return;
      }
      setSelectedSeatPlayerId(playerId);
    },
    [selectedSeatPlayerId],
  );

  const handleSeatSwap = useCallback(
    (fromIndex: number, toIndex: number) => {
      const nextOrder = [...currentPlayerOrder];
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= nextOrder.length ||
        toIndex >= nextOrder.length
      ) {
        return;
      }
      [nextOrder[fromIndex], nextOrder[toIndex]] = [
        nextOrder[toIndex],
        nextOrder[fromIndex],
      ];
      commitPlayerOrder(nextOrder);
    },
    [commitPlayerOrder, currentPlayerOrder],
  );

  const renderSeatingBoard = (mode: 'desktop' | 'mobile') => {
    const tokenSize = mode === 'desktop' ? 86 : s(68);
    const boardWidth = seatArea.width;
    const boardHeight = seatArea.height;
    const total = orderedPlayers.length;
    const centerX = boardWidth / 2;
    const centerY = boardHeight / 2;
    const radius =
      total > 0
        ? Math.max(
            0,
            Math.min(boardWidth, boardHeight) / 2 - tokenSize / 2 - s(16),
          )
        : 0;
    const circularPositions: CircularPosition[] =
      boardWidth > 0 && boardHeight > 0
        ? orderedPlayers.map((_player, index) => {
            const angle =
              (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
            return {
              x: centerX + radius * Math.cos(angle),
              y: centerY + radius * Math.sin(angle),
              index,
            };
          })
        : [];

    return (
      <View style={styles.seatingBoard}>
        <View
          style={
            mode === 'desktop'
              ? styles.desktopSeatingCircle
              : styles.mobileSeatingCircle
          }
          onLayout={(event) => setSeatArea(event.nativeEvent.layout)}
        >
          <View style={styles.seatingCenter}>
            <Text style={styles.seatingCenterKicker}>SEATS</Text>
            <Text style={styles.seatingCenterText}>{total}</Text>
          </View>
          {orderedPlayers.map((player, index) => {
            const angle =
              (index / Math.max(total, 1)) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const selected = selectedSeatPlayerId === player.id;
            const displayPlayer =
              rolesVeiled && player.role
                ? {
                    ...player,
                    role: { ...player.role, name: '???' },
                    drunkAs: undefined,
                  }
                : player;
            return (
              <DraggablePlayerToken
                key={player.id}
                player={displayPlayer}
                highlighted={selected}
                tokenSize={tokenSize}
                initialX={x}
                initialY={y}
                circularPositions={circularPositions}
                positionIndex={index}
                zIndex={index + 1}
                onPress={() => selectSeatPlayer(player.id)}
                onSwap={handleSeatSwap}
              />
            );
          })}
        </View>
        <View style={styles.seatActionPanel}>
          <View style={styles.seatActionTextBlock}>
            <Text style={styles.seatActionKicker}>선택 좌석</Text>
            <Text style={styles.seatActionName} numberOfLines={1}>
              {selectedSeatPlayer?.name ?? '토큰을 선택하세요'}
            </Text>
          </View>
          <View style={styles.seatActionButtons}>
            <Pressable
              disabled={!selectedSeatPlayer}
              onPress={() =>
                selectedSeatPlayer && openAssignRole(selectedSeatPlayer)
              }
              style={[
                styles.seatActionButton,
                !selectedSeatPlayer && styles.seatActionButtonDisabled,
              ]}
            >
              <Text style={styles.seatActionButtonText}>직업</Text>
            </Pressable>
            <Pressable
              disabled={!selectedSeatPlayer}
              onPress={() => {
                if (!selectedSeatPlayer) return;
                if (selectedSeatPlayer.isTraveller) {
                  confirmConvertTravellerToRegular(selectedSeatPlayer);
                  return;
                }
                openAssignRole(selectedSeatPlayer);
              }}
              style={[
                styles.seatActionButton,
                !selectedSeatPlayer && styles.seatActionButtonDisabled,
              ]}
            >
              <Text style={styles.seatActionButtonText}>
                {selectedSeatPlayer?.isTraveller ? '일반' : '여행자'}
              </Text>
            </Pressable>
            <Pressable
              disabled={!selectedSeatPlayer}
              onPress={() =>
                selectedSeatPlayer && confirmKickPlayer(selectedSeatPlayer)
              }
              style={[
                styles.seatActionButton,
                styles.seatKickButton,
                !selectedSeatPlayer && styles.seatActionButtonDisabled,
              ]}
            >
              <Text style={styles.seatActionButtonText}>강퇴</Text>
            </Pressable>
            {!rolesVeiled &&
              selectedSeatPlayer?.role?.id === 'drunk' &&
              selectedSeatPlayer.drunkAs && (
                <Pressable
                  onPress={() => setDrunkModalPlayer(selectedSeatPlayer)}
                  style={styles.seatActionButton}
                >
                  <Text style={styles.seatActionButtonText}>가짜</Text>
                </Pressable>
              )}
            {!rolesVeiled && selectedSeatPlayer?.role?.team === 'demon' && (
              <Pressable
                onPress={() => setBluffChangePlayer(selectedSeatPlayer)}
                style={styles.seatActionButton}
              >
                <Text style={styles.seatActionButtonText}>블러프</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderPlayerList = (mode: 'desktop' | 'mobile') => (
    <ScrollView
      contentContainerStyle={
        mode === 'desktop'
          ? styles.desktopPlayerListContent
          : styles.playerListContent
      }
      bounces={false}
    >
      {orderedPlayers.map((player, index) => {
        const roleText = player.role
          ? rolesVeiled
            ? '???'
            : player.isTraveller
              ? `${player.role.name} (${player.travellerAlignment === 'evil' ? '악' : '선'})`
              : player.role.name
          : player.isTraveller
            ? '여행자 (미배정)'
            : '미배정';
        return (
          <Pressable
            key={player.id}
            onPress={() => openAssignRole(player)}
            onLongPress={() => confirmKickPlayer(player)}
            style={({ pressed }) => [
              styles.playerRow,
              mode === 'desktop' && styles.desktopPlayerRow,
              player.role && styles.playerRowAssigned,
              pressed && styles.distributeButtonPressed,
            ]}
          >
            <View style={styles.playerNameRow}>
              <View style={lobbyDynamic.aliveDot(player.isAlive, s)} />
              <View style={styles.playerIdentity}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {index + 1}. {player.name}
                </Text>
                {player.isTraveller && (
                  <Text
                    style={[
                      styles.travellerBadge,
                      player.travellerAlignment === 'evil'
                        ? styles.travellerBadgeEvil
                        : styles.travellerBadgeGood,
                    ]}
                  >
                    여행자
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.playerRoleContainer}>
              <Text
                style={
                  player.role
                    ? lobbyDynamic.playerRoleText(rolesVeiled, s)
                    : styles.unassignedRoleText
                }
                numberOfLines={1}
              >
                {roleText}
              </Text>
              {!rolesVeiled &&
                player.role?.id === 'drunk' &&
                player.drunkAs && (
                  <Pressable
                    onPress={() => setDrunkModalPlayer(player)}
                    style={styles.drunkChangeButton}
                  >
                    <Text style={styles.drunkChangeText}>가짜 역할 변경</Text>
                  </Pressable>
                )}
              {!rolesVeiled && player.role?.team === 'demon' && (
                <Pressable
                  onPress={() => setBluffChangePlayer(player)}
                  style={styles.drunkChangeButton}
                >
                  <Text style={styles.drunkChangeText}>블러프 변경</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );

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

  const confirmConvertTravellerToRegular = (item: Player) => {
    Alert.alert(
      `${item.name} 일반 플레이어 전환`,
      '여행자 역할과 진영을 제거하고 일반 플레이어로 전환하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '전환',
          onPress: async () => {
            try {
              await convertTravellerToRegular(item.id);
            } catch (e) {
              Alert.alert(
                '오류',
                e instanceof Error
                  ? e.message
                  : '일반 플레이어 전환에 실패했습니다.',
              );
            }
          },
        },
      ],
    );
  };

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
            setGodfatherOutsiderModifier(1);
            unassignAllRoles();
          }}
          disabled={edition.disabled}
          style={({ pressed }) => [
            lobbyDynamic.editionButton(
              selectedEditionId === edition.id,
              !!edition.disabled,
              pressed,
              EDITION_COLORS[edition.id],
              s,
            ),
            mode === 'desktop' && styles.desktopEditionButton,
          ]}
        >
          <Text
            style={lobbyDynamic.editionButtonText(
              selectedEditionId === edition.id,
              !!edition.disabled,
              EDITION_COLORS[edition.id],
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

      {(selectedEditionId === 'bad_moon_rising' ||
        additionalRoleIds.has('godfather')) && (
        <Pressable
          onPress={() =>
            setGodfatherOutsiderModifier((v) => (v === 1 ? -1 : 1))
          }
          style={({ pressed }) => [
            styles.roleActionButton,
            godfatherOutsiderModifier === -1 && styles.roleActionButtonMix,
            pressed && styles.roleActionButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.roleActionText,
              godfatherOutsiderModifier === -1 && styles.roleActionTextMix,
            ]}
          >
            대부 외지인 {godfatherOutsiderModifier > 0 ? '+1' : '-1'}
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
                onInteractionStart={startSettingsInteraction}
                onInteractionEnd={endSettingsInteraction}
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
                onInteractionStart={startSettingsInteraction}
                onInteractionEnd={endSettingsInteraction}
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
              onInteractionStart={startSettingsInteraction}
              onInteractionEnd={endSettingsInteraction}
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
              onInteractionStart={startSettingsInteraction}
              onInteractionEnd={endSettingsInteraction}
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
              onInteractionStart={startSettingsInteraction}
              onInteractionEnd={endSettingsInteraction}
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
                <View style={styles.panelHeaderTop}>
                  <View style={styles.panelHeaderText}>
                    <Text style={styles.panelKicker}>참가자</Text>
                    <Text style={styles.panelTitle}>참가자 명부</Text>
                    <Text style={styles.panelSubtitle}>
                      {allRolesAssigned
                        ? '모든 일반 플레이어 배정 완료'
                        : `미배정 ${Math.max(playerCount - assignedRegularCount, 0)}명`}
                    </Text>
                  </View>
                  <View style={styles.panelHeaderActions}>
                    <SettingToggle
                      label="좌석 배치"
                      value={showSeatingBoard}
                      onValueChange={setShowSeatingBoard}
                      scale={scale}
                    />
                  </View>
                </View>
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
              {showSeatingBoard
                ? renderSeatingBoard('desktop')
                : renderPlayerList('desktop')}
            </View>

            <View style={styles.desktopControlColumn}>
              <Animated.View
                onLayout={handleSetupPanelLayout}
                style={[
                  styles.desktopSetupPanel,
                  styles.desktopSetupPanelCovered,
                  setupPanelAnimatedStyle,
                ]}
              >
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
              </Animated.View>

              <AnimatedPressable
                onFocus={focusSettingsPanel}
                onBlur={blurSettingsPanel}
                onPressIn={focusSettingsPanel}
                style={[
                  styles.desktopSettingsPanel,
                  settingsFocused && styles.desktopSettingsPanelFocused,
                  settingsPanelAnimatedStyle,
                ]}
              >
                <View style={styles.panelHeader}>
                  <Text style={styles.panelKicker}>진행 설정</Text>
                  <Text style={styles.panelTitle}>타이머와 운영</Text>
                  <Text style={styles.panelSubtitle}>
                    밀담, 투표, 토론 시간을 준비합니다
                  </Text>
                </View>
                {renderSettingsControls('desktop')}
              </AnimatedPressable>
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
            <SettingToggle
              label="좌석 배치"
              value={showSeatingBoard}
              onValueChange={setShowSeatingBoard}
              scale={scale}
            />
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
            {advancedSettingsOpen && gameState
              ? renderSettingsControls('mobile')
              : showSeatingBoard
                ? renderSeatingBoard('mobile')
                : renderPlayerList('mobile')}
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
