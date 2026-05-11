import { describe, expect, it } from 'vitest';
import { NATIVE_UI_ASSET_FILES, WEB_UI_ASSET_FILES } from '../uiAssetFiles';

describe('storyteller runtime UI assets', () => {
  it('native app uses png fallbacks for critical visible UI images', () => {
    expect(NATIVE_UI_ASSET_FILES.arcaneUiSprite).toBe('arcane-ui-sprite.png');
    expect(NATIVE_UI_ASSET_FILES.voteClockFace).toBe('vote-clock-face.png');
    expect(NATIVE_UI_ASSET_FILES.voteClockHand).toBe('vote-clock-hand.png');
    expect(NATIVE_UI_ASSET_FILES.voteHandRaised).toBe('vote-hand-raised.png');
    expect(NATIVE_UI_ASSET_FILES.voteHandDown).toBe('vote-hand-down.png');
  });

  it('web keeps optimized webp runtime images', () => {
    expect(WEB_UI_ASSET_FILES.arcaneUiSprite).toBe('arcane-ui-sprite.webp');
    expect(WEB_UI_ASSET_FILES.voteClockFace).toBe('vote-clock-face.webp');
    expect(WEB_UI_ASSET_FILES.voteClockHand).toBe('vote-clock-hand.webp');
    expect(WEB_UI_ASSET_FILES.voteHandRaised).toBe('vote-hand-raised.webp');
    expect(WEB_UI_ASSET_FILES.voteHandDown).toBe('vote-hand-down.webp');
  });
});
