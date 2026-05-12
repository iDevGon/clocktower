import type { Player } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import {
  formatNightRoleLabel,
  getNightRolePlayerNames,
} from '../nightRoleDisplay';

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

describe('nightRoleDisplay', () => {
  it('formats active night role with player names', () => {
    expect(formatNightRoleLabel('첩자', ['영희'])).toBe('첩자 (영희)');
    expect(formatNightRoleLabel('수도사', [])).toBe('수도사');
  });

  it('finds real, drunk-as, and philosopher-granted role holders', () => {
    const players = [
      player({
        id: 'real-spy',
        name: '영희',
        role: {
          id: 'spy',
          name: '첩자',
          team: 'minion',
          ability: '',
          edition: 'trouble_brewing',
        },
      }),
      player({
        id: 'drunk-spy',
        name: '철수',
        role: {
          id: 'drunk',
          name: '주정뱅이',
          team: 'outsider',
          ability: '',
          edition: 'trouble_brewing',
        },
        drunkAs: 'spy',
      }),
      player({
        id: 'philo-spy',
        name: '민수',
        role: {
          id: 'philosopher',
          name: '철학자',
          team: 'townsfolk',
          ability: '',
          edition: 'sects_and_violets',
        },
        philosopherGrantedRole: 'spy',
      }),
    ];

    expect(getNightRolePlayerNames(players, 'spy')).toEqual([
      '영희',
      '철수',
      '민수',
    ]);
  });
});
