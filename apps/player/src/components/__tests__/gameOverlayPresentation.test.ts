import { describe, expect, it } from 'vitest';
import { selectGameOverlay } from '../gameOverlayPresentation';

describe('selectGameOverlay', () => {
  it('returns the highest-priority renderable overlay', () => {
    expect(
      selectGameOverlay({
        currentPhase: 'ended',
        gameResult: true,
        role: true,
        showStartReveal: true,
        rolePromotion: true,
        justDied: true,
        executionAnnouncement: true,
        showNightFall: true,
        showRavenkeeper: true,
        nightDeaths: true,
        slayerFizzle: true,
      }),
    ).toBe('game_end');
    expect(
      selectGameOverlay({
        role: true,
        showStartReveal: true,
        rolePromotion: true,
        justDied: true,
      }),
    ).toBe('start_reveal');
    expect(selectGameOverlay({ rolePromotion: true, justDied: true })).toBe(
      'role_promotion',
    );
    expect(selectGameOverlay({ justDied: true, nightDeaths: true })).toBe(
      'death',
    );
    expect(
      selectGameOverlay({
        executionAnnouncement: true,
        showNightFall: true,
        nightDeaths: true,
      }),
    ).toBe('execution');
    expect(
      selectGameOverlay({ showNightFall: true, showRavenkeeper: true }),
    ).toBe('night_fall');
    expect(
      selectGameOverlay({ showRavenkeeper: true, nightDeaths: true }),
    ).toBe('ravenkeeper');
    expect(selectGameOverlay({ nightDeaths: true, slayerFizzle: true })).toBe(
      'night_deaths',
    );
    expect(selectGameOverlay({ slayerFizzle: true })).toBe('slayer_fizzle');
    expect(selectGameOverlay({})).toBe('none');
  });

  it('skips overlays whose required data is not renderable', () => {
    expect(
      selectGameOverlay({
        currentPhase: 'ended',
        gameResult: true,
        role: false,
        executionAnnouncement: true,
      }),
    ).toBe('none');
    expect(
      selectGameOverlay({ showStartReveal: true, role: false, justDied: true }),
    ).toBe('death');
    expect(
      selectGameOverlay({
        currentPhase: 'ended',
        gameResult: true,
        role: true,
        gameEndDismissed: true,
        executionAnnouncement: true,
      }),
    ).toBe('none');
  });

  it('defers a personal Slayer death until voting ends', () => {
    expect(
      selectGameOverlay({
        currentPhase: 'vote',
        justDied: true,
        deathReason: 'slayer',
      }),
    ).toBe('none');
    expect(
      selectGameOverlay({
        currentPhase: 'day',
        justDied: true,
        deathReason: 'slayer',
      }),
    ).toBe('death');
  });

  it('defers another player Slayer execution until voting ends', () => {
    expect(
      selectGameOverlay({
        currentPhase: 'vote',
        executionAnnouncement: true,
        executionReason: 'slayer',
      }),
    ).toBe('none');
    expect(
      selectGameOverlay({
        currentPhase: 'day',
        executionAnnouncement: true,
        executionReason: 'slayer',
      }),
    ).toBe('execution');
  });

  it('defers a Slayer fizzle until voting ends', () => {
    expect(
      selectGameOverlay({ currentPhase: 'vote', slayerFizzle: true }),
    ).toBe('none');
    expect(selectGameOverlay({ currentPhase: 'day', slayerFizzle: true })).toBe(
      'slayer_fizzle',
    );
  });

  it('does not defer non-Slayer deaths during voting', () => {
    expect(
      selectGameOverlay({
        currentPhase: 'vote',
        justDied: true,
        deathReason: 'night_kill',
      }),
    ).toBe('death');
    expect(
      selectGameOverlay({
        currentPhase: 'vote',
        executionAnnouncement: true,
        executionReason: 'execution',
      }),
    ).toBe('execution');
  });
});
