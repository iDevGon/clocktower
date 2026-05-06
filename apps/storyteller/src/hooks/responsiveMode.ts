export type DeviceType = 'phone' | 'tablet' | 'desktop';
export type StorytellerLayoutMode = 'touch-grimoire' | 'desktop-console';
export type StorytellerPlatform =
  | 'android'
  | 'ios'
  | 'web'
  | 'windows'
  | 'macos';

export function getDeviceType(width: number): DeviceType {
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'phone';
}

export function getStorytellerLayoutMode(
  width: number,
  platform: StorytellerPlatform,
): StorytellerLayoutMode {
  return platform === 'web' && getDeviceType(width) === 'desktop'
    ? 'desktop-console'
    : 'touch-grimoire';
}
