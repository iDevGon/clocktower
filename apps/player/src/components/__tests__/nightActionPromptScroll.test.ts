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
