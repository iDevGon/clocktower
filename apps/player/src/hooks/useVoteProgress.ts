import { useEffect, useState } from 'react';
import { usePlayerStore } from '../stores/playerStore';

export interface VoteProgressState {
  /** 0–1, current progress of the clock hand */
  progress: number;
  /** Whether the player can still vote (hand hasn't passed) */
  canVote: boolean;
  /** Whether the hand has already passed the player */
  hasPassed: boolean;
  /** Whether it's currently the player's voting slot */
  isMyTurn: boolean;
  /** Whether the vignette should be visible */
  visible: boolean;
}

export function useVoteProgress(tickIntervalMs = 300): VoteProgressState {
  const playerId = usePlayerStore((s) => s.playerId);
  const voteClock = usePlayerStore((s) => s.voteClock);
  const voteOrder = usePlayerStore((s) => s.voteOrder);

  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!voteClock) return;
    const interval = setInterval(
      () => forceRender((n) => n + 1),
      tickIntervalMs,
    );
    return () => clearInterval(interval);
  }, [voteClock, tickIntervalMs]);

  if (!voteClock || !voteOrder?.fullOrder) {
    return {
      progress: 0,
      canVote: false,
      hasPassed: false,
      isMyTurn: false,
      visible: false,
    };
  }

  const fullOrder = voteOrder.fullOrder;
  const totalPlayers = fullOrder.length;
  const nomineeId = voteOrder.nomineeId;
  const nomineeFullIdx = fullOrder.findIndex((p) => p.id === nomineeId);
  const myFullIdx = fullOrder.findIndex((p) => p.id === playerId);

  if (nomineeFullIdx < 0 || myFullIdx < 0) {
    return {
      progress: 0,
      canVote: false,
      hasPassed: false,
      isMyTurn: false,
      visible: false,
    };
  }

  const myOffset = (myFullIdx - nomineeFullIdx + totalPlayers) % totalPlayers;
  const myConfirmFraction = myOffset === 0 ? 1 : myOffset / totalPlayers;

  const elapsed = Date.now() - voteClock.startedAt;
  const progress = Math.min(elapsed / voteClock.durationMs, 1);

  const hasPassed = progress >= myConfirmFraction;
  const slotSize = 1 / totalPlayers;
  const isMyTurn = !hasPassed && progress >= myConfirmFraction - slotSize;
  const visible = !hasPassed;

  return { progress, canVote: !hasPassed, hasPassed, isMyTurn, visible };
}
