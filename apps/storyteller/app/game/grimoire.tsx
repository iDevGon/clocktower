import {
  type GameSettings,
  getRandomTipText,
  getRoleById,
  NIGHT_ACTIONS,
  PLAYER_STATUS_LABELS,
  type Player,
  type PlayerStatus,
  type TipCategory,
} from '@clocktower/shared';
import { DictionaryModal } from '@clocktower/ui';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
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
import { ChatToast } from '../../src/components/ChatToast';
import { DaySubPhaseBar } from '../../src/components/DaySubPhaseBar';
import {
  type CircularPosition,
  DraggablePlayerToken,
} from '../../src/components/DraggablePlayerToken';
import { EventToast } from '../../src/components/EventToast';
import {
  ExecutionBanner,
  GameEndBanner,
} from '../../src/components/GameResultBanners';
import { GrimoireTopBar } from '../../src/components/GrimoireTopBar';
import { NightPanel } from '../../src/components/NightPanel';
import { PhaseBar } from '../../src/components/PhaseBar';
import { PhaseTipToast } from '../../src/components/PhaseTipToast';
import { PlayerPickerModal } from '../../src/components/PlayerPickerModal';
import { ChefHintBar, EmpathHintBar } from '../../src/components/RoleHintBars';
import { RoleRevealWaitingOverlay } from '../../src/components/RoleRevealWaitingOverlay';
import { SettingsPanel } from '../../src/components/SettingsPanel';
import { StorytellerChatModal } from '../../src/components/StorytellerChatModal';
import { VoteClockFace } from '../../src/components/VoteClockFace';
import { VoteClockHand } from '../../src/components/VoteClockHand';
import { VotePanel } from '../../src/components/VotePanel';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
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
  const { fontSize } = useResponsive();
  const scale = fontSize.md / 12;
  const styles = useMemo(() => createGrimoireStyles(scale), [scale]);

  const router = useRouter();
  const gameState = useGameStore((s) => s.gameState);
  const players = gameState?.players;
  const nightActions = useGameStore((s) => s.nightActions);
  const activeWhispers = useGameStore((s) => s.activeWhispers);
  const activeNightRoleId = useGameStore((s) => s.activeNightRoleId);
  const playerStatuses = useGameStore((s) => s.playerStatuses);
  const whisperClock = useGameStore((s) => s.whisperClock);
  const slayerWaitingAck = useGameStore((s) => s.slayerWaitingAck);
  const roleRevealShown = useGameStore((s) => s.roleRevealShown);
  const setRoleRevealShown = useGameStore((s) => s.setRoleRevealShown);
  const socket = useConnectionStore((s) => s.socket);
  const addLog = useLogStore((s) => s.addLog);
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
    createGame,
    setPlayerStatuses: syncPlayerStatuses,
    setGameSettings,
    setPlayerOrder: syncPlayerOrder,
    sendChatToPlayer,
    sweetheartDrunk,
    mayorRedirect,
    assignRedHerring,
  } = useGameActions();

  const sweetheartDiedPending = useGameStore((s) => s.sweetheartDiedPending);
  const sweetheartDiedName = useGameStore((s) => s.sweetheartDiedName);
  const clearSweetheartDied = useGameStore((s) => s.clearSweetheartDied);
  const mayorNightDeathPending = useGameStore((s) => s.mayorNightDeathPending);
  const mayorNightDeathId = useGameStore((s) => s.mayorNightDeathId);
  const mayorNightDeathName = useGameStore((s) => s.mayorNightDeathName);
  const clearMayorNightDeath = useGameStore((s) => s.clearMayorNightDeath);

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

  // Red Herring 선택 모달 상태 (게임 시작 시 점쟁이가 있으면 표시)
  const hasFortuneTeller = useMemo(
    () => players?.some((p) => p.role?.id === 'fortune_teller') ?? false,
    [players],
  );
  const [showRedHerringModal, setShowRedHerringModal] = useState(false);
  const redHerringShownRef = useRef(false);

  useEffect(() => {
    if (hasFortuneTeller && !redHerringShownRef.current) {
      redHerringShownRef.current = true;
      setShowRedHerringModal(true);
    }
  }, [hasFortuneTeller]);

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
    setShowRedHerringModal(false);
  }, []);

  const handleRedHerringSelectManual = useCallback(
    (playerId: string) => {
      assignRedHerring(playerId);
      setShowRedHerringModal(false);
    },
    [assignRedHerring],
  );

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

  // Modal state
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    options: ActionModalOption[];
  }>({ visible: false, title: '', options: [] });

  const showModal = (title: string, options: ActionModalOption[]) =>
    setModal({ visible: true, title, options });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));

  const getDay = () => useGameStore.getState().gameState?.day ?? 0;
  const getPhase = () => useGameStore.getState().gameState?.phase ?? 'setup';
  const playerNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of players ?? []) map.set(p.id, p.name);
    return map;
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
      setExecutionBannerDismissed(false);
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

    const options: ActionModalOption[] = isAlive
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
            text: '상태 관리',
            onPress: () => handleStatusMenu(playerId, playerName),
          },
          chatOption,
          {
            text: '사망 처리',
            style: 'destructive',
            onPress: () => kill(playerId),
          },
          { text: '취소', style: 'cancel' },
        ]
      : [
          { text: '부활', onPress: () => revive(playerId) },
          {
            text: '상태 관리',
            onPress: () => handleStatusMenu(playerId, playerName),
          },
          chatOption,
          { text: '취소', style: 'cancel' },
        ];

    showModal(playerName, options);
  };

  const handleResetGame = () => {
    showModal('게임 초기화', [
      {
        text: '새 게임 시작',
        style: 'destructive',
        onPress: async () => {
          resetGame();
          useGameStore.getState().reset();
          useLogStore.getState().clearLogs();
          try {
            await createGame();
            router.replace('/game/lobby');
          } catch {
            router.replace('/');
          }
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const handleDisconnect = () => {
    showModal('서버 연결 해제', [
      {
        text: '연결 해제',
        style: 'destructive',
        onPress: () => {
          resetGame();
          useGameStore.getState().reset();
          useLogStore.getState().clearLogs();
          const { socket } = useConnectionStore.getState();
          if (socket) socket.disconnect();
          useConnectionStore.setState({
            socket: null,
            isConnected: false,
            serverUrl: null,
          });
          router.replace('/');
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  };

  const handleMenu = () => {
    showModal('메뉴', [
      {
        text: '게임 로그',
        onPress: () => router.push('/game/log'),
      },
      {
        text: '게임 설정',
        onPress: () => setSettingsVisible(true),
      },
      {
        text: '토큰 위치 초기화',
        onPress: () => {
          useGameStore.getState().clearTokenPositions();
          addLog(getDay(), getPhase(), '토큰 위치 초기화');
        },
      },
      {
        text: '게임 초기화',
        style: 'destructive',
        onPress: () => handleResetGame(),
      },
      {
        text: '서버 연결 해제',
        style: 'destructive',
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

  const [nightOrderComplete, setNightOrderComplete] = useState(false);
  const [executionBannerDismissed, setExecutionBannerDismissed] =
    useState(false);

  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });

  const { tokenSize: defaultTokenSize } = useResponsive();
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

  // 초공감자(Empath) 이웃 하이라이트
  // Build a player lookup map for O(1) access in neighbor/pair calculations
  const playerById = useMemo(() => {
    const map = new Map<string, Player>();
    for (const p of players ?? []) map.set(p.id, p);
    return map;
  }, [players]);

  const empathNeighborIds = useMemo(() => {
    if (gameState?.phase !== 'night' || activeNightRoleId !== 'empath')
      return new Set<string>();
    const empathPlayer = gameState.players.find(
      (p) =>
        p.role?.id === 'empath' ||
        (p.role?.id === 'drunk' && p.drunkAs === 'empath'),
    );
    if (!empathPlayer) return new Set<string>();
    // 주정뱅이면 하이라이트 비활성화
    if (empathPlayer.role?.id === 'drunk') return new Set<string>();

    const order = playerOrder;
    const empathIndex = order.indexOf(empathPlayer.id);
    if (empathIndex === -1) return new Set<string>();

    const neighbors = new Set<string>();

    // 시계방향 탐색
    for (let i = 1; i < order.length; i++) {
      const idx = (empathIndex + i) % order.length;
      const p = playerById.get(order[idx]);
      if (p?.isAlive) {
        neighbors.add(p.id);
        break;
      }
    }

    // 반시계방향 탐색
    for (let i = 1; i < order.length; i++) {
      const idx = (empathIndex - i + order.length) % order.length;
      const p = playerById.get(order[idx]);
      if (p?.isAlive) {
        if (neighbors.has(p.id)) break; // 같은 플레이어 (2명만 생존)
        neighbors.add(p.id);
        break;
      }
    }

    return neighbors;
  }, [
    gameState?.phase,
    gameState?.players,
    activeNightRoleId,
    playerOrder,
    playerById,
  ]);

  // 초공감자 악한 이웃 수 계산
  const empathEvilCount = useMemo(() => {
    if (empathNeighborIds.size === 0) return 0;
    return (
      gameState?.players.filter(
        (p) =>
          empathNeighborIds.has(p.id) &&
          (p.role?.team === 'minion' || p.role?.team === 'demon'),
      ).length ?? 0
    );
  }, [empathNeighborIds, gameState?.players]);

  // 요리사(Chef) 인접 악한 쌍 계산
  const { chefEvilPairIds, chefEvilPairCount } = useMemo(() => {
    if (gameState?.phase !== 'night' || activeNightRoleId !== 'chef')
      return { chefEvilPairIds: new Set<string>(), chefEvilPairCount: 0 };
    // 주정뱅이면 하이라이트 비활성화
    const chefPlayer = gameState.players.find(
      (p) =>
        p.role?.id === 'chef' ||
        (p.role?.id === 'drunk' && p.drunkAs === 'chef'),
    );
    if (chefPlayer?.role?.id === 'drunk')
      return { chefEvilPairIds: new Set<string>(), chefEvilPairCount: 0 };
    const order = playerOrder;
    if (order.length < 2)
      return { chefEvilPairIds: new Set<string>(), chefEvilPairCount: 0 };

    const isEvil = (id: string) => {
      const p = playerById.get(id);
      return p?.role?.team === 'minion' || p?.role?.team === 'demon';
    };

    const pairIds = new Set<string>();
    let count = 0;
    for (let i = 0; i < order.length; i++) {
      const curr = order[i];
      const next = order[(i + 1) % order.length];
      if (isEvil(curr) && isEvil(next)) {
        pairIds.add(curr);
        pairIds.add(next);
        count++;
      }
    }
    return { chefEvilPairIds: pairIds, chefEvilPairCount: count };
  }, [
    gameState?.phase,
    gameState?.players,
    activeNightRoleId,
    playerOrder,
    playerById,
  ]);

  const currentNomination = gameState?.nominations?.length
    ? gameState.nominations[gameState.nominations.length - 1]
    : null;

  const hasActiveVote =
    (gameState?.phase === 'vote' || gameState?.daySubPhase === 'defense') &&
    !!currentNomination;

  // Compute vote indicators per player for token display
  const voteIndicators = useMemo(() => {
    if (!hasActiveVote || !currentNomination) return {};
    const indicators: Record<
      string,
      'guilty' | 'preselected_guilty' | 'nominee'
    > = {};
    const votes = currentNomination.votes;

    indicators[currentNomination.nomineeId] = 'nominee';

    for (const p of gameState?.players ?? []) {
      if (p.id === currentNomination.nomineeId) continue;
      if (votes[p.id]) {
        indicators[p.id] = 'guilty';
      } else if (voteConfirmed[p.id]) {
        indicators[p.id] = 'guilty';
      } else if (votePreselections[p.id]) {
        indicators[p.id] = 'preselected_guilty';
      }
    }
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
    return players
      .filter((p) => p.isAlive)
      .flatMap((p) => {
        if (p.role?.id === 'drunk' && p.drunkAs) return [p.drunkAs];
        return p.role?.id ? [p.role.id] : [];
      });
  }, [players]);

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

  return (
    <SafeAreaView style={styles.container}>
      <GrimoireTopBar
        day={gameState.day}
        phase={gameState.phase}
        daySubPhase={gameState.daySubPhase}
        activeWhispersCount={activeWhispers.length}
        slayerWaitingAck={slayerWaitingAck}
        totalChatUnread={totalChatUnread}
        onWhispersPress={() => router.push('/game/whispers')}
        onNominatePress={() => router.push('/game/nominate')}
        onSlayerForceAck={() => socket?.emit('slayer:forceAck')}
        onDictionaryPress={() => setDictionaryVisible(true)}
        onChatPress={() => {
          setChatInitialPlayerId(null);
          setChatModalVisible(true);
        }}
        onLogPress={() => router.push('/game/log')}
        onMenuPress={handleMenu}
        styles={styles}
      />

      {gameState.phase === 'day' && gameState.daySubPhase !== 'defense' && (
        <DaySubPhaseBar
          currentSubPhase={gameState.daySubPhase}
          onSetSubPhase={setDaySubPhase}
          whisperClock={whisperClock}
        />
      )}

      <View
        style={styles.tokenArea}
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
                tokenSize={dynamicTokenSize}
                initialX={pos.x}
                initialY={pos.y}
                circularPositions={circularPositions}
                positionIndex={effectiveIndex}
                onPress={() =>
                  handlePlayerPress(player.id, player.name, player.isAlive)
                }
                onPositionChange={(x, y) =>
                  handlePositionChange(player.id, x, y)
                }
                onSwap={handleSwap}
              />
            );
          })}

        {/* Vote clock face + hand overlay */}
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

        {/* Vote countdown overlay */}
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

      {gameState.phase === 'night' && (
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
          playerOrder={playerOrder}
          onActivateRole={setActiveNightRole}
          onNightComplete={() => setNightOrderComplete(true)}
          onSendFeedback={sendNightFeedback}
          onKill={kill}
          onSetStatus={setPlayerStatus}
          styles={styles}
        />
      )}
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
      {executedPlayer && !executionBannerDismissed && (
        <ExecutionBanner
          executedPlayer={executedPlayer}
          onDismiss={() => setExecutionBannerDismissed(true)}
          styles={styles}
        />
      )}
      {gameState.phase === 'ended' && gameResult && (
        <GameEndBanner
          gameResult={gameResult}
          fontSize={fontSize}
          styles={styles}
        />
      )}
      <PhaseBar
        currentPhase={gameState.phase}
        onSetPhase={handleSetPhase}
        disableNext={gameState.phase === 'night' && !nightOrderComplete}
        onConfirmNext={() => {
          if (gameState.phase === 'night') {
            showModal('밤이 끝났습니다', [
              {
                text: '낮으로 전환',
                onPress: () => handleSetPhase('day'),
              },
              { text: '계속 진행', style: 'cancel' },
            ]);
          } else if (gameState.phase === 'day') {
            showModal('다음 날 밤으로 진행', [
              {
                text: '밤으로 전환',
                onPress: () => handleSetPhase('night'),
              },
              { text: '취소', style: 'cancel' },
            ]);
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
            // vote 등에서는 바로 밤으로
            handleSetPhase('night');
          }
        }}
      />

      {/* 초공감자 이웃 정보 힌트 */}
      <EmpathHintBar
        players={gameState.players}
        empathNeighborIds={empathNeighborIds}
        empathEvilCount={empathEvilCount}
        fontSize={fontSize}
        styles={styles}
      />

      {/* 요리사 인접 악한 쌍 힌트 */}
      <ChefHintBar
        players={gameState.players}
        playerOrder={playerOrder}
        chefEvilPairIds={chefEvilPairIds}
        chefEvilPairCount={chefEvilPairCount}
        fontSize={fontSize}
        styles={styles}
      />

      {/* 게임 설정 패널 */}
      {settingsVisible && (
        <SettingsPanel
          settings={gameState.settings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setSettingsVisible(false)}
          scale={scale}
          fontSize={fontSize}
          styles={styles}
        />
      )}

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
      <EventToast />

      <ActionModal
        visible={modal.visible}
        title={modal.title}
        options={modal.options}
        onClose={closeModal}
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
        themeColor="#e67e22"
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
        themeColor="#c4a050"
        candidates={mayorRedirectCandidates}
        onSelectPlayer={handleMayorRedirectSelect}
        onClose={clearMayorNightDeath}
        scale={scale}
      />

      {/* 점쟁이 저주 대상 (Red Herring) 선택 모달 */}
      <PlayerPickerModal
        visible={showRedHerringModal}
        title="점쟁이 저주 대상 (Red Herring)"
        description="점쟁이에게 악마로 감지될 선한 플레이어를 선택하세요"
        themeColor="#9b59b6"
        candidates={redHerringCandidates}
        currentSelectedId={currentRedHerringId}
        autoLabel="자동 (랜덤)"
        onConfirmAuto={handleRedHerringConfirmAuto}
        onSelectPlayer={handleRedHerringSelectManual}
        onClose={handleRedHerringConfirmAuto}
        scale={scale}
      />

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
