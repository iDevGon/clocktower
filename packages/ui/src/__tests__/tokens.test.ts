import { describe, expect, it } from 'vitest';
import { colors, typography } from '../tokens';

describe('arcane design tokens', () => {
  it('빅토리아 아케인 팔레트를 제공한다', () => {
    expect(colors.arcane.surface.base).toBe('#0d0703');
    expect(colors.arcane.border.brass).toBe('#b78642');
    expect(colors.arcane.accent.prussianBlue).toBe('#2f4f8f');
    expect(colors.arcane.action.blood).toBe('#8d3529');
  });

  it('기존 surface/base 토큰은 유지한다', () => {
    expect(colors.surface.base).toBe('#121214');
  });

  it('포인트 폰트 토큰을 제공한다', () => {
    expect(typography.fontFamily.display).toBe('SchoolSafeStarrySky-Bold');
    expect(typography.fontFamily.body).toBe('IBMPlexSansKR-Regular');
  });
});
