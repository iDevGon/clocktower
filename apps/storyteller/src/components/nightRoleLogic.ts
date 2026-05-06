import type { NightAction, Player, PlayerStatus } from '@clocktower/shared';
import { hasPoisonStatus } from '@clocktower/shared';

const DEMON_KILL_ROLES = new Set([
  'imp',
  'fang_gu',
  'vigormortis',
  'no_dashii',
  'vortox',
]);

function isSoberHealthy(player: Pick<Player, 'role' | 'statuses'>): boolean {
  return (
    player.role?.id === 'beggar' ||
    player.statuses.includes('barista_sober_healthy')
  );
}

export function isAbilityMalfunctioning(
  player?: Pick<Player, 'role' | 'statuses'> | null,
): boolean {
  if (!player || isSoberHealthy(player)) return false;
  return (
    player.role?.id === 'drunk' ||
    player.statuses.includes('drunk') ||
    hasPoisonStatus(player.statuses)
  );
}

export function getEffectiveAlignment(player: Player): 'good' | 'evil' | null {
  if (player.isTraveller) return player.travellerAlignment ?? null;
  if (player.alignment) return player.alignment;
  if (player.role?.team === 'townsfolk' || player.role?.team === 'outsider') {
    return 'good';
  }
  if (player.role?.team === 'minion' || player.role?.team === 'demon') {
    return 'evil';
  }
  return null;
}

export function isDetectedAsEvil(player: Player): boolean {
  if (player.statuses.includes('misregistered')) {
    if (player.role?.id === 'recluse') return true;
    if (player.role?.id === 'spy') return false;
  }
  return getEffectiveAlignment(player) === 'evil';
}

export function getEmpathHint(
  players: Player[],
  playerOrder: string[],
): {
  neighborIds: Set<string>;
  neighbors: { id: string; name: string; isEvil: boolean }[];
  evilCount: number;
} {
  const empathPlayer = players.find(
    (p) =>
      p.role?.id === 'empath' ||
      (p.role?.id === 'drunk' && p.drunkAs === 'empath'),
  );
  if (!empathPlayer || empathPlayer.role?.id === 'drunk') {
    return { neighborIds: new Set(), neighbors: [], evilCount: 0 };
  }

  const order = playerOrder.length > 0 ? playerOrder : players.map((p) => p.id);
  const playerById = new Map(players.map((p) => [p.id, p]));
  const empathIndex = order.indexOf(empathPlayer.id);
  if (empathIndex === -1)
    return { neighborIds: new Set(), neighbors: [], evilCount: 0 };

  const neighbors: { id: string; name: string; isEvil: boolean }[] = [];

  for (let i = 1; i < order.length; i++) {
    const player = playerById.get(order[(empathIndex + i) % order.length]);
    if (player?.isAlive) {
      neighbors.push({
        id: player.id,
        name: player.name,
        isEvil: isDetectedAsEvil(player),
      });
      break;
    }
  }

  for (let i = 1; i < order.length; i++) {
    const player = playerById.get(
      order[(empathIndex - i + order.length) % order.length],
    );
    if (player?.isAlive) {
      if (neighbors[0]?.id === player.id) break;
      neighbors.push({
        id: player.id,
        name: player.name,
        isEvil: isDetectedAsEvil(player),
      });
      break;
    }
  }

  return {
    neighborIds: new Set(neighbors.map((n) => n.id)),
    neighbors,
    evilCount: neighbors.filter((n) => n.isEvil).length,
  };
}

export function getChefHint(
  players: Player[],
  playerOrder: string[],
): {
  evilPairIds: Set<string>;
  evilPairCount: number;
  evilPairNames: string[][];
} {
  const chefPlayer = players.find(
    (p) =>
      p.role?.id === 'chef' || (p.role?.id === 'drunk' && p.drunkAs === 'chef'),
  );
  if (!chefPlayer || chefPlayer.role?.id === 'drunk') {
    return { evilPairIds: new Set(), evilPairCount: 0, evilPairNames: [] };
  }

  const order = playerOrder.length > 0 ? playerOrder : players.map((p) => p.id);
  if (order.length < 2) {
    return { evilPairIds: new Set(), evilPairCount: 0, evilPairNames: [] };
  }

  const playerById = new Map(players.map((p) => [p.id, p]));
  const evilPairIds = new Set<string>();
  const evilPairNames: string[][] = [];

  for (let i = 0; i < order.length; i++) {
    const current = playerById.get(order[i]);
    const next = playerById.get(order[(i + 1) % order.length]);
    if (
      current &&
      next &&
      isDetectedAsEvil(current) &&
      isDetectedAsEvil(next)
    ) {
      evilPairIds.add(current.id);
      evilPairIds.add(next.id);
      evilPairNames.push([current.name, next.name]);
    }
  }

  return {
    evilPairIds,
    evilPairCount: evilPairNames.length,
    evilPairNames,
  };
}

export type KillActionBlockReason =
  | 'actor_malfunctioning'
  | 'soldier'
  | 'protected';

export function getKillActionBlockReason(
  roleId: string,
  actor: Player | undefined,
  target: Player | undefined,
  targetStatuses?: PlayerStatus[],
): KillActionBlockReason | null {
  if (!DEMON_KILL_ROLES.has(roleId)) return null;
  if (isAbilityMalfunctioning(actor)) return 'actor_malfunctioning';
  if (!target) return null;
  if (target.role?.id === 'soldier' && !isAbilityMalfunctioning(target)) {
    return 'soldier';
  }
  const statuses = targetStatuses ?? target.statuses;
  if (statuses.includes('protected')) return 'protected';
  return null;
}

export function getActionTargetKey(
  action: Pick<NightAction, 'playerId' | 'roleId'>,
  index: number,
  targetId: string,
): string {
  return `${index}:${action.playerId}:${action.roleId}:${targetId}`;
}
