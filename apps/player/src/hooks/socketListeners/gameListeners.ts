import { getRoleById, NIGHT_ACTIONS } from '@clocktower/shared';
import { AppState } from 'react-native';
import { useChatStore } from '../../stores/chatStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useWhisperStore } from '../../stores/whisperStore';
import type { AppSocket } from './types';

function handleRejoin(socket: AppSocket) {
  const { playerId } = usePlayerStore.getState();
  if (!playerId) return;
  if (!socket.connected) return;

  socket.emit('game:rejoin', { playerId }, (res) => {
    if (!res.success) {
      const { playerName } = usePlayerStore.getState();
      usePlayerStore.getState().reset();
      usePlayerStore.getState().set({ playerName });
      useWhisperStore.getState().reset();
      useChatStore.getState().reset();
      return;
    }
    usePlayerStore.getState().set({
      role: res.roleId ? (getRoleById(res.roleId) ?? null) : null,
      drunkAs: res.drunkAs ?? null,
      currentPhase: res.phase ?? 'setup',
      isAlive: res.isAlive ?? true,
      daySubPhase: res.daySubPhase ?? null,
      hasNominatedToday: res.hasNominatedToday ?? false,
      deadVoteUsed: res.deadVoteUsed ?? false,
      nightProgress: res.nightProgress ?? null,
      nightCount: res.nightCount ?? usePlayerStore.getState().nightCount,
      gamePlayers: res.gamePlayers ?? usePlayerStore.getState().gamePlayers,
      evilInfo: res.evilInfo ?? null,
      nomination: res.nomination ?? null,
      executionCandidate: res.executionCandidate ?? null,
    });
  });
}

