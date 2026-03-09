import type { Player } from '@clocktower/shared';
import {
  getRoleById,
  ROLE_DISTRIBUTION,
  TROUBLE_BREWING_ROLES,
} from '@clocktower/shared';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, Text, View } from 'react-native';
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
  } = useGameActions();
  const [distributing, setDistributing] = useState(false);

  // 주정뱅이 가짜 역할 변경 모달 상태
  const [drunkModalPlayer, setDrunkModalPlayer] = useState<Player | null>(null);

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
      await distributeRoles();
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
    return TROUBLE_BREWING_ROLES.filter(
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
    </View>
  );
}
