import {
  ALL_TRAVELLER_ROLES,
  type GameSettings,
  getNightOrderForEdition,
  getRandomTipText,
  getRoleById,
  getTravellersForEdition,
  NIGHT_ACTIONS,
  PLAYER_STATUS_LABELS,
  type PlayerStatus,
  SECTS_AND_VIOLETS_ROLES,
  type TipCategory,
} from '@clocktower/shared';
import { DictionaryModal } from '@clocktower/ui';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActionModal,
  type ActionModalOption,
} from '../../src/components/ActionModal';
import { ArtistRequestModal } from '../../src/components/ArtistRequestModal';
import { ChatToast } from '../../src/components/ChatToast';
import { ConfirmModal } from '../../src/components/ConfirmModal';
import { DaySubPhaseBar } from '../../src/components/DaySubPhaseBar';
import { DeliveredFeedbackHistoryModal } from '../../src/components/DeliveredFeedbackHistoryModal';
import {
  type CircularPosition,
  DraggablePlayerToken,
} from '../../src/components/DraggablePlayerToken';
import { EventToast } from '../../src/components/EventToast';
import { GameEndBanner } from '../../src/components/GameResultBanners';
import { GrimoireBottomBar } from '../../src/components/GrimoireBottomBar';
import { GrimoireTopBar } from '../../src/components/GrimoireTopBar';
import { HostDesktopConsoleFrame } from '../../src/components/HostDesktopConsoleFrame';
import { NightPanel } from '../../src/components/NightPanel';
import {
  getChefHint,
  getEmpathHint,
} from '../../src/components/nightRoleLogic';
import { PhaseBar } from '../../src/components/PhaseBar';
import { PhaseTipToast } from '../../src/components/PhaseTipToast';
import { PlayerPickerModal } from '../../src/components/PlayerPickerModal';
import { ChefHintBar, EmpathHintBar } from '../../src/components/RoleHintBars';
import { RoleRevealWaitingOverlay } from '../../src/components/RoleRevealWaitingOverlay';
import { SavantRequestModal } from '../../src/components/SavantRequestModal';
import { ScapegoatOfferModal } from '../../src/components/ScapegoatOfferModal';
import { SettingsPanel } from '../../src/components/SettingsPanel';
import { StorytellerChatModal } from '../../src/components/StorytellerChatModal';
import { TwoPlayerPickerModal } from '../../src/components/TwoPlayerPickerModal';
import { VoteClockFace } from '../../src/components/VoteClockFace';
import { VoteClockHand } from '../../src/components/VoteClockHand';
import { VotePanel } from '../../src/components/VotePanel';
import { VOTE_CLOCK_LAYER } from '../../src/components/votePresentation';
import {
  getNextDaySubPhase,
  getPhaseAdvanceShortcutResult,
  type StorytellerShortcutAction,
} from '../../src/hooks/storytellerShortcuts';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useStorytellerKeyboardShortcuts } from '../../src/hooks/useStorytellerKeyboardShortcuts';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useGameStore } from '../../src/stores/gameStore';
import { useLogStore } from '../../src/stores/logStore';
import {
  createGrimoireStyles,
  grimoireDynamic,
} from '../../src/styles/grimoire.styles';

function VoteCountdownOverlay({
  countdown,
  centerX,
  centerY,
}: {
  countdown: { startedAt: number; durationMs: number };
  centerX: number;
  centerY: number;
}) {
  const [remaining, setRemaining] = useState(
    Math.ceil(
      Math.max(0, countdown.durationMs - (Date.now() - countdown.startedAt)) /
        1000,
    ),
  );
  const scale = useSharedValue(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = countdown.durationMs - (Date.now() - countdown.startedAt);
      const sec = Math.ceil(Math.max(0, ms) / 1000);
      setRemaining(sec);
      if (sec <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [countdown]);

  useEffect(() => {
    scale.value = 1.4;
    scale.value = withSpring(1, { damping: 8, stiffness: 200 });
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (remaining <= 0) return null;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        createGrimoireStyles(1).voteCountdownContainer,
      ]}
    >
      <Animated.Text
        style={[grimoireDynamic.voteCountdownText(centerX, centerY), animStyle]}
      >
        {remaining}
      </Animated.Text>
    </View>
  );
}

const ALL_STATUSES: PlayerStatus[] = [
  'poisoned',
  'drunk',
  'protected',
  'cursed',
  'master',
];

const PHASE_LABELS: Record<string, string> = {
  night: '밤',
  day: '낮',
  vote: '투표',
  ended: '종료',
};

