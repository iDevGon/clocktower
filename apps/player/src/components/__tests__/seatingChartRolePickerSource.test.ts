import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const gameSource = readFileSync('app/game.tsx', 'utf8');
const seatingSource = readFileSync('src/components/SeatingChart.tsx', 'utf8');

describe('SeatingChart role picker source', () => {
  it('passes edition roles, additional roles, and joined traveller roles to the seating chart', () => {
    expect(gameSource).toContain('seatingRoleOptions');
    expect(gameSource).toContain('getRolesForEdition(setupEditionId)');
    expect(gameSource).toContain('gameSettings?.additionalRoleIds');
    expect(gameSource).toContain('travellerRoleId');
  });

  it('selects role notes from grouped searchable role options', () => {
    expect(seatingSource).toContain('roleOptions');
    expect(seatingSource).toContain('roleSearch');
    expect(seatingSource).toContain('TEAM_ORDER');
    expect(seatingSource).toContain('filteredRoleGroups');
  });
});
