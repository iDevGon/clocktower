import { NIGHT_ACTIONS } from '@clocktower/shared';
import { DictionaryModal } from '@clocktower/ui';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeadVignette } from '../src/components/DeadVignette';
import { DeathOverlay } from '../src/components/DeathOverlay';
import { ExecutionOverlay } from '../src/components/ExecutionOverlay';
import { FeedbackHistoryModal } from '../src/components/FeedbackHistoryModal';
import { GameEndOverlay } from '../src/components/GameEndOverlay';
import { GameStartReveal } from '../src/components/GameStartReveal';
import { NightDeathOverlay } from '../src/components/NightDeathOverlay';
import { NightFallOverlay } from '../src/components/NightFallOverlay';
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
import { RavenkeeperOverlay } from '../src/components/RavenkeeperOverlay';
import { FlippableRoleCard } from '../src/components/RoleCard';
import { RolePromotionReveal } from '../src/components/RolePromotionReveal';
import { SeatingChart } from '../src/components/SeatingChart';
import { SlayerFizzleOverlay } from '../src/components/SlayerFizzleOverlay';
import { StorytellerChatModal } from '../src/components/StorytellerChatModal';
import { StorytellerChatToast } from '../src/components/StorytellerChatToast';
import { VotePrompt, VoteVignette } from '../src/components/VotePrompt';
import { VoteResult } from '../src/components/VoteResult';
import { WhisperModal } from '../src/components/WhisperModal';
import { WhisperToast } from '../src/components/WhisperToast';
import { useGameActions } from '../src/hooks/useGameActions';
import { useChatStore } from '../src/stores/chatStore';
import { usePlayerStore } from '../src/stores/playerStore';
import { useWhisperStore } from '../src/stores/whisperStore';
import { styles } from '../src/styles/game.styles';

const DAY_SUB_PHASE_LABELS: Record<string, string> = {
  whisper: '밀담',
  discussion: '공개 토론',
  nomination: '지목',
  defense: '변론',
};