export default function GrimoireScreen() {
  const {
    fontSize,
    tokenSize: defaultTokenSize,
    isDesktopConsole,
  } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createGrimoireStyles(scale), [scale]);

  const router = useRouter();
  const gameState = useGameStore((s) => s.gameState);
  const players = gameState?.players;
  const svRoleIds = useMemo(
    () => new Set(SECTS_AND_VIOLETS_ROLES.map((r) => r.id)),
    [],
  );
  const detectedEditionId = useMemo(() => {
    if (!players) return 'trouble_brewing';
    const hasSv = players.some((p) => p.role && svRoleIds.has(p.role.id));
    return hasSv ? 'sects_and_violets' : 'trouble_brewing';
  }, [players, svRoleIds]);
  const nightActions = useGameStore((s) => s.nightActions);
  const deliveredFeedbackHistory = useGameStore(
    (s) => s.deliveredFeedbackHistory,
  );
  const activeWhispers = useGameStore((s) => s.activeWhispers);
  const activeNightRoleId = useGameStore((s) => s.activeNightRoleId);
  const nightWakeUpTargets = useGameStore((s) => s.nightWakeUpTargets);
  const playerStatuses = useGameStore((s) => s.playerStatuses);
  const whisperClock = useGameStore((s) => s.whisperClock);
  const discussionClock = useGameStore((s) => s.discussionClock);
  const nominationClock = useGameStore((s) => s.nominationClock);
  const nominationPaused = useGameStore((s) => s.nominationPaused);
  const defenseClock = useGameStore((s) => s.defenseClock);
  const slayerWaitingAck = useGameStore((s) => s.slayerWaitingAck);
  const roleRevealShown = useGameStore((s) => s.roleRevealShown);
  const setRoleRevealShown = useGameStore((s) => s.setRoleRevealShown);
  const socket = useConnectionStore((s) => s.socket);
  const addLog = useLogStore((s) => s.addLog);
  const logs = useLogStore((s) => s.logs);
  const {
    setPhase,
    setDaySubPhase,
    kill: rawKill,
    revive: rawRevive,
    resetGame,
    restartGame,
    castVoteForPlayer,
    closeVote: rawCloseVote,
    proceedToVote,
    setActiveNightRole: rawSetActiveNightRole,
    sendNightFeedback,
    setPlayerStatuses: syncPlayerStatuses,
    setGameSettings,
    setPlayerOrder: syncPlayerOrder,
    sendChatToPlayer,
    sweetheartDrunk,
    mayorRedirect,
    scapegoatSwap,
    confirmWitchCurseDeath,
    barberSwapRoles,
    klutzChoose,
    fangGuConfirmJump,
    snakeCharmerSwap,
    vigormortisKillMinion,
    pitHagChangeRole,
    assignGoodTwin,
    boneCollectorRestore,
    applyBaristaEffect,
    assignRedHerring,
    kickPlayer,
    addTraveller,
    exileTraveller,
    forceCloseExile,
    approveTraveller,
    rejectTraveller,
  } = useGameActions();

  const sweetheartDiedPending = useGameStore((s) => s.sweetheartDiedPending);
  const sweetheartDiedName = useGameStore((s) => s.sweetheartDiedName);
  const clearSweetheartDied = useGameStore((s) => s.clearSweetheartDied);
  const savantRequest = useGameStore((s) => s.savantRequest);
  const setSavantRequest = useGameStore((s) => s.setSavantRequest);
  const artistRequest = useGameStore((s) => s.artistRequest);
  const setArtistRequest = useGameStore((s) => s.setArtistRequest);
  const jugglerCorrectCount = useGameStore((s) => s.jugglerCorrectCount);
  const scapegoatOffer = useGameStore((s) => s.scapegoatOffer);
  const setScapegoatOffer = useGameStore((s) => s.setScapegoatOffer);
  const deviantExileJudgement = useGameStore((s) => s.deviantExileJudgement);
  const setDeviantExileJudgement = useGameStore(
    (s) => s.setDeviantExileJudgement,
  );
  const mayorNightDeathPending = useGameStore((s) => s.mayorNightDeathPending);
  const mayorNightDeathId = useGameStore((s) => s.mayorNightDeathId);
  const mayorNightDeathName = useGameStore((s) => s.mayorNightDeathName);
  const clearMayorNightDeath = useGameStore((s) => s.clearMayorNightDeath);
  const witchCursePending = useGameStore((s) => s.witchCursePending);
  const setWitchCursePending = useGameStore((s) => s.setWitchCursePending);
  const barberDiedPending = useGameStore((s) => s.barberDiedPending);
  const setBarberDiedPending = useGameStore((s) => s.setBarberDiedPending);
  const klutzDiedPending = useGameStore((s) => s.klutzDiedPending);
  const setKlutzDiedPending = useGameStore((s) => s.setKlutzDiedPending);

  // 사랑꾼 사망 시 취하게 할 대상 후보: 살아있는 플레이어 (사랑꾼 본인 제외)
  const sweetheartDrunkCandidates = useMemo(() => {
    if (!players) return [];
    return players.filter((p) => p.isAlive && p.role?.id !== 'sweetheart');
  }, [players]);

  const handleSweetheartDrunkSelect = useCallback(
    (playerId: string) => {
      sweetheartDrunk(playerId);
      clearSweetheartDied();
    },
    [sweetheartDrunk, clearSweetheartDied],
  );

  // 시장 밤 사망 시 대신 죽일 후보: 살아있는 플레이어 (시장 본인 제외)
  const mayorRedirectCandidates = useMemo(() => {
    if (!players || !mayorNightDeathId) return [];
    return players.filter((p) => p.isAlive && p.id !== mayorNightDeathId);
  }, [players, mayorNightDeathId]);

  const handleMayorRedirectSelect = useCallback(
    (playerId: string) => {
      if (mayorNightDeathId) {
        mayorRedirect(mayorNightDeathId, playerId);
      }
      clearMayorNightDeath();
    },
    [mayorNightDeathId, mayorRedirect, clearMayorNightDeath],
  );

  const isGoodAligned = useCallback(
    (player: { alignment?: string; role?: { team: string } }) => {
      if (player.alignment) return player.alignment === 'good';
      return (
        player.role?.team === 'townsfolk' || player.role?.team === 'outsider'
      );
    },
    [],
  );

  const barberSwapCandidates = useMemo(() => {
    if (!players) return [];
    return players.filter((p) => !p.isTraveller && p.role);
  }, [players]);

  const klutzChoiceCandidates = useMemo(() => {
    if (!players) return [];
    return players.filter((p) => p.isAlive);
  }, [players]);

  const activeEvilTwin = useMemo(() => {
    if (activeNightRoleId !== 'evil_twin' || !players) return null;
    return (
      players.find(
        (p) =>
          p.isAlive &&
          p.role?.id === 'evil_twin' &&
          !p.statuses.includes('evil_twin'),
      ) ?? null
    );
  }, [activeNightRoleId, players]);
  const [evilTwinModalDismissed, setEvilTwinModalDismissed] = useState(false);
  useEffect(() => {
    if (activeNightRoleId === 'evil_twin') {
      setEvilTwinModalDismissed(false);
    }
  }, [activeNightRoleId]);
  const goodTwinCandidates = useMemo(() => {
    if (!players || !activeEvilTwin) return [];
    return players.filter(
      (p) =>
        p.id !== activeEvilTwin.id &&
        p.isAlive &&
        !p.isTraveller &&
        isGoodAligned(p),
    );
  }, [activeEvilTwin, isGoodAligned, players]);

  // Red Herring 선택 모달 상태 (게임 시작 시 점쟁이가 있으면 표시)
  const hasFortuneTeller = useMemo(
    () => players?.some((p) => p.role?.id === 'fortune_teller') ?? false,
    [players],
  );
  const [showRedHerringModal, setShowRedHerringModal] = useState(false);
  const redHerringShownRef = useRef(false);

  useEffect(() => {
    if (hasFortuneTeller && !redHerringShownRef.current) {
      // 이미 Red Herring이 배정된 상태면 모달을 띄우지 않음
      const alreadyAssigned = players?.some((p) =>
        p.statuses?.includes('cursed'),
      );
      if (alreadyAssigned) {
        redHerringShownRef.current = true;
        return;
      }
      redHerringShownRef.current = true;
      setShowRedHerringModal(true);
    }
  }, [hasFortuneTeller, players]);

  // 게임 시작 시 직업 공개 대기 오버레이 (이미 표시한 적 있으면 다시 표시하지 않음)
  // 페이즈 전환 팁 토스트
  const [phaseTip, setPhaseTip] = useState<{
    phase: Parameters<typeof getRandomTipText>[0];
    tip: string;
  } | null>(null);

  const [showRoleRevealWaiting, setShowRoleRevealWaiting] = useState(() => {
    if (roleRevealShown) return false;
    const shouldShow = !!(gameState?.phase === 'night' && gameState?.day === 1);
    if (shouldShow) {
      // 마운트 후 스토어에 표시 완료 플래그 기록
      setTimeout(() => setRoleRevealShown(true), 0);
    }
    return shouldShow;
  });

  const redHerringCandidates = useMemo(() => {
    if (!players) return [];
    return players.filter(
      (p) =>
        p.role?.id !== 'fortune_teller' &&
        (p.role?.team === 'townsfolk' || p.role?.team === 'outsider'),
    );
  }, [players]);

  const currentRedHerringId = useMemo(() => {
    if (!players) return null;
    return players.find((p) => p.statuses?.includes('cursed'))?.id ?? null;
  }, [players]);

  const handleRedHerringConfirmAuto = useCallback(() => {
    if (redHerringCandidates.length === 0) return;
    const random =
      redHerringCandidates[
        Math.floor(Math.random() * redHerringCandidates.length)
      ];
    assignRedHerring(random.id);
    setShowRedHerringModal(false);
  }, [redHerringCandidates, assignRedHerring]);

  const handleRedHerringSelectManual = useCallback(
    (playerId: string) => {
      assignRedHerring(playerId);
      setShowRedHerringModal(false);
    },
    [assignRedHerring],
  );

  const playerMemos = useGameStore((s) => s.playerMemos);
  const setPlayerMemo = useGameStore((s) => s.setPlayerMemo);
  const nominatedPlayers = useGameStore((s) => s.nominatedPlayers);
  const nominatorPlayers = useGameStore((s) => s.nominatorPlayers);

  const playerOrder = useGameStore((s) => s.playerOrder);
  const swapPlayerOrder = useGameStore((s) => s.swapPlayerOrder);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Execution highlight state
  const gameResult = useGameStore((s) => s.gameResult);
  const executedPlayerId = useGameStore((s) => s.lastExecutedPlayerId);
  const setExecutedPlayerId = useGameStore((s) => s.setLastExecutedPlayerId);
  const voteClock = useGameStore((s) => s.voteClock);
  const voteCountdown = useGameStore((s) => s.voteCountdown);
  const voteResult = useGameStore((s) => s.voteResult);
  const setVoteResult = useGameStore((s) => s.setVoteResult);
  const executionCandidateData = useGameStore((s) => s.executionCandidate);
  const votePreselections = useGameStore((s) => s.votePreselections);
  const voteConfirmed = useGameStore((s) => s.voteConfirmed);
  const exileVote = useGameStore((s) => s.exileVote);

  // Modal state
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    options: ActionModalOption[];
  }>({ visible: false, title: '', options: [] });

  const showModal = useCallback(
    (title: string, options: ActionModalOption[]) =>
      setModal({ visible: true, title, options }),
    [],
  );
  const closeModal = useCallback(
    () => setModal((m) => ({ ...m, visible: false })),
    [],
  );

  // 게임 중 참가 요청 승인 처리 — 소켓에서 직접 수신 → ConfirmModal 표시
  const [pendingApproval, setPendingApproval] = useState<{
    socketId: string;
    playerName: string;
  } | null>(null);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: { socketId: string; playerName: string }) => {
      setPendingApproval(data);
    };
    socket.on('traveller:pendingApproval', handler);
    return () => {
      socket.off('traveller:pendingApproval', handler);
    };
  }, [socket]);

  const handleApproveTraveller = useCallback(() => {
    if (!pendingApproval) return;
    const { socketId, playerName } = pendingApproval;
    setPendingApproval(null);
    approveTraveller(socketId, playerName);
    setTimeout(() => {
      const state = useGameStore.getState().gameState;
      const newTraveller = state?.players.find(
        (p) => p.name === playerName && p.isTraveller && !p.role,
      );
      if (newTraveller) {
        router.push({
          pathname: '/game/assign-role',
          params: { playerId: newTraveller.id, travellerOnly: 'true' },
        });
      }
    }, 500);
  }, [pendingApproval, approveTraveller, router]);

  const handleRejectTraveller = useCallback(() => {
    if (!pendingApproval) return;
    rejectTraveller(pendingApproval.socketId);
    setPendingApproval(null);
  }, [pendingApproval, rejectTraveller]);

  const getDay = () => useGameStore.getState().gameState?.day ?? 0;
  const getPhase = () => useGameStore.getState().gameState?.phase ?? 'setup';
  const playerNameMap = useMemo(() => {
    return new Map((players ?? []).map((p) => [p.id, p.name]));
  }, [players]);
  const getPlayerName = (id: string) => playerNameMap.get(id) ?? id;

  const kill = (playerId: string) => {
    rawKill(playerId);
    addLog(getDay(), getPhase(), `${getPlayerName(playerId)} 사망`, 'death');
  };

  const setPlayerStatus = (playerId: string, status: PlayerStatus) => {
    const store = useGameStore.getState();
    const current = playerStatuses[playerId] ?? [];
    if (!current.includes(status)) {
      store.addPlayerStatus(playerId, status);
      syncPlayerStatuses(playerId, [...current, status]);
    }
    addLog(
      getDay(),
      getPhase(),
      `${getPlayerName(playerId)} ${PLAYER_STATUS_LABELS[status]}`,
    );
  };

  const revive = (playerId: string) => {
    rawRevive(playerId);
    addLog(getDay(), getPhase(), `${getPlayerName(playerId)} 부활`);
  };

  const closeVote = () => {
    const nom = gameState?.nominations?.length
      ? gameState.nominations[gameState.nominations.length - 1]
      : null;
    rawCloseVote();
    useGameStore.getState().setVoteClock(null);
    if (nom) {
      const nomineeName = getPlayerName(nom.nomineeId);
      const entries = Object.entries(nom.votes);
      const totalVotes = entries.length;
      let guiltyCount = 0;
      for (const [, v] of entries) {
        if (v) guiltyCount++;
      }
      const alivePlayers =
        gameState?.players.filter((p) => p.isAlive).length ?? 0;
      const isGuilty = guiltyCount >= Math.ceil(alivePlayers / 2);
      addLog(
        getDay(),
        'vote',
        `${nomineeName} 투표 종료 (유죄 ${guiltyCount}/${totalVotes})`,
      );
      if (isGuilty) {
        setExecutedPlayerId(nom.nomineeId);
      }
    }
  };

  const setActiveNightRole = (roleId: string | null) => {
    rawSetActiveNightRole(roleId);
    useGameStore.getState().setActiveNightRoleId(roleId);
    if (roleId) {
      const role = getRoleById(roleId);
      addLog(getDay(), 'night', `${role?.name ?? roleId} 활성화`, 'ability');
    }
  };

  const handleSetPhase = (phase: Parameters<typeof setPhase>[0]) => {
    if (phase === 'night') {
      useGameStore.getState().clearNightActions();
      useGameStore.getState().setActiveNightRoleId(null);
      rawSetActiveNightRole(null);
      setNightOrderComplete(false);
    }
    if (phase === 'day') {
      setExecutedPlayerId(null);
    }
    // 종료 상태에서 다른 페이즈로 전환 시 결과 초기화
    if (gameState?.phase === 'ended' && phase !== 'ended') {
      useGameStore.getState().setGameResult(null);
    }
    setPhase(phase);
    addLog(
      phase === 'day' ? getDay() + 1 : getDay(),
      phase,
      `${PHASE_LABELS[phase] ?? phase} 페이즈로 전환`,
    );

    // 페이즈 전환 팁 표시
    const tipCategory: TipCategory =
      phase === 'vote'
        ? 'vote'
        : phase === 'day'
          ? 'day'
          : phase === 'night'
            ? 'night'
            : 'storyteller';
    if (phase !== 'ended') {
      setPhaseTip({
        phase: tipCategory,
        tip: getRandomTipText('storyteller'),
      });
    }
  };

  const showNightCompleteModal = () => {
    showModal('밤이 끝났습니다', [
      {
        text: '낮으로 전환',
        onPress: () => handleSetPhase('day'),
      },
      { text: '계속 진행', style: 'cancel' },
    ]);
  };

  const showDayCompleteModal = () => {
    showModal('다음 날 밤으로 진행', [
      {
        text: '밤으로 전환',
        onPress: () => handleSetPhase('night'),
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const handleStatusMenu = (playerId: string, playerName: string) => {
    const current = playerStatuses[playerId] ?? [];
    const store = useGameStore.getState();

    const statusOptions: ActionModalOption[] = ALL_STATUSES.map((status) => {
      const hasStatus = current.includes(status);
      return {
        text: `${hasStatus ? '✓ ' : ''}${PLAYER_STATUS_LABELS[status]}`,
        onPress: () => {
          if (hasStatus) {
            store.removePlayerStatus(playerId, status);
            const updated = current.filter((st) => st !== status);
            syncPlayerStatuses(playerId, updated);
            addLog(
              getDay(),
              getPhase(),
              `${playerName} 상태 제거: ${PLAYER_STATUS_LABELS[status]}`,
            );
          } else {
            store.addPlayerStatus(playerId, status);
            const updated = [...current, status];
            syncPlayerStatuses(playerId, updated);
            addLog(
              getDay(),
              getPhase(),
              `${playerName} 상태 부여: ${PLAYER_STATUS_LABELS[status]}`,
            );
          }
        },
      };
    });

    if (current.length > 0) {
      statusOptions.push({
        text: '모두 제거',
        style: 'destructive',
        onPress: () => {
          store.clearPlayerStatuses(playerId);
          syncPlayerStatuses(playerId, []);
          addLog(getDay(), getPhase(), `${playerName} 모든 상태 제거`);
        },
      });
    }

    statusOptions.push({ text: '닫기', style: 'cancel' });
    showModal(`${playerName} 상태`, statusOptions);
  };

  const handlePlayerPress = (
    playerId: string,
    playerName: string,
    isAlive: boolean,
  ) => {
    const chatOption: ActionModalOption = {
      text: `채팅${(chatUnreadCounts[playerId] ?? 0) > 0 ? ` (${chatUnreadCounts[playerId]})` : ''}`,
      onPress: () => {
        setChatInitialPlayerId(playerId);
        setChatModalVisible(true);
      },
    };

    const memoOption: ActionModalOption = {
      text: `메모${(playerMemos[playerId] ?? '').length > 0 ? ' ✏️' : ''}`,
      onPress: () => openMemoModal(playerId, playerName),
    };

    const kickOption: ActionModalOption = {
      text: '강퇴',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          `${playerName} 강퇴`,
          '이 플레이어를 게임에서 제거하시겠습니까?',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '강퇴',
              style: 'destructive',
              onPress: async () => {
                try {
                  await kickPlayer(playerId);
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
      },
    };

    const player = players?.find((p) => p.id === playerId);
    const isTraveller = player?.isTraveller === true;

    // 역할 미배정 여행자 → 역할 배정 모달로 직접 이동
    if (isTraveller && !player?.role) {
      handleTravellerAssign(playerId, playerName);
      return;
    }

    const exileOption: ActionModalOption = {
      text: '추방 (Exile)',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          `${playerName} 추방`,
          '여행자를 추방하시겠습니까?\n추방은 처형과 다르며 처형 효과가 발동하지 않습니다.',
          [
            { text: '취소', style: 'cancel' },
            {
              text: '추방',
              style: 'destructive',
              onPress: async () => {
                try {
                  await exileTraveller(playerId);
                  addLog(
                    getDay(),
                    getPhase(),
                    `🚪 ${playerName} 추방됨`,
                    'death',
                  );
                } catch (e) {
                  Alert.alert(
                    '오류',
                    e instanceof Error ? e.message : '추방 실패',
                  );
                }
              },
            },
          ],
        );
      },
    };

    const options: ActionModalOption[] = isAlive
      ? [
          ...(isTraveller
            ? []
            : [
                {
                  text: '역할 배정',
                  onPress: () =>
                    router.push({
                      pathname: '/game/assign-role',
                      params: { playerId },
                    }),
                },
              ]),
          {
            text: '상태 관리',
            onPress: () => handleStatusMenu(playerId, playerName),
          },
          chatOption,
          memoOption,
          ...(isTraveller
            ? [exileOption]
            : [
                {
                  text: '사망 처리',
                  style: 'destructive' as const,
                  onPress: () => kill(playerId),
                },
              ]),
          kickOption,
          { text: '취소', style: 'cancel' },
        ]
      : [
          ...(isTraveller
            ? []
            : [{ text: '부활', onPress: () => revive(playerId) }]),
          {
            text: '상태 관리',
            onPress: () => handleStatusMenu(playerId, playerName),
          },
          chatOption,
          memoOption,
          kickOption,
          { text: '취소', style: 'cancel' },
        ];

    showModal(playerName, options);
  };

  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const handleRestartGame = () => setShowRestartConfirm(true);
  const confirmRestartGame = useCallback(async () => {
    setShowRestartConfirm(false);
    useGameStore.getState().reset();
    useLogStore.getState().clearLogs();
    try {
      await restartGame();
      router.replace('/game/lobby');
    } catch {
      // 실패 시 무시
    }
  }, [restartGame, router]);

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const handleDisconnect = () => setShowDisconnectConfirm(true);
  const confirmDisconnect = useCallback(() => {
    setShowDisconnectConfirm(false);
    resetGame();
    useGameStore.getState().reset();
    useLogStore.getState().clearLogs();
    const { socket: s } = useConnectionStore.getState();
    if (s) s.disconnect();
    useConnectionStore.setState({
      socket: null,
      isConnected: false,
      serverUrl: null,
    });
    router.replace('/');
  }, [resetGame, router]);

  // ── 여행자 역할 배정 ──

  const handleTravellerAssign = (playerId: string, playerName: string) => {
    // 에디션에 맞는 여행자 역할 또는 전체 여행자
    const editionId =
      gameState?.players?.find((p) => p.role && !p.isTraveller)?.role
        ?.edition ?? 'trouble_brewing';
    const editionTravellers = getTravellersForEdition(editionId);
    const travellers =
      editionTravellers.length > 0 ? editionTravellers : ALL_TRAVELLER_ROLES;

    // 먼저 진영 선택
    showModal(`${playerName} - 여행자 진영`, [
      {
        text: '선한 여행자',
        onPress: () => {
          showModal(
            `${playerName} - 여행자 역할`,
            travellers
              .map((t) => ({
                text: `${t.name}`,
                onPress: async () => {
                  try {
                    await addTraveller(playerId, t.id, 'good');
                  } catch (e) {
                    Alert.alert(
                      '오류',
                      e instanceof Error ? e.message : '배정 실패',
                    );
                  }
                },
              }))
              .concat([{ text: '취소', onPress: async () => {} }]),
          );
        },
      },
      {
        text: '악한 여행자',
        onPress: () => {
          showModal(
            `${playerName} - 여행자 역할`,
            travellers
              .map((t) => ({
                text: `${t.name}`,
                onPress: async () => {
                  try {
                    await addTraveller(playerId, t.id, 'evil');
                  } catch (e) {
                    Alert.alert(
                      '오류',
                      e instanceof Error ? e.message : '배정 실패',
                    );
                  }
                },
              }))
              .concat([{ text: '취소', onPress: async () => {} }]),
          );
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const handleTravellerMenu = () => {
    const travellers = players?.filter((p) => p.isTraveller) ?? [];
    const unassigned = travellers.filter((p) => !p.role);
    const assigned = travellers.filter((p) => p.role && p.isAlive);

    const options: ActionModalOption[] = [];

    if (unassigned.length > 0) {
      options.push({
        text: `📋 역할 미배정 여행자 (${unassigned.length}명)`,
        onPress: () => {
          showModal(
            '여행자 역할 배정',
            unassigned
              .map((p) => ({
                text: p.name,
                onPress: () => handleTravellerAssign(p.id, p.name),
              }))
              .concat([{ text: '닫기', onPress: () => {} }]),
          );
        },
      });
    }

    if (assigned.length > 0) {
      assigned.forEach((p) => {
        options.push({
          text: `${p.name} (${p.role?.name ?? '?'}) - ${p.travellerAlignment === 'evil' ? '악' : '선'}`,
          onPress: () => handlePlayerPress(p.id, p.name, p.isAlive),
        });
      });
    }

    if (options.length === 0) {
      options.push({
        text: '참가한 여행자가 없습니다',
        onPress: () => {},
      });
    }

    options.push({ text: '닫기', style: 'cancel' });
    showModal('여행자 관리', options);
  };

  const handleMenu = () => {
    const hasTravellers = players?.some((p) => p.isTraveller) ?? false;
    showModal('메뉴', [
      {
        text: '게임 설정',
        onPress: () => setSettingsVisible(true),
      },
      ...(hasTravellers
        ? [
            {
              text: '여행자 관리',
              onPress: () => handleTravellerMenu(),
            },
          ]
        : []),
      {
        text: '게임 초기화',
        style: 'destructive' as const,
        onPress: () => handleRestartGame(),
      },
      {
        text: '서버 연결 해제',
        style: 'destructive' as const,
        onPress: () => handleDisconnect(),
      },
      { text: '닫기', style: 'cancel' },
    ]);
  };

  const handleSettingsChange = (partial: Partial<GameSettings>) => {
    setGameSettings(partial);
  };

  const [dictionaryVisible, setDictionaryVisible] = useState(false);

  // Chat state
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatInitialPlayerId, setChatInitialPlayerId] = useState<string | null>(
    null,
  );
  const chatUnreadCounts = useGameStore((s) => s.chatUnreadCounts);
  const totalChatUnread = useMemo(
    () => Object.values(chatUnreadCounts).reduce<number>((a, b) => a + b, 0),
    [chatUnreadCounts],
  );

  // Memo modal state (per-player)
  const [memoModalVisible, setMemoModalVisible] = useState(false);
  const [memoPlayerId, setMemoPlayerId] = useState<string | null>(null);
  const [memoPlayerName, setMemoPlayerName] = useState('');
  const [memoText, setMemoText] = useState('');

  // General memo state
  const generalMemo = useGameStore((s) => s.generalMemo);
  const setGeneralMemo = useGameStore((s) => s.setGeneralMemo);
  const [generalMemoVisible, setGeneralMemoVisible] = useState(false);
  const [generalMemoText, setGeneralMemoText] = useState('');

  const openMemoModal = useCallback(
    (playerId: string, playerName: string) => {
      setMemoPlayerId(playerId);
      setMemoPlayerName(playerName);
      setMemoText(playerMemos[playerId] ?? '');
      setMemoModalVisible(true);
    },
    [playerMemos],
  );

  const saveMemo = useCallback(() => {
    if (memoPlayerId) {
      setPlayerMemo(memoPlayerId, memoText);
    }
    setMemoModalVisible(false);
  }, [memoPlayerId, memoText, setPlayerMemo]);

  const openGeneralMemo = useCallback(() => {
    setGeneralMemoText(generalMemo);
    setGeneralMemoVisible(true);
  }, [generalMemo]);

  const saveGeneralMemo = useCallback(() => {
    setGeneralMemo(generalMemoText);
    setGeneralMemoVisible(false);
  }, [generalMemoText, setGeneralMemo]);

  const [showBluffs, setShowBluffs] = useState(true);
  const [nightOrderComplete, setNightOrderComplete] = useState(false);
  const [nightAdvanceRequestId, setNightAdvanceRequestId] = useState(0);
  const [desktopLogOpen, setDesktopLogOpen] = useState(false);
  const [deliveredFeedbackVisible, setDeliveredFeedbackVisible] =
    useState(false);

  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });

  const dynamicTokenSize = useMemo(() => {
    if (areaSize.width === 0 || areaSize.height === 0) return defaultTokenSize;
    const playerCount = gameState?.players.length ?? 1;
    const minDim = Math.min(areaSize.width, areaSize.height);
    // 원형 배치 시 토큰이 겹치지 않도록: 둘레 = 2πr, 토큰 간격 = 둘레/N
    const radius = minDim / 2 - 10;
    const circumference = 2 * Math.PI * radius;
    const fitSize = Math.floor(
      (circumference / Math.max(playerCount, 5)) * 0.85,
    );
    // 영역 높이가 작으면 추가로 축소
    const heightFit = Math.floor(minDim * 0.35);
    const base = Math.max(40, Math.min(defaultTokenSize, fitSize, heightFit));
    // 투표 페이즈에서는 시계 페이스가 보이도록 토큰 축소
    const isVotePhase =
      gameState?.phase === 'vote' || gameState?.daySubPhase === 'defense';
    return isVotePhase ? Math.round(base * 0.7) : base;
  }, [
    areaSize,
    defaultTokenSize,
    gameState?.players.length,
    gameState?.phase,
    gameState?.daySubPhase,
  ]);

  // 원형 위치 계산 (playerOrder 기준)
  const circularPositions = useMemo(() => {
    if (areaSize.width === 0 || areaSize.height === 0) return [];
    const total = playerOrder.length || gameState?.players.length || 0;
    if (total === 0) return [];
    const centerX = areaSize.width / 2;
    const centerY = areaSize.height / 2;
    // 투표 페이즈에서는 토큰을 시계 안쪽에 배치
    const isVotePhase =
      gameState?.phase === 'vote' || gameState?.daySubPhase === 'defense';
    const radiusOffset = isVotePhase
      ? dynamicTokenSize * 1.1
      : dynamicTokenSize * 0.6;
    const radius = Math.min(centerX, centerY) - radiusOffset;
    const positions: CircularPosition[] = [];
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
      positions.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        index: i,
      });
    }
    return positions;
  }, [
    areaSize,
    dynamicTokenSize,
    playerOrder.length,
    gameState?.players.length,
    gameState?.phase,
    gameState?.daySubPhase,
  ]);

  const getTokenPosition = useCallback(
    (playerId: string, index: number, _total: number) => {
      // playerOrder에서의 인덱스로 원형 위치 결정
      const orderIndex = playerOrder.indexOf(playerId);
      const effectiveIndex = orderIndex >= 0 ? orderIndex : index;

      if (circularPositions.length > effectiveIndex) {
        const pos = circularPositions[effectiveIndex];
        return { x: pos.x, y: pos.y };
      }

      // 폴백: 원형 배치
      const centerX = areaSize.width / 2;
      const centerY = areaSize.height / 2;
      const total = gameState?.players.length ?? 1;
      const radius = Math.min(centerX, centerY) - dynamicTokenSize * 0.6;
      const angle = (effectiveIndex / total) * 2 * Math.PI - Math.PI / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    },
    [
      playerOrder,
      circularPositions,
      areaSize,
      dynamicTokenSize,
      gameState?.players.length,
    ],
  );

  const handleSwap = useCallback(
    (fromIndex: number, toIndex: number) => {
      swapPlayerOrder(fromIndex, toIndex);
      const newOrder = [...playerOrder];
      if (
        fromIndex >= 0 &&
        fromIndex < newOrder.length &&
        toIndex >= 0 &&
        toIndex < newOrder.length
      ) {
        [newOrder[fromIndex], newOrder[toIndex]] = [
          newOrder[toIndex],
          newOrder[fromIndex],
        ];
      }
      syncPlayerOrder(newOrder);
    },
    [swapPlayerOrder, playerOrder, syncPlayerOrder],
  );

  const handlePositionChange = useCallback(
    (_playerId: string, _x: number, _y: number) => {
      // 원형 레이아웃에서는 스냅/스왑만 사용하므로 자유 이동 비활성화
    },
    [],
  );

  const empathHint = useMemo(() => {
    if (gameState?.phase !== 'night' || activeNightRoleId !== 'empath') {
      return { neighborIds: new Set<string>(), neighbors: [], evilCount: 0 };
    }
    return getEmpathHint(gameState.players, playerOrder);
  }, [gameState?.phase, gameState?.players, activeNightRoleId, playerOrder]);
  const empathNeighborIds = empathHint.neighborIds;
  const empathEvilCount = empathHint.evilCount;

  const chefHint = useMemo(() => {
    if (gameState?.phase !== 'night' || activeNightRoleId !== 'chef') {
      return {
        evilPairIds: new Set<string>(),
        evilPairCount: 0,
        evilPairNames: [],
      };
    }
    return getChefHint(gameState.players, playerOrder);
  }, [gameState?.phase, gameState?.players, activeNightRoleId, playerOrder]);
  const chefEvilPairIds = chefHint.evilPairIds;
  const chefEvilPairCount = chefHint.evilPairCount;
  const chefEvilPairNames = chefHint.evilPairNames;

  const currentNomination = gameState?.nominations?.length
    ? gameState.nominations[gameState.nominations.length - 1]
    : null;

  const hasActiveVote =
    (gameState?.phase === 'vote' || gameState?.daySubPhase === 'defense') &&
    !!currentNomination;

  const openQuickPlayerPicker = () => {
    if (!gameState) return;
    const orderedPlayers =
      playerOrder.length > 0
        ? playerOrder.flatMap((id) => {
            const player = gameState.players.find((p) => p.id === id);
            return player ? [player] : [];
          })
        : gameState.players;

    showModal(
      '플레이어 선택',
      orderedPlayers.map((player) => ({
        text: `${player.name}${player.role ? ` · ${player.role.name}` : ''}`,
        onPress: () =>
          handlePlayerPress(player.id, player.name, player.isAlive),
      })),
    );
  };

  const handleShortcutAction = (action: StorytellerShortcutAction) => {
    if (!gameState) return;

    if (typeof action !== 'string') {
      const playerId =
        playerOrder[action.index] ?? gameState.players[action.index]?.id;
      const player = gameState.players.find((p) => p.id === playerId);
      if (player) {
        handlePlayerPress(player.id, player.name, player.isAlive);
      }
      return;
    }

    switch (action) {
      case 'advanceNightRole': {
        const phaseAdvanceResult = getPhaseAdvanceShortcutResult({
          phase: gameState.phase,
          nightOrderComplete,
          daySubPhase: gameState.daySubPhase,
        });
        if (phaseAdvanceResult === 'confirmDayTransition') {
          showNightCompleteModal();
        } else if (phaseAdvanceResult === 'confirmNightTransition') {
          showDayCompleteModal();
        } else if (phaseAdvanceResult === 'advanceDaySubPhase') {
          const nextSubPhase = getNextDaySubPhase(gameState.daySubPhase);
          if (nextSubPhase) setDaySubPhase(nextSubPhase);
        } else if (phaseAdvanceResult === 'advanceNightRole') {
          setNightAdvanceRequestId((id) => id + 1);
        }
        break;
      }
      case 'openNomination':
        router.push('/game/nominate');
        break;
      case 'focusVote':
        router.push('/game/nominate');
        break;
      case 'toggleLog':
        setDesktopLogOpen((open) => !open);
        break;
      case 'openWhispers':
        router.push('/game/whispers');
        break;
      case 'focusPlayerSearch':
        openQuickPlayerPicker();
        break;
      case 'closeOverlay':
        setDesktopLogOpen(false);
        setDictionaryVisible(false);
        setSettingsVisible(false);
        setChatModalVisible(false);
        setMemoModalVisible(false);
        setGeneralMemoVisible(false);
        closeModal();
        break;
    }
  };

  useStorytellerKeyboardShortcuts({
    isDesktopConsole,
    enabled: !!gameState,
    onAction: handleShortcutAction,
  });

  // Compute vote indicators per player for token display
  const voteIndicators = useMemo(() => {
    if (!hasActiveVote || !currentNomination) return {};
    const indicators: Record<
      string,
      'guilty' | 'preselected_guilty' | 'nominee'
    > = {};
    const votes = currentNomination.votes;

    indicators[currentNomination.nomineeId] = 'nominee';

    (gameState?.players ?? [])
      .filter((p) => p.id !== currentNomination.nomineeId)
      .forEach((p) => {
        if (votes[p.id]) {
          indicators[p.id] = 'guilty';
        } else if (voteConfirmed[p.id]) {
          indicators[p.id] = 'guilty';
        } else if (votePreselections[p.id]) {
          indicators[p.id] = 'preselected_guilty';
        }
      });
    return indicators;
  }, [
    hasActiveVote,
    currentNomination,
    gameState?.players,
    votePreselections,
    voteConfirmed,
  ]);

  const executedPlayer = executedPlayerId
    ? (gameState?.players.find((p) => p.id === executedPlayerId) ?? null)
    : null;

  const skippedNightRoles = useMemo(() => {
    if (!executedPlayerId) return ['undertaker'];
    return [];
  }, [executedPlayerId]);

  // Memoize activeRoleIds and dormantRoleIds for NightOrderPanel
  const activeRoleIds = useMemo(() => {
    if (!players) return [];
    return players.flatMap((p) => {
      const ids: string[] = [];
      if (p.role?.id === 'drunk' && p.drunkAs) {
        ids.push(p.drunkAs);
      } else if (p.role?.id === 'philosopher' && p.philosopherGrantedRole) {
        ids.push(p.role.id, p.philosopherGrantedRole);
      } else if (p.role?.id) {
        ids.push(p.role.id);
      }
      return ids.filter(
        (id) =>
          p.isAlive ||
          NIGHT_ACTIONS[id]?.onlyWhenDead ||
          p.statuses.includes('vigormortis_retained'),
      );
    });
  }, [players]);

  // 철학자가 부여받은 역할이 현재 day의 night order에 없으면 extras로 추가
  const extraNightRoleIds = useMemo(() => {
    if (!players || !gameState) return [];
    const standardOrder = detectedEditionId
      ? getNightOrderForEdition(detectedEditionId, gameState.day)
      : [];
    const extras: string[] = [];
    for (const p of players) {
      if (
        p.isAlive &&
        p.role?.id === 'philosopher' &&
        p.philosopherGrantedRole &&
        !standardOrder.includes(p.philosopherGrantedRole) &&
        !extras.includes(p.philosopherGrantedRole)
      ) {
        extras.push(p.philosopherGrantedRole);
      }
    }
    return extras;
  }, [players, gameState, detectedEditionId]);

  const dormantRoleIds = useMemo(() => {
    if (!players) return [];
    return players
      .filter((p) => p.isAlive)
      .flatMap((p) => {
        const ids: string[] = [];
        if (p.role?.id && NIGHT_ACTIONS[p.role.id]?.onlyWhenDead)
          ids.push(p.role.id);
        if (
          p.role?.id === 'drunk' &&
          p.drunkAs &&
          NIGHT_ACTIONS[p.drunkAs]?.onlyWhenDead
        )
          ids.push(p.drunkAs);
        return ids;
      });
  }, [players]);

  if (!gameState) return null;

  const topBarElement = (
    <GrimoireTopBar
      day={gameState.day}
      phase={gameState.phase}
      daySubPhase={gameState.daySubPhase ?? undefined}
      onMenuPress={handleMenu}
      styles={styles}
    />
  );

  const daySubPhaseElement =
    gameState.phase === 'day' ? (
      <DaySubPhaseBar
        currentSubPhase={gameState.daySubPhase}
        onSetSubPhase={setDaySubPhase}
        whisperClock={whisperClock}
        discussionClock={discussionClock}
        nominationClock={nominationClock}
        nominationPaused={nominationPaused}
        defenseClock={defenseClock}
      />
    ) : null;

  const tokenCanvasElement = (
    <View
      style={[
        styles.tokenArea,
        gameState.phase === 'night' && styles.tokenAreaNight,
        gameState.phase === 'day' && styles.tokenAreaDay,
        gameState.phase === 'vote' && styles.tokenAreaVote,
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setAreaSize({ width, height });
      }}
    >
      {areaSize.width > 0 &&
        gameState.players.map((player, index) => {
          const orderIndex = playerOrder.indexOf(player.id);
          const effectiveIndex = orderIndex >= 0 ? orderIndex : index;
          const pos = getTokenPosition(
            player.id,
            index,
            gameState.players.length,
          );
          return (
            <DraggablePlayerToken
              key={player.id}
              player={player}
              statuses={playerStatuses[player.id]}
              highlighted={player.id === executedPlayerId}
              empathNeighbor={
                empathNeighborIds.has(player.id) ||
                chefEvilPairIds.has(player.id)
              }
              voteIndicator={voteIndicators[player.id]}
              isPreselected={votePreselections[player.id] === true}
              isExecutionCandidate={
                executionCandidateData?.playerId === player.id
              }
              hasNominated={nominatorPlayers.includes(player.id)}
              wasNominated={nominatedPlayers.includes(player.id)}
              memo={playerMemos[player.id]}
              bluffRoles={
                player.role?.team === 'demon' ? gameState.bluffRoles : undefined
              }
              showBluffs={showBluffs}
              onToggleBluffs={() => setShowBluffs((v) => !v)}
              tokenSize={dynamicTokenSize}
              initialX={pos.x}
              initialY={pos.y}
              circularPositions={circularPositions}
              positionIndex={effectiveIndex}
              onPress={() =>
                handlePlayerPress(player.id, player.name, player.isAlive)
              }
              onPositionChange={(x, y) => handlePositionChange(player.id, x, y)}
              onSwap={handleSwap}
              zIndex={hasActiveVote ? VOTE_CLOCK_LAYER.token : undefined}
            />
          );
        })}

      {hasActiveVote &&
        areaSize.width > 0 &&
        (() => {
          const nomination =
            gameState?.nominations[gameState.nominations.length - 1];
          if (!nomination) return null;
          const nomineeIndex = playerOrder.indexOf(nomination.nomineeId);
          if (nomineeIndex < 0) return null;
          const total = playerOrder.length || gameState?.players.length || 0;
          if (total === 0) return null;
          const cX = areaSize.width / 2;
          const cY = areaSize.height / 2;
          const r = Math.min(cX, cY) - dynamicTokenSize * 0.6;
          return (
            <>
              <VoteClockFace centerX={cX} centerY={cY} radius={r} />
              {voteClock && (
                <VoteClockHand
                  nomineeIndex={nomineeIndex}
                  totalPlayers={total}
                  centerX={cX}
                  centerY={cY}
                  radius={r}
                />
              )}
            </>
          );
        })()}

      {hasActiveVote && voteCountdown && !voteClock && (
        <VoteCountdownOverlay
          countdown={voteCountdown}
          centerX={areaSize.width / 2}
          centerY={areaSize.height / 2}
        />
      )}
      <PhaseTipToast
        visible={!!phaseTip}
        phase={gameState?.phase ?? 'night'}
        tip={phaseTip?.tip ?? ''}
        onDismiss={() => setPhaseTip(null)}
      />
    </View>
  );

  const nightPanelElement =
    gameState.phase === 'night' ? (
      <NightPanel
        day={gameState.day}
        players={gameState.players}
        nightActions={nightActions}
        playerStatuses={playerStatuses}
        activeNightRoleId={activeNightRoleId}
        activeRoleIds={activeRoleIds}
        dormantRoleIds={dormantRoleIds}
        skippedNightRoles={skippedNightRoles}
        executedPlayer={executedPlayer}
        empathNeighborIds={empathNeighborIds}
        empathEvilCount={empathEvilCount}
        chefEvilPairCount={chefEvilPairCount}
        chefEvilPairNames={chefEvilPairNames}
        playerOrder={playerOrder}
        onActivateRole={setActiveNightRole}
        onNightComplete={() => setNightOrderComplete(true)}
        onSendFeedback={sendNightFeedback}
        onKill={kill}
        onSetStatus={setPlayerStatus}
        onFangGuJump={fangGuConfirmJump}
        onSnakeCharmerSwap={snakeCharmerSwap}
        onVigormortisKillMinion={vigormortisKillMinion}
        onPitHagChangeRole={pitHagChangeRole}
        onBoneCollectorRestore={boneCollectorRestore}
        onApplyBaristaEffect={applyBaristaEffect}
        nightWakeUpTargets={nightWakeUpTargets}
        styles={styles}
        editionId={detectedEditionId}
        jugglerCorrectCount={jugglerCorrectCount}
        extraNightRoleIds={extraNightRoleIds}
        advanceRequestId={nightAdvanceRequestId}
      />
    ) : null;

  const votePanelsElement = (
    <>
      {hasActiveVote && currentNomination && (
        <VotePanel
          nomination={currentNomination}
          players={gameState.players}
          onCloseVote={closeVote}
          onCastVote={castVoteForPlayer}
          onProceedToVote={proceedToVote}
          voteResult={voteResult}
          onDismissResult={() => setVoteResult(null)}
        />
      )}
      {!hasActiveVote && voteResult && currentNomination && (
        <VotePanel
          nomination={currentNomination}
          players={gameState.players}
          onCloseVote={() => {}}
          voteResult={voteResult}
          onDismissResult={() => setVoteResult(null)}
        />
      )}
    </>
  );

  const executionStateElement =
    !hasActiveVote &&
    !voteResult &&
    gameState.phase !== 'night' &&
    gameState.phase !== 'ended' &&
    (executedPlayer ? (
      <View style={styles.executionConfirmedBar}>
        <Text style={styles.executionConfirmedLabel}>처형 확정</Text>
        <Text style={styles.executionConfirmedName}>{executedPlayer.name}</Text>
        <Text style={styles.executionConfirmedRole}>
          {executedPlayer.role?.name ?? '역할 미배정'}
        </Text>
      </View>
    ) : executionCandidateData ? (
      <View style={styles.executionCandidateBar}>
        <Text style={styles.executionCandidateLabel}>처형 예정</Text>
        <Text style={styles.executionCandidateName}>
          {executionCandidateData.playerName}
        </Text>
        <Text style={styles.executionCandidateVotes}>
          찬성 {executionCandidateData.guiltyVotes}표
        </Text>
      </View>
    ) : null);

  const gameEndBannerElement =
    gameState.phase === 'ended' && gameResult ? (
      <GameEndBanner
        gameResult={gameResult}
        fontSize={fontSize}
        styles={styles}
      />
    ) : null;

  const phaseBarElement = (
    <PhaseBar
      currentPhase={gameState.phase}
      onSetPhase={handleSetPhase}
      disableNext={gameState.phase === 'night' && !nightOrderComplete}
      variant={isDesktopConsole ? 'rail' : 'default'}
      onConfirmNext={() => {
        if (gameState.phase === 'night') {
          showNightCompleteModal();
        } else if (gameState.phase === 'day') {
          showDayCompleteModal();
        } else if (gameState.phase === 'ended') {
          showModal('새 게임을 시작하시겠습니까?', [
            {
              text: '새 게임 시작',
              onPress: async () => {
                useGameStore.getState().reset();
                useLogStore.getState().clearLogs();
                try {
                  await restartGame();
                  router.replace('/game/lobby');
                } catch {
                  Alert.alert('오류', '게임 재시작에 실패했습니다.');
                }
              },
            },
            { text: '취소', style: 'cancel' },
          ]);
        } else {
          handleSetPhase('night');
        }
      }}
    />
  );

  const hintBarsElement = (
    <>
      <EmpathHintBar
        players={gameState.players}
        empathNeighborIds={empathNeighborIds}
        empathEvilCount={empathEvilCount}
        fontSize={fontSize}
        styles={styles}
      />
      <ChefHintBar
        chefEvilPairIds={chefEvilPairIds}
        chefEvilPairCount={chefEvilPairCount}
        chefEvilPairNames={chefEvilPairNames}
        fontSize={fontSize}
        styles={styles}
      />
    </>
  );

  const settingsPanelElement = settingsVisible ? (
    <SettingsPanel
      settings={gameState.settings}
      onSettingsChange={handleSettingsChange}
      onClose={() => setSettingsVisible(false)}
      scale={scale}
      fontSize={fontSize}
      styles={styles}
    />
  ) : null;

  const bottomBarElement = (
    <GrimoireBottomBar
      phase={gameState.phase}
      daySubPhase={gameState.daySubPhase ?? undefined}
      activeWhispersCount={activeWhispers.length}
      slayerWaitingAck={slayerWaitingAck}
      totalChatUnread={totalChatUnread}
      hasMemo={generalMemo.length > 0}
      deliveredFeedbackCount={deliveredFeedbackHistory.length}
      onWhispersPress={() => router.push('/game/whispers')}
      onNominatePress={() => router.push('/game/nominate')}
      onSlayerForceAck={() => socket?.emit('slayer:forceAck')}
      onDictionaryPress={() => setDictionaryVisible(true)}
      onMemoPress={openGeneralMemo}
      onChatPress={() => {
        setChatInitialPlayerId(null);
        setChatModalVisible(true);
      }}
      onLogPress={() => {
        if (isDesktopConsole) {
          setDesktopLogOpen((open) => !open);
        } else {
          router.push('/game/log');
        }
      }}
      onDeliveredFeedbackPress={() => setDeliveredFeedbackVisible(true)}
      scale={scale}
    />
  );
  const shouldFocusVoteClock = isDesktopConsole && !!voteClock;

  return (
    <SafeAreaView style={styles.container}>
      {isDesktopConsole ? (
        <HostDesktopConsoleFrame
          day={gameState.day}
          phase={gameState.phase}
          playerCount={gameState.players.length}
          aliveCount={gameState.players.filter((p) => p.isAlive).length}
          activeWhispersCount={activeWhispers.length}
          unreadCount={totalChatUnread}
          topBar={topBarElement}
          grimoire={
            <>
              {daySubPhaseElement}
              {tokenCanvasElement}
              {nightPanelElement}
              {!shouldFocusVoteClock && votePanelsElement}
              {executionStateElement}
              {gameEndBannerElement}
            </>
          }
          rightPanel={null}
          phaseControls={phaseBarElement}
          hintBars={hintBarsElement}
          bottomBar={bottomBarElement}
          logOpen={desktopLogOpen}
          logs={logs}
          isVoteFocusMode={shouldFocusVoteClock}
        />
      ) : (
        <>
          {topBarElement}
          {daySubPhaseElement}
          {tokenCanvasElement}
          {nightPanelElement}
          {votePanelsElement}
          {executionStateElement}
          {gameEndBannerElement}
          {phaseBarElement}
          {hintBarsElement}
          {bottomBarElement}
        </>
      )}

      {settingsPanelElement}

      <DeliveredFeedbackHistoryModal
        visible={deliveredFeedbackVisible}
        history={deliveredFeedbackHistory}
        onClose={() => setDeliveredFeedbackVisible(false)}
      />

      <StorytellerChatModal
        visible={chatModalVisible}
        onClose={() => {
          setChatModalVisible(false);
          setChatInitialPlayerId(null);
        }}
        onSend={sendChatToPlayer}
        initialPlayerId={chatInitialPlayerId}
      />

      <ChatToast
        onPress={() => {
          setChatInitialPlayerId(null);
          setChatModalVisible(true);
        }}
      />
      {/* 추방 투표 진행 패널 */}
      {exileVote && (
        <View
          style={{
            position: 'absolute',
            bottom: 80,
            left: 16,
            right: 16,
            backgroundColor: '#1e1a2e',
            borderRadius: 6,
            borderWidth: 1,
            borderColor: '#3a2a4a',
            padding: 14,
            zIndex: 900,
          }}
        >
          <Text
            style={{
              color: '#b07cc6',
              fontSize: 14,
              fontWeight: '700',
              marginBottom: 4,
            }}
          >
            추방 투표: {exileVote.targetName} ({exileVote.targetRoleName})
          </Text>
          <Text style={{ color: '#908e8a', fontSize: 12, marginBottom: 8 }}>
            {exileVote.proposerName}의 제안 · 찬성 {exileVote.guiltyCount} /
            반대 {exileVote.innocentCount} / 전체 {exileVote.totalPlayers}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => forceCloseExile(true)}
              style={{
                flex: 1,
                backgroundColor: '#4a2020',
                borderRadius: 4,
                paddingVertical: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#6a3030',
              }}
            >
              <Text
                style={{ color: '#e06060', fontSize: 13, fontWeight: '600' }}
              >
                추방 확정
              </Text>
            </Pressable>
            <Pressable
              onPress={() => forceCloseExile(false)}
              style={{
                flex: 1,
                backgroundColor: '#1a2e1a',
                borderRadius: 4,
                paddingVertical: 8,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#2e4a2e',
              }}
            >
              <Text
                style={{ color: '#7dce82', fontSize: 13, fontWeight: '600' }}
              >
                추방 부결
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <EventToast />

      <ActionModal
        visible={modal.visible}
        title={modal.title}
        options={modal.options}
        onClose={closeModal}
      />

      <ConfirmModal
        visible={!!pendingApproval}
        title="여행자 참가 요청"
        message={`${pendingApproval?.playerName ?? ''}이(가) 입장했습니다.\n이 플레이어를 여행자로 설정할까요?`}
        confirmText="수락"
        cancelText="거절"
        onConfirm={handleApproveTraveller}
        onCancel={handleRejectTraveller}
      />

      <ConfirmModal
        visible={showRestartConfirm}
        title="게임 초기화"
        message="정말 게임을 초기화할까요?"
        confirmText="초기화"
        cancelText="취소"
        confirmStyle="destructive"
        onConfirm={confirmRestartGame}
        onCancel={() => setShowRestartConfirm(false)}
      />

      <ConfirmModal
        visible={showDisconnectConfirm}
        title="서버 연결 해제"
        message="서버와의 연결을 해제할까요?"
        confirmText="연결 해제"
        cancelText="취소"
        confirmStyle="destructive"
        onConfirm={confirmDisconnect}
        onCancel={() => setShowDisconnectConfirm(false)}
      />

      <DictionaryModal
        visible={dictionaryVisible}
        onClose={() => setDictionaryVisible(false)}
        groupRolesByTeam={false}
      />

      {/* 사랑꾼 사망 → 취하게 할 대상 선택 모달 */}
      <PlayerPickerModal
        visible={sweetheartDiedPending}
        title="사랑꾼 사망"
        description={`${sweetheartDiedName ?? '사랑꾼'}이(가) 사망했습니다. 취하게 할 플레이어를 선택하세요.`}
        themeColor="#b07f5c"
        candidates={sweetheartDrunkCandidates}
        onSelectPlayer={handleSweetheartDrunkSelect}
        onClose={clearSweetheartDied}
        scale={scale}
      />

      {/* 시장 밤 사망 → 대신 사망할 대상 선택 모달 */}
      <PlayerPickerModal
        visible={mayorNightDeathPending}
        title="시장 밤 사망"
        description={`${mayorNightDeathName ?? '시장'}이(가) 밤에 사망했습니다. 대신 사망할 플레이어를 선택하거나 닫기를 눌러 시장을 사망시키세요.`}
        themeColor="#a68a64"
        candidates={mayorRedirectCandidates}
        onSelectPlayer={handleMayorRedirectSelect}
        onClose={clearMayorNightDeath}
        scale={scale}
      />

      <ConfirmModal
        visible={!!witchCursePending}
        title="마녀 저주 발동"
        message={`${witchCursePending?.nominatorName ?? '저주 대상'}이(가) 지명했습니다. 마녀 저주로 즉시 사망 처리할까요?`}
        confirmText="사망 처리"
        cancelText="무시"
        confirmStyle="destructive"
        onConfirm={() => {
          if (!witchCursePending) return;
          confirmWitchCurseDeath(witchCursePending.nominatorId, true);
          setWitchCursePending(null);
        }}
        onCancel={() => {
          if (witchCursePending) {
            confirmWitchCurseDeath(witchCursePending.nominatorId, false);
          }
          setWitchCursePending(null);
        }}
      />

      <ConfirmModal
        visible={!!deviantExileJudgement}
        title="이단아 추방 판정"
        message={`${deviantExileJudgement?.targetName ?? '이단아'}의 추방 투표가 통과했습니다. 오늘 웃기지 않았다고 판단하여 추방할까요?`}
        confirmText="추방"
        cancelText="살림"
        confirmStyle="destructive"
        onConfirm={() => {
          forceCloseExile(true);
          setDeviantExileJudgement(null);
        }}
        onCancel={() => {
          forceCloseExile(false);
          setDeviantExileJudgement(null);
        }}
      />

      <TwoPlayerPickerModal
        visible={!!barberDiedPending}
        title="이발사 사망"
        description={`${barberDiedPending?.barberName ?? '이발사'}이(가) 사망했습니다. 교환할 두 플레이어를 선택하세요.`}
        themeColor="#4aa890"
        candidates={barberSwapCandidates}
        onConfirm={(playerId1, playerId2) => {
          barberSwapRoles(playerId1, playerId2);
          setBarberDiedPending(null);
        }}
        onClose={() => setBarberDiedPending(null)}
        scale={scale}
      />

      <PlayerPickerModal
        visible={!!klutzDiedPending}
        title="얼뜨기 사망"
        description={`${klutzDiedPending?.klutzName ?? '얼뜨기'}이(가) 사망했습니다. 살아있는 플레이어 1명을 선택하세요.`}
        themeColor="#c07040"
        candidates={klutzChoiceCandidates}
        onSelectPlayer={(playerId) => {
          if (!klutzDiedPending) return;
          klutzChoose(klutzDiedPending.klutzId, playerId);
          setKlutzDiedPending(null);
        }}
        onClose={() => setKlutzDiedPending(null)}
        scale={scale}
      />

      <PlayerPickerModal
        visible={!!activeEvilTwin && !evilTwinModalDismissed}
        title="사악한 쌍둥이"
        description={`${activeEvilTwin?.name ?? '사악한 쌍둥이'}의 선한 쌍둥이를 선택하세요.`}
        themeColor="#c07040"
        candidates={goodTwinCandidates}
        onSelectPlayer={(playerId) => {
          if (!activeEvilTwin) return;
          assignGoodTwin(activeEvilTwin.id, playerId);
          setEvilTwinModalDismissed(true);
        }}
        onClose={() => setEvilTwinModalDismissed(true)}
        scale={scale}
      />

      {/* 점쟁이 붉은 청어 (Red Herring) 선택 모달 */}
      <PlayerPickerModal
        visible={showRedHerringModal}
        title="점쟁이 붉은 청어 (Red Herring)"
        description="점쟁이에게 악마로 감지될 선한 플레이어를 선택하세요"
        themeColor="#9b59b6"
        candidates={redHerringCandidates}
        currentSelectedId={currentRedHerringId}
        autoLabel="랜덤 선택"
        onConfirmAuto={handleRedHerringConfirmAuto}
        onSelectPlayer={handleRedHerringSelectManual}
        onClose={() => {}}
        dismissable={false}
        scale={scale}
      />

      {/* 백치천재 능력 요청 → 참/거짓 정보 입력 모달 */}
      <SavantRequestModal
        visible={!!savantRequest}
        playerName={savantRequest?.playerName ?? ''}
        onSubmit={(trueInfo, falseInfo) => {
          if (!savantRequest) return;
          // 서버가 50% 확률로 swap하므로 여기서는 그대로 보냄 (info1=참, info2=거짓)
          sendNightFeedback(savantRequest.playerId, {
            type: 'savant_info',
            info1: trueInfo,
            info2: falseInfo,
          });
          setSavantRequest(null);
        }}
        onClose={() => setSavantRequest(null)}
      />

      {/* 화가 능력 요청 → 예/아니오 답변 모달 */}
      <ArtistRequestModal
        visible={!!artistRequest}
        playerName={artistRequest?.playerName ?? ''}
        onAnswer={(yes) => {
          if (!artistRequest) return;
          sendNightFeedback(artistRequest.playerId, {
            type: 'yes_no',
            value: yes,
          });
          setArtistRequest(null);
        }}
        onClose={() => setArtistRequest(null)}
      />

      {/* 희생양 교체 제안 모달 */}
      <ScapegoatOfferModal
        visible={!!scapegoatOffer}
        candidateName={scapegoatOffer?.candidateName ?? ''}
        scapegoatName={scapegoatOffer?.scapegoatName ?? ''}
        onAccept={() => {
          if (!scapegoatOffer) return;
          scapegoatSwap(scapegoatOffer.scapegoatId);
          setScapegoatOffer(null);
        }}
        onReject={() => setScapegoatOffer(null)}
      />

      {/* 메모 입력 모달 */}
      <Modal
        visible={memoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={saveMemo}
      >
        <Pressable style={styles.memoOverlay} onPress={saveMemo}>
          <Pressable
            style={styles.memoPanel}
            onPress={(e) => e.stopPropagation?.()}
          >
            <Text style={styles.memoTitle}>{memoPlayerName} 메모</Text>
            <TextInput
              style={styles.memoInput}
              value={memoText}
              onChangeText={setMemoText}
              placeholder="메모를 입력하세요..."
              placeholderTextColor="#746b60"
              multiline
              autoFocus
            />
            <View style={styles.memoButtons}>
              {memoText.length > 0 && (
                <Pressable
                  style={styles.memoClearButton}
                  onPress={() => {
                    setMemoText('');
                    if (memoPlayerId) {
                      setPlayerMemo(memoPlayerId, '');
                    }
                  }}
                >
                  <Text style={styles.memoClearText}>지우기</Text>
                </Pressable>
              )}
              <Pressable style={styles.memoSaveButton} onPress={saveMemo}>
                <Text style={styles.memoSaveText}>저장</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 공용 메모 모달 */}
      <Modal
        visible={generalMemoVisible}
        transparent
        animationType="fade"
        onRequestClose={saveGeneralMemo}
      >
        <Pressable style={styles.memoOverlay} onPress={saveGeneralMemo}>
          <Pressable
            style={styles.memoPanel}
            onPress={(e) => e.stopPropagation?.()}
          >
            <Text style={styles.memoTitle}>메모</Text>
            <TextInput
              style={styles.memoInput}
              value={generalMemoText}
              onChangeText={setGeneralMemoText}
              placeholder="메모를 입력하세요..."
              placeholderTextColor="#746b60"
              multiline
              autoFocus
            />
            <View style={styles.memoButtons}>
              {generalMemoText.length > 0 && (
                <Pressable
                  style={styles.memoClearButton}
                  onPress={() => {
                    setGeneralMemoText('');
                    setGeneralMemo('');
                  }}
                >
                  <Text style={styles.memoClearText}>지우기</Text>
                </Pressable>
              )}
              <Pressable
                style={styles.memoSaveButton}
                onPress={saveGeneralMemo}
              >
                <Text style={styles.memoSaveText}>저장</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 게임 시작 시 플레이어 직업 공개 대기 오버레이 */}
      {showRoleRevealWaiting && (
        <RoleRevealWaitingOverlay
          playerCount={gameState.players.length}
          onDismiss={() => setShowRoleRevealWaiting(false)}
        />
      )}
    </SafeAreaView>
  );
}
