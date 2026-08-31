import { useCallback } from 'react';
import { io } from 'socket.io-client';
import { registerForPushNotifications } from '../notifications';
import { useConnectionStore } from '../stores/connectionStore';
import { usePlayerStore } from '../stores/playerStore';
import { buildRejoinStatePatch, isMissingRejoinResponse } from './rejoinState';
import type { AppSocket } from './socketListeners';
import { attachListeners } from './socketListeners';

export type RejoinOutcome =
  | { status: 'success' }
  | { status: 'missing' }
  | { status: 'unavailable' };

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
    (
      playerName: string,
    ): Promise<{
      success: boolean;
      error?: string;
      pending?: boolean;
    }> => {
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

        socket.emit('game:join', { playerName }, (res) => {
          clearTimeout(timeout);
          // 이야기꾼 승인 대기 중
          if (res.pending) {
            resolve({ success: false, pending: true });
            return;
          }
          if (!res.success || !res.playerId) {
            resolve({ success: false, error: res.error });
            return;
          }
          usePlayerStore.getState().set({ playerId: res.playerId });
          resolve({ success: true });
          // Fire and forget
          registerForPushNotifications().then((token) => {
            if (token && socket.connected) {
              socket.emit('push:register', { token });
            }
          });
        });
      });
    },
    [],
  );

  const rejoinGame = useCallback((playerId: string): Promise<RejoinOutcome> => {
    return new Promise((resolve) => {
      const socket = useConnectionStore.getState().socket;
      if (!socket || !socket.connected) {
        resolve({ status: 'unavailable' });
        return;
      }

      let settled = false;
      const finish = (outcome: RejoinOutcome) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(outcome);
      };
      const timeout = setTimeout(() => finish({ status: 'unavailable' }), 5000);

      try {
        socket.emit('game:rejoin', { playerId }, (res) => {
          if (settled) return;
          if (!res.success) {
            if (isMissingRejoinResponse(res)) {
              usePlayerStore.getState().set({ playerId: '' });
              finish({ status: 'missing' });
              return;
            }
            finish({ status: 'unavailable' });
            return;
          }
          if (!res.playerName) {
            finish({ status: 'unavailable' });
            return;
          }
          const previous = usePlayerStore.getState();
          usePlayerStore
            .getState()
            .set(
              buildRejoinStatePatch(
                { ...previous, playerId },
                { ...res, success: true },
              ),
            );
          finish({ status: 'success' });
          // Fire and forget
          registerForPushNotifications().then((token) => {
            if (token && socket.connected) {
              socket.emit('push:register', { token });
            }
          });
        });
      } catch {
        finish({ status: 'unavailable' });
      }
    });
  }, []);

  return { connect, joinGame, rejoinGame };
}
