import { describe, expect, it } from 'vitest';
import { GameManager } from '../game.js';

function createGame(roleIds: string[]) {
  const game = new GameManager();
  game.create();
  const players = roleIds.map((roleId, index) => {
    const player = game.addPlayer(`Player${index}`);
    if (!player) throw new Error('테스트 플레이어 생성 실패');
    game.assignRole(player.id, roleId);
    return player;
  });
  expect(game.start().success).toBe(true);
  return { game, players };
}

const roles = ['washerwoman', 'empath', 'chef', 'scarlet_woman', 'imp'];

describe('승리 및 승계 회귀', () => {
  it.each([
    'imp',
    'vortox',
  ])('정확히 5명에서 %s가 죽으면 탕녀가 같은 악마를 승계한다', (demonRole) => {
    const { game, players } = createGame([...roles.slice(0, 4), demonRole]);
    game.kill(players[4].id);
    expect(game.checkWinCondition()).toBeNull();
    expect(game.getPlayer(players[3].id)?.role?.id).toBe(demonRole);
    expect(game.consumePromotedPlayer()?.id).toBe(players[3].id);
  });

  it('6명에서 보르톡스가 죽어도 탕녀가 임프로 바뀌지 않는다', () => {
    const { game, players } = createGame([
      ...roles.slice(0, 4),
      'vortox',
      'librarian',
    ]);
    game.kill(players[4].id);
    expect(game.checkWinCondition()).toBeNull();
    expect(game.getPlayer(players[3].id)?.role?.id).toBe('vortox');
  });

  it('4명에서 악마가 죽으면 탕녀가 승계하지 않는다', () => {
    const { game, players } = createGame(roles);
    game.kill(players[0].id);
    game.kill(players[4].id);
    expect(game.checkWinCondition()?.winningTeam).toBe('good');
    expect(game.getPlayer(players[3].id)?.role?.id).toBe('scarlet_woman');
  });

  it('중독된 탕녀는 악마 사망 시 승계하지 않는다', () => {
    const { game, players } = createGame(roles);
    game.setPlayerStatuses(players[3].id, ['poisoned']);
    game.kill(players[4].id);
    expect(game.checkWinCondition()?.winningTeam).toBe('good');
    expect(game.getPlayer(players[3].id)?.role?.id).toBe('scarlet_woman');
  });

  it('다른 악마가 살아있으면 사망한 악마의 탕녀 승계를 다음 사망에 적용하지 않는다', () => {
    const { game, players } = createGame([...roles, 'vortox']);
    game.kill(players[4].id);
    expect(game.checkWinCondition()).toBeNull();
    game.kill(players[0].id);
    game.kill(players[5].id);
    expect(game.checkWinCondition()?.winningTeam).toBe('good');
  });

  it('임프 자해는 먼저 등록된 하수인보다 건강한 탕녀가 우선 승계한다', () => {
    const { game, players } = createGame([
      'washerwoman',
      'empath',
      'poisoner',
      'scarlet_woman',
      'imp',
    ]);
    game.recordNightAction(players[4].id, [players[4].id]);
    game.kill(players[4].id);
    game.handleImpSelfKill(players[4].id);
    expect(game.checkWinCondition()).toBeNull();
    game.flushImpPromotion();
    expect(game.getPlayer(players[3].id)?.role?.id).toBe('imp');
    expect(game.getPlayer(players[2].id)?.role?.id).toBe('poisoner');
  });

  it('중독된 탕녀는 임프 자해 우선 승계 대상이 아니다', () => {
    const { game, players } = createGame([
      'washerwoman',
      'empath',
      'poisoner',
      'scarlet_woman',
      'imp',
    ]);
    game.setPlayerStatuses(players[3].id, ['poisoned']);
    game.recordNightAction(players[4].id, [players[4].id]);
    game.kill(players[4].id);
    game.handleImpSelfKill(players[4].id);
    expect(game.checkWinCondition()).toBeNull();
    expect(game.flushImpPromotion()?.id).toBe(players[2].id);
    expect(game.getPlayer(players[3].id)?.role?.id).toBe('scarlet_woman');
  });

  it.each([
    'day',
    'night',
  ] as const)('중복 %s 전환은 날짜와 밤 행동 기록을 유지한다', (phase) => {
    const { game, players } = createGame(roles);
    game.setPhase(phase);
    const day = game.getState().day;
    game.recordNightAction(players[4].id, [players[4].id]);
    game.setPhase(phase);
    expect(game.getState().day).toBe(day);
    expect(game.handleImpSelfKill(players[4].id)).toBe(true);
  });
});
