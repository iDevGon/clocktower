import { describe, expect, it } from 'vitest';
import { getDeviceType, getStorytellerLayoutMode } from '../responsiveMode';

describe('responsiveMode', () => {
  it('폭 1024 이상은 desktop으로 본다', () => {
    expect(getDeviceType(1024)).toBe('desktop');
    expect(getDeviceType(1366)).toBe('desktop');
  });

  it('폭 768 이상 1024 미만은 tablet으로 본다', () => {
    expect(getDeviceType(768)).toBe('tablet');
    expect(getDeviceType(1023)).toBe('tablet');
  });

  it('폭 768 미만은 phone으로 본다', () => {
    expect(getDeviceType(375)).toBe('phone');
    expect(getDeviceType(767)).toBe('phone');
  });

  it('web desktop은 PC 콘솔을 사용한다', () => {
    expect(getStorytellerLayoutMode(1280, 'web')).toBe('desktop-console');
  });

  it('native tablet과 phone은 touch grimoire를 유지한다', () => {
    expect(getStorytellerLayoutMode(1280, 'ios')).toBe('touch-grimoire');
    expect(getStorytellerLayoutMode(900, 'android')).toBe('touch-grimoire');
    expect(getStorytellerLayoutMode(390, 'web')).toBe('touch-grimoire');
  });
});
