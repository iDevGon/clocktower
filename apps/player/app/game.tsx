import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { DeadVignette } from '../src/components/DeadVignette';
import { DeathOverlay } from '../src/components/DeathOverlay';
import { FeedbackHistoryModal } from '../src/components/FeedbackHistoryModal';
import { GameEndOverlay } from '../src/components/GameEndOverlay';
import { NominateModal } from '../src/components/NominateModal';
import {
  DiscussionPhase,
  EndedPhase,
  NightPhase,
  NominationPhase,
  SetupPhase,
  WhisperPhase,
} from '../src/components/PhaseContent';
import { PhaseIndicator } from '../src/components/PhaseIndicator';
import { RoleCard } from '../src/components/RoleCard';
import { VeiledRoleCard } from '../src/components/VeiledRoleCard';
import { VotePrompt } from '../src/components/VotePrompt';
import { VoteResult } from '../src/components/VoteResult';
import { WhisperModal } from '../src/components/WhisperModal';
import { WhisperToast } from '../src/components/WhisperToast';
import { useGameActions } from '../src/hooks/useGameActions';
import { usePlayerStore } from '../src/stores/playerStore';
import { useWhisperStore } from '../src/stores/whisperStore';
import { styles } from '../src/styles/game.styles';

const DAY_SUB_PHASE_LABELS: Record<string, string> = {
  whisper: '밀담',
  discussion: '공개 토론',
  nomination: '지목',
};

