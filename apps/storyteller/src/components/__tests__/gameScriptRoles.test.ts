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
  additionalRoleIds: ['sweetheart'],
  whisperMode: 'chat',
  votingMode: 'online',
  voteClockSeconds: 3,
  whisperClockSeconds: 0,
  discussionClockSeconds: 0,
  nominationClockSeconds: 0,
  defenseClockSeconds: 0,
};

describe('buildGameScriptRoles', () => {
  it('현재 에디션, 추가 역할, 참가 여행자만 역할 후보로 반환한다', () => {
    const roles = buildGameScriptRoles(
      [
        player('p1', 'imp'),
        player('p2', 'sweetheart'),
        player('t1', 'judge', true),
      ],
      settings,
    );
    const roleIds = roles.map((role) => role.id);

    expect(roleIds).toContain('imp');
    expect(roleIds).toContain('sweetheart');
    expect(roleIds).toContain('judge');
    expect(roleIds).not.toContain('dreamer');
  });
});
