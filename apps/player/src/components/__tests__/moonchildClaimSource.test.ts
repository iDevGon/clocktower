import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('app/game.tsx', 'utf8');

describe('Moonchild public claim affordance', () => {
  it('shows the public choice button based on script availability, not the actual role', () => {
    const canUseMoonchild = source.match(
      /const canUseMoonchild =[\s\S]*?;/,
    )?.[0];

    expect(canUseMoonchild).toContain(
      "dictionaryRoleIds.includes('moonchild')",
    );
    expect(canUseMoonchild).not.toContain("effectiveRoleId === 'moonchild'");
  });
});
