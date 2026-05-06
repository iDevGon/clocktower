import { describe, expect, it } from 'vitest';
import { getPendingFeedbackIndex } from '../nightFeedbackQueue';

describe('getPendingFeedbackIndex', () => {
  it('같은 플레이어가 두 번 깨어난 경우에도 순번별로 미전송 대상을 찾는다', () => {
    const targets = [
      { id: 'p1', name: 'Player1' },
      { id: 'p1', name: 'Player1' },
    ];

    expect(getPendingFeedbackIndex(targets, new Set())).toBe(0);
    expect(getPendingFeedbackIndex(targets, new Set([0]))).toBe(1);
    expect(getPendingFeedbackIndex(targets, new Set([0, 1]))).toBeNull();
  });
});
