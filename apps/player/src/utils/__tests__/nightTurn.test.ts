import { describe, expect, it } from 'vitest';
import { isNightWakeUpForCurrentRole } from '../nightTurn';

describe('isNightWakeUpForCurrentRole', () => {
  it('밤중 역할 변경 후 이전 wakeUp 역할이면 현재 차례로 보지 않는다', () => {
    expect(isNightWakeUpForCurrentRole('fang_gu', null, 'snake_charmer')).toBe(
      false,
    );
  });

  it('철학자는 부여받은 역할 차례를 자기 차례로 본다', () => {
    expect(
      isNightWakeUpForCurrentRole('philosopher', 'dreamer', 'dreamer'),
    ).toBe(true);
  });
});
