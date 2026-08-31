export function getPendingFeedbackIndex<T>(
  targets: T[],
  sentIndices: Set<number>,
): number | null {
  const index = targets.findIndex((_, i) => !sentIndices.has(i));
  return index >= 0 ? index : null;
}

export type NightFeedbackDeliverySettlement = 'advance' | 'retry' | 'ignored';

export function createNightFeedbackDeliveryGuard() {
  let pending = false;

  return {
    tryStart: () => {
      if (pending) return false;
      pending = true;
      return true;
    },
    settle: (success: boolean): NightFeedbackDeliverySettlement => {
      if (!pending) return 'ignored';
      pending = false;
      return success ? 'advance' : 'retry';
    },
  };
}

export function createNightFeedbackCompletionGuard() {
  let completed = false;

  return {
    tryComplete: () => {
      if (completed) return false;
      completed = true;
      return true;
    },
  };
}
