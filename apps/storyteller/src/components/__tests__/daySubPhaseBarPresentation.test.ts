import { describe, expect, it } from 'vitest';
import { DAY_SUB_PHASE_CONSOLE_LAYOUT } from '../DaySubPhaseBar.presentation';

describe('day sub phase bar presentation', () => {
  it('PC 상단 서브페이즈 바는 진행 레일과 같은 밀도의 콘솔형 레이아웃을 사용한다', () => {
    expect(DAY_SUB_PHASE_CONSOLE_LAYOUT.orientation).toBe('horizontal');
    expect(DAY_SUB_PHASE_CONSOLE_LAYOUT.stepCount).toBe(3);
    expect(DAY_SUB_PHASE_CONSOLE_LAYOUT.minHeight).toBeLessThanOrEqual(64);
    expect(DAY_SUB_PHASE_CONSOLE_LAYOUT.stepMinHeight).toBeLessThanOrEqual(36);
    expect(DAY_SUB_PHASE_CONSOLE_LAYOUT.cornerRadius).toBeLessThanOrEqual(5);
  });
});
