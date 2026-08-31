import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/phases/NightPhase.tsx', 'utf8');

describe('NightPhase privacy boundary', () => {
  it('hides role-order progress while preserving the private action prompt', () => {
    expect(source).not.toContain("from '../NightProgress'");
    expect(source).not.toContain('<NightProgress');
    expect(source).toContain('<NightActionPrompt');
    expect(source).toContain('isMyTurn');
    expect(source).toContain('players={nightProgress.players}');
  });
});
