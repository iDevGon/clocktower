import { describe, expect, it } from 'vitest';
import * as queueModule from '../nightFeedbackQueue';

interface DeliveryGuard {
  tryStart: () => boolean;
  settle: (success: boolean) => 'advance' | 'retry' | 'ignored';
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

    expect(guard.tryStart()).toBe(true);
    expect(guard.tryStart()).toBe(false);
  });

  it('releases a failed delivery so the same choice can be retried', () => {
    const guard = createDeliveryGuard();
    guard.tryStart();

    expect(guard.settle(false)).toBe('retry');
    expect(guard.tryStart()).toBe(true);
  });

  it('advances once on success and ignores duplicate settlement callbacks', () => {
    const guard = createDeliveryGuard();
    guard.tryStart();

    expect(guard.settle(true)).toBe('advance');
    expect(guard.settle(true)).toBe('ignored');
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
