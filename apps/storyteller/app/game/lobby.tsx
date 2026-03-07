import { ROLE_DISTRIBUTION } from '@clocktower/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { PlayerList } from '../../src/components/PlayerList';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useGameStore } from '../../src/stores/gameStore';
import { styles } from '../../src/styles/lobby.styles';

export default function LobbyScreen() {
  const router = useRouter();
  const gameState = useGameStore((s) => s.gameState);
  const serverUrl = useConnectionStore((s) => s.serverUrl);
  const { startGame, distributeRoles, addDummyPlayers, removeDummyPlayers } =
    useGameActions();
  const [distributing, setDistributing] = useState(false);

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
  const canDistribute = playerCount >= 5 && playerCount <= 15;
  const allRolesAssigned =
    hasPlayers && gameState?.players.every((p) => p.role);

  const handleDistributeRoles = async () => {
    if (!canDistribute) {
      Alert.alert(
        '직업 배분 불가',
        `${playerCount}명은 지원하지 않습니다.\n5~15명이 필요합니다.`,
      );
      return;
    }
    if (allRolesAssigned) {
      Alert.alert(
        '직업 재배분',
        '이미 모든 플레이어에게 직업이 배분되어 있습니다.\n다시 배분하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '재배분', style: 'destructive', onPress: doDistribute },
        ],
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.codeLabel}>게임 코드</Text>
        <Text style={styles.codeValue}>{gameState?.id ?? '----'}</Text>
        {gameState?.id && (
          <View style={styles.qrContainer}>
            <QRCode
              value={JSON.stringify({ server: serverUrl, code: gameState.id })}
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
        <PlayerList
          players={gameState?.players ?? []}
          onPlayerPress={(p) =>
            router.push({
              pathname: '/game/assign-role',
              params: { playerId: p.id },
            })
          }
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
    </View>
  );
}

