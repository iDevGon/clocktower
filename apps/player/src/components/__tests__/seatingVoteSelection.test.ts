import { describe, expect, it } from 'vitest';
import { resolveSelectedVote } from '../seatingVoteSelection';

const vote = {
  id: 'vote-1',
  round: 1,
  nominatorId: 'player-1',
  nominatorName: '민수',
  nomineeId: 'player-2',
  nomineeName: '지수',
  guilty: true,
  votes: { 'player-1': true },
  eligibleVoterIds: ['player-1'],
  voterNames: { 'player-1': '민수' },
  timestamp: 1,
};

describe('resolveSelectedVote', () => {
  it('returns the selected history entry when vote history is visible', () => {
    expect(resolveSelectedVote(true, vote.id, [vote])).toBe(vote);
  });

  it('returns null when vote history is hidden even with a selected entry', () => {
    expect(resolveSelectedVote(false, vote.id, [vote])).toBeNull();
  });
});
