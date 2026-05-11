import { describe, expect, it } from 'vitest';
import { PHASE_BAR_RAIL_LAYOUT } from '../PhaseBar.presentation';

describe('phase bar presentation', () => {
  it('PC 진행 패널은 세로 레일에 맞는 큰 진행 컨트롤을 사용한다', () => {
    expect(PHASE_BAR_RAIL_LAYOUT.orientation).toBe('vertical');
    expect(PHASE_BAR_RAIL_LAYOUT.primaryActionMinHeight).toBeGreaterThanOrEqual(
      96,
    );
    expect(PHASE_BAR_RAIL_LAYOUT.phaseStepMinHeight).toBeGreaterThanOrEqual(40);
    expect(PHASE_BAR_RAIL_LAYOUT.phaseStepCount).toBe(4);
    expect(PHASE_BAR_RAIL_LAYOUT.shortcutLabel).toBe('Space');
  });

  it('이전 페이즈는 진행 버튼 위의 full-width 저강도 보조 액션으로 둔다', () => {
    expect(PHASE_BAR_RAIL_LAYOUT.secondaryActionMinHeight).toBeLessThanOrEqual(
      32,
    );
    expect(PHASE_BAR_RAIL_LAYOUT.secondaryActionWidth).toBe('full');
    expect(PHASE_BAR_RAIL_LAYOUT.secondaryActionPosition).toBe('abovePrimary');
    expect(PHASE_BAR_RAIL_LAYOUT.secondaryActionProminence).toBe('quiet');
  });
});
