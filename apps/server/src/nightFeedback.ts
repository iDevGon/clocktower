import type { NightFeedbackPayload, Player } from '@clocktower/shared/logic';
import { hasPoisonStatus } from '@clocktower/shared/logic';

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
    player.statuses.some(
      (status) => status === 'drunk' || status.endsWith('_drunk'),
    ) ||
    hasPoisonStatus(player.statuses)
  );
}

export function buildTrueGrimoireFeedback(
  players: Player[],
): Extract<NightFeedbackPayload, { type: 'grimoire' }> {
  return {
    type: 'grimoire',
    entries: players.map((player) => ({
      name: player.name,
      roleName: player.role?.name ?? '???',
      team: player.role?.team ?? 'townsfolk',
      isAlive: player.isAlive,
      statuses: player.statuses ?? [],
    })),
  };
}

export function shouldAutoSendSpyGrimoire(
  spyPlayer?: Player | null,
): spyPlayer is Player {
  return spyPlayer?.isAlive === true && !isAbilityMalfunctioning(spyPlayer);
}