export function attachGameListeners(socket: AppSocket) {
  // 소켓 재연결 시 상태 동기화
  socket.on('connect', () => {
    handleRejoin(socket);
  });

  // 앱 백그라운드 복귀 시 상태 동기화
  let appState = AppState.currentState;
  const appStateSubscription = AppState.addEventListener(
    'change',
    (nextState) => {
      if (appState.match(/inactive|background/) && nextState === 'active') {
        handleRejoin(socket);
      }
      appState = nextState;
    },
  );
  // 소켓 해제 시 AppState 리스너도 제거
  socket.on('disconnect', () => {
    appStateSubscription.remove();
  });

  socket.on('game:end', (result) => {
    usePlayerStore.getState().set({
      gameResult: result,
      currentPhase: 'ended',
      nomination: null,
    });
  });

  socket.on('game:phase', (phase) => {
    const prev = usePlayerStore.getState();
    if (phase === 'setup') {
      useChatStore.getState().reset();
      useWhisperStore.getState().reset();
    }
    usePlayerStore.getState().set({
      currentPhase: phase,
      ...(phase !== 'vote' ? { nomination: null } : {}),
      nightProgress: null,
      nightFeedback: null,
      nightWakeUp: null,
      ...(phase === 'night'
        ? {
            hasNominatedToday: false,
            executionHappenedToday: false,
            nightCount: prev.nightCount + 1,
            nominatedTodayIds: [],
            voteResult: null,
            executionCandidate: null,
            discussionClock: null,
            nominationClock: null,
            nominationPaused: false,
            nominationRemainingMs: null,
            defenseClock: null,
            // 총잡이 하루 1회 리셋 + 첫 투표자 기록 리셋
            gunslingerUsedToday: false,
            todayFirstVoteGuiltyVoters: null,
            harlotConsentRequest: null,
          }
        : {}),
      // 새 게임 시작 (setup): 역할/상태 초기화, 피드백 히스토리 리셋
      ...(phase === 'setup'
        ? {
            role: null,
            evilInfo: null,
            drunkAs: null,
            isAlive: true,
            hasNominatedToday: false,
            deadVoteUsed: false,
            nightActionSubmitted: false,
            nightCount: 0,
            feedbackHistory: [],
            gameResult: null,
            justDied: false,
            deathReason: null,
            executionAnnouncement: null,
            nightDeathAnnouncement: null,
            executionHappenedToday: false,
            slayerUsed: false,
            savantUsedToday: false,
            artistUsed: false,
            philosopherGrantedRole: null,
            jugglerUsed: false,
            jugglerAnnouncement: null,
            gunslingerUsedToday: false,
            todayFirstVoteGuiltyVoters: null,
            gunslingerFiredOverlay: null,
            scapegoatSwappedOverlay: null,
            harlotConsentRequest: null,
            beggarTokens: 0,
            beggarAlignmentInfos: [],
            voteResult: null,
            voteHistory: [],
            seatingRoleNotes: {},
            executionCandidate: null,
            nominatedTodayIds: [],
          }
        : {}),
      // 백치천재 능력은 매일 1회 → 새로운 낮 시작 시 리셋
      ...(phase === 'day' ? { savantUsedToday: false } : {}),
    });
  });

  socket.on('game:state', (state) => {
    const toInfo = (p: (typeof state.players)[number]) => ({
      id: p.id,
      name: p.name,
      isAlive: p.isAlive,
      isTraveller: p.isTraveller,
      // 여행자 역할은 공개 정보 → 거지 식별 등에 사용
      travellerRoleId: p.isTraveller ? p.role?.id : undefined,
    });
    const playerMap = new Map(state.players.map((p) => [p.id, toInfo(p)]));

    // playerOrder가 있으면 그 순서대로, 없으면 원래 순서 유지
    const players =
      state.playerOrder?.length > 0
        ? state.playerOrder
            .map((id) => playerMap.get(id))
            .filter((p): p is NonNullable<typeof p> => p != null)
        : state.players.map(toInfo);

    // Game was reset - player no longer exists in the game
    const { playerId, playerName } = usePlayerStore.getState();
    if (playerId && !state.players.find((p) => p.id === playerId)) {
      // 게임 상태만 초기화하고 서버 연결/게임코드는 유지
      usePlayerStore.getState().reset();
      usePlayerStore.getState().set({ playerName });
      useWhisperStore.getState().reset();
      useChatStore.getState().reset();
      return;
    }

    usePlayerStore.getState().set({ gamePlayers: players });
  });

  socket.on('game:playerUpdate', (player) => {
    const state = usePlayerStore.getState();
    if (player.id === state.playerId) {
      const wasDeath = state.isAlive && !player.isAlive;
      // onlyWhenDead 역할(까마귀지기 등)의 밤 사망은 전용 오버레이로 이미 알렸으므로
      // DeathOverlay 스킵 (낮 처형 등 다른 사유로 죽으면 정상 표시)
      const effectiveRoleId = state.drunkAs ?? state.role?.id;
      const isOnlyWhenDead =
        effectiveRoleId != null &&
        NIGHT_ACTIONS[effectiveRoleId]?.onlyWhenDead === true;
      const isNightKill =
        !state.deathReason || state.deathReason === 'night_kill';
      const showDeathOverlay = wasDeath && !(isOnlyWhenDead && isNightKill);
      usePlayerStore.getState().set({
        isAlive: player.isAlive,
        philosopherGrantedRole: player.philosopherGrantedRole ?? null,
        ...(showDeathOverlay
          ? {
              justDied: true,
              // execution:announced가 먼저 왔으면 그 이유 유지, 아니면 night_kill
              deathReason: state.deathReason ?? 'night_kill',
            }
          : {}),
      });
    }
    const updated = state.gamePlayers.map((p) =>
      p.id === player.id ? { ...p, isAlive: player.isAlive } : p,
    );
    usePlayerStore.getState().set({ gamePlayers: updated });
  });

  socket.on('game:settings', (settings) => {
    usePlayerStore.getState().set({ gameSettings: settings });
  });

  socket.on('player:kicked', () => {
    const { playerName } = usePlayerStore.getState();
    usePlayerStore.getState().reset();
    usePlayerStore.getState().set({ playerName, kicked: true });
    useWhisperStore.getState().reset();
    useChatStore.getState().reset();
  });

  // 여행자 참가/추방 이벤트
  socket.on('traveller:joined', (data) => {
    // 이야기꾼이 여행자 역할 배정 후 game:state로 상태가 갱신됨
    usePlayerStore.getState().showEventToast({
      title: '여행자 참가',
      message: `${data.playerName}이(가) 여행자(${data.roleName})로 참가했습니다`,
    });
  });

  // 곡예사 공개 선언: 모든 플레이어에게 오버레이 표시
  socket.on('juggler:announced', (data) => {
    usePlayerStore.getState().set({ jugglerAnnouncement: data });
  });

  // 총잡이 사살 선언: 모든 플레이어에게 오버레이 표시
  socket.on('gunslinger:fired', (data) => {
    usePlayerStore.getState().set({ gunslingerFiredOverlay: data });
  });

  // 거지 토큰 수령: 본인에게만 전송
  socket.on('beggar:tokenReceived', (data) => {
    const prev = usePlayerStore.getState();
    usePlayerStore.getState().set({
      beggarTokens: data.tokenCount,
      beggarAlignmentInfos: [
        ...prev.beggarAlignmentInfos,
        {
          giverId: data.giverId,
          giverName: data.giverName,
          giverAlignment: data.giverAlignment,
        },
      ],
    });
    usePlayerStore.getState().showEventToast({
      title: '투표 토큰 수령',
      message: `${data.giverName} (${data.giverAlignment === 'good' ? '선' : '악'}) — 토큰 ${data.tokenCount}`,
    });
  });

  // 희생양 교체: 모든 플레이어에 브로드캐스트 (executionCandidate 갱신 + 오버레이)
  socket.on('scapegoat:swapped', (data) => {
    usePlayerStore.getState().set({
      executionCandidate: {
        playerId: data.scapegoatId,
        playerName: data.scapegoatName,
        guiltyVotes: data.guiltyVotes,
      },
      scapegoatSwappedOverlay: {
        originalId: data.originalId,
        originalName: data.originalName,
        scapegoatId: data.scapegoatId,
        scapegoatName: data.scapegoatName,
      },
    });
  });

  socket.on('harlot:consentRequested', (data) => {
    usePlayerStore.getState().set({ harlotConsentRequest: data });
  });

  socket.on('harlot:consentResult', (data) => {
    const state = usePlayerStore.getState();
    const isParticipant =
      state.playerId === data.harlotId || state.playerId === data.targetId;
    if (!isParticipant) return;
    const isHarlot = state.playerId === data.harlotId;
    const message = !data.accepted
      ? '방문을 거절했습니다'
      : isHarlot && data.targetRoleName
        ? `${data.targetName}: ${data.targetRoleName}`
        : isHarlot && data.needsFalseInfo
          ? `${data.targetName}: 이야기꾼에게 정보를 확인하세요`
          : '방문에 동의했습니다';
    usePlayerStore.getState().set({ harlotConsentRequest: null });
    usePlayerStore.getState().showEventToast({
      title: '매춘부 방문 결과',
      message,
    });
  });

  // ── 추방 투표 이벤트 ──

  socket.on('exile:start', (data) => {
    usePlayerStore.getState().set({
      exileVote: {
        ...data,
        votes: {},
        guiltyCount: 0,
        innocentCount: 0,
      },
      exileResult: null,
    });
  });

  socket.on('exile:voteUpdate', (data) => {
    const current = usePlayerStore.getState().exileVote;
    if (current) {
      usePlayerStore.getState().set({
        exileVote: { ...current, ...data },
      });
    }
  });

  socket.on('exile:result', (data) => {
    usePlayerStore.getState().set({
      exileVote: null,
      exileResult: {
        targetName: data.targetName,
        targetRoleName: data.targetRoleName,
        exiled: data.exiled,
        guiltyCount: data.guiltyCount,
        totalPlayers: data.totalPlayers,
      },
    });
  });

  socket.on('traveller:exiled', (data) => {
    const state = usePlayerStore.getState();
    if (data.playerId === state.playerId) {
      usePlayerStore.getState().set({
        isAlive: false,
        justDied: true,
        deathReason: 'exile',
      });
    }
    const updated = state.gamePlayers.map((p) =>
      p.id === data.playerId ? { ...p, isAlive: false } : p,
    );
    usePlayerStore.getState().set({ gamePlayers: updated });
  });
}
