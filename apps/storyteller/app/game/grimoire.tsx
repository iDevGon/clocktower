import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { DaySubPhaseBar } from '../../src/components/DaySubPhaseBar';
import {
  NightActionLog,
  NightFeedbackPanel,
} from '../../src/components/NightActionLog';
import { NightOrderPanel } from '../../src/components/NightOrderPanel';
import { PhaseBar } from '../../src/components/PhaseBar';
import { PlayerToken } from '../../src/components/PlayerToken';
import { VotePanel } from '../../src/components/VotePanel';
import { WhisperStatusPanel } from '../../src/components/WhisperStatusPanel';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useGameStore } from '../../src/stores/gameStore';
import { styles } from '../../src/styles/grimoire.styles';

export default function GrimoireScreen() {
  const router = useRouter();
  const gameState = useGameStore((s) => s.gameState);
  const nightActions = useGameStore((s) => s.nightActions);
  const activeWhispers = useGameStore((s) => s.activeWhispers);
  const activeNightRoleId = useGameStore((s) => s.activeNightRoleId);
  const {
    setPhase,
    setDaySubPhase,
    kill,
    revive,
    resetGame,
    closeVote,
    setActiveNightRole: rawSetActiveNightRole,
    sendNightFeedback,
  } = useGameActions();

  const setActiveNightRole = (roleId: string | null) => {
    rawSetActiveNightRole(roleId);
    useGameStore.getState().setActiveNightRoleId(roleId);
  };

  const handleSetPhase = (phase: Parameters<typeof setPhase>[0]) => {
    if (phase === 'night') {
      useGameStore.getState().clearNightActions();
    }
    setPhase(phase);
  };

  const handlePlayerPress = (
    playerId: string,
    playerName: string,
    isAlive: boolean,
  ) => {
    const actions = isAlive
      ? [
          {
            text: '역할 배정',
            onPress: () =>
              router.push({
                pathname: '/game/assign-role',
                params: { playerId },
              }),
          },
          {
            text: '사망 처리',
            style: 'destructive' as const,
            onPress: () => kill(playerId),
          },
          { text: '취소', style: 'cancel' as const },
        ]
      : [
          { text: '부활', onPress: () => revive(playerId) },
          { text: '취소', style: 'cancel' as const },
        ];

    Alert.alert(playerName, undefined, actions);
  };

  const handleReset = () => {
    Alert.alert('게임 초기화', '정말 게임을 초기화하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '초기화',
        style: 'destructive',
        onPress: () => {
          resetGame();
          useGameStore.getState().reset();
          router.replace('/');
        },
      },
    ]);
  };

  const currentNomination = gameState?.nominations?.length
    ? gameState.nominations[gameState.nominations.length - 1]
    : null;

  const hasActiveVote = gameState?.phase === 'vote' && !!currentNomination;

  if (!gameState) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.dayText}>{gameState.day}일차</Text>
        <View style={styles.topBarRight}>
          {gameState.phase === 'day' &&
            gameState.daySubPhase === 'nomination' && (
              <Pressable
                onPress={() => router.push('/game/nominate')}
                style={styles.nominateButton}
              >
                <Text style={styles.nominateText}>지목 (수동)</Text>
              </Pressable>
            )}
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>초기화</Text>
          </Pressable>
        </View>
      </View>

      {gameState.phase === 'day' && (
        <DaySubPhaseBar
          currentSubPhase={gameState.daySubPhase}
          onSetSubPhase={setDaySubPhase}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {gameState.players.map((player) => (
          <PlayerToken
            key={player.id}
            player={player}
            onPress={() =>
              handlePlayerPress(player.id, player.name, player.isAlive)
            }
          />
        ))}
      </ScrollView>

      {gameState.phase === 'night' && nightActions.length > 0 && (
        <NightActionLog
          actions={nightActions}
          players={gameState.players}
          onSendFeedback={sendNightFeedback}
        />
      )}
      {gameState.phase === 'night' && (
        <NightFeedbackPanel
          activeRoleId={activeNightRoleId}
          players={gameState.players}
          onSendFeedback={sendNightFeedback}
        />
      )}
      {gameState.phase === 'night' && (
        <NightOrderPanel
          day={gameState.day}
          activeRoleIds={gameState.players
            .map((p) => p.role?.id)
            .filter((id): id is string => !!id)}
          onActivateRole={setActiveNightRole}
        />
      )}
      {gameState.phase === 'day' && gameState.daySubPhase === 'whisper' && (
        <WhisperStatusPanel whispers={activeWhispers} />
      )}
      {hasActiveVote && currentNomination && (
        <VotePanel
          nomination={currentNomination}
          players={gameState.players}
          onCloseVote={closeVote}
        />
      )}
      <PhaseBar currentPhase={gameState.phase} onSetPhase={handleSetPhase} />
    </View>
  );
}
