import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  platform: { OS: 'ios' },
  vibrate: vi.fn(),
  impactAsync: vi.fn(() => Promise.resolve()),
  notificationAsync: vi.fn(() => Promise.resolve()),
  selectionAsync: vi.fn(() => Promise.resolve()),
}));

vi.mock('react-native', () => ({
  Platform: mocks.platform,
  Vibration: { vibrate: mocks.vibrate },
}));

vi.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Heavy: 'heavy' },
  NotificationFeedbackType: {
    Error: 'error',
    Success: 'success',
    Warning: 'warning',
  },
  impactAsync: mocks.impactAsync,
  notificationAsync: mocks.notificationAsync,
  selectionAsync: mocks.selectionAsync,
}));

import { hapticAlert, hapticNotification, hapticSelection } from '../haptics';

describe('player haptics', () => {
  beforeEach(() => {
    mocks.platform.OS = 'ios';
    mocks.vibrate.mockClear();
    mocks.impactAsync.mockReset().mockResolvedValue();
    mocks.notificationAsync.mockReset().mockResolvedValue();
    mocks.selectionAsync.mockReset().mockResolvedValue();
  });

  it('iOS alert uses impact feedback instead of Vibration', () => {
    hapticAlert();

    expect(mocks.impactAsync).toHaveBeenCalledWith('heavy');
    expect(mocks.vibrate).not.toHaveBeenCalled();
  });

  it.each([
    ['error', 'error'],
    ['success', 'success'],
    ['warning', 'warning'],
  ] as const)('iOS %s notification uses native notification feedback', (kind, expected) => {
    hapticNotification(kind, [0, 300]);

    expect(mocks.notificationAsync).toHaveBeenCalledWith(expected);
    expect(mocks.vibrate).not.toHaveBeenCalled();
  });

  it('iOS selection uses native selection feedback', () => {
    hapticSelection();

    expect(mocks.selectionAsync).toHaveBeenCalledOnce();
    expect(mocks.vibrate).not.toHaveBeenCalled();
  });

  it('Android preserves the vibration pattern supplied by each caller', () => {
    mocks.platform.OS = 'android';
    const pattern = [0, 50, 50, 600];

    hapticNotification('success', pattern);

    expect(mocks.vibrate).toHaveBeenCalledWith(pattern);
    expect(mocks.notificationAsync).not.toHaveBeenCalled();
  });

  it('Android preserves selection durations', () => {
    mocks.platform.OS = 'android';

    hapticSelection(80);

    expect(mocks.vibrate).toHaveBeenCalledWith(80);
    expect(mocks.selectionAsync).not.toHaveBeenCalled();
  });

  it('does nothing on web and other platforms', () => {
    mocks.platform.OS = 'web';

    hapticAlert();
    hapticNotification('warning', [0, 200]);
    hapticSelection();

    expect(mocks.impactAsync).not.toHaveBeenCalled();
    expect(mocks.notificationAsync).not.toHaveBeenCalled();
    expect(mocks.selectionAsync).not.toHaveBeenCalled();
    expect(mocks.vibrate).not.toHaveBeenCalled();
  });

  it('swallows rejected iOS haptic promises', async () => {
    const unhandledRejection = vi.fn();
    process.on('unhandledRejection', unhandledRejection);
    mocks.notificationAsync.mockRejectedValueOnce(new Error('unavailable'));

    try {
      hapticNotification('error', [0, 300]);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(unhandledRejection).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandledRejection);
    }
  });
});
