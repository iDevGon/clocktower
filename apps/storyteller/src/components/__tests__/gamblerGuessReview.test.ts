import type { PendingGamblerGuess } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import {
  canSettleGamblerReview,
  isGamblerReviewPending,
  syncGamblerGuessDraft,
} from '../gamblerGuessReview';

const pending: PendingGamblerGuess = {
  requestId: 'request-1',
  gamblerId: 'gambler-1',
  targetPlayerId: 'target-1',
  guessedRoleId: 'gambler',
};

describe('syncGamblerGuessDraft', () => {
  it('새 요청 ID는 플레이어 제출값으로 초안을 초기화한다', () => {
    expect(
      syncGamblerGuessDraft(
        { requestId: null, targetPlayerId: null, guessedRoleId: null },
        pending,
      ),
    ).toEqual({
      requestId: pending.requestId,
      targetPlayerId: pending.targetPlayerId,
      guessedRoleId: pending.guessedRoleId,
    });
  });

  it('같은 요청 ID의 이야기꾼 편집값은 보존한다', () => {
    expect(
      syncGamblerGuessDraft(
        {
          requestId: pending.requestId,
          targetPlayerId: 'storyteller-edited-target',
          guessedRoleId: 'storyteller-edited-role',
        },
        pending,
      ),
    ).toEqual({
      requestId: pending.requestId,
      targetPlayerId: 'storyteller-edited-target',
      guessedRoleId: 'storyteller-edited-role',
    });
  });

  it('pending 요청이 사라지면 초안을 비운다', () => {
    expect(
      syncGamblerGuessDraft(
        {
          requestId: pending.requestId,
          targetPlayerId: pending.targetPlayerId,
          guessedRoleId: pending.guessedRoleId,
        },
        null,
      ),
    ).toEqual({
      requestId: null,
      targetPlayerId: null,
      guessedRoleId: null,
    });
  });
});

describe('request-keyed Gambler review guard', () => {
  it('같은 request의 중복만 차단하고 A 처리 중 새 B는 잠그지 않는다', () => {
    expect(isGamblerReviewPending('request-a', 'request-a')).toBe(true);
    expect(isGamblerReviewPending('request-a', 'request-b')).toBe(false);
  });

  it('late A callback은 현재 B를 settle할 수 없고 B callback만 허용한다', () => {
    expect(canSettleGamblerReview('request-b', 'request-b', 'request-a')).toBe(
      false,
    );
    expect(canSettleGamblerReview('request-b', 'request-b', 'request-b')).toBe(
      true,
    );
  });
});
