import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('app/game.tsx', 'utf8');

describe('Slayer public claim affordance', () => {
  it('shows the public declaration button based on script availability, not the actual role', () => {
    const canUseSlayer = source.match(/const canUseSlayer =[\s\S]*?;/)?.[0];

    expect(canUseSlayer).toContain(
      "dictionarySetup.roleIds.includes('slayer')",
    );
    expect(canUseSlayer).not.toContain("effectiveRoleId === 'slayer'");
    expect(canUseSlayer).not.toContain("role?.id === 'slayer'");
  });
});
