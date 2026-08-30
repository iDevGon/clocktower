import type { VoteHistoryEntry } from '../stores/playerStore';

export function resolveSelectedVote(
  showVoteHistory: boolean,
  selectedVoteId: string | null,
  voteHistory: VoteHistoryEntry[],
): VoteHistoryEntry | null {
  if (!showVoteHistory) return null;
  return voteHistory.find((entry) => entry.id === selectedVoteId) ?? null;
}
