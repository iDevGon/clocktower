import { getRoleById, getRolesForEdition, type Role } from '@clocktower/shared';
import { BaseToast, DictionaryModal, SpriteIcon } from '@clocktower/ui';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { arcaneUiSprite, uiIcon } from '../src/assets/ui';
import { DeadVignette } from '../src/components/DeadVignette';
import { ExileVoteModal } from '../src/components/ExileVoteModal';
import { FeedbackHistoryModal } from '../src/components/FeedbackHistoryModal';
import { GameOverlays } from '../src/components/GameOverlays';
import { GossipAnnouncementOverlay } from '../src/components/GossipAnnouncementOverlay';
import { GossipDeclareModal } from '../src/components/GossipDeclareModal';
import { GunslingerFiredOverlay } from '../src/components/GunslingerFiredOverlay';
import { HarlotConsentModal } from '../src/components/HarlotConsentModal';
import { JugglerAnnouncementOverlay } from '../src/components/JugglerAnnouncementOverlay';
import { JugglerDeclareModal } from '../src/components/JugglerDeclareModal';
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
import { FlippableRoleCard } from '../src/components/RoleCard';
import { ScapegoatSwappedOverlay } from '../src/components/ScapegoatSwappedOverlay';
import { SeatingChart } from '../src/components/SeatingChart';
import { StorytellerChatModal } from '../src/components/StorytellerChatModal';
import { StorytellerChatToast } from '../src/components/StorytellerChatToast';
import { VotePrompt, VoteVignette } from '../src/components/VotePrompt';
import { VoteResult } from '../src/components/VoteResult';
import { WhisperModal } from '../src/components/WhisperModal';
import { WhisperToast } from '../src/components/WhisperToast';
import { useGameActions } from '../src/hooks/useGameActions';
import { useChatStore } from '../src/stores/chatStore';
import { usePlayerStore } from '../src/stores/playerStore';
import { useSettingsStore } from '../src/stores/settingsStore';
import { useWhisperStore } from '../src/stores/whisperStore';
import { styles } from '../src/styles/game.styles';
import { isNightWakeUpForCurrentRole } from '../src/utils/nightTurn';

