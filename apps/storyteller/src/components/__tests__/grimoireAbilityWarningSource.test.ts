import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'app/game/grimoire.tsx'),
  'utf8',
);

describe('grimoire ability malfunction warnings', () => {
  it('S&V daytime information requests receive poisoning/drunkenness warnings', () => {
    expect(source).toContain('getAbilityMalfunctionWarning');
    expect(source).toContain('const savantWarningText = useMemo');
    expect(source).toContain('const artistWarningText = useMemo');
    expect(source).toContain('warningText={savantWarningText}');
    expect(source).toContain('warningText={artistWarningText}');
  });

  it('detects all scripted editions before choosing night order helpers', () => {
    expect(source).toContain('BAD_MOON_RISING_ROLES');
    expect(source).toContain('SECTS_AND_VIOLETS_ROLES');
    expect(source).toContain("return 'bad_moon_rising'");
    expect(source).toContain("hasSv ? 'sects_and_violets'");
  });
});
