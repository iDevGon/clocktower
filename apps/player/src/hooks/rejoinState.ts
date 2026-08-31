import type { ClientToServerEvents } from '@clocktower/shared';
import { getRoleById } from '@clocktower/shared';
import type {
  RejoinStatePatch,
  RejoinStateSnapshot,
} from '../stores/playerStore';

type RejoinResponse = Parameters<
  Parameters<ClientToServerEvents['game:rejoin']>[1]
>[0];

export type SuccessfulRejoinResponse = RejoinResponse & { success: true };

export function isMissingRejoinResponse(response: {
  success: boolean;
  error?: string;
}): boolean {
  return (
    !response.success &&
    (response.error === 'game_not_found' ||
      response.error === 'player_not_found')
  );
}

export function buildRejoinStatePatch(
  previous: RejoinStateSnapshot,
  response: SuccessfulRejoinResponse,
): RejoinStatePatch {
  return {
    playerId: previous.playerId,
    playerName: response.playerName ?? previous.playerName,
    role: response.roleId ? (getRoleById(response.roleId) ?? null) : null,
    philosopherGrantedRole: response.philosopherGrantedRole ?? null,
    currentPhase: response.phase ?? 'setup',
    isAlive: response.isAlive ?? true,
    daySubPhase: response.daySubPhase ?? null,
    hasNominatedToday: response.hasNominatedToday ?? false,
    deadVoteUsed: response.deadVoteUsed ?? false,
    nightCount: response.nightCount ?? previous.nightCount,
    nightProgress: response.nightProgress ?? null,
    gamePlayers: response.gamePlayers ?? previous.gamePlayers,
    gameSettings: response.gameSettings ?? null,
    evilInfo: response.evilInfo ?? null,
    butlerMasterName: response.butlerMasterName ?? null,
    nomination: response.nomination ?? null,
    executionCandidate: response.executionCandidate ?? null,
    justDied: false,
    deathReason: null,
    executionAnnouncement: null,
    nightDeathAnnouncement: null,
    slayerFizzle: null,
    rolePromotion: null,
    pendingRolePromotion: null,
  };
}
