import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { DevPanel } from '../src/components/DevPanel';
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
import { VotePrompt } from '../src/components/VotePrompt';
import { VoteResult } from '../src/components/VoteResult';
import { WhisperModal } from '../src/components/WhisperModal';
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
  } = usePlayerStore();
  const { submitNightAction, sendWhisper, nominatePlayer } = useGameActions();
  const [whisperModalVisible, setWhisperModalVisible] = useState(false);
  const [nominateModalVisible, setNominateModalVisible] = useState(false);
  const totalUnread = useWhisperStore((s) =>
    Object.values(s.unreadCounts).reduce((a, b) => a + b, 0),
  );

  const isMyTurn = role != null && nightProgress?.activeRoleId === role.id;

  const handleNominate = async (nomineeId: string) => {
    setNominateModalVisible(false);
    const result = await nominatePlayer(nomineeId);
    if (!result.success) {
      Alert.alert('지목 실패', result.error ?? '지목할 수 없습니다');
    }
  };

  const nominatablePlayers = gamePlayers.filter(
    (p) => p.isAlive && p.id !== playerId,
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.playerLabel}>플레이어</Text>
            <Text style={styles.playerName}>{playerName}</Text>
          </View>
          <View style={styles.headerRight}>
            {!isAlive && (
              <View style={styles.deadBadge}>
                <Text style={styles.deadText}>사망</Text>
              </View>
            )}
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
          isMyTurn={isMyTurn}
          playerId={playerId}
          nightActionSubmitted={nightActionSubmitted}
          nightFeedback={nightFeedback}
          onSubmitNightAction={submitNightAction}
        />

        <WhisperPhase
          visible={currentPhase === 'day' && daySubPhase === 'whisper'}
          totalUnread={totalUnread}
          onOpenWhisper={() => setWhisperModalVisible(true)}
        />

        <DiscussionPhase
          visible={currentPhase === 'day' && daySubPhase === 'discussion'}
        />

        <NominationPhase
          visible={currentPhase === 'day' && daySubPhase === 'nomination'}
          isAlive={isAlive}
          hasNominatedToday={hasNominatedToday}
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
          hasVoteResult={!!voteResult}
        />

        {role && <RoleCard role={role} />}

        {__DEV__ && <DevPanel currentPhase={currentPhase} role={role} />}
      </ScrollView>

      <WhisperModal
        visible={whisperModalVisible}
        onClose={() => setWhisperModalVisible(false)}
        onSend={sendWhisper}
      />

      <NominateModal
        visible={nominateModalVisible}
        players={nominatablePlayers}
        onNominate={handleNominate}
        onClose={() => setNominateModalVisible(false)}
      />
    </View>
  );
}
