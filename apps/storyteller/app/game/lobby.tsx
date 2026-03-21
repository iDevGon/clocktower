import type { Player } from '@clocktower/shared';
import {
  ALL_ROLES,
  EDITIONS,
  getRoleById,
  getRolesForEdition,
  ROLE_DISTRIBUTION,
} from '@clocktower/shared';
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
import QRCode from 'react-native-qrcode-svg';
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
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useGameStore } from '../../src/stores/gameStore';
import { createLobbyStyles, lobbyDynamic } from '../../src/styles/lobby.styles';

export default function LobbyScreen() {
  const router = useRouter();
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createLobbyStyles(scale), [scale]);
  const gameState = useGameStore((s) => s.gameState);
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const {
    startGame,
    distributeRoles,
    assignRole,
    addDummyPlayers,
    removeDummyPlayers,
    setGameSettings,
    kickPlayer,
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
  const [bluffRoleIds, setBluffRoleIds] = useState<Set<string>>(new Set());

  const toggleBluffRole = useCallback((roleId: string) => {
    setBluffRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else if (next.size < 3) next.add(roleId);
      return next;
    });
  }, []);

  const bluffAvailableRoles = useMemo(() => {
    if (!gameState)
      return ALL_ROLES.filter(
        (r) => r.team === 'townsfolk' || r.team === 'outsider',
      );
    const assignedRoleIds = new Set(
      gameState.players.flatMap((p) => [p.role?.id, p.drunkAs]).filter(Boolean),
    );
    return ALL_ROLES.filter(
      (r) =>
        (r.team === 'townsfolk' || r.team === 'outsider') &&
        !assignedRoleIds.has(r.id),
    );
  }, [gameState]);

  const handleBluffChange = useCallback(() => {
    if (!bluffChangePlayer) return;
    assignRole(
      bluffChangePlayer.id,
      bluffChangePlayer.role?.id ?? '',
      undefined,
      bluffRoleIds.size > 0 ? [...bluffRoleIds] : undefined,
    );
    setBluffChangePlayer(null);
  }, [bluffChangePlayer, assignRole, bluffRoleIds]);

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

  const playerCount = gameState?.players.length ?? 0;
  const hasPlayers = playerCount > 0;
  const canDistribute = playerCount >= 5 && playerCount <= 20;
  const allRolesAssigned =
    hasPlayers && gameState?.players.every((p) => p.role);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {serverUrl && (
          <View style={styles.qrContainer}>
            <QRCode
              value={JSON.stringify({ server: serverUrl })}
              size={140}
              backgroundColor="#121214"
              color="#e0ddd8"
            />
            <Text style={styles.qrHint}>플레이어 앱에서 스캔</Text>
          </View>
        )}
      </View>

      <View style={styles.participantHeader}>
        <View style={styles.participantLabelRow}>
          <Text style={styles.participantLabel}>참가자 ({playerCount})</Text>
          {IS_DEV && (
            <>
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
            </>
          )}
        </View>
        {canDistribute && (
          <Text style={styles.compositionHint}>
            {(() => {
              const dist = ROLE_DISTRIBUTION[playerCount];
              if (!dist) return null;
              const [t, o, m, d] = dist;
              return `마을${t} 외지인${o} 하수인${m} 악마${d}`;
            })()}
          </Text>
        )}
      </View>
      <View style={styles.distributeContainer}>
        {/* 에디션 선택 */}
        <View style={styles.editionRow}>
          <Text style={styles.editionLabel}>에디션:</Text>
          {EDITIONS.map((edition) => (
            <Pressable
              key={edition.id}
              onPress={() => {
                if (edition.disabled) return;
                setSelectedEditionId(edition.id);
                setExcludedRoleIds(new Set());
                setAdditionalRoleIds(new Set());
              }}
              disabled={edition.disabled}
              style={lobbyDynamic.editionButton(
                selectedEditionId === edition.id,
                !!edition.disabled,
                false,
                s,
              )}
            >
              <Text
                style={lobbyDynamic.editionButtonText(
                  selectedEditionId === edition.id,
                  !!edition.disabled,
                  s,
                )}
              >
                {edition.name}
                {edition.disabled ? ' (준비중)' : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 직업 상세 설정 (collapsible) */}
        <CollapsibleSection
          label="직업 상세 설정"
          isOpen={roleSettingsOpen}
          onToggle={() => setRoleSettingsOpen((v) => !v)}
          scale={scale}
        >
          {/* 직업 제외 버튼 */}
          <Pressable
            onPress={() => {
              setExcludeSearch('');
              setShowExcludeModal(true);
            }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: s(8),
              marginBottom: s(8),
              borderRadius: 6,
              backgroundColor: pressed ? '#2a2a30' : '#1e1e22',
              borderWidth: 1,
              borderColor: excludedRoleIds.size > 0 ? '#c47070' : '#3a3a3e',
            })}
          >
            <Text
              style={[
                styles.roleSettingButtonText,
                lobbyDynamic.roleSettingButtonTextColor(
                  excludedRoleIds.size > 0,
                  '#c47070',
                ),
              ]}
            >
              직업 제외 설정
              {excludedRoleIds.size > 0 ? ` (${excludedRoleIds.size}개)` : ''}
            </Text>
          </Pressable>

          {/* 다른 에디션 역할 믹스 버튼 */}
          {mixableRoles.length > 0 && (
            <Pressable
              onPress={() => {
                setMixSearch('');
                setShowMixModal(true);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: s(8),
                marginBottom: s(8),
                borderRadius: 6,
                backgroundColor: pressed ? '#2a2a30' : '#1e1e22',
                borderWidth: 1,
                borderColor: additionalRoleIds.size > 0 ? '#a569bd' : '#3a3a3e',
              })}
            >
              <Text
                style={[
                  styles.roleSettingButtonText,
                  lobbyDynamic.roleSettingButtonTextColor(
                    additionalRoleIds.size > 0,
                    '#a569bd',
                  ),
                ]}
              >
                다른 에디션 역할 추가
                {additionalRoleIds.size > 0
                  ? ` (${additionalRoleIds.size}개)`
                  : ''}
              </Text>
            </Pressable>
          )}
        </CollapsibleSection>

        <View style={styles.distributeRow}>
          <Pressable
            onPress={handleDistributeRoles}
            disabled={distributing}
            style={({ pressed }) => [
              styles.distributeButton,
              { flex: 1 },
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
            <Text style={lobbyDynamic.veilToggleEmoji(rolesVeiled, s)}>
              {rolesVeiled ? '🙈' : '👁'}
            </Text>
            <Text style={lobbyDynamic.veilToggleLabel(rolesVeiled, s)}>
              가리기
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.listContainer}>
        {advancedSettingsOpen && gameState ? (
          <ScrollView
            style={styles.settingsScrollArea}
            contentContainerStyle={styles.settingsScrollContent}
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
        ) : (
          <FlatList
            data={gameState?.players ?? []}
            keyExtractor={(p) => p.id}
            contentContainerStyle={styles.playerListContent}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/game/assign-role',
                    params: {
                      playerId: item.id,
                      editionId: selectedEditionId,
                      additionalRoleIds:
                        additionalRoleIds.size > 0
                          ? [...additionalRoleIds].join(',')
                          : '',
                    },
                  })
                }
                onLongPress={() => {
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
                              e instanceof Error
                                ? e.message
                                : '강퇴에 실패했습니다.',
                            );
                          }
                        },
                      },
                    ],
                  );
                }}
                style={styles.playerRow}
              >
                <View style={styles.playerNameRow}>
                  <View style={lobbyDynamic.aliveDot(item.isAlive, s)} />
                  <Text style={styles.playerName}>{item.name}</Text>
                </View>
                <View style={styles.playerRoleContainer}>
                  {item.role && (
                    <Text style={lobbyDynamic.playerRoleText(rolesVeiled, s)}>
                      {rolesVeiled ? '???' : item.role.name}
                      {!rolesVeiled && item.role.id === 'drunk' && item.drunkAs
                        ? ` (${getRoleById(item.drunkAs)?.name ?? '?'})`
                        : ''}
                    </Text>
                  )}
                  {!rolesVeiled &&
                    item.role?.id === 'drunk' &&
                    item.drunkAs && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setDrunkModalPlayer(item);
                        }}
                        hitSlop={8}
                        style={styles.drunkChangeButton}
                      >
                        <Text style={styles.drunkChangeText}>
                          가짜역할 변경
                        </Text>
                      </Pressable>
                    )}
                  {!rolesVeiled && item.role?.team === 'demon' && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setBluffRoleIds(new Set());
                        setBluffChangePlayer(item);
                      }}
                      hitSlop={8}
                      style={styles.drunkChangeButton}
                    >
                      <Text
                        style={[styles.drunkChangeText, { color: '#8a6a9a' }]}
                      >
                        블러프 변경
                      </Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            )}
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
              {advancedSettingsOpen ? '▼' : '▲'}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleStartGame}
          disabled={!allRolesAssigned}
          style={({ pressed }) => [
            styles.startButton,
            allRolesAssigned
              ? [styles.startButtonActive, pressed && styles.startButtonPressed]
              : styles.startButtonDisabled,
          ]}
        >
          <Text style={styles.startButtonText}>게임 시작</Text>
        </Pressable>
      </View>

      {/* 악마 블러프 직업 변경 모달 */}
      <BluffSelectModal
        visible={!!bluffChangePlayer}
        onClose={handleBluffChange}
        selectedBluffIds={bluffRoleIds}
        onToggleBluff={toggleBluffRole}
        onResetBluffs={() => setBluffRoleIds(new Set())}
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
