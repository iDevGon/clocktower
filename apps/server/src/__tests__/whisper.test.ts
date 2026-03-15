import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WhisperTracker } from '../whisper.js';

function createMockNamespace() {
  // biome-ignore lint/suspicious/noExplicitAny: mock namespace
  return { emit: vi.fn() } as any;
}

describe('WhisperTracker', () => {
  let tracker: WhisperTracker;
  let storytellerIo: ReturnType<typeof createMockNamespace>;
  let playerIo: ReturnType<typeof createMockNamespace>;

  beforeEach(() => {
    storytellerIo = createMockNamespace();
    playerIo = createMockNamespace();
    tracker = new WhisperTracker(storytellerIo, playerIo);
  });

  describe('makeConversationId', () => {
    it('ID를 정렬하고 조합한다', () => {
      expect(WhisperTracker.makeConversationId('b', 'a')).toBe('a:b');
      expect(WhisperTracker.makeConversationId('a', 'b')).toBe('a:b');
    });

    it('3개 이상 ID도 정렬한다', () => {
      expect(WhisperTracker.makeConversationId('c', 'a', 'b')).toBe('a:b:c');
    });
  });

  describe('update', () => {
    it('대화를 저장하고 broadcastActive를 호출한다', () => {
      tracker.update({
        id: 'msg1',
        fromId: 'p1',
        fromName: 'Player1',
        conversationId: 'p1:p2',
        participantIds: ['p1', 'p2'],
        participantNames: ['Player1', 'Player2'],
        message: 'hello',
        timestamp: Date.now(),
      });

      expect(storytellerIo.emit).toHaveBeenCalledWith(
        'whisper:activeChats',
        expect.any(Array),
      );
      expect(playerIo.emit).toHaveBeenCalledWith(
        'whisper:activeChats',
        expect.any(Array),
      );
    });
  });

  describe('clear', () => {
    it('모든 대화를 삭제한다', () => {
      tracker.update({
        id: 'msg1',
        fromId: 'p1',
        fromName: 'Player1',
        conversationId: 'p1:p2',
        participantIds: ['p1', 'p2'],
        participantNames: ['Player1', 'Player2'],
        message: 'hello',
        timestamp: Date.now(),
      });

      tracker.clear();

      // clear 후 update를 하면 이전 대화가 없어야 함
      tracker.update({
        id: 'msg2',
        fromId: 'p3',
        fromName: 'Player3',
        conversationId: 'p3:p4',
        participantIds: ['p3', 'p4'],
        participantNames: ['Player3', 'Player4'],
        message: 'hey',
        timestamp: Date.now(),
      });

      // 마지막 emit에는 p3:p4만 있어야 함
      const lastCall =
        storytellerIo.emit.mock.calls[storytellerIo.emit.mock.calls.length - 1];
      expect(lastCall[1]).toHaveLength(1);
      expect(lastCall[1][0].conversationId).toBe('p3:p4');
    });
  });

  describe('타임아웃', () => {
    it('60초 지난 대화는 자동 제거된다', () => {
      const oldTimestamp = Date.now() - 61_000;
      tracker.update({
        id: 'msg1',
        fromId: 'p1',
        fromName: 'Player1',
        conversationId: 'p1:p2',
        participantIds: ['p1', 'p2'],
        participantNames: ['Player1', 'Player2'],
        message: 'old',
        timestamp: oldTimestamp,
      });

      // 새 메시지 추가 시 broadcastActive가 호출되면서 오래된 대화 정리
      tracker.update({
        id: 'msg2',
        fromId: 'p3',
        fromName: 'Player3',
        conversationId: 'p3:p4',
        participantIds: ['p3', 'p4'],
        participantNames: ['Player3', 'Player4'],
        message: 'new',
        timestamp: Date.now(),
      });

      const lastCall =
        storytellerIo.emit.mock.calls[storytellerIo.emit.mock.calls.length - 1];
      expect(lastCall[1]).toHaveLength(1);
      expect(lastCall[1][0].conversationId).toBe('p3:p4');
    });
  });
});
