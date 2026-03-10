import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import type { Socket } from 'socket.io-client';
import { vibrateAlert } from '../notifications';
import { useChatStore } from '../stores/chatStore';
import { usePlayerStore } from '../stores/playerStore';
import { useWhisperStore } from '../stores/whisperStore';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function attachListeners(socket: AppSocket) {
  socket.on('connect', () => {
    const { playerId } = usePlayerStore.getState();
    if (playerId) {
      socket.emit('game:rejoin', { playerId }, (res) => {
        if (res.success) {
          usePlayerStore.getState().set({
            role: res.roleId ? (getRoleById(res.roleId) ?? null) : null,
            drunkAs: res.drunkAs ?? null,
            currentPhase: res.phase ?? 'setup',
            isAlive: res.isAlive ?? true,
            daySubPhase: res.daySubPhase ?? null,
            hasNominatedToday: res.hasNominatedToday ?? false,
            deadVoteUsed: res.deadVoteUsed ?? false,
            nightProgress: res.nightProgress ?? null,
          });
        } else {
          // Game was reset or no longer exists — clear game state but keep connection
          const { playerName } = usePlayerStore.getState();
          usePlayerStore.getState().reset();
          usePlayerStore.getState().set({ playerName });
          useWhisperStore.getState().reset();
          useChatStore.getState().reset();
        }
      });
    }
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
    }
    usePlayerStore.getState().set({
      currentPhase: phase,
      nomination: null,
      nightProgress: null,
      nightFeedback: null,
      ...(phase === 'night'
        ? {
            hasNominatedToday: false,
            executionHappenedToday: false,
            nightCount: prev.nightCount + 1,
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
            executionHappenedToday: false,
            slayerUsed: false,
            voteResult: null,
          }
        : {}),
    });
  });

  socket.on('day:subPhase', (subPhase) => {
    usePlayerStore.getState().set({ daySubPhase: subPhase });
  });

  socket.on('night:activeRole', ({ roleId, order, players }) => {
    usePlayerStore.getState().set({
      nightProgress: { activeRoleId: roleId, order, players },
      gamePlayers: players,
      nightActionSubmitted: false,
      nightFeedback: null,
    });

    const { role: myRole, drunkAs } = usePlayerStore.getState();
    if (roleId && myRole && (myRole.id === roleId || drunkAs === roleId)) {
      vibrateAlert();
    }
  });

  socket.on('game:state', (state) => {
    const players = state.players.map(({ id, name, isAlive }) => ({
      id,
      name,
      isAlive,
    }));

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

  socket.on('night:feedback', ({ feedback }) => {
    const { nightCount, addFeedback } = usePlayerStore.getState();
    usePlayerStore.getState().set({ nightFeedback: feedback });
    addFeedback(nightCount, feedback);
  });

  socket.on('role:assign', ({ roleId, drunkAs }) => {
    const role = getRoleById(roleId) ?? null;
    usePlayerStore.getState().set({ role, drunkAs: drunkAs ?? null });
  });

  socket.on('evil:info', (data) => {
    usePlayerStore.getState().set({ evilInfo: data });
  });

  socket.on('vote:start', (data) => {
    usePlayerStore.getState().set({
      nomination: data,
      currentPhase: 'vote',
      hasVoted: false,
      voteResult: null,
      votePreselections: {},
      voteClock: null,
    });
    vibrateAlert();
  });

  socket.on('vote:result', (data) => {
    usePlayerStore.getState().set({
      voteResult: data,
      nomination: null,
      voteOrder: null,
      voteClock: null,
      votePreselections: {},
    });
    setTimeout(() => {
      const current = usePlayerStore.getState();
      if (current.voteResult === data) {
        // phase가 아직 vote 상태일 때만 day로 전환 (밤 전환과의 race condition 방지)
        const update: Record<string, unknown> = { voteResult: null };
        if (current.currentPhase === 'vote') {
          update.currentPhase = 'day';
          update.daySubPhase = 'nomination';
        }
        usePlayerStore.getState().set(update);
      }
    }, 5000);
  });

  socket.on('execution:announced', (data) => {
    const state = usePlayerStore.getState();
    if (data.executedId === state.playerId) {
      // 본인이 처형당한 경우: deathReason만 설정 (사망 오버레이에 반영)
      usePlayerStore
        .getState()
        .set({ deathReason: data.reason, executionHappenedToday: true });
    } else {
      // 다른 플레이어가 처형된 경우: 처형 알림 오버레이 표시
      usePlayerStore
        .getState()
        .set({ executionAnnouncement: data, executionHappenedToday: true });
    }
  });

  socket.on('game:playerUpdate', (player) => {
    const state = usePlayerStore.getState();
    if (player.id === state.playerId) {
      const wasDeath = state.isAlive && !player.isAlive;
      usePlayerStore.getState().set({
        isAlive: player.isAlive,
        ...(wasDeath
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

  socket.on('whisper:receive', (message) => {
    const { playerId } = usePlayerStore.getState();
    const whisperState = useWhisperStore.getState();
    whisperState.addMessage(message, playerId);

    // 다른 사람과 채팅 중이거나 채팅 목록에 있을 때, 새 밀담 알림 표시
    const partnerId =
      message.fromId === playerId ? message.toId : message.fromId;
    if (message.fromId !== playerId && whisperState.activeChat !== partnerId) {
      whisperState.showToast({
        fromId: message.fromId,
        fromName: message.fromName,
        message: message.message,
      });
    }
  });

  socket.on('chat:receiveFromStoryteller', (message) => {
    const chatState = useChatStore.getState();
    chatState.addMessage(message);

    // Show toast if chat is not open and message is from storyteller
    if (message.fromStoryteller && !chatState.isOpen) {
      chatState.showToast({ message: message.message });
      vibrateAlert();
    }
  });

  socket.on('whisper:activeChats', (chats) => {
    useWhisperStore.getState().setActiveWhispers(chats);
  });

  socket.on('slayer:declared', () => {
    vibrateAlert();
  });

  socket.on('slayer:noEffect', (data) => {
    usePlayerStore.getState().set({ slayerFizzle: data });
  });

  socket.on('virgin:triggered', () => {
    vibrateAlert();
  });

  socket.on('game:settings', (settings) => {
    usePlayerStore.getState().set({ gameSettings: settings });
  });

  socket.on('vote:order', (data) => {
    usePlayerStore.getState().set({ voteOrder: data });
  });

  socket.on('vote:clockStart', ({ durationMs }) => {
    usePlayerStore.getState().set({
      voteClock: { startedAt: Date.now(), durationMs },
    });
  });

  socket.on('vote:preselected', ({ playerId, guilty }) => {
    const prev = usePlayerStore.getState().votePreselections;
    usePlayerStore.getState().set({
      votePreselections: { ...prev, [playerId]: guilty },
    });
  });

  socket.on('vote:confirmed', ({ playerId, guilty }) => {
    const prev = usePlayerStore.getState().votePreselections;
    usePlayerStore.getState().set({
      votePreselections: { ...prev, [playerId]: guilty },
    });
  });
}
