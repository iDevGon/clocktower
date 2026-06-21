import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/NightActionPrompt.tsx', 'utf8');

describe('NightActionPrompt player list scrolling', () => {
  it('keeps the night action player list scrollable inside the game screen scroll view', () => {
    const playerScroll = source.match(
      /<ScrollView[\s\S]*?style=\{styles\.playerScroll\}[\s\S]*?>/,
    )?.[0];

    expect(playerScroll).toContain('nestedScrollEnabled');
  });
});

describe('NightActionPrompt allowed target counts', () => {
  it('uses allowedTargetCounts when deciding whether a submission is complete', () => {
    expect(source).toContain('allowedTargetCounts');
    expect(source).toContain('allowedTargetCounts.includes(selected.length)');
  });

  it('uses the largest allowed target count as the selection cap', () => {
    expect(source).toContain('Math.max(...allowedTargetCounts)');
  });

  it('supports roles that can only target dead players', () => {
    expect(source).toContain('actionDef.deadTargetsOnly');
    expect(source).toContain('return !p.isAlive');
  });
});
