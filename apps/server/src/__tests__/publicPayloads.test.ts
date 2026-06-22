import type { Player } from '@clocktower/shared/logic';
import { describe, expect, it } from 'vitest';
import { toPublicPlayer } from '../handlers/publicPayloads.js';

function player(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Player1',
    isAlive: true,
    hasNominatedToday: false,
    hasBeenNominatedToday: false,
    deadVoteUsed: false,
    statuses: [],
    ...overrides,
  };
}

describe('public payloads', () => {
  it('플레이어 공개 갱신은 비공개 역할과 상태를 숨긴다', () => {
    const payload = toPublicPlayer(
      player({
        role: {
          id: 'empath',
          name: '초공감자',
          team: 'townsfolk',
          ability: '매일 밤 이웃 생존자 2명 중 몇 명이나 악한지를 알게 됩니다.',
          edition: 'trouble_brewing',
        },
        statuses: ['poisoned'],
      }),
    );

    expect(payload.role).toBeUndefined();
    expect(payload.statuses).toEqual([]);
  });

  it('좀버얼 공개 사망 상태는 생존 여부를 사망으로 가공한다', () => {
    const payload = toPublicPlayer(
      player({
        role: {
          id: 'zombuul',
          name: '좀버얼',
          team: 'demon',
          ability: '처음 죽으면 살아 있지만 죽은 것으로 등록됩니다.',
          edition: 'bad_moon_rising',
        },
        isAlive: true,
        statuses: ['zombuul_registers_dead'],
      }),
    );

    expect(payload.isAlive).toBe(false);
    expect(payload.statuses).toEqual([]);
  });
});
