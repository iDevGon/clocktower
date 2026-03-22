import { type ExecutionAnnouncement, getRoleById } from '@clocktower/shared';
import { useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  type StorytellerSocket,
  useConnectionStore,
} from '../stores/connectionStore';
import { useGameStore } from '../stores/gameStore';
import { useLogStore } from '../stores/logStore';

export function useSocketConnection() {
  const { setSocket, setConnected } = useConnectionStore();
  const setGameState = useGameStore((s) => s.setGameState);

  const connect = useCallback(
    (serverUrl: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existing = useConnectionStore.getState().socket;
        if (existing) {
          existing.disconnect();
        }

        const url = `${serverUrl}/storyteller`;
        const newSocket: StorytellerSocket = io(url, {
          transports: ['websocket', 'polling'],
        }) as StorytellerSocket;

        const timer = setTimeout(() => {
          newSocket.disconnect();
          reject(new Error(`${serverUrl} 에 연결할 수 없습니다`));
        }, 7000);

        let resolved = false;
        newSocket.on('connect', () => {
          setConnected(true);
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            resolve();
          }
        });

        newSocket.on('disconnect', () => setConnected(false));
        newSocket.on('game:state', setGameState);
        newSocket.on('game:reset', () => {
          useGameStore.getState().reset();
        });
        newSocket.on('game:end', (result) => {
          useGameStore.getState().setGameResult(result);
        });
        newSocket.on('night:actionReceived', (action) => {
          useGameStore.getState().addNightAction(action);
          const role = getRoleById(action.roleId);
          const gs = useGameStore.getState().gameState;
          const playerMap = new Map(
            gs?.players?.map((p) => [p.id, p.name]) ?? [],
          );
          const targetNames = action.targets
            .map((tid) => playerMap.get(tid) ?? tid)
            .join(', ');
          useLogStore
            .getState()
            .addLog(
              gs?.day ?? 0,
              'night',
              `${role?.name ?? action.roleId}(${action.playerName}) → ${targetNames || '(대상 없음)'}`,
              'ability',
            );
        });
        newSocket.on('whisper:activeChats', (chats) => {
          useGameStore.getState().setActiveWhispers(chats);
        });
        newSocket.on('slayer:declared', (data) => {
          const gs = useGameStore.getState().gameState;
          const msg = `${data.slayerName}이(가) ${data.targetName}에게 처단자 능력 선언!`;
          useGameStore.getState().showEventToast({
            title: '처단자 선언',
            message: msg,
          });
          useLogStore
            .getState()
            .addLog(gs?.day ?? 0, 'day', `⚔️ ${msg}`, 'ability');
        });
        newSocket.on('slayer:noEffect', () => {
          useGameStore.getState().setSlayerWaitingAck(true);
        });
        newSocket.on('slayer:allAcked', () => {
          useGameStore.getState().setSlayerWaitingAck(false);
        });
        newSocket.on(
          'virgin:triggered',
          (data: {
            virginName: string;
            nominatorName: string;
            nominatorId: string;
          }) => {
            const gs = useGameStore.getState().gameState;
            const msg = `${data.nominatorName}이(가) 성결자 ${data.virginName}을(를) 지목하여 처형!`;
            useGameStore.getState().showEventToast({
              title: '성결자 발동',
              message: msg,
            });
            useLogStore
              .getState()
              .addLog(gs?.day ?? 0, 'day', `✝️ ${msg}`, 'death');
          },
        );
        newSocket.on('execution:announced', (data: ExecutionAnnouncement) => {
          const gs = useGameStore.getState().gameState;
          useLogStore
            .getState()
            .addLog(
              gs?.day ?? 0,
              gs?.phase ?? 'day',
              `💀 ${data.detail}`,
              'death',
            );
        });
        newSocket.on('vote:consentStatus', ({ readyPlayerIds }) => {
          useGameStore.getState().setVoteConsentReadyIds(readyPlayerIds);
        });
        newSocket.on('vote:start', (data) => {
          const gs = useGameStore.getState();
          gs.addNomination(data.nominatorId, data.nomineeId);
          useLogStore
            .getState()
            .addLog(
              gs.gameState?.day ?? 0,
              'day',
              `🎯 ${data.nominatorName}이(가) ${data.nomineeName}을(를) 지목했습니다`,
            );
        });
        newSocket.on('vote:proceedToVote', () => {
          useGameStore
            .getState()
            .setVoteCountdown({ startedAt: Date.now(), durationMs: 5000 });
        });
        newSocket.on('vote:clockStart', (data) => {
          useGameStore.getState().setVoteClock({
            startedAt: Date.now(),
            durationMs: data.durationMs,
          });
        });
        newSocket.on('whisper:clockStart', (data) => {
          useGameStore.getState().setWhisperClock({
            startedAt: Date.now(),
            durationMs: data.durationMs,
          });
        });
        newSocket.on('discussion:clockStart', (data) => {
          useGameStore.getState().setDiscussionClock({
            startedAt: Date.now(),
            durationMs: data.durationMs,
          });
        });
        newSocket.on('nomination:clockStart', (data) => {
          useGameStore.getState().setNominationClock({
            startedAt: Date.now(),
            durationMs: data.durationMs,
          });
          useGameStore.getState().setNominationPaused(false);
        });
        newSocket.on('nomination:clockPause', () => {
          useGameStore.getState().setNominationPaused(true);
        });
        newSocket.on('nomination:clockResume', (data) => {
          useGameStore.getState().setNominationClock({
            startedAt: Date.now(),
            durationMs: data.remainingMs,
          });
          useGameStore.getState().setNominationPaused(false);
        });
        newSocket.on('defense:clockStart', (data) => {
          useGameStore.getState().setDefenseClock({
            startedAt: Date.now(),
            durationMs: data.durationMs,
          });
        });
        newSocket.on('vote:clockPause', () => {
          useGameStore.getState().setVoteClock(null);
        });
        newSocket.on('vote:preselected', (data) => {
          useGameStore
            .getState()
            .setVotePreselection(data.playerId, data.guilty);
        });
        newSocket.on('vote:confirmed', (data) => {
          useGameStore.getState().setVoteConfirmed(data.playerId, data.guilty);
        });
        newSocket.on('vote:result', (data) => {
          const store = useGameStore.getState();
          store.setVoteResult(data);
          store.setVoteClock(null);
          store.clearVotePreselections();
          // 처형 예정자 추적
          if (data.executionCandidate) {
            store.setExecutionCandidate(data.executionCandidate);
          } else {
            store.setExecutionCandidate(null);
          }
          if (data.guilty) {
            store.setLastExecutedPlayerId(data.nomineeId);
          }
          if (data.executionStatus === 'candidate_cleared') {
            store.setLastExecutedPlayerId(null);
          }
          // 투표 결과 로그 기록
          const day = store.gameState?.day ?? 0;
          const voteCount = Object.keys(data.votes).length;
          useLogStore
            .getState()
            .addLog(
              day,
              'vote',
              `${data.nomineeName}: ${voteCount}표 (${data.guilty ? '유죄' : '무죄'}) - ${data.executionMessage}`,
            );
        });
        newSocket.on('sweetheart:died', (data) => {
          useGameStore.getState().setSweetheartDied(data.sweetheartName);
        });
        newSocket.on('mayor:nightDeath', (data) => {
          useGameStore
            .getState()
            .setMayorNightDeath(data.mayorId, data.mayorName);
        });
        newSocket.on('night:wakeUpTargets', (data) => {
          useGameStore.getState().setNightWakeUpTargets(data.candidateIds);
        });
        newSocket.on('traveller:joined', (data) => {
          const gs = useGameStore.getState().gameState;
          const msg = `${data.playerName}이(가) 여행자(${data.roleName})로 참가했습니다`;
          useGameStore.getState().showEventToast({
            title: '여행자 참가',
            message: msg,
          });
          useLogStore
            .getState()
            .addLog(gs?.day ?? 0, gs?.phase ?? 'setup', msg);
        });
        newSocket.on('traveller:exiled', (data) => {
          const gs = useGameStore.getState().gameState;
          const msg = `${data.playerName}(${data.roleName})이(가) 추방되었습니다`;
          useGameStore.getState().showEventToast({
            title: '여행자 추방',
            message: msg,
          });
          useLogStore
            .getState()
            .addLog(gs?.day ?? 0, gs?.phase ?? 'setup', `🚪 ${msg}`, 'death');
        });
        newSocket.on('chat:receiveFromPlayer', (message) => {
          const store = useGameStore.getState();
          store.addChatMessage(message);
          // 플레이어가 보낸 메시지이고 해당 채팅이 열려있지 않으면 토스트 표시
          if (
            !message.fromStoryteller &&
            store.activeChatPlayerId !== message.playerId
          ) {
            store.showChatToast({
              playerName: message.playerName,
              message: message.message,
            });
          }
        });

        setSocket(newSocket);
        useConnectionStore.getState().setServerUrl(serverUrl);
      });
    },
    [setSocket, setConnected, setGameState],
  );

  return { connect };
}
