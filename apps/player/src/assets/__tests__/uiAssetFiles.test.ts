import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { NATIVE_UI_ASSET_FILES, WEB_UI_ASSET_FILES } from '../uiAssetFiles';

const assetSourceDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readAssetSource(filename: string): string {
  return readFileSync(resolve(assetSourceDir, filename), 'utf8');
}

describe('player runtime UI assets', () => {
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

  it('web asset loader only statically requires webp files', () => {
    const source = readAssetSource('ui.web.ts');
    expect(source).toContain('.webp');
    expect(source).not.toContain('.png');
  });

  it('native asset loader only statically requires png files', () => {
    const source = readAssetSource('ui.native.ts');
    expect(source).toContain('.png');
    expect(source).not.toContain('.webp');
  });

  it('shared asset facade does not statically require image files', () => {
    const source = readAssetSource('ui.ts');
    expect(source).not.toContain('require(');
    expect(source).not.toContain('.png');
    expect(source).not.toContain('.webp');
  });
});
