import type { Player } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import {
  buildManualSpyGrimoireEntries,
  createAutoFakeSpyGrimoireEntries,
} from '../spyGrimoire';

function player(
  overrides: Partial<Player> & { id: string; name: string },
): Player {
  return {
    ...overrides,
    id: overrides.id,
    name: overrides.name,
    isAlive: overrides.isAlive ?? true,
    hasNominatedToday: false,
    hasBeenNominatedToday: false,
    deadVoteUsed: false,
    statuses: overrides.statuses ?? [],
  };
}

const players: Player[] = [
  player({
    id: 'p1',
    name: '영희',
    role: {
      id: 'spy',
      name: '첩자',
      team: 'minion',
      ability: '',
      edition: 'trouble_brewing',
    },
    statuses: ['poisoned'],
  }),
  player({
    id: 'p2',
    name: '철수',
    role: {
      id: 'washerwoman',
      name: '세탁부',
      team: 'townsfolk',
      ability: '',
      edition: 'trouble_brewing',
    },
  }),
  player({
    id: 'p3',
    name: '민수',
    role: {
      id: 'imp',
      name: '임프',
      team: 'demon',
      ability: '',
      edition: 'trouble_brewing',
    },
  }),
];

describe('spyGrimoire', () => {
  it('builds manual grimoire entries from selected role ids', () => {
    expect(
      buildManualSpyGrimoireEntries(players, {
        p1: 'washerwoman',
        p2: 'spy',
        p3: 'soldier',
      }),
    ).toEqual([
      {
        name: '영희',
        roleName: '세탁부',
        team: 'townsfolk',
        isAlive: true,
        statuses: [],
      },
      {
        name: '철수',
        roleName: '첩자',
        team: 'minion',
        isAlive: true,
        statuses: [],
      },
      {
        name: '민수',
        roleName: '군인',
        team: 'townsfolk',
        isAlive: true,
        statuses: [],
      },
    ]);
  });

  it('creates an automatic fake grimoire without matching real roles when possible', () => {
    const entries = createAutoFakeSpyGrimoireEntries(players);

    expect(entries).toHaveLength(players.length);
    entries.forEach((entry, index) => {
      expect(entry.name).toBe(players[index].name);
      expect(entry.roleName).not.toBe(players[index].role?.name);
      expect(entry.statuses).toEqual([]);
    });
  });
});
