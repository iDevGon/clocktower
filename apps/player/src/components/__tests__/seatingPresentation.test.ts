import { describe, expect, it } from 'vitest';
import { getVoteRightPresentation } from '../seatingPresentation';

describe('getVoteRightPresentation', () => {
  it('presents a living player as able to vote', () => {
    expect(
      getVoteRightPresentation({ isAlive: true, deadVoteUsed: false }),
    ).toEqual({
      label: '투표 가능',
      state: 'alive',
    });
  });

  it('presents an unused dead vote as available', () => {
    expect(
      getVoteRightPresentation({ isAlive: false, deadVoteUsed: false }),
    ).toEqual({
      label: '유령표 보유',
      state: 'ghost_available',
    });
  });

  it('presents a used dead vote as spent', () => {
    expect(
      getVoteRightPresentation({ isAlive: false, deadVoteUsed: true }),
    ).toEqual({
      label: '유령표 사용',
      state: 'ghost_spent',
    });
  });
});
