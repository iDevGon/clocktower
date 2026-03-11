import type { Player, Team } from '@clocktower/shared';
import {
  ALL_ROLES,
  EDITION_COLORS,
  EDITION_LABELS,
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
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AbilityText } from '../../src/components/AbilityText';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useGameStore } from '../../src/stores/gameStore';
import { createLobbyStyles } from '../../src/styles/lobby.styles';

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

  // 주정뱅이 가짜 역할 변경 모달 상태
  const [drunkModalPlayer, setDrunkModalPlayer] = useState<Player | null>(null);

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
          {__DEV__ && (
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: s(8),
            gap: s(8),
          }}
        >
          <Text style={{ color: '#908e8a', fontSize: s(13) }}>에디션:</Text>
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
              style={{
                paddingVertical: s(6),
                paddingHorizontal: s(12),
                borderRadius: 6,
                backgroundColor: edition.disabled
                  ? '#1a1a1e'
                  : selectedEditionId === edition.id
                    ? '#2a3a5c'
                    : '#242428',
                borderWidth: 1,
                borderColor: edition.disabled
                  ? '#2a2a2e'
                  : selectedEditionId === edition.id
                    ? '#4a6a9c'
                    : '#3a3a3e',
                opacity: edition.disabled ? 0.5 : 1,
              }}
            >
              <Text
                style={{
                  color: edition.disabled
                    ? '#4a4a4e'
                    : selectedEditionId === edition.id
                      ? '#8ab4f8'
                      : '#706e6a',
                  fontSize: s(13),
                  fontWeight: '600',
                }}
              >
                {edition.name}
                {edition.disabled ? ' (준비중)' : ''}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 직업 제외 버튼 */}
        <Pressable
          onPress={() => setShowExcludeModal(true)}
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
            style={{
              color: excludedRoleIds.size > 0 ? '#c47070' : '#908e8a',
              fontSize: s(13),
              fontWeight: '600',
            }}
          >
            직업 제외 설정
            {excludedRoleIds.size > 0 ? ` (${excludedRoleIds.size}개)` : ''}
          </Text>
        </Pressable>

        {/* 다른 에디션 역할 믹스 버튼 */}
        {mixableRoles.length > 0 && (
          <Pressable
            onPress={() => setShowMixModal(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: s(8),
              marginBottom: s(8),
              borderRadius: 6,
              backgroundColor: pressed ? '#2a2a30' : '#1e1e22',
              borderWidth: 1,
              borderColor:
                additionalRoleIds.size > 0 ? '#a569bd' : '#3a3a3e',
            })}
          >
            <Text
              style={{
                color: additionalRoleIds.size > 0 ? '#a569bd' : '#908e8a',
                fontSize: s(13),
                fontWeight: '600',
              }}
            >
              다른 에디션 역할 추가
              {additionalRoleIds.size > 0
                ? ` (${additionalRoleIds.size}개)`
                : ''}
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleDistributeRoles}
          disabled={distributing}
          style={({ pressed }) => [
            styles.distributeButton,
            !canDistribute && styles.distributeButtonDisabled,
            canDistribute && pressed && styles.distributeButtonPressed,
          ]}
        >
          <Text style={styles.distributeButtonText}>
            {distributing ? '배분 중...' : '직업 자동 배분'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={gameState?.players ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingHorizontal: s(16) }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/game/assign-role',
                  params: { playerId: item.id },
                })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: s(12),
                paddingHorizontal: s(12),
                borderBottomWidth: 1,
                borderBottomColor: '#2a2a2e',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: s(8),
                    height: s(8),
                    borderRadius: s(4),
                    backgroundColor: item.isAlive ? '#5a8068' : '#943c3c',
                    marginRight: s(10),
                  }}
                />
                <Text style={{ color: '#e0ddd8', fontSize: s(15) }}>
                  {item.name}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {item.role && (
                  <Text
                    style={{
                      color: '#908e8a',
                      fontSize: s(14),
                    }}
                  >
                    {item.role.name}
                    {item.role.id === 'drunk' && item.drunkAs
                      ? ` (${getRoleById(item.drunkAs)?.name ?? '?'})`
                      : ''}
                  </Text>
                )}
                {item.role?.id === 'drunk' && item.drunkAs && (
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setDrunkModalPlayer(item);
                    }}
                    hitSlop={8}
                    style={{
                      marginTop: s(4),
                      paddingVertical: s(3),
                      paddingHorizontal: s(8),
                      backgroundColor: '#3a2a18',
                      borderRadius: 4,
                      borderWidth: 1,
                      borderColor: '#b87838',
                    }}
                  >
                    <Text
                      style={{
                        color: '#e67e22',
                        fontSize: s(11),
                        fontWeight: '600',
                      }}
                    >
                      가짜역할 변경
                    </Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.footer}>
        {gameState && (
          <View
            style={{
              marginBottom: s(12),
              paddingHorizontal: s(12),
              gap: s(10),
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                backgroundColor: '#1a1a1e',
                borderRadius: 8,
                paddingVertical: s(10),
                paddingHorizontal: s(12),
                borderWidth: 1,
                borderColor: '#2a2a2e',
              }}
            >
              <SettingToggle
                label="채팅 밀담"
                value={gameState.settings.whisperMode === 'chat'}
                onValueChange={(val: boolean) =>
                  setGameSettings({ whisperMode: val ? 'chat' : 'offline' })
                }
                scale={scale}
              />
              <View style={{ width: 1, backgroundColor: '#2e2e34' }} />
              <SettingToggle
                label="온라인 투표"
                value={gameState.settings.votingMode === 'online'}
                onValueChange={(val: boolean) =>
                  setGameSettings({ votingMode: val ? 'online' : 'offline' })
                }
                scale={scale}
              />
            </View>
            {gameState.settings.votingMode === 'online' && (
              <View
                style={{
                  backgroundColor: '#1a1a1e',
                  borderRadius: 8,
                  paddingVertical: s(10),
                  paddingHorizontal: s(12),
                  borderWidth: 1,
                  borderColor: '#2a2a2e',
                }}
              >
                <ClockSpeedSetting
                  value={gameState.settings.voteClockSeconds}
                  onChange={(val: number) =>
                    setGameSettings({ voteClockSeconds: val })
                  }
                  scale={scale}
                />
              </View>
            )}
          </View>
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

      {/* 주정뱅이 가짜 역할 변경 모달 */}
      <Modal
        visible={!!drunkModalPlayer}
        transparent
        animationType="fade"
        onRequestClose={() => setDrunkModalPlayer(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setDrunkModalPlayer(null)}
        >
          <Pressable
            style={{
              backgroundColor: '#1e1e22',
              borderRadius: 12,
              width: '90%',
              maxHeight: '80%',
              borderWidth: 2,
              borderColor: '#e67e22',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                paddingHorizontal: s(16),
                paddingTop: s(16),
                paddingBottom: s(12),
                borderBottomWidth: 1,
                borderBottomColor: '#3a3a42',
              }}
            >
              <Text
                style={{
                  color: '#e67e22',
                  fontSize: s(18),
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: s(4),
                }}
              >
                주정뱅이 가짜 역할 변경
              </Text>
              <Text
                style={{
                  color: '#908e8a',
                  fontSize: s(13),
                  textAlign: 'center',
                }}
              >
                {drunkModalPlayer?.name}이(가) 자신이라고 믿을 마을주민 역할
              </Text>
            </View>
            <FlatList
              data={availableTownsfolk}
              keyExtractor={(r) => r.id}
              contentContainerStyle={{
                paddingHorizontal: s(12),
                paddingVertical: s(8),
              }}
              ListHeaderComponent={
                availableTownsfolk.length > 0 ? (
                  <Pressable
                    onPress={handleRandomDrunkFakeRole}
                    style={({ pressed }) => ({
                      marginBottom: s(8),
                      padding: s(12),
                      backgroundColor: pressed ? '#303040' : '#252530',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#4a4a5a',
                      alignItems: 'center' as const,
                    })}
                  >
                    <Text
                      style={{
                        color: '#a0a0c0',
                        fontSize: s(14),
                        fontWeight: '600',
                      }}
                    >
                      랜덤 배정
                    </Text>
                  </Pressable>
                ) : null
              }
              renderItem={({ item }) => {
                const isCurrentFake = drunkModalPlayer?.drunkAs === item.id;
                return (
                  <Pressable
                    onPress={() => handleChangeDrunkFakeRole(item.id)}
                    style={({ pressed }) => [
                      {
                        paddingVertical: s(12),
                        paddingHorizontal: s(12),
                        marginBottom: s(4),
                        backgroundColor: isCurrentFake ? '#3a2a18' : '#252528',
                        borderRadius: 8,
                        borderLeftWidth: 3,
                        borderLeftColor: isCurrentFake ? '#e67e22' : '#555',
                      },
                      pressed && { backgroundColor: '#353538' },
                    ]}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text
                        style={{
                          color: '#e0ddd8',
                          fontSize: s(15),
                          fontWeight: '600',
                        }}
                      >
                        {item.name}
                      </Text>
                      {isCurrentFake && (
                        <Text
                          style={{
                            color: '#e67e22',
                            fontSize: s(11),
                            fontWeight: '600',
                          }}
                        >
                          현재 선택
                        </Text>
                      )}
                    </View>
                    <AbilityText
                      text={item.ability}
                      style={{
                        color: '#787674',
                        fontSize: s(12),
                        lineHeight: s(17),
                      }}
                    />
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: '#908e8a',
                    fontSize: s(14),
                    textAlign: 'center',
                    paddingVertical: s(20),
                  }}
                >
                  선택 가능한 마을주민 역할이 없습니다
                </Text>
              }
            />
            <Pressable
              style={{
                paddingVertical: s(14),
                borderTopWidth: 1,
                borderTopColor: '#3a3a42',
              }}
              onPress={() => setDrunkModalPlayer(null)}
            >
              <Text
                style={{
                  color: '#7070c4',
                  fontSize: s(15),
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                닫기
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      {/* 직업 제외 설정 모달 */}
      <Modal
        visible={showExcludeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExcludeModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setShowExcludeModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#1e1e22',
              borderRadius: 12,
              width: '90%',
              maxHeight: '80%',
              borderWidth: 2,
              borderColor: '#4a4a5a',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                paddingHorizontal: s(16),
                paddingTop: s(16),
                paddingBottom: s(12),
                borderBottomWidth: 1,
                borderBottomColor: '#3a3a42',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#e0ddd8',
                  fontSize: s(18),
                  fontWeight: '700',
                }}
              >
                직업 제외 설정
              </Text>
              {excludedRoleIds.size > 0 && (
                <Pressable
                  onPress={() => setExcludedRoleIds(new Set())}
                  style={{
                    paddingVertical: s(4),
                    paddingHorizontal: s(10),
                    borderRadius: 4,
                    backgroundColor: '#3a2020',
                  }}
                >
                  <Text
                    style={{
                      color: '#c47070',
                      fontSize: s(12),
                      fontWeight: '600',
                    }}
                  >
                    초기화
                  </Text>
                </Pressable>
              )}
            </View>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: s(12),
                paddingVertical: s(8),
              }}
            >
              {(
                [
                  {
                    team: 'townsfolk' as Team,
                    label: '마을주민',
                    color: '#7090c4',
                  },
                  {
                    team: 'outsider' as Team,
                    label: '외지인',
                    color: '#50a090',
                  },
                  { team: 'minion' as Team, label: '하수인', color: '#c48850' },
                  { team: 'demon' as Team, label: '악마', color: '#b85c5c' },
                ] as const
              ).map(({ team, label, color }) => {
                // 현재 에디션 + 믹스된 역할
                const additionalRolesArr = ALL_ROLES.filter(
                  (r) =>
                    additionalRoleIds.has(r.id) &&
                    !editionRoles.some((er) => er.id === r.id),
                );
                const allAvailableRoles = [
                  ...editionRoles,
                  ...additionalRolesArr,
                ];
                const teamRoles = allAvailableRoles.filter(
                  (r) => r.team === team,
                );
                if (teamRoles.length === 0) return null;
                return (
                  <View key={team} style={{ marginBottom: s(12) }}>
                    <Text
                      style={{
                        color,
                        fontSize: s(14),
                        fontWeight: '700',
                        marginBottom: s(6),
                      }}
                    >
                      {label}
                    </Text>
                    {teamRoles.map((role) => {
                      const isExcluded = excludedRoleIds.has(role.id);
                      return (
                        <Pressable
                          key={role.id}
                          onPress={() => toggleExcludedRole(role.id)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: s(8),
                            paddingHorizontal: s(10),
                            marginBottom: s(2),
                            borderRadius: 6,
                            backgroundColor: isExcluded
                              ? '#2a1a1a'
                              : pressed
                                ? '#2a2a30'
                                : '#252528',
                          })}
                        >
                          <View
                            style={{
                              width: s(18),
                              height: s(18),
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: isExcluded ? '#c47070' : '#5a5a5e',
                              backgroundColor: isExcluded
                                ? '#c47070'
                                : 'transparent',
                              marginRight: s(10),
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isExcluded && (
                              <Text
                                style={{
                                  color: '#1e1e22',
                                  fontSize: s(12),
                                  fontWeight: '900',
                                  lineHeight: s(14),
                                }}
                              >
                                ✕
                              </Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: s(6),
                              }}
                            >
                              <Text
                                style={{
                                  color: isExcluded ? '#706060' : '#e0ddd8',
                                  fontSize: s(14),
                                  fontWeight: '600',
                                  textDecorationLine: isExcluded
                                    ? 'line-through'
                                    : 'none',
                                }}
                              >
                                {role.name}
                              </Text>
                              <EditionBadge
                                editionId={role.edition}
                                scale={scale}
                              />
                            </View>
                            <Text
                              style={{
                                color: isExcluded ? '#504848' : '#787674',
                                fontSize: s(11),
                                lineHeight: s(15),
                              }}
                              numberOfLines={2}
                            >
                              {role.ability}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
            <Pressable
              style={{
                paddingVertical: s(14),
                borderTopWidth: 1,
                borderTopColor: '#3a3a42',
              }}
              onPress={() => setShowExcludeModal(false)}
            >
              <Text
                style={{
                  color: '#7070c4',
                  fontSize: s(15),
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                완료
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      {/* 다른 에디션 역할 믹스 모달 */}
      <Modal
        visible={showMixModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMixModal(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => setShowMixModal(false)}
        >
          <Pressable
            style={{
              backgroundColor: '#1e1e22',
              borderRadius: 12,
              width: '90%',
              maxHeight: '80%',
              borderWidth: 2,
              borderColor: '#a569bd',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                paddingHorizontal: s(16),
                paddingTop: s(16),
                paddingBottom: s(12),
                borderBottomWidth: 1,
                borderBottomColor: '#3a3a42',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#e0ddd8',
                  fontSize: s(18),
                  fontWeight: '700',
                }}
              >
                다른 에디션 역할 추가
              </Text>
              {additionalRoleIds.size > 0 && (
                <Pressable
                  onPress={() => setAdditionalRoleIds(new Set())}
                  style={{
                    paddingVertical: s(4),
                    paddingHorizontal: s(10),
                    borderRadius: 4,
                    backgroundColor: '#3a2020',
                  }}
                >
                  <Text
                    style={{
                      color: '#c47070',
                      fontSize: s(12),
                      fontWeight: '600',
                    }}
                  >
                    초기화
                  </Text>
                </Pressable>
              )}
            </View>
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: s(12),
                paddingVertical: s(8),
              }}
            >
              {(
                [
                  {
                    team: 'townsfolk' as Team,
                    label: '마을주민',
                    color: '#7090c4',
                  },
                  {
                    team: 'outsider' as Team,
                    label: '외지인',
                    color: '#50a090',
                  },
                  { team: 'minion' as Team, label: '하수인', color: '#c48850' },
                  { team: 'demon' as Team, label: '악마', color: '#b85c5c' },
                ] as const
              ).map(({ team, label, color }) => {
                const teamRoles = mixableRoles.filter((r) => r.team === team);
                if (teamRoles.length === 0) return null;
                return (
                  <View key={team} style={{ marginBottom: s(12) }}>
                    <Text
                      style={{
                        color,
                        fontSize: s(14),
                        fontWeight: '700',
                        marginBottom: s(6),
                      }}
                    >
                      {label}
                    </Text>
                    {teamRoles.map((role) => {
                      const isSelected = additionalRoleIds.has(role.id);
                      return (
                        <Pressable
                          key={role.id}
                          onPress={() => toggleAdditionalRole(role.id)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: s(8),
                            paddingHorizontal: s(10),
                            marginBottom: s(2),
                            borderRadius: 6,
                            backgroundColor: isSelected
                              ? '#2a1a2a'
                              : pressed
                                ? '#2a2a30'
                                : '#252528',
                          })}
                        >
                          <View
                            style={{
                              width: s(18),
                              height: s(18),
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: isSelected ? '#a569bd' : '#5a5a5e',
                              backgroundColor: isSelected
                                ? '#a569bd'
                                : 'transparent',
                              marginRight: s(10),
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isSelected && (
                              <Text
                                style={{
                                  color: '#1e1e22',
                                  fontSize: s(12),
                                  fontWeight: '900',
                                  lineHeight: s(14),
                                }}
                              >
                                ✓
                              </Text>
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: s(6),
                              }}
                            >
                              <Text
                                style={{
                                  color: '#e0ddd8',
                                  fontSize: s(14),
                                  fontWeight: '600',
                                }}
                              >
                                {role.name}
                              </Text>
                              <EditionBadge
                                editionId={role.edition}
                                scale={scale}
                              />
                            </View>
                            <Text
                              style={{
                                color: '#787674',
                                fontSize: s(11),
                                lineHeight: s(15),
                              }}
                              numberOfLines={2}
                            >
                              {role.ability}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
            <Pressable
              style={{
                paddingVertical: s(14),
                borderTopWidth: 1,
                borderTopColor: '#3a3a42',
              }}
              onPress={() => setShowMixModal(false)}
            >
              <Text
                style={{
                  color: '#7070c4',
                  fontSize: s(15),
                  fontWeight: '600',
                  textAlign: 'center',
                }}
              >
                완료
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function EditionBadge({
  editionId,
  scale,
}: {
  editionId: string;
  scale: number;
}) {
  const s = (v: number) => Math.round(v * scale);
  const label = EDITION_LABELS[editionId] ?? editionId;
  const color = EDITION_COLORS[editionId] ?? '#908e8a';

  return (
    <Text
      style={{
        fontSize: s(9),
        fontWeight: '700',
        color,
        borderWidth: 1,
        borderColor: color,
        borderRadius: 3,
        paddingHorizontal: s(4),
        paddingVertical: s(1),
        overflow: 'hidden',
      }}
    >
      {label}
    </Text>
  );
}

function SettingToggle({
  label,
  value,
  onValueChange,
  scale,
}: {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  scale: number;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Math.round(8 * scale),
      }}
    >
      <Text
        style={{
          color: value ? '#e0ddd8' : '#5c5a58',
          fontSize: Math.round(12 * scale),
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#3a3a42', true: '#2a4a2a' }}
        thumbColor={value ? '#2ecc71' : '#908e8a'}
      />
    </View>
  );
}

function ClockSpeedSetting({
  value,
  onChange,
  scale,
}: {
  value: number;
  onChange: (val: number) => void;
  scale: number;
}) {
  const s = (v: number) => Math.round(v * scale);
  const options = [30, 45, 60, 90, 120];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(6) }}>
      <Text style={{ color: '#908e8a', fontSize: s(12), fontWeight: '600' }}>
        투표시계
      </Text>
      {options.map((sec) => (
        <Pressable
          key={sec}
          onPress={() => onChange(sec)}
          style={{
            paddingVertical: s(4),
            paddingHorizontal: s(8),
            borderRadius: 4,
            backgroundColor: value === sec ? '#2a3a5c' : '#242428',
            borderWidth: 1,
            borderColor: value === sec ? '#4a6a9c' : '#3a3a3e',
          }}
        >
          <Text
            style={{
              color: value === sec ? '#8ab4f8' : '#706e6a',
              fontSize: s(11),
              fontWeight: '600',
            }}
          >
            {sec}초
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
