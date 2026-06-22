import type { GameState, Player } from '@clocktower/shared/logic';

function publicRole(player: Player): Player['role'] {
  return player.isTraveller ? player.role : undefined;
}

function isPubliclyAlive(player: Player): boolean {
  return player.isAlive && !player.statuses.includes('zombuul_registers_dead');
}

export function toPublicPlayer(
  player: Player,
  options: { includeOwnFields?: boolean } = {},
): Player {
  const {
    role: _role,
    alignment: _alignment,
    drunkAs: _drunkAs,
    lunaticAs: _lunaticAs,
    travellerAlignment: _travellerAlignment,
    philosopherGrantedRole: _philosopherGrantedRole,
    statuses: _statuses,
    ...publicPlayer
  } = player;

  return {
    ...publicPlayer,
    isAlive: isPubliclyAlive(player),
    role: publicRole(player),
    statuses: [],
    ...(options.includeOwnFields && player.philosopherGrantedRole
      ? { philosopherGrantedRole: player.philosopherGrantedRole }
      : {}),
  };
}

export function toPublicGameState(state: GameState): GameState {
  const { bluffRoles: _bluffRoles, ...publicState } = state;
  return {
    ...publicState,
    players: state.players.map((player) => toPublicPlayer(player)),
  };
}

export function toPublicNightProgress(
  roleId: string | null,
  order: string[],
): { roleId: null; activeIndex: number; order: string[] } {
  return {
    roleId: null,
    activeIndex: roleId ? order.indexOf(roleId) : -1,
    order: order.map((_, index) => `night-step-${index}`),
  };
}
