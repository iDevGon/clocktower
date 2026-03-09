import {
  getRoleById,
  NIGHT_FEEDBACK,
  PLAYER_STATUS_LABELS,
  type PlayerStatus,
} from '@clocktower/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  ActionModal,
  type ActionModalOption,
} from '../../src/components/ActionModal';
import { DaySubPhaseBar } from '../../src/components/DaySubPhaseBar';
import { DraggablePlayerToken } from '../../src/components/DraggablePlayerToken';
import {
  NightActionLog,
  NightFeedbackPanel,
} from '../../src/components/NightActionLog';
import { NightOrderPanel } from '../../src/components/NightOrderPanel';
import { PhaseBar } from '../../src/components/PhaseBar';
import { VotePanel } from '../../src/components/VotePanel';
import { useGameActions } from '../../src/hooks/useGameActions';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useGameStore } from '../../src/stores/gameStore';
import { useLogStore } from '../../src/stores/logStore';
import { createGrimoireStyles } from '../../src/styles/grimoire.styles';

const ALL_STATUSES: PlayerStatus[] = [
  'poisoned',
  'drunk',
  'protected',
  'cursed',
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
  const nightActions = useGameStore((s) => s.nightActions);
  const activeWhispers = useGameStore((s) => s.activeWhispers);
  const activeNightRoleId = useGameStore((s) => s.activeNightRoleId);
  const playerStatuses = useGameStore((s) => s.playerStatuses);
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
    setActiveNightRole: rawSetActiveNightRole,
    sendNightFeedback,
    createGame,
    setPlayerStatuses: syncPlayerStatuses,
  } = useGameActions();

  // Execution highlight state
  const gameResult = useGameStore((s) => s.gameResult);
  const executedPlayerId = useGameStore((s) => s.lastExecutedPlayerId);
  const setExecutedPlayerId = useGameStore((s) => s.setLastExecutedPlayerId);

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
  const getPlayerName = (id: string) =>
    gameState?.players.find((p) => p.id === id)?.name ?? id;

  const kill = (playerId: string) => {
    rawKill(playerId);
    addLog(getDay(), getPhase(), `${getPlayerName(playerId)} 사망`);
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
    if (nom) {
      const nomineeName = getPlayerName(nom.nomineeId);
      const guiltyCount = Object.values(nom.votes).filter(Boolean).length;
      const totalVotes = Object.keys(nom.votes).length;
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
      addLog(getDay(), 'night', `${role?.name ?? roleId} 활성화`);
    }
  };

  const handleSetPhase = (phase: Parameters<typeof setPhase>[0]) => {
    if (phase === 'night') {
      useGameStore.getState().clearNightActions();
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

  // Night feedback overlay state
  const [feedbackCollapsed, setFeedbackCollapsed] = useState(false);
  const [feedbackSentForRole, setFeedbackSentForRole] = useState<string | null>(
    null,
  );
  const [nightElapsed, setNightElapsed] = useState(0);
  const nightTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track elapsed time per active night role
  useEffect(() => {
    if (nightTimerRef.current) clearInterval(nightTimerRef.current);
    setNightElapsed(0);
    if (activeNightRoleId) {
      nightTimerRef.current = setInterval(() => {
        setNightElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (nightTimerRef.current) clearInterval(nightTimerRef.current);
    };
  }, [activeNightRoleId]);

  // Auto-expand feedback and reset sent state when active role changes
  useEffect(() => {
    if (activeNightRoleId) {
      setFeedbackCollapsed(false);
      setFeedbackSentForRole(null);
    }
  }, [activeNightRoleId]);

  const isFeedbackSent = feedbackSentForRole === activeNightRoleId;

  // Check if current role has feedback to show
  const hasNightFeedback = useMemo(() => {
    if (!activeNightRoleId) return false;
    const fbDef = NIGHT_FEEDBACK[activeNightRoleId];
    if (!fbDef || fbDef.type === 'none' || fbDef.type === 'grimoire')
      return false;
    const target = gameState?.players.find(
      (p) =>
        p.role?.id === activeNightRoleId ||
        (p.role?.id === 'drunk' && p.drunkAs === activeNightRoleId),
    );
    return !!target;
  }, [activeNightRoleId, gameState?.players]);

  const [areaSize, setAreaSize] = useState({ width: 0, height: 0 });
  const tokenPositions = useGameStore((s) => s.tokenPositions);

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
    return Math.max(40, Math.min(defaultTokenSize, fitSize, heightFit));
  }, [areaSize, defaultTokenSize, gameState?.players.length]);

  const getTokenPosition = useCallback(
    (playerId: string, index: number, total: number) => {
      const saved = tokenPositions[playerId];
      if (saved) return saved;

      // Default: arrange in a circle
      const centerX = areaSize.width / 2;
      const centerY = areaSize.height / 2;
      const radius = Math.min(centerX, centerY) - dynamicTokenSize * 0.6;
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    },
    [tokenPositions, areaSize, dynamicTokenSize],
  );

  const handlePositionChange = useCallback(
    (playerId: string, x: number, y: number) => {
      useGameStore.getState().setTokenPosition(playerId, { x, y });
    },
    [],
  );

  const butlerMasterNames = useMemo(() => {
    if (!gameState?.butlerMasters) return {};
    const names: Record<string, string> = {};
    for (const [butlerId, masterId] of Object.entries(
      gameState.butlerMasters,
    )) {
      const master = gameState.players.find((p) => p.id === masterId);
      if (master) names[butlerId] = master.name;
    }
    return names;
  }, [gameState?.butlerMasters, gameState?.players]);

  const currentNomination = gameState?.nominations?.length
    ? gameState.nominations[gameState.nominations.length - 1]
    : null;

  const hasActiveVote = gameState?.phase === 'vote' && !!currentNomination;

  const executedPlayer = executedPlayerId
    ? (gameState?.players.find((p) => p.id === executedPlayerId) ?? null)
    : null;

  const skippedNightRoles = useMemo(() => {
    if (!executedPlayerId) return ['undertaker'];
    return [];
  }, [executedPlayerId]);

  if (!gameState) return null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.dayText}>{gameState.day}일차</Text>
        <View style={styles.topBarRight}>
          {gameState.phase === 'day' && gameState.daySubPhase === 'whisper' && (
            <Pressable
              onPress={() => router.push('/game/whispers')}
              style={styles.whisperButton}
            >
              <Text style={styles.whisperButtonText}>
                밀담{' '}
                {activeWhispers.length > 0 ? `(${activeWhispers.length})` : ''}
              </Text>
            </Pressable>
          )}
          {gameState.phase === 'day' &&
            gameState.daySubPhase === 'nomination' && (
              <Pressable
                onPress={() => router.push('/game/nominate')}
                style={styles.nominateButton}
              >
                <Text style={styles.nominateText}>지목 (수동)</Text>
              </Pressable>
            )}
          <Pressable
            onPress={() => router.push('/game/log')}
            style={styles.logButton}
          >
            <Text style={styles.logText}>로그</Text>
          </Pressable>
          <Pressable onPress={handleMenu} style={styles.menuButton}>
            <Text style={styles.menuText}>메뉴</Text>
          </Pressable>
        </View>
      </View>

      {gameState.phase === 'day' && (
        <DaySubPhaseBar
          currentSubPhase={gameState.daySubPhase}
          onSetSubPhase={setDaySubPhase}
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
                butlerMasterName={butlerMasterNames[player.id]}
                tokenSize={dynamicTokenSize}
                initialX={pos.x}
                initialY={pos.y}
                onPress={() =>
                  handlePlayerPress(player.id, player.name, player.isAlive)
                }
                onPositionChange={(x, y) =>
                  handlePositionChange(player.id, x, y)
                }
              />
            );
          })}
      </View>

      {gameState.phase === 'night' && nightActions.length > 0 && (
        <NightActionLog
          actions={nightActions}
          players={gameState.players}
          playerStatuses={playerStatuses}
          onSendFeedback={sendNightFeedback}
          onKill={kill}
          onSetStatus={setPlayerStatus}
        />
      )}
      {gameState.phase === 'night' && (
        <View>
          {/* Floating timer - always visible above overlay */}
          {hasNightFeedback &&
            activeNightRoleId &&
            (() => {
              const role = getRoleById(activeNightRoleId);
              const m = Math.floor(nightElapsed / 60);
              const sec = nightElapsed % 60;
              return (
                <View style={styles.nightFloatingTimer}>
                  <Text style={styles.nightFloatingTimerRole}>
                    {role?.name ?? activeNightRoleId}
                  </Text>
                  <Text style={styles.nightFloatingTimerTime}>
                    {m}:{sec.toString().padStart(2, '0')}
                  </Text>
                  {isFeedbackSent ? (
                    <View style={styles.nightFeedbackSentBadge}>
                      <Text style={styles.nightFeedbackSentText}>
                        피드백 전송됨
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setFeedbackCollapsed((prev) => !prev)}
                      style={styles.nightFeedbackToggle}
                    >
                      <Text style={styles.nightFeedbackToggleText}>
                        {feedbackCollapsed ? '피드백 ▲' : '피드백 ▼'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })()}

          {/* NightOrderPanel + NightFeedbackPanel overlay container */}
          <View style={{ position: 'relative' }}>
            <NightOrderPanel
              day={gameState.day}
              activeRoleIds={gameState.players.flatMap((p) => {
                if (p.role?.id === 'drunk' && p.drunkAs) return [p.drunkAs];
                return p.role?.id ? [p.role.id] : [];
              })}
              skippedRoleIds={skippedNightRoles}
              activeNightRoleId={activeNightRoleId}
              onActivateRole={setActiveNightRole}
              onNightComplete={() => {
                showModal('밤이 끝났습니다', [
                  {
                    text: '낮으로 전환',
                    onPress: () => handleSetPhase('day'),
                  },
                  { text: '계속 진행', style: 'cancel' },
                ]);
              }}
            />

            {/* Feedback overlay - covers NightOrderPanel */}
            {hasNightFeedback && !feedbackCollapsed && !isFeedbackSent && (
              <View style={styles.nightFeedbackOverlay}>
                <NightFeedbackPanel
                  activeRoleId={activeNightRoleId}
                  players={gameState.players}
                  nightActions={nightActions}
                  onSendFeedback={(playerId, fb) => {
                    sendNightFeedback(playerId, fb);
                    setFeedbackSentForRole(activeNightRoleId);
                    setFeedbackCollapsed(true);
                  }}
                />
              </View>
            )}
          </View>
        </View>
      )}
      {hasActiveVote && currentNomination && (
        <VotePanel
          nomination={currentNomination}
          players={gameState.players}
          onCloseVote={closeVote}
          onCastVote={castVoteForPlayer}
        />
      )}
      {executedPlayer && (
        <View style={styles.executionBanner}>
          <View style={styles.executionBannerContent}>
            <Text style={styles.executionBannerLabel}>오늘 처형</Text>
            <Text style={styles.executionBannerRole}>
              {executedPlayer.role?.name ?? '역할 미배정'}
            </Text>
            <Text style={styles.executionBannerName}>
              {executedPlayer.name}
            </Text>
          </View>
          <Pressable
            onPress={() => setExecutedPlayerId(null)}
            style={styles.executionBannerDismiss}
          >
            <Text style={styles.executionBannerDismissText}>닫기</Text>
          </Pressable>
        </View>
      )}
      {gameState.phase === 'ended' && gameResult && (
        <View
          style={{
            backgroundColor:
              gameResult.winningTeam === 'good' ? '#1a3a5c' : '#4a1a1a',
            paddingVertical: 12,
            paddingHorizontal: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: gameResult.winningTeam === 'good' ? '#5dade2' : '#e74c3c',
              fontSize: fontSize.lg,
              fontWeight: '700',
            }}
          >
            {gameResult.winningTeam === 'good'
              ? '선한 팀 승리!'
              : '악한 팀 승리!'}
          </Text>
          <Text
            style={{
              color: '#aaa',
              fontSize: fontSize.sm,
              marginTop: 4,
            }}
          >
            {gameResult.reason}
          </Text>
        </View>
      )}
      <PhaseBar
        currentPhase={gameState.phase}
        onSetPhase={handleSetPhase}
        onConfirmNext={() => {
          if (gameState.phase === 'day') {
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
                  } catch {}
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

      <ActionModal
        visible={modal.visible}
        title={modal.title}
        options={modal.options}
        onClose={closeModal}
      />
    </View>
  );
}
