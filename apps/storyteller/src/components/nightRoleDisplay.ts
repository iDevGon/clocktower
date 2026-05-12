import type { Player } from '@clocktower/shared';

export function getNightRolePlayerNames(
  players: Player[],
  roleId: string,
): string[] {
  return players
    .filter(
      (player) =>
        player.role?.id === roleId ||
        (player.role?.id === 'drunk' && player.drunkAs === roleId) ||
        (player.role?.id === 'philosopher' &&
          player.philosopherGrantedRole === roleId),
    )
    .map((player) => player.name);
}

export function formatNightRoleLabel(
  roleName: string,
  playerNames: string[],
): string {
  if (playerNames.length === 0) return roleName;
  return `${roleName} (${playerNames.join(', ')})`;
}
