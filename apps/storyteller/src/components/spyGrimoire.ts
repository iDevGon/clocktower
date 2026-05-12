import type { NightFeedbackPayload, Player } from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';

type GrimoireEntry = Extract<
  NightFeedbackPayload,
  { type: 'grimoire' }
>['entries'][number];

export type SpyGrimoireSelections = Record<string, string | undefined>;

function roleForSelection(roleId?: string) {
  return roleId ? getRoleById(roleId) : null;
}

export function buildManualSpyGrimoireEntries(
  players: Player[],
  selections: SpyGrimoireSelections,
): GrimoireEntry[] {
  return players.map((player) => {
    const role = roleForSelection(selections[player.id]);
    return {
      name: player.name,
      roleName: role?.name ?? '???',
      team: role?.team ?? 'townsfolk',
      isAlive: player.isAlive,
      statuses: [],
    };
  });
}

export function createAutoFakeSpyGrimoireSelections(
  players: Player[],
): SpyGrimoireSelections {
  const actualRoleIds = players.map((player) => player.role?.id);
  if (actualRoleIds.length <= 1) {
    return Object.fromEntries(
      players.map((player) => [player.id, actualRoleIds[0]]),
    );
  }

  for (let offset = 1; offset < actualRoleIds.length; offset += 1) {
    const shifted = actualRoleIds.map(
      (_, index) => actualRoleIds[(index + offset) % actualRoleIds.length],
    );
    if (shifted.every((roleId, index) => roleId !== actualRoleIds[index])) {
      return Object.fromEntries(
        players.map((player, index) => [player.id, shifted[index]]),
      );
    }
  }

  const reversed = [...actualRoleIds].reverse();
  return Object.fromEntries(
    players.map((player, index) => [player.id, reversed[index]]),
  );
}

export function createAutoFakeSpyGrimoireEntries(
  players: Player[],
): GrimoireEntry[] {
  return buildManualSpyGrimoireEntries(
    players,
    createAutoFakeSpyGrimoireSelections(players),
  );
}
