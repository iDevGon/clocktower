import { readFileSync } from 'node:fs';
import type { GameSettings, Player } from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import { buildGameScriptRoles } from '../feedback/useGameEditionRoles';

function player(id: string, roleId: string, isTraveller = false): Player {
  const role = getRoleById(roleId);
  if (!role) throw new Error(`missing role ${roleId}`);
  return {
    id,
    name: id,
    role,
    isAlive: true,
    hasNominatedToday: false,
    hasBeenNominatedToday: false,
    deadVoteUsed: false,
    statuses: [],
    isTraveller,
  };
}

const settings: GameSettings = {
  setupEditionId: 'trouble_brewing',
  additionalRoleIds: ['dreamer'],
  excludedRoleIds: ['imp'],
  showVoteHistory: true,
  whisperMode: 'chat',
  votingMode: 'online',
  voteClockSeconds: 3,
  whisperClockSeconds: 0,
  discussionClockSeconds: 0,
  nominationClockSeconds: 0,
  defenseClockSeconds: 0,
};

describe('buildGameScriptRoles', () => {
  it('제외 역할을 빼고 다른 에디션 추가 역할과 참가 여행자를 중복 없이 반환한다', () => {
    const roles = buildGameScriptRoles(
      [
        player('p1', 'imp'),
        player('p2', 'dreamer'),
        player('t1', 'judge', true),
        player('t2', 'judge', true),
      ],
      settings,
    );
    const roleIds = roles.map((role) => role.id);

    expect(roleIds).not.toContain('imp');
    expect(roleIds).toContain('dreamer');
    expect(roleIds).toContain('judge');
    expect(roleIds.filter((roleId) => roleId === 'judge')).toHaveLength(1);
  });
});

describe('dictionary setup source', () => {
  it('keeps the storyteller dictionary ungrouped while filtering roles from game settings', () => {
    const source = readFileSync('app/game/grimoire.tsx', 'utf8');

    expect(source).toContain('groupRolesByTeam={false}');
    expect(source).toContain('roleIds={dictionarySetup.roleIds}');
  });
});
