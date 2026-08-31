import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../game.js';
import { registerStorytellerHandlers } from '../handlers/storyteller.js';
import {
  clearPushTokens,
  registerPushToken,
  removePushToken,
  sendPushNotification,
  sendPushToAll,
} from '../pushNotifications.js';

describe('pushNotifications', () => {
  beforeEach(() => {
    clearPushTokens();
    vi.restoreAllMocks();
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response());
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('register/remove/clear', () => {
    it('토큰을 등록하고 제거할 수 있다', async () => {
      registerPushToken('p1', 'token1');
      await sendPushNotification('p1', 'Test', 'Body');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      removePushToken('p1');
      await sendPushNotification('p1', 'Test', 'Body');
      // 토큰 제거 후에는 fetch 호출 안 됨
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('clearPushTokens로 모든 토큰을 제거한다', async () => {
      registerPushToken('p1', 'token1');
      registerPushToken('p2', 'token2');
      clearPushTokens();
      await sendPushNotification('p1', 'Test', 'Body');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('강퇴된 플레이어의 토큰을 제거한다', async () => {
      const game = new GameManager();
      game.create();
      const player = game.addPlayer('Player1');
      expect(player).not.toBeNull();
      registerPushToken(player?.id ?? '', 'token1');

      let connectionHandler:
        | ((socket: {
            emit: ReturnType<typeof vi.fn>;
            on: (event: string, handler: unknown) => void;
          }) => void)
        | undefined;
      const storytellerIo = {
        emit: vi.fn(),
        on: vi.fn((_event: string, handler: typeof connectionHandler) => {
          connectionHandler = handler;
        }),
      };
      const roomOperator = {
        emit: vi.fn(),
        socketsLeave: vi.fn(),
      };
      const playerIo = {
        emit: vi.fn(),
        in: vi.fn(() => roomOperator),
        to: vi.fn(() => roomOperator),
      };
      const socketHandlers = new Map<string, (...args: unknown[]) => void>();
      const socket = {
        emit: vi.fn(),
        on: (event: string, handler: unknown) => {
          socketHandlers.set(event, handler as (...args: unknown[]) => void);
        },
      };

      registerStorytellerHandlers(
        storytellerIo as never,
        playerIo as never,
        game,
        {} as never,
      );
      connectionHandler?.(socket);
      socketHandlers.get('player:kick')?.(player?.id ?? '', vi.fn());

      await sendPushNotification(player?.id ?? '', 'Test', 'Body');

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendPushNotification', () => {
    it('토큰이 있으면 fetch를 호출한다', async () => {
      registerPushToken('p1', 'ExponentPushToken[xxx]');
      await sendPushNotification('p1', 'Title', 'Body');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://exp.host/--/api/v2/push/send',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('ExponentPushToken[xxx]'),
        }),
      );
    });

    it('토큰이 없으면 fetch를 호출하지 않는다', async () => {
      await sendPushNotification('p1', 'Title', 'Body');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('sendPushToAll', () => {
    it('토큰이 있는 플레이어에게만 배치 전송한다', async () => {
      registerPushToken('p1', 'token1');
      registerPushToken('p3', 'token3');
      await sendPushToAll(['p1', 'p2', 'p3'], 'Title', 'Body');
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const fetchMock = vi.mocked(global.fetch);
      const body = JSON.parse(
        (fetchMock.mock.calls[0][1] as RequestInit).body as string,
      );
      expect(body).toHaveLength(2);
    });

    it('토큰이 하나도 없으면 fetch를 호출하지 않는다', async () => {
      await sendPushToAll(['p1', 'p2'], 'Title', 'Body');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
