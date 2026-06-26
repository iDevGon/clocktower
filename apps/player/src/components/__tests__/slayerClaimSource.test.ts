import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('app/game.tsx', 'utf8');

describe('Slayer public claim affordance', () => {
  it('shows the public declaration button only when Slayer is in the active script', () => {
    const canUseSlayer = source.match(/const canUseSlayer =[\s\S]*?;/)?.[0];

    expect(canUseSlayer).toContain("dictionaryRoleIds.includes('slayer')");
  });
});
