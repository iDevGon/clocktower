import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'app/game.tsx'), 'utf8');

describe('player nomination target source', () => {
  it('allows dead players to be nominated while keeping travellers excluded', () => {
    expect(source).toContain(
      'gamePlayers.filter((p) => p.id !== playerId && !p.isTraveller)',
    );
    expect(source).not.toContain(
      'p.isAlive && p.id !== playerId && !p.isTraveller',
    );
  });
});