export default function GameScreen() {
  const router = useRouter();
  const {
    playerName,
    playerId,
    role,
    isAlive,
    currentPhase,
    daySubPhase,
    nomination,
    voteResult,
    nightProgress,
    nightActionSubmitted,
    nightFeedback,
    hasNominatedToday,
    gamePlayers,
    gameResult,
    justDied,
    slayerUsed,
    evilInfo,
    gameSettings,
  } = usePlayerStore();
  const dismissDeath = usePlayerStore((s) => s.set);
  const {
    submitNightAction,
    sendWhisper,
    nominatePlayer,
    useSlayer: activateSlayer,
  } = useGameActions();

  useEffect(() => {
    if (!playerId) {
      router.replace('/');
    }
  }, [playerId, router]);

  useEffect(() => {
    setWhisperModalVisible(false);
    setWhisperInitialTarget(null);
  }, []);
  const [gameEndDismissed, setGameEndDismissed] = useState(false);
  const [whisperModalVisible, setWhisperModalVisible] = useState(false);
  const [whisperInitialTarget, setWhisperInitialTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [nominateModalVisible, setNominateModalVisible] = useState(false);
  const [slayerModalVisible, setSlayerModalVisible] = useState(false);
  const [feedbackHistoryVisible, setFeedbackHistoryVisible] = useState(false);
  const feedbackHistory = usePlayerStore((s) => s.feedbackHistory);
  const totalUnread = useWhisperStore((s) =>
    Object.values(s.unreadCounts).reduce((a, b) => a + b, 0),
  );

  const drunkAs = usePlayerStore((s) => s.drunkAs);
  const isMyTurn =
    role != null &&
    (nightProgress?.activeRoleId === role.id ||
      (drunkAs != null && nightProgress?.activeRoleId === drunkAs));

  const handleNominate = async (nomineeId: string) => {
    setNominateModalVisible(false);
    const result = await nominatePlayer(nomineeId);
    if (!result.success) {
      Alert.alert('지목 실패', result.error ?? '지목할 수 없습니다');
    }
  };

  const handleSlayer = async (targetId: string) => {
    setSlayerModalVisible(false);
    const result = await activateSlayer(targetId);
    if (!result.success) {
      Alert.alert('사냥꾼 실패', result.error ?? '사용할 수 없습니다');
    }
  };

  const isSlayerRole = role?.id === 'slayer';
  const canUseSlayer =
    isSlayerRole && isAlive && !slayerUsed && currentPhase === 'day';

  const nominatablePlayers = gamePlayers.filter(
    (p) => p.isAlive && p.id !== playerId,
  );

  return (
    <View style={[styles.container, !isAlive && styles.containerDead]}>
      <StatusBar style="light" />

      {/* Persistent red vignette when dead */}
      {!isAlive && <DeadVignette />}

      <View style={[styles.header, !isAlive && styles.headerDead]}>
        <View style={styles.headerRow}>
          <View>
            <Text
              style={[styles.playerLabel, !isAlive && styles.playerLabelDead]}
            >
              {!isAlive ? '사망' : '플레이어'}
            </Text>
            <Text
              style={[styles.playerName, !isAlive && styles.playerNameDead]}
            >
              {playerName}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {feedbackHistory.length > 0 && currentPhase !== 'setup' && (
              <Pressable
                onPress={() => setFeedbackHistoryVisible(true)}
                style={styles.feedbackHistoryButton}
              >
                <Text style={styles.feedbackHistoryIcon}>📜</Text>
                <Text style={styles.feedbackHistoryCount}>
                  {feedbackHistory.length}
                </Text>
              </Pressable>
            )}
            {!isAlive && <Text style={styles.deadSkull}>💀</Text>}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.phaseRow}>
          <PhaseIndicator phase={currentPhase} />
          {currentPhase === 'day' && daySubPhase && (
            <View style={styles.subPhaseBadge}>
              <Text style={styles.subPhaseText}>
                {DAY_SUB_PHASE_LABELS[daySubPhase] ?? ''}
              </Text>
            </View>
          )}
        </View>

        <SetupPhase visible={currentPhase === 'setup'} />

        <NightPhase
          visible={currentPhase === 'night'}
          nightProgress={nightProgress}
          role={role}
          drunkAs={drunkAs}
          isMyTurn={isMyTurn}
          playerId={playerId}
          nightActionSubmitted={nightActionSubmitted}
          nightFeedback={nightFeedback}
          onSubmitNightAction={submitNightAction}
        />

        <WhisperPhase
          visible={currentPhase === 'day' && daySubPhase === 'whisper'}
          totalUnread={totalUnread}
          whisperMode={gameSettings?.whisperMode}
          onOpenWhisper={() => setWhisperModalVisible(true)}
        />

        <DiscussionPhase
          visible={currentPhase === 'day' && daySubPhase === 'discussion'}
        />

        <NominationPhase
          visible={currentPhase === 'day' && daySubPhase === 'nomination'}
          isAlive={isAlive}
          hasNominatedToday={hasNominatedToday}
          votingMode={gameSettings?.votingMode}
          onOpenNominate={() => setNominateModalVisible(true)}
        />

        {currentPhase === 'vote' && nomination && (
          <VotePrompt
            nominatorName={nomination.nominatorName}
            nomineeName={nomination.nomineeName}
          />
        )}

        {currentPhase === 'vote' && !nomination && voteResult && (
          <VoteResult
            nomineeName={voteResult.nomineeName}
            guilty={voteResult.guilty}
            votes={voteResult.votes}
          />
        )}

        <EndedPhase
          visible={currentPhase === 'ended'}
          gameResult={gameResult}
        />

        {canUseSlayer && (
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <Pressable
              onPress={() => setSlayerModalVisible(true)}
              style={{
                backgroundColor: '#b85c5c',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                사냥꾼 능력 사용
              </Text>
            </Pressable>
          </View>
        )}

        {role && currentPhase !== 'setup' && (
          <RoleCard role={role} evilInfo={evilInfo} />
        )}
        {role && currentPhase === 'setup' && <VeiledRoleCard />}
      </ScrollView>

      {justDied && (
        <DeathOverlay onDismiss={() => dismissDeath({ justDied: false })} />
      )}

      {currentPhase === 'ended' && gameResult && role && !gameEndDismissed && (
        <GameEndOverlay
          gameResult={gameResult}
          myTeam={role.team}
          onDismiss={() => setGameEndDismissed(true)}
        />
      )}

      <WhisperToast
        onNavigate={(id, name) => {
          setWhisperInitialTarget({ id, name });
          setWhisperModalVisible(true);
        }}
      />

      <WhisperModal
        visible={whisperModalVisible}
        onClose={() => {
          setWhisperModalVisible(false);
          setWhisperInitialTarget(null);
        }}
        onSend={sendWhisper}
        initialTarget={whisperInitialTarget}
      />

      <NominateModal
        visible={nominateModalVisible}
        players={nominatablePlayers}
        onNominate={handleNominate}
        onClose={() => setNominateModalVisible(false)}
      />

      <NominateModal
        visible={slayerModalVisible}
        players={gamePlayers.filter((p) => p.isAlive && p.id !== playerId)}
        onNominate={handleSlayer}
        onClose={() => setSlayerModalVisible(false)}
      />

      <FeedbackHistoryModal
        visible={feedbackHistoryVisible}
        history={feedbackHistory}
        onClose={() => setFeedbackHistoryVisible(false)}
      />
    </View>
  );
}
