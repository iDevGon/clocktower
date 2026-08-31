import { describe, expect, it } from 'vitest';
import * as queueModule from '../nightFeedbackQueue';

interface DeliveryGuard {
  tryStart: () => number | null;
  settle: (
    attemptToken: number,
    success: boolean,
  ) => 'advance' | 'retry' | 'ignored';
}

interface CompletionGuard {
  tryComplete: () => boolean;
}

const deliveryFactory = (
  queueModule as typeof queueModule & {
    createNightFeedbackDeliveryGuard?: () => DeliveryGuard;
  }
).createNightFeedbackDeliveryGuard;
const completionFactory = (
  queueModule as typeof queueModule & {
    createNightFeedbackCompletionGuard?: () => CompletionGuard;
  }
).createNightFeedbackCompletionGuard;

function createDeliveryGuard() {
  expect(deliveryFactory).toBeTypeOf('function');
  return (deliveryFactory as () => DeliveryGuard)();
}

describe('night feedback delivery guard', () => {
  it('accepts the first dispatch and rejects rapid repeats while pending', () => {
    const guard = createDeliveryGuard();

    expect(guard.tryStart()).toEqual(expect.any(Number));
    expect(guard.tryStart()).toBeNull();
  });

  it('releases a failed delivery so the same choice can be retried', () => {
    const guard = createDeliveryGuard();
    const firstAttempt = guard.tryStart() as number;

    expect(guard.settle(firstAttempt, false)).toBe('retry');
    expect(guard.tryStart()).toEqual(expect.any(Number));
  });

  it('advances once on success and ignores duplicate settlement callbacks', () => {
    const guard = createDeliveryGuard();
    const attempt = guard.tryStart() as number;

    expect(guard.settle(attempt, true)).toBe('advance');
    expect(guard.settle(attempt, true)).toBe('ignored');
  });

  it('ignores a stale callback without settling the current retry attempt', () => {
    const guard = createDeliveryGuard();
    const attemptA = guard.tryStart() as number;
    expect(guard.settle(attemptA, false)).toBe('retry');

    const attemptB = guard.tryStart() as number;
    expect(attemptB).not.toBe(attemptA);
    expect(guard.settle(attemptA, true)).toBe('ignored');
    expect(guard.tryStart()).toBeNull();
    expect(guard.settle(attemptB, true)).toBe('advance');
  });
});

describe('night feedback completion guard', () => {
  it('allows completion notification exactly once per mounted role', () => {
    expect(completionFactory).toBeTypeOf('function');
    const guard = (completionFactory as () => CompletionGuard)();

    expect(guard.tryComplete()).toBe(true);
    expect(guard.tryComplete()).toBe(false);
  });
});
