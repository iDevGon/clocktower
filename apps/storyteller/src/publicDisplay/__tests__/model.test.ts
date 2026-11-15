import {
  DEFAULT_GAME_SETTINGS,
  type GameState,
  getRoleById,
  type Player,
} from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import {
  createPublicDisplayProjector,
  type PublicDisplaySource,
} from '../model';

function source(): PublicDisplaySource & { gameState: GameState } {
  const players: Player[] = Array.from({ length: 7 }, (_, i) => ({
    id: `p${i}`,
    name: `참가자 ${i}`,
    isAlive: true,
    hasNominatedToday: false,
    hasBeenNominatedToday: false,
    deadVoteUsed: false,
    statuses: [],
    role: getRoleById('baron'),
    alignment: 'evil',
    drunkAs: 'washerwoman',
  }));
  return {
    gameState: {
      id: 'game1',
      phase: 'day',
      daySubPhase: 'discussion',
      day: 1,
      players,
      playerOrder: players.map((p) => p.id).reverse(),
      nominations: [],
      started: true,
      settings: { ...DEFAULT_GAME_SETTINGS },
      bluffRoles: [{ id: 'secret', name: '비밀 블러프' }],
    },
    voteClock: null,
    voteCountdown: null,
    whisperClock: null,
    discussionClock: null,
    nominationClock: null,
    nominationPaused: false,
    defenseClock: null,
    voteConfirmed: {},
    voteResult: null,
    executionCandidate: null,
  };
}

describe('public display projection', () => {
  it('uses the basic distribution and script, independent of assigned roles', () => {
    const input = source();
    input.gameState.settings.excludedRoleIds = ['washerwoman'];
    input.gameState.settings.additionalRoleIds = ['clockmaker'];
    input.gameState.players.push({
      ...input.gameState.players[0],
      id: 'traveller',
      isTraveller: true,
    });
    const view = createPublicDisplayProjector()(input);
    expect(view?.composition).toEqual({
      townsfolk: 5,
      outsider: 0,
      minion: 1,
      demon: 1,
    });
    expect(view?.travellerCount).toBe(1);
    expect(view?.roles.some((r) => r.id === 'washerwoman')).toBe(false);
    expect(view?.roles.some((r) => r.id === 'clockmaker')).toBe(true);
    expect(view?.roles.some((r) => r.id === 'imp')).toBe(true);
    expect(view?.players[0].id).toBe('p6');
    expect(view?.players.at(-1)?.id).toBe('traveller');
  });

  it('only transfers explicitly public fields', () => {
    const view = createPublicDisplayProjector()(source());
    expect(Object.keys(view?.players[0] ?? {}).sort()).toEqual([
      'deadVoteUsed',
      'id',
      'isAlive',
      'isTraveller',
      'name',
    ]);
    expect(JSON.stringify(view)).not.toContain('비밀 블러프');
    expect(JSON.stringify(view)).not.toContain('drunkAs');
    expect(JSON.stringify(view)).not.toContain('alignment');
  });

  it('includes public traveller abilities without including private regular assignments', () => {
    const input = source();
    input.gameState.settings.excludedRoleIds = ['baron'];
    input.gameState.players.push({
      ...input.gameState.players[0],
      id: 't1',
      isTraveller: true,
      role: getRoleById('judge'),
    });
    input.gameState.players.push({
      ...input.gameState.players[0],
      id: 't2',
      isTraveller: true,
      role: getRoleById('judge'),
    });
    const view = createPublicDisplayProjector()(input);
    expect(view?.roles.filter((r) => r.id === 'judge')).toHaveLength(1);
    expect(view?.roles.some((r) => r.id === 'baron')).toBe(false);
  });

  it('keeps deaths and ghost votes at their prior public state throughout the night', () => {
    const project = createPublicDisplayProjector();
    const input = source();
    input.gameState.players[1].isAlive = false;
    project(input);
    input.gameState.phase = 'night';
    project(input);
    input.gameState.players[0].isAlive = false;
    input.gameState.players[1].deadVoteUsed = true;
    let view = project(input);
    expect(view?.players.find((p) => p.id === 'p0')?.isAlive).toBe(true);
    expect(view?.players.find((p) => p.id === 'p1')?.deadVoteUsed).toBe(false);
    input.gameState.phase = 'day';
    view = project(input);
    expect(view?.players.find((p) => p.id === 'p0')?.isAlive).toBe(false);
    expect(view?.players.find((p) => p.id === 'p1')?.deadVoteUsed).toBe(true);
  });

  it('does not reveal night deaths on initial connection or reuse a different game snapshot', () => {
    const input = source();
    input.gameState.phase = 'night';
    input.gameState.players[0].isAlive = false;
    const project = createPublicDisplayProjector();
    expect(project(input)?.players.every((p) => p.isAlive === null)).toBe(true);
    input.gameState.phase = 'day';
    project(input);
    input.gameState.id = 'new-game';
    input.gameState.phase = 'night';
    expect(project(input)?.players.every((p) => p.isAlive === null)).toBe(true);
    expect(project({ ...input, gameState: null })).toBeNull();
  });

  it('shows publicly dead Zombuul and setup players correctly', () => {
    const input = source();
    input.gameState.players[0].statuses = ['zombuul_registers_dead'];
    expect(
      createPublicDisplayProjector()(input)?.players.find((p) => p.id === 'p0')
        ?.isAlive,
    ).toBe(false);
    input.gameState.phase = 'setup';
    expect(
      createPublicDisplayProjector()(input)?.players.every((p) => p.isAlive),
    ).toBe(true);
  });

  it('freezes a paused nomination timer and only shows confirmed votes during voting', () => {
    const input = source();
    input.gameState.daySubPhase = 'nomination';
    input.nominationClock = { startedAt: 1000, durationMs: 10000 };
    const project = createPublicDisplayProjector();
    project(input, 2000);
    input.nominationPaused = true;
    expect(project(input, 4000)?.timer?.remainingMs).toBe(7000);
    expect(project(input, 8000)?.timer?.remainingMs).toBe(7000);
    input.voteConfirmed = { p0: true };
    expect(project(input)?.confirmedVotes).toEqual({});
    input.gameState.phase = 'vote';
    expect(project(input)?.confirmedVotes).toEqual({ p0: true });
  });
});
