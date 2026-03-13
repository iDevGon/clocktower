import { getRoleById } from '@clocktower/shared';
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
        newSocket.on('game:end', (result) => {
          useGameStore.getState().setGameResult(result);
        });
        newSocket.on('night:actionReceived', (action) => {
          useGameStore.getState().addNightAction(action);
          const role = getRoleById(action.roleId);
          const gs = useGameStore.getState().gameState;
          const targetNames = action.targets
            .map((tid) => gs?.players.find((p) => p.id === tid)?.name ?? tid)
            .join(', ');
          useLogStore
            .getState()
            .addLog(
              gs?.day ?? 0,
              'night',
              `${role?.name ?? action.roleId}(${action.playerName}) → ${targetNames || '(대상 없음)'}`,
            );
        });
        newSocket.on('whisper:activeChats', (chats) => {
          useGameStore.getState().setActiveWhispers(chats);
        });
        newSocket.on('slayer:declared', () => {
          // handled via game:state
        });
        newSocket.on('vote:clockStart', (data) => {
          useGameStore.getState().setVoteClock({
            startedAt: Date.now(),
            durationMs: data.durationMs,
          });
        });
        newSocket.on('vote:preselected', (data) => {
          useGameStore
            .getState()
            .setVotePreselection(data.playerId, data.guilty);
        });
        newSocket.on('vote:confirmed', (data) => {
          useGameStore
            .getState()
            .setVoteConfirmed(data.playerId, data.guilty);
        });
        newSocket.on('vote:result', (data) => {
          const store = useGameStore.getState();
          store.setVoteResult(data);
          store.setVoteClock(null);
          store.clearVotePreselections();
          if (data.guilty) {
            store.setLastExecutedPlayerId(data.nomineeId);
          }
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
