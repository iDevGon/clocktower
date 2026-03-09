import { getRoleById } from '@clocktower/shared';
import { useCallback } from 'react';
import { io } from 'socket.io-client';
import { registerForPushNotifications } from '../notifications';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import type { AppSocket } from './socketListeners';
import { attachListeners } from './socketListeners';

export function useConnection() {
  const connect = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const existing = useConnectionStore.getState().socket;
      if (existing) {
        existing.disconnect();
      }

      const serverUrl = useConnectionStore.getState().serverUrl;
      if (!serverUrl) {
        reject(new Error('서버 주소가 설정되지 않았습니다'));
        return;
      }

      const url = `${serverUrl}/player`;
      const socket: AppSocket = io(url, {
        transports: ['websocket', 'polling'],
      });

      const timer = setTimeout(() => {
        socket.disconnect();
        reject(new Error(`${serverUrl} 에 연결할 수 없습니다`));
      }, 7000);

      socket.on('connect', () => {
        clearTimeout(timer);
        useConnectionStore.getState().set({ isConnected: true });
        resolve();
      });

      socket.on('disconnect', () => {
        useConnectionStore.getState().set({ isConnected: false });
      });

      attachListeners(socket);
      useConnectionStore.getState().set({ socket });
    });
  }, []);

  const joinGame = useCallback(
    (playerName: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const socket = useConnectionStore.getState().socket;
        if (!socket || !socket.connected) {
          resolve({ success: false, error: '서버에 연결되어 있지 않습니다' });
          return;
        }

        const timeout = setTimeout(
          () => resolve({ success: false, error: '응답 시간 초과' }),
          5000,
        );

        socket.emit('game:join', { playerName }, async (res) => {
          clearTimeout(timeout);
          if (res.success && res.playerId) {
            usePlayerStore.getState().set({ playerId: res.playerId });

            const token = await registerForPushNotifications();
            if (token) {
              socket.emit('push:register', { token });
            }

            resolve({ success: true });
          } else {
            resolve({ success: false, error: res.error });
          }
        });
      });
    },
    [],
  );

  const rejoinGame = useCallback((playerId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = useConnectionStore.getState().socket;
      if (!socket || !socket.connected) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => resolve(false), 5000);

      socket.emit('game:rejoin', { playerId }, async (res) => {
        clearTimeout(timeout);
        if (res.success && res.playerName) {
          usePlayerStore.getState().set({
            playerId,
            playerName: res.playerName,
            role: res.roleId ? (getRoleById(res.roleId) ?? null) : null,
            drunkAs: res.drunkAs ?? null,
            currentPhase: res.phase ?? 'setup',
            isAlive: res.isAlive ?? true,
            daySubPhase: res.daySubPhase ?? null,
            hasNominatedToday: res.hasNominatedToday ?? false,
            deadVoteUsed: res.deadVoteUsed ?? false,
            nightProgress: res.nightProgress ?? null,
          });

          const token = await registerForPushNotifications();
          if (token) {
            socket.emit('push:register', { token });
          }

          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }, []);

  return { connect, joinGame, rejoinGame };
}