export default function GameScreen() {
  const router = useRouter();
  const playerName = usePlayerStore((s) => s.playerName);
  const playerId = usePlayerStore((s) => s.playerId);
  const role = usePlayerStore((s) => s.role);
  const isAlive = usePlayerStore((s) => s.isAlive);
  const currentPhase = usePlayerStore((s) => s.currentPhase);
  const daySubPhase = usePlayerStore((s) => s.daySubPhase);
  const nomination = usePlayerStore((s) => s.nomination);
  const voteResult = usePlayerStore((s) => s.voteResult);
  const nightProgress = usePlayerStore((s) => s.nightProgress);
  const nightActionSubmitted = usePlayerStore((s) => s.nightActionSubmitted);
  const nightFeedback = usePlayerStore((s) => s.nightFeedback);
  const hasNominatedToday = usePlayerStore((s) => s.hasNominatedToday);
  const gamePlayers = usePlayerStore((s) => s.gamePlayers);
  const gameResult = usePlayerStore((s) => s.gameResult);
  const justDied = usePlayerStore((s) => s.justDied);
  const deathReason = usePlayerStore((s) => s.deathReason);
  const executionAnnouncement = usePlayerStore((s) => s.executionAnnouncement);
  const nightDeathAnnouncement = usePlayerStore(
    (s) => s.nightDeathAnnouncement,
  );
  const slayerUsed = usePlayerStore((s) => s.slayerUsed);
  const slayerFizzle = usePlayerStore((s) => s.slayerFizzle);
  const evilInfo = usePlayerStore((s) => s.evilInfo);
  const gameSettings = usePlayerStore((s) => s.gameSettings);
  const executionHappenedToday = usePlayerStore(
    (s) => s.executionHappenedToday,
  );
  const executionCandidate = usePlayerStore((s) => s.executionCandidate);
  const nominatedTodayIds = usePlayerStore((s) => s.nominatedTodayIds);
  const rolePromotion = usePlayerStore((s) => s.rolePromotion);
  const butlerMasterName = usePlayerStore((s) => s.butlerMasterName);
  const dismissDeath = usePlayerStore((s) => s.set);
  const {
    submitNightAction,
    sendWhisper,
    sendChatToStoryteller,
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

  // 서브페이즈가 밀담에서 벗어나거나 메인페이즈가 변경되면 밀담 모달 강제 닫기
  useEffect(() => {
    if (currentPhase !== 'day' || daySubPhase !== 'whisper') {
      setWhisperModalVisible(false);
      setWhisperInitialTarget(null);
    }
  }, [currentPhase, daySubPhase]);

  // ── Game start reveal (setup → first night) ──
  const [showStartReveal, setShowStartReveal] = useState(false);
  const [showNightFall, setShowNightFall] = useState(false);
  const prevPhaseForReveal = useRef(currentPhase);
  const nightCount = usePlayerStore((s) => s.nightCount);

  const pendingRolePromotion = usePlayerStore((s) => s.pendingRolePromotion);

  useEffect(() => {
    const prev = prevPhaseForReveal.current;
    prevPhaseForReveal.current = currentPhase;
    // Show reveal when transitioning from setup to night (first night only)
    if (
      prev === 'setup' &&
      currentPhase === 'night' &&
      nightCount === 1 &&
      role
    ) {
      setShowStartReveal(true);
    }
    // Show nightfall overlay when transitioning from day to night
    if (prev === 'day' && currentPhase === 'night') {
      setShowNightFall(true);
    }
    // Show deferred role promotion when transitioning from night to day
    if (prev === 'night' && currentPhase === 'day' && pendingRolePromotion) {
      dismissDeath({
        rolePromotion: pendingRolePromotion,
        pendingRolePromotion: null,
      });
    }
  }, [currentPhase, nightCount, role, pendingRolePromotion, dismissDeath]);

  const [gameEndDismissed, setGameEndDismissed] = useState(false);
  const [whisperModalVisible, setWhisperModalVisible] = useState(false);
  const [whisperInitialTarget, setWhisperInitialTarget] = useState<{
    conversationId: string;
    participantIds: string[];
    participantNames: string[];
  } | null>(null);
  const [nominateModalVisible, setNominateModalVisible] = useState(false);
  const [slayerModalVisible, setSlayerModalVisible] = useState(false);
  const [feedbackHistoryVisible, setFeedbackHistoryVisible] = useState(false);
  const [dictionaryVisible, setDictionaryVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [seatingChartVisible, setSeatingChartVisible] = useState(false);
  const [ravenkeeperOverlay, setRavenkeeperOverlay] = useState(false);
  const feedbackHistory = usePlayerStore((s) => s.feedbackHistory);
  const chatUnreadCount = useChatStore((s) => s.unreadCount);
  const totalUnread = useWhisperStore((s) =>
    Object.values(s.unreadCounts).reduce((a, b) => a + b, 0),
  );

  const dismissStartReveal = useCallback(() => setShowStartReveal(false), []);
  const dismissRolePromotion = useCallback(
    () => dismissDeath({ rolePromotion: null }),
    [dismissDeath],
  );

  const drunkAs = usePlayerStore((s) => s.drunkAs);
  const nightWakeUp = usePlayerStore((s) => s.nightWakeUp);
  const activeRoleId = nightProgress?.activeRoleId;
  const effectiveRoleId = drunkAs ?? role?.id;
  const isOnlyWhenDead =
    effectiveRoleId != null &&
    NIGHT_ACTIONS[effectiveRoleId]?.onlyWhenDead === true;
  const isRoleActive =
    role != null &&
    (activeRoleId === role.id || (drunkAs != null && activeRoleId === drunkAs));
  // onlyWhenDead 역할: 서버에서 night:wakeUp을 받았을 때만 차례로 인정
  const isMyTurn =
    isRoleActive && (isOnlyWhenDead ? nightWakeUp != null : isAlive);

  // night:wakeUp 수신 시 전용 오버레이 표시
  useEffect(() => {
    if (nightWakeUp && isRoleActive) {
      setRavenkeeperOverlay(true);
    }
  }, [nightWakeUp, isRoleActive]);

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
      Alert.alert('처단자 실패', result.error ?? '사용할 수 없습니다');
    }
  };

  const canUseSlayer =
    isAlive &&
    !slayerUsed &&
    (currentPhase === 'day' || currentPhase === 'vote');

  const nominatablePlayers = useMemo(
    () => gamePlayers.filter((p) => p.isAlive && p.id !== playerId),
    [gamePlayers, playerId],
  );

  return (
    <SafeAreaView style={[styles.container, !isAlive && styles.containerDead]}>
      <StatusBar style="light" />

      {/* Persistent ghostly blue vignette when dead */}
      {!isAlive && <DeadVignette />}
      {currentPhase === 'vote' && <VoteVignette />}

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
            {gamePlayers.length > 0 && currentPhase !== 'setup' && (
              <Pressable
                onPress={() => setSeatingChartVisible(true)}
                style={[
                  styles.feedbackHistoryButton,
                  !isAlive && styles.feedbackHistoryButtonDead,
                ]}
                accessibilityLabel="좌석 배치"
                accessibilityRole="button"
              >
                <Text style={styles.feedbackHistoryIcon}>🪑</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setDictionaryVisible(true)}
              style={[
                styles.feedbackHistoryButton,
                !isAlive && styles.feedbackHistoryButtonDead,
              ]}
              accessibilityLabel="역할 사전"
              accessibilityRole="button"
            >
              <Text style={styles.feedbackHistoryIcon}>📖</Text>
            </Pressable>
            {currentPhase !== 'setup' && (
              <Pressable
                onPress={() => setChatModalVisible(true)}
                style={[
                  styles.feedbackHistoryButton,
                  !isAlive && styles.feedbackHistoryButtonDead,
                ]}
                accessibilityLabel="밀담"
                accessibilityRole="button"
              >
                <Text style={styles.feedbackHistoryIcon}>💬</Text>
                {chatUnreadCount > 0 && (
                  <View
                    style={[
                      styles.unreadBadge,
                      isAlive
                        ? styles.unreadBadgeAlive
                        : styles.unreadBadgeDead,
                    ]}
                  >
                    <Text style={styles.unreadBadgeText}>
                      {chatUnreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            )}
            {feedbackHistory.length > 0 && currentPhase !== 'setup' && (
              <Pressable
                onPress={() => setFeedbackHistoryVisible(true)}
                style={[
                  styles.feedbackHistoryButton,
                  !isAlive && styles.feedbackHistoryButtonDead,
                ]}
                accessibilityLabel="피드백 기록"
                accessibilityRole="button"
              >
                <Text style={styles.feedbackHistoryIcon}>📜</Text>
                <Text
                  style={[
                    styles.feedbackHistoryCount,
                    !isAlive && styles.feedbackHistoryCountDead,
                  ]}
                >
                  {feedbackHistory.length}
                </Text>
              </Pressable>
            )}
            {!isAlive && (
              <Text style={styles.deadSkull} accessibilityLabel="사망자 목록">
                💀
              </Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.phaseRow}>
          <PhaseIndicator phase={currentPhase} desaturated={!isAlive} />
          {currentPhase === 'day' && daySubPhase && (
            <View
              style={[
                styles.subPhaseBadge,
                !isAlive && styles.subPhaseBadgeDead,
              ]}
            >
              <Text
                style={[
                  styles.subPhaseText,
                  !isAlive && styles.subPhaseTextDead,
                ]}
              >
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
          executionHappenedToday={executionHappenedToday}
          votingMode={gameSettings?.votingMode}
          onOpenNominate={() => setNominateModalVisible(true)}
        />

        {daySubPhase === 'defense' && nomination && (
          <VotePrompt
            nominatorName={nomination.nominatorName}
            nomineeName={nomination.nomineeName}
          />
        )}

        {currentPhase === 'vote' && nomination && (
          <VotePrompt
            nominatorName={nomination.nominatorName}
            nomineeName={nomination.nomineeName}
          />
        )}

        {!nomination && voteResult && (
          <VoteResult
            nomineeName={voteResult.nomineeName}
            guilty={voteResult.guilty}
            votes={voteResult.votes}
            executionCandidate={voteResult.executionCandidate}
          />
        )}

        {!voteResult &&
          !nomination &&
          executionCandidate &&
          currentPhase !== 'night' &&
          currentPhase !== 'ended' && (
            <View style={styles.executionCard}>
              <Text style={styles.executionCardLabel}>처형 예정</Text>
              <Text style={styles.executionCardName}>
                {executionCandidate.playerName}
              </Text>
              <Text style={styles.executionCardVotes}>
                찬성 {executionCandidate.guiltyVotes}표
              </Text>
            </View>
          )}

        <EndedPhase
          visible={currentPhase === 'ended'}
          gameResult={gameResult}
        />

        {canUseSlayer && (
          <View style={styles.slayerContainer}>
            <Pressable
              onPress={() => setSlayerModalVisible(true)}
              style={styles.slayerButton}
            >
              <Text style={styles.slayerButtonText}>처단자 선언</Text>
            </Pressable>
          </View>
        )}

        {(role || currentPhase === 'setup') && (
          <FlippableRoleCard
            role={role}
            evilInfo={evilInfo}
            veiled={currentPhase === 'setup'}
            currentPhase={currentPhase}
            butlerMasterName={butlerMasterName}
          />
        )}
      </ScrollView>

      {showStartReveal && role && (
        <GameStartReveal
          role={role}
          evilInfo={evilInfo}
          onDismiss={dismissStartReveal}
        />
      )}

      {rolePromotion && !showStartReveal && (
        <RolePromotionReveal
          role={rolePromotion}
          onDismiss={dismissRolePromotion}
        />
      )}

      {justDied && (
        <DeathOverlay
          onDismiss={() =>
            dismissDeath({
              justDied: false,
              deathReason: null,
              nightDeathAnnouncement: null,
            })
          }
          reason={deathReason}
        />
      )}

      {executionAnnouncement &&
        !justDied &&
        !(currentPhase === 'ended' && gameResult) && (
          <ExecutionOverlay
            announcement={executionAnnouncement}
            onDismiss={() => dismissDeath({ executionAnnouncement: null })}
          />
        )}

      {showNightFall && (
        <NightFallOverlay onDismiss={() => setShowNightFall(false)} />
      )}

      {ravenkeeperOverlay && (
        <RavenkeeperOverlay onDismiss={() => setRavenkeeperOverlay(false)} />
      )}

      {nightDeathAnnouncement && !justDied && !executionAnnouncement && (
        <NightDeathOverlay
          deaths={nightDeathAnnouncement}
          onDismiss={() => dismissDeath({ nightDeathAnnouncement: null })}
        />
      )}

      {slayerFizzle && !justDied && !executionAnnouncement && (
        <SlayerFizzleOverlay
          slayerName={slayerFizzle.slayerName}
          targetName={slayerFizzle.targetName}
          isVotePhase={currentPhase === 'vote'}
          onDismiss={() => dismissDeath({ slayerFizzle: null })}
        />
      )}

      {currentPhase === 'ended' && gameResult && role && !gameEndDismissed && (
        <GameEndOverlay
          gameResult={gameResult}
          myTeam={role.team}
          onDismiss={() => setGameEndDismissed(true)}
        />
      )}

      <WhisperToast
        onNavigate={(conversationId) => {
          const meta =
            useWhisperStore.getState().conversationMeta[conversationId];
          if (meta) {
            setWhisperInitialTarget({
              conversationId,
              participantIds: meta.participantIds,
              participantNames: meta.participantNames,
            });
            setWhisperModalVisible(true);
          }
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
        nominatedTodayIds={nominatedTodayIds}
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

      <DictionaryModal
        visible={dictionaryVisible}
        onClose={() => setDictionaryVisible(false)}
      />

      <StorytellerChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        onSend={sendChatToStoryteller}
      />

      <StorytellerChatToast onPress={() => setChatModalVisible(true)} />

      <SeatingChart
        visible={seatingChartVisible}
        players={gamePlayers}
        myId={playerId}
        phase={currentPhase}
        onClose={() => setSeatingChartVisible(false)}
      />
    </SafeAreaView>
  );
}
