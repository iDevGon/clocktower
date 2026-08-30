import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/SeatingChart.tsx', 'utf8');
const gameSource = readFileSync(resolve(process.cwd(), 'app/game.tsx'), 'utf8');

describe('SeatingChart layout sizing', () => {
  it('uses live window dimensions instead of caching the screen size at module load', () => {
    expect(source).toContain('useWindowDimensions');
    expect(source).not.toContain("Dimensions.get('window')");
  });

  it('does not shrink the seating ring from a small window-height ratio', () => {
    expect(source).not.toContain('SCREEN.height * 0.55');
    expect(source).not.toContain('windowHeight * 0.55');
  });

  it('passes the synchronized vote-history visibility with a true fallback', () => {
    expect(gameSource).toMatch(
      /<SeatingChart[\s\S]*showVoteHistory=\{gameSettings\?\.showVoteHistory \?\? true\}/,
    );
  });
});
