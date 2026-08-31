import type { PendingGamblerGuess } from '@clocktower/shared';

export interface GamblerGuessDraft {
  requestId: string | null;
  targetPlayerId: string | null;
  guessedRoleId: string | null;
}

const EMPTY_GAMBLER_GUESS_DRAFT: GamblerGuessDraft = {
  requestId: null,
  targetPlayerId: null,
  guessedRoleId: null,
};

export function syncGamblerGuessDraft(
  current: GamblerGuessDraft,
  pending: PendingGamblerGuess | null,
): GamblerGuessDraft {
  if (!pending) return EMPTY_GAMBLER_GUESS_DRAFT;
  if (current.requestId === pending.requestId) return current;
  return {
    requestId: pending.requestId,
    targetPlayerId: pending.targetPlayerId,
    guessedRoleId: pending.guessedRoleId,
  };
}

export function isGamblerReviewPending(
  inFlightRequestId: string | null,
  requestId: string,
): boolean {
  return inFlightRequestId === requestId;
}

export function canSettleGamblerReview(
  inFlightRequestId: string | null,
  currentRequestId: string | null,
  settledRequestId: string,
): boolean {
  return (
    inFlightRequestId === settledRequestId &&
    currentRequestId === settledRequestId
  );
}