const DAY_SUB_PHASE_LABELS: Record<string, string> = {
  whisper: '밀담',
  discussion: '공개 토론',
  nomination: '지목',
  defense: '변론',
};
const PLAYER_UI_SPRITE_TILE_SIZE = 128;

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
  const savantUsedToday = usePlayerStore((s) => s.savantUsedToday);
  const artistUsed = usePlayerStore((s) => s.artistUsed);
  const philosopherGrantedRole = usePlayerStore(
    (s) => s.philosopherGrantedRole,
  );
  const jugglerUsed = usePlayerStore((s) => s.jugglerUsed);
  const gossipUsedToday = usePlayerStore((s) => s.gossipUsedToday);
  const moonchildUsed = usePlayerStore((s) => s.moonchildUsed);
  const gunslingerUsedToday = usePlayerStore((s) => s.gunslingerUsedToday);
  const todayFirstVoteGuiltyVoters = usePlayerStore(
    (s) => s.todayFirstVoteGuiltyVoters,
  );
  const beggarTokens = usePlayerStore((s) => s.beggarTokens);
  const deadVoteUsed = usePlayerStore((s) => s.deadVoteUsed);
  const evilInfo = usePlayerStore((s) => s.evilInfo);
  const gameSettings = usePlayerStore((s) => s.gameSettings);
  const dictionaryRoleIds = useMemo(() => {
    const setupEditionId = gameSettings?.setupEditionId ?? role?.edition;
    const editionRoles = setupEditionId
      ? getRolesForEdition(setupEditionId).map((r) => r.id)
      : [];
    return [
      ...new Set([...editionRoles, ...(gameSettings?.additionalRoleIds ?? [])]),
    ];
  }, [gameSettings?.setupEditionId, gameSettings?.additionalRoleIds, role]);
  const seatingRoleOptions = useMemo(() => {
    const setupEditionId = gameSettings?.setupEditionId ?? role?.edition;
    const roleById = new Map<string, Role>();

    if (setupEditionId) {
      for (const option of getRolesForEdition(setupEditionId)) {
        roleById.set(option.id, option);
      }
    }

    for (const roleId of gameSettings?.additionalRoleIds ?? []) {
      const option = getRoleById(roleId);
      if (option) roleById.set(option.id, option);
    }

    for (const player of gamePlayers) {
      if (!player.travellerRoleId) continue;
      const option = getRoleById(player.travellerRoleId);
      if (option) roleById.set(option.id, option);
    }

    return [...roleById.values()];
  }, [
    gamePlayers,
    gameSettings?.setupEditionId,
    gameSettings?.additionalRoleIds,
    role,
  ]);
  const executionHappenedToday = usePlayerStore(
    (s) => s.executionHappenedToday,
  );
  const executionCandidate = usePlayerStore((s) => s.executionCandidate);
  const nominatedTodayIds = usePlayerStore((s) => s.nominatedTodayIds);
  const rolePromotion = usePlayerStore((s) => s.rolePromotion);
  const butlerMasterName = usePlayerStore((s) => s.butlerMasterName);
  const dismissDeath = usePlayerStore((s) => s.set);
  const kicked = usePlayerStore((s) => s.kicked);
  const eventToast = usePlayerStore((s) => s.eventToast);
  const dismissEventToast = usePlayerStore((s) => s.dismissEventToast);
  const {
    submitNightAction,
    sendWhisper,
    sendChatToStoryteller,
    nominatePlayer,
    useSlayer: activateSlayer,
    useSavant: activateSavant,
    useArtist: activateArtist,
    choosePhilosopherRole,
    declareJuggler,
    declareGossip,
    chooseMoonchildTarget,
    useGunslinger: activateGunslinger,
    giveBeggarToken,
    proposeExile,
    castExileVote,
    respondHarlotConsent,
    leaveGame,
  } = useGameActions();

  useEffect(() => {
    if (kicked) {
      usePlayerStore.getState().set({ kicked: false });
      Alert.alert('강퇴됨', '이야기꾼에 의해 게임에서 제거되었습니다.', [
        { text: '확인', onPress: () => router.replace('/') },
      ]);
      return;
    }
    if (!playerId) {
      router.replace('/');
    }
  }, [playerId, kicked, router]);

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
  const [jugglerModalVisible, setJugglerModalVisible] = useState(false);
  const [gossipModalVisible, setGossipModalVisible] = useState(false);
  const [moonchildModalVisible, setMoonchildModalVisible] = useState(false);
  const [gunslingerModalVisible, setGunslingerModalVisible] = useState(false);
  const [beggarModalVisible, setBeggarModalVisible] = useState(false);
  const [feedbackHistoryVisible, setFeedbackHistoryVisible] = useState(false);
  const [dictionaryVisible, setDictionaryVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [seatingChartVisible, setSeatingChartVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const lowPowerMode = useSettingsStore((s) => s.lowPowerMode);
  const setLowPowerMode = useSettingsStore((s) => s.setLowPowerMode);
  const [ravenkeeperOverlay, setRavenkeeperOverlay] = useState(false);
  const feedbackHistory = usePlayerStore((s) => s.feedbackHistory);
  const seatingRoleNotes = usePlayerStore((s) => s.seatingRoleNotes);
  const voteHistory = usePlayerStore((s) => s.voteHistory);
  const setSeatingRoleNote = usePlayerStore((s) => s.setSeatingRoleNote);
  const chatUnreadCount = useChatStore((s) => s.unreadCount);
  const totalUnread = useWhisperStore((s) =>
    Object.values(s.unreadCounts).reduce((a, b) => a + b, 0),
  );

  const dismissStartReveal = useCallback(() => setShowStartReveal(false), []);
  const dismissRolePromotion = useCallback(
    () => dismissDeath({ rolePromotion: null }),
    [dismissDeath],
  );

  const nightWakeUp = usePlayerStore((s) => s.nightWakeUp);
  // 서버가 night:wakeUp을 개별 전송하므로, wakeUp 수신 시에만 차례로 인정
  const isMyTurn = isNightWakeUpForCurrentRole(
    role?.id,
    philosopherGrantedRole,
    nightWakeUp,
  );

  // nightWakeUp 수신 시 밤 행동 UI를 가리는 오버레이 자동 해제
  useEffect(() => {
    if (nightWakeUp && role != null) {
      setShowNightFall(false);
    }
  }, [nightWakeUp, role]);

  // 까마귀지기가 밤에 죽었을 때만 전용 오버레이 표시
  const effectiveRoleId =
    role?.id === 'philosopher' && philosopherGrantedRole
      ? philosopherGrantedRole
      : role?.id;
  useEffect(() => {
    if (nightWakeUp && role != null && effectiveRoleId === 'ravenkeeper') {
      setRavenkeeperOverlay(true);
    }
  }, [nightWakeUp, role, effectiveRoleId]);

  const handleNominate = async (nomineeId: string) => {
    setNominateModalVisible(false);
    const result = await nominatePlayer(nomineeId);
    if (!result.success) {
      Alert.alert('지목 실패', result.error ?? '지목할 수 없습니다');
    }
  };

  const handleProposeExile = async (targetId: string) => {
    setExileModalVisible(false);
    const result = await proposeExile(targetId);
    if (!result.success) {
      Alert.alert(
        '추방 제안 실패',
        result.error ?? '추방을 제안할 수 없습니다',
      );
    }
  };

  const handleSlayer = async (targetId: string) => {
    setSlayerModalVisible(false);
    const result = await activateSlayer(targetId);
    if (!result.success) {
      Alert.alert('처단자 실패', result.error ?? '사용할 수 없습니다');
    }
  };

  const handleSavant = async () => {
    const result = await activateSavant();
    if (!result.success) {
      Alert.alert('백치천재 실패', result.error ?? '사용할 수 없습니다');
    }
  };

  const handleArtist = async () => {
    const result = await activateArtist();
    if (!result.success) {
      Alert.alert('화가 실패', result.error ?? '사용할 수 없습니다');
    }
  };

  const canUseSlayer =
    isAlive &&
    !slayerUsed &&
    dictionaryRoleIds.includes('slayer') &&
    role?.team !== 'traveller' &&
    (currentPhase === 'day' || currentPhase === 'vote');

  const canUseSavant =
    isAlive &&
    !savantUsedToday &&
    effectiveRoleId === 'savant' &&
    currentPhase === 'day';

  const canUseArtist =
    isAlive &&
    !artistUsed &&
    effectiveRoleId === 'artist' &&
    currentPhase === 'day';

  const canUseJuggler =
    isAlive &&
    !jugglerUsed &&
    effectiveRoleId === 'juggler' &&
    currentPhase === 'day' &&
    nightCount === 1;

  const canUseGossip =
    isAlive &&
    !gossipUsedToday &&
    dictionaryRoleIds.includes('gossip') &&
    currentPhase === 'day';

  const canUseMoonchild =
    !isAlive &&
    !moonchildUsed &&
    dictionaryRoleIds.includes('moonchild') &&
    (currentPhase === 'day' || currentPhase === 'vote');

  const handleJugglerSubmit = async (
    guesses: Array<{ playerId: string; roleId: string }>,
  ) => {
    const result = await declareJuggler(guesses);
    if (!result.success) {
      Alert.alert('곡예사 실패', result.error ?? '사용할 수 없습니다');
    }
  };

  const handleGossipSubmit = async (statement: string) => {
    setGossipModalVisible(false);
    const result = await declareGossip(statement);
    if (!result.success) {
      Alert.alert('험담 실패', result.error ?? '사용할 수 없습니다');
    }
  };

  const handleMoonchildChoose = async (targetId: string) => {
    setMoonchildModalVisible(false);
    const result = await chooseMoonchildTarget(targetId);
    if (!result.success) {
      Alert.alert('달의 자손 실패', result.error ?? '선택할 수 없습니다');
    }
  };

  const canUseGunslinger =
    isAlive &&
    !gunslingerUsedToday &&
    role?.id === 'gunslinger' &&
    (currentPhase === 'day' || currentPhase === 'vote') &&
    (todayFirstVoteGuiltyVoters?.length ?? 0) > 0;

  const handleGunslingerFire = async (targetId: string) => {
    setGunslingerModalVisible(false);
    const result = await activateGunslinger(targetId);
    if (!result.success) {
      Alert.alert('총잡이 실패', result.error ?? '사용할 수 없습니다');
    }
  };

  const aliveBeggars = useMemo(
    () =>
      gamePlayers.filter(
        (p) => p.isAlive && p.id !== playerId && p.travellerRoleId === 'beggar',
      ),
    [gamePlayers, playerId],
  );

  const canGiveBeggarToken =
    !isAlive && !deadVoteUsed && aliveBeggars.length > 0;

  const handleGiveBeggarToken = async (beggarId: string) => {
    setBeggarModalVisible(false);
    const result = await giveBeggarToken(beggarId);
    if (!result.success) {
      Alert.alert('토큰 수여 실패', result.error ?? '');
    }
  };

  const nominatablePlayers = useMemo(
    () => gamePlayers.filter((p) => p.id !== playerId && !p.isTraveller),
    [gamePlayers, playerId],
  );

  const exilableTravellers = useMemo(
    () => gamePlayers.filter((p) => p.isAlive && p.isTraveller),
    [gamePlayers],
  );

  const [exileModalVisible, setExileModalVisible] = useState(false);

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
            {currentPhase !== 'setup' && (
              <Pressable
                onPress={() => setChatModalVisible(true)}
                style={[
                  styles.feedbackHistoryButton,
                  !isAlive && styles.feedbackHistoryButtonDead,
                ]}
                accessibilityLabel="이야기꾼과 채팅"
                accessibilityRole="button"
              >
                <SpriteIcon
                  source={arcaneUiSprite}
                  index={uiIcon.chat}
                  size={30}
                  tileSize={PLAYER_UI_SPRITE_TILE_SIZE}
                  opacity={isAlive ? 1 : 0.58}
                />
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
            {!isAlive && (
              <View style={styles.deadSkull} accessibilityLabel="사망 상태">
                <SpriteIcon
                  source={arcaneUiSprite}
                  index={uiIcon.verdict}
                  size={32}
                  tileSize={PLAYER_UI_SPRITE_TILE_SIZE}
                  opacity={0.7}
                />
              </View>
            )}
            <Pressable
              onPress={() => setSettingsVisible(true)}
              style={[
                styles.feedbackHistoryButton,
                !isAlive && styles.feedbackHistoryButtonDead,
              ]}
              accessibilityLabel="설정"
              accessibilityRole="button"
            >
              <SpriteIcon
                source={arcaneUiSprite}
                index={uiIcon.settings}
                size={30}
                tileSize={PLAYER_UI_SPRITE_TILE_SIZE}
                opacity={isAlive ? 1 : 0.58}
              />
            </Pressable>
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
          isMyTurn={isMyTurn}
          playerId={playerId}
          nightActionSubmitted={nightActionSubmitted}
          nightFeedback={nightFeedback}
          onSubmitNightAction={submitNightAction}
          philosopherGrantedRoleId={philosopherGrantedRole}
          onChoosePhilosopherRole={async (roleId) => {
            const result = await choosePhilosopherRole(roleId);
            if (!result.success) {
              Alert.alert(
                '철학자 능력 실패',
                result.error ?? '사용할 수 없습니다',
              );
            }
          }}
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
          hasTravellers={exilableTravellers.length > 0}
          onOpenExile={() => setExileModalVisible(true)}
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
            executionStatus={voteResult.executionStatus}
            executionMessage={voteResult.executionMessage}
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

        {canUseSavant && (
          <View style={styles.slayerContainer}>
            <Pressable onPress={handleSavant} style={styles.savantButton}>
              <Text style={styles.savantButtonText}>백치천재 능력 사용</Text>
            </Pressable>
          </View>
        )}

        {canUseArtist && (
          <View style={styles.slayerContainer}>
            <Pressable onPress={handleArtist} style={styles.artistButton}>
              <Text style={styles.artistButtonText}>화가 능력 사용</Text>
            </Pressable>
          </View>
        )}

        {canUseJuggler && (
          <View style={styles.slayerContainer}>
            <Pressable
              onPress={() => setJugglerModalVisible(true)}
              style={styles.jugglerButton}
            >
              <Text style={styles.jugglerButtonText}>곡예사 능력 사용</Text>
            </Pressable>
          </View>
        )}

        {canUseGossip && (
          <View style={styles.slayerContainer}>
            <Pressable
              onPress={() => setGossipModalVisible(true)}
              style={styles.gossipButton}
            >
              <Text style={styles.gossipButtonText}>험담 공개발언</Text>
            </Pressable>
          </View>
        )}

        {canUseMoonchild && (
          <View style={styles.slayerContainer}>
            <Pressable
              onPress={() => setMoonchildModalVisible(true)}
              style={styles.gossipButton}
            >
              <Text style={styles.gossipButtonText}>달의 자손 공개 선택</Text>
            </Pressable>
          </View>
        )}

        {canUseGunslinger && (
          <View style={styles.slayerContainer}>
            <Pressable
              onPress={() => setGunslingerModalVisible(true)}
              style={styles.gunslingerButton}
            >
              <Text style={styles.gunslingerButtonText}>총잡이 사살</Text>
            </Pressable>
          </View>
        )}

        {canGiveBeggarToken && (
          <View style={styles.slayerContainer}>
            <Pressable
              onPress={() => setBeggarModalVisible(true)}
              style={styles.beggarButton}
            >
              <Text style={styles.beggarButtonText}>
                거지에게 투표 토큰 주기
              </Text>
            </Pressable>
          </View>
        )}

        {role?.id === 'beggar' && isAlive && (
          <View style={styles.slayerContainer}>
            <Text style={styles.beggarTokenText}>
              투표 토큰: {beggarTokens}
            </Text>
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

      {currentPhase !== 'setup' && currentPhase !== 'ended' && (
        <View style={[styles.bottomNav, !isAlive && styles.bottomNavDead]}>
          {gamePlayers.length > 0 && (
            <Pressable
              onPress={() => setSeatingChartVisible(true)}
              style={styles.bottomNavItem}
              accessibilityLabel="좌석 배치"
              accessibilityRole="button"
            >
              <SpriteIcon
                source={arcaneUiSprite}
                index={uiIcon.seating}
                size={30}
                tileSize={PLAYER_UI_SPRITE_TILE_SIZE}
                opacity={isAlive ? 1 : 0.55}
              />
              <Text
                style={[
                  styles.bottomNavLabel,
                  !isAlive && styles.bottomNavLabelDead,
                ]}
              >
                좌석
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => setFeedbackHistoryVisible(true)}
            style={styles.bottomNavItem}
            accessibilityLabel="받은 정보"
            accessibilityRole="button"
          >
            <SpriteIcon
              source={arcaneUiSprite}
              index={uiIcon.log}
              size={30}
              tileSize={PLAYER_UI_SPRITE_TILE_SIZE}
              opacity={isAlive ? 1 : 0.55}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                !isAlive && styles.bottomNavLabelDead,
              ]}
            >
              받은 정보
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setDictionaryVisible(true)}
            style={styles.bottomNavItem}
            accessibilityLabel="역할 사전"
            accessibilityRole="button"
          >
            <SpriteIcon
              source={arcaneUiSprite}
              index={uiIcon.dictionary}
              size={30}
              tileSize={PLAYER_UI_SPRITE_TILE_SIZE}
              opacity={isAlive ? 1 : 0.55}
            />
            <Text
              style={[
                styles.bottomNavLabel,
                !isAlive && styles.bottomNavLabelDead,
              ]}
            >
              역할 사전
            </Text>
          </Pressable>
        </View>
      )}

      <GameOverlays
        showStartReveal={showStartReveal}
        role={role}
        evilInfo={evilInfo}
        onDismissStartReveal={dismissStartReveal}
        rolePromotion={rolePromotion}
        onDismissRolePromotion={dismissRolePromotion}
        justDied={justDied}
        deathReason={deathReason}
        onDismissDeath={() =>
          dismissDeath({
            justDied: false,
            deathReason: null,
            nightDeathAnnouncement: null,
          })
        }
        executionAnnouncement={executionAnnouncement}
        currentPhase={currentPhase}
        gameResult={gameResult}
        onDismissExecution={() => dismissDeath({ executionAnnouncement: null })}
        showNightFall={showNightFall}
        onDismissNightFall={() => setShowNightFall(false)}
        showRavenkeeper={ravenkeeperOverlay}
        onDismissRavenkeeper={() => setRavenkeeperOverlay(false)}
        nightDeathAnnouncement={nightDeathAnnouncement}
        onDismissNightDeath={() =>
          dismissDeath({ nightDeathAnnouncement: null })
        }
        slayerFizzle={slayerFizzle}
        onDismissSlayerFizzle={() => dismissDeath({ slayerFizzle: null })}
        gameEndDismissed={gameEndDismissed}
        myTeam={role?.team}
        onDismissGameEnd={() => setGameEndDismissed(true)}
      />

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
        visible={exileModalVisible}
        players={exilableTravellers}
        onNominate={handleProposeExile}
        onClose={() => setExileModalVisible(false)}
        title="추방할 여행자 선택"
      />

      <NominateModal
        visible={slayerModalVisible}
        players={gamePlayers.filter((p) => p.isAlive && p.id !== playerId)}
        onNominate={handleSlayer}
        onClose={() => setSlayerModalVisible(false)}
      />

      <JugglerDeclareModal
        visible={jugglerModalVisible}
        edition={role?.edition ?? 'sects_and_violets'}
        players={gamePlayers}
        myPlayerId={playerId}
        onSubmit={handleJugglerSubmit}
        onClose={() => setJugglerModalVisible(false)}
      />

      <GossipDeclareModal
        visible={gossipModalVisible}
        onSubmit={handleGossipSubmit}
        onClose={() => setGossipModalVisible(false)}
      />

      <NominateModal
        visible={moonchildModalVisible}
        players={gamePlayers.filter((p) => p.isAlive && p.id !== playerId)}
        onNominate={handleMoonchildChoose}
        onClose={() => setMoonchildModalVisible(false)}
        title="달의 자손 공개 선택"
      />

      <NominateModal
        visible={gunslingerModalVisible}
        players={gamePlayers.filter((p) =>
          (todayFirstVoteGuiltyVoters ?? []).includes(p.id),
        )}
        onNominate={handleGunslingerFire}
        onClose={() => setGunslingerModalVisible(false)}
        title="총잡이 사살 대상"
      />

      <NominateModal
        visible={beggarModalVisible}
        players={aliveBeggars}
        onNominate={handleGiveBeggarToken}
        onClose={() => setBeggarModalVisible(false)}
        title="토큰을 줄 거지 선택"
      />

      <JugglerAnnouncementOverlay />
      <GossipAnnouncementOverlay />
      <GunslingerFiredOverlay />
      <ScapegoatSwappedOverlay />

      <FeedbackHistoryModal
        visible={feedbackHistoryVisible}
        history={feedbackHistory}
        onClose={() => setFeedbackHistoryVisible(false)}
      />

      <DictionaryModal
        visible={dictionaryVisible}
        onClose={() => setDictionaryVisible(false)}
        editionId={gameSettings?.setupEditionId ?? role?.edition}
        roleIds={dictionaryRoleIds}
      />

      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable
          style={styles.settingsOverlay}
          onPress={() => setSettingsVisible(false)}
        >
          <Pressable
            style={styles.settingsPanel}
            onPress={(e) => e.stopPropagation?.()}
          >
            <Text style={styles.settingsTitle}>설정</Text>
            <View style={styles.settingsRow}>
              <View>
                <Text style={styles.settingsLabel}>저전력 모드</Text>
                <Text style={styles.settingsDesc}>
                  {lowPowerMode
                    ? 'ON — 애니메이션 비활성화'
                    : 'OFF — 모든 효과 사용'}
                </Text>
              </View>
              <Switch
                value={lowPowerMode}
                onValueChange={setLowPowerMode}
                trackColor={{ false: '#3a3a42', true: '#2a4a2a' }}
                thumbColor={lowPowerMode ? '#2ecc71' : '#908e8a'}
                accessibilityLabel="저전력 모드"
              />
            </View>
            <Pressable
              onPress={() => {
                setSettingsVisible(false);
                Alert.alert('게임 나가기', '정말 게임에서 나가시겠습니까?', [
                  { text: '취소', style: 'cancel' },
                  {
                    text: '나가기',
                    style: 'destructive',
                    onPress: async () => {
                      const res = await leaveGame();
                      if (res.success) {
                        const name = usePlayerStore.getState().playerName;
                        usePlayerStore.getState().reset();
                        usePlayerStore.getState().set({ playerName: name });
                        router.replace('/');
                      }
                    },
                  },
                ]);
              }}
              style={styles.settingsLeaveButton}
              accessibilityLabel="게임 나가기"
              accessibilityRole="button"
            >
              <Text style={styles.settingsLeaveText}>게임 나가기</Text>
            </Pressable>
            <Pressable
              onPress={() => setSettingsVisible(false)}
              style={styles.settingsCloseButton}
            >
              <Text style={styles.settingsCloseText}>닫기</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <StorytellerChatModal
        visible={chatModalVisible}
        onClose={() => setChatModalVisible(false)}
        onSend={sendChatToStoryteller}
      />

      <StorytellerChatToast onPress={() => setChatModalVisible(true)} />

      <BaseToast
        visible={!!eventToast}
        onDismiss={dismissEventToast}
        badgeLabel={eventToast?.title ?? ''}
        message={eventToast?.message ?? ''}
        zIndex={650}
      />

      <ExileVoteModal onVote={castExileVote} />
      <HarlotConsentModal onRespond={respondHarlotConsent} />

      <SeatingChart
        visible={seatingChartVisible}
        players={gamePlayers}
        myId={playerId}
        phase={currentPhase}
        roleOptions={seatingRoleOptions}
        roleNotes={seatingRoleNotes}
        voteHistory={voteHistory}
        onSetRoleNote={setSeatingRoleNote}
        onClose={() => setSeatingChartVisible(false)}
      />
    </SafeAreaView>
  );
}
