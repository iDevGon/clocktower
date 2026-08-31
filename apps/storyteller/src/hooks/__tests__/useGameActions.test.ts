import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const connection = vi.hoisted(() => ({ socket: null as unknown }));

vi.mock('react', () => ({
  useCallback: <T extends (...args: never[]) => unknown>(callback: T) =>
    callback,
}));

vi.mock('../../stores/connectionStore', () => ({
  useConnectionStore: Object.assign(
    (selector: (state: typeof connection) => unknown) => selector(connection),
    { getState: () => connection },
  ),
}));

import { useGameActions } from '../useGameActions';

type ReviewResult = { success: boolean; error?: string };
type TimedAck = (error: Error | null, result?: ReviewResult) => void;

class ReviewSocket {
  connected = true;
  lateAck: (() => void) | null = null;
  timeoutCalls: number[] = [];
  emittedEvents: string[] = [];

  emit(event: string) {
    this.emittedEvents.push(event);
  }

  timeout(timeoutMs: number) {
    this.timeoutCalls.push(timeoutMs);
    return {
      emit: (_event: string, _data: unknown, callback: TimedAck) => {
        setTimeout(() => callback(new Error('operation timed out')), timeoutMs);
        this.lateAck = () => callback(null, { success: true });
      },
    };
  }
}

describe('useGameActions reviewGamblerGuess', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    connection.socket = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('연결이 없으면 즉시 한국어 실패 callback으로 종료한다', () => {
    const callback = vi.fn();

    useGameActions().reviewGamblerGuess(
      { requestId: 'request-1', decision: 'reject' },
      callback,
    );

    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: '서버와 연결되어 있지 않습니다. 다시 연결한 뒤 시도하세요.',
    });
  });

  it('5초 ack timeout은 한 번 실패하고 late ack를 무시한다', async () => {
    const socket = new ReviewSocket();
    connection.socket = socket;
    const callback = vi.fn();

    useGameActions().reviewGamblerGuess(
      { requestId: 'request-1', decision: 'reject' },
      callback,
    );
    await vi.runAllTimersAsync();

    expect(socket.timeoutCalls).toEqual([5000]);
    expect(callback).toHaveBeenCalledOnce();
    expect(callback).toHaveBeenCalledWith({
      success: false,
      error: '검토 응답 시간이 초과되었습니다. 다시 시도하세요.',
    });

    socket.lateAck?.();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('다른 BMR action에는 timeout을 적용하지 않는다', () => {
    const socket = new ReviewSocket();
    connection.socket = socket;

    useGameActions().courtierChooseRole('courtier-1', 'chef');

    expect(socket.timeoutCalls).toEqual([]);
    expect(socket.emittedEvents).toEqual(['courtier:chooseRole']);
  });
});
