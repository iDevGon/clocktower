import { describe, expect, it } from 'vitest';
import {
  getSeatingPlayerPresentation,
  getVoteRightPresentation,
  shouldCaptureDeadBeforeNightSnapshot,
} from '../seatingPresentation';

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

describe('getSeatingPlayerPresentation', () => {
  it('keeps a player who newly died during the night publicly alive', () => {
    expect(
      getSeatingPlayerPresentation({
        phase: 'night',
        isAlive: false,
        deadVoteUsed: false,
        wasDeadBeforeNight: false,
      }),
    ).toEqual({
      showDeath: false,
      voteRight: { label: '투표 가능', state: 'alive' },
    });
  });

  it('shows a player who was dead before the night as dead', () => {
    expect(
      getSeatingPlayerPresentation({
        phase: 'night',
        isAlive: false,
        deadVoteUsed: false,
        wasDeadBeforeNight: true,
      }),
    ).toEqual({
      showDeath: true,
      voteRight: { label: '유령표 보유', state: 'ghost_available' },
    });
  });

  it('uses server life and vote state outside night and setup', () => {
    expect(
      getSeatingPlayerPresentation({
        phase: 'day',
        isAlive: false,
        deadVoteUsed: true,
        wasDeadBeforeNight: false,
      }),
    ).toEqual({
      showDeath: true,
      voteRight: { label: '유령표 사용', state: 'ghost_spent' },
    });
  });

  it('keeps setup seating publicly alive', () => {
    expect(
      getSeatingPlayerPresentation({
        phase: 'setup',
        isAlive: false,
        deadVoteUsed: true,
        wasDeadBeforeNight: false,
      }),
    ).toEqual({
      showDeath: false,
      voteRight: { label: '투표 가능', state: 'alive' },
    });
  });
});

describe('shouldCaptureDeadBeforeNightSnapshot', () => {
  it('captures on night entry and initial night mount only', () => {
    expect(shouldCaptureDeadBeforeNightSnapshot(null, 'night')).toBe(true);
    expect(shouldCaptureDeadBeforeNightSnapshot('day', 'night')).toBe(true);
    expect(shouldCaptureDeadBeforeNightSnapshot('night', 'night')).toBe(false);
    expect(shouldCaptureDeadBeforeNightSnapshot('night', 'day')).toBe(false);
  });
});
