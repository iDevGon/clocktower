import type { NightAction } from '@clocktower/shared';

export function getPendingFeedbackIndex<T>(
  targets: T[],
  sentIndices: Set<number>,
): number | null {
  const index = targets.findIndex((_, i) => !sentIndices.has(i));
  return index >= 0 ? index : null;
}

export function getNightActionForFeedbackTargetOccurrence(
  actions: NightAction[] | undefined,
  roleId: string,
  targets: { id: string }[],
  currentIndex: number,
): NightAction | undefined {
  const currentTarget = targets[currentIndex];
  if (!currentTarget) return undefined;

  const occurrenceIndex =
    targets
      .slice(0, currentIndex + 1)
      .filter((target) => target.id === currentTarget.id).length - 1;

  return actions
    ?.filter(
      (action) =>
        action.roleId === roleId && action.playerId === currentTarget.id,
    )
    .at(occurrenceIndex);
}

export type NightFeedbackDeliverySettlement = 'advance' | 'retry' | 'ignored';

export function createNightFeedbackDeliveryGuard() {
  let nextAttemptToken = 0;
  let pendingAttemptToken: number | null = null;

  return {
    tryStart: () => {
      if (pendingAttemptToken != null) return null;
      nextAttemptToken += 1;
      pendingAttemptToken = nextAttemptToken;
      return pendingAttemptToken;
    },
    settle: (
      attemptToken: number,
      success: boolean,
    ): NightFeedbackDeliverySettlement => {
      if (pendingAttemptToken !== attemptToken) return 'ignored';
      pendingAttemptToken = null;
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
