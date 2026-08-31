import type { NightAction } from '@clocktower/shared';
import { describe, expect, it } from 'vitest';
import * as queueModule from '../nightFeedbackQueue';
import {
  createNightFeedbackCompletionGuard,
  createNightFeedbackDeliveryGuard,
  getPendingFeedbackIndex,
} from '../nightFeedbackQueue';

type ResolveActionForOccurrence = (
  actions: NightAction[] | undefined,
  roleId: string,
  targets: { id: string }[],
  currentIndex: number,
) => NightAction | undefined;

const resolveActionForOccurrence = (
  queueModule as typeof queueModule & {
    getNightActionForFeedbackTargetOccurrence?: ResolveActionForOccurrence;
  }
).getNightActionForFeedbackTargetOccurrence;

describe('getPendingFeedbackIndex', () => {
  it('같은 플레이어가 두 번 깨어난 경우에도 순번별로 미전송 대상을 찾는다', () => {
    const targets = [
      { id: 'p1', name: 'Player1' },
      { id: 'p1', name: 'Player1' },
    ];

    expect(getPendingFeedbackIndex(targets, new Set())).toBe(0);
    expect(getPendingFeedbackIndex(targets, new Set([0]))).toBe(1);
    expect(getPendingFeedbackIndex(targets, new Set([0, 1]))).toBeNull();
  });

  it('실패한 대상은 유지하고 각 대상 성공 뒤에만 진행하며 완료를 한 번만 알린다', () => {
    const targets = [{ id: 'p1' }, { id: 'p2' }];
    const sentIndices = new Set<number>();
    const deliveryGuard = createNightFeedbackDeliveryGuard();
    const completionGuard = createNightFeedbackCompletionGuard();

    const failedAttempt = deliveryGuard.tryStart() as number;
    expect(deliveryGuard.settle(failedAttempt, false)).toBe('retry');
    expect(getPendingFeedbackIndex(targets, sentIndices)).toBe(0);

    const firstSuccess = deliveryGuard.tryStart() as number;
    if (deliveryGuard.settle(firstSuccess, true) === 'advance') {
      sentIndices.add(0);
    }
    expect(getPendingFeedbackIndex(targets, sentIndices)).toBe(1);

    const secondSuccess = deliveryGuard.tryStart() as number;
    if (deliveryGuard.settle(secondSuccess, true) === 'advance') {
      sentIndices.add(1);
    }
    expect(getPendingFeedbackIndex(targets, sentIndices)).toBeNull();
    expect(completionGuard.tryComplete()).toBe(true);
    expect(completionGuard.tryComplete()).toBe(false);
  });

  it.each([
    'fortune_teller',
    'ravenkeeper',
  ])('같은 플레이어가 두 번 행동한 %s 차례는 현재 큐 발생 순번과 같은 행동을 사용한다', (roleId) => {
    expect(resolveActionForOccurrence).toBeTypeOf('function');
    const targets = [{ id: 'same' }, { id: 'other' }, { id: 'same' }];
    const firstAction: NightAction = {
      playerId: 'same',
      playerName: 'Same',
      roleId,
      targets: ['first-target'],
      fortuneTellerResult: false,
    };
    const secondAction: NightAction = {
      playerId: 'same',
      playerName: 'Same',
      roleId,
      targets: ['second-target'],
      fortuneTellerResult: true,
    };

    expect(
      (resolveActionForOccurrence as ResolveActionForOccurrence)(
        [firstAction, secondAction],
        roleId,
        targets,
        0,
      ),
    ).toBe(firstAction);
    expect(
      (resolveActionForOccurrence as ResolveActionForOccurrence)(
        [firstAction, secondAction],
        roleId,
        targets,
        2,
      ),
    ).toBe(secondAction);
    expect(
      (resolveActionForOccurrence as ResolveActionForOccurrence)(
        [firstAction],
        roleId,
        targets,
        2,
      ),
    ).toBeUndefined();
  });
});
