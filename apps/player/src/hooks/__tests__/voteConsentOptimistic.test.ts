import { describe, expect, it } from 'vitest';
import { getOptimisticConsentReadyIds } from '../voteConsentOptimistic';

describe('getOptimisticConsentReadyIds', () => {
  it('준비 완료를 누르면 서버 응답 전에도 본인을 ready 목록에 추가한다', () => {
    expect(getOptimisticConsentReadyIds(['p2'], 'p1', true)).toEqual([
      'p2',
      'p1',
    ]);
  });

  it('준비 취소를 누르면 서버 응답 전에도 본인을 ready 목록에서 제거한다', () => {
    expect(getOptimisticConsentReadyIds(['p1', 'p2'], 'p1', false)).toEqual([
      'p2',
    ]);
  });

  it('이미 같은 상태면 중복을 만들지 않는다', () => {
    expect(getOptimisticConsentReadyIds(['p1', 'p2'], 'p1', true)).toEqual([
      'p1',
      'p2',
    ]);
  });
});
