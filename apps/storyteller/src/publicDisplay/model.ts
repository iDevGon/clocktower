import {
  getActiveRoles,
  getBaseRoleCounts,
  type Phase,
} from '@clocktower/shared';
import type { useGameStore } from '../stores/gameStore';

export type PublicDisplaySource = Pick<
  ReturnType<typeof useGameStore.getState>,
  | 'gameState'
  | 'voteClock'
  | 'voteCountdown'
  | 'whisperClock'
  | 'discussionClock'
  | 'nominationClock'
  | 'nominationPaused'
  | 'defenseClock'
  | 'voteConfirmed'
  | 'voteResult'
  | 'executionCandidate'
>;

export interface PublicPlayer {
  id: string;
  name: string;
  isAlive: boolean | null;
  deadVoteUsed: boolean | null;
  isTraveller: boolean;
}

export interface PublicDisplayModel {
  gameId: string;
  day: number;
  phase: Phase;
  phaseLabel: string;
  players: PublicPlayer[];
  composition: ReturnType<typeof getBaseRoleCounts>;
  regularCount: number;
  travellerCount: number;
  roles: { id: string; name: string; team: string; ability: string }[];
  timer: { endsAt: number; paused: boolean; remainingMs: number } | null;
  nomination: { nominator: string; nominee: string } | null;
  confirmedVotes: Record<string, boolean>;
  voteResult: { nomineeName: string; guiltyVoters: number } | null;
  executionCandidate: { name: string; guiltyVotes: number } | null;
}

const PHASE_LABELS = {
  setup: '게임 준비',
  night: '밤',
  day: '낮',
  vote: '투표',
  ended: '게임 종료',
};
const DAY_LABELS = {
  whisper: '밀담',
  discussion: '토론',
  nomination: '지명',
  defense: '변론',
};

/** Keep the last public seating state; never derive night changes from the grimoire. */
export function createPublicDisplayProjector() {
  let previous: PublicDisplayModel | null = null;
  return (
    source: PublicDisplaySource,
    now = Date.now(),
  ): PublicDisplayModel | null => {
    const game = source.gameState;
    if (!game) {
      previous = null;
      return null;
    }
    if (previous?.gameId !== game.id) previous = null;
    const priorPlayers = new Map(previous?.players.map((p) => [p.id, p]));
    const byId = new Map(game.players.map((p) => [p.id, p]));
    const order = [
      ...new Set([...game.playerOrder, ...game.players.map((p) => p.id)]),
    ];
    const players = order.flatMap((id): PublicPlayer[] => {
      const player = byId.get(id);
      if (!player) return [];
      const prior = priorPlayers.get(id);
      return [
        {
          id,
          name: player.name,
          isTraveller: !!player.isTraveller,
          isAlive:
            game.phase === 'night'
              ? (prior?.isAlive ?? null)
              : game.phase === 'setup' ||
                (player.isAlive &&
                  !player.statuses.includes('zombuul_registers_dead')),
          deadVoteUsed:
            game.phase === 'night'
              ? (prior?.deadVoteUsed ?? null)
              : game.phase === 'setup'
                ? false
                : player.deadVoteUsed,
        },
      ];
    });
    const regularCount = players.filter((p) => !p.isTraveller).length;
    const clock =
      game.phase === 'vote'
        ? (source.voteClock ?? source.voteCountdown)
        : game.phase !== 'day'
          ? null
          : game.daySubPhase === 'whisper'
            ? source.whisperClock
            : game.daySubPhase === 'discussion'
              ? source.discussionClock
              : game.daySubPhase === 'nomination'
                ? source.nominationClock
                : game.daySubPhase === 'defense'
                  ? source.defenseClock
                  : null;
    const paused =
      game.phase === 'day' &&
      game.daySubPhase === 'nomination' &&
      source.nominationPaused;
    const endsAt = clock ? clock.startedAt + clock.durationMs : 0;
    const remainingMs =
      paused && previous?.timer?.paused && previous.timer.endsAt === endsAt
        ? previous.timer.remainingMs
        : Math.max(0, endsAt - now);
    const nomination =
      game.phase === 'vote' || game.phase === 'day'
        ? game.nominations.at(-1)
        : null;
    const candidate =
      game.phase === 'vote' || game.phase === 'day'
        ? source.executionCandidate
        : null;
    const roles = new Map(
      getActiveRoles({
        editionId: game.settings.setupEditionId,
        excludedRoleIds: game.settings.excludedRoleIds,
        additionalRoleIds: game.settings.additionalRoleIds,
      }).map((role) => [role.id, role]),
    );
    for (const player of game.players) {
      if (player.isTraveller && player.role?.team === 'traveller') {
        roles.set(player.role.id, player.role);
      }
    }
    previous = {
      gameId: game.id,
      day: game.day,
      phase: game.phase,
      phaseLabel:
        game.phase === 'day' && game.daySubPhase
          ? `낮 · ${DAY_LABELS[game.daySubPhase]}`
          : PHASE_LABELS[game.phase],
      players,
      regularCount,
      travellerCount: players.length - regularCount,
      composition: getBaseRoleCounts(regularCount),
      roles: [...roles.values()].map(({ id, name, team, ability }) => ({
        id,
        name,
        team,
        ability,
      })),
      timer: clock ? { endsAt, paused, remainingMs } : null,
      nomination: nomination
        ? {
            nominator: byId.get(nomination.nominatorId)?.name ?? '참가자',
            nominee: byId.get(nomination.nomineeId)?.name ?? '참가자',
          }
        : null,
      confirmedVotes:
        game.phase === 'vote'
          ? Object.fromEntries(
              Object.entries(source.voteConfirmed).filter(([id]) =>
                byId.has(id),
              ),
            )
          : {},
      voteResult:
        source.voteResult && (game.phase === 'vote' || game.phase === 'day')
          ? {
              nomineeName: source.voteResult.nomineeName,
              guiltyVoters: Object.values(source.voteResult.votes).filter(
                Boolean,
              ).length,
            }
          : null,
      executionCandidate: candidate
        ? { name: candidate.playerName, guiltyVotes: candidate.guiltyVotes }
        : null,
    };
    return previous;
  };
}
