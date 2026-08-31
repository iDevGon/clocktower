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
});
